# The marketing site

The public marketing site for the brand — a single Next.js 16 App Router service (React 19,
TypeScript, Tailwind CSS 4 tokens, framer-motion), deployed on Vercel. Brand identity comes
from the private `@edidi-hq/core` package; pricing comes from the product's public pricing
API, with a generated offline fallback in `src/data/pricing-fallback.json`.

## Getting started

Requires Node 24 (`.nvmrc`; `engines.node` also pins the Vercel runtime) and pnpm (version pinned in `package.json`). Installing needs read access to
the private `@edidi-hq/core` repository.

```bash
pnpm install
pnpm dev          # runs under Doppler (doppler run --config dev) — secrets are not in the repo
```

`predev` and `prebuild` regenerate the pricing fallback from the installed core's plan
catalogue (no network); never hand-edit that file. After a core bump, commit the regenerated
JSON — `pnpm test` (or `pnpm pricing:check`) fails until you do.

## Checks

```bash
pnpm lint         # eslint — expect 0 problems
pnpm type-check   # tsc --noEmit (Turbopack dev does not typecheck)
pnpm test         # vitest run — tests must be named *.test.ts
pnpm build
```

Contributor and agent rules live in `AGENTS.md`.
