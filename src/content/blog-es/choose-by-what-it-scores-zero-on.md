---
title: "Elige un framework de desarrollo con IA por aquello en lo que saca un cero"
date: 2026-09-21
tags: [ai-coding, evaluation]
readingTime: 12
excerpt: "Seis dimensiones, una rúbrica. En especificación casi todo framework de agentes saca la nota máxima; en roles y validación es donde pierden los equipos."
---

Entra un cambio. Compila, la suite está en verde y está mal.

Ese diff es la razón por la que la pregunta "qué framework de desarrollo con IA deberíamos usar" es la pregunta equivocada, y la razón por la que a los engineering leads se la siguen haciendo de todos modos. Este artículo te da un instrumento en lugar de una preferencia: una rúbrica de seis dimensiones que puedes pasar sobre tu propio setup en una tarde, las puntuaciones publicadas de siete frameworks, los dos modos de fallo que producen diffs idénticos y las mediciones que se mueven antes que tu change failure rate.

## Puntúa tu propio proceso antes de comparar el de nadie

La taxonomía de frameworks de desarrollo con IA de Macedo (arXiv:2606.04967) puntúa un proceso en seis dimensiones, de 0 a 2 cada una, con un máximo de doce. Las dimensiones son la parte útil aunque nunca leas una comparativa de frameworks, porque funcionan como rúbrica sobre lo que sea que estés haciendo ahora mismo.

| Dimensión | Qué pregunta | 0 | 1 | 2 |
|---|---|---|---|---|
| **Especificación** | ¿Hay un artefacto escrito que defina el cambio antes de que exista el código? | Solo el prompt | Notas, informal | Spec estructurada, versionada |
| **Contexto** | ¿Cómo llega al agente el conocimiento relevante del repositorio? | Lo que quepa en la ventana | Selección manual de ficheros | Retrieval y grounding sistemáticos |
| **Roles** | ¿Quién decide qué, y en qué fase? | Agente indiferenciado | Separación implícita | Roles con nombre y autoridad por fase |
| **Ejecución** | ¿Cómo se divide el trabajo en pasos que ejecuta el agente? | Libre | Lista de tareas | Por fases, con condiciones de entrada y salida |
| **Validación** | ¿Qué contrasta la salida con la intención? | Un humano leyendo el diff | Tests, a posteriori | Gates que el proceso no puede saltarse |
| **Portabilidad** | ¿Sobrevive el proceso a un cambio de agente o herramienta? | Atado a un agente | Parcial | Artefactos planos, agnóstico del agente |

Puntúate en seis líneas. Luego ignora el total.

El total es el número que la gente quiere y el número que engaña. La forma habitual es un 2 en especificación junto a un 0 en validación, que suma un término medio de aspecto respetable y describe a un equipo que escribe specs excelentes y no tiene ningún mecanismo para darse cuenta de cuándo el código deja de cumplirlas. **El resultado es tu puntuación más baja.** Es la única dimensión en la que añadir cualquier cosa cambia tu tasa de fallos, y la única en la que merece la pena invertir este trimestre.

## La especificación está saturada, roles y validación no

Esta es la tabla de puntuaciones del paper, literal.

| Framework | Spec | Contexto | Roles | Ejec | Valid | Port | Total |
|---|---|---|---|---|---|---|---|
| Spec Kit | 2 | 1 | 1 | 1 | 1 | 2 | 8 |
| OpenSpec | 2 | 1 | 0 | 1 | 0 | 2 | 6 |
| BMAD | 2 | 2 | 2 | 1 | 2 | 1 | 10 |
| Get Shit Done | 1 | 2 | 0 | 1 | 0 | 0 | 4 |
| Spec Kitty | 2 | 1 | 1 | 2 | 2 | 1 | 9 |
| Reversa | 2 | 2 | 0 | 0 | 1 | 1 | 6 |
| Spec-Flow (fuera de muestra) | 2 | 2 | 2 | 2 | 2 | 1 | 11 |

