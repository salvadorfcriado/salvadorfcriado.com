import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/* lastmod per post, so a recrawl has a reason. Read straight from the
   frontmatter rather than the content collection — this file runs before it. */
const BLOG_DIR = './src/content/blog';
const POST_DATES = Object.fromEntries(
  readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const date = readFileSync(`${BLOG_DIR}/${f}`, 'utf8').match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
      return [`https://salvadorfcriado.com/blog/${slug}/`, date];
    }),
);
const BUILD_DAY = new Date().toISOString().slice(0, 10);

/* Archives with fewer than this many posts are noindex in [tag].astro. Keep the
   sitemap agreeing with the robots meta — the two must not contradict. */
const THIN_ARCHIVE = 3;
const TAG_COUNTS = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.md'))
  .flatMap((f) => {
    const raw = readFileSync(`${BLOG_DIR}/${f}`, 'utf8').match(/^tags:\s*\[([^\]]*)\]/m)?.[1] ?? '';
    return raw.split(',').map((t) => t.trim()).filter(Boolean);
  })
  .reduce((acc, t) => ({ ...acc, [t]: (acc[t] ?? 0) + 1 }), {});
const THIN_TAG_URLS = new Set(
  Object.entries(TAG_COUNTS)
    .filter(([, n]) => n < THIN_ARCHIVE)
    .map(([t]) => `https://salvadorfcriado.com/blog/tags/${t}/`),
);

export default defineConfig({
  site: 'https://salvadorfcriado.com',
  /* Every internal link and every canonical already carried one; nothing
     enforced it, so a link written without it worked in dev and mismatched
     the canonical in production. */
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !THIN_TAG_URLS.has(page),
      serialize: (item) => ({ ...item, lastmod: POST_DATES[item.url] ?? BUILD_DAY }),
    }),
  ],
  markdown: {
    /* Shiki's default is github-dark, and it writes the theme background as an
       inline style on <pre> — which beats any author rule. Against the site's
       light plate that put code at 1.24:1. Do not remove this. */
    shikiConfig: { theme: 'github-light' },
  },
  /* Page-scoped CSS is inlined on every page. Under 'auto' the landing page's
     6.4 KB block was the only one over the 4 KB threshold, so it alone paid a
     second render-blocking request. All page CSS together is ~3 KB gzipped. */
  build: { inlineStylesheets: 'always' },
});
