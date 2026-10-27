import "server-only";

import { headers } from "next/headers";
import {
  parseVisitorCountry,
  visitorOriginHeaders,
} from "@edidi-hq/core/region/visitor-origin";

import { UNKNOWN_VISITOR_IP, visitorIp } from "@/lib/rate-limit";

/**
 * Where the visitor is, as Vercel tells this site on every request: an ISO
 * country code from their IP address, or null (local development, or a place
 * Vercel cannot place). Coarse, and not stored anywhere.
 */
export async function visitorCountry(): Promise<string | null> {
  return parseVisitorCountry((await headers()).get("x-vercel-ip-country"));
}

/**
 * The headers a call to the product ON THE VISITOR'S BEHALF carries: the
 * visitor's IP, country and region (core's `VISITOR_ORIGIN_HEADERS`) and this
 * site's Vercel identity token, which is what lets the product believe them.
 * The product sees this site's server as the caller, so without these it would
 * read the site's location as the visitor's.
 *
 * The origin is sent even without a token (local development, or OIDC switched
 * off for the project): the product then ignores it and logs a warning, so a
 * broken identity shows up instead of silently screening this site's location.
 */
export async function onBehalfOfVisitorHeaders(): Promise<Record<string, string>> {
  const requestHeaders = await headers();
  const token = requestHeaders.get("x-vercel-oidc-token");
  const ip = await visitorIp();
  return {
    ...visitorOriginHeaders({
      ip: ip === UNKNOWN_VISITOR_IP ? null : ip,
      country: requestHeaders.get("x-vercel-ip-country"),
      region: requestHeaders.get("x-vercel-ip-country-region"),
    }),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}
