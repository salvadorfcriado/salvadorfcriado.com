import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, ENTITY_PARAGRAPH } from '../consts';
import { TAGS, tagLabel } from '../tags';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  /* Only topics that actually have posts — an empty archive has no page. */
  const inUse = new Set(posts.flatMap((p) => p.data.tags));
  const topics = TAGS.filter((t) => inUse.has(t.slug));

  const body = `# ${SITE.name}

> ${ENTITY_PARAGRAPH}

${SITE.name} (legal name ${SITE.legalName}) is an ${SITE.jobTitle} based in Granada, Spain, working
remotely worldwide. Eight years owning distributed systems in production. Current focus: applied AI
end to end — LLM applications, agentic systems, retrieval-augmented generation and real-time voice —
on a backbone of AWS, Azure, Terraform and Kubernetes. Also covers the full local-model deployment
cycle: quantisation, serving with vLLM and NVIDIA Triton, benchmarking and evaluation.

Positioning note: a versatile senior engineer with a strong systems foundation, with applied AI as the
most recent layer of the stack — not an AI-only specialist.

## Pages
- [Home](${SITE.url}/): who he is, selected work, latest writing.
- [Field notes](${SITE.url}/blog/): technical writing on production LLM systems.
- [Consulting](${SITE.url}/services/): SCDAP — architecture and delivery engagements.

## Topics
${topics.map((t) => `- [${t.label}](${SITE.url}/blog/tags/${t.slug}/): ${t.blurb}`).join('\n')}

## Elsewhere
- LinkedIn: ${SITE.linkedin}
- GitHub: ${SITE.github}
- Email: ${SITE.email}

## Articles
${posts.map((p) => `- [${p.data.title}](${SITE.url}/blog/${p.id}/) — ${p.data.date.toISOString().slice(0, 10)}, tags: ${p.data.tags.map(tagLabel).join(', ')}. ${p.data.excerpt}`).join('\n')}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
