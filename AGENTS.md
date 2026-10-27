<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- Everything above is tool-managed. Add rules below this line only. -->

# The marketing site

The public marketing site for the brand (`BRAND.name`, on core's `SITE_HOST`) — a single
Next.js 16 App Router service on Vercel. Brand identity comes from a private shared package,
pricing comes from the platform API (`BRAND.appUrl`), and the only server code is four
Server Actions and one read-only endpoint (`SITE_API_ROUTES.visitorCountry`, the visitor's IP
country for a pre-built page's starting choice).

## Architecture questions → invoke `repo-map`

**Do not explore the codebase to orient yourself.** Invoke the `repo-map` skill for
anything architectural: where code lives, how modules relate, how this talks to things it
does not own, which conventions to follow, what a domain term means, or what the known
landmines are. It points at `docs/architecture/` — one reference file per topic.
Use `repo-map-refresh` to update those docs from a git range after a change.

`docs/architecture/` is **gitignored and stays that way**. This repository is public and
those files are internal engineering detail. Keep them on disk; never track them.

## Commands

| | |
|---|---|
| `pnpm dev` | Dev server. **Requires Doppler** (`doppler run --config dev`) — bare `next dev` has no secrets. |
| `pnpm build` | Production build. |
| `pnpm test` | `vitest run`. |
| `pnpm lint` | `eslint .` — expect `0 problems`. |
| `pnpm type-check` | `tsc --noEmit`. **Turbopack dev does not typecheck — run this before claiming done.** |
| `pnpm check:contrast` | After `pnpm build` (under Doppler): every sitemap page at desktop and phone width in a real browser, each run of text measured against the pixels behind it (WCAG AA). Run it for any visual change. |

Run these locally before you claim anything is done.

## Non-negotiables

- **`import { m } from "framer-motion"`, never `motion`.** The app is wrapped in
  `LazyMotion strict`, so a stray `motion.*` throws at runtime.
- **Runtime code imports only `@edidi-hq/core/brand`, `@edidi-hq/core/region/countries`,
  `@edidi-hq/core/security/rate-limit`, `@edidi-hq/core/security/rate-limit-tiers` and the
  pure slices `billing/trial-deadlines`, `billing/capacity`, `billing/catalog`,
  `billing/limit-format`, `money/format`, `money/types`, `billing/features`, `billing/platform-tax`, `region/sales-tax`, `billing/reserved-mail-domain`, `billing/retention`, `locales`, `sectors`, `modules/catalog`, `region/iso-3166`, `region/visitor-origin`, `domains/public-email`, `trial/request-terms` and `ui/card-grid` (+ its stylesheet, imported by `globals.css`).**
  Every other subpath of that package needs peer dependencies this repo does not install
  (`region/countries` has type-only imports; `region/phone` needs a phone library the site does
  not install, so subpaths are admitted one by one; the two rate-limit modules need only the
  Upstash packages the site already has — the rest of `security/` does not, so it is admitted
  module by module, never as `security/*`).
  Tests may also import the dependency-free `security/dependency-floors` and
  `brand/copy-guardrails`
  — they back the parity lock tests and never ship. "Runtime" includes `next.config.ts`
  (Node loads it at build and start). `src/lib/core-imports.lock.test.ts` scans `src/` and
  `next.config.ts`, enforces this list AND walks each allowed subpath's value-import graph, failing on any
  package the site does not install; extend both together.
- **Never type a trial term.** The trial's length, read-only grace, seat cap, storage and
  message caps, the plan it runs on and the verification link's lifetime
  (`MAGIC_LINK_LIFETIME`) come from core via `src/lib/trial-terms.ts`; the trial request's
  field bounds, size bands and country codes are core's too (`trial/request-terms`,
  `region/iso-3166`), and the free-mail hint is core's `looksLikePublicEmailDomain`
  (`START_TRIAL_CTA`, `TRIAL_LENGTH`, …); a page that renders the pricing API's `trial`
  block reads `days`/`seatCap` from it. `trial-terms.lock.test.ts` fails on a typed
  "30-day trial", "N-seat", "N days after trial" or "<Plan> tier". The changelog is exempt —
  an entry records what was true on its date.
- **The market and the trial's promises are stated once.** "Organisations across Nigeria and
  Africa", its region and the lead currency come from `src/lib/market.ts` (`MARKET_SCOPE`,
  `MARKET_REGION`, `LEAD_CURRENCY` = core's currency for `LEAD_MARKET`); "No card required" and
  the setup time from `src/lib/trial-terms.ts` (`NO_CARD_REQUIRED`, `TRIAL_SETUP_TIME`).
  `trial-terms.lock.test.ts` fails on a typed copy of any of them. Copy never implies existing
  customers before there are any.
- **Rate limiting runs on core's shared limiter.** `src/lib/rate-limit.ts` holds one entry per
  Server Action and `limitVisitor(action)`; never build a limiter client in this repo. Every
  limiter carries a `site_*` tier from `@edidi-hq/core/security/rate-limit-tiers`, so refusals
  show up in the platform console. How the store is shared between environments, and the local
  development switches, are in `guides/security-posture.md` (gitignored).
- **Never hand-edit `src/data/pricing-fallback.json`.** It is generated from core's plan
  catalogue (prices, capacity, features, modules, trial) plus the site's own plan words in
  `src/data/plan-copy.ts`, by `src/lib/pricing-fallback-build.ts`, run through
  `scripts/generate-pricing-fallback.mjs` on every `pnpm dev` / `pnpm build` — no network.
  `pricing-fallback.test.ts` (and `pnpm pricing:check`) fails when the committed file
  differs, so after a core bump: run the script and commit the JSON. The generator and the
  plan copy are build-only — no page imports them (`core-imports.lock.test.ts`).
- **`pnpm.overrides` materialises core's canonical floor map**
  (`@edidi-hq/core/security/dependency-floors`), enforced by
  `src/lib/security/dependency-floors.lock.test.ts`. Change a shared floor in core, not here;
  copy the entries verbatim, reinstall, and confirm the lockfile moved. A site-only extra floor
  must be bounded to one major (use the version-ranged key form) — an unbounded one silently
  floated three majors and broke `pnpm lint` repo-wide. Re-run `pnpm lint` after any change.
- **Name tests `*.test.ts`, never `*.test.tsx`.** The vitest glob excludes `.tsx`, so a
  `.tsx` test is silently never executed and appears to pass.
- **Server Actions return a state object; they never throw to the client.** Every form action
  screens with `src/lib/submission-guard.ts` (decoy field, rate limit, human check with the
  visitor's IP), reads limits, the email shape, the decoy field name and the shared refusal
  wording from `src/lib/form-rules.ts` (inputs set `maxLength` from it), builds email with
  `src/lib/email-html.ts`, and logs failures through `src/lib/safe-log.ts` (error name only —
  never a provider message, which can carry addresses). `form-rules.lock.test.ts` fails on a
  typed copy. Outgoing calls carry a timeout (`platformFetch`, Turnstile).
- **Each contact topic declares its own form.** `CONTACT_TOPICS` (`src/app/contact/topics.ts`)
  says, per topic, which inputs appear and which are required, their labels, the consent
  wording, the confirmation and the inbox it reaches (`disclosure` → the security inbox, with
  the general inbox copied). The form renders from it and the action validates against it, so
  never add a field to one without the other; `topics.test.ts` holds the contract. Updates
  signups join the Resend segment named by `RESEND_UPDATES_SEGMENT_ID`; unset, the team is
  emailed instead (`addToUpdatesList` in `src/lib/email.ts`).
- **A magic link is spent only by a person.** The trial verify page renders a confirm button;
  `confirmTrialVerification` (a server action) calls the platform and redirects. Never call the
  platform while rendering the GET — email link scanners open links before people do.
- **The abuse-defence and CSP behaviour in `src/lib/rate-limit.ts` (each action's
  `failClosed`), `src/lib/turnstile.ts` and `next.config.ts` encodes deliberate tradeoffs,
  not oversights.** Read the header comment in the file first. This repo is public, so the specifics live in
  `guides/security-posture.md`, which is gitignored.
- **Only `main` and `staging` build on Vercel.** `vercel.json`'s `ignoreCommand` skips every
  other branch (not `git.deploymentEnabled`: its `*` misses branch names with a slash). Work is
  reviewed by fast-forwarding `staging` to it, never on a per-branch preview
  (`deploy-config.lock.test.ts`).
- **Blocked-content reports go to Sentry.** `next.config.ts` adds `report-uri` / `report-to`
  and a `Reporting-Endpoints` header only when `CSP_REPORT_URI` (a Sentry project's security
  endpoint, https) is set at BUILD time — headers are fixed into the build, so a change needs
  a redeploy. Unset or invalid → no reporting directives (`src/lib/csp-reporting.ts`).
- **Never weaken the origin check before `redirect()`** in `src/app/trial/verify/[token]/`.
- **The focus ring and the text greys come from the surface, never the component.**
  `src/lib/surfaces.ts` maps each background (token, or a strong translucent layer with what it
  sits on) to its ring and its `tone`: a dark surface re-points `--color-text-secondary/muted/
  subtle` to the on-dark grey for itself and everything inside it, a light one (a parchment card
  inside an ink section) points them back. A new background must be registered there or
  `focus-ring-contrast.lock.test.ts` fails; rings are held at 3:1 and each tone's grey at 4.5:1.
  Never set `outline` on a component, and never pick a grey per section.
- **Status chips are shape + word, never colour alone.** `<StatusMark>` draws core's
  `STATUS_MARKS` (approved ● pending ○ flagged ◆ rejected –); a module's availability chip reads
  `MODULE_STATUS_CHIP[surface][status]` (`src/lib/module-status-styles.ts`), never its own colours.
- **Buttons are square-cornered.** `buttonProps` / `ButtonLink` have no shape option; the brand
  is flat (no glows or grid texture in the homepage hero).
- **Surfaces are flat colour — no photographs or textures behind text.** A section's background
  is one registered surface token (`src/lib/surfaces.ts`). The old section textures were removed
  because text failed contrast over them while every token pairing passed. `pnpm check:contrast`
  measures the rendered pixels, so it catches what the token tests cannot (an image, a glow, a
  line behind a word).
- **The lockup is always the full mark.** `BrandLogo` with its wordmark draws the full Gate-N
  (ring, gate, ledger) at every size, as core's lockup files do; the small ringless drawing is for
  the bare mark alone (favicons, icons).
- **Claims follow the brand brief.** `brand-claims.lock.test.ts` runs core's `brandClaimViolations`
  over all copy: no certification we do not hold (a denial such as "not ISO 27001 certified"
  passes), never "we move/hold money", never "catches all fraud", no legal-instrument or
  "sealed forever" claim, the name never split or shortened. Where the product stands is
  `LAUNCH_STATUS` (`src/lib/launch.ts`) — never a customer count or logo until there is one.
- **Forms work without JavaScript.** Pass the server action itself to `useActionState` (never a
  client wrapper), submit with `onSubmit={submitWithoutReset(action)}` next to `action`
  (`form-submit.lock.test.ts`), gate buttons on `useHydrated()` so the server HTML never ships
  them disabled, spread `JS_ONLY` / `FORM_STEP` (`src/lib/no-script.ts`) on script-only controls
  and steps, and hand a refusal's posted values back (`src/lib/submitted-values.ts`).
- **Use the UI kit, never a copy.** Buttons come from `src/components/ui/button.tsx`
  (`ButtonLink`, or `buttonProps()` on an element that must stay `<a>`/`<button>`); section
  eyebrows and intros from `section-intro.tsx`; the dark section glows from
  `dark-hero-backdrop.tsx` (no grid texture anywhere — the brand is flat); scroll and load reveals from `fadeUpOnScroll()` / `fadeUpOnLoad()`
  and durations from `TRANSITION` in `src/lib/animations.ts` (staggers are capped).
  `ui-kit.lock.test.ts` fails on a hand-copied CTA style, eyebrow or reveal, and on any grid overlay.
- **Every design value is a token.** Font sizes (`--text-*`), radii (`--radius-*`), widths
  (`--layout-*`, `--measure-*`) and recurring tints are `@theme` tokens in
  `src/app/globals.css`; fonts are `var(--font-mono)` / inherited sans; stacking order is
  `Z_INDEX` (`src/lib/layers.ts`); screen sizes are `MEDIA_QUERIES`
  (`src/lib/hooks/media-queries.ts`); data-driven card rows use core's `.card-grid`.
  `design-tokens.lock.test.ts` fails on a typed value; text must meet WCAG AA on its surface.
- **Never hardcode a colour.** Use the `@theme` tokens in `src/app/globals.css` as
  `var(--color-…)`, or `rgba(var(--color-…-rgb), alpha)` for a tint; add a role-named token
  for a genuinely new colour. Only `src/lib/static-colors.ts` (email, OG image) holds values.
  `colour-tokens.lock.test.ts` enforces it. This codebase styles with inline `style={{}}`
  objects, not Tailwind classes.
- **Legal, security and promise statements have one home each.** Framework status and law
  names (`COMPLIANCE_FRAMEWORKS`, `DATA_PROTECTION_LAW_NAMES` keyed by core's law key,
  `TRUST_SIGNALS`) live in `src/lib/compliance-posture.ts`; sub-processor categories, regions
  and the residency summary in `src/lib/subprocessors.ts` (changing it changes the privacy
  policy — bump its effective date); what an enquirer is promised in `src/lib/contacts.ts`
  (`ENQUIRY_PROMISE` — a person reads every message, never a reply time, like the platform;
  only `SECURITY_TRIAGE_TIME` states a time); seal cadence and retention phrases in `src/lib/record-keeping.ts`.
  `record-keeping.lock.test.ts` fails on a typed seal cadence, year count or "within seconds".
- **Page metadata comes from `pageMetadata({ path, title, description })`** (`src/lib/seo.tsx`;
  suites use `suitePageMetadata(key)`). Next merges metadata shallowly, so a page that sets
  `openGraph` without `twitter` shares the homepage's card; the helper fills title (brand
  suffix via `pageTitle`), canonical, Open Graph and Twitter together.
  `page-metadata.lock.test.ts` fails on a page that builds its own, or types the brand name.
  Brand values come through `@/lib/brand` — only `brand.ts` imports `@edidi-hq/core/brand`.
- **Mockups draw from one demo story.** People, documents, amounts and times shown in previews
  and the hero come from `src/components/product/demo-fixtures.ts` (amounts formatted with
  `formatCurrencyAmount(…, LEAD_CURRENCY)`, times from fixed ISO instants and a fixed demo
  "now"); the approval lifecycle's stages from `src/lib/approval-lifecycle.ts`; preview chrome
  from `src/components/product/previews/preview-primitives.tsx`. `demo-fixtures.lock.test.ts`
  fails on a typed `₦`, `NGN` or the featured voucher's reference anywhere else.
- **Never type an address.** Contact emails live in `src/lib/contacts.ts` (`CONTACT_EMAIL`);
  the site URL is core's `BRAND.siteUrl`, used through `src/lib/seo.tsx` (`SITE_URL`,
  `canonical(path)`); `contacts.lock.test.ts` enforces both. The other origins are core's
  too — the app (`BRAND.appUrl`; the browser never calls it, so it is not in the CSP's
  `connect-src`), the status page (`statusUrl()`) and the docs
  (`docsUrl(path)`), all built from `SITE_HOST`; `site-pages.lock.test.ts` fails on any typed
  `<sub>.<SITE_HOST>` host in `src/` or `next.config.ts`. `/.well-known/security.txt` is
  generated from them (expiry always a year ahead, rebuilt daily) — never replace it with a
  static file.
