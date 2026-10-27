"use client";

import { useEffect, useState } from "react";

import { SITE_API_ROUTES } from "@/lib/routes";

// One request per page load, however many components ask.
let visitorCountryRequest: Promise<string | null> | null = null;

function requestVisitorCountry(): Promise<string | null> {
  visitorCountryRequest ??= fetch(SITE_API_ROUTES.visitorCountry)
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { country?: unknown } | null) =>
      typeof body?.country === "string" ? body.country : null,
    )
    .catch(() => null);
  return visitorCountryRequest;
}

/**
 * The visitor's country on a pre-built page, once the site has answered —
 * null until then, and when it cannot say. A starting point for a choice the
 * visitor can change, never a gate. Pass `wanted: false` when there is no
 * choice to start (a single option): nothing is requested.
 */
export function useVisitorCountry(wanted = true): string | null {
  const [country, setCountry] = useState<string | null>(null);
  useEffect(() => {
    if (!wanted) return;
    let current = true;
    void requestVisitorCountry().then((answer) => {
      if (current) setCountry(answer);
    });
    return () => {
      current = false;
    };
  }, [wanted]);
  return country;
}
