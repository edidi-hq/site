import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { UNPROVABLE_CLAIM_WORDING, unprovableClaimViolations } from "@edidi-hq/core/brand/copy-guardrails";

/**
 * We advertise only what we can show. "Real-time", "instantly", "in seconds", a
 * guarantee or an absolute is a promise nobody has measured, so copy states the
 * measured figure or names the evidence instead (core `UNPROVABLE_CLAIM_WORDING`).
 * A use that IS honest stays only with its reason below, so every absolute on a
 * page has been looked at by a person.
 */

const SRC = join(process.cwd(), "src");

/** File → the exact phrase it may keep, and why. */
const ALLOWED: ReadonlyArray<{ file: string; phrase: string; reason: string }> = [
  {
    file: join("lib", "subprocessors.ts"),
    phrase: "real-time",
    reason: "describes WhatsApp as a messaging channel to a privacy reader; not a product promise",
  },
  {
    file: join("components", "product", "pages", "vault-module-page.tsx"),
    phrase: "guarantees",
    reason: "each record type's declared properties, checked against the enforcing code on every build",
  },
];

function copyFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(tsx?|json)$/.test(file))
    .filter((file) => !file.endsWith(".test.ts"));
}

describe("copy makes no unprovable absolute", () => {
  it("the detector catches the wording it exists to stop", () => {
    for (const claim of ["Real-time alerts", "Approved instantly", "Find it in seconds", "100% secure"]) {
      expect(unprovableClaimViolations(claim), claim).not.toEqual([]);
    }
  });

  it("the walk sees a known file", () => {
    expect(copyFiles()).toContain(join("components", "sections", "how-it-works.tsx"));
  });

  it("every absolute in the copy is allowlisted with a reason", () => {
    const offenders: string[] = [];
    for (const file of copyFiles()) {
      readFileSync(join(SRC, file), "utf8")
        .split("\n")
        .forEach((line, index) => {
          for (const rule of UNPROVABLE_CLAIM_WORDING) {
            const phrase = line.match(rule.pattern)?.[0];
            if (phrase === undefined) continue;
            const allowed = ALLOWED.some(
              (entry) => entry.file === file && entry.phrase.toLowerCase() === phrase.toLowerCase(),
            );
            if (!allowed) offenders.push(`${file}:${index + 1} ${rule.name} — "${phrase}"`);
          }
        });
    }
    expect(offenders, "state the measured figure or name the evidence:\n" + offenders.join("\n")).toEqual([]);
  });

  it("every allowlist entry still matches something (no stale exemptions)", () => {
    for (const entry of ALLOWED) {
      const source = readFileSync(join(SRC, entry.file), "utf8");
      expect(source.toLowerCase(), `${entry.file}: ${entry.reason}`).toContain(entry.phrase.toLowerCase());
    }
  });
});
