"use client";

/**
 * The homepage hero — the brand brief's layout: a flat ink field, the category
 * eyebrow, the headline set in the display face, two square buttons, the launch
 * line, and one decision card that walks the approval lifecycle to "Recorded".
 *
 * Flat by design: no glows, no grid texture, no parallax. Motion is slow and
 * settles (fade up only); nothing bounces.
 *
 * The card tells the truth (brief: "samples tell the truth"): it is the site's
 * featured voucher — its payee, amount, people, roles and times come from
 * `demo-fixtures`, and its steps are the lifecycle's own stages, so it shows
 * only what the product records.
 */

import { m } from "framer-motion";
import { fadeUp, fadeUpOnScroll, fadeUpTransition, FADE_UP_VIEWPORT, STAGGER_STEP } from "@/lib/animations";
import { buttonProps } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section-intro";
import { StatusMark } from "@/components/ui/status-mark";
import { BrandLogo } from "@/components/ui/logo";
import { BRAND, SITE_PAGES } from "@/lib/brand";
import { LAUNCH_STATUS } from "@/lib/launch";
import { START_TRIAL_CTA, NO_CARD_REQUIRED } from "@/lib/trial-terms";
import { APPROVAL_LIFECYCLE, lifecycleStepNumber } from "@/lib/approval-lifecycle";
import { FEATURED_VOUCHER, demoAmount, formatDemoTime, roleLabel } from "@/components/product/demo-fixtures";
import { Z_INDEX } from "@/lib/layers";

/** The featured voucher's steps, in lifecycle order, ending with the record. */
function decisionSteps() {
  const sanctioned = FEATURED_VOUCHER.trail[FEATURED_VOUCHER.trail.length - 1]!;
  return APPROVAL_LIFECYCLE.map((stage, index) => {
    const entry = FEATURED_VOUCHER.trail.find((candidate) => candidate.stage === stage.key);
    return entry
      ? { number: lifecycleStepNumber(index), action: `${entry.label} · ${roleLabel(entry.person)}`, at: entry.at, recorded: false }
      : { number: lifecycleStepNumber(index), action: "Recorded", at: sanctioned.at, recorded: true };
  });
}

function DecisionCard() {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        padding: "28px",
        width: "100%",
        maxWidth: "400px",
        color: "var(--color-text-primary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-gold-on-light)" }}>
          {FEATURED_VOUCHER.reference}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--color-success-border)",
            color: "var(--color-success)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
          }}
        >
          <StatusMark status="approved" />
          Approved
        </span>
      </div>

      <div style={{ height: "1px", backgroundColor: "var(--color-border)", margin: "16px 0 20px" }} />

      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
        Vendor payment · {FEATURED_VOUCHER.payee}
      </p>
      <p
        style={{
          margin: "6px 0 20px",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-heading-lg)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        }}
      >
        {demoAmount(FEATURED_VOUCHER.amount)}
      </p>

      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {decisionSteps().map((step, index, steps) => (
          <li
            key={step.number}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr auto",
              alignItems: "baseline",
              gap: "8px",
              padding: "10px 0",
              borderBottom: index < steps.length - 1 ? "1px solid var(--color-border)" : "none",
              fontSize: "var(--text-sm)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: step.recorded ? "var(--color-gold-on-light)" : "var(--color-text-secondary)",
              }}
            >
              {step.number}
            </span>
            <span style={{ fontWeight: step.recorded ? 600 : 400 }}>{step.action}</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
              {formatDemoTime(step.at)}
            </span>
          </li>
        ))}
      </ol>

      {/* The card is the product's own record, so it carries the product's credit line. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px solid var(--color-border)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
        }}
      >
        <BrandLogo size={18} variant="on-light" showWordmark={false} />
        <span>Powered by {BRAND.name}</span>
      </div>
    </div>
  );
}

/**
 * The headline, word by word (each fades in). "Across every company you run" is
 * the multi-company claim, so it shows only once `multiCompanyGroup` has a
 * production sign-off (`@/lib/verified-claims`); until then the line every
 * customer gets. The em dash stays bound to "what" (see the render below).
 */
const HEADLINE_WORDS = {
  group: ["Prove", "who", "authorised", "what —", "across", "every", "company", "you", "run."],
  singleCompany: ["Prove", "who", "authorised", "what —", "on", "every", "decision", "you", "make."],
} as const;

/** `multiCompanySignedOff`: whether the multi-company claim is signed off on production. */
export function Hero({ multiCompanySignedOff }: { multiCompanySignedOff: boolean }) {
  return (
    <section
      style={{
        backgroundColor: "var(--color-navy-primary)",
        padding: "140px var(--page-side-padding) 120px",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <div
        style={{
          maxWidth: "var(--layout-max-width)",
          margin: "0 auto",
          display: "grid",
          gap: "56px",
          alignItems: "center",
          position: "relative",
          zIndex: Z_INDEX.content,
        }}
        className="grid-cols-1 lg:grid-cols-[1fr_400px]"
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow surface="dark" size="hero" reveal="scroll" style={{ marginBottom: "24px" }}>
            {BRAND.positioningStatement}
          </Eyebrow>

          <m.h1
            initial="hidden"
            whileInView="visible"
            viewport={FADE_UP_VIEWPORT}
            variants={{ visible: { transition: { staggerChildren: STAGGER_STEP } } }}
            style={{
              fontSize: "var(--text-display-xs)",
              color: "var(--color-text-on-shell)",
              lineHeight: 1.12,
              margin: "0 0 28px",
              textWrap: "balance",
            }}
            className="lg:!text-display-4xl"
          >
            {/* One flowing sentence, balanced by the browser: a forced break left
                "what —" alone on a line at desktop width. The em dash is bound to
                "what" as ONE span, never its own word: at 390px a standalone dash
                wrapped onto a line by itself and read as a stray rule. */}
            {(multiCompanySignedOff ? HEADLINE_WORDS.group : HEADLINE_WORDS.singleCompany).map((word, index, words) => (
              <m.span
                key={word}
                variants={fadeUp}
                transition={fadeUpTransition}
                style={{ display: "inline-block", marginRight: index < words.length - 1 ? "0.28em" : 0 }}
              >
                {word}
              </m.span>
            ))}
          </m.h1>

          <m.p
            {...fadeUpOnScroll(2)}
            style={{
              fontSize: "var(--text-3xl)",
              color: "var(--color-text-on-shell-muted)",
              lineHeight: 1.7,
              margin: "0 0 36px",
              maxWidth: "var(--measure-short)",
            }}
          >
            Most organisations run on scattered emails, informal approvals and no clear record of
            who was allowed to approve what. {BRAND.name} makes authority explicit: every decision
            routed to the right approver, enforced, and on record permanently.
          </m.p>

          <m.div {...fadeUpOnScroll(3)} style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href={SITE_PAGES.trial()} {...buttonProps({ size: "lg" })}>
              {START_TRIAL_CTA}
            </a>
            <a href={SITE_PAGES.contact("demo")} {...buttonProps({ size: "lg", variant: "secondary", surface: "dark" })}>
              Talk to us
            </a>
          </m.div>

          <m.p
            {...fadeUpOnScroll(4)}
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-inverse-muted)",
              margin: "24px 0 0",
              lineHeight: 1.5,
            }}
          >
            {NO_CARD_REQUIRED}. {LAUNCH_STATUS}
          </m.p>
        </div>

        <m.div {...fadeUpOnScroll(4)} style={{ display: "flex", justifyContent: "center" }}>
          <DecisionCard />
        </m.div>
      </div>
    </section>
  );
}
