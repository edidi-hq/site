/**
 * SEO / structured-data helpers — one place for the canonical origin, the
 * JSON-LD <script> renderer, and the schema.org builders used across pages.
 *
 * JSON-LD can live anywhere in the document; we render <JsonLd> inside page
 * bodies. Keep emitted facts truthful and in lockstep with the visible copy.
 */

import type { Metadata } from "next";

import { BRAND, siteUrl } from "@/lib/brand";
import type { PricingData } from "@/lib/pricing";
import { SITE_DESCRIPTION } from "@/lib/record-keeping";
import { CONTACT_EMAIL } from "@/lib/contacts";
import { MARKET_SCOPE } from "@/lib/market";
import { isLaunchHidden } from "@/lib/launch";

/** The site's canonical origin — core's, the same one every other surface links to. */
export const SITE_URL = BRAND.siteUrl;

/** Absolute canonical URL for a route path ("/" → site root). */
export function canonical(path: string): string {
  return siteUrl(path);
}

/** The line under the brand — the root share card and the organisation schema both say it. */
export const SITE_SLOGAN = `Every organisation runs on decisions. ${BRAND.name} makes sure they stick.`;

/** A page's browser title: "Privacy policy — <brand>"; a title that already names the brand is left alone. */
export function pageTitle(title: string): string {
  return title.includes(BRAND.name) ? title : `${title} — ${BRAND.name}`;
}

export interface PageMetadataInput {
  /** The route, e.g. "/pricing" — the canonical link and the share card's URL. */
  path: string;
  title: string;
  description: string;
  /** Share-card wording, when it should differ from the page's own. */
  socialTitle?: string;
  socialDescription?: string;
}

/**
 * Every page's metadata, whole. Next merges metadata SHALLOWLY: a page that set
 * its own `openGraph` but not `twitter` inherited the root layout's twitter card
 * — so every page shared on X showed the homepage's title — and its `openGraph`
 * replaced the root one, dropping the site name. Filling title, canonical, Open
 * Graph and Twitter together from one input makes that impossible.
 */
/** The not-found page's title — also what a page hidden for launch shows in its tab. */
export const NOT_FOUND_TITLE = "Page not found";

/**
 * A page's metadata. A page hidden for launch (`src/lib/launch.ts`) renders the
 * not-found page, so it gets the not-found title too — never its real name in
 * the tab beside a "this page isn't here" screen — and is kept out of search.
 */
export function pageMetadata({ path, title, description, socialTitle, socialDescription }: PageMetadataInput): Metadata {
  if (isLaunchHidden(path)) {
    return { title: pageTitle(NOT_FOUND_TITLE), robots: { index: false, follow: false } };
  }
  const shareTitle = socialTitle ?? pageTitle(title);
  const shareDescription = socialDescription ?? description;
  return {
    title: pageTitle(title),
    description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description: shareDescription,
      url: canonical(path),
      siteName: BRAND.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
    },
  };
}

/** Renders a JSON-LD script tag. Safe in server or client components.
 *  `JSON.stringify` does not escape `<`, so we escape it to `<` — this
 *  neutralises any `</script>` breakout if a string ever flows into a schema
 *  field (e.g. from the external pricing API). Defence-in-depth at the sink. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw script text. `<` is escaped below, so the data cannot
      // close the tag early.
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- see above
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: SITE_URL,
    logo: `${SITE_URL}/apple-touch-icon.png`,
    description: `${BRAND.positioningStatement} for ${MARKET_SCOPE}.`,
    slogan: SITE_SLOGAN,
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL.support,
      contactType: "customer support",
    },
  };
}

/**
 * AggregateOffer derived from the live/fallback pricing (major units), in the
 * currency the price list leads with. Only self-serve plans are priced offers —
 * a quote plan's figure is a floor, not a price, so it is left out of the range.
 *
 * This used to look for USD only. The price list serves the currencies the
 * platform can collect in (naira today), so the offer silently never rendered.
 */
function aggregateOffer(pricing?: PricingData | null): Record<string, unknown> | null {
  if (!pricing?.plans?.length) return null;
  const currency = pricing.plans[0]?.pricing?.[0]?.currency;
  if (!currency) return null;
  const amounts = pricing.plans
    .filter((plan) => plan.selfServeCheckout)
    .map((plan) => plan.pricing?.find((p) => p.currency === currency)?.monthly)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (!amounts.length) return null;
  return {
    "@type": "AggregateOffer",
    priceCurrency: currency,
    lowPrice: Math.min(...amounts),
    highPrice: Math.max(...amounts),
    offerCount: amounts.length,
  };
}

export function softwareApplicationSchema(pricing?: PricingData | null): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
  const offer = aggregateOffer(pricing);
  if (offer) schema.offers = offer;
  return schema;
}

export function faqPageSchema(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}
