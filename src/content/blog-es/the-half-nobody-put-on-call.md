---
title: "La mitad de tu sistema GenAI que nadie puso de guardia"
date: 2026-09-10
tags: [llmops, data-engineering, rag]
readingTime: 8
excerpt: "Ningún RAG se rompe: deja de acertar sin avisar. Las tareas que nadie apuntó, tres mecanismos que las hacen seguras y qué poner en un dashboard."
---

Ningún sistema RAG se rompe. Simplemente deja de acertar, sin hacer ruido.

No hay error. No hay alerta. No hay dashboard en rojo. El servicio responde cada petición en 400 milisegundos con total seguridad, y en algún momento empezó a responder a partir de una foto del mundo de hace cuatro meses — porque la última vez que alguien reconstruyó el índice fue con un script lanzado desde un portátil mientras se preparaba la demo.

Esa es la forma habitual. La mitad LLM se trata como una aplicación: versionada, desplegada, monitorizada, con guardia. La mitad de datos se trata como una tarea doméstica. Y es la mitad de datos la que decide si las respuestas son verdad.

Este artículo va de esa otra mitad: las tareas que nadie apuntó, los tres mecanismos que hacen seguro ejecutarlas y qué poner en un dashboard para que la obsolescencia deje de ser invisible.

---

## La obsolescencia es un tipo de fallo silencioso

Cualquier otro fallo de tu stack se anuncia. Este no, y ese es todo el problema. Esta es la taxonomía, con cómo aflora realmente cada caso:

| Fallo | Cómo lo ve el usuario | Cómo lo detectarías |
|---|---|---|
| Cambió la fuente, no el índice | Respuesta segura a partir de un documento sustituido | Antigüedad del doc indexado más reciente vs antigüedad del doc más reciente en origen |
| Documento borrado, el vector sigue | Cita una política que ya no existe | Recuento en el índice vs recuento en origen |
| Modelo de embeddings actualizado, corpus re-embebido a medias | Calidad errática, unas consultas bien, otras fatal | Recuento de vectores por versión de modelo |
| Fallo de parseo omitido en silencio | "No tengo información sobre eso" — de un documento que *sabes* que indexaste | Tasa de fallos de parseo, como métrica de primera clase |
| Cambió la configuración de chunking, se quedaron los chunks viejos | Resultados duplicados casi idénticos, respuestas incoherentes | Recuento de chunks vs el esperado para el tamaño del corpus |
| Doc sustituido nunca eliminado | Compiten la versión vieja y la nueva; a veces gana la vieja | Documentos sin filtro por `effective_date` |

Fíjate en que ninguno lanza una excepción. Todos devuelven un 200 en 400 milisegundos. Ningún manejo de errores los va a cazar. La solución es planificación y medición.

---

## Las tareas que nadie apuntó

Apunta lo que de verdad tiene que ejecutarse de forma programada y el panorama se vuelve incómodo enseguida.

**Re-ingesta.** Los documentos de origen cambian. Alguien edita la política, retira el producto, sube una lista de precios nueva. Si el índice solo se entera cuando un humano se acuerda, el índice es un rumor.

**Re-embedding.** Actualizas el modelo de embeddings y cada vector ya almacenado pasa a estar medido en otra escala. Los vectores viejos y los nuevos no viven en el mismo espacio, y mezclarlos es peor que cualquiera de los dos por separado — la similitud entre ellos no está degradada, directamente no significa nada. Es una reconstrucción del corpus completo. Es la tarea programada más cara de todo el sistema, y precisamente por eso se pospone hasta que los resultados son tan malos que obligan a hacerla.

**Evaluación programada.** Un [golden set](/es/blog/rag-ranking-not-retrieval/) vale exactamente lo que vale su cadencia. Ejecútalo cada noche y una regresión la detecta un job. Ejecútalo cuando alguien se acuerde y la regresión la detecta un cliente.

**Fallos de parseo visibles.** Doce PDF no se pudieron extraer. Si eso es un warning en un log que nadie lee, tu índice encoge unos puntos por trimestre y cada hueco aparece después como una respuesta errónea y segura sobre un documento que crees haber indexado.

