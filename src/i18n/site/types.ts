/* Shape of the site copy. One object per language (es.ts, en.ts), same shape,
   so a missing translation is a type error, not a blank on the page. */
import type { ServiceId } from '../routes';

export interface Meta {
  title: string;
  description: string;
}

export interface Item {
  t: string;
  d: string;
}

export interface QA {
  q: string;
  a: string;
}

export interface Service {
  id: ServiceId;
  /** Short name — nav, cards, footer. */
  name: string;
  /** Benefit-led headline for the detail page and the services list. */
  title: string;
  /** One line for cards. */
  tagline: string;
  /** Two or three sentences for the detail page hero. */
  lead: string;
  videoLabel: string;
  meta: Meta;
  problem: string[];
  how: Item[];
  includes: string[];
  outcomes: string[];
  fit: Item[];
  stack: string[];
  /** A case on the work page that shows this service in practice. */
  caseId: string;
  /** A public product the reader can open to see the service working. */
  live?: { label: string; href: string };
  faq: QA[];
}

export interface Case {
  id: string;
  sector: string;
  title: string;
  metric: string;
  metricLabel: string;
  summary: string;
  challenge: string;
  solution: string;
  result: string;
  stack: string[];
  services: ServiceId[];
  /** Public site of the project, when there is one (own products only). */
  link?: { label: string; href: string };
}

export type IconName =
  | 'phone' | 'chat' | 'flow' | 'doc' | 'search' | 'cpu' | 'users' | 'lock'
  | 'chart' | 'layers' | 'code' | 'cloud' | 'shield' | 'database' | 'invoice' | 'bolt' | 'spark';

export interface Capability {
  t: string;
  d: string;
  icon: IconName;
}

export interface SiteCopy {
  /* The whole range, grouped — home, services and dossier. */
  capabilities: {
    eyebrow: string;
    title: string;
    lead: string;
    groups: { t: string; d: string; items: Capability[] }[];
    custom: { t: string; d: string; cta: string };
  };
  cv: {
    meta: Meta;
    hero: { eyebrow: string; title: string; lead: string };
    summary: string[];
    labels: { experience: string; skills: string; domains: string; education: string; certs: string; languages: string; delivered: string; print: string };
    experience: { when: string; role: string; context: string; delivered: string[]; tags: string[] }[];
    skills: { t: string; items: string[] }[];
    domains: string[];
    education: { k: string; v: string }[];
    certs: { k: string; v: string }[];
    languages: string;
  };
  nav: {
    services: string;
    work: string;
    about: string;
    cv: string;
    blog: string;
    contact: string;
    cta: string;
    menu: string;
    close: string;
    allServices: string;
    servicesIntro: string;
  };
  common: {
    learnMore: string;
    viewService: string;
    viewAllWork: string;
    contactCta: string;
    downloadDossier: string;
    backToServices: string;
    otherServices: string;
    relatedCase: string;
    faqTitle: string;
    stack: string;
    challenge: string;
    solution: string;
    result: string;
    mailSubject: string;
    mailBody: string;
    example: string;
  };
  footer: {
    tagline: string;
    servicesCol: string;
    companyCol: string;
    resourcesCol: string;
    rss: string;
    rights: string;
  };
  cta: {
    title: string;
    lead: string;
    primary: string;
    secondary: string;
  };
  home: {
    meta: Meta;
    hero: {
      badge: string;
      pre: string;
      accent: string;
      post: string;
      lead: string;
      primary: string;
      secondary: string;
      trust: string[];
      cardA: { k: string; v: string };
      cardB: { k: string; v: string };
    };
    tech: string;
    /* Build, combine or integrate — the positioning argument. */
    approach: {
      eyebrow: string;
      title: string;
      lead: string;
      levels: { tag: string; t: string; d: string; when: string; tools: string }[];
      note: string;
    };
    /* Anatomy of a voice agent — what "deep development" means, concretely. */
    voice: {
      eyebrow: string;
      title: string;
      lead: string;
      stages: { t: string; d: string; tech: string }[];
      total: string;
      totalLabel: string;
      points: string[];
      cta: string;
    };
    services: { eyebrow: string; title: string; lead: string };
    why: { eyebrow: string; title: string; lead: string; items: Item[] };
    stats: { n: string; l: string }[];
    process: { eyebrow: string; title: string; lead: string; steps: { t: string; when: string; d: string }[] };
    work: { eyebrow: string; title: string; lead: string; featured: string[] };
    sectors: { eyebrow: string; title: string; lead: string; items: Item[] };
    about: { eyebrow: string; title: string; body: string; cta: string; facts: string[] };
    faq: { eyebrow: string; title: string; items: QA[] };
    blog: { eyebrow: string; title: string; lead: string; cta: string };
  };
  services: {
    meta: Meta;
    hero: { eyebrow: string; title: string; lead: string };
    listTitle: string;
    sections: { problem: string; how: string; includes: string; outcomes: string; fit: string };
    also: { title: string; items: Item[] };
    items: Service[];
  };
  work: {
    meta: Meta;
    hero: { eyebrow: string; title: string; lead: string };
    note: string;
    product: { eyebrow: string; title: string; body: string; points: string[]; link: { label: string; href: string } };
    items: Case[];
  };
  about: {
    meta: Meta;
    hero: { eyebrow: string; title: string; lead: string; portraitAlt: string };
    story: { title: string; paragraphs: string[] };
    timeline: { title: string; items: { when: string; role: string; org: string; d: string }[] };
    principles: { title: string; items: Item[] };
    credentials: { title: string; items: { k: string; v: string }[] };
  };
  contact: {
    meta: Meta;
    hero: { eyebrow: string; title: string; lead: string };
    channels: { email: Item; linkedin: Item; dossier: Item };
    include: { title: string; items: string[] };
    next: { title: string; steps: Item[] };
    hours: Item;
  };
  dossier: {
    meta: Meta;
    kicker: string;
    title: string;
    subtitle: string;
    print: string;
    download: string;
    sections: { services: string; work: string; process: string; about: string; contact: string };
    contactLead: string;
  };
}
