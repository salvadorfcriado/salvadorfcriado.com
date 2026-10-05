---
title: "El producto son los gates, no la orquestación"
date: 2026-08-25
tags: [llmops, evaluation]
readingTime: 9
excerpt: "La orquestación de un pipeline de contenido con IA es lo aburrido. Lo que decide si un texto sale es un conjunto de funciones sin modelo con un exit code."
---

El borrador era un post de LinkedIn con un bloque de código delimitado dentro. LinkedIn no renderiza Markdown, así que lo que habría salido eran tres backticks, el texto y otros tres backticks, tal cual, como caracteres. Al modelo que lo escribió se le había dicho la plataforma de destino. Lo sabía. Generó el bloque igualmente, y nada en el pipeline protestó, porque lo único que había entre ese borrador y el portapapeles era otro modelo leyéndolo para juzgar su calidad.

Esto es lo que cambié y por qué. El pipeline era antes un workflow de n8n. Ahora es un repositorio donde lo último que toca un borrador es una función sin ningún modelo dentro que devuelve 0 o 1. Esa reconstrucción movió mi estimación de dónde está la ingeniería en estos sistemas, y este artículo es esa estimación: qué reglas merecen aplicarse mecánicamente, en qué orden ejecutar las comprobaciones, el modo de fallo que nunca se instrumenta y dónde deja de funcionar todo el enfoque.

## Un modelo no puede decirte que lo ha comprobado

Cualquier interfaz entre tú y un modelo de lenguaje le permite informar en lugar de demostrar. Una instrucción en el prompt se satisface afirmando que se cumple. Un checklist en el system prompt se satisface afirmando que se cumple. Una autoevaluación en la respuesta se satisface generando un número. Nada de esto es exactamente mentir. Es un sistema en el que la medición y lo medido salen del mismo forward pass, así que la medición no aporta información independiente.

El exit code de un proceso es la única interfaz donde eso no es posible. La función se ejecuta o no se ejecuta. Lee los bytes en disco, no la intención que los produjo.

La consecuencia práctica es que la comprobación se convierte en un comando que cualquiera puede ejecutar. En mi pipeline, el mismo comando de gate lo consumen tres llamadores que no comparten nada:

- un **Stop hook** en el harness del agente, que se ejecuta cuando el modelo intenta terminar su turno;
- un **driver headless**, que ejecuta una pieza de principio a fin sin un humano en el bucle;
- un **caso de pytest**, que lo ejecuta contra fixtures en cada edición.

Ninguno de los tres adapta el gate. Todos lo invocan y leen el código de salida. Esa es toda la superficie de integración, y es la razón por la que la misma regla no puede significar una cosa en interactivo y algo más laxo en batch. Una regla que se comporta distinto según quién pregunte no es una regla.

La salida del fallo importa tanto como el exit code. Un simple distinto de cero te dice que algo va mal y no le da al modelo nada sobre lo que actuar. Lo que vuelve en su lugar es el nombre del gate, el valor que midió y el límite contra el que lo midió:

```
[article.em_dash_density]  3.1 per 100 words, limit 1.5
[post.code_fence]          fenced block at line 12, limit 0
exit 1
```

Tres campos, y la distancia entre dónde está el borrador y dónde tiene que estar deja de ser una cuestión de opinión. La petición de revisión se escribe sola, y se escribe igual cada vez.

## Dos fallos que parecen idénticos desde la silla del operador

"El pipeline ha producido algo que no voy a publicar" es una frase que cubre dos fallos distintos, y se arreglan en direcciones opuestas. Confundirlos es la razón por la que la gente reescribe prompts que nunca fueron el problema.

El diagnóstico es un comando. Ejecuta los gates.

| Síntoma | Comprobación | Fallo | Qué cambia |
|---|---|---|---|
| Texto que rechazas, los gates salen con distinto de cero | Lee el gate que se nombra y el valor infractor | **Violación de regla.** La regla existía y el bucle no se cerró | La vía de feedback del gate, o el umbral |
| Texto que rechazas, los gates salen con 0 | Pregúntate qué regla ha roto. No puedes nombrar ninguna | **Fallo de criterio.** La regla aún no existe | La rúbrica, o el esquema |
| Texto que aceptas, los gates salen con distinto de cero | Compáralo con trabajo que ya publicaste | **El gate está mal.** Rechaza salida aceptable | El gate, y solo el gate |
| El mismo rechazo se repite entre borradores | Comprueba si la regla está solo en el texto del prompt | **Una sugerencia, no una regla** | Ponla detrás de un exit code |

La segunda fila es la cara, porque es la fila en la que ajustar el prompt parece progreso. Si no puedes nombrar la regla que rompió el texto, ninguna edición del prompt va a producir de forma fiable un texto que no la rompa. Le estás pidiendo al modelo que infiera una restricción que no has enunciado, y lo conseguirás algunas veces, que es peor que nunca, porque ese algunas veces es lo que hace que la gente siga insistiendo.

