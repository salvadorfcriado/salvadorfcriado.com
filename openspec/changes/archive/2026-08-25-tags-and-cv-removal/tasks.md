## 1. Vocabulary and schema

- [x] 1.1 Create `src/tags.ts`: ordered `TAGS` array of `{ slug, label, blurb }` for the seven active tags, a `TAG_SLUGS` tuple derived from it for Zod, a `tagLabel(slug)` lookup, and the commented reserve list plus the promotion rule
- [x] 1.2 Change `src/content.config.ts` from `tag: z.enum([...])` to `tags: z.array(z.enum(TAG_SLUGS)).min(1).max(3)`, importing the tuple from `src/tags.ts`
- [x] 1.3 Migrate the three post frontmatters to `tags` per the mapping in the removed-requirement migration note, choosing primary order deliberately
- [x] 1.4 Run `npx astro check` (or a build) and confirm the schema validates all three posts and that a deliberately bad tag fails the build

## 2. Tag surfaces

- [x] 2.1 Update `src/components/Cover.astro` to take the primary tag and render its label
- [x] 2.2 Add `src/pages/blog/tags/[tag].astro`: `getStaticPaths` from published posts (not from the vocabulary), heading from `label`, intro and meta description from `blurb`, posts newest-first, chip row with `aria-current="page"` on the current tag, "← All posts" link back to `/blog/`
- [x] 2.3 Add the chip row to `src/pages/blog/index.astro` (links to archives, only tags in use) and render each row's full tag list in the meta line
- [x] 2.4 Update `src/pages/blog/[...slug].astro`: tag chips linking to archives in the post header, `keywords` in JSON-LD as the full tag list
- [x] 2.5 Update the writing section of `src/pages/index.astro` to read `tags` instead of `tag`
- [x] 2.6 Update `src/pages/rss.xml.js` to emit one `<category>` per tag, in declaration order
- [x] 2.7 Update `src/pages/llms.txt.ts` to list all of a post's tags
- [x] 2.8 Style the chips in the existing token vocabulary — mono face, accent for active, hairline border; no new colour, no new font family

## 3. Per-post preview cards

- [x] 3.1 Write `scripts/og.mjs` (replacing the broken `scripts/og.cjs`, whose hard-coded font filenames went stale when `fonts.mjs` started content-hashing them): parse frontmatter from `src/content/blog/*.md`, skip drafts, render 1200×630 PNG per slug into `public/img/og/`, inlining the fonts from `src/styles/fonts.css`; card shows primary tag label as eyebrow, title as display face, domain and date as footer
- [x] 3.2 Make the script exit non-zero with an explicit message naming the expected Puppeteer path when the toolchain is unavailable
- [x] 3.3 Add `"prebuild": "node scripts/og.mjs"` to `package.json` so `npm run build` regenerates cards first
- [x] 3.4 Add `public/img/og/` to `.gitignore` — the cards are build output
- [x] 3.5 Run the script and eyeball every generated card: long titles must wrap and stay inside the frame, not overflow or clip

## 4. Open Graph metadata

- [x] 4.1 Add `ogType` (default `website`) and an optional `article` prop (`publishedTime`, `modifiedTime`, `tags`) to `src/layouts/Base.astro`
- [x] 4.2 Emit `og:image:width`, `og:image:height` and `og:image:alt` on every page; keep `og:image` resolved to an absolute URL
- [x] 4.3 Emit `article:published_time`, `article:modified_time` and one `article:tag` per tag when `ogType` is `article`
- [x] 4.4 Have `src/pages/blog/[...slug].astro` pass `ogType="article"`, the article metadata, and `ogImage` resolved as `data.cover ?? /img/og/<slug>.png`

## 5. CV removal

- [x] 5.1 Delete `cv` from `SITE` in `src/consts.ts`
- [x] 5.2 Remove the `CV (PDF)` button from the hero in `src/pages/index.astro`
- [x] 5.3 Remove the CV line from `src/pages/llms.txt.ts`
- [x] 5.4 Delete `public/cv/salvador-criado-cv.pdf`
- [x] 5.5 Document the `/cv/*` → `/` 301 redirect rule in `docs/infrastructure.md` alongside the existing zone rules

## 6. Documentation

- [x] 6.1 Add the publish ordering to the deploy section of `docs/infrastructure.md`: deploy, verify the card resolves at its absolute URL, refresh through LinkedIn Post Inspector, then compose the post
- [x] 6.2 Update `README.md` with how to tag a new post and how to promote a reserve tag

## 7. Verify

- [x] 7.1 `npm run build` succeeds
- [x] 7.2 In `dist/`: one directory per active tag under `blog/tags/`, and none for unused tags
- [x] 7.3 In `dist/`: each post's HTML carries an absolute `og:image` pointing at its own card, `og:type` `article`, and width/height/alt
- [x] 7.4 In `dist/`: grep finds no reference to `/cv/`, `salvador-criado-cv.pdf`, `voice` or `stacks` as a tag value, and no `salvador-criado-cv.pdf` asset
- [x] 7.5 `dist/rss.xml` carries every tag as a category; `dist/llms.txt` lists tags and omits the CV
- [x] 7.6 Check the pages render — blog index chips, an archive page, a post page — in a local preview

## 8. Deploy

- [x] 8.1 Commit on a branch and merge to `main`
- [x] 8.2 Deploy to Cloudflare Pages by direct upload per `docs/infrastructure.md` — deployment `b147ef5e-153e-4a48-bb5d-145e65807660`, production, 37 assets
- [x] 8.3 Add the `/cv/*` → `/` 301 redirect rule on the zone and confirm a former CV URL redirects
- [x] 8.4 Confirm each generated card resolves over HTTPS at its absolute URL
- [x] 8.5 Run all three published post URLs through LinkedIn Post Inspector and confirm each reports its own card