**Retención y sustitución.** Los documentos que se reemplazaron pero nunca se eliminaron siguen compitiendo con los que los reemplazaron. A veces ganan.

Reintentos. Dependencias. Backfills. Idempotencia. Cosas que fallan haciendo ruido.

---

## Nada de esto es nuevo

Eso es un pipeline de datos. La ingeniería de datos lleva más de una década con un vocabulario aburrido y nada glamuroso para ello, y la traducción es exacta:

| Cómo se dice en GenAI | Cómo lo llama ya la ingeniería de datos |
|---|---|
| "Hay que re-embeber todo tras actualizar el modelo" | Un **backfill** |
| "Alguien debería revisar la calidad de vez en cuando" | Un **DAG programado con una quality gate** |
| "Ese PDF no se importó" | Una **tarea que falla**, no una fila que desaparece |
| "Procesar solo lo que ha cambiado" | **Procesamiento incremental con watermark** |
| "Lanzar el reindexado dos veces lo rompió" | No tienes **idempotencia** |
| "La reconstrucción del índice corrió mientras la API consultaba" | Necesitas **promoción atómica** |

El ecosistema GenAI no para de acuñar sustantivos nuevos para esto. El problema de orquestación lo resolvió hace mucho gente que no estaba hablando de IA.

---

## Tres mecanismos que hacen seguras las tareas

Programar las tareas no basta. Ejecútalas de forma ingenua y provocarás la caída que intentabas evitar. Tres patrones hacen la mayor parte del trabajo.

### 1. IDs por hash de contenido hacen la re-ingesta idempotente

El bug de ingesta más común: un job se vuelve a ejecutar y ahora el corpus tiene cada chunk dos veces. La calidad del retrieval se hunde, porque tu top-5 son tres copias del mismo pasaje.

