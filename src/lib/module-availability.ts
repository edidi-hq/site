/* ── Per-module plan availability, DERIVED ────────────────────── */

import { MODULE_CATALOG } from "@edidi-hq/core/modules/catalog";
import type { PlanKey } from "@edidi-hq/core/billing/catalog";

import type { ModuleKey } from "@/lib/brand";
import { retentionLimitLine, storageLimitLine } from "@/lib/plan-limits";
import type { Plan, PricingData } from "@/lib/pricing";
// Type-only: erased at compile time, so pulling the row shape from the client
// component does not drag the client bundle into a server route.
import type { ModulePageData, ModulePlan } from "@/components/product/module-layout";
import { featurePlans } from "@/lib/plan-names";

/**
 * Which plans include a module, derived from the pricing API's per-plan module
 * membership — the same field the pricing page's module badges read.
 *
 * WHY THIS IS DERIVED AND NOT AUTHORED. Every product module page used to carry
 * its own hand-written `planAvailability` array, and two of the eight had gone
 * stale against the platform:
 *
 *   - Records said "Starter — Not included". Records has been a core, every-tier
 *     module since it was reclassified from `expansion`; Starter carries it AND
 *     both features it owns. The page talked a Starter buyer out of a module
 *     they already get.
 *   - Compliance said "Starter — included, Basic audit trail". Compliance is not
 *     in Starter's module set and all three of its features are off at that tier.
 *     That one sold a capability the tier does not deliver.
 *
 * Both are the same failure: a fact about entitlement, kept by hand, in a file
 * nobody edits when pricing changes. The API already publishes the truth, so
 * inclusion is now read from it and only the editorial colour stays authored.
 *
 * NOTE ON SUBSTRATE MODULES. `included` answers "is the sellable module in this
 * tier", which is the question the table's tick actually claims. It is NOT the
 * same as "you get nothing" — the always-on foundation (approval engine,
 * tamper-evident trail) runs on every plan. Where that distinction matters the note
 * says so explicitly; see `MODULE_PLAN_NOTES.audit.starter`.
 *
 * A row that does NOT include the module and has no authored note says where the
 * module starts ("From <tier>" / "<tier> tier only"), derived from the
 * same membership — tier names are never typed into a note.
 */
/** Everything a module route hands its page from the pricing API. */
export function modulePageData(moduleKey: ModuleKey, data: PricingData): ModulePageData {
  return {
    planAvailability: planAvailabilityFor(moduleKey, data),
    featurePlans: featurePlans(data),
    verifiedClaims: data.verifiedClaims ?? [],
  };
}

export function planAvailabilityFor(
  moduleKey: string,
  data: PricingData,
): ModulePlan[] {
  const planFor = (key: string) => data.plans.find((p) => p.key === key);

  // A PLATFORM module (Authority — the approval engine) is on every plan and is
  // therefore published under `platformModules`, deliberately absent from any
  // plan's own `modules` array. Read literally that would render a page of
  // crosses for the one module nobody can be without, so inclusion is answered
  // from the field the API actually puts it in. Still derived — no key is
  // special-cased here, and a module the API later promotes or demotes follows
  // automatically.
  const isPlatformModule = (data.platformModules ?? []).some((m) => m.key === moduleKey);
  const includes = (planKey: string) =>
    isPlatformModule || (planFor(planKey)?.modules.some((m) => m.key === moduleKey) ?? false);

  // Only signed-off claims are advertised (`@/lib/verified-claims`): a module's
  // authored notes describe the module, so they need its claim; a feature line
  // names only features that are signed off.
  const verified = new Set(data.verifiedClaims ?? []);
  const notes = verified.has(moduleKey) ? (MODULE_PLAN_NOTES[moduleKey as ModuleKey] ?? {}) : {};
  const rows: ModulePlan[] = [];

  // Where the module starts, for the rows that do not include it: "From
  // <tier>", or "<tier> tier only" when only the top tier carries it.
  // Derived from the same membership as the tick, so no plan name is typed here.
  const includingPlans = data.planOrder.filter(includes);
  const lowestIncluding = includingPlans.length > 0 ? planFor(includingPlans[0]!) : undefined;
  const isTopTierOnly =
    includingPlans.length === 1 && includingPlans[0] === data.planOrder[data.planOrder.length - 1];
  const startsAt = lowestIncluding
    ? isTopTierOnly
      ? `${lowestIncluding.name} tier only`
      : `From ${lowestIncluding.name}`
    : undefined;
  // An unknown key owns nothing — it fails closed to no inclusion and no lines.
  const ownedFeatures: readonly string[] = Object.hasOwn(MODULE_CATALOG, moduleKey)
    ? MODULE_CATALOG[moduleKey as keyof typeof MODULE_CATALOG].features.filter((key) => verified.has(key))
    : [];
  const featureLine = (prefix: string, keys: string[]) => {
    const labels = keys.map((key) => data.featureLabels[key]).filter((label): label is string => Boolean(label));
    return labels.length > 0 ? `${prefix}: ${labels.join(" · ")}` : undefined;
  };
  /**
   * What the data says about this module on a plan that includes it: on the
   * lowest such plan, the module's features it carries; on each plan above, the
   * module's features it adds. Labels are the API's own, so a feature moving
   * between plans moves its line with it.
   */
  const derivedNote = (planKey: string): string | undefined => {
    const plan = planFor(planKey);
    if (!plan) return undefined;
    const on = (candidate: Plan | undefined) => ownedFeatures.filter((key) => candidate?.features[key] === true);
    const index = includingPlans.indexOf(planKey);
    if (index === 0) return featureLine("Includes", on(plan));
    const previous = new Set(on(planFor(includingPlans[index - 1]!)));
    return featureLine("Also unlocks", on(plan).filter((key) => !previous.has(key)));
  };
  const noteFor = (key: string, included: boolean): string | undefined => {
    const authored = notes[key as PlanKey | "trial"];
    const plan = planFor(key === "trial" ? (data.trial?.plan ?? "") : key);
    const authoredText =
      typeof authored === "function" && plan
        ? authored({ plan, lowestIncludingPlanName: lowestIncluding?.name ?? "", verified })
        : typeof authored === "string"
          ? authored
          : undefined;
    if (authoredText) return authoredText;
    if (!included) return startsAt;
    return key === "trial" ? undefined : derivedNote(key);
  };

  // Trial row first — a trialist is on a real tier, so its inclusion is that
  // tier's inclusion. Self-hides when the API omits trial terms (stale fallback)
  // or the trial is switched off, rather than asserting a trial that isn't sold.
  const trial = data.trial;
  const trialPlan = trial?.enabled ? planFor(trial.plan) : undefined;
  if (trial && trialPlan) {
    rows.push({
      plan: `${trial.days}-day ${trialPlan.name} trial`,
      included: includes(trial.plan),
      note: noteFor("trial", includes(trial.plan)),
      isTrial: true,
    });
  }

  for (const planKey of data.planOrder) {
    const plan = planFor(planKey);
    if (!plan) continue; // planOrder naming a plan the payload doesn't carry
    rows.push({
      plan: plan.name,
      included: includes(planKey),
      note: noteFor(planKey, includes(planKey)),
    });
  }

  return rows;
}

