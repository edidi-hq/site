import { describe, expect, it } from "vitest";

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Tracked sources only, so a scratch file never fails the run. */
function trackedComponents(): string[] {
  return execFileSync("git", ["ls-files", "src"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => file.endsWith(".tsx") && !file.includes(".test."));
}

/**
 * Every `<label>` names a box: it either points at one (`htmlFor`) or wraps it.
 *
 * A label that does neither looks right and works for nobody who cannot see it:
 * a screen reader announces the box with no name, and clicking the label does
 * not focus the box. The trial form's two "Other" boxes were named only by a
 * duplicate aria-label; its four choice headings were labels pointing at nothing
 * and are plain text now (each choice control carries its own name).
 *
 * Text that heads a GROUP of controls is not a label — use `<fieldset>` with a
 * `<legend>`, or a heading with `aria-labelledby` on the group.
 */

const CONTROL = /<(input|select|textarea|Input|Select|Textarea|Checkbox|Switch|RadioGroup|Combobox)\b/;

/** Each `<label …>` opening tag that neither points at nor wraps a control. */
function looseLabels(source: string): number[] {
  const lines: number[] = [];
  for (const match of source.matchAll(/<label\b([^>]*)>/g)) {
    const start = match.index ?? 0;
    const lineStart = source.lastIndexOf("\n", start) + 1;
    const linePrefix = source.slice(lineStart, start).trim();
    // Prose in a comment that mentions the tag.
    if (/^(\*|\/\/|\/\*)/.test(linePrefix)) continue;
    if (/\bhtmlFor\s*=/.test(match[1] ?? "")) continue;
    const close = source.indexOf("</label>", start);
    const inner = close === -1 ? "" : source.slice(start + match[0].length, close);
    if (CONTROL.test(inner)) continue;
    lines.push(source.slice(0, start).split("\n").length);
  }
  return lines;
}

describe("every label names its box", () => {
  it("no tracked component renders a label that points at nothing", () => {
    const offenders = trackedComponents().flatMap((file) =>
      looseLabels(readFileSync(file, "utf8")).map((line) => `${file}:${line}`),
    );
    expect(
      offenders,
      offenders.length
        ? "These labels are not linked to a box. Use <Field label=…>, or give the " +
            "label htmlFor and the box the same id (useId):\n" +
            offenders.map((offender) => `  - ${offender}`).join("\n")
        : undefined,
    ).toEqual([]);
  });

  it("detects the shape it forbids, and lets the linked shapes through", () => {
    // A clean run above only means something if the scan fires here.
    expect(looseLabels(`<label className="x">{t("name")}</label>\n<input />`)).toEqual([1]);
    expect(looseLabels(`<label htmlFor={nameId}>{t("name")}</label>`)).toEqual([]);
    expect(looseLabels(`<label className="x"><input type="checkbox" /> {t("x")}</label>`)).toEqual(
      [],
    );
    expect(looseLabels(` * a \`<label>\` that points at nothing`)).toEqual([]);
    expect(looseLabels(`  /** The name when no \`<label>\` points at it. */`)).toEqual([]);
  });
});
