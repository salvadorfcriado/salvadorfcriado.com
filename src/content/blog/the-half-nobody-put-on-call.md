---
title: "The half of your GenAI system nobody put on call"
date: 2026-09-10
tags: [llmops, data-engineering, rag]
readingTime: 8
excerpt: "Nobody's RAG system breaks — it quietly stops being right. The data jobs nobody wrote down, the three mechanisms that make them safe, and what to put on a dashboard."
---

Nobody's RAG system breaks. It quietly stops being right.

There is no error. No alert. No red dashboard. The service answers every request in 400 milliseconds with total confidence, and somewhere along the way it started answering from a snapshot of the world that is four months old — because the last time anyone rebuilt the index, it was a script someone ran from a laptop while the demo was being prepared.

That is the standard shape of it. The LLM half gets treated like an application: versioned, deployed, monitored, on call. The data half gets treated like a chore. And the data half is the one that decides whether the answers are true.

This article is the other half: the jobs nobody wrote down, the three mechanisms that make them safe to run, and what to put on a dashboard so staleness stops being invisible.

---

## Staleness is a silent failure class

Every other failure in your stack announces itself. This one doesn't, and that is the entire problem. Here is the taxonomy, with how each one actually surfaces:

| Failure | How it looks to the user | How you'd catch it |
|---|---|---|
| Source changed, index didn't | Confident answer from a superseded document | Age of newest indexed doc vs age of newest source doc |
| Document deleted, vector remains | Cites a policy that no longer exists | Count in index vs count at source |
| Embedding model upgraded, corpus half re-embedded | Erratic quality, some queries fine, some terrible | Vector count per model version |
| Parse failure skipped in silence | "I don't have information about that" — for a document you *know* you indexed | Parse failure rate, as a first-class metric |
| Chunking config changed, old chunks kept | Duplicate near-identical results, inconsistent answers | Chunk count vs expected for corpus size |
| Superseded doc never removed | Old and new version compete; sometimes old wins | Documents without an `effective_date` filter |

Notice that none of these throw. Every single one returns a 200 in 400 milliseconds. That is why the fix is not error handling — it's scheduling and measurement.

---

## The jobs nobody wrote down

Write down what actually has to happen on a schedule and the picture gets uncomfortable fast.

**Re-ingestion.** Source documents change. Somebody edits the policy, retires the product, uploads a new price list. If the index only learns about it when a human remembers, the index is a rumour.

**Re-embedding.** You upgrade the embedding model and every vector already stored is now measured on a different scale. Old vectors and new vectors do not live in the same space, and mixing them is worse than either alone — similarity between them is meaningless, not merely degraded. This is a full-corpus rebuild. It is the single most expensive scheduled job in the system, which is exactly why it gets postponed until results are bad enough to force it.

**Scheduled evaluation.** A golden set is worth exactly what its cadence is worth. Run it nightly and a regression is caught by a job. Run it when someone remembers and a regression is caught by a customer.

**Visible parse failures.** Twelve PDFs failed to extract. If that is a warning in a log nobody reads, your index shrinks a few percent a quarter and every gap shows up later as a confident wrong answer about a document you believe you indexed.

**Retention and supersession.** Documents that were replaced but never removed keep competing with the ones that replaced them. Sometimes they win.

Retries. Dependencies. Backfills. Idempotency. Things that fail loudly.

---

## None of this is new

That is a data pipeline. Data engineering has had boring, unglamorous vocabulary for it for over a decade, and the translation is exact:

| GenAI phrasing | What data engineering already calls it |
|---|---|
| "We need to re-embed everything after the model upgrade" | A **backfill** |
| "Someone should check quality regularly" | A **scheduled DAG with a quality gate** |
| "That PDF didn't import" | A **task that fails**, not a row that vanishes |
| "Only process what changed" | **Incremental processing with a watermark** |
| "Running the reindex twice broke it" | You have no **idempotency** |
| "The index rebuild ran while the API was querying" | You need **atomic promotion** |

The GenAI ecosystem keeps minting new nouns for these. The orchestration problem was solved a long time ago by people who were not talking about AI.

---

## Three mechanisms that make the jobs safe

Scheduling the jobs isn't enough. Run them naively and you'll cause the outage you were trying to prevent. Three patterns do most of the work.

### 1. Content-hash IDs make re-ingestion idempotent

The most common ingestion bug: a job re-runs, and now the corpus has every chunk twice. Retrieval quality collapses, because your top-5 is three copies of the same passage.

