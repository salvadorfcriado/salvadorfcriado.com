---
title: "Temperatura cero no es determinista"
date: 2026-09-03
tags: [llm-serving, evaluation, governance]
readingTime: 11
excerpt: "Mismo prompt, mismo modelo, respuesta distinta. El mecanismo del no determinismo, la aritmética que mata los pilotos de agentes y qué hacer al respecto."
---

**Mismo prompt, mismo modelo, respuesta distinta. El mecanismo que hay detrás, la aritmética que mata los pilotos de agentes y por qué Bruselas te acaba de regalar dieciséis meses extra que vas a desperdiciar.**

---

Una vez me pasé dos días con un informe de bug que no conseguía reproducir.

Mismo prompt. Misma versión del modelo. Temperatura cero. La salida del martes por la mañana no era la del lunes por la noche, y en nuestro código no había cambiado nada entre medias.

Hice lo obvio. Busqué un timestamp que se colara en el prompt. Comprobé si la capa de retrieval había reindexado. Lo ejecuté cincuenta veces en local, obtuve cincuenta respuestas idénticas, me sentí reivindicado durante una hora y luego vi cómo volvía a derivar en producción.

Nunca llegué a la causa raíz. Lo que sí llegué a establecer es que no podía reproducir la respuesta de ayer, y eso resultó ser, por sí solo, el hecho descalificante. Estábamos a punto de poner aquello delante de clientes.

## Revisa primero las causas aburridas

Si estás persiguiendo esto ahora mismo, la respuesta es casi seguro algo mundano, y deberías agotar la lista de lo mundano antes de que nadie pronuncie la palabra "kernel".

Tu proveedor cambió sin avisar el modelo que hay detrás del alias que creías haber fijado. Tu [índice de retrieval cambió de forma sin que te enteraras](/es/blog/the-half-nobody-put-on-call/). La temperatura está a cero pero `top_p` y la semilla siguen con los valores por defecto. Alguien editó una plantilla de prompt sin pensar que eso contaba como código. En modelos mixture-of-experts, el enrutado puede variar entre réplicas.

Nueve de cada diez veces es una de esas, y todas se arreglan con disciplina de ingeniería normal y corriente.

Lo interesante es lo que queda cuando ya has arreglado todas. Porque el suelo no es cero.

## El suelo

El muestreo greedy debería ser determinista. Coger el token de mayor probabilidad, siempre. Sin dados de por medio.

Horace He y sus compañeros de Thinking Machines Lab [publicaron el mecanismo](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/) en septiembre de 2025, y es la explicación más limpia que conozco. Los kernels de GPU reparten el trabajo de forma distinta según cuántas peticiones van juntas en el batch de ese forward pass. La suma en coma flotante no es asociativa. A nivel de bit, (a+b)+c no siempre es a+(b+c). Cambia el tamaño del batch, cambia el orden de la reducción, cambian los últimos decimales, y a veces eso basta para que gane otro token.

El desencadenante es la carga del servidor. Tu petición no cambió. Cambió el tráfico que la rodeaba.

Sus números merecen citarse porque convencen más que el argumento. Ejecutar el mismo prompt 1.000 veces a temperatura cero contra Qwen3-235B sobre vLLM estándar produjo **80 completions distintas**. Las 1.000 eran idénticas durante los primeros 102 tokens y luego divergían. Con kernels invariantes al batch, el mismo experimento produjo 1.000 salidas idénticas.

El determinismo se podía recuperar. Solo que tenía un precio: en un benchmark de throughput con Qwen3-8B, 26 segundos pasaron a 55 con una implementación ingenua y a 42 tras ajustar el kernel de atención. Digamos 1,6x a cambio de una reproducibilidad que puedes demostrar.

La mayoría de los equipos están haciendo ese intercambio ahora mismo. Ninguno sabe que lo está haciendo.

## Predecible no es lo mismo que determinista

Esta distinción es donde el vocabulario empieza a valer dinero, y es donde los proveedores ya están empezando a escurrir el bulto.

El determinismo es una propiedad de la mecánica. Misma entrada, misma salida, bit a bit. Es lo que necesitas para auditorías y para que entrenamiento e inferencia sean coherentes entre sí, y como acabamos de ver, tiene un precio.

