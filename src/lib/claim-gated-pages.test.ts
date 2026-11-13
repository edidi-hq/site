import { describe, expect, it } from "vitest";

import { CLAIM_KEYS, isClaimKey } from "@edidi-hq/core/billing/feature-claims";

import { INTEGRATION_SECTION_CLAIMS, signedOffCategories } from "@/components/product/integrations-page";
import { signedOffBullets } from "@/components/product/security-page";
import { SUITE_PAGES } from "@/lib/product-suites";
import { SECURITY_FAQS, signedOffFaqs } from "@/lib/security-faqs";

/**
 * The Integrations and Security pages and the suite pages' shared points
 * advertise paid capabilities in their own words, so each section, bullet,
 * answer or point that does declares its claims and shows only once they are
 * signed off on production (`@/lib/verified-claims`).
 */

const everything = [...CLAIM_KEYS];

describe("Integrations page", () => {
  it("every section declares at least one real claim, including its plan feature", () => {
    for (const section of INTEGRATION_SECTION_CLAIMS()) {
      expect(section.claims.length, section.id).toBeGreaterThan(0);
      expect(section.claims.filter((key) => !isClaimKey(key)), section.id).toEqual([]);
      if (section.planFeature) expect(section.claims, section.id).toContain(section.planFeature);
    }
  });

  it("shows nothing before any sign-off, everything once all are signed off", () => {
    expect(signedOffCategories([])).toEqual([]);
    expect(signedOffCategories(everything).length).toBe(INTEGRATION_SECTION_CLAIMS().length);
  });

  it("an item making an extra claim waits for it: the group sign-in needs multi-company", () => {
    const identity = signedOffCategories(["sso"]).find((section) => section.id === "identity")!;
    expect(identity.integrations.map((item) => item.name)).not.toContain("One provider for a group");
    const withGroups = signedOffCategories(["sso", "multiCompanyGroup"]).find((section) => section.id === "identity")!;
    expect(withGroups.integrations.map((item) => item.name)).toContain("One provider for a group");
  });
});

describe("Security page", () => {
  it("keeps what every customer gets, drops a paid bullet until signed off", () => {
    const bullets = ["Database isolation", { text: "Single sign-on", claims: ["sso" as const] }];
    expect(signedOffBullets(bullets, [])).toEqual(["Database isolation"]);
    expect(signedOffBullets(bullets, ["sso"])).toEqual(["Database isolation", "Single sign-on"]);
  });

  it("drops the single sign-on and full-export answers until signed off; keeps the rest", () => {
    const unsigned = signedOffFaqs([]).map((faq) => faq.q);
    expect(unsigned).not.toContain("Do you support SSO and SCIM?");
    expect(unsigned.length).toBeGreaterThan(0);
    expect(signedOffFaqs(everything)).toEqual(SECURITY_FAQS);
    for (const faq of SECURITY_FAQS) expect((faq.claims ?? []).filter((key) => !isClaimKey(key)), faq.q).toEqual([]);
  });
});

describe("suite pages' shared points", () => {
  it("every declared claim is a real claim key", () => {
    const declared = Object.values(SUITE_PAGES).flatMap((page) => page.shared.flatMap((point) => point.claims ?? []));
    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((key) => !isClaimKey(key))).toEqual([]);
  });
});