The fix is to make the chunk's identity **derive from its content**, not from insertion order. Hash the source document ID plus the chunk index plus the chunk text, and deterministically turn that hash into the vector store's ID type (Qdrant, for example, takes unsigned integers or UUIDs — so a UUIDv5 over the hash, not the raw hex string, which is the kind of detail that costs an afternoon).

Now every write is an upsert. Re-running the job on unchanged content is a no-op. Re-running it on changed content overwrites in place. A retry is safe, a backfill is safe, and a partially-failed run can simply be run again — which is what makes the whole pipeline restartable instead of something a human has to reason about at 2am.

### 2. Blue/green collections make re-embedding safe

You cannot re-embed in place. Halfway through, your index contains two incompatible vector spaces and every query is a coin flip.

Build into a **new collection** and swap an alias:

```
1. Create collection  docs_v7  (new embedding model)
2. Embed the full corpus into docs_v7 — hours, and the API never notices
3. Run the retrieval golden set against docs_v7
4. Gate: Recall@5 must not regress vs the live collection
5. Atomically repoint the alias  docs → docs_v7
6. Keep docs_v6 for one cycle. That is your rollback.
```

The application only ever queries the alias, so it never knows a rebuild happened. Step 4 is the one people skip and the one that matters: it is the difference between a deployment and a hope. Step 6 is what turns a bad embedding upgrade from an incident into a one-line revert.

This is blue/green deployment. It has been standard practice for application servers for fifteen years. The vector index is just another stateful thing you are replacing, and it deserves the same discipline.

### 3. Evaluation as a gate, not a report

A nightly eval that emails a number to a channel nobody reads is theatre.

Make it a task that **fails**. Recall@5 below threshold, the DAG goes red, and the alias does not move. Now your quality metric has authority over the deploy, which is the only thing that separates measurement from decoration.

The same gate belongs on the ingestion path: parse failure rate above a threshold fails the run rather than silently shrinking the corpus. A pipeline that loses 3% of documents per quarter without complaining is not a pipeline. It is a leak with a schedule.

---

## What the DAG actually looks like

Nothing exotic. That's the point.

- **Sensor or event trigger** on the source — object storage notification, CDC feed, or a plain scheduled poll with a watermark so you only pick up what changed since the last successful run.
- **Dynamic task mapping** to fan out parsing and embedding per document, so one poisoned file fails one task instead of the run.
- **A pool** capping concurrent embedding tasks, because the GPU is the scarce resource and unbounded parallelism just means OOM instead of throughput.
- **Deferrable operators** for the long waits, so a six-hour embed isn't holding a worker slot hostage.
- **Asset/dataset-driven triggering** so the eval DAG runs *because* the index was rebuilt, not because a cron guessed it would be done by then.
- **Retries with backoff** on anything touching an external API, and **no retries** on a genuinely malformed document — that one should stay red until a human looks at it.

Every one of those is an Airflow primitive that predates the current AI cycle by years.

---

## The dashboard

If you take one thing from this article, take this list. Six numbers, and staleness stops being invisible:

1. **Index age** — hours since the newest document entered the index. The single most useful number in the system.
2. **Source-to-index delta** — document count at source minus document count indexed. Should be near zero and isn't.
3. **Parse failure rate** — per run, with the filenames. Not a log line. A metric.
4. **Recall@5 on the golden set** — as a time series, so you see erosion instead of discovering a cliff.
5. **Embedding model version distribution** — how many vectors were produced by which model. Anything other than 100% on one version means an interrupted migration.
6. **Time since last full re-embed** — the number that tells you how overdue the expensive job is.

Put these next to your latency and token dashboards. The fact that they usually live in a different tool, owned by a different team, is most of why this problem exists.

---

## Where this comes from

To be precise about what I'm claiming: the pain above is from real work — stale indexes, evals run by hand, documents that quietly failed to parse. The Airflow layer is where I've been putting the answer, and that part is a self-hosted environment on Kubernetes plus deliberate study this year, not a client production deployment.

I'm saying that plainly because the alternative is the thing I dislike most in this field: people describing an architecture they have read about as though they have operated it. What I can vouch for is the shape of the problem, and that the vocabulary for solving it is older and more boring than the discipline currently reaching for it.

The longer I work on this, the more the hard part looks like data engineering wearing new nouns. Which is good news — that field is mature, and the patterns transfer intact.

---

## The question

The model is the part that gets the demo. The scheduler is the part that decides whether the demo is still telling the truth in six months.

So: when was your vector index last rebuilt? If the honest answer is "whenever someone last ran the script", you don't have a GenAI system in production. You have a GenAI demo that has been running for a while.

---