La señal que separa las filas es qué artefacto acabas editando. Una violación de regla cambia un umbral o añade una comprobación. Un fallo de criterio cambia la rúbrica o el esquema. Si te encuentras editando el borrador directamente, no has diagnosticado nada y has producido a mano una buena pieza.

## Qué reglas merecen ser un gate

No todas, y hacer como que sí te deja un gate que falla con buen trabajo, que es peor resultado que no tener gate. Este pipeline acabó con 27 gates más el gate de build: 13 en posts, 12 en artículos y 2 comprobaciones de repetición compartidas.

**La regla: si puedes nombrar la subcadena que falla o calcular el número que falla, escribe el gate. Si lo máximo que puedes hacer es describir el olor, no lo escribas.**

Aplicada en un sentido: la lista negra de escritura de máquina. Las señales que delatan un texto como salida de modelo sin editar son, al nivel que importa, un conjunto finito de cadenas literales y una o dos construcciones. Se deciden con una búsqueda de subcadena. No hay criterio en ello, ningún caso límite que necesite un modelo para arbitrar. Es un gate, se ejecuta sin ninguna llamada a modelo y nunca se contradice.

Aplicada en el otro: "¿esto es interesante?". Restricción real, y la que más determina si una pieza merece publicarse. No se puede nombrar como subcadena ni calcular como número. Escríbela como gate y obtienes un proxy: número de palabras, densidad de encabezados o nivel de lectura, y ninguno es lo que querías decir. El proxy adquiere entonces una autoridad que no se ha ganado y empieza a rechazar piezas buenas por cortas. Eso va en una rúbrica contra la que puntúa un modelo, o en manos de un humano, y lo honesto es dejarlo ahí en lugar de disfrazarlo de exit code.

La regla tiene un corolario que no cuesta nada y ahorra toda una categoría de bugs. **Un gate que necesita un número necesita ese número declarado una sola vez.** Si el umbral vive en el gate y además aparece en el prompt como prosa, tienes dos copias, y van a divergir. Lo que me lleva al fallo que no vi venir.

## Ejecuta las comprobaciones deterministas baratas antes de que nada caro mire el texto

El orden es gates, luego crítico, luego humano. Invertirlo es el desperdicio más común en estos pipelines, y no es solo un argumento de coste.

El bloque de código es el ejemplo. Un crítico basado en modelo que lee buscando la calidad del argumento no tiene motivo para señalar un bloque delimitado. No es una debilidad del argumento. No es una señal de texto generado. El crítico lee buscando aquello en lo que un crítico es bueno, y un formato que no va a sobrevivir en la plataforma de destino no está en esa lista. Una comprobación del delimitador no puede pasarlo por alto, no se la puede convencer de lo contrario y no cuesta nada.

Esa es la forma general: los fallos que caza una comprobación de subcadena son justo los fallos en los que la atención humana y la del modelo son peores. La atención va al significado. Nadie revisa un delimitador. Gastar una llamada a modelo y luego veinte minutos de una persona en un borrador que la suite determinista habría rebotado en menos de dos segundos no es un error de redondeo en coste: es un error de redondeo en coste y un error grande en aquello en lo que los revisores caros gastan su atención.

La aplicación forzosa es lo que hace que el orden se mantenga. El Stop hook devuelve una decisión de bloqueo con los fallos de cada gate incluidos literalmente. El modelo no puede terminar su turno. No se le pide revisar en un prompt que puede decidir ignorar: la revisión la impone el harness, y el mismo harness la volverá a imponer si el siguiente borrador falla. El bucle termina cuando los gates salen limpios, y esa es la única condición en la que termina.

Orden de operaciones, de más barato a más caro:

1. **Gates deterministas.** Sin modelo. Milisegundos. Fallos estructurales y léxicos.
2. **El crítico basado en modelo contra una rúbrica versionada.** Solo se ejecuta sobre texto que ya pasa todos los gates.
3. **El humano.** Lee buscando lo que ninguno de los anteriores puede puntuar.

Cada etapa cuesta más que la anterior, y cada una solo es buena con los fallos que la anterior no puede ver. Ejecutarlas en otro orden no produce una respuesta errónea. Produce la respuesta correcta después de pagar a los revisores equivocados.

## La trampa: tus prompts son configuración y nadie les hace diff

Este es el bug que me hizo reconstruir en vez de parchear.

El workflow de n8n contenía, en el texto de un prompt, una instrucción para generar imágenes con una paleta de colores concreta. Esa paleta se había retirado. La marca había pasado a otra, el sitio se había movido con ella y el prompt no, porque el texto de un prompt no es código y nadie lo revisa como código.

