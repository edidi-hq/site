/**
 * ISO 3166-1 alpha-2 country options for the trial form. Only valid alpha-2
 * codes are offered; display names via Intl.DisplayNames.
 *
 * The countries the platform sets up on its own — currency, tax, bank-account
 * formats, working week, retention — are core's `COUNTRY_CODES`
 * (`@edidi-hq/core/region/countries`, type-only imports, so no peer
 * dependencies). They are offered first. Any other country is still accepted:
 * the platform queues that request for its team to choose the setup.
 */

import { COUNTRY_CODES } from "@edidi-hq/core/region/countries";
import { ISO_3166_ALPHA2 } from "@edidi-hq/core/region/iso-3166";

import { LEAD_MARKET } from "@/lib/market";

/** Every assigned ISO 3166-1 alpha-2 code plus XK — core's list, the one the app's API validates against. */
const ISO_3166_ALPHA2_CODES = [...ISO_3166_ALPHA2].sort();

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export interface CountryOption {
  code: string;
  name: string;
}

const byName = (a: CountryOption, b: CountryOption) => a.name.localeCompare(b.name);
const optionFor = (code: string): CountryOption => ({ code, name: regionNames?.of(code) ?? code });
const SERVED = new Set<string>(COUNTRY_CODES);

/** Countries the platform sets up automatically, sorted by display name. */
export const SERVED_COUNTRIES: CountryOption[] = COUNTRY_CODES.map(optionFor).sort(byName);

/** Every selectable country: the served ones first, then the rest, each sorted by name. */
export const COUNTRIES: CountryOption[] = [
  ...SERVED_COUNTRIES,
  ...ISO_3166_ALPHA2_CODES.filter((code) => !SERVED.has(code))
    .map(optionFor)
    .sort(byName),
];

const SELECTABLE = new Set<string>(ISO_3166_ALPHA2_CODES);

/** Whether `code` (upper-case alpha-2) is one the form offers — the server action's check. */
export function isSelectableCountry(code: string): boolean {
  return SELECTABLE.has(code);
}

/**
 * The country a form starts on: where the visitor is (Vercel's IP country, read
 * on the server) when the form offers it, else the lead market. A starting
 * point only — the visitor can choose any country.
 */
export function startingCountry(visitorCountry: string | null): string {
  return visitorCountry && isSelectableCountry(visitorCountry) ? visitorCountry : LEAD_MARKET;
}

/** Whether the platform sets `code` up on its own (vs. a request its team completes). */
export function isServedCountry(code: string): boolean {
  return SERVED.has(code);
}
