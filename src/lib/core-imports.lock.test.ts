import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The site takes small slices of `@edidi-hq/core`, never the whole package:
 * most subpaths need peer dependencies this repo does not install (database,
 * auth, cloud SDKs), and importing one breaks the build or the bundle.
 *
 * Runtime code — everything under `src/`, plus `next.config.ts`, which Node
 * loads at build and at start, so the same peer rules apply — may import:
 *   - `brand` — the wordmark, fonts and BRAND constants.
 *   - `region/countries` — type-only imports, no peers.
 *   - `security/rate-limit` and `security/rate-limit-tiers` — the shared
 *     limiter for the four Server Actions. Their import graph needs only
 *     `@upstash/redis`, which the site installs.
 *     Admitted module by module, not as `security/*`: the rest of that folder
 *     pulls in peers the site does not carry.
 *   - `billing/trial-deadlines`, `billing/capacity`, `billing/catalog` and
 *     `billing/limit-format` — the trial's terms, the plan catalogue and the
 *     byte formatter. Pure data and `Intl`; their value imports reach only
 *     `modules/catalog`, `entitlements/dimensions`, `dates/durations` and
 *     `locales`, none of which import a package.
 *   - `money/format` + `money/types` — core's one money formatter, so a price
 *     prints the way the product prints it. `Intl` and `locales` only.
 *   - `billing/features` — `SERVICE_COMMITMENT_KEYS` for the comparison table's
 *     service group (server-side, in `fetchPricingData`). Reaches only
 *     `modules/catalog`; its `db/schema` and role imports are type-only.
 *   - `billing/platform-tax` + `region/sales-tax` — whether tax is added on top
 *     of a naira price (only where core lists a registration) and at what rate.
 *     A small rate table; country types are type-only imports.
 *   - `billing/reserved-mail-domain` — the trial form refuses an address that
 *     can never receive mail, by the rule core shares with the app and console. No imports.
 *   - `locales` — the product's interface languages, named in the site's copy.
 *     No imports.
 *   - `sectors` — the industry list the trial form offers, and the rule the app
 *     validates a submitted industry with. Its only import is type-only.
 *   - `modules/catalog` — each module's name, short name, suite and maturity,
 *     which `brand.ts` reads instead of re-typing them. Its only import is type-only.
 *   - `region/iso-3166`, `domains/public-email` and `trial/request-terms` —
 *     the country codes, personal-mailbox list (and its
 *     dependency-free form hint), the trial request's bounds, size bands and
 *     link lifetime, shared with the app's API. No package imports.
 *   - `region/visitor-origin` — the headers a trial call forwards the visitor's
 *     IP and location in, and their parsing, shared with the app that reads
 *     them. Server-only; its one import is `node:net` plus `region/iso-3166`.
 *   - `billing/retention` — the statutory record-retention floor a page states
 *     (the platform floor or the country's own, whichever is longer). Reaches
 *     only `region/countries` and its own floor constant.
 *   - `ui/card-grid` + `ui/card-grid.css` — card rows that fill the width at any
 *     count, the same rule the product apps use. No imports; the stylesheet is
 *     pulled into `globals.css`, which is why `.css` files are scanned too.
 * Tests may additionally import dependency-free modules that back parity locks
 * (`brand/copy-guardrails` has no imports at all; it backs the record-keeping lock).
 * The pricing-fallback generator (run by `scripts/generate-pricing-fallback.mjs`
 * at build time and by its test; never imported by a page) may also read
 * `billing/retention`, `modules/catalog` and `sectors` (all runtime-allowed above); so may
 * tests, which check the generator's output against core.
 *
 * The last test below walks each allowed subpath's VALUE import graph inside
 * core and fails on any package the site does not install, so admitting a
 * subpath is checked, not just asserted in this comment.
 */
const RUNTIME_ALLOWED = new Set([
  "brand",
  "region/countries",
  "region/visitor-origin",
  "security/rate-limit",
  "security/rate-limit-tiers",
  "billing/trial-deadlines",
  "billing/capacity",
  "billing/catalog",
  "billing/limit-format",
  "money/format",
  "money/types",
  "billing/features",
  "billing/platform-tax",
  "region/sales-tax",
  "billing/reserved-mail-domain",
  "locales",
  "sectors",
  "modules/catalog",
  "ui/card-grid",
  "ui/card-grid.css",
  "billing/retention",
  "region/iso-3166",
  "domains/public-email",
  "trial/request-terms",
]);
const BUILD_FILES = new Set([join("lib", "pricing-fallback-build.ts"), join("data", "plan-copy.ts")]);
const BUILD_ONLY_ALLOWED = new Set<string>([]);
const TEST_ONLY_ALLOWED = new Set([
  "security/dependency-floors",
  "brand/copy-guardrails",
  // The shared "brand / host never typed" detector and comment stripper; needs only
  // `typescript`, which the site installs.
  "brand/typed-brand",
]);

const SRC = join(process.cwd(), "src");
/** Runtime files outside `src/`, checked against `RUNTIME_ALLOWED` too. */
const ROOT_RUNTIME_FILES = ["next.config.ts"];
// This file's own detector fixtures name disallowed subpaths on purpose.
const SELF = join("lib", "core-imports.lock.test.ts");
const CORE_IMPORT = /(?:from\s+|import\s*\(\s*|import\s+)["']@edidi-hq\/core(?:\/([^"']+))?["']/g;

function sourceFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(tsx?|mjs|css)$/.test(file))
    .filter((file) => file !== SELF);
}

