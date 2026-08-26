import { defineCollection } from 'astro:content';
/* Not `z` from 'astro:content' — that re-export is deprecated as of Astro 7 and
   goes away in 8. 'astro/zod' is the replacement Astro's own deprecation names. */
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { TAG_SLUGS } from './tags';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  /* .strict() — a misspelled key used to be dropped in silence. */
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    /* 1–3 tags from src/tags.ts. tags[0] is primary — see that file. */
    tags: z.array(z.enum(TAG_SLUGS)).min(1).max(3),
    /* Rendered verbatim as the meta description, og:description, the RSS item
       description and the BlogPosting description. Search results truncate
       around 160 characters, so the cap is the budget for all four at once. */
    excerpt: z.string().min(1).max(160),
    /* Overrides the generated OG card. Must NOT live under /img/og/ — that
       directory is build output and scripts/og.mjs prunes it. */
    cover: z.string().startsWith('/').refine(
      (p) => !p.startsWith('/img/og/'),
      { message: '`cover` must live outside /img/og/ — that directory is regenerated every build' },
    ).optional(),
    /* Required: four templates render `{readingTime} min` unconditionally, and
       an omitted value used to print as an empty string next to "min". */
    readingTime: z.number().int().positive(),
    draft: z.boolean().default(false),
  }).strict(),
});

export const collections = { blog };
