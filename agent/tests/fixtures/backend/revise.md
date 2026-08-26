---
title: "The latency your users feel is not the one on your dashboard"
date: 2026-09-17
tags: [llm-serving, evaluation, llmops]
readingTime: 7
excerpt: "A streaming endpoint has three latencies and most dashboards graph the wrong one. Five symptoms, the check for each, and the order to fix them in."
---

The dashboard said the p99 request duration was 4.1 seconds. The support ticket said the assistant felt frozen. Both were accurate, and neither was useful, because a streaming endpoint does not have a latency. It has three, and the one on the dashboard was the sum of the other two multiplied by however many tokens the answer happened to need.

This is the arithmetic of serving a model behind a streaming API: the three latencies a request actually has, the five symptoms that arrive as one complaint, the order to attack them in, and the load-testing mistake that invalidates everything downstream of it.

---

## A streaming endpoint has three latencies

Split every request into the parts a user can feel.

**Time to first token.** From the request arriving to the first character appearing. It covers queue wait plus prefill: the forward pass over every token of the prompt. This is the number the user experiences as responsiveness, and it is the only one that is felt before anything appears on screen.

**Inter-token latency.** The gap between successive tokens once generation starts. It is felt as reading speed. Decode is memory-bandwidth bound rather than compute bound, so this number degrades with the number of sequences the server is decoding at once, not with how hard any one of them is.

**Total duration.** The two above, plus the length of the answer. Which is a property of the answer, not of your service.

That last point is where most dashboards go wrong. A p99 over total duration on mixed traffic measures your traffic mix. Ship a prompt change that makes answers longer and the graph gets worse while the server does exactly what it did yesterday. Ship a change that truncates answers and the graph improves while quality drops.

The rule: never graph request duration for a streaming endpoint without graphing output tokens beside it, bucketed the same way. If you keep one metric per request, keep time to first token. It is the only one whose meaning does not depend on how much the model decided to say.

---

## Five symptoms that arrive as one complaint

"It's slow" is five different bugs with five different checks.

| What the user reports | What it usually is | The check that separates it |
|---|---|---|
| Long pause before anything appears | Queue wait, or a prompt long enough that prefill dominates | Time to first token, split by input-token bucket |
| Types fine alone, crawls under load | Batch occupancy too high; decode is bandwidth bound | Inter-token latency plotted against concurrent sequences |
| Fast for one team, slow for another | Head-of-line blocking behind long generations | Queue wait measured at arrival, not at completion |
| Got slow the day the prompt changed | Prefix cache invalidated by an edit near the start of the prompt | Prefix cache hit rate, before and after the change |
| Randomly stalls mid-answer | Preemption: the cache filled and a running sequence was evicted | Preempted-request and eviction counters |

None of these is visible in a duration percentile. All five are visible in about an hour of instrumentation, and the instrumentation is the same work regardless of which one you have.

---

## Where the queue actually is

Before the mechanism, the check: graph key-value cache occupancy against admitted requests, and put the preemption counter next to it. If occupancy is the thing that saturates before utilisation does, everything below explains why, and the config change that follows is an admission limit rather than a purchase.

Continuous batching changed the shape of the queue and most mental models did not follow. Requests join and leave the running batch between decode steps rather than waiting for a batch to fill and drain. The scheduler admits a new request when there is key-value cache space to hold its context, which means the real admission limit is memory, not a batch-size constant somebody set in a config file.

Two consequences that surprise people:

**GPU utilisation is not a capacity signal.** A server at 96% utilisation can be sitting in memory-bandwidth-bound decode steps with cache to spare and room for more concurrent requests. Utilisation says the device is busy. It does not say it is full.

**Reserving by maximum output length wastes the thing that limits you.** On servers that allocate cache by the requested maximum, a client that asks for a very large ceiling and generates a short answer holds space nobody uses. One badly configured client can halve the concurrency of a whole node. Check the distribution of requested ceilings across your callers before you conclude you need another replica.

