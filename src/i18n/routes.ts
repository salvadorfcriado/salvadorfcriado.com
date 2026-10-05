/* Every page URL in both languages. Spanish pages have Spanish slugs, so a page
   is identified by a key, not by its path — and the language switcher, the
   hreflang links and the nav all resolve through here. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type { Lang } from './ui';

export type PageKey = 'home' | 'services' | 'work' | 'about' | 'cv' | 'contact' | 'dossier' | 'blog';
export type ServiceId = 'voice' | 'docs' | 'billing' | 'assistant' | 'infra' | 'custom';

export const SERVICE_IDS: ServiceId[] = ['voice', 'assistant', 'docs', 'billing', 'custom', 'infra'];

const PAGES: Record<PageKey, Record<Lang, string>> = {
  home: { en: '/', es: '/es/' },
  services: { en: '/services/', es: '/es/servicios/' },
  work: { en: '/work/', es: '/es/proyectos/' },
  about: { en: '/about/', es: '/es/sobre-mi/' },
  cv: { en: '/cv/', es: '/es/cv/' },
  contact: { en: '/contact/', es: '/es/contacto/' },
  dossier: { en: '/dossier/', es: '/es/dossier/' },
  blog: { en: '/blog/', es: '/es/blog/' },
};

export const SERVICE_SLUGS: Record<ServiceId, Record<Lang, string>> = {
  voice: { en: 'voice-agents', es: 'agentes-de-voz' },
  docs: { en: 'document-processing', es: 'procesamiento-de-documentos' },
  billing: { en: 'invoicing-and-accounting', es: 'facturacion-y-contabilidad' },
  assistant: { en: 'conversational-agents', es: 'agentes-conversacionales' },
  infra: { en: 'cloud-infrastructure', es: 'infraestructura-cloud' },
  custom: { en: 'custom-software', es: 'desarrollo-a-medida' },
};

export const route = (lang: Lang, key: PageKey): string => PAGES[key][lang];

export const serviceRoute = (lang: Lang, id: ServiceId): string =>
  `${PAGES.services[lang]}${SERVICE_SLUGS[id][lang]}/`;

/** The downloadable dossier, rendered from the dossier page by scripts/dossier-pdf.mjs.
    The ?v= is a hash of the file: the URL never changes otherwise, so a browser
    (or the CDN) kept serving the previous PDF after every regeneration. */
export const dossierPdf = (lang: Lang): string => {
  const path = `/dossier/salvador-f-criado-dossier-${lang}.pdf`;
  const file = `public${path}`;
  const v = existsSync(file) ? createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 8) : '0';
  return `${path}?v=${v}`;
};
