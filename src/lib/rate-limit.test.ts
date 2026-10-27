import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RATE_LIMIT_TIERS } from "@edidi-hq/core/security/rate-limit-tiers";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }),
}));

const ACTIONS = ["contact", "savingsEstimate", "trialRequest", "trialResend"] as const;

/** Fresh module graph per test: both the site's and core's limiter caches reset. */
async function loadSeam() {
  vi.resetModules();
  return import("./rate-limit");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("site rate limits", () => {
  it("keeps each action's limit, window and identifier", async () => {
    const { SITE_RATE_LIMITS } = await loadSeam();
    const summary = Object.fromEntries(
      ACTIONS.map((action) => {
        const { identifierPrefix, requests, windowSeconds } = SITE_RATE_LIMITS[action];
        return [action, `${identifierPrefix} ${requests}/${windowSeconds}s`];
      }),
    );
    expect(summary).toEqual({
      contact: "contact 5/600s",
      savingsEstimate: "estimate 5/600s",
      trialRequest: "trial 5/600s",
      trialResend: "reissue 3/600s",
    });
  });

  it("tags every action's limiter with its own site tier from core's registry", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://rate-limit.test.invalid");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    const { SITE_RATE_LIMITS, limiterFor } = await loadSeam();

    const expected = {
      contact: "site_contact",
      savingsEstimate: "site_savings_estimate",
      trialRequest: "site_trial_request",
      trialResend: "site_trial_resend",
    } as const;
    for (const action of ACTIONS) {
      const limiter = limiterFor(action);
      expect(limiter, action).not.toBeNull();
      expect(limiter!.tier, action).toBe(expected[action]);
      expect(SITE_RATE_LIMITS[action].tier).toBe(expected[action]);
      expect(RATE_LIMIT_TIERS[expected[action]].surface).toBe("site");
    }
    // One tier per action — two actions sharing a tier would share a bucket.
    expect(new Set(ACTIONS.map((action) => SITE_RATE_LIMITS[action].tier)).size).toBe(ACTIONS.length);
  });

  it("refuses every action when no limiter can run — none is left unlimited", async () => {
    const { limitVisitor } = await loadSeam();
    const statuses = Object.fromEntries(
      await Promise.all(
        ACTIONS.map(async (action) => {
          const verdict = await limitVisitor(action);
          return [action, verdict.ok ? "allowed" : verdict.status] as const;
        }),
      ),
    );
    expect(statuses).toEqual({
      contact: 503,
      savingsEstimate: 503,
      trialRequest: 503,
      trialResend: 503,
    });
  });

  it("checks the visitor's first forwarded address under the action's identifier", async () => {
    const checkSpy = vi.fn(async () => ({ ok: true }) as const);
    vi.doMock("@edidi-hq/core/security/rate-limit", async (importOriginal) => ({
      ...(await importOriginal<object>()),
      checkRateLimit: checkSpy,
    }));
    try {
      const { limitVisitor } = await loadSeam();
      await limitVisitor("trialResend");
      expect(checkSpy).toHaveBeenLastCalledWith(null, "reissue:203.0.113.7", { failClosed: true });
      await limitVisitor("contact");
      expect(checkSpy).toHaveBeenLastCalledWith(null, "contact:203.0.113.7", { failClosed: true });
    } finally {
      vi.doUnmock("@edidi-hq/core/security/rate-limit");
    }
  });
});