La predictibilidad es la pregunta que de verdad hace un comprador: ¿se comportará esto en octubre como se comportó en el piloto, y puedo saberlo antes de firmar?

Las dos se separan en ambas direcciones. Un sistema puede ser perfectamente determinista y completamente impredecible, fallando de la misma forma catastrófica cada vez ante una entrada que nadie probó. Y un sistema puede bailar a nivel de token y ser totalmente predecible donde importa: siempre JSON válido, nunca un precio fuera del catálogo, escala cuando no está seguro, latencia p95 donde estaba el mes pasado.

También conviene acotarlo con honestidad, porque el contraargumento es justo. Si tu salida es prosa que una persona lee una vez, dos respuestas buenas distintas son las dos buenas y nada de esto aplica. Si tu salida acaba en un libro contable, un siniestro, una historia clínica o un expediente de cumplimiento, aplica todo.

## La aritmética que mata los pilotos

La investigación de IDC de 2025 encontró que el 88% de las pruebas de concepto de IA nunca llegan a un despliegue a gran escala. Gartner, por su parte, predice que más del 40% de los proyectos de IA agéntica se cancelarán antes de finales de 2027.

La explicación refleja es que los modelos no eran lo bastante buenos. Esa no sobrevive al contacto con los últimos dieciocho meses: los modelos mejoraron muchísimo y la proporción apenas se movió.

El verdadero culpable es la multiplicación.

```
Chain n steps, each succeeding with probability p.
The pipeline succeeds with probability p^n. Not the average. The product.

  95% per step, 5 steps   →  77%
  95% per step, 10 steps  →  60%
  95% per step, 20 steps  →  36%
  97% per step, 20 steps  →  54%
```

Un paso con un 95% de fiabilidad es un resultado realmente bueno. Veinte seguidos son un cara o cruz que pierdes.

Lee las dos últimas filas juntas, porque ahí está toda la lección de diseño: **cinco pasos al 95% ganan a veinte pasos al 97%.** Dos puntos porcentuales de fiabilidad por paso son un problema de investigación difícil. Quitar quince pasos es una tarde con una pizarra. El exponente es la variable barata y nadie la trata siquiera como variable.

Sí, es una cota pesimista. Los reintentos y las puertas de validación recuperan parte, y los fallos no son perfectamente independientes. Eso no es una refutación, es el argumento: pon puertas entre los pasos en lugar de añadir más pasos.

El trabajo de METR sobre horizontes temporales muestra la misma forma desde el otro lado. Sus datos publicados, actualizados en mayo de 2026, dan a cada modelo de frontera dos números: la duración de tarea que completa el 50% de las veces y la que completa el 80% de las veces. Para Claude Opus 4.6 son **12 horas y 1,2 horas**. Para GPT-5.3 Codex, 5,8 horas y 0,9. En toda la frontera, el horizonte del 80% es entre cuatro y diez veces más corto que el del 50%.

Piensa un momento en esa distancia. El número de titular es el que se comparte en capturas. El otro es el número que tendrías que garantizar si le vendieras esto a un banco.

El modelo de nadie está roto. Es la longitud de la cadena la que hace el daño.

## El plazo se ha movido, y eso es peor

El 27 de julio de 2026, la UE cambió el calendario.

El Reglamento (UE) 2026/1744, el Digital Omnibus sobre IA, entró en vigor ese día y aplazó las obligaciones de alto riesgo independientes del 2 de agosto de 2026 al 2 de diciembre de 2027. Los sistemas embebidos del Anexo I pasan a agosto de 2028. Lo que sí llegó en agosto es el régimen de transparencia del Artículo 50, y las normas sobre GPAI y prácticas prohibidas ya estaban en vigor.

Si lo has leído como un respiro, vuelve a leerlo.

Lo que viene para los sistemas de alto riesgo no ha cambiado, solo cuándo. El [Artículo 12](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) exige registro automático durante toda la vida del sistema, con una resolución que permita trazar el comportamiento a posteriori. Los proveedores conservan la documentación técnica durante diez años según el Artículo 18. Proveedores y responsables del despliegue conservan los logs al menos seis meses según los Artículos 19 y 26(6). Las sanciones por esto llegan a 15 millones de euros o al 3% de la facturación anual mundial, lo que sea mayor.

