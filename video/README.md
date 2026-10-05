# video/

Animaciones de los servicios de la landing, generadas con [Remotion](https://www.remotion.dev/).
No forma parte del build del sitio: tiene su propio `package.json` y escribe en `../public/video/`.

- Una composición por servicio × idioma: `voice|docs|billing|assistant|infra` × `es|en` (1200×800, 10 s, sin audio).
- Textos de los clips: `src/strings.ts`. Paleta y fuentes: `src/theme.ts` (espejo de `src/styles/global.css`).
- Los ejemplos de los clips (hotel, albarán, importes) son ilustrativos e inventados a propósito.

```bash
npm install
npm run studio               # previsualizar
node render.mjs              # renderiza todo → public/video/<id>.{mp4,webm,webp}
node render.mjs voice-es     # solo esos ids
```

El último frame es igual al primero (fondo vacío), así que el clip se encadena en bucle sin salto.
El póster (`.webp`, frame 250) es lo que ve quien tiene activado «reducir movimiento».
