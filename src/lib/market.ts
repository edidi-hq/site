import { INTERNATIONAL_PRICE_CURRENCY } from "@edidi-hq/core/billing/catalog";
import { COUNTRY_PROFILES, type CountryCode } from "@edidi-hq/core/region/countries";

/**
 * Who the site is for — the one statement of the market it leads with.
 *
 * "For organisations across Nigeria and Africa" was typed into the footer, the
 * organisation schema, the about page, the pricing description and the hero,
 * in four slightly different shapes, and "NGN" was typed as the lead currency in
 * the price list and the savings estimator. The lead market is a country code;
 * its currency is core's answer for that country, and its name is the runtime's.
 */

/** The country the site leads with. */
export const LEAD_MARKET: CountryCode = "NG";

/** The lead market's currency — the price list opens in it, the estimator counts in it. */
export const LEAD_CURRENCY = COUNTRY_PROFILES[LEAD_MARKET].defaultCurrency;

/**
 * The currency a price list opens in — a starting point, the visitor can switch:
 *   1. the visitor's country's currency (core's profile), when the list offers it;
 *   2. for a visitor from anywhere else, core's international price currency, when offered;
 *   3. the lead currency (also for a visitor we cannot place), else the list's first.
 */
export function startingCurrency(visitorCountry: string | null, offered: readonly string[]): string {
  const profile = visitorCountry ? COUNTRY_PROFILES[visitorCountry as CountryCode] : undefined;
  if (profile && offered.includes(profile.defaultCurrency)) return profile.defaultCurrency;
  if (visitorCountry && offered.includes(INTERNATIONAL_PRICE_CURRENCY)) {
    return INTERNATIONAL_PRICE_CURRENCY;
  }
  return offered.includes(LEAD_CURRENCY) ? LEAD_CURRENCY : (offered[0] ?? LEAD_CURRENCY);
}

const LEAD_MARKET_NAME = new Intl.DisplayNames(["en-GB"], { type: "region" }).of(LEAD_MARKET) ?? LEAD_MARKET;

/** "Nigeria and Africa" — the region in a phrase. */
export const MARKET_REGION = `${LEAD_MARKET_NAME} and Africa`;

/** "organisations across Nigeria and Africa" — completes "built for …". */
export const MARKET_SCOPE = `organisations across ${MARKET_REGION}`;

/**
 * What the lead market's organisations need — completes "built for … ". The
 * founder-approved market statement (2026-10-18) ends "a record that holds":
 * documents follow the plan's retention period, so the claims rules forbid any
 * wording that calls the record of documents everlasting (record-keeping.ts).
 */
export const MARKET_NEED =
  "where decisions require defined authority, structured process, and a record that holds";

/** The market-phase statement — sales, onboarding, the about page. Not the brand statement. */
export const MARKET_STATEMENT = `Built for ${MARKET_SCOPE} ${MARKET_NEED}.`;
