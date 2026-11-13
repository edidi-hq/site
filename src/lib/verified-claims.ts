/**
 * We advertise only what we verifiably sell: a capability claim shows only
 * while a platform operator's sign-off that it works ON PRODUCTION is fresh
 * (core `isProofFresh`, 90 days). The sign-off dates arrive in the pricing
 * API's `claims`; the site's offline fallback never carries any, so an outage
 * hides claims rather than showing unproven ones.
 *
 * Applied ONCE, server-side, in `fetchPricingData` (one clock, no hydration
 * disagreement): it filters the comparison table's feature rows and each plan's
 * highlight bullets, and records the fresh keys as `verifiedClaims` for the
 * module pages' capability cards (`module-layout.tsx`).
 *
 * Not gated here: whether a whole module is shown — that is `brand.ts`'s
 * visibility switch (menus, sitemap and suite pages read it). A module whose
 * own claim is not signed off shows no capability cards that rely on it.
 */
import { isProofFresh } from "@edidi-hq/core/billing/feature-claims";

import type { PricingData } from "@/lib/pricing";
import { SERVICE_GROUP_KEY } from "@/lib/service-commitments";

/** The claim keys whose sign-off is fresh at `now`. */
export function freshClaimKeys(claims: PricingData["claims"], now: Date): string[] {
  return Object.entries(claims ?? {})
    .filter(([, verifiedAt]) => isProofFresh(verifiedAt, now))
    .map(([key]) => key)
    .sort();
}

/**
 * The payload with only signed-off claims left in it: comparison rows for
 * features without a fresh sign-off removed (the service group is people's
 * promises, not product claims, and stays), groups left empty dropped, and each
 * highlight kept only when every claim it declares is fresh. A highlight whose
 * claims are unknown (an older API, the fallback) is dropped — fail closed.
 */
export function withVerifiedClaimsOnly(data: PricingData, now: Date): PricingData {
  const verified = freshClaimKeys(data.claims, now);
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