/**
 * Editorial colour only — what the data cannot say: what a buyer still gets
 * when the module is not in their tier, or a module whose depth is not a list
 * of plan features. Everything else is derived above from the API's own feature
 * labels and limits.
 *
 * Deliberately holds no inclusion claim: the row's tick already says it, and a
 * note that restates the tick is a second copy that can contradict the first.
 * Keyed by module, then by plan key (or `trial`). Never a typed number or tier
 * name: a note that needs one is a function handed the plan (its limits and
 * features) and the lowest tier that includes the module.
 */
interface PlanNoteContext {
  plan: Plan;
  lowestIncludingPlanName: string;
  /** Signed-off claim keys — a note naming another capability checks it. */
  verified: ReadonlySet<string>;
}

type PlanNote = string | ((context: PlanNoteContext) => string | undefined);

const MODULE_PLAN_NOTES: Partial<Record<ModuleKey, Partial<Record<PlanKey | "trial", PlanNote>>>> = {
  vault: {
    // Records is about keeping things; how much and for how long is its depth.
    starter: ({ plan }) => storageAndRetention(plan),
    business: ({ plan }) => storageAndRetention(plan),
    enterprise: ({ plan }) => storageAndRetention(plan),
  },
  audit: {
    // The honesty fix. Starter does not carry Compliance, but the tamper-evident
    // trail and data-subject request handling are foundation and run for
    // everyone — say both, claim neither.
    starter: ({ lowestIncludingPlanName }) =>
      `Trail still recorded and data-subject requests handled — reporting and exports from ${lowestIncludingPlanName}`,
    // The live SIEM feed rides the API, so it is named only where the plan has it.
    enterprise: ({ plan, verified }) =>
      plan.features.apiAccess === true && verified.has("apiAccess")
        ? `${retentionLimitLine(plan.limits.documentRetentionDays)}, plus a live SIEM feed through the API`
        : retentionLimitLine(plan.limits.documentRetentionDays),
  },
  guard: {
    // Integrity's rules are not separate plan features, so the data has no list to show.
    business: "All rule-based flags and the review queue",
  },
  grants: {
    // Grants carries no plan features of its own: the module is the whole offer.
    business:
      "Donors, awards and budget lines, partner sub-awards, donor receipts and cash position, matching contributions, reporting deadlines and donor-ready reports",
  },
};

/** "10 GiB storage · 7 years retention", from the plan's own limits. */
function storageAndRetention(plan: Plan): string {
  return `${storageLimitLine(plan.limits.maxStorageBytes)} · ${retentionLimitLine(plan.limits.documentRetentionDays)}`;
}
