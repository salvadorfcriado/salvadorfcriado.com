import rss from '@astrojs/rss';
import { SITE } from '../consts';
import { UI, getPosts, localePath, tagLabelIn } from '../i18n/ui';

/* One feed per language: /rss.xml and /es/rss.xml (src/pages/es/rss.xml.js). */
export const feed = (lang) => async (context) => {
  const BLOG = UI[lang].blog;
  const L = (p) => localePath(lang, p);
  const posts = await getPosts(lang);

  const self = new URL(L('/rss.xml'), context.site).href;
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
      link: L(`/blog/${p.id}/`),
      /* Labels, not slugs — the same string the reader sees everywhere else. */
      categories: p.data.tags.map((t) => tagLabelIn(lang, t)),
      author,
    })),
    customData: [
      `<language>${lang}</language>`,
      /* Feed validators warn without a self-link, and aggregators cannot cheaply
         detect freshness without a build date. */
      `<atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
      `<link>${SITE.url}${L('/blog/')}</link>`,
      posts.length ? `<lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>` : '',
      `<managingEditor>${author}</managingEditor>`,
      `<webMaster>${author}</webMaster>`,
      '<ttl>1440</ttl>',
    ].join(''),
  });
}