/** Core subpaths `text` imports; "" for the package root. */
function coreSubpaths(text: string): string[] {
  return [...text.matchAll(CORE_IMPORT)].map((match) => match[1] ?? "");
}

describe("core imports stay inside the site's allowlist", () => {
  it("the detector finds static, dynamic and side-effect imports", () => {
    expect(coreSubpaths('import { BRAND } from "@edidi-hq/core/brand";')).toEqual(["brand"]);
    expect(coreSubpaths('await import("@edidi-hq/core/db/rls")')).toEqual(["db/rls"]);
    expect(coreSubpaths('import "@edidi-hq/core";')).toEqual([""]);
    expect(coreSubpaths('// see @edidi-hq/core/brand')).toEqual([]);
  });

  it("scans the site (proves the walk sees a known importer)", () => {
    const brand = join("lib", "brand.ts");
    expect(sourceFiles()).toContain(brand);
    expect(coreSubpaths(readFileSync(join(SRC, brand), "utf8"))).toContain("brand");
  });

  it("scans next.config.ts too (proves the root file is read)", () => {
    expect(readFileSync(join(process.cwd(), "next.config.ts"), "utf8")).toContain("Content-Security-Policy");
  });

  it("no file imports a core subpath outside its allowlist", () => {
    const rootOffenders = ROOT_RUNTIME_FILES.flatMap((file) =>
      coreSubpaths(readFileSync(join(process.cwd(), file), "utf8"))
        .filter((subpath) => !RUNTIME_ALLOWED.has(subpath))
        .map((subpath) => `${file}  @edidi-hq/core/${subpath}`),
    );
    const sourceOffenders = sourceFiles().flatMap((file) => {
      // test-support/ holds helpers only tests import (nothing ships them).
      const isTest = /\.test\.tsx?$/.test(file) || /(^|[\\/])test-support[\\/]/.test(file);
      return coreSubpaths(readFileSync(join(SRC, file), "utf8"))
        .filter((subpath) => !RUNTIME_ALLOWED.has(subpath))
        .filter((subpath) => !(isTest && (TEST_ONLY_ALLOWED.has(subpath) || BUILD_ONLY_ALLOWED.has(subpath))))
        .filter((subpath) => !(BUILD_FILES.has(file) && BUILD_ONLY_ALLOWED.has(subpath)))
        .map((subpath) => `src/${file}  @edidi-hq/core/${subpath}`);
    });
    const offenders = [...rootOffenders, ...sourceOffenders];
    expect(
      offenders,
      "Check the subpath's import graph for peers the site does not install, then extend the " +
        "allowlist here and in AGENTS.md together.\n" +
        offenders.join("\n"),
    ).toEqual([]);
  });
});

/* ── The allowed subpaths' own import graphs ─────────────────────── */

