import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Opening a magic link must not spend it: email link scanners open links
 * before the person does. The page (GET) only renders a confirm button; the
 * token is spent by the button's Server Action (POST). Both halves are driven
 * here with the platform mocked.
 */

vi.mock("server-only", () => ({}));
vi.mock("@/lib/visitor", () => ({ onBehalfOfVisitorHeaders: async () => ({}) }));
const platformFetch = vi.fn();
vi.mock("@/lib/platform-fetch", () => ({ platformFetch: (...args: unknown[]) => platformFetch(...args) }));
const redirect = vi.fn((target: string) => {
  throw new Error(`NEXT_REDIRECT ${target}`);
});
vi.mock("next/navigation", () => ({ redirect: (target: string) => redirect(target) }));
vi.mock("@/components/layout/navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/layout/footer", () => ({ Footer: () => null }));

import VerifyPage from "./page";
import { VerifyConfirm, VerifyResult } from "./client";
import { confirmTrialVerification } from "../../actions";
import { INITIAL_VERIFY_STATE, VERIFY_INCOMPLETE_MESSAGE, VERIFY_RETRY_MESSAGE } from "./state";
import { PLATFORM_ORIGIN } from "@/lib/platform";

const TOKEN = "test-token-aaaaaaaaaaaaaaaaaaaaaaaa";

function respond(status: number, body: unknown) {
  platformFetch.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

function confirm(token = TOKEN) {
  const formData = new FormData();
  formData.set("token", token);
  return confirmTrialVerification(INITIAL_VERIFY_STATE, formData);
}

/** Every element in a rendered tree (server component output, not rendered further). */
function elements(node: ReactNode): ReactElement[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement(node)) return [];
  const props = node.props as { children?: ReactNode };
  return [node, ...elements(props.children)];
}

beforeEach(() => {
  platformFetch.mockReset();
  redirect.mockClear();
});

describe("the verify page (GET)", () => {
  it("renders the confirm button and makes no platform call", async () => {
    const tree = await VerifyPage({ params: Promise.resolve({ token: TOKEN }) });
    expect(platformFetch).not.toHaveBeenCalled();
    const confirmCard = elements(tree).find((element) => element.type === VerifyConfirm);
    expect(confirmCard?.props).toEqual({ token: TOKEN });
  });

  it("shows the not-found card for an over-long token, without a platform call", async () => {
    const tree = await VerifyPage({ params: Promise.resolve({ token: "a".repeat(101) }) });
    expect(platformFetch).not.toHaveBeenCalled();
    expect(elements(tree).some((element) => element.type === VerifyResult)).toBe(true);
    expect(elements(tree).some((element) => element.type === VerifyConfirm)).toBe(false);
  });
});

describe("the result card", () => {
  const retry = { action: vi.fn(), pending: false };
  const html = (status: string, message: string) =>
    renderToStaticMarkup(createElement(VerifyResult, { status, message, token: TOKEN, retry }));

  it("offers to press again after an error, with the same token", () => {
    const markup = html("error", VERIFY_RETRY_MESSAGE);
    expect(markup).toContain("Try again");
    expect(markup).toContain(`name="token" value="${TOKEN}"`);
    expect(markup).toContain(VERIFY_RETRY_MESSAGE.replace("couldn't", "couldn&#x27;t"));
  });

  it("shows no retry for a link the platform does not know", () => {
    expect(html("not_found", "That link is not valid.")).not.toContain("Try again");
  });

  it("never repeats the title as the message", () => {
    expect(VERIFY_RETRY_MESSAGE).not.toBe("We couldn't verify this link.");
    expect(VERIFY_INCOMPLETE_MESSAGE).not.toBe("We couldn't verify this link.");
  });
});

describe("confirmTrialVerification (the button, POST)", () => {
  it("spends the token and redirects to an invite on the platform origin", async () => {
    const invite = `${new URL(PLATFORM_ORIGIN).origin}/invite/abc`;
    respond(200, { status: "provisioned", inviteUrl: invite });
    await expect(confirm()).rejects.toThrow("NEXT_REDIRECT");
    expect(platformFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(platformFetch.mock.calls[0]![1].body)).toEqual({ token: TOKEN });
    expect(redirect).toHaveBeenCalledWith(invite);
  });

  it("never redirects off the platform origin, and logs the origin only", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    respond(200, { status: "provisioned", inviteUrl: "https://evil.example/invite/one-time-token" });
    expect(await confirm()).toEqual({ status: "error", message: VERIFY_RETRY_MESSAGE });
    expect(redirect).not.toHaveBeenCalled();
    expect(logged.mock.calls[0]![1]).toEqual({ origin: "https://evil.example" });
    expect(JSON.stringify(logged.mock.calls)).not.toContain("one-time-token");
    logged.mockRestore();
  });

  it("treats a success with no link to follow as a retry, not a success line", async () => {
    const logged = vi.spyOn(console, "warn").mockImplementation(() => {});
    respond(200, { status: "provisioned", message: "Your workspace is ready." });
    expect(await confirm()).toEqual({ status: "error", message: VERIFY_RETRY_MESSAGE });
    expect(logged.mock.calls[0]![1]).toEqual({ status: 200, answer: "provisioned" });
    logged.mockRestore();
  });

  it("logs an answer that carries no reason, and offers a retry", async () => {
    const logged = vi.spyOn(console, "warn").mockImplementation(() => {});
    respond(502, {});
    expect(await confirm()).toEqual({ status: "error", message: VERIFY_RETRY_MESSAGE });
    expect(logged.mock.calls[0]![1]).toEqual({ status: 502, answer: "none" });
    logged.mockRestore();
  });

  it("hands back the platform's answer for an expired link", async () => {
    respond(410, { status: "expired", message: "This link has expired." });
    expect(await confirm()).toEqual({ status: "expired", message: "This link has expired." });
  });

  it("answers an unreachable platform with the error state instead of throwing", async () => {
    platformFetch.mockRejectedValue(new TypeError("fetch failed"));
    expect(await confirm()).toEqual({ status: "error", message: VERIFY_RETRY_MESSAGE });
  });

  it("never forwards an over-long token", async () => {
    expect(await confirm("a".repeat(101))).toEqual({ status: "not_found", message: VERIFY_INCOMPLETE_MESSAGE });
    expect(platformFetch).not.toHaveBeenCalled();
  });
});
