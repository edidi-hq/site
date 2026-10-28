import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
let requestHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));

import { onBehalfOfVisitorHeaders, visitorCountry } from "./visitor";

beforeEach(() => {
  requestHeaders = new Headers();
});

describe("the visitor, as Vercel tells this site", () => {
  it("reads the country, and nothing when Vercel cannot place the visitor", async () => {
    requestHeaders = new Headers({ "x-vercel-ip-country": "ke" });
    expect(await visitorCountry()).toBe("KE");
    requestHeaders = new Headers();
    expect(await visitorCountry()).toBeNull();
  });

  it("forwards the visitor's origin with this site's identity", async () => {
    requestHeaders = new Headers({
      "x-vercel-oidc-token": "identity",
      "x-forwarded-for": "102.89.1.7, 10.0.0.1",
      "x-vercel-ip-country": "NG",
      "x-vercel-ip-country-region": "LA",
    });
    expect(await onBehalfOfVisitorHeaders()).toEqual({
      "x-visitor-ip": "102.89.1.7",
      "x-visitor-country": "NG",
      "x-visitor-country-region": "LA",
      authorization: "Bearer identity",
    });
  });

  it("still forwards the origin without an identity, so the product can flag the missing token", async () => {
    requestHeaders = new Headers({ "x-forwarded-for": "102.89.1.7", "x-vercel-ip-country": "NG" });
    expect(await onBehalfOfVisitorHeaders()).toEqual({
      "x-visitor-ip": "102.89.1.7",
      "x-visitor-country": "NG",
    });
  });
});
