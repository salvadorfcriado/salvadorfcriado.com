Nobody's RAG system breaks. It quietly stops being right.

No error. No alert. No red dashboard. It answers in 400 milliseconds with total confidence — from a snapshot of the world that is four months old, because the last index rebuild was a script someone ran from a laptop before a demo.

That is the standard shape of it. The LLM half gets treated like an application: versioned, deployed, monitored, on call. The data half gets treated like a chore. And the data half is the one that decides whether the answers are true.

Write down what has to happen on a schedule and it gets uncomfortable fast. Re-ingest when source documents change. Re-embed the whole corpus when you upgrade the embedding model, because old vectors and new vectors do not live in the same space. Run the eval set often enough that a regression is caught by a job instead of by a customer. Do something visible with the twelve PDFs that failed to parse, instead of skipping them in silence.

Retries. Dependencies. Backfills. Idempotency. Things that fail loudly.

None of that is new. That is a data pipeline, and data engineering has had boring vocabulary for it for a decade. Re-embedding after a model upgrade is a backfill. The nightly eval is a scheduled DAG. The unparseable PDF is a task that fails instead of a row that vanishes.

It is why I have been going deeper here — Airflow on Kubernetes, GenAI-shaped DAGs for the reindex, the re-embed, the scheduled eval — instead of another framework on the application side.

The model is the part that gets the demo. The scheduler is the part that decides whether the demo is still telling the truth in six months.

I put the full pipeline breakdown in the comments.

#DataEngineering #Airflow #LLMOps
