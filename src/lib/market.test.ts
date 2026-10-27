import { describe, expect, it } from "vitest";

import { accountingConnectionViolations, recordKeepingViolations } from "@edidi-hq/core/brand/copy-guardrails";
import { INTERNATIONAL_PRICE_CURRENCY } from "@edidi-hq/core/billing/catalog";

import { LEAD_CURRENCY, MARKET_NEED, MARKET_SCOPE, MARKET_STATEMENT, startingCurrency } from "./market";

describe("the market statement", () => {
  it("is composed from the lead market, never typed", () => {
    expect(MARKET_STATEMENT).toBe(`Built for ${MARKET_SCOPE} ${MARKET_NEED}.`);
  });

  it("keeps the claims rules (no 'permanent record')", () => {
    expect(recordKeepingViolations(MARKET_STATEMENT)).toEqual([]);
    expect(accountingConnectionViolations(MARKET_STATEMENT)).toEqual([]);
  });
});

describe("startingCurrency", () => {
  const offered = [LEAD_CURRENCY, "USD", "GBP", "EUR"];

  it("opens in the visitor's own currency when the price list has it", () => {
    expect(startingCurrency("GB", offered)).toBe("GBP");
    expect(startingCurrency("US", offered)).toBe("USD");
    expect(startingCurrency("NG", [LEAD_CURRENCY, "USD"])).toBe(LEAD_CURRENCY);
  });

  it("opens in the international currency for a visitor from anywhere else", () => {
    expect(startingCurrency("GB", [LEAD_CURRENCY, INTERNATIONAL_PRICE_CURRENCY])).toBe(
      INTERNATIONAL_PRICE_CURRENCY,
    );
    expect(startingCurrency("BR", offered)).toBe(INTERNATIONAL_PRICE_CURRENCY);
  });

  it("opens in the lead currency for a visitor we cannot place, or when there is no other", () => {
    expect(startingCurrency(null, offered)).toBe(LEAD_CURRENCY);
    expect(startingCurrency("GB", [LEAD_CURRENCY])).toBe(LEAD_CURRENCY);
  });

  it("falls back to the list's first currency when even the lead one is missing", () => {
    expect(startingCurrency(null, ["USD", "GBP"])).toBe("USD");
  });
});