Lee las columnas, no las filas. Especificación es 2 casi en todas partes. Una dimensión en la que casi todos los candidatos sacan la nota máxima no aporta información para elegir: es lo mínimo exigible, y además es la dimensión sobre la que se construye cualquier demo de framework, porque una spec es lo más fácil de enseñar.

Roles y validación son las columnas polarizadas. Roles va 1, 0, 2, 0, 1, 0, 2. Validación va 1, 0, 2, 0, 2, 1, 2. Esas son las dimensiones en las que los frameworks discrepan de verdad, y por tanto las dimensiones en las que se está tomando una decisión.

Ningún framework del conjunto saca 2 en las seis, y la adopción no sigue a la completitud del proceso. Comprobado directamente en los repositorios el 2026-09-21: Spec Kit tiene 138.1k estrellas en GitHub, BMAD 53.3k y Spec-Flow unas 85. El proceso con mejor puntuación de la tabla, Spec-Flow con 11 de 12, tiene tres órdenes de magnitud menos adopción que el de puntuación media, Spec Kit con 8 de 12. La propia tabla de tracción del paper es una foto de GitHub de mayo de 2026, y las cifras ya se habían movido cuando las comprobé. Por eso cada número de arriba lleva fecha. Un ranking de popularidad se degrada entre el día en que se mide y el día en que lo lees, lo que lo descalifica como dato duradero para la decisión. La rúbrica no se degrada, porque describe tu proceso y no la audiencia de otro.

Superpowers queda fuera de la muestra puntuada y se cita aquí como prueba de existencia de una afirmación: las dimensiones escasas se pueden construir como mecanismos que se hacen cumplir y no como intenciones documentadas. Su revisión pasa por un subagente distinto del que escribió el código, que es separación de roles como mecanismo; su flujo dirigido por tests se niega a implementar hasta que un test ha fallado por el motivo correcto, que es validación como mecanismo.

**El límite honesto, dicho aquí y no enterrado al final:** estas puntuaciones son la lectura de un único evaluador sobre documentación oficial. No hay segundo codificador ni cifra de fiabilidad entre evaluadores. La documentación describe intenciones, y las intenciones son lo que los fabricantes ponen por escrito. Trata cualquier afirmación de productividad de un framework como una afirmación.

## Dos fallos que producen el mismo diff

Volvamos a la suite en verde y al cambio erróneo. Tiene dos causas, y se reparan en direcciones opuestas, así que adivinar te cuesta un sprint.

Un **hueco de contexto** produce alucinación funcional: código que cumple el contrato explícito y viola uno implícito, porque el fichero que contenía el contrato implícito nunca estuvo en el alcance. El agente no se equivocó sobre lo que vio. Nunca lo vio.

La **deriva entre spec y código** produce código que pasa los tests mientras cambia sin hacer ruido la arquitectura, o se deja una restricción de negocio que la spec sigue diciendo que se aplica. El agente tenía el material relevante y se desvió de él de todos modos.

| Síntoma | La comprobación que discrimina | Causa | Arreglo |
|---|---|---|---|
| Viola una regla documentada en un fichero que el cambio no tocó | ¿El agente citó ese fichero? | Hueco de contexto | Grounding: cobertura de ficheros, evidencia, detección de huecos |
| Pasa los tests, la arquitectura difiere sin avisar de la spec | ¿El agente citó la spec y se desvió? | Deriva | Un gate que compare artefactos con la implementación |
| Llama a una API que no existe | Busca el símbolo en el código | Hueco de contexto | Grounding |
| Restricción presente en la spec, ausente en el código, spec sin cambios | Haz diff de la spec contra la implementación | Deriva | Gate |

La comprobación es una pregunta: ¿citó el agente las fuentes internas que restringen este cambio? Si nunca las vio, el arreglo es grounding, y añadir un gate solo mueve el fallo más adelante en el pipeline a mayor coste. Si las vio y se desvió, el arreglo es un gate, y añadir más contexto no cambia nada porque el contexto nunca fue lo que faltaba.

