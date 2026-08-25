---
title: "Your RAG doesn't have a retrieval problem. It has a ranking problem."
date: 2026-08-27
tag: rag
readingTime: 9
excerpt: "The document was in the index and the answer was still wrong. How to tell a retrieval failure from a ranking failure, in what order to fix them, and what each fix costs."
---

The document was in the index. The answer was still wrong.

That is the bug that eats the most days, because every instinct sends you to the wrong place. You check the prompt. You check the model. You start pricing a bigger one. Somebody suggests fine-tuning.

Then you actually look at what the retriever returned, and the correct chunk is sitting at rank 14. The model was never given it. Nothing was broken. It came back in the wrong order, and the top five got the context window.

That is not a retrieval failure. It is a ranking failure, and the two get diagnosed as the same thing — which is why teams spend sprints on the wrong half of the system.

This article is the diagnostic I wish I'd had: how to tell which failure you actually have, in what order to fix it, and what each fix costs.

---

## First: stop guessing. Measure the retriever alone.

Almost every team measures the final answer. That is the single most expensive mistake in RAG, because it makes every retrieval bug arrive disguised as a model problem — and model problems get fixed with money.

You need a golden set for **retrieval**, separate from the one for answers. It is fifty to two hundred real questions, each labelled with the chunk IDs that should come back. Building it is a boring afternoon with a domain expert, and it is the highest-leverage afternoon in the project.

Then three numbers, and they answer different questions:

| Metric | What it tells you | Use it for |
|---|---|---|
| **Recall@k** | Is the right chunk anywhere in the top k? | The retriever. Measure at your candidate depth (k=50, k=100). |
| **Recall@n** | Did it survive into what the model actually sees? | The ranker. Measure at your context depth (k=5, k=10). |
| **MRR / nDCG@k** | How high did it land, on average? | Tracking whether a reranker change actually moved order. |

The gap between those first two rows *is* your ranking problem, expressed as a number.

Recall@50 at 94% and Recall@5 at 61% means the retriever is fine and the ordering is throwing away a third of your correct answers before the model ever sees them. That is a completely different Monday than Recall@50 at 55%, which means the right chunk isn't being found at all and no reranker on earth will save you.

**Run this before anything else in this article.** Everything below is a fix for one of those two numbers, and applying the wrong one wastes a sprint.

---

## The diagnostic table

Symptom on the left, the measurement that discriminates in the middle, the likely cause on the right.

| Symptom | Measure | Likely cause |
|---|---|---|
| Right chunk at rank 10–50 | Recall@50 high, Recall@5 low | **Ranking.** Add a reranker. |
| Right chunk nowhere in top 100 | Recall@100 low | **Retrieval or chunking.** Check ANN params first, then chunk boundaries. |
| Fails only on codes, SKUs, surnames, error strings | Compare lexical-only vs vector-only recall | **Missing lexical.** Dense vectors blur rare tokens. |
| Right chunk found, answer still wrong | Recall@5 high | **Not a retrieval problem.** Now go look at the prompt. |
| Right chunk exists but is half a sentence | Read the chunk. Just read it. | **Chunking.** |
| Correct-but-stale document wins | Check date fields in payload | **Missing metadata filter.** |
| Worked in dev, degraded in prod | Compare ANN recall vs exact search on the same queries | **ANN/quantization recall loss.** See below. |

---

## The trap nobody checks: your ANN index is silently lossy

Before you touch rankers, rule this out, because it invalidates every measurement above.

Vector search is approximate by construction. HNSW walks a graph and stops when it thinks it has converged. If `ef` at search time is too low, the right chunk is dropped **before ranking is even a concept** — and nothing logs it. Your recall isn't 100% of what's in the index; it's whatever the graph traversal happened to reach.

Same for quantization. Scalar int8 or binary quantization cuts memory dramatically and costs recall, and the loss is not uniform — it hits exactly the near-neighbour cases where two documents are close and only one is right. Which is the case that matters.

The check takes ten minutes: run your golden set through ANN search, then run the same queries with exact/brute-force search over the same corpus, and compare Recall@k. If the gap is meaningful, raise `hnsw_ef`, or enable rescoring with oversampling so quantized candidates get re-scored against full-precision vectors, and re-measure.

Teams find two to twelve points of recall sitting on the floor here, for a latency cost measured in single-digit milliseconds. It is the cheapest fix in this entire article and virtually nobody runs it, because the index never reports a failure. It just quietly returns something.

---

## Lever 1 — Hybrid search

Cheapest real win, and the one skipped most often because "we already have embeddings" feels like the modern answer.

An embedding model compresses an entire chunk into a single vector before it has any idea what you are going to ask. It optimises for topical similarity. That is precisely the wrong objective when the query hinges on one rare token: an error code, a policy number, a product reference, a surname, a version string. Dense retrieval will happily hand you five documents that are *about* error codes.

BM25 is the counterweight, and it is thirty years old for a reason: term frequency with saturation, inverse document frequency so rare terms dominate, length normalisation so long documents don't win by volume. Rare exact tokens are the case it was designed for.

