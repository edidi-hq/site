"use client";

/**
 * ChoiceGroup — a single-select control rendered as tappable chips or icon
 * cards instead of a native <select>. Converts a dropdown (a "what's in here?"
 * question) into visible options with a sensible default already lit
 * (smart defaults + easy-question framing).
 *
 * Restrained navy/gold, not the bubbly reference aesthetic. Renders a proper
 * ARIA radiogroup with roving-tabindex arrow-key navigation, plus a hidden
 * input so the value posts with the surrounding <form>/server action.
 *
 * Without a `name` it is a VIEW choice, not a form field (the pricing section's
 * billing period and currency): no hidden input and no no-script fallback —
 * with JavaScript off it is simply not shown, and the page keeps its defaults.
 */

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { JS_ONLY } from "@/lib/no-script";
import { NoScriptSelect } from "./no-script-select";
import { cssTransition } from "@/lib/animations";


export interface ChoiceOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Small honest marker, e.g. "Most common". */
  badge?: string;
  /** "segmented" only: shown in gold when selected (an offer, e.g. annual billing), navy otherwise. */
  emphasis?: boolean;
}

interface ChoiceGroupProps {
  /** The posted field. Omit for a view choice (see above). */
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly ChoiceOption[];
  ariaLabel: string;
  /**
   * "chips" (pills) and "cards" (a grid) are answers; "underline" is a quieter
   * secondary row of plain text, the selected one underlined — for a choice
   * nested under another choice group, so the two rows never look alike.
   */
  variant?: "chips" | "cards" | "underline" | "segmented";
  /** Grid columns for the "cards" variant. */
  columns?: number;
  invalid?: boolean;
  /** Space-separated ids of the error or hint text describing the group. */
  describedBy?: string;
  /**
   * For a group that navigates rather than posts (e.g. page tabs outside any
   * form): each option's URL. With JavaScript off the group then renders as
   * links to them; otherwise it falls back to a native <select> that posts.
   */
  hrefFor?: (value: string) => string;
  /** The empty first choice of the no-script select when nothing is picked yet. */
  noScriptPlaceholder?: string;
}

/** An underline option's look: text, with a gold rule under the selected one. */
function underlineOptionStyle(selected: boolean): React.CSSProperties {
  return {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    height: "34px",
    padding: "0 10px",
    fontSize: "var(--text-sm)",
    fontWeight: selected ? 600 : 500,
    color: selected ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: `2px solid ${selected ? "var(--color-gold)" : "transparent"}`,
    borderRadius: 0,
    transition: cssTransition(["border-color", "color"]),
  };
}

/** A segmented option's look: one segment of a bordered bar, filled when selected. */
function segmentedOptionStyle(selected: boolean, emphasis: boolean): React.CSSProperties {
  return {
    cursor: "pointer",
    padding: "8px 18px",
    fontSize: "var(--text-md)",
    fontWeight: 500,
    border: "none",
    borderRadius: "var(--radius-md)",
    backgroundColor: selected
      ? emphasis
        ? "var(--color-gold)"
        : "var(--color-navy-primary)"
      : "transparent",
    color: selected
      ? emphasis
        ? "var(--color-navy-primary)"
        : "var(--color-white)"
      : "var(--color-text-muted)",
    transition: cssTransition(["background-color", "color"]),
  };
}

/** One option's look, shared by the buttons and the no-script links. */
function optionStyle({
  selected,
  invalid,
  isCards,
  hasIcons,
}: {
  selected: boolean;
  invalid: boolean;
  isCards: boolean;
  hasIcons: boolean;
}): React.CSSProperties {
  return {
    position: "relative",
    cursor: "pointer",
    textAlign: "center",
    display: isCards ? "flex" : "inline-flex",
    flexDirection: isCards ? "column" : "row",
    alignItems: "center",
    justifyContent: "center",
    // Chips grow to fill the row rather than clustering at the left.
    flex: isCards ? undefined : "1 1 auto",
    gap: isCards ? "8px" : "0",
    padding: isCards ? (hasIcons ? "16px 10px" : "13px 14px") : "0 16px",
    height: isCards ? "auto" : "40px",
    minHeight: isCards ? (hasIcons ? "88px" : "48px") : undefined,
    fontSize: "var(--text-md)",
    fontWeight: selected ? 600 : 500,
    color: selected ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    backgroundColor: selected ? "var(--color-gold-ghost)" : "var(--color-white)",
    border: `1px solid ${
      selected
        ? "var(--color-gold)"
        : invalid
          ? "var(--color-danger-invalid)"
          : "var(--color-border)"
    }`,
    borderRadius: isCards ? "var(--radius-lg)" : "var(--radius-pill)",
    boxShadow: selected ? "0 0 0 3px var(--color-gold-tint)" : "none",
    transition: cssTransition(["border-color", "background-color", "box-shadow"]),
  };
}