## Apunta el trabajo agéntico donde existe la ganancia, y asume la consecuencia

El tamaño de la ganancia lo fija el código, no el framework. Dos conjuntos de datos independientes dan el mismo orden.

El trabajo de Stanford dirigido por Denisov-Blanch, sobre unos 100.000 desarrolladores:

| Código | Complejidad | Ganancia medida |
|---|---|---|
| Greenfield | Baja | 30–35% |
| Greenfield | Alta | 10–15% |
| Brownfield | Baja | 15–20% |
| Brownfield | Alta | 0–10% |

El retrabajo sube y los rendimientos disminuyen a medida que crece el código. El informe de DORA de 2026 encuentra la misma forma con otros datos: 35–40% en trabajo greenfield sencillo, 10% o menos en sistemas existentes complejos.

**Regla de decisión:** si el trabajo es brownfield y de alta complejidad, no justifiques un programa de agentes por la ganancia de producción. El rango medido incluye el cero. Justifícalo por otra cosa que puedas nombrar y medir, o apunta primero el programa a otro cuadrante.

Lo incómodo es que el cuadrante brownfield de alta complejidad suele ser donde está el valor de negocio. El sistema viejo que tiene los ingresos dentro no es greenfield para nadie. Apuntar los agentes al cuadrante fácil es el primer movimiento correcto y también es el movimiento que produce un resultado de piloto que no puedes extrapolar.

## El throughput se movió, la estabilidad no le siguió

DORA 2025 asoció un aumento del 25% en la adopción de IA con un 1,5% menos de throughput de entrega y un 7,2% menos de estabilidad de entrega. En 2026, la relación con el throughput se había vuelto positiva. La relación con la estabilidad no. En el escenario modelado, el change failure rate pasa del 5% al 6% tras la adopción.

Volumen y seguridad son variables separadas, y la segunda no mejora porque mejore la primera.

El modelo de ROI del mismo informe contiene una curva J explícita: una caída antes del retorno, producida por el tiempo de aprendizaje, la sobrecarga de verificación y el cambio en los procesos posteriores. La caída está dentro del modelo, no es una salvedad añadida. **Consecuencia para la medición:** la primera ventana tras la adopción cae dentro de la caída, así que un piloto medido ahí se lee como una pérdida tanto si el programa funciona como si no. Fija la ventana de medición antes de empezar, y hazla más larga que la caída en la que esperas estar.

Un posible camino de la adopción a la inestabilidad, presentado como hipótesis y no como hallazgo: la adopción de agentes eleva el ritmo de cambios que entran en revisión, la capacidad de revisión sigue fija, la longitud de la cola y el tiempo en revisión suben, y el change failure rate va detrás. Esa versión se puede contrastar con tus propios datos. Si el camino es la cola, la longitud de la cola de revisión y el tiempo en revisión se mueven antes que el change failure rate. Un equipo cuyas métricas de cola se mantienen planas mientras sube el change failure rate tiene otra causa y debería dejar de invertir en capacidad de revisión.

**El orden de operaciones, como orden:**

1. Tests que fallen por el motivo correcto antes de pasar. Una suite que se pone en verde con un cambio erróneo no es validación, es decoración.
2. Unidades pequeñas y revisables. La capacidad de revisión es la restricción que estás a punto de cargar.
3. Feedback rápido y disciplina de control de versiones. Ramas de vida corta, flujo trunk-based, un pipeline que responde en minutos.
4. Después, sube el volumen.

Hacer el 4 antes del 1 al 3 es lo que produce la caída. También es lo que se hace por defecto, porque subir el volumen es el paso que no requiere ningún acuerdo en la organización.

## La mitad cara es la mitad que se está acelerando

Escribir código nunca fue la restricción. Revisarlo y mantenerlo sí. Los agentes aceleran lo primero, y el análisis de GitClear/GitKraken sobre 623 millones de líneas cambiadas entre 2023 y 2026 dice que el código que llega a revisión es mediblemente más difícil de revisar.