Fuse both. **Reciprocal Rank Fusion** is the default because it needs no score calibration between two systems whose scores are not comparable:

```
score(d) = Σ  1 / (k + rank_i(d))        k ≈ 60 by convention
         i∈retrievers
```

It only reads rank position, never raw scores — which is exactly why it is robust. A document that both retrievers rank reasonably beats a document one retriever loves and the other has never heard of. Most vector databases now ship this natively (Qdrant does it in a single Query API call with `prefetch` + `fusion`), so the integration cost is close to zero.

**When it does not help:** corpora with no rare-token vocabulary — narrative text, conversational transcripts, marketing copy. If your documents have no identifiers in them, BM25 has nothing to contribute and you'll pay latency for a tie.

---

## Lever 2 — The reranker

This is where rank 14 becomes rank 2.

The architectural distinction is the whole point. A bi-encoder — your embedding model — encodes the query and the document **separately**, into two vectors that never meet, and compares them with a dot product. That is what makes it fast enough to index millions of documents, and it is also what makes it lossy: the document was encoded before the question existed.

A cross-encoder reads query and document **together**, in one forward pass, with full attention between them. It can tell that this passage mentions your topic but answers a different question. It is a fundamentally better judgement, and it costs a forward pass per candidate — which is why you cannot run it over a corpus, and absolutely can run it over the fifty candidates you already have.

The latency arithmetic is what determines your depth. A reranker pass over N candidates is N forward passes, batched. Small rerankers do 50 candidates in tens of milliseconds on GPU; hosted rerank APIs add a network hop on top. That budget is the constraint that sets N — not a best practice.

That mattered concretely on a real-time voice system I built, where the entire speech-to-text → LLM → text-to-speech loop had to close in under two seconds. Retrieval and reranking are competing for milliseconds with the parts of the pipeline the caller can actually hear. On voice you rerank shallow and you make chunking earn its keep. In an async workflow where the user waits three seconds for a written answer, you can go far deeper. **Same technique, opposite depth, decided entirely by the latency budget.**

Rule of thumb: retrieve wide and cheap (k=50–100, hybrid), rerank narrow and expensive (top 5–10 to the model). Recall is the retriever's job; precision is the reranker's.

---

## Lever 3 — Chunking and metadata

These sit underneath everything above. Chunk badly and you spend the rest of your life reranking noise.

Three failures cause most of it:

**Chunks split mid-idea.** A fixed 512-token window with no respect for structure will cut a definition in half. Half a definition retrieves poorly and answers nothing. Split on structure first — headings, sections, list boundaries — and only fall back to fixed windows inside a section that's too long.

**Chunks stripped of context.** A paragraph that says "this does not apply to customers on legacy plans" is unusable without the heading three levels up that says which policy it belongs to. Prepend the heading path to the chunk text before embedding. It is a two-line change and it moves recall more than most model swaps.

**Chunks with no payload.** This is the underrated half. Source, tenant, document type, effective date, version — filtering on those *before* ranking removes whole categories of wrong answer for free. It is cheaper than any reranker and it never hallucinates. Most "stale answer" bugs are a missing date filter, not a model failure.

---

## Lever 4 — Query parsing

The last one, and the one worth reaching for only after the others are in place.

The user's question is not always a good search query. Three transforms pay for themselves:

- **Metadata extraction.** "What did we charge Acme in Q1?" contains a filter (`customer=Acme`, `period=Q1`) and a query. Pull the filter out and apply it as a constraint instead of hoping the embedding encodes it.
- **Decomposition.** Multi-hop questions ("how does the refund policy differ from last year's?") need two retrievals and a comparison, not one blended search that half-matches both.
- **Expansion / rewriting.** Conversational follow-ups ("and for business accounts?") are meaningless standalone. Rewrite against conversation history before searching. On voice systems this is not optional — almost every turn after the first is a fragment.

The cost: each of these adds an LLM call in front of retrieval, which is latency and a new failure surface. Worth it for a research assistant. Often not worth it for a sub-two-second voice loop, where you rewrite with the cheapest possible model or not at all.

---

## The order of operations

Doing these out of order is how sprints get burned. From cheapest and most diagnostic to most expensive:

1. **Build the retrieval golden set.** Nothing below is measurable without it.
2. **Check ANN recall against exact search.** Ten minutes. Rules out a silently lossy index.
3. **Read twenty chunks with your own eyes.** You will find something structural. Everyone does.
4. **Add metadata filtering.** Free precision, no model involved.
5. **Add hybrid search.** Cheap, large gain on any corpus with identifiers.
6. **Add a reranker.** The big lever, priced in milliseconds — set depth by budget.
7. **Then, and only then, query parsing.** Most complexity, most new failure modes.

Notice the model is not on this list. It usually isn't the answer, and it is always the most expensive place to look first.

---

## The smaller question

Before you swap the model, ask: **what rank did the right chunk come back at?**

If you cannot answer that, you are not debugging. You are guessing with extra steps.

And if you can answer it, you already know which of the four levers you need — which was the whole point of measuring.

---