/** The row (chips, underline) or grid (cards) the options sit in. */
function groupStyle(
  variant: "chips" | "cards" | "underline" | "segmented",
  columns: number,
): React.CSSProperties {
  if (variant === "segmented") {
    return {
      display: "inline-flex",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-card)",
      padding: "4px",
    };
  }
  if (variant === "cards") {
    return { display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: "10px" };
  }
  if (variant === "underline") {
    return { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 6px" };
  }
  return { display: "flex", flexWrap: "wrap", gap: "8px" };
}

export function ChoiceGroup({
  name,
  value,
  onChange,
  options,
  ariaLabel,
  variant = "chips",
  columns = 3,
  invalid = false,
  describedBy,
  hrefFor,
  noScriptPlaceholder,
}: ChoiceGroupProps) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isCards = variant === "cards";
  const isUnderline = variant === "underline";
  const isSegmented = variant === "segmented";
  const hasIcons = options.some((o) => o.icon);
  const styleFor = (
    selected: boolean,
    optionInvalid: boolean,
    optionHasIcons: boolean,
    emphasis = false,
  ) =>
    isSegmented
      ? segmentedOptionStyle(selected, emphasis)
      : isUnderline
        ? underlineOptionStyle(selected)
        : optionStyle({ selected, invalid: optionInvalid, isCards, hasIcons: optionHasIcons });
  // The resting edge colour a hovered option returns to.
  const restingBorder = isUnderline || isSegmented
    ? "transparent"
    : invalid
      ? "var(--color-danger-invalid)"
      : "var(--color-border)";

  const move = (from: number, dir: 1 | -1) => {
    const next = (from + dir + options.length) % options.length;
    onChange(options[next]!.value);
    btnRefs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(i, -1);
    }
  };

  return (
    <>
    {hrefFor ? (
      <noscript>
        <nav aria-label={ariaLabel} style={groupStyle(variant, columns)}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <a
                key={option.value}
                href={hrefFor(option.value)}
                aria-current={selected ? "page" : undefined}
                style={{
                  ...styleFor(selected, false, false),
                  textDecoration: "none",
                }}
              >
                {option.label}
              </a>
            );
          })}
        </nav>
      </noscript>
    ) : name === undefined ? null : (
      <NoScriptSelect
        name={name}
        value={value}
        options={options}
        ariaLabel={ariaLabel}
        placeholder={value ? undefined : noScriptPlaceholder ?? "Select…"}
      />
    )}
    <div
      {...JS_ONLY}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      style={groupStyle(variant, columns)}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        const tabIndex = selected || (!value && i === 0) ? 0 : -1;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={tabIndex}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            style={styleFor(selected, invalid, hasIcons, opt.emphasis)}
            onMouseEnter={(e) => {
              if (!selected && !isSegmented) {
                e.currentTarget.style.borderColor = "var(--color-border-strong)";
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.borderColor = restingBorder;
            }}
          >
            {Icon && (
              <Icon
                size={isCards ? 20 : 16}
                strokeWidth={1.8}
                color={selected ? "var(--color-gold-on-light)" : "var(--color-text-muted)"}
                aria-hidden="true"
              />
            )}
            <span>{opt.label}</span>
            {opt.badge && (
              <span
                style={{
                  position: "absolute",
                  top: isCards ? "6px" : "-9px",
                  right: isCards ? "6px" : "8px",
                  fontSize: "var(--text-4xs)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--color-gold-on-light)",
                  backgroundColor: "var(--color-gold-surface)",
                  border: "1px solid var(--color-gold-border)",
                  borderRadius: "var(--radius-pill)",
                  padding: "1px 6px",
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                }}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
      {name === undefined ? null : <input type="hidden" name={name} value={value} />}
    </div>
    </>
  );
}