const CORE_ROOT = join(process.cwd(), "node_modules", "@edidi-hq", "core");
const SITE_PACKAGES = (() => {
  const manifest = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
  return new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})]);
})();

/** The file an `@edidi-hq/core/<subpath>` import resolves to, via the package's `exports`. */
function coreEntryFile(subpath: string): string {
  const exportsMap: Record<string, string> = JSON.parse(
    readFileSync(join(CORE_ROOT, "package.json"), "utf8"),
  ).exports;
  const exact = exportsMap[`./${subpath}`];
  if (exact) return join(CORE_ROOT, exact);
  for (const [pattern, target] of Object.entries(exportsMap)) {
    if (!pattern.endsWith("/*")) continue;
    const prefix = pattern.slice(2, -1);
    if (subpath.startsWith(prefix)) return join(CORE_ROOT, target.replace("*", subpath.slice(prefix.length)));
  }
  throw new Error(`@edidi-hq/core/${subpath} is not exported`);
}

/** Specifiers a file imports for their VALUE (`import type` / `export type` are erased). */
const VALUE_IMPORT = /^\s*(?:import|export)\s+(?!type\s)(?:[^;]*?\sfrom\s+)?["']([^"']+)["']/gm;

function packagesReachedFrom(entry: string): string[] {
  const seen = new Set<string>();
  const packages = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier] of readFileSync(file, "utf8").matchAll(VALUE_IMPORT)) {
      if (specifier!.startsWith(".")) {
        const base = join(dirname(file), specifier!);
        const candidates = [`${base}.ts`, join(base, "index.ts"), base];
        const resolved = candidates.find((candidate) => {
          try {
            return readFileSync(candidate) !== undefined;
          } catch {
            return false;
          }
        });
        if (!resolved) throw new Error(`cannot resolve ${specifier} from ${file}`);
        pending.push(resolved);
      } else if (!specifier!.startsWith("node:")) {
        const parts = specifier!.split("/");
        packages.add(specifier!.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!);
      }
    }
  }
  return [...packages];
}

describe("every allowed core subpath reaches only packages the site installs", () => {
  it("the walk sees a known package import (proves it reads value imports)", () => {
    expect(packagesReachedFrom(coreEntryFile("security/rate-limit"))).toContain("@upstash/redis");
  });

  it("the walk skips type-only imports (they are erased at build)", () => {
    expect(VALUE_IMPORT.test('import type { Foo } from "drizzle-orm";')).toBe(false);
    VALUE_IMPORT.lastIndex = 0;
  });

  it.each([...RUNTIME_ALLOWED, ...BUILD_ONLY_ALLOWED, ...TEST_ONLY_ALLOWED])("%s", (subpath) => {
    const missing = packagesReachedFrom(coreEntryFile(subpath)).filter(
      (name) => !SITE_PACKAGES.has(name),
    );
    expect(missing, `@edidi-hq/core/${subpath} needs packages the site does not install`).toEqual([]);
  });
});

describe("brand values come through the site's re-export", () => {
  it("only brand.ts imports @edidi-hq/core/brand", () => {
    // brand.ts is where the site adds its own view (modules, suites) on top of
    // core's brand; a file importing core directly skips it and splits the import graph.
    const importers = sourceFiles()
      .filter((file) => !/\.test\.tsx?$/.test(file) && file !== join("lib", "brand.ts"))
      .filter((file) => coreSubpaths(readFileSync(join(SRC, file), "utf8")).includes("brand"));
    expect(importers, 'import from "@/lib/brand"').toEqual([]);
  });
});

describe("build-only modules stay out of the pages", () => {
  it("no runtime file imports the fallback generator or the plan copy", () => {
    const importers = sourceFiles()
      .filter((file) => !/\.test\.tsx?$/.test(file) && !BUILD_FILES.has(file))
      .filter((file) =>
        /from\s+["'](?:@\/lib\/pricing-fallback-build|@\/data\/plan-copy|\.{1,2}\/[^"']*(?:pricing-fallback-build|plan-copy))["']/.test(
          readFileSync(join(SRC, file), "utf8"),
        ),
      );
    expect(importers).toEqual([]);
  });
});
