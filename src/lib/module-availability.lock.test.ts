import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MODULE_ORDER, isModulePublic, type ModuleKey } from "@/lib/brand";

/**
 * Plan inclusion must stay DERIVED. Two of the eight product module pages had
 * drifted against the platform while each carried its own hand-written
 * `planAvailability` array — one under-claiming Records on Starter, one
 * over-claiming Compliance on Starter. Deriving it fixed both; this test is
 * what stops the next person re-introducing the hardcode a page at a time.
 *
 * The failure mode is silent and customer-facing: nothing crashes, the page
 * renders, and the only symptom is a prospect being told the wrong thing about
 * what they are buying. There is no test that would otherwise catch it, because
 * a hardcoded array is perfectly valid TypeScript.
 */
const PAGES_DIR = "src/components/product/pages";

function modulePageFiles(): string[] {
  return readdirSync(join(process.cwd(), PAGES_DIR)).filter((f) =>
    f.endsWith("-module-page.tsx"),
  );
}

/**
 * A module's route file. A public module's lives in `src/app/product`; a
 * hidden one's lives in the git-ignored `unannounced/` folder, which only some
 * checkouts have — so a hidden module with no local copy is skipped (null),
 * while a public module with no route is a failure.
 */
function routeSource(moduleKey: ModuleKey): string | null {
  for (const root of ["src/app/product", "unannounced/src/app/product"]) {
    const file = join(process.cwd(), root, moduleKey, "page.tsx");
    if (existsSync(file)) return readFileSync(file, "utf8");
  }
  if (isModulePublic(moduleKey)) throw new Error(`public module ${moduleKey} has no route under src/app/product`);
  return null;
}

/** The routes this checkout can see, keyed by module. */
function moduleRoutes(): [ModuleKey, string][] {
  return MODULE_ORDER.flatMap((moduleKey) => {
    const source = routeSource(moduleKey);
    return source === null ? [] : [[moduleKey, source] as [ModuleKey, string]];
  });
}

describe("product module pages — plan availability stays derived", () => {
  it("finds the module pages at all (proves the scan can see a known case)", () => {
    // A negative result from a glob that matched nothing is not evidence.
    const files = modulePageFiles();
    expect(files.length).toBeGreaterThanOrEqual(8);
    expect(files).toContain("vault-module-page.tsx");
  });

  it("no page declares its own planAvailability array", () => {
    const offenders = modulePageFiles().filter((file) => {
      const source = readFileSync(join(process.cwd(), PAGES_DIR, file), "utf8");
      return /planAvailability:\s*\[/.test(source);
    });

    expect(
      offenders,
      `These pages hardcode plan inclusion instead of deriving it from the ` +
        `pricing API. Delete the array and let the route pass ` +
        `planAvailabilityFor(<moduleKey>, pricingData):\n` +
        offenders.map((f) => `  ${PAGES_DIR}/${f}`).join("\n"),
    ).toEqual([]);
  });

  it("every page takes the derived page data and hands it to the layout", () => {
    const missing = modulePageFiles().filter((file) => {
      const flat = readFileSync(join(process.cwd(), PAGES_DIR, file), "utf8").replace(/\s+/g, " ");
      return !/ModulePage\(data: ModulePageData\)/.test(flat) || !/<ProductModuleLayout [^>]*\{\.\.\.data\}/.test(flat);
    });
    expect(
      missing,
      `These pages neither receive ModulePageData nor pass it on:\n` +
        missing.map((f) => `  ${PAGES_DIR}/${f}`).join("\n"),
    ).toEqual([]);
  });

  it("every product route builds it from live pricing data", () => {
    // A page taking the prop is only half the wiring — the route must supply it
    // from the pricing API, not from a literal at the call site. Derived from the
    // module catalog, not listed here: a hardcoded expectation in the test that
    // polices hardcoding is the same bug wearing a lab coat.
    const unwired = moduleRoutes()
      .filter(([moduleKey, source]) => !source.includes(`modulePageData("${moduleKey}", pricingData)`))
      .map(([moduleKey]) => moduleKey);
    expect(unwired).toEqual([]);
  });

  it("no route writes plan availability inline", () => {
    // The route hands over modulePageData(); a literal list at the call site
    // would pass every other check here.
    const inline = moduleRoutes()
      .filter(([, source]) => /\bplanAvailability\s*[:=]/.test(source))
      .map(([moduleKey]) => moduleKey);
    expect(inline).toEqual([]);
  });

  it("every module route 404s when its module is hidden", () => {
    // The visibility flag is the one switch; a route that forgets to ask it is
    // served while every list hides it.
    const unguarded = moduleRoutes()
      .filter(([moduleKey, source]) => !source.includes(`notFoundUnlessPublic("${moduleKey}")`))
      .map(([moduleKey]) => moduleKey);
    expect(unguarded, "routes missing notFoundUnlessPublic(<their own key>)").toEqual([]);
  });

  it("every module route answers not-found without a production sign-off", () => {
    // No sign-off, no page (`@/lib/verified-claims`): the static switch alone
    // would serve a module nobody has checked works on production.
    const unsigned = moduleRoutes()
      .filter(([moduleKey, source]) => !source.includes(`notFoundUnlessSignedOff("${moduleKey}", pricingData)`))
      .map(([moduleKey]) => moduleKey);
    expect(unsigned, "routes missing notFoundUnlessSignedOff(<their own key>, pricingData)").toEqual([]);
  });
});
