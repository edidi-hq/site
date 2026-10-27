/**
 * The site's own page paths — the ones core does not publish. Core owns the
 * paths other surfaces link to (legal pages, the trial, contact: `LEGAL_PAGES`,
 * `SITE_PAGES` in `@/lib/brand`); module and suite pages are built from their key
 * (`moduleHref`, `suiteHref`). Everything else a link, a sitemap entry or a
 * launch-gate entry names is here, so moving a page is one edit and
 * `site-pages.lock.test.ts` fails on a hand-typed copy.
 */
export const SITE_ROUTES = {
  home: "/",
  product: "/product",
  howItWorks: "/product/how-it-works",
  integrations: "/product/integrations",
  pricing: "/pricing",
  about: "/about",
  careers: "/careers",
  customers: "/customers",
  changelog: "/changelog",
  docs: "/docs",
  status: "/status",
  savingsEstimator: "/tools/savings",
  features: "/features",
} as const;

export type SiteRouteKey = keyof typeof SITE_ROUTES;

/**
 * The site's own endpoints, which the browser calls from a pre-built page.
 * Not pages: never in the sitemap or the navigation.
 */
export const SITE_API_ROUTES = {
  /** The visitor's country from their IP (Vercel's header), for starting choices. */
  visitorCountry: "/api/visitor-country",
} as const;
