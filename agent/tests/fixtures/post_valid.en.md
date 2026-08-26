We deleted the second model call and p95 latency fell by 41%.

The first call classified the question. The second answered it. Both went to the same 70B model, on the same hardware, because the classifier had been written on a Friday and nobody revisited it.

A classifier is a decision between 6 labels. It reads at most two sentences. That work does not need a frontier model, it needs a small one, and for a while it did not need a model at all: a lookup on the calling product plus a regex over the subject line got 94% of the traffic right.

Here is the part worth stealing. Before you optimise a chain, print the per-step cost and the per-step latency next to the accuracy that step actually contributes. Three columns, one row per step. Most chains have a row where the accuracy column is blank, and that row is usually the oldest one.

Ours cost 340 milliseconds and 60% of the bill for a decision a lookup table already knew.

Two rules came out of that afternoon and both have held for a year. Any step that cannot name the accuracy it adds gets removed and measured by its absence. Any step whose input is shorter than a paragraph gets a small model until somebody proves it needs a large one.

Neither rule is clever. Both survive contact with a roadmap, which is more than can be said for the architecture diagram they replaced.

The chain that is cheap to run is the chain you can afford to evaluate nightly, and the one you evaluate nightly is the only one you know is still working.

#LLMOps #Latency #CostEngineering
