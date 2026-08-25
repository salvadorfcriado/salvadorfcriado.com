/* ── Blog taxonomy — the single source of truth ──────────────────────────────
   The content schema derives its enum from TAG_SLUGS below, so a tag that is not
   listed here fails the build instead of silently producing an orphan archive.

   A post declares 1–3 tags. The FIRST one is primary: it is what the cover
   renders, what the OG card prints, and what leads the RSS category list. Order
   carries meaning — choose it, don't alphabetise it.

   ── Reserve vocabulary ──────────────────────────────────────────────────────
   Deliberately NOT in the enum. Promote one by moving it into TAGS with a label
   and a blurb, at the moment a post that needs it is being written — never in
   advance. Thirty tags across eight posts gives every archive one entry and a
   filter row longer than the post list.

     agents · voice-multimodal · embeddings · vector-databases · fine-tuning
     prompt-engineering · quantization · architecture · cloud-platform
     kubernetes · distributed-systems · ai-coding · cost-performance

   Renaming an ACTIVE slug breaks its archive URL. If it has to happen, it needs
   a redirect rule on the zone — see docs/infrastructure.md.
   ────────────────────────────────────────────────────────────────────────── */

export interface Tag {
  /** kebab-case, used in URLs, RSS categories and llms.txt */
  slug: string;
  /** what a reader sees, everywhere */
  label: string;
  /** one sentence — the archive page's intro and its meta description */
  blurb: string;
}

export const TAGS = [
  {
    slug: 'rag',
    label: 'RAG',
    blurb:
      'Retrieval-augmented generation in production: what actually decides whether the model gets the right context, and what it costs to fix.',
  },
  {
    slug: 'search-retrieval',
    label: 'Search & Retrieval',
    blurb:
      'Recall, ranking and rerankers — telling a retrieval failure from a ranking failure, and the order to attack them in.',
  },
  {
    slug: 'evaluation',
    label: 'Evaluation & Monitoring',
    blurb:
      'Measuring an LLM system instead of arguing about it: evals, tracing, regression detection, and what to put on a dashboard.',
  },
  {
    slug: 'llm-serving',
    label: 'LLM Serving',
    blurb:
      'Running the model yourself — vLLM, batching, throughput and latency budgets, and the arithmetic behind the surprises.',
  },
  {
    slug: 'llmops',
    label: 'LLMOps',
    blurb:
      'The operational half: pipelines, reindexing, release and rollback, and the jobs that quietly decide whether answers stay true.',
  },
  {
    slug: 'data-engineering',
    label: 'Data Engineering',
    blurb:
      'The data side of a GenAI system — ingestion, freshness, and the scheduled work nobody wrote down and nobody put on call.',
  },
  {
    slug: 'governance',
    label: 'Regulation & Governance',
    blurb:
      'What compliance actually demands of an AI system, on what timeline, and which engineering decisions it quietly forces.',
  },
] as const satisfies readonly Tag[];

export type TagSlug = (typeof TAGS)[number]['slug'];

/** Zod-friendly tuple: z.enum() needs a non-empty tuple of literals. */
export const TAG_SLUGS = TAGS.map((t) => t.slug) as unknown as [TagSlug, ...TagSlug[]];

const BY_SLUG = new Map(TAGS.map((t) => [t.slug as string, t]));

export const tagLabel = (slug: string): string => BY_SLUG.get(slug)?.label ?? slug;
export const tagBlurb = (slug: string): string => BY_SLUG.get(slug)?.blurb ?? '';

/** Vocabulary order, not post order — keeps chip rows stable across pages. */
export const sortByVocabulary = (slugs: readonly string[]): string[] =>
  [...slugs].sort((a, b) => TAG_SLUGS.indexOf(a as TagSlug) - TAG_SLUGS.indexOf(b as TagSlug));