La solución es que la identidad del chunk **se derive de su contenido**, no del orden de inserción. Haz hash del ID del documento de origen más el índice del chunk más el texto del chunk, y convierte ese hash de forma determinista al tipo de ID del vector store ([Qdrant](https://qdrant.tech/documentation/concepts/points/), por ejemplo, acepta enteros sin signo o UUID — así que un UUIDv5 sobre el hash, no la cadena hexadecimal en bruto, que es el tipo de detalle que te cuesta una tarde).

Ahora cada escritura es un upsert. Volver a ejecutar el job sobre contenido sin cambios no hace nada. Volver a ejecutarlo sobre contenido cambiado sobrescribe en el sitio. Un reintento es seguro, un backfill es seguro, y una ejecución que falló a medias se puede lanzar otra vez sin más — que es lo que convierte todo el pipeline en algo reiniciable en vez de algo sobre lo que un humano tiene que razonar a las 2 de la madrugada.

### 2. Colecciones blue/green hacen seguro el re-embedding

No puedes re-embeber en el sitio. A mitad de camino, tu índice contiene dos espacios vectoriales incompatibles y cada consulta es lanzar una moneda.

Construye en una **colección nueva** y cambia un alias:

```
1. Create collection  docs_v7  (new embedding model)
2. Embed the full corpus into docs_v7 — hours, and the API never notices
3. Run the retrieval golden set against docs_v7
4. Gate: Recall@5 must not regress vs the live collection
5. Atomically repoint the alias  docs → docs_v7
6. Keep docs_v6 for one cycle. That is your rollback.
```

La aplicación solo consulta el alias, así que nunca se entera de que hubo una reconstrucción. El paso 4 es el que la gente se salta y el que importa: es la diferencia entre un despliegue y una esperanza. El paso 6 es lo que convierte una mala actualización de embeddings de un incidente en un revert de una línea.

Esto es despliegue blue/green. Lleva quince años siendo práctica estándar con servidores de aplicaciones. El índice vectorial es una pieza con estado más que estás reemplazando, y merece la misma disciplina.

### 3. La evaluación como gate, no como informe

Una evaluación nocturna que manda un número por correo a un canal que nadie lee es teatro.

Conviértela en una tarea que **falle**. Recall@5 por debajo del umbral, el DAG se pone en rojo y el alias no se mueve. Ahora tu métrica de calidad tiene autoridad sobre el despliegue, que es lo único que separa la medición de la decoración.

El mismo gate va en el camino de ingesta: una tasa de fallos de parseo por encima del umbral hace fallar la ejecución en lugar de encoger el corpus en silencio. Un pipeline que pierde un 3% de los documentos por trimestre sin quejarse no es un pipeline. Es una fuga con horario.

---

## Cómo es el DAG en realidad

Nada exótico. De eso se trata.

- **Sensor o trigger por evento** sobre el origen — notificación del object storage, feed de CDC o un sondeo programado de toda la vida con watermark, para recoger solo lo que cambió desde la última ejecución correcta.
- **[Dynamic task mapping](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/dynamic-task-mapping.html)** para repartir el parseo y el embedding por documento, de modo que un fichero envenenado haga fallar una tarea y no la ejecución entera.
- **Un pool** que limite las tareas de embedding concurrentes, porque la GPU es el recurso escaso y el paralelismo sin límite solo significa OOM en lugar de throughput.
- **[Deferrable operators](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/deferring.html)** para las esperas largas, para que un embedding de seis horas no tenga secuestrado un slot de worker.
- **Triggering por asset/dataset** para que el DAG de evaluación se ejecute *porque* se reconstruyó el índice, no porque un cron supuso que para entonces ya habría terminado.
- **Reintentos con backoff** en todo lo que toque una API externa, y **ningún reintento** con un documento realmente malformado — ese debe quedarse en rojo hasta que lo mire un humano.

Cada uno de ellos es una primitiva de Airflow que precede en años al ciclo actual de IA.

---

## El dashboard

Si te quedas con una sola cosa de este artículo, que sea esta lista. Seis números, y la obsolescencia deja de ser invisible:

1. **Antigüedad del índice** — horas desde que entró en el índice el documento más reciente. El número más útil de todo el sistema.
2. **Delta entre origen e índice** — documentos en origen menos documentos indexados. Debería estar cerca de cero y no lo está.
3. **Tasa de fallos de parseo** — por ejecución, con los nombres de fichero. No una línea de log. Una métrica.
4. **Recall@5 sobre el golden set** — como serie temporal, para ver la erosión en vez de descubrir un precipicio.
5. **Distribución de versiones del modelo de embeddings** — cuántos vectores salieron de cada modelo. Cualquier cosa distinta de 100% en una versión significa una migración interrumpida.
6. **Tiempo desde el último re-embedding completo** — el número que te dice cuánto lleva de retraso la tarea cara.

Ponlos junto a tus [dashboards de latencia y tokens](/es/blog/temperature-zero-is-not-deterministic/). Que normalmente vivan en otra herramienta, de otro equipo, explica buena parte de por qué existe este problema.

---

## De dónde sale esto

Para ser preciso con lo que afirmo: el dolor de arriba viene de trabajo real — índices obsoletos, evaluaciones lanzadas a mano, documentos que fallaron al parsear sin que nadie se enterara. La capa de Airflow es donde he ido poniendo la respuesta, y esa parte es un entorno autoalojado sobre Kubernetes más estudio deliberado este año, no un despliegue en producción para un cliente.

Lo digo claramente porque la alternativa es lo que menos soporto de este campo: gente describiendo una arquitectura sobre la que ha leído como si la hubiera operado. Lo que puedo garantizar es la forma del problema, y que el vocabulario para resolverlo es más antiguo y más aburrido que la disciplina que ahora lo busca.

Cuanto más trabajo en esto, más me parece que la parte difícil es ingeniería de datos con sustantivos nuevos. Lo cual es buena noticia: ese campo es maduro, y los patrones se trasladan intactos.

---

## La pregunta

El modelo es la parte que se lleva la demo. El scheduler es la parte que decide si la demo sigue diciendo la verdad dentro de seis meses.

Así que: ¿cuándo se reconstruyó por última vez tu índice vectorial? Si la respuesta honesta es "cuando alguien lanzó el script por última vez", no tienes un sistema GenAI en producción. Tienes una demo GenAI que lleva un tiempo funcionando.

---
