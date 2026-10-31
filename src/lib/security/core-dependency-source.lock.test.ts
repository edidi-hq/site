import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CORE_LOCKFILE_REPO,
  coreLockfileSourceViolations,
} from "@edidi-hq/core/security/core-dependency-source";

/**
 * The lockfile records core under the address CI and Vercel authenticate.
 *
 * Both fetch the private core repo by rewriting its SSH address to HTTPS with a
 * token. A core bump installed on a machine without its SSH key loaded makes
 * pnpm record a plain HTTPS address instead: it installs locally and every CI
 * install then fails with "could not read Username". That happened on the
 * v0.306.0 and v0.307.0 bumps. The rule and why live in core
 * (`security/core-dependency-source`); this applies it here. Without the key,
 * bump with git rewriting the SSH address for that command (core's RELEASING.md).
 */
const lockfile = readFileSync(join(process.cwd(), ".", "pnpm-lock.yaml"), "utf8");

describe("core's source in the lockfile", () => {
  it("reads the lockfile that records core (detector is live)", () => {
    expect(lockfile).toContain("edidi-hq/core.git");
    expect(coreLockfileSourceViolations(lockfile.replaceAll(CORE_LOCKFILE_REPO, "github.com/edidi-hq/core.git"))).not.toEqual([]);
  });

  it(`records core as ${CORE_LOCKFILE_REPO}`, () => {
    expect(coreLockfileSourceViolations(lockfile)).toEqual([]);
  });
});
