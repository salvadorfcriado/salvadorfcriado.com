A 95% reliable step is a good result. Twenty of them in a row is a coin flip you lose.

```
95% per step, 5 steps   →  77%
95% per step, 10 steps  →  60%
95% per step, 20 steps  →  36%
97% per step, 20 steps  →  54%
```

Reliability doesn't average across a pipeline. It multiplies. That single fact explains most of the distance between an agent demo and an agent in production, and no amount of model upgrade fixes it, because the exponent grows faster than the base.

METR's published data makes the same point from the other end. Every frontier model has two time horizons: the task length it completes half the time, and the length it completes 80% of the time. For Claude Opus 4.6 that's 12 hours and 1.2 hours. The first number is the one that gets screenshotted. The second is the one you'd have to underwrite if you sold this to a bank.

The cheapest reliability work available to most teams isn't a better model. It's fewer steps, gates between the ones that remain, and an honest answer to "does this step need an LLM, or did we put one there because we could?"

Five steps at 95% beats twenty steps at 97%. Do that multiplication before your roadmap does it for you.

#AgenticAI #LLMOps #ProductionAI
