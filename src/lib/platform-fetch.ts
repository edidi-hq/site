import { PLATFORM_ORIGIN } from "@/lib/platform";
import { errorSummary } from "@/lib/safe-log";

/**
 * Every server-side call to the product app goes through here — trial request,
 * reissue and verify, and the pricing API.
 *
 * A preview build may add one header for a protected preview deployment; it is
 * never sent from production. Setup is in guides/security-posture.md
 * (gitignored). Server-only — never import into a client component
 * (`platform.ts` is the client-safe half).
 *
 * Every call gives up after PLATFORM_REQUEST_TIMEOUT_MS (a caller's own
 * `signal` still applies too), so a slow platform rejects the promise instead
 * of holding the visitor's request open. Callers treat a rejection as the
 * platform being unreachable.
 *
 * Callers turn a failed call into a friendly card, so the reason would
 * otherwise be lost. This logs it, without the body, headers or the visitor:
 * the path, how long the call took, and either the error's name (a timeout
 * reads `TimeoutError`) or the status and content type of a reply the caller
 * cannot read: anything that is not JSON, and any 5xx. The platform's own
 * refusals (404, 410, 422 and the like) are expected answers and stay quiet.
 */

/** How long one call to the product app may take. */
export const PLATFORM_REQUEST_TIMEOUT_MS = 10_000;

export function platformFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const bypass = process.env.PLATFORM_BYPASS_SECRET;
  if (bypass && process.env.VERCEL_ENV !== "production") {
    headers.set("x-vercel-protection-bypass", bypass);
  }
  const timeout = AbortSignal.timeout(PLATFORM_REQUEST_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return callAndLog(path, { ...init, headers, signal });
}

async function callAndLog(path: string, init: RequestInit): Promise<Response> {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${PLATFORM_ORIGIN}${path}`, init);
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "none";
    if (response.status >= 500 || contentType !== "application/json") {
      console.warn("Platform call returned an unreadable answer:", {
        path,
        status: response.status,
        contentType,
        elapsedMs: Date.now() - startedAt,
      });
    }
    return response;
  } catch (error) {
    console.error("Platform call failed:", {
      path,
      error: errorSummary(error),
      elapsedMs: Date.now() - startedAt,
    });
    throw error;
  }
}
