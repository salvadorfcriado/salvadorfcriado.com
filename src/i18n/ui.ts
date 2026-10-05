/* ── Languages ────────────────────────────────────────────────────────────────
   English lives at the root (/, /blog/…), Spanish under /es/ (/es/, /es/blog/…).
   Every page exists in both; the switcher in the top bar links a page to its twin.
   Strings that appear on more than one page live here. Copy that belongs to a
   single page (the landing page) lives next to it, in src/i18n/home.ts. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { TAGS, sortByVocabulary } from '../tags';

export const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];

/** `/blog/` → `/es/blog/` for Spanish, unchanged for English. */
export const localePath = (lang: Lang, path: string): string =>
  lang === 'es' ? `/es${path}` : path;

/** The other language's path for the same page. `path` is language-neutral. */
export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'es' : 'en');

export type Post = CollectionEntry<'blog'> | CollectionEntry<'blogEs'>;

/** Published posts in one language, newest first. */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const posts: Post[] = lang === 'es'
    ? await getCollection('blogEs', ({ data }) => !data.draft)
    : await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/* Spanish names for the blog taxonomy. Slugs stay English in both languages —
   they are URLs, and /es/blog/tags/rag/ beside /blog/tags/rag/ is the point. */
const TAGS_ES: Record<string, { label: string; blurb: string }> = {
  rag: {
    label: 'RAG',
    blurb: 'Retrieval-augmented generation en producción: qué decide de verdad si el modelo recibe el contexto correcto y cuánto cuesta arreglarlo.',
  },
  'search-retrieval': {
    label: 'Búsqueda y recuperación',
    blurb: 'Recall, ranking y rerankers: distinguir un fallo de recuperación de uno de ordenación, y en qué orden atacarlos.',
  },
  evaluation: {
    label: 'Evaluación y monitorización',
    blurb: 'Medir un sistema LLM en vez de discutir sobre él: evals, tracing, detección de regresiones y qué poner en un panel.',
  },
  'llm-serving': {
    label: 'Serving de LLMs',
    blurb: 'Servir el modelo uno mismo: vLLM, batching, presupuestos de throughput y latencia, y la aritmética detrás de las sorpresas.',
  },
  llmops: {
    label: 'LLMOps',
    blurb: 'La mitad operativa: pipelines, reindexado, despliegue y rollback, y los procesos que deciden en silencio si las respuestas siguen siendo ciertas.',
  },
  'data-engineering': {
    label: 'Ingeniería de datos',
    blurb: 'El lado de datos de un sistema GenAI: ingesta, frescura y el trabajo programado que nadie documentó ni puso de guardia.',
  },
  'ai-coding': {
    label: 'IA en el desarrollo',
    blurb: 'Hacer software con agentes de código: flujos guiados por especificación, roles, puertas de revisión y qué medir cuando escribir deja de ser lo caro.',
  },
  governance: {
    label: 'Regulación y gobierno',
    blurb: 'Qué exige de verdad el cumplimiento normativo a un sistema de IA, en qué plazos y qué decisiones de ingeniería fuerza sin decirlo.',
  },
};

const BY_SLUG = new Map(TAGS.map((t) => [t.slug as string, t]));

export const tagLabelIn = (lang: Lang, slug: string): string =>
  lang === 'es' ? TAGS_ES[slug]?.label ?? slug : BY_SLUG.get(slug)?.label ?? slug;
export const tagBlurbIn = (lang: Lang, slug: string): string =>
  lang === 'es' ? TAGS_ES[slug]?.blurb ?? '' : BY_SLUG.get(slug)?.blurb ?? '';

