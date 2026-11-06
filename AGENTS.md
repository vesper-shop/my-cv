# AGENTS

`my-cv` is a single-page CV served from a Cloudflare Worker at `cv.you-find.me`, built with Void,
Vite+, React 19, and Tailwind CSS 4. Read `docs/ARCHITECTURE.md` and `docs/DEPLOYMENT.md` before
substantial changes.

## Layout

| Path       | Role                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| `pages/`   | Void pages: `index.tsx` is `/`, `index.server.ts` its loader and actions                   |
| `routes/`  | Void server routes: `pdf.ts` is `GET /pdf`                                                 |
| `lib/`     | `schema.ts` (every zod schema), `types.ts` (every shared type), `cv.ts` (KV keys, digests, |
|            | redaction), `reader.ts` (server-only cookies and access), `i18n.ts` (UI text)              |
| `scripts/` | `cv.ts`, the CLI that publishes CVs, PDFs and codes to KV; `pdf.tsx`, the two-page PDF     |
| `data/`    | `example.json` (fictional, committed) and `private/` (real, gitignored)                    |
| `docs/`    | Architecture and deployment notes                                                          |

## Commands

```bash
pnpm dev                                   # Void dev server with local KV
pnpm check                                 # Void codegen, formatting, lint, and TypeScript
pnpm build                                 # Production build
pnpm cv publish <target> <grad|job> <en|zh> <file> # Validate a CV, render its PDF, store both in KV
pnpm cv code <target> <grad|job>           # Prompt for an access code and store its digest
```

## Rules

- The project has no environment variables. CV content and access-code digests live in KV and are
  changed with `pnpm cv`, never by redeploying.
- Real CV content never enters Git. `data/example.json` is the only committed CV and stays fictional.
- Zod schemas live in `lib/schema.ts` and shared types in `lib/types.ts`; do not declare either
  elsewhere.
- The PDF is its own Forme layout in `scripts/pdf.tsx`, rendered at publish time, never a print of
  the page. Publishing fails when it runs past two pages; it is served by `GET /pdf` to unlocked
  readers only.
- Sensitive spans are marked `[[...]]`. `lib/cv.ts` alone turns them into text or redaction bars; a
  locked response must never contain the original text or the `href` of a link whose label hides a
  span.
- Every CV exists in `en` and `zh`; interface text lives in `lib/i18n.ts`. Colours are
  `light-dark()` pairs in `pages/style.css`; the theme only sets `color-scheme`. Motion comes from
  `motion` and respects reduced-motion settings.
- Do not use `undefined`, `unknown`, or `any` as states, or `??` fallbacks; absent values are
  explicit `null`.
- Pin every dependency to an exact version.
- A `catch` must recover, translate, or clean up something specific. Do not add fallbacks for
  missing data; let validation fail loudly.
