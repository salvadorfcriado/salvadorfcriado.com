/* English site copy. Written for whoever decides to bring Salvador into a
   project (owner, operations director, general manager), not for an engineer,
   and readable by an international audience.

   Positioning: full-spectrum applied AI specialist (voice and text agents,
   documents, data, self-hosted models) with eight years of production
   software behind him, which lets him build whatever is needed around it.

   Honesty rules (see career/career.md in the hub and the project memory):
   - Clients are described by sector, never by name.
   - The voice agent works end to end on real calls; it is NOT presented as
     running in production at scale, nor with a finished CRM integration.
   - The Azure migration is in progress. GestoIA is live and on sale (gestoia.es).
   - The service examples and the videos are illustrative; the cases on the
     work page are real. Figures come from career.md. */
import type { SiteCopy } from './types';

export const en: SiteCopy = {
  nav: {
    services: 'Services',
    work: 'Work',
    about: 'About',
    cv: 'Experience',
    blog: 'Blog',
    contact: 'Contact',
    cta: "Let's talk",
    menu: 'Menu',
    close: 'Close',
    allServices: 'See all services',
    servicesIntro: 'Applied AI specialist',
  },
  common: {
    learnMore: 'View the project',
    viewService: 'View service',
    viewAllWork: 'See all work',
    contactCta: "Let's talk about your project",
    downloadDossier: 'Download dossier (PDF)',
    backToServices: 'All services',
    otherServices: 'Other services',
    relatedCase: 'Related project',
    faqTitle: 'Frequently asked questions',
    stack: 'Technology',
    challenge: 'Challenge',
    solution: 'Solution',
    result: 'Result',
    mailSubject: 'Project',
    mailBody:
      'Hello,\n\nCompany and sector:\nWhat we want to improve or build:\nTools we use today:\nTimeline:\n\nThanks.',
    example: 'Example',
  },
  footer: {
    tagline: 'Applied artificial intelligence and custom software development. Working remotely from Granada, Spain, for companies in any country.',
    servicesCol: 'Services',
    companyCol: 'More',
    resourcesCol: 'Resources',
    rss: 'RSS',
    rights: 'All rights reserved.',
  },
  cta: {
    title: 'Tell us what you want to solve.',
    lead: 'A 30-minute conversation is enough to know whether we can help and how. No commitment.',
    primary: 'Get in touch',
    secondary: 'Download dossier',
  },

  capabilities: {
    eyebrow: 'The full range',
    title: 'From idea to production, at any point along the way',
    lead:
      'AI rarely arrives on its own: it needs data, integrations, software and infrastructure to run on. We handle all of '
      + 'it, so we can take on a whole project or just the piece you are missing.',
    groups: [
      {
        t: 'AI agents',
        d: 'They converse, decide and act.',
        items: [
          { icon: 'phone', t: 'Voice agents', d: 'They answer calls in a natural voice and resolve or route them according to your rules.' },
          { icon: 'chat', t: 'Conversational agents', d: 'On your website, in internal chat or in messaging apps, with your information and your tools.' },
          { icon: 'flow', t: 'Process agents', d: 'They chain steps together, query your systems and ask a person for approval when needed.' },
        ],
      },
      {
        t: 'AI on your data',
        d: 'It reads, finds and understands.',
        items: [
          { icon: 'doc', t: 'Documents', d: 'Invoices, contracts and forms read, checked and recorded.' },
          { icon: 'search', t: 'Company knowledge', d: 'Answers from your manuals and contracts, citing the source.' },
          { icon: 'cpu', t: 'Models on your servers', d: 'Open models deployed, optimised and measured on your own infrastructure.' },
          { icon: 'lock', t: 'Security and control', d: 'Personal data protection, filters, traceability and continuous evaluation.' },
          { icon: 'users', t: 'AI in your team', d: 'Bringing AI into your technical team, with good practices and training.' },
        ],
      },
      {
        t: 'Software, data and infrastructure',
        d: 'What makes it all work.',
        items: [
          { icon: 'code', t: 'Custom software', d: 'Web applications, internal dashboards and APIs.' },
          { icon: 'layers', t: 'Integrations', d: 'CRM, ERP, booking and accounting systems connected, with n8n or custom code.' },
          { icon: 'chart', t: 'Real-time data', d: 'Sensors, telemetry, alerts and dashboards.' },
          { icon: 'cloud', t: 'Cloud infrastructure', d: 'AWS and Azure defined as code, with automated deployments and costs kept in check.' },
          { icon: 'shield', t: 'Technical audit', d: 'Security, costs and architecture, with a prioritised improvement plan.' },
        ],
      },
    ],
    custom: {
      t: "Your case doesn't fit any of these boxes?",
      d:
        "That's normal. We have worked in phone support, industry, energy, education, hospitality and accounting, and we get "
        + "up to speed quickly with how each business works. Tell us about it and we'll tell you honestly whether we're the right fit.",
      cta: 'Tell us about your case',
    },
  },

  home: {
    meta: {
      title: 'Salvador F. Criado — Applied AI specialist: agents, automation and custom software',
      description:
        'Applied artificial intelligence for businesses: voice and text agents, documents, automation, '
        + 'self-hosted models, and the software and cloud they run on.',
    },
    hero: {
      badge: 'Available for new projects',
      pre: 'Applied AI that ',
      accent: 'answers, reads and automates',
      post: ' inside your business.',
      lead:
        'We specialise in applied artificial intelligence. We build voice and text agents, automate documents and processes, '
        + 'connect AI to your systems and build the software and cloud it runs on. Over eight years of production software: '
        + 'if your project needs it, we build it.',
      primary: "Let's talk about your project",
      secondary: 'See what we can do',
      trust: ['Applied AI specialist', '8+ years of production software', 'Pilot with agreed scope and price'],
      cardA: { k: '< 2 s', v: 'voice agent response time' },
      cardB: { k: 'Your data', v: 'inside your network' },
    },
    tech: 'Technology we work with',
    approach: {
      eyebrow: 'Our approach',
      title: 'Integrate, combine or build: whatever your business needs',
      lead:
        'Some platforms can set up an agent in an afternoon, and some cases need more than that. We know both options '
        + 'from the inside, so we choose the one that fits your volume, your budget and your data, and change it if your case evolves.',
      levels: [
        {
          tag: 'Integrate',
          t: 'Off-the-shelf platforms, properly connected',
          d: "When speed and cost come first, we start from existing platforms and do what they don't: connect them to your systems, your data and your rules.",
          when: 'For validating quickly or moderate volumes.',
          tools: 'ElevenLabs · OpenAI · Deepgram · n8n',
        },
        {
          tag: 'Combine',
          t: 'Market models, custom logic',
          d: 'The best models available with a custom layer of orchestration, tools, quality checks and traceability. The critical parts stay in your hands.',
          when: 'When the AI has to work on your real processes.',
          tools: 'Claude · GPT · Bedrock · Langfuse',
        },
        {
          tag: 'Build',
          t: 'A complete solution on your servers',
          d: 'Every piece built and tuned, with open language models on your own GPU. Full control over privacy, latency and cost.',
          when: 'For sensitive data, high volumes or requirements nobody else covers.',
          tools: 'vLLM · Mistral · Whisper · Asterisk',
        },
      ],
      note: 'Many projects start by integrating and only move to custom development where it adds value. No lock-in to any provider.',
    },
    voice: {
      eyebrow: 'Specialty: voice agents',
      title: 'Inside a voice agent',
      lead:
        'Two years ago, an agent that holds a phone conversation in natural Spanish and replies in under 2 seconds was '
        + 'within reach of very few companies. Today it is viable for a hotel chain or a construction company, as long as these six '
        + 'pieces work together in real time. We have built and integrated all of them in a project with real calls.',
      stages: [
        { t: 'Telephony', d: 'The call comes in through your phone system or number, without changing carrier.', tech: 'SIP · Asterisk · codecs' },
        { t: 'Audio', d: 'Cleans up the sound: echo cancellation, noise reduction and volume control.', tech: 'AEC · NS · AGC' },
        { t: 'Listens', d: 'Transcribes in real time and detects when the caller has finished speaking.', tech: 'Streaming STT' },
        { t: 'Reasons', d: 'Understands the request, looks up your information and decides what to do.', tech: 'LLM · RAG · tools' },
        { t: 'Speaks', d: 'Replies in a natural voice, and stops talking if the caller interrupts.', tech: 'TTS · interruptions' },
        { t: 'Measures', d: 'Every turn is traced: latency, quality and errors, so it improves with real calls.', tech: 'Tracing · metrics' },
      ],
      total: '< 2 s',
      totalLabel: 'end to end, from the moment the caller stops speaking until they hear the reply',
      points: [
        'Natural Spanish: turn-taking, tone and vocabulary tuned on real calls',
        'Can run entirely on your servers, with no audio leaving your network',
        'Connected to your systems to resolve things, not just to answer',
      ],
      cta: 'See the voice agents service',
    },
    services: {
      eyebrow: 'Services',
      title: 'Six services, one standard: it has to work in your business',
      lead: 'Agents that talk and write, documents that process themselves, automated bookkeeping, and the software and cloud they run on.',
    },
    why: {
      eyebrow: 'Why work with us',
      title: 'We know AI inside out. And we know how a business works.',
      lead: 'That combination lets us design the solution that fits your business and choose the most viable option in each case, instead of always selling the same tool.',
      items: [
        { t: 'AI, from the inside', d: 'We deploy, tune and evaluate models, not just use them. We know what each tool can do and where it fails.' },
        { t: 'Business, from the inside', d: 'Eight years in companies across very different sectors. We understand processes, costs and constraints before proposing technology.' },
        { t: 'Production engineering', d: 'Platforms with 100,000+ users, 1,000+ real-time sensors and automated deployments. What we deliver keeps working.' },
        { t: 'Direct contact', d: 'You talk directly to whoever designs and builds the solution. No hand-offs, no sales layers.' },
      ],
    },
    stats: [
      { n: '−80%', l: 'admin hours spent on invoice handling' },
      { n: '90%', l: 'of invoice bookkeeping automated' },
      { n: '< 2 s', l: 'for our voice agent to reply, on real calls' },
      { n: 'Seconds', l: 'to read an invoice and prepare its journal entry' },
      { n: '2 months', l: 'from zero to AI in production for a product team' },
      { n: '100,000+', l: "users on the platform we're migrating" },
      { n: '6', l: 'sectors: contact centres, industry, energy, online learning, restaurants and accounting' },
      { n: '8+', l: 'years of production software' },
    ],
    process: {
      eyebrow: 'How we work',
      title: 'Start small, measure, then grow',
      lead: 'Only what has proven to work gets scaled up. Before we start, you have the scope, the pilot price and an estimate of running costs in writing.',
      steps: [
        { t: 'Assessment', when: '30 minutes', d: 'We get to know what you want to improve and tell you honestly whether AI makes sense there.' },
        { t: 'Focused pilot', when: '2–4 weeks', d: 'One real use case, a measurable goal agreed upfront and a fixed price.' },
        { t: 'Roll-out', when: 'Depends on scope', d: 'Integration with your systems, security, testing and training for your team.' },
        { t: 'Ongoing support', when: 'Monthly', d: 'We make sure it keeps working, measure the results and improve it based on real use.' },
      ],
    },
    work: {
      eyebrow: 'Work',
      title: 'Real work, real figures',
      lead: 'Projects we have been responsible for from start to finish. Clients are named by sector for confidentiality.',
      featured: ['gestoia', 'contact-centre', 'migration'],
    },
    sectors: {
      eyebrow: 'Sectors',
      title: 'Where it fits',
      lead: 'The same services adapt to very different businesses. Some typical cases:',
      items: [
        { t: 'Hotels and tourism', d: 'Phone bookings and enquiries at any hour, supplier invoices for each property and instant answers on group terms.' },
        { t: 'Construction and real estate', d: 'Delivery notes and invoices assigned to each site, progress portals for clients and searchable technical documents.' },
        { t: 'Accounting and law firms', d: 'Invoices and receipts turned into journal entries, and quick answers about client files.' },
        { t: 'Industry and energy', d: 'Sensors, alerts and plant data in real time, with an assistant that answers questions about them.' },
        { t: 'Healthcare and regulated sectors', d: 'Voice and AI running on your own servers, with data never leaving the building.' },
        { t: 'Retail and services', d: 'Customer service, orders and integrations between the tools you already use.' },
      ],
    },
    about: {
      eyebrow: 'About',
      title: "Hi, I'm Salvador",
      body:
        "Telecommunications engineer with a master's in electronic systems. I started out designing hardware and have spent eight years "
        + 'building production software: cloud platforms, real-time data and, today, applied artificial '
        + 'intelligence. I work remotely from Spain for clients in any country.',
      cta: 'Read my background',
      facts: ['AWS Certified DevOps Engineer – Professional', "Master's in Electronic Systems (UPM)", 'Native Spanish · professional English'],
    },
    faq: {
      eyebrow: 'Questions',
      title: 'What people usually ask us',
      items: [
        { q: 'Do you only build voice agents?', a: 'No. Voice is one of our specialties, but we build all kinds of AI solutions (text agents, documents, search over your information, self-hosted models) and whatever software, integrations and cloud are needed.' },
        { q: 'Do you use platforms like ElevenLabs or OpenAI?', a: "When they're the best option, yes. We have evaluated them against custom development and know when they fit and when they don't: if you need more privacy, higher volume or more control, we build that piece to measure." },
        { q: 'Do I need a technical team?', a: 'No. We handle the technical side from start to finish and explain every decision in plain language. If you do have a team, we work alongside them.' },
        { q: 'How much does it cost?', a: 'It depends on the scope. After our first conversation we propose a pilot with a fixed scope and price, with an estimate of running costs (models, telephony, servers).' },
        { q: 'Do you work with companies outside Spain?', a: 'Yes. We work remotely with companies in any country, in English or Spanish, and fit meetings around your time zone.' },
        { q: 'What happens to my data?', a: 'It stays under your control. Where needed, the systems run on your own servers and the data never leaves your network.' },
      ],
    },
    blog: {
      eyebrow: 'Technical blog',
      title: 'For your technical team',
      lead: 'Articles on taking AI into production, in case someone on your team wants to see how we think.',
      cta: 'See all articles',
    },
  },

  services: {
    meta: {
      title: 'Services — AI agents, documents, invoicing, custom software and cloud',
      description:
        'Applied AI and custom development services for businesses: voice agents, conversational agents, '
        + 'document processing, automated invoicing, custom software and cloud infrastructure.',
    },
    hero: {
      eyebrow: 'Services',
      title: 'Applied AI and custom software, with results you can measure',
      lead: 'Each service solves a specific problem in your business and is built with the most viable option for your case. AI projects start with a focused pilot; infrastructure work starts with an audit.',
    },
    listTitle: 'What we can do for your business',
    sections: {
      problem: 'The problem',
      how: 'How it works',
      includes: "What's included",
      outcomes: 'What you get',
      fit: 'Where it fits',
    },
    also: {
      title: 'We also work on',
      items: [
        { t: 'Models on your servers', d: 'Deployment, optimisation and evaluation of open AI models on your own infrastructure.' },
        { t: 'AI for your technical team', d: 'Bringing AI into your development team with good practices, traceability and quality checks.' },
        { t: 'Technical audits', d: 'A review of the security, costs and architecture of your systems, with a prioritised improvement plan.' },
        { t: 'Hardware and sensors', d: 'Connected devices end to end: electronics, firmware and wireless communication.' },
      ],
    },
    items: [
      {
        id: 'voice',
        name: 'Voice agents',
        title: 'Voice agents that answer, understand and resolve',
        tagline: 'Custom phone agents that answer at any hour and resolve or route calls according to your rules.',
        lead:
          'We build complete voice agents: they answer calls in a natural voice, understand what the caller wants and sort it '
          + 'out on the spot (bookings, enquiries, appointments, follow-ups) or hand the call to a person. We can start '
          + 'from an off-the-shelf platform or build the agent piece by piece on your servers, depending on what your case needs.',
        videoLabel: 'Animation: an incoming call, the transcribed conversation and the booking recorded in the system.',
        meta: {
          title: 'AI voice agents for businesses',
          description: 'Custom voice agents that answer calls in a natural voice and handle bookings and enquiries on your systems, in the cloud or on your servers.',
        },
        problem: [
          'Missed calls out of hours or at peak times: customers who go elsewhere.',
          'Skilled staff answering the same questions over and over.',
          '“Press 1” phone menus or generic assistants that sound robotic and resolve nothing.',
        ],
        how: [
          { t: 'Listens', d: "Turns the caller's speech into text in real time, in Spanish and other languages depending on the case." },
          { t: 'Understands', d: 'A language model works out the request and looks up the information it needs.' },
          { t: 'Acts', d: 'Records the booking or enquiry, or transfers the call to a person along with the context.' },
          { t: 'Replies', d: 'Answers in a natural voice in under 2 seconds, and can be interrupted just like a person.' },
        ],
        includes: [
          'Choice of architecture: platform, combined or fully custom',
          "Conversation design in your brand's tone of voice",
          'Connection to your phone system or number',
          'Integration with your booking system, CRM or ERP',
          'Transfer to a person when needed',
          'Transcripts and a dashboard to review every call',
          'Testing with real calls before opening it to customers',
        ],
        outcomes: [
          'Calls handled out of hours and at peak times; whatever it cannot resolve is passed on or noted down',
          'Your team spends its time on the cases that really need it',
          'Every call is logged and can be reviewed',
        ],
        fit: [
          { t: 'Hotels and tourism', d: 'Bookings and common questions outside reception hours.' },
          { t: 'Clinics and healthcare', d: 'Appointment management, with the data kept on your servers.' },
          { t: 'Customer service', d: 'A first line that handles the routine and passes on the rest.' },
        ],
        stack: ['SIP · Asterisk', 'Whisper · Deepgram', 'vLLM · Mistral', 'Claude · GPT', 'Piper · ElevenLabs', 'OpenAI Realtime', 'Langfuse'],
        caseId: 'contact-centre',
        faq: [
          { q: 'Does it sound like a robot?', a: 'No. It uses natural voices and is tuned for fluent conversation: it replies in under 2 seconds and can be interrupted.' },
          { q: 'Do you build it with ElevenLabs, Vapi or similar?', a: "If that's the most viable option, yes. But we also build the complete agent (telephony, audio, speech recognition and synthesis, an open language model on your GPU) when you need more privacy, higher volume or a level of control those platforms don't give you." },
          { q: 'Which languages does it work in?', a: 'Our production experience is in Spanish. Other languages, such as English, are configured and validated during the pilot with test calls.' },
          { q: 'Do the conversations leave my company?', a: 'It can run in the cloud or on your own servers. In the on-premises version, neither the audio nor the data leaves your network.' },
        ],
      },
      {
        id: 'assistant',
        name: 'Conversational agents',
        title: 'Agents that know your business and get the work done',
        tagline: 'They answer from your information, cite the source and carry out tasks in your systems.',
        lead:
          'Text-based agents for your team or your customers, on your website, in internal chat or in messaging channels. They answer '
          + 'from your manuals, contracts and procedures, citing the source, and they also act: they check availability, '
          + "log orders or incidents and alert the right person. If the answer isn't in your documents, they say so.",
        videoLabel: 'Animation: a question about the cancellation policy and the answer with its source.',
        meta: {
          title: 'Custom conversational AI agents',
          description: "Text agents that answer from your company's knowledge, cite the source and carry out tasks in your systems.",
        },
        problem: [
          'Knowledge is scattered across folders, emails and the heads of a few people.',
          'The same internal questions keep interrupting the same experts.',
          "Generic chatbots make up answers that sound right and aren't.",
        ],
        how: [
          { t: 'Connects', d: 'Your documents (PDFs, Word files, wikis, shared folders) and the systems it has to act on.' },
          { t: 'Organises', d: 'Splits and indexes the information so the exact passage can be found.' },
          { t: 'Searches', d: 'Combines keyword and meaning-based search, and ranks results by relevance.' },
          { t: 'Answers and acts', d: 'Replies citing the document and page, and carries out the task in your systems if needed.' },
        ],
        includes: [
          'Connection to your document sources and your systems',
          'Channel of your choice: web, internal chat, messaging or email',
          'Hybrid search and relevance re-ranking',
          'Answers that cite the document and page',
          'Control over who can look up what',
          'Quality testing with real questions from your team',
        ],
        outcomes: [
          'Fewer interruptions for your experts',
          'Consistent answers across the whole team',
          'A clear view of what is missing from your documentation',
        ],
        fit: [
          { t: 'Hotels', d: 'Group and event terms, internal procedures.' },
          { t: 'Construction', d: 'Tender specifications, regulations and site procedures.' },
          { t: 'Customer service', d: 'Answers always based on the current policy.' },
        ],
        stack: ['RAG', 'Hybrid search', 'Reranking', 'Qdrant', 'Claude · Bedrock', 'Tool calling', 'Langfuse'],
        caseId: 'industrial',
        faq: [
          { q: 'Can it make up answers?', a: 'It is designed to answer only from what it finds in your documents and to cite the source. We measure its accuracy with real questions before it goes into use.' },
          { q: 'Where are my documents stored?', a: "In your cloud or on your servers. If an external model is used, we choose one that doesn't train on your data." },
          { q: 'Does it need maintaining?', a: 'When your documents change, the index updates automatically. Monthly support includes reviewing the quality of the answers.' },
        ],
      },
      {
        id: 'docs',
        name: 'Document processing',
        title: 'Documents that read and file themselves',
        tagline: 'Invoices, delivery notes and contracts read, checked and recorded without typing a thing.',
        lead:
          'A system that receives your documents (by email, scanned or photographed), works out what they are, pulls out the '
          + "data that matters and records it in your systems. Anything unclear goes to a person; the rest doesn't.",
        videoLabel: 'Animation: a scanned delivery note is read and its data appears extracted and checked.',
        meta: {
          title: 'Automated document processing with AI',
          description: 'Automatic reading of invoices, delivery notes and contracts: data extracted, checked and recorded in your systems, with a person reviewing anything uncertain.',
        },
        problem: [
          'Hours every week copying data from PDFs into spreadsheets or the ERP.',
          'Typing errors that only surface at month-end.',
          'Documents that are hard to find when someone needs them.',
        ],
        how: [
          { t: 'Receives', d: 'From an email inbox, a shared folder or a direct upload.' },
          { t: 'Classifies', d: "Recognises whether it's an invoice, a delivery note, a contract or a work report." },
          { t: 'Extracts', d: 'Reads the supplier, dates, amounts, site or project, and any other data you need.' },
          { t: 'Checks and records', d: 'Checks the data against your rules and saves it in your system. Anything doubtful goes for review.' },
        ],
        includes: [
          'Analysis of your document types and the data you need',
          'Reading of PDFs, scans and photos',
          'Validation rules specific to your business',
          'A review queue for uncertain cases',
          'Integration with your ERP, spreadsheet or database',
          'Every data point linked to its original document',
        ],
        outcomes: [
          'Up to 80% fewer admin hours',
          'Data available the same day the document arrives',
          'Traceability: every data point can be checked against its source in one click',
        ],
        fit: [
          { t: 'Construction', d: 'Delivery notes and supplier invoices assigned to each site.' },
          { t: 'Hotels', d: 'Supplier invoices for each property.' },
          { t: 'Law and accounting firms', d: 'Client paperwork sorted as soon as it arrives.' },
        ],
        stack: ['OCR', 'Language models', 'Rule-based validation', 'Python', 'PostgreSQL', 'AWS'],
        caseId: 'gestoia',
        live: { label: 'Live example: GestoIA', href: 'https://gestoia.es' },
        faq: [
          { q: 'Does it work with scanned documents or photos?', a: "Yes. It reads PDFs, scans and photos. Anything it can't read reliably is flagged for review instead of being recorded." },
          { q: 'What if it gets something wrong?', a: 'Every extracted data point comes with a confidence level. Below the threshold we agree on, a person checks it before it is recorded.' },
          { q: 'Do I have to change my management software?', a: 'In most cases, no. The system adapts to your tools and puts the data where you already work.' },
        ],
      },
      {
        id: 'billing',
        name: 'Invoicing and bookkeeping',
        title: 'Incoming invoices turned into bookkeeping',
        tagline: 'From the supplier invoice to a balanced journal entry, ready to export.',
        lead:
          'We automate the step that eats the most admin time: going from an incoming invoice to a journal entry. It is the basis of '
          + 'GestoIA, our own product for accounting firms, and it adapts to companies with a high volume of supplier invoices.',
        videoLabel: 'Animation: incoming invoices turned into a balanced, exported journal entry.',
        meta: {
          title: 'Invoice and bookkeeping automation with AI',
          description: 'Supplier invoices read and turned into balanced journal entries, with the invoice linked and export to your accounting software.',
        },
        problem: [
          'Hundreds of invoices a month keyed in by hand.',
          'Month-end closes that drag on for days.',
          'Account or tax errors that carry through to the audit.',
        ],
        how: [
          { t: 'Collects', d: 'Invoices arrive by email or in bulk uploads.' },
          { t: 'Reads', d: 'Supplier, date, taxable amount, taxes and total.' },
          { t: 'Books', d: 'Suggests the account based on supplier and description, and prepares the balanced entry.' },
          { t: 'Exports', d: 'To the accounting software you already use, with the invoice linked to each entry.' },
        ],
        includes: [
          'Bulk upload of invoices and receipts',
          'Account classification by supplier and description',
          'Balanced entries with their invoice linked',
          'Batch review and correction of exceptions',
          'Export to your accounting software',
          'Change log for audits',
        ],
        outcomes: [
          'Up to 90% of invoice bookkeeping automated',
          'Books kept up to date without keying in data by hand',
          'Faster month-end closes',
          'Every entry can be audited against its invoice',
        ],
        fit: [
          { t: 'Accounting firms', d: 'Clients with a high volume of invoices and receipts.' },
          { t: 'Hotel groups', d: 'Supplier invoices from several properties, in one place.' },
          { t: 'Construction companies', d: 'Supplier costs allocated to each site.' },
        ],
        stack: ['OCR', 'Language models', 'Python', 'Next.js', 'PostgreSQL', 'AWS'],
        caseId: 'gestoia',
        live: { label: 'Live example: GestoIA', href: 'https://gestoia.es' },
        faq: [
          { q: "Does it work with my country's rules?", a: "It is configured with your country's chart of accounts and taxes during the assessment, and validated in the pilot." },
          { q: 'Which accounting software does it work with?', a: 'It exports in common import formats. Integration with your specific software is validated during the pilot.' },
          { q: 'Who checks its work?', a: 'You decide. The usual approach is to review in batches and correct only the exceptions the system flags.' },
        ],
      },
      {
        id: 'custom',
        name: 'Custom development',
        title: "The software your operation needs and can't find off the shelf",
        tagline: 'Custom applications, integrations and data platforms, with AI where it helps.',
        lead:
          "Not every problem needs an AI agent. We have spent over eight years building production systems: web applications "
          + 'and internal dashboards, APIs, integrations between systems, real-time data platforms and even hardware. '
          + "If your case doesn't fit any category, tell us about it: chances are we can build it.",
        videoLabel: 'Animation: a need described in one sentence becomes a construction site portal with progress updates and alerts.',
        meta: {
          title: 'Custom software development for businesses',
          description: 'Web applications, internal dashboards, APIs, integrations and real-time data platforms, with AI where it adds value.',
        },
        problem: [
          'Processes that live in spreadsheets and emails because no tool fits.',
          "Systems that don't talk to each other, and someone copying data from one to the other.",
          'Legacy software that nobody knows how to maintain any more.',
        ],
        how: [
          { t: 'Understand', d: 'Your process, who uses it and what cannot fail.' },
          { t: 'Design', d: 'The smallest useful scope and the architecture, in writing.' },
          { t: 'Build', d: 'Frequent releases you can try out from the first few weeks.' },
          { t: 'Maintain', d: 'Deployed automatically, monitored and documented.' },
        ],
        includes: [
          'Web applications, customer portals and internal dashboards',
          'APIs and integrations with your ERP, CRM or booking system',
          'Real-time data platforms: sensors, alerts and dashboards',
          'Process automation with n8n or custom code, whichever suits',
          'Modernising legacy systems without taking them offline',
          'Documentation and handover to your team',
        ],
        outcomes: [
          'A tool built around your process, not the other way round',
          'Data that moves between systems on its own',
          'Software that your team, or anyone else, can maintain',
        ],
        fit: [
          { t: 'Construction', d: 'Site control, progress and costs per project, with a client portal.' },
          { t: 'Hotels', d: 'Integrations between bookings, sales channels and accounting.' },
          { t: 'Industry', d: 'Sensors, telemetry and real-time alerts.' },
        ],
        stack: ['Python', 'Node.js · NestJS', 'Next.js · React', 'PostgreSQL', 'MQTT · IoT', 'n8n', 'AWS · Azure'],
        caseId: 'industrial',
        faq: [
          { q: 'Do you take on projects without AI?', a: 'Yes. Most of our work over the years has been software without AI; we only use AI where it helps.' },
          { q: 'What if my sector is new to you?', a: 'It has happened several times and we learn fast. The first few weeks are for understanding your operation before writing any code.' },
          { q: 'Who maintains it afterwards?', a: 'We do, with monthly support, or your team does: we leave it documented and defined as code.' },
        ],
      },
      {
        id: 'infra',
        name: 'Cloud infrastructure',
        title: 'Your cloud, organised, automated and under control',
        tagline: 'AWS and Azure automated, secure and with spending monitored. Migrations planned in phases.',
        lead:
          'We design, set up and maintain the infrastructure your applications run on. Everything defined as code, with automated '
          + 'deployments, backups, alerts and costs kept in check.',
        videoLabel: 'Animation: a change goes through testing and automated deployment and reaches the cloud.',
        meta: {
          title: 'Cloud infrastructure on AWS and Azure',
          description: 'Infrastructure as code, automated deployments, migrations and cost control on AWS and Azure. AWS Certified DevOps Engineer – Professional.',
        },
        problem: [
          'Nerve-racking manual deployments done in the middle of the night.',
          'Cloud bills that keep growing and nobody knows why.',
          'Infrastructure that only one person understands.',
        ],
        how: [
          { t: 'Audit', d: 'Current state, security risks and where the money goes.' },
          { t: 'Design', d: 'Target architecture and a phased plan of changes.' },
          { t: 'Automation', d: 'Infrastructure as code and automated, tested deployments.' },
          { t: 'Operations', d: 'Monitoring, alerts, backups and cost optimisation.' },
        ],
        includes: [
          'Infrastructure, security and cost audit',
          'Infrastructure as code with Terraform',
          'Automated, tested deployments (CI/CD)',
          'Containers and Kubernetes where they make sense',
          'Backups, monitoring and alerts',
          'Phased migrations between providers',
        ],
        outcomes: [
          'Deployments in hours instead of days',
          'Cloud costs visible and under control',
          "Documented infrastructure that doesn't depend on a single person",
        ],
        fit: [
          { t: 'Companies with their own systems', d: 'Booking sites, customer portals, internal applications.' },
          { t: 'Migrations', d: 'Moving to AWS or Azure, or from one to the other, with minimal, planned downtime.' },
          { t: 'Teams without a specialist', d: 'Infrastructure managed by the people who built it.' },
        ],
        stack: ['AWS', 'Azure', 'Terraform', 'Kubernetes', 'Docker', 'GitHub Actions · Azure DevOps'],
        caseId: 'deploys',
        faq: [
          { q: 'Do you work with both AWS and Azure?', a: 'Yes. Salvador holds the AWS Certified DevOps Engineer – Professional certification, and we are leading a full migration from AWS to Azure, in phases.' },
          { q: 'Do we have to take the service offline to migrate?', a: 'Usually not. The migration happens in phases, testing each part before moving live traffic.' },
          { q: 'Can I hire you just for an audit?', a: 'Yes. It is the usual starting point: a report covering risks, costs and quick wins, plus a prioritised plan.' },
        ],
      },
    ],
  },

  work: {
    meta: {
      title: 'Work — voice agents, data platforms, AI in production and cloud migrations',
      description: 'Real applied AI and software projects: a private voice agent, a real-time sensor platform, an AWS to Azure migration, AI in production and more.',
    },
    hero: {
      eyebrow: 'Work',
      title: "What we've built",
      lead: 'Projects we have been responsible for from start to finish, each with its challenge, solution and result.',
    },
    note: 'For confidentiality, clients are described by sector.',
    product: {
      eyebrow: 'Own product · available',
      title: 'GestoIA: invoices turned into bookkeeping',
      body:
        'Alongside client projects, we have GestoIA, our own product, already live, for accounting firms: it reads invoices and receipts '
        + 'and prepares the journal entries. You can see it working at gestoia.es. It is the basis of our document processing and '
        + 'invoicing services, and the same technology adapts to each country\'s chart of accounts and taxes.',
      points: ['Automatic reading of invoices and receipts', 'Account classification and journal entries in seconds', 'Exception review and traceability for every entry'],
      link: { label: 'See GestoIA live', href: 'https://gestoia.es' },
    },
    items: [
      {
        id: 'contact-centre',
        sector: 'Business call centre',
        title: "Private voice agent on the client's own servers",
        metric: '< 2 s',
        metricLabel: 'response time, end to end',
        summary: "A complete Spanish-language voice agent, connected to the phone system and tested on real calls, with no data leaving the client's network.",
        challenge: 'The client wanted to automate phone support on one non-negotiable condition: no conversation could leave their network.',
        solution:
          'We built the agent on top of their phone system: speech recognition, an open language model and speech synthesis on '
          + 'their own GPU, with audio processing, natural interruption, search across their documentation and traceability for every turn.',
        result: "Real calls handled end to end with responses in under 2 seconds, in natural Spanish and with all data kept inside the client's network.",
        stack: ['Asterisk', 'faster-whisper', 'vLLM', 'Mistral', 'Piper', 'Qdrant', 'Langfuse'],
        services: ['voice'],
      },
      {
        id: 'industrial',
        sector: 'Industry',
        title: 'Real-time data platform with an AI assistant',
        metric: '1,000+',
        metricLabel: 'connected sensors',
        summary: 'An industrial telemetry platform with real-time alerts and an assistant that answers questions about and acts on the live data.',
        challenge: 'A data platform maintained by more than 20 engineers was handed to a small team after a company restructuring.',
        solution:
          'We took over the platform and led the team: real-time data ingestion on AWS, validation and routing of time series, '
          + 'detection of critical events and alerts, a data lake for the data science team and an AI assistant on the live data.',
        result: 'The platform kept running and evolving with a fraction of the original team.',
        stack: ['AWS Lambda', 'IoT Core', 'S3 · Glue · Athena', 'Terraform', 'Node.js', 'Python'],
        services: ['assistant', 'custom', 'infra'],
      },
      {
        id: 'migration',
        sector: 'Online learning platform',
        title: 'Full migration from AWS to Azure',
        metric: '100,000+',
        metricLabel: 'users on the platform',
        summary: 'A learning platform with several independent clients, being moved from AWS to Azure in phases.',
        challenge: 'Moving a platform with more than 100,000 users to another cloud provider without disrupting any of its clients.',
        solution: 'A new platform on Kubernetes in Azure, with all infrastructure defined in Terraform and automated deployments. Migration one client at a time.',
        result: 'In progress, in phases: each client is migrated and validated independently.',
        stack: ['Azure', 'AKS · Kubernetes', 'Terraform', 'Azure DevOps', 'Docker'],
        services: ['infra'],
      },
      {
        id: 'deploys',
        sector: 'Multinational energy company',
        title: 'Infrastructure as code and automated deployments',
        metric: '1 hour',
        metricLabel: 'per deployment (was one week)',
        summary: 'From week-long manual deployments to a one-hour automated process, for a platform serving several clients.',
        challenge: "Every deployment of the platform was manual and took a week's work.",
        solution: 'We moved all the infrastructure to Terraform and automated the deployments in Azure DevOps.',
        result: 'Deployment time dropped from a week to an hour.',
        stack: ['Terraform', 'Azure DevOps', 'AWS', 'Azure'],
        services: ['infra'],
      },
      {
        id: 'ai-bootstrap',
        sector: 'Restaurant software',
        title: 'AI in production from scratch',
        metric: '2 months',
        metricLabel: 'from zero to production',
        summary: 'Getting a product team started with AI: platform, traceability, quality checks and ways of working.',
        challenge: 'A product team wanted to add AI to its software with no previous experience of taking it into production.',
        solution:
          'We chose and introduced the platform (AWS Bedrock with Claude models), with traceability and evaluation in Langfuse, and set '
          + 'up the working patterns: tool calling, structured output, prompt versioning, content and personal data filters, and regression tests.',
        result: 'AI in production in two months, on a foundation the team adopted.',
        stack: ['AWS Bedrock', 'Claude', 'Langfuse', 'Python', 'Django'],
        services: ['assistant'],
      },
      {
        id: 'agency-audit',
        sector: 'Digital agency',
        title: 'Technical audit and development with AI agents',
        metric: 'Audit',
        metricLabel: 'security, costs and agent-based development',
        summary: "A full audit of an agency's software, fixes for its security risks and a method that lets a non-technical team build with AI agents.",
        challenge: 'An agency with many internal applications, no in-house technical team and undetected security risks.',
        solution:
          'An audit of all their software, fixes for the most serious security flaws, consolidated infrastructure to '
          + 'cut costs, and a spec-driven development workflow with AI agents, reviews and checks.',
        result: 'Critical risks fixed, infrastructure unified and a non-technical team able to evolve its own software with AI agents.',
        stack: ['Next.js', 'Supabase', 'Vercel', 'Claude Code', 'OpenSpec'],
        services: ['custom', 'infra'],
      },
      {
        id: 'gestoia',
        sector: 'Own product · GestoIA',
        title: 'Invoices turned into bookkeeping',
        metric: '90%',
        metricLabel: 'of invoice bookkeeping automated',
        summary: 'Automatic reading of invoices and receipts and preparation of journal entries: 90% of the work automated and 80% fewer admin hours.',
        challenge: 'Accounting firms spend much of the month keying in invoices and receipts by hand.',
        solution: 'Automatic reading (OCR + AI) that classifies each document, suggests the account and prepares the journal entry, with exception review.',
        result: '90% of invoice bookkeeping automated and 80% fewer admin hours, with every entry linked to its invoice for audit.',
        stack: ['OCR', 'Language models', 'Python', 'Next.js', 'PostgreSQL', 'AWS S3'],
        services: ['docs', 'billing'],
        link: { label: 'gestoia.es', href: 'https://gestoia.es' },
      },
    ],
  },

  about: {
    meta: {
      title: 'About — Salvador F. Criado, applied AI specialist',
      description: 'Telecommunications engineer with eight years of production software: cloud platforms, real-time data and applied artificial intelligence.',
    },
    hero: {
      eyebrow: 'About',
      title: 'An engineer from start to finish',
      lead:
        "I'm Salvador F. Criado, an applied AI specialist and software engineer. You work directly "
        + 'with me, from the first conversation until the solution is up and running.',
      portraitAlt: 'Salvador F. Criado, applied AI specialist, in Granada, Spain',
    },
    story: {
      title: 'My background',
      paragraphs: [
        "I'm a telecommunications engineer with a master's in electronic systems. I started very close to the metal, designing "
        + 'circuit boards and writing firmware, and worked my way up from there: microservices, real-time data platforms and '
        + 'cloud systems with hundreds of thousands of users.',
        'I have worked as an employee for companies in industry, energy and education, and since 2025 as an independent consultant '
        + 'in phone support, online learning, restaurant software and digital agencies. I get up to speed quickly with each '
        + 'business because the underlying problems are similar: data that needs moving, processes that need automating and '
        + 'systems that cannot fail.',
        'Today I focus on applied artificial intelligence: voice and text agents, documents, search over a company\'s '
        + 'knowledge and models on its own servers. I know AI from the inside and I know how businesses work; that double '
        + 'perspective is what lets me propose the most viable solution in each case, and one that keeps working after the demo ends.',
      ],
    },
    timeline: {
      title: 'Experience',
      items: [
        { when: '2025 — today', role: 'Applied AI specialist · independent', org: 'AI agents, software and infrastructure', d: "A voice agent on a client's own servers, AI taken into production, technical audits and cloud migrations." },
        { when: '2024 — 2025', role: 'Lead Software Engineer', org: 'Industrial data platform · United Kingdom', d: 'Responsible for the 1,000+ sensor platform and its AI assistant after the team was restructured.' },
        { when: '2022 — 2024', role: 'Software Engineer', org: 'Technology consultancy', d: 'Infrastructure as code for a multinational energy company, a large-scale learning platform and filtering of critical alerts.' },
        { when: '2018 — 2022', role: 'Full-stack Engineer', org: 'IoT product', d: 'Software and hardware end to end: microservices, wireless sensors and firmware.' },
        { when: '2017 — 2018', role: 'Researcher', org: 'Technical University of Madrid (UPM)', d: 'A network of ultra-low-power devices for healthcare.' },
      ],
    },
    principles: {
      title: 'How we work',
      items: [
        { t: 'Start small and measure', d: 'A focused pilot with a clear goal before any large project.' },
        { t: 'Technical honesty', d: "If AI doesn't make sense for your problem, we'll tell you, even if that means the project doesn't happen." },
        { t: 'Your data, under your control', d: 'Privacy and security built in from the design stage, not bolted on at the end.' },
        { t: 'Maintainable systems', d: "Everything documented and defined as code, so it doesn't depend on a single person, not even on whoever built it." },
      ],
    },
    credentials: {
      title: 'Education and certifications',
      items: [
        { k: 'Certification', v: 'AWS Certified DevOps Engineer – Professional' },
        { k: 'Certification', v: 'Certified ScrumMaster' },
        { k: 'AI training', v: 'Agentic AI and Retrieval Augmented Generation — DeepLearning.AI' },
        { k: "Master's", v: 'Electronic Systems — Technical University of Madrid' },
        { k: 'Degree', v: 'Telecommunications Engineering — University of Granada' },
        { k: 'Languages', v: 'Spanish (native) · English (professional) · French (basic)' },
      ],
    },
  },

  cv: {
    meta: {
      title: 'Experience — Salvador F. Criado, applied AI specialist',
      description: 'Projects, capabilities, technology and education of Salvador F. Criado: applied AI, software, real-time data and cloud infrastructure.',
    },
    hero: {
      eyebrow: 'Experience',
      title: "What I've built, and with what",
      lead: 'A summary of projects, capabilities and technology to help you judge whether I fit yours. Each entry says what was delivered, not just the job title.',
    },
    summary: [
      'Applied AI specialist and software engineer with over eight years building production systems. I have taken '
      + 'projects from start to finish in phone support, industry, energy, online learning, '
      + 'hospitality and accounting.',
      'My foundation is the engineering that keeps things running every day (cloud, real-time data, integrations, '
      + 'automation), and on top of it I build the AI layer: voice and text agents, documents, search over a '
      + "company's knowledge and models on its own servers.",
    ],
    labels: {
      experience: 'Projects and experience',
      skills: 'Capabilities and technology',
      domains: "Sectors I've worked in",
      education: 'Education',
      certs: 'Certifications',
      languages: 'Languages',
      delivered: 'What I delivered',
      print: 'Print',
    },
    experience: [
      {
        when: '2025 — 2026',
        role: 'Private voice agent',
        context: 'Business call centre · independent consultant',
        delivered: [
          "Complete Spanish-language voice agent, connected to the client's phone system",
          "Speech recognition, open language model and speech synthesis on the client's GPU, with no data leaving their network",
          'Audio processing, turn detection, interruptions and search across documentation',
          'Per-turn traceability and responses in under 2 seconds, tested on real calls',
        ],
        tags: ['Asterisk', 'faster-whisper', 'vLLM', 'Mistral', 'Piper', 'Qdrant', 'Langfuse'],
      },
      {
        when: '2026 — today',
        role: 'AWS to Azure migration',
        context: 'Online learning platform · 100,000+ users · independent consultant',
        delivered: [
          'New platform on Kubernetes (AKS) in Azure',
          'All infrastructure in Terraform and automated deployments in Azure DevOps',
          'Phased migration, one client at a time (in progress)',
        ],
        tags: ['Azure', 'AKS', 'Terraform', 'Azure DevOps', 'PHP · Laravel', 'Moodle'],
      },
      {
        when: '2026',
        role: 'Technical audit and development with AI agents',
        context: 'Digital agency · independent consultant',
        delivered: [
          'Audit of all their software: security, costs and architecture',
          'Fixes for the most serious security flaws and consolidation of the infrastructure',
          'A method for a non-technical team to develop with AI agents, with reviews and checks',
        ],
        tags: ['Next.js', 'Supabase', 'Vercel', 'Claude Code', 'OpenSpec'],
      },
      {
        when: '2026',
        role: 'AI in production from scratch',
        context: 'Restaurant software · independent consultant',
        delivered: [
          'Selected and introduced AWS Bedrock with Claude models, and Langfuse for traceability and evaluation',
          'Team working patterns: tool calling, structured output, prompt versioning, personal data filters and regression tests',
        ],
        tags: ['AWS Bedrock', 'Claude', 'Langfuse', 'Python', 'Django'],
      },
      {
        when: '2026 — today',
        role: 'GestoIA · own product, live',
        context: 'Bookkeeping automation for accounting firms',
        delivered: [
          'Automatic reading of invoices and receipts (OCR + AI)',
          'Account classification and journal entries prepared in seconds, with exception review',
        ],
        tags: ['Python', 'Next.js', 'OCR', 'LLM', 'PostgreSQL', 'AWS'],
      },
      {
        when: '2024 — 2025',
        role: 'Lead Software Engineer',
        context: 'Industrial data platform · United Kingdom, remote',
        delivered: [
          'Responsible, with a small team, for a platform previously maintained by more than 20 engineers',
          'Real-time ingestion from 1,000+ sensors on AWS, with critical event detection and alerts',
          'Data lake and tooling for the data science team',
          'AI assistant that queries and acts on the live data',
        ],
        tags: ['AWS Lambda', 'IoT Core', 'S3 · Glue · Athena', 'SQS', 'Terraform', 'Node.js', 'Python'],
      },
      {
        when: '2022 — 2024',
        role: 'Software Engineer',
        context: 'Technology consultancy · multinational energy company',
        delivered: [
          'Infrastructure as code and automated deployments for several clients: from a week to an hour',
          'Filtering of critical alerts over MQTT at more than 1,000 signals per second',
          'ElasticSearch search engine for a learning platform with 80,000+ users per client',
        ],
        tags: ['Terraform', 'Azure DevOps', 'NestJS', 'MQTT', 'ElasticSearch', 'PHP · Laravel · Vue'],
      },
      {
        when: '2018 — 2022',
        role: 'Full-stack Engineer',
        context: 'IoT product · Granada',
        delivered: [
          'Migration from a monolith to microservices: queries over ten years of data in under 30 seconds',
          'New line of wireless sensors end to end: electronics, circuit board, C firmware and BLE Mesh network',
        ],
        tags: ['Node.js', 'NestJS', 'Ruby on Rails', 'Angular', 'MongoDB', 'PostgreSQL', 'C', 'Altium'],
      },
      {
        when: '2017 — 2018',
        role: 'Researcher',
        context: 'Technical University of Madrid (UPM)',
        delivered: ['Network of ultra-low-power e-ink displays for healthcare: hardware, wireless protocol and server'],
        tags: ['C', 'BLE', 'Node.js', 'Linux'],
      },
    ],
    skills: [
      { t: 'Applied AI', items: ['Real-time voice agents', 'Agents with tools and multi-step workflows', 'RAG: hybrid search, reranking and evaluation', 'OCR and document processing', 'Self-hosted models: vLLM, Triton, quantisation', 'Evaluation and traceability: Langfuse, golden sets', 'AI security: filters, personal data, OWASP LLM'] },
      { t: 'AI models and platforms', items: ['Claude · AWS Bedrock', 'OpenAI', 'Mistral and open models', 'Whisper · Deepgram · ElevenLabs', 'LangGraph · LangChain · LlamaIndex', 'Qdrant', 'n8n'] },
      { t: 'Software', items: ['Python', 'TypeScript · Node.js · NestJS', 'Next.js · React · Angular · Vue', 'PHP · Laravel', 'PostgreSQL · MySQL · MongoDB', 'ElasticSearch', 'REST and GraphQL APIs'] },
      { t: 'Data and real time', items: ['Event-driven architectures', 'Time series', 'MQTT · IoT', 'AWS IoT Core · Lambda · SQS', 'Data lake: S3 · Glue · Athena', 'Apache Airflow'] },
      { t: 'Cloud and DevOps', items: ['AWS', 'Azure · AKS', 'Terraform', 'Kubernetes · Docker · Helm', 'CI/CD: GitHub Actions · Azure DevOps', 'Observability and cost control'] },
      { t: 'Hardware', items: ['Circuit board design (Altium)', 'Firmware in C and MicroPython', 'BLE · BLE Mesh'] },
    ],
    domains: ['Phone support', 'Industry', 'Energy', 'Online learning', 'Hospitality', 'Accounting', 'Digital agencies', 'Healthcare (research)'],
    education: [
      { k: '2017 — 2018', v: "Master's in Electronic Systems — Technical University of Madrid" },
      { k: '2013 — 2017', v: "Bachelor's in Telecommunications Engineering — University of Granada" },
    ],
    certs: [
      { k: '2022', v: 'AWS Certified DevOps Engineer – Professional' },
      { k: '2023', v: 'Certified ScrumMaster' },
      { k: '2026', v: 'Agentic AI · Retrieval Augmented Generation · Orchestrating Workflows for GenAI — DeepLearning.AI' },
      { k: '2026', v: 'Introduction to LangGraph — LangChain Academy' },
    ],
    languages: 'Spanish (native) · English (professional) · French (basic)',
  },

  contact: {
    meta: {
      title: "Contact — let's talk about your project",
      description: 'Tell us what you want to solve or build. A first 30-minute conversation.',
    },
    hero: {
      eyebrow: 'Contact',
      title: "Let's talk about your project",
      lead: "Tell us what you want to solve or build and we'll suggest a first 30-minute conversation.",
    },
    channels: {
      email: { t: 'Email', d: 'The most direct route. Tell us about your case in as much detail as you like.' },
      linkedin: { t: 'LinkedIn', d: "Send a message or look through Salvador's full background." },
      dossier: { t: 'PDF dossier', d: 'A summary of services and projects to share with your team.' },
    },
    include: {
      title: 'What to tell us in your first message',
      items: [
        'What your company does and its approximate size',
        'What you want to improve or build',
        'The tools or systems you use today',
        'Deadlines or key dates, if any',
      ],
    },
    next: {
      title: 'What happens next',
      steps: [
        { t: 'We reply', d: 'With specific questions about your case, or straight away with a suggested call.' },
        { t: 'Assessment call', d: '30 minutes to understand the problem and see which solution makes sense.' },
        { t: 'Written proposal', d: 'Scope, timeline and a fixed price for the pilot, with an estimate of running costs.' },
      ],
    },
    hours: {
      t: 'Working hours',
      d: 'We work on Spanish time and adapt to yours: with the Americas, meetings happen in your morning.',
    },
  },

  dossier: {
    meta: {
      title: 'Services dossier — Salvador F. Criado',
      description: "An overview of Salvador F. Criado's capabilities, services, projects and way of working as an applied artificial intelligence specialist.",
    },
    kicker: 'Services dossier',
    title: 'Applied artificial intelligence and custom software for businesses',
    subtitle: 'Salvador F. Criado · Applied AI specialist and software engineer · Granada, Spain, working remotely',
    print: 'Print',
    download: 'Download PDF',
    sections: {
      services: 'Services',
      work: 'Work',
      process: 'How we work',
      about: 'About',
      contact: 'Contact',
    },
    contactLead: 'We reply with specific questions or a suggested 30-minute call.',
  },
};
