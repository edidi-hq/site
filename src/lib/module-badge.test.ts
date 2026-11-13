import { describe, expect, it } from "vitest";

import { moduleBadgeLabel } from "@/lib/module-badge";

describe("moduleBadgeLabel", () => {
  it("shows no badge when nothing on the plan is signed off (never 'all' of nothing)", () => {
    expect(moduleBadgeLabel([], 0)).toBe("");
    expect(moduleBadgeLabel([], 7)).toBe("");
  });

  it("names the signed-off modules when not every marketed one is on the plan or signed off", () => {
    expect(moduleBadgeLabel(["Payables", "Procurement"], 7)).toBe("Payables + Procurement");
  });

  it("says 'All modules included' only when every marketed module is shown", () => {
    expect(moduleBadgeLabel(["A", "B", "C"], 3)).toBe("All modules included");
  });
});
