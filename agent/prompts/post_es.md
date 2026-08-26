<!-- stage: post_es -->

# Etapa: post_es

Escribe en español el post de LinkedIn que acompaña al artículo. Las reglas de
la casa que van arriba siguen vigentes, incluidas las listas de expresiones
prohibidas, que ya incluyen las propias del español.

Las puertas medirán este post como idioma `{{LANG}}`, y todos los límites que
aparecen abajo ya son los del español: el español ocupa entre un quinto y un
cuarto más que el inglés para decir lo mismo, así que la banda de longitud y el
límite de caracteres del gancho son más anchos aquí que en el post inglés.

## El artículo

{{ARTICLE}}

## No es una traducción

El artículo está en inglés. El post no se traduce: se escribe en español desde
cero, con la sintaxis del español. Los términos técnicos se dejan en inglés
cuando es así como los dice un ingeniero (embedding, reranker, backfill,
prompt); lo demás se dice en español.

Trato de tú, nunca de usted. Primera persona del singular.

## El post es la pieza, no el anuncio del artículo

Tiene que servirle a quien no abra el artículo. Coge el mecanismo más útil de la
pieza y entrégalo entero: el diagnóstico, la regla, el número, el modo de fallo.
Los demás se quedan en el artículo.

Una sola idea. Ni resumen del artículo ni lista de sus apartados.

## El gancho

La primera línea, sola, seguida de una línea en blanco.

- Como mucho {{POST_HOOK_MAX_CHARS}} caracteres y {{POST_HOOK_MAX_WORDS}}
  palabras. Los dos límites obligan: el de caracteres es el punto donde el móvil
  corta el texto.
- Nunca una pregunta.
- Concreto: una medición, un síntoma, un fallo con nombre.
- Cambia la forma de abrir de un post al siguiente.

## Cuerpo

- Entre {{POST_BODY_MIN_CHARS}} y {{POST_BODY_MAX_CHARS}} caracteres, contando
  los hashtags.
- Párrafos cortos, de una a tres frases, separados por una línea en blanco. Sin
  viñetas, sin listas numeradas, sin títulos.
- Al menos {{POST_MIN_DIGITS}} cifra en el cuerpo: una medición, un umbral, una
  versión, una posición. Sale del artículo, no de ti.
- Como mucho {{POST_MAX_EM_DASHES}} rayas largas en todo el post, y mejor
  ninguna. En español la coma y el punto y coma hacen ese trabajo.
- Como mucho {{POST_MAX_EMOJI}} emoji, nunca como viñeta, y mejor ninguno.
- Sin enlace saliente, ni en el cuerpo ni en el primer comentario: la plataforma
  penaliza el comentario igual que el cuerpo y además lo suprime.
- La última línea remata la idea o dice qué comprobar primero. No pide opinión,
  no pide interacción y no habla de él.

## Hashtags

Como mucho {{POST_MAX_HASHTAGS}}, al final ({{HASHTAG_POSITION}}), en su propia
línea después de una línea en blanco. De nicho y técnicos. En inglés si es así
como se etiqueta el tema en la plataforma.

## La voz, enseñada en lugar de descrita

Los ejemplos publicados están en inglés. Lo que se copia de ellos es el registro
y el ritmo, no las frases.

{{GOLDENS}}

## Salida

El texto del post y nada más. Sin título, sin etiqueta, sin comillas alrededor,
sin comentarios sobre la longitud.

## Si esto es un reintento

Vacío en el primer intento. Si no, es la salida literal de los gates sobre tu
post anterior, más las palabras del operador si las hay. Cada fallo nombra el
gate, el valor medido y el límite. Corrige lo que se nombra y nada más.

{{GATE_REPORT}}

{{OPERATOR_FEEDBACK}}
