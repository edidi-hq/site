import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PLATFORM_ORIGIN, trimOrigin } from "@/lib/platform";
import { platformFetch } from "@/lib/platform-fetch";

const BYPASS_HEADER = "x-vercel-protection-bypass";
const platform = vi.fn();

function jsonResponse(status: number): Response {
  return new Response("{}", { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

function sentHeaders(): Headers {
  return platform.mock.calls[0]![1].headers as Headers;
}

beforeEach(() => {
  platform.mockReset().mockResolvedValue(jsonResponse(200));
  vi.stubGlobal("fetch", platform);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("platformFetch", () => {
  it("calls the platform origin and keeps the caller's headers", async () => {
    await platformFetch("/api/v1/public/pricing", { headers: { "Content-Type": "application/json" } });
    expect(platform.mock.calls[0]![0]).toBe(`${PLATFORM_ORIGIN}/api/v1/public/pricing`);
    expect(sentHeaders().get("content-type")).toBe("application/json");
    expect(sentHeaders().has(BYPASS_HEADER)).toBe(false);
  });

  it("adds the bypass secret on a preview build", async () => {
    vi.stubEnv("PLATFORM_BYPASS_SECRET", "preview-secret");
    vi.stubEnv("VERCEL_ENV", "preview");
    await platformFetch("/api/v1/public/trial/request", { method: "POST" });
    expect(sentHeaders().get(BYPASS_HEADER)).toBe("preview-secret");
  });

  it("never sends it from the production build, even when set", async () => {
    vi.stubEnv("PLATFORM_BYPASS_SECRET", "stray-secret");
    vi.stubEnv("VERCEL_ENV", "production");
    await platformFetch("/api/v1/public/trial/request", { method: "POST" });
    expect(sentHeaders().has(BYPASS_HEADER)).toBe(false);
  });
});

describe("platformFetch logging", () => {
  const PATH = "/api/v1/public/trial/verify";

  it("stays quiet for JSON answers, refusals included", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    platform.mockResolvedValueOnce(jsonResponse(200)).mockResolvedValueOnce(jsonResponse(404));
    await platformFetch(PATH, { method: "POST" });
    await platformFetch(PATH, { method: "POST" });
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("logs a reply the caller cannot read: not JSON, or a 5xx", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    platform
      .mockResolvedValueOnce(new Response("<html>", { status: 504, headers: { "content-type": "text/html" } }))
      .mockResolvedValueOnce(jsonResponse(500));
    await platformFetch(PATH, { method: "POST", body: JSON.stringify({ token: "secret-token" }) });
    await platformFetch(PATH, { method: "POST" });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]![1]).toMatchObject({ path: PATH, status: 504, contentType: "text/html" });
    expect(warn.mock.calls[1]![1]).toMatchObject({ status: 500, contentType: "application/json" });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-token");
  });

  it("logs a failed call by error name and rethrows it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    platform.mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"));
    await expect(platformFetch(PATH, { method: "POST" })).rejects.toThrow("timed out");
    expect(error.mock.calls[0]![1]).toMatchObject({ path: PATH, error: expect.stringMatching(/^TimeoutError/) });
    expect(typeof (error.mock.calls[0]![1] as { elapsedMs: unknown }).elapsedMs).toBe("number");
  });
});

describe("trimOrigin", () => {
  it("drops trailing slashes so a path is never joined with two", () => {
    expect(trimOrigin("https://app.example.com/")).toBe("https://app.example.com");
    expect(trimOrigin("https://app.example.com//")).toBe("https://app.example.com");
    expect(trimOrigin("https://app.example.com")).toBe("https://app.example.com");
  });
});
