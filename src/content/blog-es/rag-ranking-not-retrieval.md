---
title: "Tu RAG no tiene un problema de retrieval. Tiene un problema de ranking."
date: 2026-08-27
tags: [rag, search-retrieval, evaluation]
readingTime: 9
excerpt: "El documento estaba en el índice y la respuesta seguía mal. Cómo distinguir un fallo de retrieval de uno de ranking, qué arreglar primero y cuánto cuesta."
---

El documento estaba en el índice. La respuesta seguía estando mal.

Es el bug que más días se come, porque todo el instinto te manda al sitio equivocado. Revisas el prompt. Revisas el modelo. Empiezas a mirar precios de uno más grande. Alguien sugiere hacer fine-tuning.

Luego miras de verdad lo que devolvió el retriever, y el chunk correcto está en la posición 14. Al modelo nunca le llegó. No había nada roto. Volvió en el orden equivocado, y los cinco primeros se quedaron con la ventana de contexto.

Eso no es un fallo de retrieval. Es un fallo de ranking, y los dos se diagnostican como si fueran lo mismo — por eso hay equipos que se pasan sprints trabajando en la mitad equivocada del sistema.

Este artículo es el diagnóstico que me habría gustado tener: cómo saber qué fallo tienes en realidad, en qué orden arreglarlo y cuánto cuesta cada arreglo.

---

## Primero: deja de adivinar. Mide el retriever por separado.

Casi todos los equipos miden la respuesta final. Es el error más caro en RAG, porque hace que cada bug de retrieval llegue disfrazado de problema del modelo — y los problemas del modelo se arreglan con dinero.

Necesitas un golden set para el **retrieval**, separado del de las respuestas. Son entre cincuenta y doscientas preguntas reales, cada una etiquetada con los IDs de los chunks que deberían volver. Construirlo es una tarde aburrida con un experto del dominio, y es la tarde con más palanca de todo el proyecto.

Después, tres números, y cada uno responde a una pregunta distinta:

| Métrica | Qué te dice | Para qué usarla |
|---|---|---|
| **Recall@k** | ¿Está el chunk correcto en algún sitio del top k? | El retriever. Mídelo a tu profundidad de candidatos (k=50, k=100). |
| **Recall@n** | ¿Sobrevivió hasta lo que el modelo ve de verdad? | El ranker. Mídelo a tu profundidad de contexto (k=5, k=10). |
| **MRR / nDCG@k** | ¿A qué altura quedó, de media? | Comprobar si un cambio en el reranker movió de verdad el orden. |

La distancia entre las dos primeras filas *es* tu problema de ranking, expresado como un número.

Recall@50 al 94% y Recall@5 al 61% significa que el retriever está bien y que la ordenación está tirando un tercio de tus respuestas correctas antes de que el modelo llegue a verlas. Es un lunes completamente distinto al de un Recall@50 del 55%, que significa que el chunk correcto no se está encontrando en absoluto y que ningún reranker del mundo te va a salvar.

**Haz esto antes que cualquier otra cosa de este artículo.** Todo lo que viene después es un arreglo para uno de esos dos números, y aplicar el equivocado te cuesta un sprint.

---

## La tabla de diagnóstico

A la izquierda, el síntoma; en el medio, la medida que discrimina; a la derecha, la causa probable.

| Síntoma | Medida | Causa probable |
|---|---|---|
| Chunk correcto en la posición 10–50 | Recall@50 alto, Recall@5 bajo | **Ranking.** Añade un reranker. |
| Chunk correcto fuera del top 100 | Recall@100 bajo | **Retrieval o chunking.** Revisa primero los parámetros del ANN, luego los límites de los chunks. |
| Solo falla con códigos, SKUs, apellidos, cadenas de error | Compara el recall solo léxico con el solo vectorial | **Falta la parte léxica.** Los vectores densos difuminan los tokens raros. |
| Chunk correcto encontrado, respuesta igual de mal | Recall@5 alto | **No es un problema de retrieval.** Ahora sí, ve a mirar el prompt. |
| El chunk correcto existe pero es media frase | Lee el chunk. Simplemente léelo. | **Chunking.** |
| Gana un documento correcto pero desactualizado | Revisa los campos de fecha en el payload | **Falta un filtro de metadatos.** |
| Funcionaba en dev, empeoró en prod | Compara el recall del ANN con búsqueda exacta sobre las mismas consultas | **Pérdida de recall por ANN/cuantización.** Ver abajo. |

---

## La trampa que nadie comprueba: tu índice ANN pierde información sin avisar

Antes de tocar los rankers, descarta esto, porque invalida todas las medidas anteriores.

