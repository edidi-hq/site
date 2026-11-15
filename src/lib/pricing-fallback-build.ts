/* ── The cold-start pricing fallback, generated from core ──────── */

// Relative imports only: `scripts/generate-pricing-fallback.mjs` loads this file
// outside the Next/Vitest alias config.
import {
  LIVE_BILLING_CURRENCIES,
  PLAN_CATALOG,
  PLAN_ORDER,
  annualPriceMinor,
  isSelfServePlan,
  monthlyPriceMinor,
  planIncludesFeature,
  planModules,
  type PlanKey,
} from "@edidi-hq/core/billing/catalog";
import { TRIAL_SEAT_CAP } from "@edidi-hq/core/billing/capacity";
import {
  FOUNDATION_CAPABILITY_IDS,
  SELLABLE_FEATURE_KEYS,
  SERVICE_COMMITMENT_KEYS,
} from "@edidi-hq/core/billing/features";
import { TRIAL_DURATION_DAYS, TRIAL_PLAN } from "@edidi-hq/core/billing/trial-deadlines";
import {
  MODULE_CATALOG,
  MODULE_ORDER,
  SUITE_ORDER,
  type ModuleKey,
} from "@edidi-hq/core/modules/catalog";
import { CURRENCIES, type CurrencyCode } from "@edidi-hq/core/money/types";
import { SECTORS, isModuleAllowedForSector, sectorRestrictedModuleKeys } from "@edidi-hq/core/sectors";

import { effectiveDocumentRetentionDays } from "@edidi-hq/core/billing/retention";

import { FEATURE_LABELS, PLAN_COPY } from "../data/plan-copy";
import { formatCurrencyAmount } from "./money";
import { addedSalesTax, taxLabel } from "./price-tax";
import {
  documentLimitLine,
  retentionLimitLine,
  storageLimitLine,
  userLimitLine,
} from "./plan-limits";
import type { FeatureGroup, Plan, PlanModule, PricingCurrency, PricingData } from "./pricing";
import { withServiceCommitmentGroup } from "./service-commitments";

/**
 * `src/data/pricing-fallback.json` — the page's cold-start floor, served only
 * when the pricing API is unreachable on an empty cache — built from core's plan
 * catalogue in exactly the shape `/api/v1/public/pricing` serves.
 *
 * It used to be a copy of the live API, refreshed on each build. That made the
 * floor only as fresh as the last build that happened to reach the API, and the
 * test that guarded it could only check anything while the API was up. Every
 * fact the API serves now has a home in core, so the floor is DERIVED instead:
 *
 *   - plans, order, names, how each is sold, prices in the currencies the
 *     platform collects in (monthly, and annual from `annualPriceMinor`),
 *     capacity, sold features and service commitments → `billing/catalog`;
 *   - document retention → the plan's window through `billing/retention`'s
 *     `effectiveDocumentRetentionDays` (the platform floor, as the API states it);
 *   - which modules a plan includes → `planModules` (each module's `planGate`),
 *     narrowed to what may be advertised (generally available, not the
 *     universal approval engine, sector add-ons qualified) — the same rules the
 *     API applies; module copy and suites → `modules/catalog`;
 *   - the trial → `billing/trial-deadlines` + `billing/capacity`.
 *
 * The words (plan descriptions, highlights, feature labels) are the site's own,
 * in `src/data/plan-copy.ts`. Prices are before tax; `taxRate`/`taxLabel` are
 * the tax the platform adds on top in that currency (core `billing/platform-tax`:
 * naira's VAT only once the platform is registered for it — null until then — and
 * none where Stripe computes it). `addOns` is empty: the
 * product sells none.
 *
 * Service commitments are listed per plan (`serviceCommitments`, as the API
 * publishes them) and grouped under "Service & support", not the platform
 * group (`withServiceCommitmentGroup`, the same pass the page applies to a
 * live payload).
 *
 * `scripts/generate-pricing-fallback.mjs` writes the file on `prebuild` /
 * `predev`; `pricing-fallback.test.ts` fails when the committed file differs.
 */

/** A minor-unit amount in major units (the API's unit). */
function toMajor(minor: number, currency: CurrencyCode): number {
  return minor / 10 ** CURRENCIES[currency].minorUnit;
}

