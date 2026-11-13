"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { isMobileViewport } from "@/lib/hooks/use-is-mobile";
import { isReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { DarkHeroBackdrop } from "@/components/ui/dark-hero-backdrop";
import { SectionIntro } from "@/components/ui/section-intro";
import { MOTION_DURATION, cssTransition, fadeUpOnScroll } from "@/lib/animations";
import { Zap, Smartphone, Lock, Globe } from "lucide-react";
import { APPROVAL_LIFECYCLE, type LifecycleStageKey } from "@/lib/approval-lifecycle";
import { capitalisedNumberInWords } from "@/lib/number-words";
import { STAGE_MOCKUPS } from "@/components/product/stage-mockups";
import { BrowserFrame, appCaption } from "@/components/product/previews/preview-primitives";
import { Z_INDEX } from "@/lib/layers";
import { cardGridProps } from "@/lib/card-grid";
import { BRAND } from "@/lib/brand";

/**
 * The homepage's own words for each lifecycle stage. The stages — titles,
 * order and count — come from `APPROVAL_LIFECYCLE`, and the drawing for each
 * from `STAGE_MOCKUPS`, the same one /product/how-it-works shows.
 */
const STAGE_BODY: Record<LifecycleStageKey, string> = {
  submit:
    `Any team member raises a request directly in ${BRAND.name} — payment voucher, purchase order, or any operational approval. They complete a structured form, attach supporting documents, and submit. The request enters the defined approval chain immediately — no emails, no chasing, no ambiguity about where it goes next.`,
  review:
    "The right person is notified as it reaches their step — via the platform, email, WhatsApp, or SMS. They review the complete request and approve, query, or return it with a single action from any device, anywhere in the world. Decision makers are never a bottleneck because they are never out of reach.",
  sanction:
    "Final authority signs it off. The Managing Director sees every approval collected along the way and sanctions with a saved signature, stamped onto every document the request produces. Authority becomes binding — and the record shows exactly who gave it.",
  record:
    `The moment a decision is made, ${BRAND.name} creates a complete, timestamped, tamper-evident record. Supporting documents are generated automatically. Every action is permanently attributed to a person, a time, and a decision. Your organisation builds institutional memory with every transaction — across every department, every team, every location.`,
};

const FEATURES = [
  { icon: Zap, label: "Notified at every step" },
  { icon: Smartphone, label: "Approve from any device" },
  { icon: Lock, label: "Tamper-evident records" },
  { icon: Globe, label: "Works across any location" },
];

/* ── Main section ──────────────────────────────────────── */

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const activeStage = APPROVAL_LIFECYCLE[active]!;
  const { Mockup: ActiveMockup, previewPath } = STAGE_MOCKUPS[activeStage.key];

  // Auto-advance through steps every 6s. Pauses permanently once the user
  // clicks a step number (so the page doesn't fight their intent). Also
  // respects `prefers-reduced-motion`.
  useEffect(() => {
    if (!autoAdvance) return;
    // Skip auto-advance on mobile — same reasoning as the hero demo.
    if (isReducedMotion() || isMobileViewport()) return;

    const timer = setInterval(() => {
      setActive((i) => (i + 1) % APPROVAL_LIFECYCLE.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoAdvance]);

  function selectStep(i: number) {
    setActive(i);
    setAutoAdvance(false);
  }

  return (
    <section
      id="how-it-works"
      style={{
        backgroundColor: "var(--color-navy-primary)",
        padding: "120px 40px",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Ambient background layers */}
      <DarkHeroBackdrop glows="closing" />

      <div
        style={{
          maxWidth: "var(--layout-max-width)",
          margin: "0 auto",
          position: "relative",
          zIndex: Z_INDEX.content,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "48px",
            alignItems: "flex-start",
            width: "100%",
          }}
          className="lg:!flex-row lg:!items-center"
        >
          {/* ── Left Panel ──────────────────────────────────── */}
          <div className="w-full lg:flex-1">
            {/* ── Header ──────────────────────────────────── */}
            <SectionIntro
              surface="dark"
              eyebrow="HOW IT WORKS"
              eyebrowStyle={{ marginBottom: "16px" }}
              title={<>{capitalisedNumberInWords(APPROVAL_LIFECYCLE.length)} steps. Zero paper. Complete record.</>}
              titleStyle={{
                fontWeight: 400,
                fontSize: "var(--text-heading-md)",
                lineHeight: 1.2,
                margin: "0 0 16px",
                maxWidth: "var(--measure-snug)",
              }}
              titleClassName="lg:!text-display-lg"
            />

            {/* Left — Text. Reserved height so the mode="wait" swap (old
                paragraph unmounts before the new one mounts) can't collapse the
                block to zero and jump the step selector below it. Sized to the
                tallest body: ~204px on mobile (narrower wrap), ~128px on lg. */}
            <div className="min-h-[204px] lg:min-h-[128px]">
              <AnimatePresence mode="wait">
                <m.div
                  key={`text-${active}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: MOTION_DURATION.slow }}
                >
                <p
                  style={{
                    fontWeight: 400,
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: "var(--measure-tight)",
                  }}
                >
                  {STAGE_BODY[activeStage.key]}
                </p>
                </m.div>
              </AnimatePresence>
            </div>

            {/* ── Step Selector ───────────────────────────── */}
            <m.div
              {...fadeUpOnScroll(3)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                marginBottom: "56px",
                position: "relative",
              }}
            >
              {APPROVAL_LIFECYCLE.map((step, i) => (
                <div
                  key={step.key}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    cursor: "pointer",
                    position: "relative",
                    width: "100%",
                    minHeight: "60px",
                  }}
                  onClick={() => selectStep(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Step ${i + 1}: ${step.title}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectStep(i);
                    }
                  }}
                >
                  {/* Connecting line — between circles */}
                  {i < APPROVAL_LIFECYCLE.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "16px",
                        top: "50%",
                        bottom: "-50%",
                        width: "2px",
                        backgroundColor:
                          i < active
                            ? "var(--color-gold)"
                            : "rgba(var(--color-neutral-tint-rgb), 0.25)",
                        zIndex: Z_INDEX.base,
                        transition: cssTransition("background-color", "slow"),
                      }}
                    />
                  )}
                  {/* Circle */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-circle)",
                      flexShrink: 0,
                      // An inactive circle is filled with the section's own
                      // surface, so the connecting line stops at its edge
                      // instead of running behind the number.
                      backgroundColor:
                        i === active ? "var(--color-gold)" : "var(--color-navy-primary)",
                      border:
                        i === active
                          ? "2px solid var(--color-gold)"
                          : "2px solid rgba(var(--color-neutral-tint-rgb), 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: Z_INDEX.raised,
                      transition: cssTransition(["background-color", "border-color"], "slow"),
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        color: i === active ? "var(--color-navy-primary)" : "var(--color-text-muted)",
                        transition: cssTransition("color", "slow"),
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  {/* Title */}
                  <span
                    style={{
                      fontWeight: i === active ? 600 : 500,
                      fontSize: "var(--text-md)",
                      color: i === active ? "var(--color-white)" : "var(--color-text-muted)",
                      marginLeft: "14px",
                      transition: cssTransition("color", "slow"),
                    }}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </m.div>
          </div>

          {/* ── Right Panel — Mockup ────────────────────────────── */}
          {/* Plain flex, not a 2-col grid: the panel holds a single mockup, so
              a grid-cols-2 reserved a permanently-empty second track — the dead
              whitespace on the right. Balanced lg:flex-1 halves + the mockup
              right-aligned in its half fills the width instead. */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              // Fixed render height: the tallest framed stage mockup is ~462px
              // (lg) / ~471px (mobile, the review stage); reserving 480px stops
              // the mode="wait" swap from collapsing the panel to zero and
              // jumping the section each cycle.
              minHeight: "480px",
            }}
            className="lg:flex-1 lg:justify-end"
          >
            {/* Right — Mockup */}
            <AnimatePresence mode="wait">
              <m.div
                key={`mockup-${active}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: MOTION_DURATION.slow }}
                style={{ maxWidth: "var(--measure-tight)", width: "100%" }}
              >
                <BrowserFrame caption={appCaption(previewPath)} surface="dark">
                  <ActiveMockup />
                </BrowserFrame>
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Feature Callout Strip ───────────────────── */}
        <m.div
          {...fadeUpOnScroll(4)}
          {...cardGridProps(FEATURES.length, { min: "7rem" }, {
            backgroundColor: "var(--color-navy-mid)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 32px",
            marginTop: "72px",
            gap: "16px",
          })}
        >
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  color="var(--color-gold)"
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {feat.label}
                </span>
              </div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}
