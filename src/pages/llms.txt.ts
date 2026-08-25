import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, ENTITY_PARAGRAPH } from '../consts';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

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
- [CV (PDF)](${SITE.url}${SITE.cv}): full professional history.

## Elsewhere
- LinkedIn: ${SITE.linkedin}
- GitHub: ${SITE.github}
- Email: ${SITE.email}

## Articles
${posts.map((p) => `- [${p.data.title}](${SITE.url}/blog/${p.id}/) — ${p.data.date.toISOString().slice(0, 10)}, ${p.data.tag}. ${p.data.excerpt}`).join('\n')}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