| Señal | Dirección |
|---|---|
| Bloques duplicados | +81% |
| Copiar/pegar dentro de un mismo commit | +41% |
| Construcciones que enmascaran errores | +47% |
| Churn a dos semanas | +15% |
| Llamadas a funciones entre ficheros | −35% |
| Movimientos de líneas por refactorización | −70% |

2024 fue el primer año registrado en el que el copiar/pegar superó al código movido. Más duplicación y menos refactorización son una sola tendencia vista dos veces: se añade código en lugar de reorganizarlo, y que las llamadas entre ficheros caigan un 35% significa que el código añadido no está aprovechando lo que ya existe.

Hay una proporción que enseña a leer el volumen. Los usuarios intensivos de IA producen entre 4 y 10 veces más líneas en bruto que los no usuarios, y solo un 25% más aproximadamente que ellos mismos en el pasado. Un conjunto de datos de recuento de líneas no puede separar las dos explicaciones de esa diferencia: que la gente más productiva adopte antes, o que la adopción suba la producción. Ambas encajan con los datos. Lo que sí deja claro el par es que el 4–10x no es un tamaño de efecto. La cifra intrapersonal es la que se mide contra las mismas personas, y es la pequeña.

## Mide los artefactos intermedios, no solo el diff

Change failure rate, lead time, frecuencia de despliegue y tiempo de recuperación son indicadores retrasados por construcción. Te hablan de código que ya se ha entregado. Un proceso que genera specs, planes y revisiones antes de que exista el código produce artefactos que puedes medir antes.

| Métrica | Por qué se adelanta |
|---|---|
| Correcciones por fase | Sube antes que el change failure rate |
| Tasa de revisión humana necesaria | Mide cuánto del proceso funciona de verdad sin supervisión |
| Deriva entre spec y código | Caza el cambio silencioso de arquitectura mientras arreglarlo aún es barato |
| Grounding: cobertura de ficheros, cita de fuentes internas, detección de huecos, ausencia de APIs inexistentes, cumplimiento de las decisiones de arquitectura registradas | Separa hueco de contexto de deriva, según el diagnóstico de arriba |
| Coherencia entre artefactos, estabilidad de las decisiones | Una spec reescrita a mitad de implementación es la señal, no el ruido |
| Calidad del rastro de auditoría | Determina si algo de lo anterior se puede reconstruir a posteriori |

Combínalas con el change failure rate y el churn para que la vista adelantada y la retrasada puedan discrepar a la vista de todos. Cuando las correcciones por fase suben durante tres semanas y el change failure rate no se ha movido, tienes tres semanas de aviso.

No hay umbrales publicados para ninguna de ellas. No se sabe cuál es un número sano de correcciones por fase, lo que significa que el primer mes de recogida sirve para establecer tu propia línea base, y la métrica solo se puede interpretar como tendencia contra ti mismo.

## La autopercepción no puede ser una de las mediciones

METR hizo un ensayo controlado aleatorizado (arXiv:2507.09089) con 16 mantenedores open source experimentados sobre 246 tareas reales en sus propios repositorios maduros. Trabajando con herramientas de IA, fueron un 19% más lentos. Antes habían previsto ser un 24% más rápidos. Al terminar, seguían creyendo que habían sido un 20% más rápidos aproximadamente.

Percepción y efecto están separados por unos 39 puntos, y el signo está mal, no solo la magnitud. La percepción de los profesionales aquí no es una señal débil a la que dar menos peso. Es una señal que puede apuntar en sentido contrario a la verdad, lo que la descalifica del instrumento por completo.

**Consecuencia para el lector:** una encuesta a desarrolladores es evidencia sobre la moral y la adopción. No es evidencia sobre el throughput, y una puntuación de satisfacción no se puede citar en el mismo párrafo que una afirmación de productividad.

## La dependencia que nadie revisa, y el coste que nadie pone precio

