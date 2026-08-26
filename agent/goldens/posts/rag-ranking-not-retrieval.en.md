Rank 14.

That is where the correct chunk was sitting. The document had been in the index the whole time. The model was never given it, because the top five got the context window — and nothing was broken.

That is not a retrieval failure. It is a ranking failure, and the two get diagnosed as the same thing. Which is why the bug eats days. You check the prompt. You check the model. You start pricing a bigger one. Somebody suggests fine-tuning.

Here is why it happens. An embedding model compresses an entire chunk into a single vector before it has any idea what you are going to ask. It optimises for similarity, not for usefulness. Fast, cheap, and lossy in exactly the way that matters when two documents are about the same topic and only one of them answers the question.

The lever that changed this most for me is a reranker. A cross-encoder reads the query and the document together, instead of comparing two vectors that never met. Far too expensive to run across a corpus. Perfectly affordable across the fifty candidates you already retrieved. That is where rank 14 becomes rank 2.

Before you swap the model, ask a smaller question: what rank did the right chunk come back at? If you cannot answer that, you are not debugging. You are guessing with extra steps.

Hybrid search, chunking and evaluating retrieval on its own are the other three levers. I wrote all four up properly — link in the comments.

#RAG #VectorSearch #InformationRetrieval
