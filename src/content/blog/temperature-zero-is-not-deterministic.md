---
title: "Temperature Zero Is Not Deterministic"
date: 2026-09-03
tags: [llm-serving, evaluation, governance]
readingTime: 11
excerpt: "Same prompt, same model, different answer. The mechanism behind non-determinism at temperature zero, the arithmetic that kills agent pilots, and what to do about it."
---

**Same prompt, same model, different answer. The mechanism behind it, the arithmetic that kills agent pilots, and why Brussels just handed you sixteen extra months you're going to waste.**

---

I once spent two days on a bug report I couldn't reproduce.

Same prompt. Same model version. Temperature zero. The output on Tuesday morning was not the output from Monday night, and nothing in our code had changed between them.

I did the obvious things. Looked for a timestamp leaking into the prompt. Checked whether the retrieval layer had reindexed. Ran it fifty times locally, got fifty identical answers, felt vindicated for about an hour, then watched it drift again in production.

I never established the root cause. What I did establish was that I couldn't reproduce yesterday's answer, and that turned out to be the disqualifying fact all by itself. We were about to put that thing in front of customers.

### Check the boring causes first

If you're chasing this right now, the answer is almost certainly mundane, and you should exhaust the mundane list before anyone says the word "kernel."

Your provider silently rolled the model behind the alias you thought you'd pinned. Your retrieval index changed shape under you. Temperature is zero but `top_p` and the seed are sitting at defaults. A prompt template got edited by someone who didn't think it counted as code. On mixture-of-experts models, routing can differ across replicas.

Nine times out of ten it's one of those, and all of them are fixable with ordinary engineering discipline.

The interesting part is what's left after you've fixed all of them. Because the floor is not zero.

### The floor

Greedy sampling should be deterministic. Take the highest-probability token, every time. No dice involved.

Horace He and colleagues at Thinking Machines Lab published the mechanism in September 2025, and it's the cleanest write-up I know of. GPU kernels split their work differently depending on how many requests are batched together in that forward pass. Floating-point addition is not associative. At the bit level, (a+b)+c is not always a+(b+c). Change the batch size, change the reduction order, change the last decimal places, and occasionally that's enough to flip which token wins.

The trigger is server load. Your request didn't change. The traffic around it did.

Their numbers are worth quoting because they're better than the argument. Running the same prompt 1,000 times at temperature zero against Qwen3-235B on stock vLLM produced **80 unique completions**. All 1,000 were identical for the first 102 tokens, then diverged. With batch-invariant kernels, the same experiment produced 1,000 identical outputs.

Determinism was recoverable. It just cost something: on a Qwen3-8B throughput benchmark, 26 seconds became 55 with a naive implementation and 42 after tuning the attention kernel. Call it 1.6x for reproducibility you can prove.

Most teams are making that trade right now. None of them know they're making it.

### Predictable is not the same as deterministic

This distinction is where the vocabulary starts earning money, and it's where vendors are already getting slippery.

Determinism is a property of the mechanics. Same input, same output, bit for bit. It's what you need for audits and for keeping training and inference honest with each other, and as we just saw, it has a price tag.

Predictability is the question a buyer actually asks: will this behave in October the way it behaved in the pilot, and can I know that before I sign?

Those come apart in both directions. A system can be perfectly deterministic and completely unpredictable, failing the same catastrophic way every time on an input nobody tested. And a system can wobble at the token level while being entirely predictable where it counts: always valid JSON, never a price outside the catalog, escalates when it isn't sure, p95 latency where it was last month.

Also worth scoping honestly, because the counterargument is fair. If your output is prose that a human reads once, two different good answers are both good answers and none of this applies. If your output lands in a ledger, a claim, a medical record or a compliance file, all of it applies.

### The arithmetic that kills pilots

IDC's 2025 research found that 88% of AI proofs of concept never reach widescale deployment. Gartner separately predicts that over 40% of agentic AI projects will be canceled by the end of 2027.

The reflex explanation is that the models weren't good enough. That one doesn't survive contact with the last eighteen months: the models got dramatically better and the ratio barely moved.

The real culprit is multiplication.

```
Chain n steps, each succeeding with probability p.
The pipeline succeeds with probability p^n. Not the average. The product.

  95% per step, 5 steps   →  77%
  95% per step, 10 steps  →  60%
  95% per step, 20 steps  →  36%
  97% per step, 20 steps  →  54%
```

