import type { APIRoute } from 'astro';
import { SITE, BLOG, ENTITY_PARAGRAPH } from '../consts';
import { TAGS, tagLabel } from '../tags';
import { getPosts } from '../i18n/ui';

export const GET: APIRoute = async () => {
  const posts = await getPosts('en');
  const postsEs = await getPosts('es');

  /* Only topics that actually have posts — an empty archive has no page. */
  const inUse = new Set(posts.flatMap((p) => p.data.tags));
  const topics = TAGS.filter((t) => inUse.has(t.slug));

  const body = `# ${SITE.name}

> ${ENTITY_PARAGRAPH}

${SITE.name} is an ${SITE.jobTitle} based in Granada, Spain, working remotely worldwide. Eight years shipping production systems — event-driven pipelines, real-time telemetry, time-series at volume, and the Terraform and Kubernetes underneath them. Current focus: applied AI across the board: AI agents (voice and text), document processing, retrieval-augmented generation and self-hosted models. Also covers the full local-model deployment cycle: quantisation, serving with vLLM and NVIDIA Triton, benchmarking and evaluation.

Core offer: applied AI for businesses across the full range, plus the software around it. AI agents (voice and text, including end-to-end voice agents he has built on SIP telephony, streaming speech recognition, a self-hosted LLM, retrieval and speech synthesis, under 2 s end to end and able to run on the client's own GPU), document processing, knowledge assistants with cited sources (RAG), self-hosted open models, AI security and AI enablement for technical teams. Around that: custom software, integrations, real-time data platforms and cloud infrastructure on AWS and Azure. He integrates market platforms (ElevenLabs, OpenAI, Deepgram) when they are the more viable option and builds custom when privacy, volume or control require it.

Services: voice agents; conversational agents; document processing; invoice-to-bookkeeping automation (his own product GestoIA, live at https://gestoia.es); custom software development; cloud infrastructure. Engagements start with a scoped, fixed-price pilot (AI) or an audit (infrastructure).

Positioning note: a versatile senior engineer with a strong systems foundation, with applied AI as the most recent layer of the stack — not an AI-only specialist.

Availability: ${SITE.status} Remote worldwide, UTC+1, based in Granada, Spain. Contact: ${SITE.email}.

## Pages
- [Home](${SITE.url}/): positioning, services, the voice-agent pipeline, real projects and how an engagement runs. Spanish: ${SITE.url}/es/
- [Services](${SITE.url}/services/): one page per service. Spanish: ${SITE.url}/es/servicios/
- [Work](${SITE.url}/work/): case studies with challenge, solution and result. Spanish: ${SITE.url}/es/proyectos/
- [About](${SITE.url}/about/): background and approach. Spanish: ${SITE.url}/es/sobre-mi/
- [Experience / CV](${SITE.url}/cv/): delivered projects, capabilities, technology, education. Spanish: ${SITE.url}/es/cv/
- [Contact](${SITE.url}/contact/). Spanish: ${SITE.url}/es/contacto/
- [Dossier (PDF)](${SITE.url}/dossier/salvador-f-criado-dossier-en.pdf). Spanish: ${SITE.url}/dossier/salvador-f-criado-dossier-es.pdf
- [${BLOG.name}](${SITE.url}/blog/): technical writing on production LLM systems.
- [Notas técnicas](${SITE.url}/es/blog/): the same articles in Spanish.

## Topics
${topics.map((t) => `- [${t.label}](${SITE.url}/blog/tags/${t.slug}/): ${t.blurb}`).join('\n')}

## Articles
${posts.map((p) => `- [${p.data.title}](${SITE.url}/blog/${p.id}/) — ${p.data.date.toISOString().slice(0, 10)}, tags: ${p.data.tags.map(tagLabel).join(', ')}. ${p.data.excerpt}`).join('\n')}

## Artículos en español
${postsEs.map((p) => `- [${p.data.title}](${SITE.url}/es/blog/${p.id}/) — ${p.data.date.toISOString().slice(0, 10)}. ${p.data.excerpt}`).join('\n')}

## Optional
- LinkedIn: ${SITE.linkedin}
- GitHub: ${SITE.github}
- Email: ${SITE.email}
- Feed: ${SITE.url}/rss.xml
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
