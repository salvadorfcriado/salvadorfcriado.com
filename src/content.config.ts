import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TAG_SLUGS } from './tags';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /* 1–3 tags from src/tags.ts. tags[0] is primary — see that file. */
    tags: z.array(z.enum(TAG_SLUGS)).min(1).max(3),
    excerpt: z.string(),
    /* Overrides the generated OG card. See scripts/og.mjs. */
    cover: z.string().optional(),
    readingTime: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
