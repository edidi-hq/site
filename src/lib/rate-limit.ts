import "server-only";
import { headers } from "next/headers";
import {
  checkRateLimit,
  makeLimiter,
  type Limiter,
  type RateLimitVerdict,
} from "@edidi-hq/core/security/rate-limit";
import type { RateLimitTierKey } from "@edidi-hq/core/security/rate-limit-tiers";

/**
 * Rate limits for the four public Server Actions, run on core's shared limiter
 * (`@edidi-hq/core/security/rate-limit`) — the same seam the tenant app and
 * the platform console use. Each limiter is tagged with its registry tier, so
 * a refusal is counted where the platform console can see it.
 *
 * This repository is PUBLIC. Why each action has the failure mode it has is
 * abuse-defence detail and lives in `guides/security-posture.md`, which is
 * gitignored. Read that before changing a `failClosed` flag or a number.
 */

interface SiteRateLimit {
  /** Registry tier in core — the name the console counts refusals under. */
  readonly tier: RateLimitTierKey;
  /** Prefix of the per-visitor identifier (`<identifierPrefix>:<ip>`). */
  readonly identifierPrefix: string;
  readonly requests: number;
  readonly windowSeconds: number;
  readonly failClosed: boolean;
}

const TEN_MINUTES_SECONDS = 10 * 60;

export const SITE_RATE_LIMITS = {
  contact: {
    tier: "site_contact",
    identifierPrefix: "contact",
    requests: 5,
    windowSeconds: TEN_MINUTES_SECONDS,
    failClosed: true,
  },
  savingsEstimate: {
    tier: "site_savings_estimate",
    identifierPrefix: "estimate",
    requests: 5,
    windowSeconds: TEN_MINUTES_SECONDS,
    failClosed: true,
  },
  trialRequest: {
    tier: "site_trial_request",
    identifierPrefix: "trial",
    requests: 5,
    windowSeconds: TEN_MINUTES_SECONDS,
    failClosed: true,
  },
  trialResend: {
    tier: "site_trial_resend",
    identifierPrefix: "reissue",
    requests: 3,
    windowSeconds: TEN_MINUTES_SECONDS,
    failClosed: true,
  },
} as const satisfies Record<string, SiteRateLimit>;

export type SiteRateLimitedAction = keyof typeof SITE_RATE_LIMITS;

/** Shown when a fail-closed action cannot reach its limiter (verdict status 503). */
export const RATE_LIMIT_UNAVAILABLE_MESSAGE =
  "This form is temporarily unavailable. Please try again in a few minutes.";

// Built once per action; null when the shared store is not configured.
const limiters = new Map<SiteRateLimitedAction, Limiter | null>();

/** The limiter an action runs on — exported so tests can read its tier. */
export function limiterFor(action: SiteRateLimitedAction): Limiter | null {
  if (!limiters.has(action)) {
    const { requests, windowSeconds, tier } = SITE_RATE_LIMITS[action];
    limiters.set(action, makeLimiter(requests, windowSeconds, tier));
  }
  return limiters.get(action) ?? null;
}

/** Check (and spend) one of this visitor's attempts at `action`. */
export async function limitVisitor(action: SiteRateLimitedAction): Promise<RateLimitVerdict> {
  const { identifierPrefix, failClosed } = SITE_RATE_LIMITS[action];
  return checkRateLimit(limiterFor(action), `${identifierPrefix}:${await visitorIp()}`, {
    failClosed,
  });
}

/** What `visitorIp()` answers when no proxy header names the visitor. */
export const UNKNOWN_VISITOR_IP = "unknown";

/** The visitor's IP, best effort, from the proxy headers; `UNKNOWN_VISITOR_IP` if unavailable. */
export async function visitorIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    UNKNOWN_VISITOR_IP
  );
}
