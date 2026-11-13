import { LEGAL_PAGES, SITE_PAGES, SUITES, suiteHref, type ModuleSuite } from "@/lib/brand";
import { isLaunchVisible } from "@/lib/launch";
import { LOGIN_URL } from "@/lib/platform";
import { SITE_ROUTES } from "@/lib/routes";

/**
 * Every link the site's chrome shows — the desktop bar and its menu, the mobile
 * menu and the footer render these lists and nothing else.
 *
 * They used to be three hand-kept lists that had drifted: the mobile menu had
 * no Integrations link, the same page was "Integrations catalogue" in one and
 * "Integrations" in another, and the desktop bar typed Product and Pricing
 * itself, so the Customers link in its list showed on mobile only. Each
 * destination now has one label, and every list drops launch-hidden pages.
 */

export interface NavLink {
  label: string;
  href: string;
  /** A one-line explanation, where a menu shows one. */
  description?: string;
}

/** One entry per destination: its single label. */
export const NAV_LINKS = {
  product: { label: "Product", href: SITE_ROUTES.product },
  allModules: { label: "All modules", href: SITE_ROUTES.product },
  howItWorks: { label: "How it works", href: SITE_ROUTES.howItWorks },
  security: { label: "Security", href: LEGAL_PAGES.security },
  trust: { label: "Trust centre", href: LEGAL_PAGES.trust },
  integrations: { label: "Integrations", href: SITE_ROUTES.integrations },
  pricing: { label: "Pricing", href: SITE_ROUTES.pricing },
  customers: { label: "Customers", href: SITE_ROUTES.customers },
  docs: { label: "Documentation", href: SITE_ROUTES.docs },
  changelog: { label: "Changelog", href: SITE_ROUTES.changelog },
  status: { label: "Status", href: SITE_ROUTES.status },
  about: { label: "About", href: SITE_ROUTES.about },
  careers: { label: "Careers", href: SITE_ROUTES.careers },
  privacy: { label: "Privacy policy", href: LEGAL_PAGES.privacy },
  terms: { label: "Terms of service", href: LEGAL_PAGES.terms },
  startTrial: { label: "Start trial", href: SITE_PAGES.trial() },
  contact: { label: "Contact us", href: SITE_PAGES.contact() },
  login: { label: "Login", href: LOGIN_URL },
} as const satisfies Record<string, NavLink>;

/** Only the links whose page the launch gate shows. */
function shown(links: readonly NavLink[]): NavLink[] {
  return links.filter((link) => isLaunchVisible(link.href));
}

/** The four suites, with their blurb — the Product menu's first column. */
export const SUITE_NAV: NavLink[] = SUITES.map((suite) => ({
  label: suite.label,
  href: suiteHref(suite.key),
  description: suite.blurb,
}));

/** The Product menu's second column. */
export const PLATFORM_NAV: NavLink[] = shown([
  NAV_LINKS.howItWorks,
  NAV_LINKS.security,
  NAV_LINKS.trust,
  NAV_LINKS.integrations,
]);

/** The top-level links after the Product menu, on desktop and mobile alike. */
export const TOP_NAV: NavLink[] = shown([NAV_LINKS.customers, NAV_LINKS.pricing]);

/** The footer's columns; a column the launch gate empties is dropped. */
export const FOOTER_COLUMNS: { label: string; links: NavLink[] }[] = [
  { label: "PRODUCT", links: [...SUITE_NAV, NAV_LINKS.allModules] },
  { label: "PLATFORM", links: [NAV_LINKS.howItWorks, NAV_LINKS.security, NAV_LINKS.integrations, NAV_LINKS.pricing] },
  { label: "RESOURCES", links: [NAV_LINKS.docs, NAV_LINKS.changelog, NAV_LINKS.status, NAV_LINKS.customers] },
  { label: "COMPANY", links: [NAV_LINKS.about, NAV_LINKS.careers, NAV_LINKS.trust, NAV_LINKS.privacy, NAV_LINKS.terms] },
  { label: "GET STARTED", links: [NAV_LINKS.startTrial, NAV_LINKS.contact, NAV_LINKS.login] },
]
  .map((column) => ({ ...column, links: shown(column.links) }))
  .filter((column) => column.links.length > 0);

/**
 * `links` without the suite pages the menus may not link to: a suite link stays
 * only while its suite is advertised (`advertisedSuiteKeys`, via the root
 * layout's provider). Other links pass through.
 */
export function withAdvertisedSuites(links: readonly NavLink[], advertised: readonly ModuleSuite[]): NavLink[] {
  const advertisedHrefs = new Set(advertised.map((suite) => suiteHref(suite)));
  const suiteHrefs = new Set(SUITE_NAV.map((link) => link.href));
  return links.filter((link) => !suiteHrefs.has(link.href) || advertisedHrefs.has(link.href));
}

/** Every internal destination the chrome can link to — what the sitemap test checks. */
export function chromeLinks(): NavLink[] {
  return [NAV_LINKS.product, ...SUITE_NAV, ...PLATFORM_NAV, ...TOP_NAV, ...FOOTER_COLUMNS.flatMap((column) => column.links)];
}
