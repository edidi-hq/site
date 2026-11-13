/**
 * We advertise only what we verifiably sell: a capability claim shows only
 * once a platform operator has signed off that it works ON PRODUCTION, until
 * someone withdraws it (core `isSignedOff`; no expiry). The sign-off dates arrive in the pricing
 * API's `claims`; the site's offline fallback never carries any, so an outage
 * hides claims rather than showing unproven ones.
 *
 * Applied ONCE, server-side, in `fetchPricingData` (one clock, no hydration
 * disagreement): it filters the comparison table's feature rows and each plan's
 * highlight bullets, and records the signed-off keys as `verifiedClaims` for the
 * module pages' capability cards (`module-layout.tsx`).
 *
 * A whole module follows the same rule: no sign-off, no page. A module is
 * advertised only while `brand.ts` shows it AND its own claim is signed off
 * (`advertisedModuleKeys`); a suite only while it holds an advertised module
 * (`advertisedSuiteKeys`). Its page, its links, its sitemap entry and the lists
 * that name it all read these, so they cannot disagree.
 */
import { isSignedOff } from "@edidi-hq/core/billing/feature-claims";

import { MODULE_ORDER, SUITES, moduleSuite, publicModuleKeys, type ModuleKey, type ModuleSuite } from "@/lib/brand";
import type { PricingData } from "@/lib/pricing";
import { SERVICE_GROUP_KEY } from "@/lib/service-commitments";

/** The claim keys signed off (and not withdrawn) at `now`. */
export function signedOffClaimKeys(claims: PricingData["claims"], now: Date): string[] {
  return Object.entries(claims ?? {})
    .filter(([, verifiedAt]) => isSignedOff(verifiedAt, now))
    .map(([key]) => key)
    .sort();
}

/**
 * The payload with only signed-off claims left in it: comparison rows for
 * features without a sign-off removed (the service group is people's
 * promises, not product claims, and stays), groups left empty dropped, and each
 * highlight kept only when every claim it declares is signed off. A highlight whose
 * claims are unknown (an older API, the fallback) is dropped — fail closed.
 */
export function withVerifiedClaimsOnly(data: PricingData, now: Date): PricingData {
  const verified = signedOffClaimKeys(data.claims, now);
  const isVerified = (key: string) => verified.includes(key);
  const featureGroups = data.featureGroups
    ?.map((group) =>
      group.key === SERVICE_GROUP_KEY
        ? group
        : { ...group, featureKeys: group.featureKeys.filter(isVerified) },
    )
    .filter((group) => group.featureKeys.length > 0);
  const plans = data.plans.map((plan) => {
    const highlights = (plan.highlights ?? []).filter((_, index) => {
      const claims = plan.highlightClaims?.[index];
      return claims !== undefined && claims.every(isVerified);
    });
    return { ...plan, highlights };
  });
  return { ...data, plans, featureGroups, verifiedClaims: verified };
}

/** Modules the site advertises: shown by `brand.ts` and signed off. Display order. */
export function advertisedModuleKeys(data: PricingData): ModuleKey[] {
  const verified = new Set(data.verifiedClaims ?? []);
  return publicModuleKeys().filter((key) => verified.has(key));
}

/** The advertised modules of one suite, in the site's display order. */
export function advertisedSuiteModuleKeys(suite: ModuleSuite, advertised: readonly ModuleKey[]): ModuleKey[] {
  return MODULE_ORDER.filter((key) => advertised.includes(key) && moduleSuite(key) === suite);
}

/** Suites with at least one advertised module — the only ones the menus link to. */
export function advertisedSuiteKeys(data: PricingData): ModuleSuite[] {
  const advertised = advertisedModuleKeys(data);
  return SUITES.map((suite) => suite.key).filter(
    (suite) => advertisedSuiteModuleKeys(suite, advertised).length > 0,
  );
}
