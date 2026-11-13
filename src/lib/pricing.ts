/* ── Pricing API types and fetch ──────────────────────────────── */

import { platformFetch } from "@/lib/platform-fetch";
import { PLATFORM_API_PATHS } from "@/lib/platform";
import { withServiceCommitmentGroup } from "@/lib/service-commitments";

/** One plan's price in one currency. Amounts are MAJOR units; the site formats
 *  them itself (`formatCurrencyAmount`) and never prints the `*Label` strings,
 *  so a change to how the API words its labels cannot reach the page. */
export interface PricingCurrency {
  currency: string;
  monthly: number;
  /** Published by the API; not read by the site. */
  monthlyLabel: string | null;
  annualPerMonth: number | null;
  annualTotal: number | null;
  /** Published by the API; not read by the site. */
  annualLabel: string | null;
  taxRate: number | null;
  taxLabel: string | null;
}

/** A plan's limits. `0` means unlimited for every figure (core's convention);
 *  the site formats its own lines from these numbers (`@/lib/plan-limits`). */
interface PlanLimits {
  maxUsers: number;
  maxDocumentsPerMonth: number;
  maxStorageBytes: number;
  documentRetentionDays: number;
  /** Labels published by the API. NOT read by the site: they once printed a
   *  gibibyte figure as "GB", and formatting here keeps their wording out of
   *  the contract. */
  maxUsersLabel?: string;
  maxDocumentsPerMonthLabel?: string;
  maxStorageBytesLabel?: string;
  documentRetentionDaysLabel?: string;
}

export interface PlanModule {
  key: string;
  name: string;
  description: string;
  /**
   * Present ONLY for a module restricted to certain industry sectors (an
   * archetype add-on — Grants is for grant-funded organisations). The plan
   * includes it, but a customer outside these sectors cannot use it, so the
   * badge MUST be qualified rather than implying every buyer on the tier gets
   * it. Absent = available to everyone on the plan (the normal case).
   */
  availableToSectors?: string[];
}

export interface Plan {
  key: string;
  name: string;
  description: string;
  /** Curated, short marketing bullets from the product API. Prefer these over
   *  composing features + limits — the product API is the single source of truth. */
  highlights: string[];
  /** The claim keys each highlight advertises, in the same order (empty for a
   *  limit or service line). Absent on the fallback and an older API. */
  highlightClaims?: string[][];
  /**
   * Can this tier be bought with a card, or does it need a sales conversation?
   *
   * READ THIS, NEVER THE TIER NAME. `plan.key === "enterprise"` was how the CTA,
   * the struck-through price and the annual-saving line all decided — which
   * silently becomes wrong the day a second tier is quote-priced, or the day
   * Enterprise becomes self-serve. The published amount cannot answer it either:
   * a quote-priced tier shows a FLOOR ("From ₦…"), which reads as a price.
   *
   * The product API is the single source of truth and enforces the same flag on
   * its own Pay button, so the page and the product cannot disagree.
   */
  selfServeCheckout: boolean;
  /** Service promises this plan carries (dedicated onboarding, priority
   *  support) — never runtime gates. Absent on an older payload, which listed
   *  them only in `features`; `withServiceCommitmentGroup` reads either. */
  serviceCommitments?: string[];
  pricing: PricingCurrency[];
  limits: PlanLimits;
  modules: PlanModule[];
  features: Record<string, boolean>;
}

interface ModuleInfo {
  name: string;
  description: string;
  /** See `PlanModule.availableToSectors`. */
  availableToSectors?: string[];
}

/** A comparison-table section, derived server-side by the pricing API from the
 *  module→feature ownership SSOT (deduped, orphan-free, coverage-complete).
 *  `label` is the module's short name, or "Workflow & platform" for the
 *  cross-cutting catch-all group. */
export interface FeatureGroup {
  key: string;
  label: string;
  featureKeys: string[];
}

/** The free-trial terms, as published by the pricing API. The trial runs on a
 *  real plan tier (`plan`), so what a trialist can actually use is that plan's
 *  entitlement — which is why the module pages derive their trial row from it
 *  rather than restating the trial's length and tier in eight places. */
interface TrialInfo {
  enabled: boolean;
  days: number;
  /** Plan KEY the trial runs on (matches a `Plan.key`), not a display name. */
  plan: string;
  seatCap?: number;
  cardRequired?: boolean;
}

export interface PricingData {
  plans: Plan[];
  planOrder: string[];
  addOns: unknown[];
  featureLabels: Record<string, string>;
  /** Optional — absent on a stale fallback; the trial row then self-hides. */
  trial?: TrialInfo;
  /** Optional — absent on a cold-start stale fallback; the comparison table
   *  self-hides when missing/empty. */
  featureGroups?: FeatureGroup[];
  moduleOrder: string[];
  modules: Record<string, ModuleInfo>;
  /** The always-on substrate modules (approval engine, audit trail, integrations)
   *  advertised ONCE as "included on every plan", never a per-plan badge. Optional
   *  — absent on a stale fallback / a pre-deploy API; the render falls back to the
   *  site's own substrate module list. Reuses `PlanModule` ({ key, name, description }). */
  platformModules?: PlanModule[];
  /** The order the module suites are shown in (e.g. spend, oversight, …).
   *  Optional — absent on an older fallback or API. */
  suiteOrder?: string[];
  /** When each capability was last signed off as working on production, by
   *  claim key (ISO instants). Absent on the fallback and an older API — then
   *  nothing that needs a sign-off is shown (`@/lib/verified-claims`). */
  claims?: Record<string, string>;
  /** DERIVED by `fetchPricingData`, never sent: the claim keys whose sign-off
   *  holds at render time. Read by the module pages' capability cards. */
  verifiedClaims?: string[];
}


import { cache } from "react";

import fallback from "@/data/pricing-fallback.json";
import { withVerifiedClaimsOnly } from "@/lib/verified-claims";

/** Every payload the page renders — live or fallback — shows service
 *  commitments as their own comparison group (see `@/lib/service-commitments`).
 *  Memoised per render with React's `cache`: the request carries a timeout
 *  signal, which opts it out of Next's own fetch de-duplication, so a page and
 *  its metadata would otherwise each make the call. */
export const fetchPricingData = cache(async (): Promise<PricingData> => {
  return withVerifiedClaimsOnly(withServiceCommitmentGroup(await fetchRawPricingData()), new Date());
});

async function fetchRawPricingData(): Promise<PricingData> {
  try {
    const res = await platformFetch(PLATFORM_API_PATHS.pricing, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return fallback as unknown as PricingData;

    const data = await res.json();
    // Guard the full shape the UI depends on — a structurally-partial but
    // non-empty payload would otherwise pass and crash the render.
    const valid =
      Array.isArray(data?.plans) &&
      data.plans.length > 0 &&
      Array.isArray(data?.planOrder) &&
      data.planOrder.length > 0 &&
      data.plans.every(
        (p: { pricing?: unknown; selfServeCheckout?: unknown }) =>
          // `selfServeCheckout` is guarded like `pricing` because the page reads
          // it to decide between "Start my trial" and "Talk to us". Absent, the
          // check below would coerce to false and put EVERY tier behind a sales
          // conversation — so a payload without it is not trusted, and the
          // committed snapshot serves instead.
          Array.isArray(p?.pricing) && typeof p?.selfServeCheckout === "boolean",
      );
    if (!valid) return fallback as unknown as PricingData;

    return data as PricingData;
  } catch {
    return fallback as unknown as PricingData;
  }
}
