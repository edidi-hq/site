import { describe, it, expect } from "vitest";
import { planAvailabilityFor } from "@/lib/module-availability";
import type { PricingData } from "@/lib/pricing";
import fallback from "@/data/pricing-fallback.json";
import { TRIAL_LENGTH, TRIAL_PLAN_NAME } from "@/lib/trial-terms";
import { CLAIM_KEYS } from "@edidi-hq/core/billing/feature-claims";

/** The offline payload with every claim signed off — what the notes say once production is checked. */
const data = { ...(fallback as unknown as PricingData), verifiedClaims: [...CLAIM_KEYS] };
/** The same payload before any sign-off: inclusion stays, capability words go. */
const unsigned = fallback as unknown as PricingData;
const TRIAL_ROW = `${TRIAL_LENGTH} ${TRIAL_PLAN_NAME} trial`;

/** The row for a plan display name, e.g. "Starter". */
const row = (moduleKey: string, planName: string) =>
  planAvailabilityFor(moduleKey, data).find((r) => r.plan === planName);

describe("planAvailabilityFor — inclusion comes from the API, never from prose", () => {
  // The two drifts this derivation exists to kill. Both were live on the site
  // and both were wrong in the expensive direction: one talked a Starter buyer
  // out of a module they get, the other sold one they don't.
  it("Records IS included on Starter (the under-claim that cost conversions)", () => {
    expect(row("vault", "Starter")?.included).toBe(true);
  });

  it("Compliance is NOT included on Starter (the over-claim that sold a missing tier)", () => {
    expect(row("audit", "Starter")?.included).toBe(false);
  });

  it("says what a Starter buyer still gets rather than leaving a bare cross", () => {
    // Compliance is substrate: the trail runs for everyone even though the
    // sellable module starts at Business. A bare ✗ would be its own over-correction.
    expect(row("audit", "Starter")?.note).toMatch(/still recorded/i);
  });

  it("tracks real membership across every tier", () => {
    // Ground truth: core modules/catalog planGate (billing/catalog planModules).
    expect(row("pay", "Starter")?.included).toBe(true);
    expect(row("procure", "Starter")?.included).toBe(true);
    expect(row("guard", "Starter")?.included).toBe(false);
    expect(row("guard", "Business")?.included).toBe(true);
    expect(row("connect", "Business")?.included).toBe(false);
    expect(row("connect", "Enterprise")?.included).toBe(true);
    expect(row("people", "Business")?.included).toBe(false);
    expect(row("people", "Enterprise")?.included).toBe(true);
  });

  it("derives the trial row from the tier the trial actually runs on", () => {
    // Not a typed trial label in eight files: change the trial length or tier
    // in core (and so the API) and every module page follows.
    const rows = planAvailabilityFor("guard", data);
    expect(rows[0]!.plan).toBe(TRIAL_ROW);
    // Guard is a Business module, and the trial is a Business trial ⇒ included.
    expect(rows[0]!.included).toBe(true);
    // People is Enterprise-only, so a Business trial does NOT include it.
    expect(planAvailabilityFor("people", data)[0]!.included).toBe(false);
  });

  it("emits one row per plan, in the API's declared order", () => {
    const rows = planAvailabilityFor("vault", data).map((r) => r.plan);
    expect(rows).toEqual([
      TRIAL_ROW,
      "Starter",
      "Business",
      "Enterprise",
    ]);
  });

  it("shows a platform module as included on every tier", () => {
    // Authority is published under `platformModules`, never inside a plan's own
    // `modules` array. Read naively that renders a wall of crosses for the one
    // module no tenant can be without — the exact wrong answer.
    const rows = planAvailabilityFor("authority", data);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.included)).toBe(true);
    expect(data.plans.every((p) => !p.modules.some((m) => m.key === "authority"))).toBe(true);
  });

  it("derives each tier's extra depth from the API's feature labels", () => {
    // Authority's depth moves by plan: the lines name what each tier adds, in
    // the API's words, so they cannot claim a feature the tier does not carry.
    const business = data.plans.find((plan) => plan.key === "business")!;
    const enterprise = data.plans.find((plan) => plan.key === "enterprise")!;
    const enterpriseNote = row("authority", enterprise.name)?.note ?? "";
    expect(enterpriseNote).toContain(data.featureLabels.advancedApprovalWorkflows!);
    expect(enterpriseNote).not.toContain(data.featureLabels.delegation!);
    expect(row("authority", business.name)?.note ?? "").toContain(data.featureLabels.delegation!);
  });

  it("states storage and retention from the plan's own limits", () => {
    for (const plan of data.plans) {
      expect(row("vault", plan.name)?.note ?? "").toMatch(/storage · .*retention/);
    }
  });

  it("names the SIEM feed only where the plan carries API access", () => {
    for (const plan of data.plans) {
      const note = row("audit", plan.name)?.note ?? "";
      if (/SIEM/.test(note)) expect(plan.features.apiAccess).toBe(true);
    }
  });

  it("carries no note that restates the tick", () => {
    for (const moduleKey of data.moduleOrder) {
      for (const r of planAvailabilityFor(moduleKey, data)) {
        expect(r.note ?? "").not.toMatch(/^(Included|Not included)$/i);
      }
    }
  });
});

