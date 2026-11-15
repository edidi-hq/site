import type { MetadataRoute } from "next";
import { isLaunchVisible } from "@/lib/launch";
import { LEGAL_PAGES, SITE_PAGES, moduleHref, suiteHref } from "@/lib/brand";
import { fetchPricingData, type PricingData } from "@/lib/pricing";
import { advertisedModuleKeys, advertisedSuiteKeys } from "@/lib/verified-claims";
import { SITE_ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL;

/**
 * Sitemap of publicly-reachable routes. Launch-hidden routes (filtered via the
 * launch gate) and hidden modules (Requests — excluded by `publicModuleKeys`) are
 * left out so search engines only index what a visitor can actually open.
 */
/**
 * Content routes that aren't derived from the module registry.
 *
 * Deliberately absent: `/status` redirects to an external status page, and a
 * sitemap must not advertise a redirect; `/features` likewise redirects to
 * `/product`. Routes hidden by the launch gate are filtered below rather than
 * omitted here, so re-enabling a page needs only the gate edit.
 *
 * Exported so `sitemap.test.ts` can assert no linked, reachable page is missing.
 */
export const STATIC_ROUTES: readonly string[] = [
  SITE_ROUTES.home,
  SITE_ROUTES.product,
  SITE_ROUTES.howItWorks,
  LEGAL_PAGES.security,
  // Catalogue page, not a module slug — the module registry emits /product/connect,
  // so this route is only in the sitemap because it is listed here explicitly.
  SITE_ROUTES.integrations,
  SITE_ROUTES.pricing,
  SITE_PAGES.trial(),
  SITE_PAGES.contact(),
  SITE_ROUTES.about,
  LEGAL_PAGES.trust,
  LEGAL_PAGES.privacy,
  LEGAL_PAGES.terms,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapFor(await fetchPricingData());
}

/** The sitemap for a pricing payload: module and suite pages only while advertised. */
export function sitemapFor(data: PricingData): MetadataRoute.Sitemap {
  const staticRoutes = STATIC_ROUTES;

  const moduleRoutes = advertisedModuleKeys(data).map((key) => moduleHref(key));

  // Suite pages are derived too, so a fifth suite is indexed the moment it has
  // an advertised module rather than whenever somebody remembers this file.
  const suiteRoutes = advertisedSuiteKeys(data).map((suite) => suiteHref(suite));

  const lastModified = new Date();

  return [...staticRoutes, ...suiteRoutes, ...moduleRoutes]
    .filter(isLaunchVisible)
    .map((path) => ({
      url: `${BASE_URL}${path === SITE_ROUTES.home ? "" : path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: path === SITE_ROUTES.home ? 1 : 0.7,
    }));
}
