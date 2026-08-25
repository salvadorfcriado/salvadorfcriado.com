import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE, BLOG } from '../consts';
import { tagLabel } from '../tags';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const self = new URL('rss.xml', context.site).href;
  const author = `${SITE.email} (${SITE.name})`;

  return rss({
    title: BLOG.title,
    description: BLOG.description,
    site: context.site,
    trailingSlash: true,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.excerpt,
      link: `/blog/${p.id}/`,
      /* Labels, not slugs — the same string the reader sees everywhere else. */
      categories: p.data.tags.map(tagLabel),
      author,
    })),
    customData: [
      '<language>en</language>',
      /* Feed validators warn without a self-link, and aggregators cannot cheaply
         detect freshness without a build date. */
      `<atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
      `<link>${SITE.url}/blog/</link>`,
      posts.length ? `<lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>` : '',
      `<managingEditor>${author}</managingEditor>`,
      `<webMaster>${author}</webMaster>`,
      '<ttl>1440</ttl>',
    ].join(''),
  });
}
