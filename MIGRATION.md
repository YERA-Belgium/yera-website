# Live-site migration

Captured directly from `https://yera.be/` and the public API used by its frontend on 8 October 2026. The original Nuxt application was rendered in Chromium to identify its routes, API calls, original logo, language messages and current board. No search-index summaries are used in the migrated publications.

## Inventory

| Source collection | Imported records |
| --- | ---: |
| `article` | 126 |
| `article-english` | 8 |
| `event` | 46 |
| `bestuur` | 14 |
| `member` | 118 |
| `alumni` | 28 |
| `yera_author` | 11 |
| Homepage carousel, Dutch / English | 3 / 6 |
| Original downloaded assets | 279 |

Both article collections are preserved separately, including duplicates already present on the source site. Collection labels reflect their API origins; some entries in the main collection are English. Original publication dates, spelling, bylines, subtitles, categories, references, captions and historical text are preserved. No current factual claims have been substituted for historical article content.

`migration/source/` contains the original public API responses, rendered frontend samples and language messages. `src/data/site.json` contains the imported records. `migration/assets.json` maps each original asset URL to its local path, byte size and SHA-256. The original logo is `public/brand/logo.aebede0.png`; the original favicon is `public/brand/favicon.ico`. Images are copied unchanged, rather than recreated.

## Verification

Run `node scripts/verify-migration.mjs` after the production build. It compares every article and event body against the source (normalizing HTML whitespace), checks original titles, bylines and references, verifies all downloaded asset hashes and resolves local links throughout the output. Results are saved in `migration/verification.json`.

The build was also tested under a GitHub Pages repository subpath: navigation, search, images and legacy query redirects passed.

All 180 publication pages passed a mobile overflow check at 375px. Seven production browser tests passed.

Browser checks cover article search, persistent topic filters and category/collection filtering, article contents and reference navigation, legacy query routes, mobile overflow, original logo and photos, Dutch navigation, current board and directories, and reading without JavaScript.

## URL and rendering changes

- Original WordPress article and event slugs remain available under `/article/`, `/article-english/` and `/event/`.
- Frontend URLs `/article?id=<id>` and `/event?id=<id>` redirect in the browser to the corresponding static page. Without JavaScript, the same pages provide a complete linked index.
- The original `/articles`, `/events`, `/board`, `/alumni`, `/authors`, `/#board` and `/#contact` entry points remain available.
- English and Dutch navigation now have explicit routes, with `/nl/` for Dutch. Article bodies retain their original language.
- Image URLs are local. Responsive image variants are omitted from imported HTML in favour of the downloaded original referenced image. Caption and body text are unchanged.
- Known old `/project/` references are mapped to their migrated article. Two old registration links lead to the matching archived event, marked registration closed. One historical `/yera-denktank/` reference already returns HTTP 404 on the original host and has no corresponding API record; it remains unchanged as a source-era link.
- The redesigned homepage leads with recent articles and links to topic-filtered archives. Original carousel records and HTML remain in the source data.
- The homepage board entry links to the complete current board on About.
- Article contents, reading times and topic labels are generated presentation metadata; original publication bodies and references remain intact.
- The original developer attribution was removed from the footer at the site owner’s request.

## Static contact behavior

The old site submitted messages and registrations to WordPress Contact Form 7. This rebuild does not depend on WordPress. The contact page retains the original labels and copy and clearly states that its form opens an email draft, which the visitor must send. No message is silently submitted. Enabling direct submission later requires choosing a form service or endpoint.

## Deployment

The static build is ready for GitHub Pages or Cloudflare Pages. Nothing has been pushed, published or changed on the live domain. The included GitHub workflow uses manual dispatch. Confirm the preview and configure the chosen hosting project before switching DNS.
