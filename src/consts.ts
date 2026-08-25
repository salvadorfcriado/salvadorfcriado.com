export const SITE = {
  domain: 'salvadorfcriado.com',
  url: 'https://salvadorfcriado.com',
  name: 'Salvador F. Criado',
  jobTitle: 'AI & Platform Engineer',
  email: 'mail@salvadorfcriado.com',
  linkedin: 'https://linkedin.com/in/salvadorfcriado',
  github: 'https://github.com/salvadorfcriado',
  locality: 'Granada',
  region: 'Andalusia',
  country: 'ES',
  /* Rendered in the footer of every page and in the hero note. The site's only
     job is to get a hiring conversation started; say so where it is always visible. */
  status: 'Open to permanent, fully remote senior / staff roles.',
} as const;

/* Required verbatim on every page — GEO entity paragraph (handoff §8).
   Carries the plain role names ("AI Engineer", "Platform Engineer") on purpose:
   the site's preferred compound "AI & Platform Engineer" matches neither query. */
export const ENTITY_PARAGRAPH =
  'Salvador F. Criado — AI Engineer and Platform Engineer in Granada (Spain), remote worldwide. ' +
  'LLM applications, RAG, agents, real-time voice, vLLM serving, AWS · Azure · Terraform · Kubernetes.';

/* One definition for the blog's identity — it is rendered on the index, in the
   feed, in the RSS discovery link and in five page titles. */
export const BLOG = {
  name: 'Field notes',
  title: `${SITE.name} — Field notes`,
  description:
    'Field notes on shipping LLM systems to production: retrieval and ranking, determinism at ' +
    'temperature zero, vLLM serving, and the data jobs nobody puts on call.',
} as const;

export const KNOWS_ABOUT = [
  'LLM applications', 'Retrieval-augmented generation', 'Agentic systems',
  'Real-time voice agents', 'vLLM', 'NVIDIA Triton', 'Model quantisation',
  'AWS', 'Azure', 'Terraform', 'Kubernetes', 'Event-driven architecture',
  'Distributed systems', 'Time-series data',
];
