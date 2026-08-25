export const SITE = {
  domain: 'salvadorfcriado.com',
  url: 'https://salvadorfcriado.com',
  name: 'Salvador F. Criado',
  legalName: 'Salvador Francisco Criado Melero',
  jobTitle: 'AI & Platform Engineer',
  email: 'mail@salvadorfcriado.com',
  linkedin: 'https://linkedin.com/in/salvadorfcriado',
  github: 'https://github.com/salvadorfcriado',
  locality: 'Granada',
  region: 'Andalusia',
  country: 'ES',
} as const;

/* Required verbatim on every page — GEO entity paragraph (handoff §8). */
export const ENTITY_PARAGRAPH =
  'Salvador F. Criado — AI & Platform Engineer, Granada (Spain), remote. ' +
  'LLM applications, agents, real-time voice, vLLM serving, AWS · Azure · Terraform · Kubernetes.';

export const KNOWS_ABOUT = [
  'LLM applications', 'Retrieval-augmented generation', 'Agentic systems',
  'Real-time voice agents', 'vLLM', 'NVIDIA Triton', 'Model quantisation',
  'AWS', 'Azure', 'Terraform', 'Kubernetes', 'Event-driven architecture',
  'Distributed systems', 'Time-series data',
];