function priceEntries(plan: PlanKey): PricingCurrency[] {
  const quote = !isSelfServePlan(plan);
  return LIVE_BILLING_CURRENCIES.flatMap((currency) => {
    const monthlyMinor = monthlyPriceMinor(plan, currency);
    if (monthlyMinor === null) return [];
    const monthly = toMajor(monthlyMinor, currency);
    const annualMinor = annualPriceMinor(plan, currency);
    const annualTotal = annualMinor === null ? null : toMajor(annualMinor, currency);
    return [
      {
        currency,
        monthly,
        monthlyLabel: `${quote ? "From " : ""}${formatCurrencyAmount(monthly, currency)}/month`,
        annualPerMonth: annualTotal === null ? null : Math.round(annualTotal / 12),
        annualTotal,
        annualLabel: annualTotal === null ? null : `${formatCurrencyAmount(annualTotal, currency)}/year`,
        taxRate: addedSalesTax(currency)?.rate ?? null,
        taxLabel: taxLabel(currency),
      },
    ];
  });
}

/** Advertising rules — the same three the pricing API applies. */
const isAdvertisable = (module: ModuleKey) => MODULE_CATALOG[module].maturity === "ga";
const isUniversalPlatformModule = (module: ModuleKey) =>
  isAdvertisable(module) &&
  MODULE_CATALOG[module].classification === "substrate" &&
  PLAN_ORDER.every((plan) => planModules(plan).includes(module));
const isSellableModule = (module: ModuleKey) => isAdvertisable(module) && !isUniversalPlatformModule(module);

const SECTOR_RESTRICTED = new Set<ModuleKey>(sectorRestrictedModuleKeys());
function sectorQualifier(module: ModuleKey): { availableToSectors?: string[] } {
  if (!SECTOR_RESTRICTED.has(module)) return {};
  return { availableToSectors: SECTORS.filter((sector) => isModuleAllowedForSector(module, sector)) };
}

const ALL_FEATURE_KEYS: readonly string[] = [
  ...FOUNDATION_CAPABILITY_IDS,
  ...SELLABLE_FEATURE_KEYS,
  ...SERVICE_COMMITMENT_KEYS,
];

function featureMap(plan: PlanKey): Record<string, boolean> {
  const entry = PLAN_CATALOG[plan];
  return Object.fromEntries(
    ALL_FEATURE_KEYS.map((key) => [
      key,
      (FOUNDATION_CAPABILITY_IDS as readonly string[]).includes(key) ||
        planIncludesFeature(plan, key) ||
        (entry.serviceCommitments as readonly string[]).includes(key),
    ]),
  );
}

/** What the plan's window delivers on the public list: no country in view, so the platform floor. */
function documentRetentionDays(plan: PlanKey): number {
  return effectiveDocumentRetentionDays(PLAN_CATALOG[plan].documentRetentionDays);
}

function buildPlan(plan: PlanKey): Plan {
  const entry = PLAN_CATALOG[plan];
  const copyInput = { capacity: entry.capacity, documentRetentionDays: documentRetentionDays(plan) };
  const modules: PlanModule[] = planModules(plan)
    .filter(isSellableModule)
    .map((module) => ({
      key: module,
      name: MODULE_CATALOG[module].name,
      description: MODULE_CATALOG[module].description,
      ...sectorQualifier(module),
    }));
  return {
    key: plan,
    name: entry.name,
    description: PLAN_COPY[plan].description(copyInput),
    ...fallbackHighlights(PLAN_COPY[plan].highlights(copyInput)),
    selfServeCheckout: isSelfServePlan(plan),
    serviceCommitments: [...entry.serviceCommitments],
    pricing: priceEntries(plan),
    limits: {
      maxUsers: entry.capacity.maxUsers,
      maxDocumentsPerMonth: entry.capacity.maxDocumentsPerMonth,
      maxStorageBytes: entry.capacity.maxStorageBytes,
      documentRetentionDays: copyInput.documentRetentionDays,
      maxUsersLabel: userLimitLine(entry.capacity.maxUsers),
      maxDocumentsPerMonthLabel: documentLimitLine(entry.capacity.maxDocumentsPerMonth),
      maxStorageBytesLabel: storageLimitLine(entry.capacity.maxStorageBytes),
      documentRetentionDaysLabel: retentionLimitLine(copyInput.documentRetentionDays),
    },
    modules,
    features: featureMap(plan),
  };
}

