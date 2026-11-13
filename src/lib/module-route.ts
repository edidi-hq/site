import { notFound } from "next/navigation";

import { isModulePublic, type ModuleKey } from "@/lib/brand";
import type { PricingData } from "@/lib/pricing";
import { advertisedModuleKeys } from "@/lib/verified-claims";

/**
 * A module route renders only for a module the site shows. The visibility flag
 * in `brand.ts` is the one switch: it hides the page here, its links (every
 * list reads `publicModuleKeys()`) and its sitemap entry (the launch gate
 * derives the route). Call it before fetching anything for the page.
 */
export function notFoundUnlessPublic(moduleKey: ModuleKey): void {
  if (!isModulePublic(moduleKey)) notFound();
}

/**
 * No sign-off, no page: after the pricing fetch, a module whose own claim has no
 * fresh production sign-off answers not-found (`@/lib/verified-claims`).
 */
export function notFoundUnlessSignedOff(moduleKey: ModuleKey, data: PricingData): void {
  if (!advertisedModuleKeys(data).includes(moduleKey)) notFound();
}