Skills, comandos y plantillas son ejecutables. Un equipo copia un directorio de skills de un repositorio, le concede permisos y lo ejecuta contra un checkout de producción. Eso es una cadena de suministro, con el riesgo normal de una cadena de suministro, y hoy se revisa con menos cuidado que una dependencia de paquetes.

Comprobado el 2026-09-21 en los repositorios de los dos frameworks más adoptados de la tabla:

- Spec Kit se instala con `uv tool install specify-cli`, seguido de un comando `specify init` que recibe un nombre de proyecto. El repositorio no documenta firma, checksums ni verificación de procedencia para las plantillas, comandos y ficheros de agente que escribe en el árbol de trabajo.
- BMAD se instala con `npx skills add bmad-code-org/BMAD-METHOD`. El comando de instalación documentado no fija versión, y el repositorio no documenta firma, validación de checksums, trazabilidad de procedencia ni acotación de permisos para los ficheros de personas y agentes que instala. Las versiones se concilian después con `bmad update`.

Ambos comandos escriben ficheros de instrucciones ejecutables con alcance a nivel de repositorio, resueltos desde una referencia móvil, sin ninguno de los controles de integridad que el mismo equipo exigiría a una dependencia de npm o PyPI que está en el mismo checkout.

**La auditoría que puedes hacer esta semana:** enumera todos los directorios de skills, comandos y plantillas que hoy son ejecutables en tu repositorio. Para cada uno, apunta de dónde vino y en qué revisión, apunta con qué permisos se ejecuta y marca si alguien lo revisó antes de concederle un checkout de producción. Las filas que no puedes rellenar son el hallazgo. Lo que falta aguas arriba es poco emocionante y llega tarde: firma, manifiestos verificables, acotación de permisos, revisión de procedencia. La pregunta de fondo no es si los agentes pueden ejecutar. Pueden. Es con qué permisos, y con qué evidencia después.

Luego, el compromiso que deja ver la tabla de puntuaciones. Lee la columna de portabilidad frente al total: los procesos más profundos son los que menos puntúan en portabilidad, y los frameworks que viajan entre agentes son los finos. BMAD, con 10, saca 1 en portabilidad. Spec-Flow, con 11, saca 1. Spec Kit, con 8, y OpenSpec, con 6, sacan 2. La profundidad del proceso se paga en lock-in, con la regularidad suficiente como para parecer estructural y no casual.

**Ponle nombre al coste de cambio antes de elegir.** El activo es el proceso. Si cambia el agente, los artefactos, los roles y los gates son lo que tendrías que reescribir, y nadie ha publicado cuánto cuesta realmente esa migración.

## Dónde deja de ser cierto, y un movimiento para esta semana

No existe ningún benchmark de procesos. Ese es el estado honesto del campo, y acota todo lo anterior:

- Las puntuaciones por dimensión son revisión de documentación por un único evaluador, sin fiabilidad entre evaluadores.
- La mayoría de las afirmaciones de los frameworks son documentación y anécdota.
- Los estudios de producción miden cómo es el código, no qué proceso lo produjo. La tendencia de GitClear es una señal a nivel de población, no una atribución.
- El coste de la portabilidad no tiene precio.

Aun así basta para actuar, porque el instrumento no depende de que ningún framework tenga razón.

Lo bastante pequeño para terminarlo esta semana: puntúa tu setup actual con 0/1/2 en las seis dimensiones. Quédate con la más baja. Instrumenta exactamente una métrica adelantada para ella. Si el cero es validación, cuenta las correcciones por fase. Si el cero es contexto, mide la cobertura de citas a fuentes en los cambios que produjo un agente. Si el cero es roles, pon por escrito la autoridad de decisión con nombre para cada fase y luego cuenta las violaciones por semana, entendiendo por violación una fase cuya decisión tomó alguien o algo distinto de la autoridad con nombre.

Una dimensión, una métrica, una línea base. Eso es mejor que una comparativa de frameworks que no puedes comprobar.