/* ── Shared interface strings ─────────────────────────────────────────────── */
export const UI = {
  en: {
    htmlLang: 'en',
    ogLocale: 'en_GB',
    skip: 'Skip to content',
    newTab: ' (opens in a new tab)',
    nav: {
      main: 'Main',
      services: 'Services',
      work: 'Projects',
      process: 'How I work',
      about: 'About',
      contact: 'Contact',
      back: '← Back to home',
      switchTo: 'Español',
      switchLabel: 'Leer en español',
    },
    status: 'Available for new projects · Remote from Granada, Spain',
    entity:
      'Salvador F. Criado — applied AI specialist and software engineer in Granada (Spain), remote worldwide. '
      + 'AI agents (voice and text), document automation, RAG, self-hosted models, custom software and cloud on AWS and Azure.',
    elsewhere: 'Elsewhere',
    blog: {
      name: 'Field notes',
      title: 'Salvador F. Criado — Field notes',
      description:
        'Field notes on shipping LLM systems to production: retrieval and ranking, determinism at '
        + 'temperature zero, vLLM serving, and the data jobs nobody puts on call.',
      eyebrow: 'Writing',
      sub: 'What breaks when an LLM system meets production, and the order to fix it in.',
      rss: 'Subscribe by RSS',
      filter: 'Filter by topic',
      topic: 'Topic',
      posts: (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`,
      allPosts: '← all posts',
      readNext: 'Read next',
      allNotes: '← all field notes',
      minRead: 'min read',
      home: 'Home',
      author:
        'AI and platform engineer in Granada (Spain), remote worldwide. Eight years of production systems; '
        + 'voice agents, document automation and LLM applications on top of AWS, Terraform and Kubernetes.',
      seeWork: 'See what we build',
      mailSubject: 'Project',
    },
  },
  es: {
    htmlLang: 'es',
    ogLocale: 'es_ES',
    skip: 'Saltar al contenido',
    newTab: ' (se abre en una pestaña nueva)',
    nav: {
      main: 'Principal',
      services: 'Servicios',
      work: 'Proyectos',
      process: 'Cómo trabajo',
      about: 'Sobre mí',
      contact: 'Contacto',
      back: '← Volver al inicio',
      switchTo: 'English',
      switchLabel: 'Read in English',
    },
    status: 'Disponible para nuevos proyectos · En remoto desde Granada (España)',
    entity:
      'Salvador F. Criado — especialista en IA aplicada e ingeniero de software en Granada (España), en remoto. '
      + 'Agentes de IA de voz y de texto, automatización de documentos, RAG, modelos propios, software a medida y cloud en AWS y Azure.',
    elsewhere: 'En otros sitios',
    blog: {
      name: 'Notas técnicas',
      title: 'Salvador F. Criado — Notas técnicas',
      description:
        'Notas sobre llevar sistemas LLM a producción: recuperación y ranking, determinismo a temperatura '
        + 'cero, serving con vLLM y los procesos de datos que nadie pone de guardia.',
      eyebrow: 'Escritos',
      sub: 'Qué se rompe cuando un sistema LLM llega a producción, y en qué orden arreglarlo.',
      rss: 'Suscríbete por RSS',
      filter: 'Filtrar por tema',
      topic: 'Tema',
      posts: (n: number) => `${n} ${n === 1 ? 'artículo' : 'artículos'}`,
      allPosts: '← todos los artículos',
      readNext: 'Sigue leyendo',
      allNotes: '← todas las notas',
      minRead: 'min de lectura',
      home: 'Inicio',
      author:
        'Ingeniero de IA y plataforma en Granada (España), en remoto. Ocho años de sistemas en producción; '
        + 'agentes de voz, automatización de documentos y aplicaciones LLM sobre AWS, Terraform y Kubernetes.',
      seeWork: 'Ver qué construimos',
      mailSubject: 'Proyecto',
    },
  },
} as const;

/* ── Static paths shared by the English and Spanish page files ─────────────── */
export async function postPaths(lang: Lang) {
  const posts = await getPosts(lang);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post, lang } }));
}

/* Paths come from the posts, never from the vocabulary: a tag nobody uses
   must not produce a page for a crawler to find and a reader to land on. */
export async function tagPaths(lang: Lang) {
  const posts = await getPosts(lang);
  const inUse = sortByVocabulary([...new Set(posts.flatMap((p) => p.data.tags))]);
  return inUse.map((tag) => ({
    params: { tag },
    props: { lang, tag, tagsInUse: inUse, posts: posts.filter((p) => (p.data.tags as readonly string[]).includes(tag)) },
  }));
}
