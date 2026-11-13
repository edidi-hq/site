import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CLAIM_VERIFICATION_MAX_AGE_DAYS, isClaimKey } from "@edidi-hq/core/billing/feature-claims";

import { serialisePricingFallback } from "@/lib/pricing-fallback-build";
import type { PricingData } from "@/lib/pricing";
import { SERVICE_GROUP_KEY } from "@/lib/service-commitments";
import { stripComments } from "@/lib/test-support/strip-comments";
import { freshClaimKeys, withVerifiedClaimsOnly } from "@/lib/verified-claims";

const now = new Date("2026-12-01T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

function payload(overrides: Partial<PricingData> = {}): PricingData {
  return {
    plans: [
      {
        key: "enterprise",
        highlights: ["Unlimited users", "See across all your companies", "Single sign-on", "API access"],
        highlightClaims: [[], ["multiCompanyGroup", "groupAdminDashboard"], ["sso"], ["apiAccess"]],
      },
    ],
    planOrder: ["enterprise"],
    addOns: [],
    featureLabels: {},
    featureGroups: [
      { key: "pay", label: "Payables", featureKeys: ["bankLetterGeneration", "bulkBankExport"] },
      { key: "platform", label: "Platform", featureKeys: ["sso"] },
      { key: SERVICE_GROUP_KEY, label: "Service", featureKeys: ["prioritySupport"] },
    ],
    moduleOrder: [],
    modules: {},
    claims: {
      multiCompanyGroup: daysAgo(10),
      groupAdminDashboard: daysAgo(10),
      apiAccess: daysAgo(CLAIM_VERIFICATION_MAX_AGE_DAYS + 1),
      bankLetterGeneration: daysAgo(1),
    },
    ...overrides,
  } as unknown as PricingData;
}

describe("only signed-off claims reach the page", () => {
  it("fresh keys are the ones signed off within the window", () => {
    expect(freshClaimKeys(payload().claims, now)).toEqual([
      "bankLetterGeneration",
      "groupAdminDashboard",
      "multiCompanyGroup",
    ]);
    expect(freshClaimKeys(undefined, now)).toEqual([]);
  });

  it("keeps a highlight only when every claim it declares is fresh; keeps fact lines", () => {
    const data = withVerifiedClaimsOnly(payload(), now);
    expect(data.plans[0]!.highlights).toEqual(["Unlimited users", "See across all your companies"]);
  });

  it("drops unsigned comparison rows and emptied groups, keeps the service group", () => {
    const data = withVerifiedClaimsOnly(payload(), now);
    expect(data.featureGroups).toEqual([
      { key: "pay", label: "Payables", featureKeys: ["bankLetterGeneration"] },
      { key: SERVICE_GROUP_KEY, label: "Service", featureKeys: ["prioritySupport"] },
    ]);
  });

  it("fails closed with no sign-offs: no capability highlight, no capability row", () => {
    const data = withVerifiedClaimsOnly(payload({ claims: undefined }), now);
    expect(data.verifiedClaims).toEqual([]);
    expect(data.plans[0]!.highlights).toEqual(["Unlimited users"]);
    expect(data.featureGroups?.map((group) => group.key)).toEqual([SERVICE_GROUP_KEY]);
  });

  it("drops a highlight whose claims are unknown (an older API or the fallback)", () => {
    const data = withVerifiedClaimsOnly(
      payload({ plans: [{ key: "starter", highlights: ["Anything"] }] as PricingData["plans"] }),
      now,
    );
    expect(data.plans[0]!.highlights).toEqual([]);
  });

  it("the committed offline fallback carries no sign-offs", () => {
    const fallback = JSON.parse(serialisePricingFallback()) as PricingData;
    expect(fallback).not.toHaveProperty("claims");
    // Offline, the fact lines stay and every capability line goes.
    const shown = withVerifiedClaimsOnly(fallback, now);
    for (const plan of shown.plans) {
      const original = fallback.plans.find((candidate) => candidate.key === plan.key)!;
      const factLines = original.highlights.filter((_, index) => original.highlightClaims![index]!.length === 0);
      expect(plan.highlights, plan.key).toEqual(factLines);
      expect(factLines.length, `${plan.key} keeps its limits`).toBeGreaterThan(0);
    }
  });

  it("every claim the site's plan words declare is a claim key", () => {
    const fallback = JSON.parse(serialisePricingFallback()) as PricingData;
    const declared = fallback.plans.flatMap((plan) => plan.highlightClaims ?? []).flat();
    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((key) => !isClaimKey(key))).toEqual([]);
  });
});

describe("every capability card names a key that can be signed off", () => {
  const pagesDir = join(process.cwd(), "src", "components", "product", "pages");
  const pages = readdirSync(pagesDir).filter((file) => file.endsWith("-module-page.tsx"));

  it("the scan sees the module pages", () => {
    expect(pages.length).toBeGreaterThanOrEqual(8);
  });

  it("each card's planFeature, and each page's module, is a claim key", () => {
    const offenders: string[] = [];
    for (const page of pages) {
      const code = stripComments(readFileSync(join(pagesDir, page), "utf8"));
      const keys = [
        ...[...code.matchAll(/planFeature:\s*"([A-Za-z]+)"/g)].map((match) => match[1]!),
        ...[...code.matchAll(/moduleKey:\s*"([a-z]+)"/g)].slice(0, 1).map((match) => match[1]!),
      ];
      for (const key of keys) if (!isClaimKey(key)) offenders.push(`${page}: "${key}"`);
    }
    expect(offenders, "a card names a key nothing can sign off, so it would never show").toEqual([]);
  });
});
