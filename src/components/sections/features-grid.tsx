"use client";

import { MODULE_STATUS_CHIP } from "@/lib/module-status-styles";
import { m } from "framer-motion";
import { fadeUpOnScroll, cssTransition } from "@/lib/animations";
import { SectionIntro } from "@/components/ui/section-intro";
import {
  BRAND,
  MODULE_STATUS_LABELS,
  MODULES,
  moduleName,
  type ModuleKey,
} from "@/lib/brand";
import { MODULE_COPY } from "@/lib/module-copy";
import { cardGridProps } from "@/lib/card-grid";
import { Z_INDEX } from "@/lib/layers";

/** `moduleKeys`: the advertised modules (`advertisedModuleKeys`), read on the server. */
export function FeaturesGrid({ moduleKeys }: { moduleKeys: readonly ModuleKey[] }) {
  // Nothing signed off yet: no heading over an empty grid.
  if (moduleKeys.length === 0) return null;
  return (
    <section style={{ backgroundColor: "var(--color-white)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
      <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", position: "relative", zIndex: Z_INDEX.raised }}>
        <SectionIntro
          align="center"
          eyebrow="THE PLATFORM"
          eyebrowStyle={{ marginBottom: "16px" }}
          title="One approval engine. Every operational process."
          titleStyle={{
            fontWeight: 400,
            fontSize: "var(--text-display-xs)",
            lineHeight: 1.3,
            margin: "0 auto 12px",
          }}
          titleClassName="lg:!text-display-lg"
          lede={
            <>
              {BRAND.name} is built as a suite of interconnected modules — each solving a
              distinct operational challenge, all working together on one shared
              approval engine. For any organisation. In any industry.
            </>
          }
          ledeStyle={{
            fontWeight: 400,
            fontSize: "var(--text-xl)",
            lineHeight: 1.7,
            margin: "0 auto 40px",
            maxWidth: "var(--measure)",
          }}
        />

        <div {...cardGridProps(moduleKeys.length, { min: "22rem" }, { gap: "20px" })}>
          {moduleKeys.map((moduleKey, i) => {
            const { icon: Icon, tagline, summary } = MODULE_COPY[moduleKey];
            const { status } = MODULES[moduleKey];
            const badge = MODULE_STATUS_CHIP.light[status];
            return (
              <m.div
                key={moduleKey}
                {...fadeUpOnScroll(i + 3)}
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-card)",
                  padding: "24px",
                  transition:
                    cssTransition(["box-shadow", "border-left"]),
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(var(--color-shadow-rgb), 0.08)";
                  e.currentTarget.style.borderLeft = "3px solid var(--color-gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderLeft = "1px solid var(--color-border)";
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-card)",
                    backgroundColor: "var(--color-navy-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    color="var(--color-gold)"
                    aria-hidden="true"
                  />
                </div>
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "var(--text-xl)",
                    color: "var(--color-text-primary)",
                    margin: "0 0 4px",
                  }}
                >
                  {moduleName(moduleKey)}
                </h3>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: "var(--text-xs)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  {tagline}
                </span>
                <p
                  style={{
                    fontWeight: 400,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {summary}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "16px",
                    fontSize: "var(--text-2xs)",
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: "var(--radius-badge)",
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: badge.border,
                  }}
                >
                  {MODULE_STATUS_LABELS[status]}
                </span>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