La búsqueda vectorial es aproximada por construcción. [HNSW](https://arxiv.org/abs/1603.09320) recorre un grafo y se detiene cuando cree que ha convergido. Si el `ef` en tiempo de búsqueda es demasiado bajo, el chunk correcto se descarta **antes de que el ranking exista siquiera como concepto** — y nada lo registra. Tu recall no es el 100% de lo que hay en el índice; es lo que el recorrido del grafo haya alcanzado por casualidad.

Lo mismo con la cuantización. La cuantización escalar int8 o binaria reduce muchísimo la memoria y cuesta recall, y la pérdida no es uniforme — golpea justo los casos de vecinos cercanos, donde dos documentos están próximos y solo uno es el correcto. Que es el caso que importa.

La comprobación lleva diez minutos: pasa tu golden set por la búsqueda ANN, luego lanza las mismas consultas con búsqueda exacta/fuerza bruta sobre el mismo corpus y compara el Recall@k. Si la diferencia es significativa, sube `hnsw_ef`, o activa el rescoring con oversampling para que los candidatos cuantizados se vuelvan a puntuar contra los vectores a precisión completa, y vuelve a medir.

Los equipos encuentran aquí entre dos y doce puntos de recall tirados por el suelo, a cambio de un coste de latencia de milisegundos de un solo dígito. Es el arreglo más barato de todo el artículo y prácticamente nadie lo hace, porque el índice nunca informa de un fallo. Simplemente devuelve algo, sin hacer ruido.

---

## Palanca 1 — Búsqueda híbrida

La ganancia real más barata, y la que más se salta porque "ya tenemos embeddings" suena a la respuesta moderna.

Un modelo de embeddings comprime un chunk entero en un único vector antes de tener ni idea de qué le vas a preguntar. Optimiza la similitud temática. Que es justo el objetivo equivocado cuando la consulta depende de un único token raro: un código de error, un número de póliza, una referencia de producto, un apellido, una cadena de versión. La recuperación densa te dará encantada cinco documentos que *tratan sobre* códigos de error.

BM25 es el contrapeso, y tiene treinta años por algo: frecuencia de término con saturación, frecuencia inversa de documento para que dominen los términos raros, normalización por longitud para que los documentos largos no ganen por volumen. Los tokens exactos y raros son justo el caso para el que se diseñó.

Fusiona los dos. **Reciprocal Rank Fusion** es la opción por defecto porque no necesita calibrar puntuaciones entre dos sistemas cuyas puntuaciones no son comparables:

```
score(d) = Σ  1 / (k + rank_i(d))        k ≈ 60 by convention
         i∈retrievers
```

Solo lee la posición en el ranking, nunca las puntuaciones en bruto — y precisamente por eso es robusto. Un documento que los dos retrievers colocan razonablemente bien gana a uno que un retriever adora y el otro ni conoce. La mayoría de bases de datos vectoriales ya lo traen de serie ([Qdrant lo hace en una sola llamada a su Query API](https://qdrant.tech/documentation/concepts/hybrid-queries/) con `prefetch` + `fusion`), así que el coste de integración es casi cero.

**Cuándo no ayuda:** corpus sin vocabulario de tokens raros — texto narrativo, transcripciones de conversaciones, textos de marketing. Si tus documentos no tienen identificadores, BM25 no tiene nada que aportar y pagarás latencia para quedarte igual.

---

## Palanca 2 — El reranker

Aquí es donde la posición 14 se convierte en la 2.

La distinción de arquitectura es lo único que importa. Un bi-encoder — tu modelo de embeddings — codifica la consulta y el documento **por separado**, en dos vectores que nunca se encuentran, y los compara con un producto escalar. Eso es lo que lo hace lo bastante rápido para indexar millones de documentos, y también lo que lo hace perder información: el documento se codificó antes de que existiera la pregunta.

Un cross-encoder lee consulta y documento **juntos**, en un único forward pass, con atención completa entre ambos. Es capaz de ver que este pasaje menciona tu tema pero responde a otra pregunta. Es un juicio fundamentalmente mejor, y cuesta un forward pass por candidato — por eso no puedes pasarlo sobre un corpus, y sí puedes, sin ninguna duda, pasarlo sobre los cincuenta candidatos que ya tienes.

La aritmética de latencia es lo que determina tu profundidad. Una pasada de reranker sobre N candidatos son N forward passes, en batch. Los rerankers pequeños procesan 50 candidatos en decenas de milisegundos en GPU; las APIs de rerank alojadas añaden además un salto de red. Ese presupuesto es la restricción que fija N — no una buena práctica.

Eso importó de forma muy concreta en un sistema de voz en tiempo real que construí, donde todo el bucle speech-to-text → LLM → text-to-speech tenía que cerrarse en menos de dos segundos. El retrieval y el reranking compiten por milisegundos con las partes del pipeline que quien llama sí oye. En voz se hace un rerank poco profundo y el chunking tiene que ganarse el sueldo. En un flujo asíncrono donde el usuario espera tres segundos por una respuesta escrita, puedes ir mucho más hondo. **La misma técnica, profundidad opuesta, decidida enteramente por el presupuesto de latencia.**

Regla general: recupera en ancho y barato (k=50–100, híbrido), haz rerank en estrecho y caro (top 5–10 al modelo). El recall es trabajo del retriever; la precisión, del reranker.

---

## Palanca 3 — Chunking y metadatos

Están por debajo de todo lo anterior. Si troceas mal, te pasas el resto de tu vida haciendo rerank de ruido.

Tres fallos causan la mayor parte:

**Chunks cortados a mitad de una idea.** Una ventana fija de 512 tokens que no respeta la estructura partirá una definición por la mitad. Media definición se recupera mal y no responde a nada. Trocea primero por estructura — encabezados, secciones, límites de listas — y recurre a ventanas fijas solo dentro de una sección demasiado larga.

**Chunks sin contexto.** Un párrafo que dice "esto no aplica a clientes con planes antiguos" no sirve de nada sin el encabezado tres niveles más arriba que dice a qué política pertenece. Antepón la ruta de encabezados al texto del chunk antes de generar el embedding. Es un cambio de dos líneas y mueve el recall más que la mayoría de cambios de modelo.

**Chunks sin payload.** Esta es la mitad infravalorada. Origen, tenant, tipo de documento, fecha de vigencia, versión — filtrar por eso *antes* del ranking elimina categorías enteras de respuestas erróneas gratis. Es más barato que cualquier reranker y nunca alucina. La mayoría de los [bugs de "respuesta desactualizada"](/es/blog/the-half-nobody-put-on-call/) son un filtro de fecha que falta, no un fallo del modelo.

---

## Palanca 4 — Análisis de la consulta

La última, y solo merece la pena recurrir a ella cuando las demás ya están en su sitio.

La pregunta del usuario no siempre es una buena consulta de búsqueda. Hay tres transformaciones que se pagan solas:

- **Extracción de metadatos.** "¿Cuánto le cobramos a Acme en el Q1?" contiene un filtro (`customer=Acme`, `period=Q1`) y una consulta. Saca el filtro y aplícalo como restricción en vez de esperar que el embedding lo codifique.
- **Descomposición.** Las preguntas multi-hop ("¿en qué se diferencia la política de devoluciones de la del año pasado?") necesitan dos recuperaciones y una comparación, no una búsqueda mezclada que encaja a medias con ambas.
- **Expansión / reescritura.** Las continuaciones conversacionales ("¿y para cuentas de empresa?") no significan nada por sí solas. Reescríbelas con el historial de la conversación antes de buscar. En sistemas de voz esto no es opcional — casi cada turno después del primero es un fragmento.

El coste: cada una añade una llamada al LLM delante del retrieval, lo que supone latencia y [una nueva superficie de fallo](/es/blog/temperature-zero-is-not-deterministic/). Merece la pena para un asistente de investigación. A menudo no la merece en un bucle de voz de menos de dos segundos, donde reescribes con el modelo más barato posible o directamente no reescribes.

---

## El orden de las operaciones

Hacer esto en otro orden es como se queman sprints. De lo más barato y diagnóstico a lo más caro:

1. **Construye el golden set de retrieval.** Sin él, nada de lo que sigue se puede medir.
2. **Compara el recall del ANN con la búsqueda exacta.** Diez minutos. Descarta un índice que pierde información sin avisar.
3. **Lee veinte chunks con tus propios ojos.** Encontrarás algo estructural. Todo el mundo lo encuentra.
4. **Añade filtrado por metadatos.** Precisión gratis, sin modelo de por medio.
5. **Añade búsqueda híbrida.** Barata, y una gran mejora en cualquier corpus con identificadores.
6. **Añade un reranker.** La gran palanca, con precio en milisegundos — fija la profundidad según el presupuesto.
7. **Luego, y solo luego, el análisis de la consulta.** La mayor complejidad y los modos de fallo más nuevos.

Fíjate en que el modelo no está en la lista. Normalmente no es la respuesta, y siempre es el sitio más caro por el que empezar a mirar.

---

## La pregunta más pequeña

Antes de cambiar el modelo, pregunta: **¿en qué posición volvió el chunk correcto?**

Si no sabes responder a eso, no estás depurando. Estás adivinando con pasos extra.

Y si sabes responderla, ya sabes cuál de las cuatro palancas necesitas — que era justo el sentido de medir.

---