A 95% reliable step is a genuinely good result. Twenty of them in a row is a coin flip you lose.

Read the last two rows together, because that is the whole design lesson: **five steps at 95% beats twenty steps at 97%.** Two percentage points of per-step reliability is a hard research problem. Removing fifteen steps is an afternoon with a whiteboard. The exponent is the cheaper variable and nobody treats it as a variable at all.

Yes, this is a pessimistic bound. Retries and validation gates buy some of it back, and failures aren't perfectly independent. That's not a rebuttal, it's the argument: put gates between the steps instead of adding more steps.

METR's time-horizon work shows the same shape from the other side. Their published data, updated in May 2026, gives each frontier model two numbers: the task length it completes 50% of the time, and the length it completes 80% of the time. For Claude Opus 4.6 those are **12 hours and 1.2 hours**. For GPT-5.3 Codex, 5.8 hours and 0.9. Across the frontier, the 80% horizon runs four to ten times shorter than the 50% horizon.

Sit with that gap. The headline number is the one that gets screenshotted. The other one is the number you'd have to underwrite if you sold this to a bank.

Nobody's model is broken. The chain length is doing the damage.

### The deadline moved, which is worse

On 27 July 2026, the EU changed the timetable.

Regulation (EU) 2026/1744, the Digital Omnibus on AI, entered into force that day and pushed the standalone high-risk obligations from 2 August 2026 out to 2 December 2027. Annex I embedded systems go to August 2028. What did land in August is the Article 50 transparency regime, and the GPAI and prohibited-practice rules were already live.

If you read that as a reprieve, read it again.

What's coming for high-risk systems hasn't changed, only when. Article 12 requires automatic logging over the system's lifetime, at a resolution that makes behavior traceable after the fact. Providers keep the technical documentation for ten years under Article 18. Providers and deployers retain logs for at least six months under Articles 19 and 26(6). Penalties for these run to €15 million or 3% of worldwide annual turnover, whichever is higher.

None of that is exotic for anyone who has run regulated infrastructure. US banking supervisors have required essentially the same discipline since SR 11-7 in 2011: a model you can't re-run is a model you can't validate.

Here's the part that should bother you. **You cannot produce that record retroactively.** The evidence has to be generated at request time, by a system that was built to generate it. Sixteen months sounds generous, and the industry will spend fifteen of them not building the logging layer.

### What the logging layer actually is

For most teams, running on a managed API, mechanical determinism isn't even on the table. You can't ship batch-invariant kernels to someone else's cluster. Reproducibility becomes **evidentiary** rather than bitwise: you cannot promise the same bytes, but you can promise a complete account of what produced them.

That's an infrastructure problem with a well-understood shape. Concretely, every inference gets a record with these fields:

```
request_id            stable, propagated across the whole chain
timestamp_utc
model_id              the SNAPSHOT id, never the alias
model_id_resolved     what the provider actually served — log both, they differ
prompt_template_id    + version/commit hash
prompt_rendered_hash  hash of the final assembled prompt
retrieval_index_id    + version of the index that answered
retrieved_chunk_ids   which chunks, at which ranks
tool_schema_hash      tool definitions change and nobody versions them
sampling_params       temperature, top_p, top_k, seed, max_tokens — all of them
output_raw            before any parsing or cleanup
output_validated      after schema enforcement, plus pass/fail
guardrail_verdicts    each guardrail, each outcome
latency_ms            per stage, not just total
cost_tokens           in/out
```

Two fields there carry most of the weight and are the two most often missing. **`model_id_resolved`** is how you prove a provider rolled the model under you — without it, that failure is unfalsifiable and you will lose the argument. **`retrieval_index_id`** is how you distinguish "the model changed" from "the knowledge changed", which is otherwise a week of work every time.

And then the piece that turns a log into evidence: a **replay harness**. A single command that takes one `request_id` and reconstructs the exact request — same prompt, same retrieved context, same tool schemas, same sampling parameters — against the pinned snapshot model. If you can't run that, you have logs. You don't have reproducibility, and under Article 12 you probably don't have compliance either.

That's not AI work. That's the boring build-reproducibility discipline the software industry already learned once, applied to a new artifact.