Nada de eso es exótico para quien haya gestionado infraestructura regulada. Los supervisores bancarios de EE. UU. exigen básicamente la misma disciplina desde la [SR 11-7](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm) de 2011: un modelo que no puedes volver a ejecutar es un modelo que no puedes validar.

Esta es la parte que debería preocuparte. **No puedes generar ese registro de forma retroactiva.** La evidencia tiene que generarse en el momento de la petición, por un sistema construido para generarla. Dieciséis meses suenan a mucho, y el sector se pasará quince de ellos sin construir la capa de logging.

## Qué es realmente la capa de logging

Para la mayoría de los equipos, que trabajan sobre una API gestionada, el determinismo mecánico ni siquiera es una opción. No puedes desplegar kernels invariantes al batch en el clúster de otro. La reproducibilidad pasa a ser **probatoria** en lugar de bit a bit: no puedes prometer los mismos bytes, pero sí un relato completo de qué los produjo.

Es un problema de infraestructura con una forma bien conocida. En concreto, cada inferencia genera un registro con estos campos:

```
request_id            stable, propagated across the whole chain
timestamp_utc
model_id              the SNAPSHOT id, never the alias
model_id_resolved     what the provider actually served — log both, they differ
prompt_template_id    + version/commit hash
prompt_rendered_hash  hash of the final assembled prompt
retrieval_index_id    + version of the index that answered
retrieved_chunk_ids   which chunks, at which ranks
tool_schema_hash      tool definitions change and nobody versions them
sampling_params       temperature, top_p, top_k, seed, max_tokens — all of them
output_raw            before any parsing or cleanup
output_validated      after schema enforcement, plus pass/fail
guardrail_verdicts    each guardrail, each outcome
latency_ms            per stage, not just total
cost_tokens           in/out
```

Dos de esos campos cargan con la mayor parte del peso y son los dos que más a menudo faltan. **`model_id_resolved`** es cómo demuestras que un proveedor te cambió el modelo por debajo — sin él, ese fallo es infalsable y vas a perder la discusión. **`retrieval_index_id`** es cómo distingues "cambió el modelo" de "cambió el conocimiento", que de otro modo es una semana de trabajo cada vez.

Y después, la pieza que convierte un log en evidencia: un **arnés de replay**. Un único comando que toma un `request_id` y reconstruye la petición exacta — mismo prompt, mismo contexto recuperado, mismos esquemas de herramientas, mismos parámetros de muestreo — contra el modelo snapshot fijado. Si no puedes ejecutar eso, tienes logs. No tienes reproducibilidad, y según el Artículo 12 probablemente tampoco cumplimiento.

Es la aburrida disciplina de builds reproducibles que la industria del software ya aprendió una vez, aplicada a un artefacto nuevo. Nada de esto necesita un especialista en IA.

## La versión falsificada

La "IA predecible" ya es una categoría de producto, y la jugada habitual es degradar el modelo hasta que no pueda sorprenderte. La versión de Pega es el extremo honesto: usar el razonamiento de la IA en tiempo de diseño con una persona revisando la salida, y luego hacer que el agente en runtime haga una detección de intención ligera y siga el flujo definido paso a paso.

Es una arquitectura legítima, y para muchos procesos críticos es la correcta. Solo ten claro qué has comprado. Si el valor que necesitabas era un comportamiento adaptativo ante entradas que nadie anticipó, no has hecho tu IA predecible. La has estrechado hasta que la pregunta ha dejado de ser interesante.

La ingeniería que merece la pena está en medio: el modelo sigue en el bucle y aun así puedes hacer promesas sobre él.

## Cuatro palancas, por orden de retorno