/**
 * Comparison groups — the API's algorithm: a sold, labelled feature groups under
 * the first advertised module that owns it AND gates it (every plan with the
 * feature includes the module); everything else is "Workflow & platform".
 */
function featureGroups(plans: Plan[], moduleOrder: ModuleKey[]): FeatureGroup[] {
  const isAdvertisableFeature = (feature: string) =>
    FEATURE_LABELS[feature] !== undefined && plans.some((plan) => plan.features[feature] === true);
  const isGatedByModule = (feature: string, module: ModuleKey) =>
    plans.every(
      (plan) => plan.features[feature] !== true || plan.modules.some((listed) => listed.key === module),
    );
  const assigned = new Set<string>();
  const moduleGroups = moduleOrder
    .map((module) => {
      const featureKeys = MODULE_CATALOG[module].features.filter(
        (feature) => isAdvertisableFeature(feature) && !assigned.has(feature) && isGatedByModule(feature, module),
      );
      featureKeys.forEach((feature) => assigned.add(feature));
      return { key: module as string, label: MODULE_CATALOG[module].sidebarLabel, featureKeys };
    })
    .filter((group) => group.featureKeys.length > 0);
  const platformKeys = Object.keys(FEATURE_LABELS).filter(
    (feature) => isAdvertisableFeature(feature) && !assigned.has(feature),
  );
  return [
    ...moduleGroups,
    ...(platformKeys.length > 0
      ? [{ key: "platform", label: "Workflow & platform", featureKeys: platformKeys }]
      : []),
  ];
}

function buildPricingFallback(): PricingData {
  const plans = PLAN_ORDER.map(buildPlan);

  // Fail closed: a feature core sells with no label here would silently vanish
  // from the comparison table on the one day the fallback is served.
  const unlabelled = ALL_FEATURE_KEYS.filter(
    (feature) => plans.some((plan) => plan.features[feature]) && FEATURE_LABELS[feature] === undefined,
  );
  if (unlabelled.length > 0) {
    throw new Error(
      `pricing fallback: features sold on a plan have no label in src/data/plan-copy.ts: ${unlabelled.join(", ")}`,
    );
  }

  const moduleOrder = MODULE_ORDER.filter(isSellableModule);
  const groups = featureGroups(plans, moduleOrder);
  const featureLabels = Object.fromEntries(
    groups.flatMap((group) => group.featureKeys).map((feature) => [feature, FEATURE_LABELS[feature]!]),
  );

  return withServiceCommitmentGroup({
    plans,
    planOrder: [...PLAN_ORDER],
    addOns: [],
    featureLabels,
    featureGroups: groups,
    moduleOrder: [...moduleOrder],
    suiteOrder: [...SUITE_ORDER],
    modules: Object.fromEntries(
      moduleOrder.map((module) => [
        module,
        {
          name: MODULE_CATALOG[module].name,
          ...sectorQualifier(module),
          sidebarLabel: MODULE_CATALOG[module].sidebarLabel,
          description: MODULE_CATALOG[module].description,
          suite: MODULE_CATALOG[module].suite,
          features: MODULE_CATALOG[module].features,
        },
      ]),
    ),
    platformModules: MODULE_ORDER.filter(isUniversalPlatformModule).map((module) => ({
      key: module,
      name: MODULE_CATALOG[module].name,
      description: MODULE_CATALOG[module].description,
    })),
    trial: {
      enabled: true,
      days: TRIAL_DURATION_DAYS,
      plan: TRIAL_PLAN,
      seatCap: TRIAL_SEAT_CAP,
      cardRequired: false,
    },
  });
}

/** The file's exact text: two-space JSON plus a trailing newline. */
/** The bullets, and beside them the claims each makes — the API's shape. */
function fallbackHighlights(items: ReturnType<(typeof PLAN_COPY)[PlanKey]["highlights"]>) {
  return { highlights: items.map((item) => item.text), highlightClaims: items.map((item) => [...item.claims]) };
}

export function serialisePricingFallback(): string {
  return `${JSON.stringify(buildPricingFallback(), null, 2)}\n`;
}
