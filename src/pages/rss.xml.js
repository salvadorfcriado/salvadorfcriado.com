import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: `${SITE.name} — Field notes`,
    description: 'Notes on shipping LLM systems: retrieval and ranking, determinism, serving, and the data jobs nobody puts on call.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.excerpt,
      link: `/blog/${p.id}/`,
      categories: p.data.tags,
    })),
    customData: '<language>en</language>',
  });
}