**Saca la varianza del sampler.** La decodificación restringida es la mayor ganancia disponible y ya es infraestructura aburrida. Al sampler se le impide físicamente emitir un token que viole tu esquema, así que una salida malformada deja de ser estadísticamente improbable y pasa a ser estructuralmente imposible. [XGrammar](https://github.com/mlc-ai/xgrammar) y sus equivalentes son estándar en vLLM, SGLang y TensorRT-LLM, con un overhead de generación de máscaras de decenas de microsegundos. OpenAI y Anthropic documentan ya garantías de esquema; Gemini lo impone y aun así te dice que valides. Si sigues sacando JSON de la prosa con expresiones regulares detrás de un bucle de reintentos, estás fabricando tu propia impredecibilidad y luego pagando por limpiarla.

**Restringe la envolvente, no la salida.** Deja de intentar que el modelo diga las mismas palabras. Escribe lo que siempre tiene que cumplirse. Cita una fuente real. Nunca da un precio fuera del catálogo. Rechaza todo lo que esté fuera de alcance. Hazlo cumplir fuera del modelo y luego mide la envolvente con un [golden set](/es/blog/rag-ranking-not-retrieval/): entradas reales fijas, salidas buenas conocidas, ejecutado en cada cambio de prompt antes del merge. "A mí me parece mejor" no es un criterio de release. Es como se cuelan las regresiones.

**Acorta el horizonte.** La fiabilidad se compone de forma multiplicativa, así que la mejora más barata suele ser tener menos pasos. Orquestación determinista entre llamadas al modelo. Checkpoints desde los que poder reanudar. Y una pregunta directa en cada salto: ¿este paso necesita un modelo de lenguaje, o pusimos uno porque podíamos?

**Presupuesta la incertidumbre que no puedes eliminar.** Siempre habrá una fracción de entradas que queden fuera de la competencia del modelo, y la pregunta de diseño es qué pasa con ellas. Umbrales de confianza que derivan a una persona en vez de adivinar. Un trace por paso, para que un fallo se pueda diagnosticar sin volver a reproducir el incidente. La escalada como un camino diseñado y no como un manejador de excepciones.

Estoy construyendo un proyecto personal que convierte facturas en asientos contables, y esa última palanca es la mayor parte del producto. Leer un ticket es un problema resuelto. Saber cuándo la máquina no debería fiarse de sí misma es todo el problema de ingeniería, porque en contabilidad un asiento erróneo es peor que ningún asiento. Alguien tiene que encontrarlo antes de que envenene un cierre trimestral.

## Seis cosas que puedes hacer este mes

Ninguna necesita aprobación de presupuesto, y todas son más baratas que el incidente que evitan.

1. **Fija IDs de modelo snapshot en todas partes**, y registra lo que el proveedor resolvió de verdad. Una tarde. Elimina la causa más habitual de "ha cambiado y no sabemos por qué".
2. **Cuenta los pasos de tu camino agéntico más largo**, eleva tu fiabilidad honesta por paso a esa potencia y pon ese número delante de quien sea responsable del roadmap. Suele ser la diapositiva más persuasiva de la presentación.
3. **Activa la decodificación restringida** en todo lo que produzca salida estructurada, y borra el bucle de reintentos que deja de hacer falta.
4. **Construye un golden set de cincuenta elementos** y conéctalo a la CI como puerta de merge. Una tarde con un experto del dominio.
5. **Escribe el arnés de replay** — un comando, un request ID, la petición reconstruida. En menos de una hora descubrirás qué campos no estabas registrando.
6. **Define un camino de escalada** para las entradas de baja confianza, y mide con qué frecuencia se activa. Si nunca se activa, tus umbrales son decorativos.

## Qué cambia cuando piensas así

La pregunta deja de ser qué modelo es el más listo y pasa a ser cómo de estrecha es realmente la distribución de cosas que este sistema puede hacer.

Es incómodo, porque estrecharla significa devolver parte de lo que hizo que la demo funcionara. La salida restringida es menos expresiva. Menos pasos significa menos autonomía. Los umbrales de escalada significan una tasa de automatización más baja en la diapositiva.

Cambias techo por suelo. Nadie pone el suelo en una keynote.

Pero el suelo es lo que compra una empresa. Un sistema brillante el 80% de las veces y sin rendir cuentas el resto es un pasivo con buena prensa. Un sistema competente el 95% de las veces, honesto sobre el otro 5% y reconstruible cuando alguien pregunta: ese es el que se despliega.

La capacidad era el problema de investigación. Acotarla es el de ingeniería, y es la mitad que nadie financió.

---