### The counterfeit version

"Predictable AI" is now a product category, and the common move is to demote the model until it can't surprise you. Pega's version is the honest end of it: use AI reasoning at design time with a human reviewing the output, then have the runtime agent do a lightweight intent match and follow the authored workflow step by step.

That's a legitimate architecture, and for a lot of mission-critical processes it's the right one. Just be clear about what you bought. If the value you needed was adaptive behavior on inputs nobody anticipated, you didn't make your AI predictable. You narrowed it until the question stopped being interesting.

The engineering worth doing is in the middle: model still in the loop, and you can still make promises about it.

### Four levers, in order of payback

**Move variance out of the sampler.** Constrained decoding is the biggest available win and it's now boring infrastructure. The sampler is physically blocked from emitting a token that violates your schema, so malformed output stops being statistically unlikely and becomes structurally impossible. XGrammar and its equivalents are standard across vLLM, SGLang and TensorRT-LLM, with mask-generation overhead in the tens of microseconds. OpenAI and Anthropic both document schema guarantees now; Gemini enforces and tells you to validate anyway. If you're still regexing JSON out of prose behind a retry loop, you are manufacturing your own unpredictability and then paying to clean it up.

**Constrain the envelope, not the output.** Stop trying to make the model say the same words. Write down what must always be true. It cites a real source. It never quotes a price outside the catalog. It refuses anything out of scope. Enforce those outside the model, then measure the envelope with a golden set: fixed real inputs, known-good outputs, run on every prompt change before merge. "Looks better to me" is not a release criterion. It's how regressions ship.

**Shrink the horizon.** Reliability compounds multiplicatively, so the cheapest improvement available is usually fewer steps. Deterministic orchestration between model calls. Checkpoints you can resume from. And a blunt question at every hop: does this step need a language model, or did we put one there because we could?

**Budget for the uncertainty you can't remove.** Some fraction of inputs will always be past the model's competence, and the design question is what happens to those. Confidence thresholds that route to a human instead of guessing. A trace per step, so a failure is diagnosable without re-running the incident. Escalation as a designed path rather than an exception handler.

I'm building a side project that turns invoices into accounting entries, and that last lever is most of the product. Reading a receipt is solved. Knowing when the machine shouldn't trust itself is the whole engineering problem, because in bookkeeping a wrong entry is worse than no entry. Someone has to find it before it poisons a quarterly close.

### Six things you can do this month

None of these need a budget approval, and all of them are cheaper than the incident they prevent.

1. **Pin snapshot model IDs everywhere**, and log what the provider actually resolved. One afternoon. Eliminates the most common cause of "it changed and we don't know why."
2. **Count the steps in your longest agentic path**, raise it to the power of your honest per-step reliability, and put that number in front of whoever owns the roadmap. It is usually the most persuasive slide in the deck.
3. **Turn on constrained decoding** for anything producing structured output, and delete the retry loop it makes redundant.
4. **Build a fifty-item golden set** and wire it into CI as a merge gate. An afternoon with a domain expert.
5. **Write the replay harness** — one command, one request ID, reconstructed request. You will discover within an hour which fields you weren't logging.
6. **Define one escalation path** for low-confidence inputs, and measure how often it fires. If it never fires, your thresholds are decorative.

### What changes when you think this way

The question stops being which model is smartest and becomes how narrow the distribution of things this system can do actually is.

That's uncomfortable, because narrowing it means giving back some of what made the demo land. Constrained output is less expressive. Fewer steps means less autonomy. Escalation thresholds mean a lower automation rate on the slide.

You trade ceiling for floor. Nobody puts the floor in a keynote.

But the floor is what an enterprise is buying. A system that's brilliant 80% of the time and unaccountable the rest is a liability with good PR. A system that's competent 95% of the time, honest about the other 5%, and reconstructible when someone asks: that one gets deployed.

Capability was the research problem. Bounding it is the engineering one, and it's the half nobody funded.

---

If you've chased an irreproducible LLM output: what did it actually turn out to be? A provider that rolled the model under a pinned alias, your own retrieval layer changing shape, sampling params that weren't what you thought, or something genuinely stranger?

I'd like a collection of these. The failure modes are more useful than the theory.

#LLMOps #AIGovernance #EUAIAct

---