**The scheduler's fairness is not the fairness you promised.** Admission order is arrival order, but a long-context request holds its cache for the whole of a long generation, so a queue that looks fair over a minute can be badly unfair over any ten seconds inside it. If two classes of traffic share a node and one of them is interactive, measure the interactive class on its own. An aggregate percentile over both classes will look healthy while the interactive one is unusable, because the class that matters is the smaller half of the population and percentiles do not care.

---

## The decision rule

Attribute time to first token into queue wait and prefill compute. Everything follows from that split:

- **Queue wait dominates.** You have an admission problem. More replicas, or a cap on concurrent long-context requests, or both. A bigger GPU does not help a request that is waiting.
- **Prefill compute dominates and prompts are long and repetitive.** Prefix caching. The shared prefix of a system prompt is paid once instead of once per request, and the win scales with how much of the prompt is shared.
- **Prefill compute dominates and prompts are short.** You are at the model's floor. The fix is a smaller model or fewer prompt tokens, and no serving flag will produce it.
- **Inter-token latency degrades with load and first-token latency does not.** Batch occupancy. Lower the concurrency ceiling until reading speed is acceptable, then add replicas to recover throughput.

If queue wait is a few tens of milliseconds, stop. It is not your problem and there is no scheduler bug worth finding at that scale.

---

## Order of operations

Doing the right things in the wrong order is how a week disappears.

1. **Split the metric.** Time to first token, inter-token latency, output tokens. Nothing else can be attributed until this exists.
2. **Attribute first-token latency** into queue wait and prefill. One counter each.
3. **Fix admission before you fix the model.** Capacity and concurrency limits are configuration; quantisation and model swaps are experiments with quality consequences.
4. **Prefix caching before quantisation.** It costs no accuracy, and its size is a number you can compute before you build it: the win scales with the share of the prompt that is a fixed prefix. If most of the prompt is a stable system block, caching it moves first-token latency further than a smaller model would. If the shared fraction is small, the win is negligible and the model swap is the larger lever.
5. **Only then change the model.** Smaller, quantised, or distilled, each with an eval run beside it, because every one of them trades quality for latency and you need to know what the trade was.

---

## The trap nobody checks

Your load generator sends a fixed set of prompts and accepts whatever output length comes back. Production sends a long tail: most answers short, a few enormous. Those two workloads produce different batch occupancy, different cache pressure and different preemption rates, and the load test is the one that says everything is fine.

The check costs twenty minutes. Plot output tokens per request for production and for the load test on the same axes. If the tails do not match, every capacity conclusion you have drawn from that load test is about a system you do not run.

The same holds for input length. A test that sends uniformly short prompts never exercises prefill at all, which is exactly where the pause the users complained about was hiding.

There is a cheaper version of the same check if you have no load-test harness worth fixing. Take an hour of production request logs, sort by output tokens, and look at the top percent. If those requests are an order of magnitude longer than the median, your capacity is set by them and by nothing else, and the average request tells you nothing about how many concurrent users the node holds. That is a five-minute query against data you already store, and it settles arguments that otherwise run for a week.

---

## Where this stops applying

Three honest limits.

**If you call a hosted API, most of these knobs are not yours.** Batch occupancy, cache policy and admission belong to the provider. What remains is prompt length, requested output ceiling, concurrency and retry behaviour, and the three-latency split still tells you which of those to change.

**None of this rescues a model that is too slow for the product.** If the interaction needs a first token faster than a single prefill of your prompt costs on your hardware, the answer is a shorter prompt or a smaller model. Serving configuration cannot buy that back.

**Streaming hides latency; it does not remove it.** For a client that cannot stream — a batch job, or a tool call inside an agent loop where the next step needs the whole answer — only total duration matters, and every argument above about output length being the dominant term applies at full force.

Before you price a bigger GPU, produce two plots: first-token latency against input length, and inter-token latency against concurrency. If both are flat, the serving layer is not what is slow.