- **Never type a path at all.** The site's own paths live in `src/lib/routes.ts`
  (`SITE_ROUTES`); module and suite pages come from `moduleHref(key)` / `suiteHref(key)`;
  core's from `LEGAL_PAGES` / `SITE_PAGES`. The chrome (desktop bar, its menu, the mobile menu,
  the footer) renders only the lists in `src/lib/site-nav.ts` — one label per destination,
  launch-hidden pages dropped — and `sitemap.test.ts` checks those links against `sitemap()`'s
  real output. `site-pages.lock.test.ts` fails on a typed path anywhere, `next.config.ts` included.
- **Never type a path core owns.** Other surfaces (product emails, trial screens, billing)
  link to this site through core's `@edidi-hq/core/brand`, so the site links the same way:
  legal pages via `LEGAL_PAGES`, the trial via `SITE_PAGES.trial()`, contact via
  `contactHref(intent?)` (= `SITE_PAGES.contact`), topics from `CONTACT_INTENTS` /
  `isContactIntent`. `site-pages.lock.test.ts` proves every path core publishes is a real,
  sitemapped page here (moving one fails this build, not a customer's click) and forbids a
  hand-typed copy outside `routes.ts`. The trust
  centre is a named exception there while it is unannounced; meanwhile security.txt's
  Policy line (`disclosurePolicyPath()`) names the security overview, and switches to the
  trust centre by itself once the gate shows it.
- **Unannounced pages are not in this repository.** This repo is public, so a page that is
  not launched yet lives in the git-ignored `unannounced/` folder — a clone of a private
  companion repository whose README says how to set it up and how to launch a page — and
  its path answers the not-found page. The `@/` alias falls back to `unannounced/src`, so
  those pages type-check locally; without the folder (as on Vercel) the site builds and every
  test passes. `unannounced-boundary.lock.test.ts` fails if a `HIDDEN_AT_LAUNCH` path has a
  page under `src/app`, or if published code imports a file that resolves only in the
  folder. To launch: move the files back to the same paths, then drop the path from
  `HIDDEN_AT_LAUNCH` (a module: flip its `PUBLICLY_VISIBLE` flag in `brand.ts`).
- **Prices and limits are formatted on the site from the numbers.** A price goes through
  `formatCurrencyAmount` (`src/lib/money.ts`, core's `formatMoney`); a limit through
  `src/lib/plan-limits.ts` (`0` = unlimited; storage via core's `formatByteSize`, so GiB).
  Never print the API's `*Label` strings — their wording is not part of the contract.
- **Listed prices are before tax, and a tax line shows only where core says tax is
  charged.** `priceTaxNote` (`src/lib/price-tax.ts`) asks core's `platformSalesTax`, which
  adds tax only for a country in core's `PLATFORM_TAX_REGISTRATIONS`. Core decides WHETHER; the API's numeric `taxRate`
  only formats the rate once core says yes (else core's rate), and is ignored when core
  says no — so an app on an older core can never make the site advertise uncharged tax.
  Never a typed rate. Stripe currencies show no tax line (tax is computed at checkout).
- **Service commitments (dedicated onboarding, priority support) are their own comparison
  group**, "Service & support" — never under "Workflow & platform". `fetchPricingData` runs
  every payload (live or fallback) through `withServiceCommitmentGroup`
  (`src/lib/service-commitments.ts`, keys from core's `SERVICE_COMMITMENT_KEYS`), which reads
  per-plan `serviceCommitments` and falls back to `features` for an older payload.
- **Modules come from core; the site owns only which ones it shows and their card words.**
  `src/lib/brand.ts` reads each module's name, short name, suite and status from core's
  `modules/catalog`; its `PUBLICLY_VISIBLE` flag is the one switch that hides a module's
  page (`notFoundUnlessPublic(key)` in every module route, lock-tested; a hidden module's
  route itself waits in `unannounced/`), links, and sitemap entry (the launch gate derives
  the route). A new core module fails type-check until it is
  modelled or listed in `UNMODELLED_MODULE_KEYS`. Lists render `publicModuleKeys()`, link
  with `moduleHref(key)`, shorten with `moduleShortName(key)`, and take icon, tagline and
  summary from `MODULE_COPY` (`src/lib/module-copy.ts`); a sentence naming request types
  uses `requestTypeList()`. `module-names.lock.test.ts` fails on a file that lists four or
  more modules by hand.
- **Never type the brand name.** Copy reads `BRAND.name` (from `@/lib/brand`); a module's
  short name is `moduleShortName(key)` / `moduleShortNameFor(apiModule)`, never a cut prefix.
  `brand-name.lock.test.ts` fails on a typed brand name outside `brand.ts` and the changelog.
  Lock tests strip comments with the shared `src/lib/test-support/strip-comments.ts`.
- **Never hardcode a plan tier or module name.** Tiers come from the pricing API; module
  names come from `MODULES` in `src/lib/brand.ts` (`moduleName(key)` in titles and prose —
  `module-names.lock.test.ts` fails on a typed "<brand> <Module>" anywhere else). This includes BRANCHING on a tier:
  `plan.key === "enterprise"` is the same bug as printing the name — it decided the CTA,
  the struck-through price and the annual saving, and is wrong the moment a second tier
  is quote-priced or Enterprise becomes self-serve. Read `plan.selfServeCheckout`, which
  the product API publishes and enforces on its own Pay button; the featured tier is core's
  `PLAN_CATALOG[*].recommended`; "N months free" is core's `ANNUAL_BILLED_MONTHS`; a sentence
  naming the plans a feature is on uses `planNames(data, feature)`. `pricing.test.ts` fails
  on any plan key typed in the pricing section.
- Full-word variable names. No cryptic abbreviations.
- Visual changes get verified in a real browser and looked at, not reasoned about.

## Planning

Long-horizon work gets a plan file on disk at
`docs/superpowers/plans/<YYYY-MM-DD>-<slug>.md`, updated as the work proceeds — plans do
not live in session context. See `docs/architecture/planning.md`. Both `docs/superpowers/`
and `docs/architecture/` are gitignored, so a plan does not survive a fresh clone — promote a
durable decision that every session must respect into this file.

# Compact instructions
When compacting, preserve: the current task and plan, file paths touched, decisions
made and why, and unresolved errors. Summarize exploration and file contents
aggressively.
