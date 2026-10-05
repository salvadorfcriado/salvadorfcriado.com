/* Copy del sitio en español. Escrito para quien decide traer a Salvador a un
   proyecto —dueño, director de operaciones, gerente—, no para un ingeniero, y
   legible igual en España que en Latinoamérica (sin «albarán», «centralita»,
   «festivos» ni vosotros).

   Posicionamiento: especialista en IA aplicada de espectro completo —agentes de
   voz y de texto, documentos, datos, modelos propios— con ocho años de software
   en producción detrás, que le permiten construir lo que haga falta alrededor.

   Reglas de honestidad (ver career/career.md del hub y la memoria del proyecto):
   - Los clientes se describen por sector, nunca por nombre.
   - El agente de voz funciona de extremo a extremo con llamadas reales; NO se
     presenta como en producción a escala, ni con integración CRM terminada.
   - La migración a Azure está en curso. GestoIA está publicado y a la venta (gestoia.es).
   - Los ejemplos de servicio y de los vídeos son ilustrativos; los casos de
     /proyectos/ son reales. Las cifras salen de career.md. */
import type { SiteCopy } from './types';

export const es: SiteCopy = {
  nav: {
    services: 'Servicios',
    work: 'Proyectos',
    about: 'Sobre mí',
    cv: 'Trayectoria',
    blog: 'Blog',
    contact: 'Contacto',
    cta: 'Hablemos',
    menu: 'Menú',
    close: 'Cerrar',
    allServices: 'Ver todos los servicios',
    servicesIntro: 'Especialista en IA aplicada',
  },
  common: {
    learnMore: 'Ver el proyecto',
    viewService: 'Ver servicio',
    viewAllWork: 'Ver todos los proyectos',
    contactCta: 'Hablemos de tu proyecto',
    downloadDossier: 'Descargar dossier (PDF)',
    backToServices: 'Todos los servicios',
    otherServices: 'Otros servicios',
    relatedCase: 'Proyecto relacionado',
    faqTitle: 'Preguntas frecuentes',
    stack: 'Tecnología',
    challenge: 'Reto',
    solution: 'Solución',
    result: 'Resultado',
    mailSubject: 'Proyecto',
    mailBody:
      'Hola:\n\nEmpresa y sector:\nQué queremos mejorar o construir:\nHerramientas que usamos hoy:\nPlazos:\n\nGracias.',
    example: 'Ejemplo',
  },
  footer: {
    tagline: 'Especialista en inteligencia artificial aplicada y desarrollo de software a medida. En remoto desde Granada (España), para empresas de cualquier país.',
    servicesCol: 'Servicios',
    companyCol: 'Más',
    resourcesCol: 'Recursos',
    rss: 'RSS',
    rights: 'Todos los derechos reservados.',
  },
  cta: {
    title: 'Cuéntanos qué quieres resolver.',
    lead: 'Una primera conversación de 30 minutos basta para saber si podemos ayudarte y cómo. Sin compromiso.',
    primary: 'Escríbenos',
    secondary: 'Descargar dossier',
  },

  capabilities: {
    eyebrow: 'Todo el espectro',
    title: 'De la idea a producción, en cualquier punto del camino',
    lead:
      'La IA rara vez llega sola: necesita datos, integraciones, software y una infraestructura que la sostenga. Nos ocupamos '
      + 'de todo ello, así que podemos encargarnos de un proyecto completo o de la pieza que te falta.',
    groups: [
      {
        t: 'Agentes de IA',
        d: 'Conversan, deciden y actúan.',
        items: [
          { icon: 'phone', t: 'Agentes de voz', d: 'Atienden llamadas con voz natural y resuelven o derivan según tus reglas.' },
          { icon: 'chat', t: 'Agentes conversacionales', d: 'En tu web, en el chat interno o en mensajería, con tu información y tus herramientas.' },
          { icon: 'flow', t: 'Agentes de procesos', d: 'Encadenan pasos, consultan tus sistemas y piden aprobación a una persona cuando toca.' },
        ],
      },
      {
        t: 'IA sobre tus datos',
        d: 'Lee, encuentra y entiende.',
        items: [
          { icon: 'doc', t: 'Documentos', d: 'Facturas, contratos y formularios leídos, validados y registrados.' },
          { icon: 'search', t: 'Conocimiento de la empresa', d: 'Respuestas sobre tus manuales y contratos, citando la fuente.' },
          { icon: 'cpu', t: 'Modelos en tus servidores', d: 'Modelos abiertos desplegados, optimizados y medidos en tu propia infraestructura.' },
          { icon: 'lock', t: 'Seguridad y control', d: 'Protección de datos personales, filtros, trazabilidad y evaluación continua.' },
          { icon: 'users', t: 'IA en tu equipo', d: 'Puesta en marcha de la IA en tu equipo técnico, con buenas prácticas y formación.' },
        ],
      },
      {
        t: 'Software, datos e infraestructura',
        d: 'Lo que hace que todo funcione.',
        items: [
          { icon: 'code', t: 'Software a medida', d: 'Aplicaciones web, paneles internos y APIs.' },
          { icon: 'layers', t: 'Integraciones', d: 'CRM, ERP, reservas y contabilidad conectados, con n8n o con código propio.' },
          { icon: 'chart', t: 'Datos en tiempo real', d: 'Sensores, telemetría, alertas y paneles de control.' },
          { icon: 'cloud', t: 'Infraestructura cloud', d: 'AWS y Azure definidos como código, con despliegues automáticos y costes vigilados.' },
          { icon: 'shield', t: 'Auditoría técnica', d: 'Seguridad, costes y arquitectura, con un plan de mejoras priorizado.' },
        ],
      },
    ],
    custom: {
      t: '¿Tu caso no encaja en ninguna casilla?',
      d:
        'Es lo habitual. Hemos trabajado en atención telefónica, industria, energía, formación, restauración y contabilidad, y '
        + 'aprendemos rápido cómo funciona cada negocio. Cuéntanoslo y te diremos con franqueza si encajamos con lo que necesitas.',
      cta: 'Cuéntanos tu caso',
    },
  },

  home: {
    meta: {
      title: 'Salvador F. Criado — Especialista en IA aplicada: agentes, automatización y software a medida',
      description:
        'Especialista en inteligencia artificial aplicada para empresas: agentes de voz y de texto, documentos, '
        + 'automatización, modelos propios y el software y la nube que lo sostienen.',
    },
    hero: {
      badge: 'Disponible para nuevos proyectos',
      pre: 'IA aplicada que ',
      accent: 'atiende, lee y automatiza',
      post: ' dentro de tu empresa.',
      lead:
        'Somos especialistas en inteligencia artificial aplicada. Desarrollamos agentes de voz y de texto, automatizamos documentos '
        + 'y procesos, conectamos la IA con tus sistemas y construimos el software y la nube que lo sostienen. Más de ocho años '
        + 'de software en producción: si tu proyecto lo necesita, lo construimos.',
      primary: 'Hablemos de tu proyecto',
      secondary: 'Ver qué podemos hacer',
      trust: ['Especialista en IA aplicada', '8+ años de software en producción', 'Piloto con alcance y precio acordados'],
      cardA: { k: '< 2 s', v: 'respuesta del agente de voz' },
      cardB: { k: 'Tus datos', v: 'dentro de tu red' },
    },
    tech: 'Tecnología con la que trabajamos',
    approach: {
      eyebrow: 'Nuestro enfoque',
      title: 'Integrar, combinar o construir: según lo que pida tu negocio',
      lead:
        'Hay plataformas que montan un agente en una tarde y hay casos en los que eso no basta. Conocemos las dos opciones '
        + 'por dentro, así que elegimos la que encaja con tu volumen, tu presupuesto y tus datos, y la cambiamos si tu caso evoluciona.',
      levels: [
        {
          tag: 'Integrar',
          t: 'Plataformas del mercado, bien conectadas',
          d: 'Cuando la rapidez y el coste mandan, partimos de plataformas existentes y hacemos lo que ellas no hacen: conectarlas a tus sistemas, tus datos y tus reglas.',
          when: 'Para validar rápido o volúmenes moderados.',
          tools: 'ElevenLabs · OpenAI · Deepgram · n8n',
        },
        {
          tag: 'Combinar',
          t: 'Modelos del mercado, lógica propia',
          d: 'Los mejores modelos disponibles con una capa propia de orquestación, herramientas, controles de calidad y trazabilidad. Lo crítico queda en tus manos.',
          when: 'Cuando la IA tiene que trabajar sobre tus procesos reales.',
          tools: 'Claude · GPT · Bedrock · Langfuse',
        },
        {
          tag: 'Construir',
          t: 'Solución completa en tus servidores',
          d: 'Cada pieza desarrollada y ajustada, con modelos de lenguaje abiertos en tu propia GPU. Control total de privacidad, latencia y coste.',
          when: 'Para datos sensibles, mucho volumen o requisitos que nadie cubre.',
          tools: 'vLLM · Mistral · Whisper · Asterisk',
        },
      ],
      note: 'Muchos proyectos empiezan integrando y llevan a desarrollo propio solo lo que aporta valor. Sin atarte a un proveedor.',
    },
    voice: {
      eyebrow: 'Especialidad: agentes de voz',
      title: 'Por dentro de un agente de voz',
      lead:
        'Hace dos años, un agente que conversa por teléfono en español natural y responde en menos de 2 segundos estaba '
        + 'al alcance de muy pocas empresas. Hoy es viable para una cadena hotelera o una constructora, siempre que estas seis '
        + 'piezas funcionen juntas y en tiempo real. Las hemos construido e integrado todas en un proyecto con llamadas reales.',
      stages: [
        { t: 'Telefonía', d: 'La llamada entra por tu central telefónica o tu número, sin cambiar de operador.', tech: 'SIP · Asterisk · códecs' },
        { t: 'Audio', d: 'Limpia el sonido: cancelación de eco, reducción de ruido y control de volumen.', tech: 'AEC · NS · AGC' },
        { t: 'Escucha', d: 'Transcribe en tiempo real y detecta cuándo el cliente ha terminado de hablar.', tech: 'STT en streaming' },
        { t: 'Razona', d: 'Entiende la petición, consulta tu información y decide qué hacer.', tech: 'LLM · RAG · herramientas' },
        { t: 'Habla', d: 'Responde con voz natural y se calla si el cliente le interrumpe.', tech: 'TTS · interrupciones' },
        { t: 'Mide', d: 'Cada turno queda trazado: latencia, calidad y errores, para mejorar con llamadas reales.', tech: 'Tracing · métricas' },
      ],
      total: '< 2 s',
      totalLabel: 'de extremo a extremo, desde que el cliente termina de hablar hasta que oye la respuesta',
      points: [
        'Español natural: turnos, tono y vocabulario ajustados con llamadas reales',
        'Puede funcionar entero en tus servidores, sin que el audio salga de tu red',
        'Conectado a tus sistemas para resolver, no solo para contestar',
      ],
      cta: 'Ver el servicio de agentes de voz',
    },
    services: {
      eyebrow: 'Servicios',
      title: 'Seis servicios, un mismo criterio: que funcione en tu negocio',
      lead: 'Agentes que hablan y escriben, documentos que se procesan solos, contabilidad automatizada y el software y la nube que lo sostienen.',
    },
    why: {
      eyebrow: 'Por qué con nosotros',
      title: 'Conocemos a fondo la IA. Y conocemos cómo funciona una empresa.',
      lead: 'Esa combinación nos permite diseñar la solución que encaja con tu negocio y elegir en cada caso la opción más viable, en lugar de vender siempre la misma herramienta.',
      items: [
        { t: 'La IA, por dentro', d: 'Desplegamos, optimizamos y evaluamos modelos, no solo los usamos. Sabemos qué puede hacer cada herramienta y dónde falla.' },
        { t: 'El negocio, por dentro', d: 'Ocho años en empresas de sectores muy distintos. Entendemos procesos, costes y restricciones antes de proponer tecnología.' },
        { t: 'Ingeniería de producción', d: 'Plataformas con 100.000+ usuarios, 1.000+ sensores en tiempo real y despliegues automatizados. Lo que entregamos sigue funcionando.' },
        { t: 'Trato directo', d: 'Hablas con quien diseña y construye la solución. Sin traspasos ni capas comerciales.' },
      ],
    },
    stats: [
      { n: '−80 %', l: 'de horas administrativas en la gestión de facturas' },
      { n: '90 %', l: 'de la contabilidad de facturas automatizada' },
      { n: '< 2 s', l: 'tarda nuestro agente de voz en responder, con llamadas reales' },
      { n: 'Segundos', l: 'para leer una factura y preparar su asiento contable' },
      { n: '2 meses', l: 'de cero a IA en producción en un equipo de producto' },
      { n: '100.000+', l: 'usuarios en la plataforma que estamos migrando' },
      { n: '6', l: 'sectores: atención telefónica, industria, energía, formación, restauración y contabilidad' },
      { n: '8+', l: 'años de software en producción' },
    ],
    process: {
      eyebrow: 'Cómo trabajamos',
      title: 'Empezar pequeño, medir y crecer',
      lead: 'Solo se amplía lo que ha demostrado funcionar. Antes de empezar tienes por escrito el alcance, el precio del piloto y una estimación de los costes de uso.',
      steps: [
        { t: 'Diagnóstico', when: '30 minutos', d: 'Entendemos lo que quieres mejorar y te decimos con franqueza si la IA tiene sentido ahí.' },
        { t: 'Piloto acotado', when: '2–4 semanas', d: 'Un caso real, un objetivo medible acordado antes de empezar y un precio cerrado.' },
        { t: 'Puesta en marcha', when: 'Según alcance', d: 'Integración con tus sistemas, seguridad, pruebas y formación de tu equipo.' },
        { t: 'Acompañamiento', when: 'Mensual', d: 'Vigilamos que siga funcionando, medimos resultados y lo mejoramos con el uso real.' },
      ],
    },
    work: {
      eyebrow: 'Proyectos',
      title: 'Trabajo real, con cifras reales',
      lead: 'Proyectos de los que hemos sido responsables de principio a fin. Los clientes aparecen por sector, por confidencialidad.',
      featured: ['gestoia', 'contact-centre', 'migration'],
    },
    sectors: {
      eyebrow: 'Sectores',
      title: 'Dónde encaja',
      lead: 'Los mismos servicios se adaptan a negocios muy distintos. Algunos casos típicos:',
      items: [
        { t: 'Hoteles y turismo', d: 'Reservas y consultas por teléfono a cualquier hora, facturas de proveedores de cada establecimiento y respuestas al momento sobre condiciones de grupos.' },
        { t: 'Construcción e inmobiliaria', d: 'Notas de entrega y facturas asignadas a cada obra, portales de avance para clientes y documentación técnica consultable.' },
        { t: 'Firmas contables y despachos', d: 'Facturas y recibos convertidos en asientos contables, y consultas rápidas sobre expedientes.' },
        { t: 'Industria y energía', d: 'Sensores, alertas y datos de planta en tiempo real, con un asistente que responde sobre ellos.' },
        { t: 'Salud y sectores regulados', d: 'Voz e IA funcionando en tus servidores, sin que los datos salgan de casa.' },
        { t: 'Comercio y servicios', d: 'Atención a clientes, pedidos e integraciones entre las herramientas que ya usas.' },
      ],
    },
    about: {
      eyebrow: 'Sobre mí',
      title: 'Hola, soy Salvador',
      body:
        'Ingeniero de telecomunicación con máster en sistemas electrónicos. Empecé diseñando hardware y llevo ocho años '
        + 'construyendo software en producción: plataformas cloud, datos en tiempo real y, hoy, inteligencia artificial '
        + 'aplicada. Trabajo en remoto desde España para clientes de cualquier país.',
      cta: 'Conoce mi trayectoria',
      facts: ['AWS Certified DevOps Engineer – Professional', 'Máster en Sistemas Electrónicos (UPM)', 'Español nativo · inglés profesional'],
    },
    faq: {
      eyebrow: 'Preguntas',
      title: 'Lo que suelen preguntarnos',
      items: [
        { q: '¿Solo desarrollan agentes de voz?', a: 'No. La voz es una de nuestras especialidades, pero desarrollamos todo tipo de soluciones de IA (agentes de texto, documentos, búsqueda sobre tu información, modelos propios) y el software, las integraciones y la nube que hagan falta.' },
        { q: '¿Usan plataformas como ElevenLabs u OpenAI?', a: 'Cuando son la mejor opción, sí. Las hemos evaluado frente al desarrollo propio y sabemos cuándo encajan y cuándo no: si hace falta más privacidad, más volumen o más control, desarrollamos la pieza a medida.' },
        { q: '¿Necesito tener un equipo técnico?', a: 'No. Nos encargamos de la parte técnica de principio a fin y te explicamos cada decisión en lenguaje claro. Si tienes equipo, trabajamos con él.' },
        { q: '¿Cuánto cuesta?', a: 'Depende del alcance. Tras la primera conversación te proponemos un piloto con alcance y precio cerrados, con una estimación de los costes de uso (modelos, telefonía, servidores).' },
        { q: '¿Trabajan con empresas fuera de España?', a: 'Sí. Trabajamos en remoto con empresas de cualquier país, en español o en inglés, y adaptamos el horario de las reuniones.' },
        { q: '¿Qué pasa con mis datos?', a: 'Se quedan bajo tu control. Cuando hace falta, los sistemas funcionan en tus propios servidores y los datos no salen de tu red.' },
      ],
    },
    blog: {
      eyebrow: 'Blog técnico',
      title: 'Para tu equipo técnico',
      lead: 'Artículos sobre cómo llevar IA a producción, por si alguien de tu equipo quiere ver cómo pensamos.',
      cta: 'Ver todos los artículos',
    },
  },

  services: {
    meta: {
      title: 'Servicios — agentes de IA, documentos, facturación, software a medida y cloud',
      description:
        'Servicios de IA aplicada y desarrollo a medida para empresas: agentes de voz, agentes conversacionales, '
        + 'procesamiento de documentos, facturación automática, software a medida e infraestructura cloud.',
    },
    hero: {
      eyebrow: 'Servicios',
      title: 'IA aplicada y software a medida, con resultados que se pueden medir',
      lead: 'Cada servicio resuelve un problema concreto de tu empresa y se construye con la opción más viable para tu caso. Los proyectos de IA empiezan con un piloto acotado; la infraestructura, con una auditoría.',
    },
    listTitle: 'Qué podemos hacer por tu empresa',
    sections: {
      problem: 'El problema',
      how: 'Cómo funciona',
      includes: 'Qué incluye',
      outcomes: 'Qué consigues',
      fit: 'Dónde encaja',
    },
    also: {
      title: 'También trabajamos en',
      items: [
        { t: 'Modelos en tus servidores', d: 'Despliegue, optimización y evaluación de modelos de IA abiertos en tu propia infraestructura.' },
        { t: 'IA para tu equipo técnico', d: 'Puesta en marcha de la IA en tu equipo de desarrollo, con buenas prácticas, trazabilidad y controles de calidad.' },
        { t: 'Auditorías técnicas', d: 'Revisión de seguridad, costes y arquitectura de tus sistemas, con un plan de mejoras priorizado.' },
        { t: 'Hardware y sensores', d: 'Dispositivos conectados de extremo a extremo: electrónica, firmware y comunicación inalámbrica.' },
      ],
    },
    items: [
      {
        id: 'voice',
        name: 'Agentes de voz',
        title: 'Agentes de voz que atienden, entienden y resuelven',
        tagline: 'Agentes telefónicos a medida que atienden a cualquier hora y resuelven o derivan según tus reglas.',
        lead:
          'Desarrollamos agentes de voz completos: atienden llamadas con voz natural, entienden lo que pide el cliente y lo '
          + 'resuelven en el momento (reservas, consultas, citas, seguimiento) o pasan la llamada a una persona. Podemos partir '
          + 'de una plataforma del mercado o construir el agente pieza a pieza en tus servidores, según lo que tu caso necesite.',
        videoLabel: 'Animación: una llamada entrante, la conversación transcrita y la reserva registrada en el sistema.',
        meta: {
          title: 'Agentes de voz con IA para empresas',
          description: 'Agentes de voz a medida que atienden llamadas con voz natural y resuelven reservas y consultas sobre tus sistemas, en la nube o en tus servidores.',
        },
        problem: [
          'Llamadas perdidas fuera de horario o en horas punta: clientes que se van a otro sitio.',
          'Personal cualificado contestando una y otra vez las mismas preguntas.',
          'Menús de “pulse 1” o asistentes genéricos que suenan a robot y no resuelven nada.',
        ],
        how: [
          { t: 'Escucha', d: 'Convierte la voz de quien llama en texto en tiempo real, en español y en otros idiomas según el caso.' },
          { t: 'Entiende', d: 'Un modelo de lenguaje interpreta la petición y consulta la información que necesita.' },
          { t: 'Actúa', d: 'Registra la reserva o la consulta, o pasa la llamada a una persona con el contexto.' },
          { t: 'Responde', d: 'Contesta con voz natural en menos de 2 segundos, y se le puede interrumpir como a una persona.' },
        ],
        includes: [
          'Elección de arquitectura: plataforma, combinada o desarrollo completo',
          'Diseño de las conversaciones y del tono de tu marca',
          'Conexión con tu central telefónica o tu número',
          'Integración con tu sistema de reservas, CRM o ERP',
          'Transferencia a una persona cuando hace falta',
          'Transcripción y panel para revisar cada llamada',
          'Pruebas con llamadas reales antes de abrirlo a clientes',
        ],
        outcomes: [
          'Atención fuera de horario y en horas punta; lo que no resuelve se deriva o queda anotado',
          'Tu equipo dedica su tiempo a los casos que de verdad lo necesitan',
          'Cada llamada queda registrada y se puede revisar',
        ],
        fit: [
          { t: 'Hoteles y turismo', d: 'Reservas y preguntas frecuentes fuera del horario de recepción.' },
          { t: 'Clínicas y salud', d: 'Gestión de citas, con los datos en tus servidores.' },
          { t: 'Atención al cliente', d: 'Primera línea que resuelve lo habitual y deriva lo demás.' },
        ],
        stack: ['SIP · Asterisk', 'Whisper · Deepgram', 'vLLM · Mistral', 'Claude · GPT', 'Piper · ElevenLabs', 'OpenAI Realtime', 'Langfuse'],
        caseId: 'contact-centre',
        faq: [
          { q: '¿Suena como un robot?', a: 'No. Usa voces naturales y está ajustado para conversar con fluidez: responde en menos de 2 segundos y se le puede interrumpir.' },
          { q: '¿Lo montan con ElevenLabs, Vapi o similares?', a: 'Si es lo más viable, sí. Pero también desarrollamos el agente completo (telefonía, audio, reconocimiento y síntesis de voz, modelo de lenguaje abierto en tu GPU) cuando hace falta más privacidad, más volumen o un control que esas plataformas no dan.' },
          { q: '¿En qué idiomas funciona?', a: 'Nuestra experiencia en producción es en español. Otros idiomas, como el inglés, se configuran y se validan durante el piloto con llamadas de prueba.' },
          { q: '¿Las conversaciones salen de mi empresa?', a: 'Puede funcionar en la nube o en tus propios servidores. En la versión en tus servidores, ni el audio ni los datos salen de tu red.' },
        ],
      },
      {
        id: 'assistant',
        name: 'Agentes conversacionales',
        title: 'Agentes que conocen tu empresa y hacen el trabajo',
        tagline: 'Responden con tu información, citan la fuente y ejecutan tareas en tus sistemas.',
        lead:
          'Agentes de texto para tu equipo o tus clientes, en tu web, en el chat interno o en canales de mensajería. Responden '
          + 'a partir de tus manuales, contratos y procedimientos, citando la fuente, y además actúan: consultan disponibilidad, '
          + 'registran pedidos o incidencias y avisan a la persona adecuada. Si la respuesta no está en tus documentos, lo dicen.',
        videoLabel: 'Animación: una pregunta sobre la política de cancelación y la respuesta con su fuente.',
        meta: {
          title: 'Agentes conversacionales de IA a medida',
          description: 'Agentes de texto que responden con el conocimiento de tu empresa, citan la fuente y ejecutan tareas en tus sistemas.',
        },
        problem: [
          'El conocimiento está repartido entre carpetas, correos y la cabeza de unas pocas personas.',
          'Las mismas consultas internas interrumpen a los mismos expertos.',
          'Los chatbots genéricos inventan respuestas que suenan bien y no lo son.',
        ],
        how: [
          { t: 'Conecta', d: 'Tus documentos (PDF, Word, wikis, carpetas compartidas) y los sistemas sobre los que debe actuar.' },
          { t: 'Organiza', d: 'Divide e indexa la información para encontrar el fragmento exacto.' },
          { t: 'Busca', d: 'Combina búsqueda por palabras y por significado, y ordena los resultados por relevancia.' },
          { t: 'Responde y actúa', d: 'Contesta citando documento y página, y ejecuta la tarea en tus sistemas si hace falta.' },
        ],
        includes: [
          'Conexión con tus fuentes de documentos y tus sistemas',
          'Canal a elegir: web, chat interno, mensajería o email',
          'Búsqueda híbrida y reordenación por relevancia',
          'Respuestas con cita del documento y la página',
          'Control de quién puede consultar qué',
          'Evaluación de la calidad con preguntas reales de tu equipo',
        ],
        outcomes: [
          'Menos interrupciones a tus expertos',
          'Respuestas coherentes en todo el equipo',
          'Saber qué información falta en tu documentación',
        ],
        fit: [
          { t: 'Hoteles', d: 'Condiciones de grupos y eventos, procedimientos internos.' },
          { t: 'Construcción', d: 'Pliegos, normativa y procedimientos de obra.' },
          { t: 'Atención al cliente', d: 'Respuestas basadas siempre en la política vigente.' },
        ],
        stack: ['RAG', 'Búsqueda híbrida', 'Reranking', 'Qdrant', 'Claude · Bedrock', 'Llamadas a herramientas', 'Langfuse'],
        caseId: 'industrial',
        faq: [
          { q: '¿Puede inventarse respuestas?', a: 'Está diseñado para responder solo con lo que encuentra en tus documentos y citar la fuente. Medimos su precisión con preguntas reales antes de ponerlo en uso.' },
          { q: '¿Dónde se guardan mis documentos?', a: 'En tu nube o en tus servidores. Si se usa un modelo externo, se elige uno que no utilice tus datos para entrenar.' },
          { q: '¿Hay que mantenerlo?', a: 'Cuando cambian los documentos, el índice se actualiza de forma automática. El acompañamiento mensual incluye revisar la calidad de las respuestas.' },
        ],
      },
      {
        id: 'docs',
        name: 'Procesamiento de documentos',
        title: 'Documentos que se leen y se registran solos',
        tagline: 'Facturas, notas de entrega y contratos leídos, validados y registrados sin teclear un dato.',
        lead:
          'Un sistema que recibe tus documentos (por email, escaneados o fotografiados), identifica qué son, extrae los datos '
          + 'que importan y los registra en tus sistemas. Lo que no está claro pasa a una persona; el resto, no.',
        videoLabel: 'Animación: una nota de entrega escaneada se lee y sus datos aparecen extraídos y validados.',
        meta: {
          title: 'Procesamiento automático de documentos con IA',
          description: 'Lectura automática de facturas, notas de entrega y contratos: datos extraídos, validados y registrados en tus sistemas, con revisión humana de lo dudoso.',
        },
        problem: [
          'Horas cada semana copiando datos de PDF a hojas de cálculo o al ERP.',
          'Errores de tecleo que se descubren al cerrar el mes.',
          'Documentos difíciles de encontrar cuando alguien los necesita.',
        ],
        how: [
          { t: 'Recibe', d: 'Desde una bandeja de email, una carpeta compartida o una subida directa.' },
          { t: 'Clasifica', d: 'Detecta si es una factura, una nota de entrega, un contrato o un reporte de trabajo.' },
          { t: 'Extrae', d: 'Lee proveedor, fechas, importes, obra o proyecto y cualquier dato que necesites.' },
          { t: 'Valida y registra', d: 'Comprueba los datos con tus reglas y los guarda en tu sistema. Lo dudoso, a revisión.' },
        ],
        includes: [
          'Análisis de tus tipos de documento y de los datos que necesitas',
          'Lectura de PDF, escaneos y fotografías',
          'Reglas de validación propias de tu negocio',
          'Bandeja de revisión para los casos dudosos',
          'Integración con tu ERP, hoja de cálculo o base de datos',
          'Cada dato enlazado a su documento original',
        ],
        outcomes: [
          'Hasta un 80 % menos de horas administrativas',
          'Datos disponibles el mismo día que llega el documento',
          'Trazabilidad: cada dato se comprueba contra su origen en un clic',
        ],
        fit: [
          { t: 'Construcción', d: 'Notas de entrega y facturas de proveedores asignadas a cada obra.' },
          { t: 'Hoteles', d: 'Facturas de proveedores de cada establecimiento.' },
          { t: 'Firmas y despachos', d: 'Documentación de clientes clasificada al llegar.' },
        ],
        stack: ['OCR', 'Modelos de lenguaje', 'Validación con reglas', 'Python', 'PostgreSQL', 'AWS'],
        caseId: 'gestoia',
        live: { label: 'Ejemplo en funcionamiento: GestoIA', href: 'https://gestoia.es' },
        faq: [
          { q: '¿Funciona con documentos escaneados o fotos?', a: 'Sí. Lee PDF, escaneos y fotografías. Lo que no se puede leer con seguridad se marca para revisión en lugar de registrarse.' },
          { q: '¿Y si se equivoca?', a: 'Cada dato extraído lleva un nivel de confianza. Por debajo del umbral que acordemos, pasa por una persona antes de registrarse.' },
          { q: '¿Tengo que cambiar mi programa de gestión?', a: 'En la mayoría de casos, no. El sistema se adapta a tus herramientas y deja los datos donde ya trabajas.' },
        ],
      },
      {
        id: 'billing',
        name: 'Facturación y contabilidad',
        title: 'Facturas recibidas convertidas en contabilidad',
        tagline: 'De la factura del proveedor al asiento contable cuadrado, listo para exportar.',
        lead:
          'Automatizamos el paso que más horas consume en administración: de la factura recibida al asiento contable. Es la base de '
          + 'GestoIA, nuestro producto propio para firmas contables y gestorías, y se adapta a empresas con mucho volumen de facturas de proveedores.',
        videoLabel: 'Animación: facturas recibidas que se convierten en un asiento contable cuadrado y exportado.',
        meta: {
          title: 'Automatización de facturas y contabilidad con IA',
          description: 'Facturas de proveedores leídas y convertidas en asientos contables cuadrados, con la factura enlazada y exportación a tu programa contable.',
        },
        problem: [
          'Cientos de facturas al mes introducidas a mano.',
          'Cierres de mes que se alargan días.',
          'Errores de cuenta o de impuestos que se arrastran hasta la auditoría.',
        ],
        how: [
          { t: 'Recoge', d: 'Las facturas llegan por email o en carga masiva.' },
          { t: 'Lee', d: 'Proveedor, fecha, base imponible, impuestos y total.' },
          { t: 'Contabiliza', d: 'Propone la cuenta según proveedor y concepto y prepara el asiento cuadrado.' },
          { t: 'Exporta', d: 'Al programa contable que ya usas, con la factura enlazada a cada asiento.' },
        ],
        includes: [
          'Carga masiva de facturas y recibos',
          'Clasificación contable por proveedor y concepto',
          'Asientos cuadrados con su factura enlazada',
          'Revisión en lote y corrección de excepciones',
          'Exportación a tu programa contable',
          'Registro de cambios para auditoría',
        ],
        outcomes: [
          'Hasta un 90 % de la contabilidad de facturas automatizada',
          'Contabilidad al día sin teclear datos a mano',
          'Cierres de mes más rápidos',
          'Cada asiento auditable contra su factura',
        ],
        fit: [
          { t: 'Firmas contables', d: 'Clientes con mucho volumen de facturas y recibos.' },
          { t: 'Grupos hoteleros', d: 'Facturas de proveedores de varios establecimientos, centralizadas.' },
          { t: 'Constructoras', d: 'Costes de proveedores imputados a cada obra.' },
        ],
        stack: ['OCR', 'Modelos de lenguaje', 'Python', 'Next.js', 'PostgreSQL', 'AWS'],
        caseId: 'gestoia',
        live: { label: 'Ejemplo en funcionamiento: GestoIA', href: 'https://gestoia.es' },
        faq: [
          { q: '¿Sirve para la normativa de mi país?', a: 'Se configura con el catálogo de cuentas y los impuestos de tu país durante el diagnóstico, y se valida en el piloto.' },
          { q: '¿Con qué programas contables funciona?', a: 'Exporta en formatos de importación habituales. La integración con tu programa concreto se valida durante el piloto.' },
          { q: '¿Quién revisa lo que hace?', a: 'Tú decides. Lo habitual es revisar en lote y corregir solo las excepciones que el sistema marca.' },
        ],
      },
      {
        id: 'custom',
        name: 'Desarrollo a medida',
        title: 'El software que tu operación necesita y no encuentras hecho',
        tagline: 'Aplicaciones, integraciones y plataformas de datos a medida, con IA donde aporta.',
        lead:
          'No todo problema necesita un agente de IA. Llevamos más de ocho años construyendo sistemas en producción: aplicaciones '
          + 'web y paneles internos, APIs, integraciones entre sistemas, plataformas de datos en tiempo real e incluso hardware. '
          + 'Si tu caso no encaja en ninguna categoría, cuéntanoslo: lo más probable es que podamos construirlo.',
        videoLabel: 'Animación: una necesidad descrita en una frase se convierte en un portal de obras con avances y alertas.',
        meta: {
          title: 'Desarrollo de software a medida para empresas',
          description: 'Aplicaciones web, paneles internos, APIs, integraciones y plataformas de datos en tiempo real, con IA donde aporta valor.',
        },
        problem: [
          'Procesos que viven en hojas de cálculo y correos porque ninguna herramienta encaja.',
          'Sistemas que no se hablan entre sí y alguien copiando datos de uno a otro.',
          'Software heredado que hoy nadie sabe mantener.',
        ],
        how: [
          { t: 'Entender', d: 'Tu proceso, quién lo usa y qué no puede fallar.' },
          { t: 'Diseñar', d: 'El alcance mínimo útil y la arquitectura, por escrito.' },
          { t: 'Construir', d: 'Entregas frecuentes que puedes probar desde las primeras semanas.' },
          { t: 'Mantener', d: 'Desplegado de forma automática, monitorizado y documentado.' },
        ],
        includes: [
          'Aplicaciones web, portales de clientes y paneles internos',
          'APIs e integraciones con tu ERP, CRM o sistema de reservas',
          'Plataformas de datos en tiempo real: sensores, alertas y paneles',
          'Automatización de procesos con n8n o con código propio, según convenga',
          'Modernización de sistemas antiguos sin pararlos',
          'Documentación y traspaso a tu equipo',
        ],
        outcomes: [
          'Una herramienta hecha para tu proceso, no al revés',
          'Datos que pasan solos de un sistema a otro',
          'Software que puede mantener tu equipo o cualquier otro',
        ],
        fit: [
          { t: 'Construcción', d: 'Control de obra, avances y costes por proyecto, con portal para el cliente.' },
          { t: 'Hoteles', d: 'Integraciones entre reservas, canales de venta y contabilidad.' },
          { t: 'Industria', d: 'Sensores, telemetría y alertas en tiempo real.' },
        ],
        stack: ['Python', 'Node.js · NestJS', 'Next.js · React', 'PostgreSQL', 'MQTT · IoT', 'n8n', 'AWS · Azure'],
        caseId: 'industrial',
        faq: [
          { q: '¿Hacen proyectos sin IA?', a: 'Sí. La mayor parte de nuestra trayectoria ha sido software sin IA; usamos la IA solo donde aporta.' },
          { q: '¿Y si mi sector es nuevo para ustedes?', a: 'Nos ha pasado varias veces y aprendemos rápido. Las primeras semanas son para entender tu operación antes de escribir código.' },
          { q: '¿Quién lo mantiene después?', a: 'Nosotros, en acompañamiento mensual, o tu equipo: lo dejamos documentado y definido como código.' },
        ],
      },
      {
        id: 'infra',
        name: 'Infraestructura cloud',
        title: 'La nube, ordenada, automatizada y bajo control',
        tagline: 'AWS y Azure automatizados, seguros y con el gasto vigilado. Migraciones planificadas por fases.',
        lead:
          'Diseñamos, montamos y mantenemos la infraestructura donde funcionan tus aplicaciones. Todo definido como código, con despliegues '
          + 'automáticos, copias de seguridad, alertas y costes vigilados.',
        videoLabel: 'Animación: un cambio pasa por pruebas y despliegue automático y llega a la nube.',
        meta: {
          title: 'Infraestructura cloud en AWS y Azure',
          description: 'Infraestructura como código, despliegues automáticos, migraciones y control de costes en AWS y Azure. AWS Certified DevOps Engineer – Professional.',
        },
        problem: [
          'Despliegues manuales que dan miedo y se hacen de madrugada.',
          'Facturas de la nube que crecen sin que nadie sepa por qué.',
          'Infraestructura que solo entiende una persona.',
        ],
        how: [
          { t: 'Auditoría', d: 'Estado actual, riesgos de seguridad y dónde se va el dinero.' },
          { t: 'Diseño', d: 'Arquitectura objetivo y plan de cambios por fases.' },
          { t: 'Automatización', d: 'Infraestructura como código y despliegues automáticos con pruebas.' },
          { t: 'Operación', d: 'Monitorización, alertas, copias de seguridad y optimización de costes.' },
        ],
        includes: [
          'Auditoría de infraestructura, seguridad y costes',
          'Infraestructura como código con Terraform',
          'Despliegues automáticos con pruebas (CI/CD)',
          'Contenedores y Kubernetes cuando tiene sentido',
          'Copias de seguridad, monitorización y alertas',
          'Migraciones entre proveedores por fases',
        ],
        outcomes: [
          'Despliegues en horas en lugar de días',
          'Costes de la nube visibles y bajo control',
          'Infraestructura documentada que no depende de una sola persona',
        ],
        fit: [
          { t: 'Empresas con sistemas propios', d: 'Webs de reservas, portales de clientes, aplicaciones internas.' },
          { t: 'Migraciones', d: 'Pasar a AWS o Azure, o de uno a otro, con cortes mínimos y planificados.' },
          { t: 'Equipos sin especialista', d: 'Infraestructura gestionada por quien la ha construido.' },
        ],
        stack: ['AWS', 'Azure', 'Terraform', 'Kubernetes', 'Docker', 'GitHub Actions · Azure DevOps'],
        caseId: 'deploys',
        faq: [
          { q: '¿Trabajan con AWS y con Azure?', a: 'Sí. Salvador tiene la certificación AWS Certified DevOps Engineer – Professional y estamos llevando una migración completa de AWS a Azure, por fases.' },
          { q: '¿Hay que parar el servicio para migrar?', a: 'Normalmente no. Se migra por fases, probando cada parte antes de mover el tráfico real.' },
          { q: '¿Puedo contratar solo una auditoría?', a: 'Sí. Es el punto de entrada habitual: un informe con riesgos, costes y mejoras rápidas, y un plan priorizado.' },
        ],
      },
    ],
  },

  work: {
    meta: {
      title: 'Proyectos — agentes de voz, plataformas de datos, IA en producción y migraciones cloud',
      description: 'Proyectos reales de IA aplicada y software: agente de voz privado, plataforma de sensores en tiempo real, migración de AWS a Azure, IA en producción y más.',
    },
    hero: {
      eyebrow: 'Proyectos',
      title: 'Lo que hemos construido',
      lead: 'Proyectos de los que hemos sido responsables de principio a fin, con el reto, la solución y el resultado de cada uno.',
    },
    note: 'Por confidencialidad, los clientes aparecen descritos por su sector.',
    product: {
      eyebrow: 'Producto propio · disponible',
      title: 'GestoIA: facturas convertidas en contabilidad',
      body:
        'Además de los proyectos para clientes, tenemos GestoIA, un producto propio ya publicado para firmas contables que lee '
        + 'facturas y recibos y prepara los asientos contables. Puedes verlo funcionando en gestoia.es. Es la base de nuestros '
        + 'servicios de procesamiento de documentos y facturación, y la misma tecnología se adapta al catálogo de cuentas y los impuestos de cada país.',
      points: ['Lectura automática de facturas y recibos', 'Clasificación contable y asientos en segundos', 'Revisión de excepciones y trazabilidad por asiento'],
      link: { label: 'Ver GestoIA en funcionamiento', href: 'https://gestoia.es' },
    },
    items: [
      {
        id: 'contact-centre',
        sector: 'Centro de llamadas empresarial',
        title: 'Agente de voz privado en los servidores del cliente',
        metric: '< 2 s',
        metricLabel: 'de respuesta, de extremo a extremo',
        summary: 'Agente de voz completo en español, conectado a la central telefónica y probado con llamadas reales, sin que ningún dato salga de la red del cliente.',
        challenge: 'El cliente quería automatizar la atención telefónica con una condición innegociable: ninguna conversación podía salir de su red.',
        solution:
          'Construimos el agente sobre su central telefónica: reconocimiento de voz, modelo de lenguaje abierto y síntesis de voz en '
          + 'su propia GPU, con tratamiento de audio, interrupción natural, búsqueda en su documentación y trazabilidad de cada turno.',
        result: 'Llamadas reales de extremo a extremo con respuesta en menos de 2 segundos, en español natural y con todos los datos dentro de la red del cliente.',
        stack: ['Asterisk', 'faster-whisper', 'vLLM', 'Mistral', 'Piper', 'Qdrant', 'Langfuse'],
        services: ['voice'],
      },
      {
        id: 'industrial',
        sector: 'Industria',
        title: 'Plataforma de datos en tiempo real con asistente de IA',
        metric: '1.000+',
        metricLabel: 'sensores conectados',
        summary: 'Plataforma de telemetría industrial con alertas en tiempo real y un asistente que responde y opera sobre los datos en vivo.',
        challenge: 'Una plataforma de datos mantenida por más de 20 ingenieros pasó a un equipo reducido tras una reestructuración de la empresa.',
        solution:
          'Asumimos la plataforma y lideramos el equipo: ingesta de datos en tiempo real en AWS, validación y enrutado de series temporales, '
          + 'detección de eventos críticos y alertas, un data lake para el equipo de ciencia de datos y un asistente de IA sobre los datos en vivo.',
        result: 'La plataforma siguió funcionando y evolucionando con una fracción del equipo original.',
        stack: ['AWS Lambda', 'IoT Core', 'S3 · Glue · Athena', 'Terraform', 'Node.js', 'Python'],
        services: ['assistant', 'custom', 'infra'],
      },
      {
        id: 'migration',
        sector: 'Plataforma de formación online',
        title: 'Migración completa de AWS a Azure',
        metric: '100.000+',
        metricLabel: 'usuarios en la plataforma',
        summary: 'Una plataforma de formación con varios clientes independientes, en traslado de AWS a Azure por fases.',
        challenge: 'Mover una plataforma con más de 100.000 usuarios a otro proveedor de nube sin interrumpir a ninguno de sus clientes.',
        solution: 'Nueva plataforma sobre Kubernetes en Azure, con toda la infraestructura definida en Terraform y despliegues automáticos. Migración cliente a cliente.',
        result: 'En curso, por fases: cada cliente se migra y se valida de forma independiente.',
        stack: ['Azure', 'AKS · Kubernetes', 'Terraform', 'Azure DevOps', 'Docker'],
        services: ['infra'],
      },
      {
        id: 'deploys',
        sector: 'Multinacional del sector energético',
        title: 'Infraestructura como código y despliegues automáticos',
        metric: '1 hora',
        metricLabel: 'por despliegue (antes, una semana)',
        summary: 'De despliegues manuales de una semana a un proceso automático de una hora, para una plataforma con varios clientes.',
        challenge: 'Cada despliegue de la plataforma era manual y llevaba una semana de trabajo.',
        solution: 'Migramos toda la infraestructura a Terraform y automatizamos los despliegues en Azure DevOps.',
        result: 'El tiempo de despliegue bajó de una semana a una hora.',
        stack: ['Terraform', 'Azure DevOps', 'AWS', 'Azure'],
        services: ['infra'],
      },
      {
        id: 'ai-bootstrap',
        sector: 'Software para restaurantes',
        title: 'IA en producción desde cero',
        metric: '2 meses',
        metricLabel: 'de cero a producción',
        summary: 'Puesta en marcha de la IA en un equipo de producto: plataforma, trazabilidad, controles de calidad y forma de trabajar.',
        challenge: 'Un equipo de producto quería incorporar IA a su software sin experiencia previa en llevarla a producción.',
        solution:
          'Elegimos e introdujimos la plataforma (AWS Bedrock con modelos Claude), con trazabilidad y evaluación en Langfuse, y dejamos '
          + 'establecidos los patrones de trabajo: llamadas a herramientas, salida estructurada, versionado de prompts, filtros de contenido y datos personales, y pruebas de regresión.',
        result: 'IA en producción en dos meses, sobre una base que el equipo adoptó.',
        stack: ['AWS Bedrock', 'Claude', 'Langfuse', 'Python', 'Django'],
        services: ['assistant'],
      },
      {
        id: 'agency-audit',
        sector: 'Agencia digital',
        title: 'Auditoría técnica y desarrollo con agentes de IA',
        metric: 'Auditoría',
        metricLabel: 'seguridad, costes y desarrollo con agentes',
        summary: 'Auditoría completa del software de una agencia, corrección de riesgos de seguridad y un método para que un equipo no técnico desarrolle con agentes de IA.',
        challenge: 'Una agencia con muchas aplicaciones internas, sin equipo técnico propio y con riesgos de seguridad sin detectar.',
        solution:
          'Auditoría de todo su software, corrección de los fallos de seguridad más graves, consolidación de la infraestructura para '
          + 'reducir costes y un flujo de desarrollo guiado por especificaciones con agentes de IA, revisiones y controles.',
        result: 'Riesgos críticos corregidos, infraestructura unificada y un equipo no técnico capaz de evolucionar su software con agentes de IA.',
        stack: ['Next.js', 'Supabase', 'Vercel', 'Claude Code', 'OpenSpec'],
        services: ['custom', 'infra'],
      },
      {
        id: 'gestoia',
        sector: 'Producto propio · GestoIA',
        title: 'Facturas convertidas en contabilidad',
        metric: '90 %',
        metricLabel: 'de la contabilidad de facturas automatizada',
        summary: 'Lectura automática de facturas y recibos y preparación de asientos contables: un 90 % del trabajo automatizado y un 80 % menos de horas administrativas.',
        challenge: 'Las firmas contables dedican gran parte del mes a introducir facturas y recibos a mano.',
        solution: 'Lectura automática (OCR + IA) que clasifica cada documento, propone la cuenta contable y prepara el asiento, con revisión de excepciones.',
        result: 'Un 90 % de la contabilidad de facturas automatizada y un 80 % menos de horas administrativas, con cada asiento enlazado a su factura para auditoría.',
        stack: ['OCR', 'Modelos de lenguaje', 'Python', 'Next.js', 'PostgreSQL', 'AWS S3'],
        services: ['docs', 'billing'],
        link: { label: 'gestoia.es', href: 'https://gestoia.es' },
      },
    ],
  },

  about: {
    meta: {
      title: 'Sobre mí — Salvador F. Criado, especialista en IA aplicada',
      description: 'Ingeniero de telecomunicación con ocho años de software en producción: plataformas cloud, datos en tiempo real e inteligencia artificial aplicada.',
    },
    hero: {
      eyebrow: 'Sobre mí',
      title: 'Ingeniero de principio a fin',
      lead:
        'Soy Salvador F. Criado, especialista en inteligencia artificial aplicada e ingeniero de software. Trabajas directamente '
        + 'conmigo, desde la primera conversación hasta que la solución está funcionando.',
      portraitAlt: 'Salvador F. Criado, especialista en IA aplicada, en Granada (España)',
    },
    story: {
      title: 'Mi trayectoria',
      paragraphs: [
        'Soy ingeniero de telecomunicación con un máster en sistemas electrónicos. Empecé muy cerca del hierro, diseñando '
        + 'placas y programando firmware, y desde ahí fui subiendo: microservicios, plataformas de datos en tiempo real y '
        + 'sistemas en la nube con cientos de miles de usuarios.',
        'He trabajado en plantilla para empresas de industria, energía y formación, y desde 2025 como consultor independiente '
        + 'en atención telefónica, formación online, software para restaurantes y agencias digitales. Aprendo rápido cada '
        + 'negocio porque los problemas de fondo se parecen: datos que hay que mover, procesos que hay que automatizar y '
        + 'sistemas que no pueden fallar.',
        'Hoy me centro en la inteligencia artificial aplicada: agentes de voz y de texto, documentos, búsqueda sobre el '
        + 'conocimiento de una empresa y modelos en servidores propios. Conozco la IA por dentro y conozco cómo funcionan las '
        + 'empresas; esa doble mirada es la que me permite proponer en cada caso la solución más viable, y que siga funcionando cuando se apaga la demo.',
      ],
    },
    timeline: {
      title: 'Experiencia',
      items: [
        { when: '2025 — hoy', role: 'Especialista en IA aplicada · independiente', org: 'Agentes de IA, software e infraestructura', d: 'Agente de voz en servidores propios de un cliente, IA en producción, auditorías técnicas y migraciones cloud.' },
        { when: '2024 — 2025', role: 'Lead Software Engineer', org: 'Plataforma de datos industrial · Reino Unido', d: 'Responsable de la plataforma de 1.000+ sensores y de su asistente de IA tras la reestructuración del equipo.' },
        { when: '2022 — 2024', role: 'Ingeniero de software', org: 'Consultoría tecnológica', d: 'Infraestructura como código para una multinacional energética, plataforma de formación a gran escala y filtrado de alertas críticas.' },
        { when: '2018 — 2022', role: 'Ingeniero full-stack', org: 'Producto IoT', d: 'Software y hardware de extremo a extremo: microservicios, sensores inalámbricos y firmware.' },
        { when: '2017 — 2018', role: 'Investigador', org: 'Universidad Politécnica de Madrid', d: 'Red de dispositivos de muy bajo consumo para el ámbito sanitario.' },
      ],
    },
    principles: {
      title: 'Cómo trabajo',
      items: [
        { t: 'Empezar pequeño y medir', d: 'Un piloto acotado con un objetivo claro antes de cualquier proyecto grande.' },
        { t: 'Franqueza técnica', d: 'Si la IA no tiene sentido para tu problema, te lo digo, aunque eso signifique no hacer el proyecto.' },
        { t: 'Tus datos, bajo tu control', d: 'Privacidad y seguridad desde el diseño, no como añadido al final.' },
        { t: 'Sistemas mantenibles', d: 'Todo documentado y definido como código, para que no dependa de una sola persona, tampoco de mí.' },
      ],
    },
    credentials: {
      title: 'Formación y certificaciones',
      items: [
        { k: 'Certificación', v: 'AWS Certified DevOps Engineer – Professional' },
        { k: 'Certificación', v: 'Certified ScrumMaster' },
        { k: 'Formación en IA', v: 'Agentic AI y Retrieval Augmented Generation — DeepLearning.AI' },
        { k: 'Máster', v: 'Sistemas Electrónicos — Universidad Politécnica de Madrid' },
        { k: 'Grado', v: 'Ingeniería de Telecomunicación — Universidad de Granada' },
        { k: 'Idiomas', v: 'Español (nativo) · inglés (profesional) · francés (básico)' },
      ],
    },
  },

  cv: {
    meta: {
      title: 'Trayectoria — Salvador F. Criado, especialista en IA aplicada',
      description: 'Proyectos, capacidades, tecnología y formación de Salvador F. Criado: IA aplicada, software, datos en tiempo real e infraestructura cloud.',
    },
    hero: {
      eyebrow: 'Trayectoria',
      title: 'Lo que he construido y con qué',
      lead: 'Un resumen de proyectos, capacidades y tecnología para valorar si encajo en el tuyo. Cada entrada cuenta qué se entregó, no solo el puesto.',
    },
    summary: [
      'Especialista en inteligencia artificial aplicada e ingeniero de software con más de ocho años construyendo sistemas en '
      + 'producción. He llevado proyectos de principio a fin en atención telefónica, industria, energía, formación online, '
      + 'restauración y contabilidad.',
      'Mi base es la ingeniería que hace que las cosas funcionen cada día (cloud, datos en tiempo real, integraciones, '
      + 'automatización) y sobre ella construyo la capa de IA: agentes de voz y de texto, documentos, búsqueda sobre el '
      + 'conocimiento de la empresa y modelos en servidores propios.',
    ],
    labels: {
      experience: 'Proyectos y experiencia',
      skills: 'Capacidades y tecnología',
      domains: 'Sectores en los que he trabajado',
      education: 'Formación',
      certs: 'Certificaciones',
      languages: 'Idiomas',
      delivered: 'Qué entregué',
      print: 'Imprimir',
    },
    experience: [
      {
        when: '2025 — 2026',
        role: 'Agente de voz privado',
        context: 'Centro de llamadas empresarial · consultor independiente',
        delivered: [
          'Agente de voz completo en español, conectado a la central telefónica del cliente',
          'Reconocimiento de voz, modelo de lenguaje abierto y síntesis de voz en la GPU del cliente, sin datos fuera de su red',
          'Tratamiento de audio, detección de turnos, interrupciones y búsqueda en documentación',
          'Trazabilidad por turno y respuesta en menos de 2 segundos, probado con llamadas reales',
        ],
        tags: ['Asterisk', 'faster-whisper', 'vLLM', 'Mistral', 'Piper', 'Qdrant', 'Langfuse'],
      },
      {
        when: '2026 — hoy',
        role: 'Migración de AWS a Azure',
        context: 'Plataforma de formación online · 100.000+ usuarios · consultor independiente',
        delivered: [
          'Nueva plataforma sobre Kubernetes (AKS) en Azure',
          'Infraestructura completa en Terraform y despliegues automáticos en Azure DevOps',
          'Migración por fases, cliente a cliente (en curso)',
        ],
        tags: ['Azure', 'AKS', 'Terraform', 'Azure DevOps', 'PHP · Laravel', 'Moodle'],
      },
      {
        when: '2026',
        role: 'Auditoría técnica y desarrollo con agentes de IA',
        context: 'Agencia digital · consultor independiente',
        delivered: [
          'Auditoría de todo su software: seguridad, costes y arquitectura',
          'Corrección de los fallos de seguridad más graves y consolidación de la infraestructura',
          'Método de desarrollo con agentes de IA para un equipo no técnico, con revisiones y controles',
        ],
        tags: ['Next.js', 'Supabase', 'Vercel', 'Claude Code', 'OpenSpec'],
      },
      {
        when: '2026',
        role: 'IA en producción desde cero',
        context: 'Software para restaurantes · consultor independiente',
        delivered: [
          'Selección e introducción de AWS Bedrock con modelos Claude, y Langfuse para trazabilidad y evaluación',
          'Patrones de trabajo del equipo: llamadas a herramientas, salida estructurada, versionado de prompts, filtros de datos personales y pruebas de regresión',
        ],
        tags: ['AWS Bedrock', 'Claude', 'Langfuse', 'Python', 'Django'],
      },
      {
        when: '2026 — hoy',
        role: 'GestoIA · producto propio, publicado',
        context: 'Automatización contable para firmas contables',
        delivered: [
          'Lectura automática de facturas y recibos (OCR + IA)',
          'Clasificación contable y preparación de asientos en segundos, con revisión de excepciones',
        ],
        tags: ['Python', 'Next.js', 'OCR', 'LLM', 'PostgreSQL', 'AWS'],
      },
      {
        when: '2024 — 2025',
        role: 'Lead Software Engineer',
        context: 'Plataforma de datos industrial · Reino Unido, remoto',
        delivered: [
          'Responsable de una plataforma mantenida antes por más de 20 ingenieros, con un equipo reducido',
          'Ingesta en tiempo real de 1.000+ sensores en AWS, con detección de eventos críticos y alertas',
          'Data lake y herramientas para el equipo de ciencia de datos',
          'Asistente de IA que consulta y opera sobre los datos en vivo',
        ],
        tags: ['AWS Lambda', 'IoT Core', 'S3 · Glue · Athena', 'SQS', 'Terraform', 'Node.js', 'Python'],
      },
      {
        when: '2022 — 2024',
        role: 'Ingeniero de software',
        context: 'Consultoría tecnológica · multinacional del sector energético',
        delivered: [
          'Infraestructura como código y despliegues automáticos para varios clientes: de una semana a una hora',
          'Filtrado de alertas críticas sobre MQTT a más de 1.000 señales por segundo',
          'Buscador con ElasticSearch para una plataforma de formación de 80.000+ usuarios por cliente',
        ],
        tags: ['Terraform', 'Azure DevOps', 'NestJS', 'MQTT', 'ElasticSearch', 'PHP · Laravel · Vue'],
      },
      {
        when: '2018 — 2022',
        role: 'Ingeniero full-stack',
        context: 'Producto IoT · Granada',
        delivered: [
          'Migración de un monolito a microservicios: consultas de diez años de datos en menos de 30 segundos',
          'Nueva línea de sensores inalámbricos de extremo a extremo: electrónica, placa, firmware en C y red BLE Mesh',
        ],
        tags: ['Node.js', 'NestJS', 'Ruby on Rails', 'Angular', 'MongoDB', 'PostgreSQL', 'C', 'Altium'],
      },
      {
        when: '2017 — 2018',
        role: 'Investigador',
        context: 'Universidad Politécnica de Madrid',
        delivered: ['Red de pantallas de tinta electrónica de muy bajo consumo para el ámbito sanitario: hardware, protocolo inalámbrico y servidor'],
        tags: ['C', 'BLE', 'Node.js', 'Linux'],
      },
    ],
    skills: [
      { t: 'IA aplicada', items: ['Agentes de voz en tiempo real', 'Agentes con herramientas y flujos de varios pasos', 'RAG: búsqueda híbrida, reranking y evaluación', 'OCR y procesamiento de documentos', 'Modelos propios: vLLM, Triton, cuantización', 'Evaluación y trazabilidad: Langfuse, golden sets', 'Seguridad de IA: filtros, datos personales, OWASP LLM'] },
      { t: 'Modelos y plataformas de IA', items: ['Claude · AWS Bedrock', 'OpenAI', 'Mistral y modelos abiertos', 'Whisper · Deepgram · ElevenLabs', 'LangGraph · LangChain · LlamaIndex', 'Qdrant', 'n8n'] },
      { t: 'Software', items: ['Python', 'TypeScript · Node.js · NestJS', 'Next.js · React · Angular · Vue', 'PHP · Laravel', 'PostgreSQL · MySQL · MongoDB', 'ElasticSearch', 'APIs REST y GraphQL'] },
      { t: 'Datos y tiempo real', items: ['Arquitecturas orientadas a eventos', 'Series temporales', 'MQTT · IoT', 'AWS IoT Core · Lambda · SQS', 'Data lake: S3 · Glue · Athena', 'Apache Airflow'] },
      { t: 'Cloud y DevOps', items: ['AWS', 'Azure · AKS', 'Terraform', 'Kubernetes · Docker · Helm', 'CI/CD: GitHub Actions · Azure DevOps', 'Observabilidad y control de costes'] },
      { t: 'Hardware', items: ['Diseño de placas (Altium)', 'Firmware en C y MicroPython', 'BLE · BLE Mesh'] },
    ],
    domains: ['Atención telefónica', 'Industria', 'Energía', 'Formación online', 'Restauración', 'Contabilidad', 'Agencias digitales', 'Salud (investigación)'],
    education: [
      { k: '2017 — 2018', v: 'Máster en Sistemas Electrónicos — Universidad Politécnica de Madrid' },
      { k: '2013 — 2017', v: 'Grado en Ingeniería de Telecomunicación — Universidad de Granada' },
    ],
    certs: [
      { k: '2022', v: 'AWS Certified DevOps Engineer – Professional' },
      { k: '2023', v: 'Certified ScrumMaster' },
      { k: '2026', v: 'Agentic AI · Retrieval Augmented Generation · Orchestrating Workflows for GenAI — DeepLearning.AI' },
      { k: '2026', v: 'Introduction to LangGraph — LangChain Academy' },
    ],
    languages: 'Español (nativo) · inglés (profesional) · francés (básico)',
  },

  contact: {
    meta: {
      title: 'Contacto — hablemos de tu proyecto',
      description: 'Cuéntanos qué quieres resolver o construir. Primera conversación de 30 minutos.',
    },
    hero: {
      eyebrow: 'Contacto',
      title: 'Hablemos de tu proyecto',
      lead: 'Cuéntanos qué quieres resolver o construir y te proponemos una primera conversación de 30 minutos.',
    },
    channels: {
      email: { t: 'Email', d: 'La vía más directa. Cuéntanos tu caso con el detalle que quieras.' },
      linkedin: { t: 'LinkedIn', d: 'Envíanos un mensaje o revisa la trayectoria completa de Salvador.' },
      dossier: { t: 'Dossier en PDF', d: 'Un resumen de servicios y proyectos para compartir con tu equipo.' },
    },
    include: {
      title: 'Qué contarnos en el primer mensaje',
      items: [
        'A qué se dedica tu empresa y su tamaño aproximado',
        'Qué quieres mejorar o construir',
        'Qué herramientas o sistemas usan hoy',
        'Plazos o fechas importantes, si los hay',
      ],
    },
    next: {
      title: 'Qué pasa después',
      steps: [
        { t: 'Te respondemos', d: 'Con preguntas concretas sobre tu caso o directamente con una propuesta de llamada.' },
        { t: 'Llamada de diagnóstico', d: '30 minutos para entender el problema y ver qué solución tiene sentido.' },
        { t: 'Propuesta por escrito', d: 'Alcance, plazo y precio cerrado del piloto, con una estimación de los costes de uso.' },
      ],
    },
    hours: {
      t: 'Horario',
      d: 'Trabajamos en horario de España y nos adaptamos al tuyo: con América, las reuniones se hacen en tu mañana.',
    },
  },

  dossier: {
    meta: {
      title: 'Dossier de servicios — Salvador F. Criado',
      description: 'Resumen de capacidades, servicios, proyectos y forma de trabajar de Salvador F. Criado, especialista en inteligencia artificial aplicada.',
    },
    kicker: 'Dossier de servicios',
    title: 'Inteligencia artificial aplicada y software a medida para empresas',
    subtitle: 'Salvador F. Criado · Especialista en IA aplicada e ingeniero de software · Granada (España), en remoto',
    print: 'Imprimir',
    download: 'Descargar PDF',
    sections: {
      services: 'Servicios',
      work: 'Proyectos',
      process: 'Cómo trabajamos',
      about: 'Sobre mí',
      contact: 'Contacto',
    },
    contactLead: 'Te respondemos con preguntas concretas o con una propuesta de llamada de 30 minutos.',
  },
};