No falló nada. Ni error, ni warning, ni nada en rojo. El workflow funcionaba correctamente y generaba exactamente según la especificación, contra la especificación equivocada, y siguió haciéndolo. Esta es la propiedad que hace que la deriva de prompts sea distinta de cualquier otra deriva de configuración en un sistema: en cualquier otro sitio, un valor obsoleto produce un error o una salida visiblemente rota. En el texto de un prompt produce una salida segura, bien formada y plausible que está mal de una forma que solo ve quien conoce la especificación actual.

La vigilancia no arregla esto. Yo sabía que la paleta había cambiado. Soy la persona que la cambió. El prompt no estaba en el conjunto de sitios que yo consideraba lugares donde podía haber una paleta.

La solución estructural es dejar de tener dos copias. Los umbrales y los ajustes viven en un único módulo de configuración y se sustituyen en los prompts en el momento de la llamada. El prompt contiene el hueco, no el valor. Hay exactamente un sitio donde cambiar un número, y ninguna reformulación en prosa que olvidar. La suite de tests tiene una aserción para esto en concreto: falla si un valor configurado aparece como literal en el texto de un prompt. La deriva de configuración deja de ser algo que cazas acordándote y pasa a ser algo que cazas ejecutando los tests.

## Los goldens impiden que los gates se cierren del todo

Cada gate que añades estrecha el espacio de lo que puede salir. Para eso está un gate. También es una fuerza en un solo sentido: nadie se levanta con ganas de relajar una regla, y cada endurecimiento por separado parece razonable el día que se hace. Sigue así el tiempo suficiente y el pipeline ya no puede producir nada que te guste, y el fallo es invisible porque cada paso estaba justificado.

El contrapeso es un corpus fijo de trabajo que ya aprobaste. Las piezas publicadas previamente se comprueban en la suite de tests. Un gate nuevo que rechace una de ellas rompe el build.

Fíjate bien en la dirección, porque ahí está todo el valor. El veredicto por defecto es que **el gate está mal hasta que se demuestre lo contrario**, no que la pieza antigua fuera mala. Eres libre de concluir que la pieza era mala y actualizar el corpus, pero tienes que tomar esa decisión de forma explícita, y tienes que tomarla mirando la pieza concreta que el gate acaba de rechazar. Lo que no puedes hacer es endurecer una regla y descubrir seis semanas después que excluyó sin avisar el registro en el que intentabas escribir.

La economía es lo que convierte esto en una red de seguridad real y no en ceremonia. La suite son 171 tests, se ejecuta en unos 1,2 segundos y no invoca ningún modelo. Nada en ella necesita programarse, agruparse ni reservarse para el día de la release. Se ejecuta en cada edición, lo que significa que la comprobación de goldens no es un gate que tengas que acordarte de pasar. Es algo que ya se cumple o ya está roto cuando terminas de teclear.

## Dónde deja de ser cierto

Los gates son necesarios y ni de lejos suficientes, y un argumento como este solo merece hacerse si también dice lo que no puede hacer.

**La prosa no es reproducible.** Cada gate de aquí restringe el espacio de salida. Ninguno dice nada sobre si lo que cae dentro de ese espacio merece leerse. Dos borradores que pasan todas las comprobaciones pueden ser completamente distintos en calidad, y el exit code es idéntico. Los gates garantizan un suelo y ningún techo, y si no has construido las partes del sistema que buscan el techo, un build en verde no te dice casi nada.

**Una pieza que pasa todos los gates puede seguir siendo sosa.** Es el mismo límite dicho en la dirección que cuesta dinero. Nada en una comprobación determinista detecta que un artículo está bien formado, correctamente citado, libre de señales, con el tamaño adecuado y es aburrido. Ese juicio sigue en la rúbrica y en mí, y por muchos gates que escriba no se va a mover de ahí.

**Los umbrales son opiniones con números pegados.** El gate de repetición de este pipeline rechaza un borrador con una similitud de 0.60, y el 0.60 lo elegí yo. Es una primera estimación. No he medido la distribución de esa métrica entre textos que considero buenos y textos que considero malos, y hasta que lo haga, ese número tiene exactamente el mismo estatus epistémico que la paleta retirada del workflow antiguo: un valor que se aplica con total seguridad porque alguien lo escribió una vez. La diferencia es que este está en un único sitio y con nombre, así que cuando lo mida habrá una sola línea que cambiar. Esa es toda la mejora, y vale la pena tenerla, y no equivale a tener razón.

El movimiento que antes se amortiza es pequeño. Coge una regla que hoy enuncias en un prompt, una para la que puedas nombrar una subcadena o un número que falla, y escríbela como una función que devuelve un exit code. Luego ejecútala contra las últimas cinco cosas que publicaste. Si falla en una de ellas, has aprendido algo sobre la regla antes de que tuviera autoridad sobre ningún borrador.