describe("planAvailabilityFor — degraded payloads must not invent entitlement", () => {
  it("hides the trial row when the API omits trial terms", () => {
    const noTrial = { ...data, trial: undefined } as PricingData;
    expect(planAvailabilityFor("vault", noTrial)[0]!.plan).toBe("Starter");
  });

  it("hides the trial row when the trial is switched off", () => {
    const off = {
      ...data,
      trial: { ...data.trial!, enabled: false },
    } as PricingData;
    expect(off.trial!.enabled).toBe(false);
    expect(planAvailabilityFor("vault", off)[0]!.plan).toBe("Starter");
  });

  it("skips a planOrder entry the payload has no plan for", () => {
    const ghost = {
      ...data,
      planOrder: [...data.planOrder, "ghost"],
    } as PricingData;
    expect(
      planAvailabilityFor("vault", ghost).some((r) => r.plan === "ghost"),
    ).toBe(false);
  });

  it("reports an unknown module as not included rather than throwing", () => {
    // Fails CLOSED: a module the API doesn't publish is not something we claim.
    const rows = planAvailabilityFor("does-not-exist", data);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.included)).toBe(true);
  });

  it("says where a missing module starts, from membership, never a typed tier", () => {
    const nameOf = (key: string) => data.plans.find((plan) => plan.key === key)!.name;
    const lowest = (moduleKey: string) =>
      data.planOrder.find((key) => data.plans.find((plan) => plan.key === key)!.modules.some((m) => m.key === moduleKey))!;
    const top = data.planOrder[data.planOrder.length - 1]!;
    // Guard starts below the top tier → "From <tier>".
    expect(lowest("guard")).not.toBe(top);
    expect(row("guard", nameOf(data.planOrder[0]!))?.note).toBe(`From ${nameOf(lowest("guard"))}`);
    // Requests is top-tier only → "<tier> tier only", on every row without it.
    expect(lowest("people")).toBe(top);
    for (const r of planAvailabilityFor("people", data).filter((r) => !r.included)) {
      expect(r.note).toBe(`${nameOf(top)} tier only`);
    }
    // An authored note that names a tier gets the derived one handed in.
    expect(row("audit", nameOf(data.planOrder[0]!))?.note).toMatch(
      new RegExp(`exports from ${nameOf(lowest("audit"))}$`),
    );
  });
});

describe("planAvailabilityFor — only signed-off capabilities are named", () => {
  const unsignedRow = (moduleKey: string, planName: string) =>
    planAvailabilityFor(moduleKey, unsigned).find((r) => r.plan === planName);

  it("keeps inclusion and where a module starts — facts about the plans, not claims", () => {
    expect(unsignedRow("pay", "Starter")?.included).toBe(true);
    expect(unsignedRow("guard", "Starter")?.note).toBe(row("guard", "Starter")?.note);
  });

  it("names no feature and no module depth without a sign-off", () => {
    for (const moduleKey of ["pay", "procure", "guard", "grants", "audit"]) {
      for (const planName of ["Starter", "Business", "Enterprise"]) {
        expect(unsignedRow(moduleKey, planName)?.note ?? "", `${moduleKey} on ${planName}`).not.toMatch(
          /^(Includes|Also unlocks):|review queue|Donors|SIEM|still recorded/,
        );
      }
    }
  });

  it("names a feature once it is signed off, and only that one", () => {
    const signed = { ...unsigned, verifiedClaims: ["pay", "pdfExport"] };
    const note = planAvailabilityFor("pay", signed).find((r) => r.plan === "Starter")?.note;
    expect(note).toBe(`Includes: ${unsigned.featureLabels.pdfExport}`);
  });
});

