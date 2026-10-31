"use client";

/**
 * HowItWorksPage — the full deep-dive version of the landing page's
 * HowItWorks section. Walks through the complete approval lifecycle in
 * four detailed stages, then explains the role-enforced chains,
 * notification choreography, and contrasts the "old way" with the
 * platform way. Uses the same brand motion spec (fade-up only,
 * 0.4s ease-out, no scale/rotation).
 */

import { DOCUMENTS_KEPT } from "@/lib/record-keeping";
import { requestTypeList } from "@/lib/module-copy";
import { m } from "framer-motion";
import {
  FileCheck,
  UserCheck,
  Signature,
  Archive,
  Mail,
  MessageCircle,
  Bell,
  Smartphone,
  ShieldCheck,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import { BRAND, SITE_PAGES } from "@/lib/brand";
import { fadeUpOnScroll } from "@/lib/animations";
import { DarkHeroBackdrop } from "@/components/ui/dark-hero-backdrop";
import { ButtonLink, buttonProps } from "@/components/ui/button";
import { Eyebrow, SectionIntro } from "@/components/ui/section-intro";
import { RoleBadge } from "@/components/ui/role-badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CtaBanner } from "@/components/sections/cta-banner";
import { STAGE_MOCKUPS } from "./stage-mockups";
import { FEATURED_VOUCHER, PURCHASE_ORDER } from "./demo-fixtures";
import { BrowserFrame, appCaption } from "./previews/preview-primitives";
import {
  APPROVAL_LIFECYCLE,
  lifecycleStepNumber,
  type LifecycleStage,
  type LifecycleStageKey,
} from "@/lib/approval-lifecycle";
import { numberInWords } from "@/lib/number-words";
import { START_TRIAL_CTA } from "@/lib/trial-terms";
import { Z_INDEX } from "@/lib/layers";
import { cardGridProps } from "@/lib/card-grid";

/**
 * This page's own words for each lifecycle stage. The stages themselves — their
 * titles, order and count — come from `APPROVAL_LIFECYCLE`; a stage added there
 * fails type-check here until it has its copy.
 */
const STAGE_COPY: Record<
  LifecycleStageKey,
  { subtitle: string; icon: LucideIcon; body: string; bullets: readonly string[] }
> = {
  submit: {
    subtitle: "Structured request, not an email.",
    icon: FileCheck,
    body: `Any team member raises a ${requestTypeList("disjunction")} through a structured form — payee details, amount, purpose, department, cost code, supporting attachments. The form only accepts complete, valid information, so the person reviewing never has to chase details or send it back.`,
    bullets: [
      "Auto-saves as you go — no lost work if the browser closes unexpectedly",
      `Attach contracts, invoices, and quotes — ${DOCUMENTS_KEPT}`,
      `Every request gets a unique reference number on submit (${FEATURED_VOUCHER.reference}, ${PURCHASE_ORDER.reference})`,
      "Flags possible duplicates by vendor and amount so you don't pay the same invoice twice",
    ],
  },
  review: {
    subtitle: "The right person, at the right time, with everything they need.",
    icon: UserCheck,
    body: "The request goes automatically to the right person — Finance for payments, the Head of Department for purchase orders. They see everything they need: payee, amount, purpose, attachments, and how much of the department's budget is still left. They approve, ask a question, or send it back. When they ask a question, the submitter answers right on the same request — no new email, no losing the thread.",
    bullets: [
      "Approvers only see what their role is responsible for — no noise",
      "Questions and answers stay on the request itself — no lost WhatsApp or email threads",
      "Out of office? Approvals automatically hand over to the person you named",
      "High-value items skip straight to the MD — no unnecessary stops",
    ],
  },
  sanction: {
    subtitle: "Final authority, signed and on record.",
    icon: Signature,
    body: "The Managing Director sees the full picture — what Finance or the Head of Department approved, what the submitter answered to any questions, every signature collected along the way. They sign it off digitally, and that signature is stamped onto every document the request produces. This is the moment authority becomes binding.",
    bullets: [
      "Sign once, re-used on every approval — with a fresh confirmation step for high-value items",
      "Quick-approve for small amounts below a threshold you set",
      "The MD can never approve their own requests — a rule that can't be switched off",
      "Approve from your phone, tablet, or laptop — never held up by where you are",
    ],
  },
  record: {
    subtitle: "Every action recorded and sealed. Every document, bank-ready.",
    icon: Archive,
    body: `The moment the MD signs, ${BRAND.name} generates the bank-ready PDF and a timeline of the decision ready for audit. Both are filed in Records automatically. The record — every question, every change, every signature — is now sealed in a tamper-evident chain. Nobody, not even the person who runs the account, can edit history after the fact, and a change made any other way would show when the record is verified.`,
    bullets: [
      "Bank-ready payment letter with the MD's signature and your company letterhead",
      "Voucher or PO PDF with the full approval chain printed on the document itself",
      "Once approved, the record is sealed — any later edit or deletion would show when it is verified",
      "Export any period of up to a year as a regulator-ready bundle with one click",
    ],
  },
};

const PV_CHAIN = [
  { role: "staff" as const, label: "Submitter", body: "Any team member raises the voucher with payee, amount, and purpose." },
  { role: "finance" as const, label: "Finance reviews", body: "Finance validates budget position and vendor standing before escalation." },
  { role: "md" as const, label: "MD sanctions", body: "The MD gives final authority. Bank-ready PDF generates on sign-off." },
];

const PO_CHAIN = [
  { role: "staff" as const, label: "Submitter", body: "Staff creates the purchase order with vendor, line items, and justification." },
  { role: "hod" as const, label: "HOD approves", body: "Head of Department confirms department need + budget." },
  { role: "md" as const, label: "MD sanctions", body: "The MD gives final authority. PO is issued to the vendor." },
];

const NOTIFICATIONS = [
  { icon: Mail, channel: "Email", desc: "Structured approval request with all context + a one-click review link" },
  { icon: MessageCircle, channel: "WhatsApp", desc: "Approver taps a secure link from WhatsApp to review and sanction on their phone" },
  { icon: Bell, channel: "In-app", desc: "Live badge on the approvals inbox with full detail" },
  { icon: Smartphone, channel: "Mobile web", desc: "No native app required — the dashboard works from any browser" },
];

const COMPARISON = [
  {
    old: "Approver A emails approver B, who emails back the requester, who forwards to approver C…",
    withPlatform: "One submission travels the defined chain automatically. No one guesses where it is.",
  },
  {
    old: "Printed paper voucher signed in pen, scanned, emailed, filed somewhere.",
    withPlatform: "Digital signature attached at sanction. Bank-ready PDF and audit trail generated instantly.",
  },
  {
    old: "\"Who approved this?\" requires an archaeology expedition through 6 months of email.",
    withPlatform: "Every action is permanently recorded — who did it, when, from where, and exactly what they saw.",
  },
  {
    old: "Quarterly audit means 2 weeks of manual reconciliation and explaining missing records.",
    withPlatform: "One-click export delivers a regulator-ready bundle for any period of up to a year. Auditors show up once, leave satisfied.",
  },
];

function StageRow({ stage, index }: { stage: LifecycleStage; index: number }) {
  const reverse = index % 2 === 1;
  const { Mockup, previewPath } = STAGE_MOCKUPS[stage.key];
  const copy = STAGE_COPY[stage.key];
  const Icon = copy.icon;
  return (
    <m.div
      {...fadeUpOnScroll()}
      style={{
        display: "grid",
        gap: "56px",
        alignItems: "center",
      }}
      className={`grid-cols-1 lg:grid-cols-2 ${reverse ? "lg:[direction:rtl] [&>*]:[direction:ltr]" : ""}`}
    >
      {/* Copy */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-gold-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={20} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                color: "var(--color-gold-on-light)",
                letterSpacing: "0.06em",
              }}
            >
              STAGE {lifecycleStepNumber(index)}
            </span>
            <h2
              style={{
                fontWeight: 400,
                fontSize: "var(--text-heading-lg)",
                color: "var(--color-text-primary)",
                margin: 0,
                letterSpacing: "0.01em",
                lineHeight: 1.2,
              }}
              className="lg:!text-display-xs"
            >
              {stage.title}
            </h2>
          </div>
        </div>
        <p
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            lineHeight: 1.5,
            margin: "0 0 14px",
          }}
        >
          {copy.subtitle}
        </p>
        <p
          style={{
            fontSize: "var(--text-lg)",
            color: "var(--color-text-muted)",
            lineHeight: 1.75,
            margin: "0 0 20px",
          }}
        >
          {copy.body}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {copy.bullets.map((bullet) => (
            <li
              key={bullet}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontSize: "var(--text-md)",
                color: "var(--color-text-body)",
                lineHeight: 1.6,
              }}
            >
              <Check size={16} strokeWidth={2} color="var(--color-gold)" style={{ marginTop: "2px", flexShrink: 0 }} aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup */}
      <BrowserFrame caption={appCaption(previewPath)} surface="light">
        <Mockup />
      </BrowserFrame>
    </m.div>
  );
}

type ChainNode = (typeof PV_CHAIN)[number] | (typeof PO_CHAIN)[number];

function ChainCard({
  node,
  index,
  baseDelay,
  active,
}: {
  node: ChainNode;
  index: number;
  baseDelay: number;
  active?: boolean;
}) {
  return (
    <m.div
      {...fadeUpOnScroll(baseDelay + index)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "var(--color-navy-mid)",
        border: active ? "1px solid var(--color-gold-border-strong)" : "1px solid var(--color-white-border)",
        borderRadius: "var(--radius-card)",
        padding: "20px 18px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          fontSize: "var(--text-3xs)",
          letterSpacing: "0.08em",
          color: "var(--color-text-secondary)",
        }}
      >
        STAGE {lifecycleStepNumber(index)}
      </span>
      <RoleBadge role={node.role} />
      <h3 style={{ fontWeight: 500, fontSize: "var(--text-md)", color: "var(--color-white)", margin: "2px 0 0" }}>
        {node.label}
      </h3>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-subtle)", lineHeight: 1.5, margin: 0 }}>
        {node.body}
      </p>
    </m.div>
  );
}

export function HowItWorksProductPage() {

  return (
    <>
      <Navbar />
      <main id="main">

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "var(--color-navy-primary)",
          padding: "120px 40px 96px",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >

        <div style={{ maxWidth: "var(--measure-wide)", margin: "0 auto", textAlign: "center", position: "relative", zIndex: Z_INDEX.content }}>
          <SectionIntro
            surface="dark"
            titleAs="h1"
            eyebrow={`How ${BRAND.name} works`}
            eyebrowStyle={{ display: "inline-block", marginBottom: "20px" }}
            title={
              <>
                From request to audit-ready record —
                <br />
                the complete lifecycle.
              </>
            }
            titleStyle={{
              fontWeight: 700,
              fontSize: "var(--text-display-xs)",
              lineHeight: 1.15,
              margin: "0 0 24px",
            }}
            titleClassName="lg:!text-display-4xl"
            lede={
              <>
                Every {requestTypeList()} travels the same {numberInWords(APPROVAL_LIFECYCLE.length)}-stage lifecycle. Structured at submission, routed by
                role, sanctioned by authority, recorded on the audit trail. No email
                threads. No lost approvals. No guessing what changed.
              </>
            }
            ledeStyle={{
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-subtle)",
              lineHeight: 1.7,
              margin: "0 auto 32px",
              maxWidth: "var(--measure)",
            }}
          />
          <m.div
            {...fadeUpOnScroll(3)}
            style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <ButtonLink href={SITE_PAGES.trial()} size="md">
              {START_TRIAL_CTA}
            </ButtonLink>
            <a href="#lifecycle" {...buttonProps({ variant: "secondary", surface: "dark", size: "md" })}>
              See the lifecycle →
            </a>
          </m.div>
        </div>
      </section>

      {/* ── LIFECYCLE STAGES ───────────────────────────────── */}
      <section
        id="lifecycle"
        style={{ backgroundColor: "var(--color-white)", padding: "120px 40px", scrollMarginTop: "80px", position: "relative", overflow: "hidden", isolation: "isolate" }}
      >
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "120px" }}>
          {APPROVAL_LIFECYCLE.map((stage, i) => (
            <StageRow key={stage.key} stage={stage} index={i} />
          ))}
        </div>
      </section>

      {/* ── APPROVAL CHAINS ────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "var(--color-navy-primary)",
          padding: "120px 40px",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        <DarkHeroBackdrop glows="closing" />

        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", position: "relative", zIndex: Z_INDEX.content }}>
          <SectionIntro
            surface="dark"
            eyebrow="ROLE-ENFORCED AUTHORITY"
            eyebrowStyle={{ marginBottom: "16px" }}
            title="Two document types. Two defined chains."
            titleStyle={{
              fontWeight: 400,
              fontSize: "var(--text-heading-2xl)",
              lineHeight: 1.2,
              margin: "0 0 16px",
              maxWidth: "var(--measure)",
              letterSpacing: "0.01em",
            }}
            titleClassName="lg:!text-display-sm"
            lede={
              <>
                Payment vouchers follow one authority chain. Purchase orders follow
                another. Each chain is role-enforced, separation-of-duties-safe,
                and on the audit trail. Authority at every stage.
              </>
            }
            ledeStyle={{
              fontSize: "var(--text-lg)",
              color: "var(--color-text-subtle)",
              lineHeight: 1.7,
              margin: "0 0 48px",
              maxWidth: "var(--measure)",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="md:!gap-[32px] lg:!gap-[48px]">
            <div>
              <Eyebrow as="h3" surface="dark" reveal="scroll" index={3} style={{ marginBottom: "16px" }}>
                Payment Voucher Chain
              </Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {PV_CHAIN.map((node, i) => (
                  <ChainCard key={node.label} node={node} index={i} baseDelay={4} active={i === 1} />
                ))}
              </div>
            </div>

            <div>
              <Eyebrow as="h3" surface="dark" reveal="scroll" index={3} style={{ marginBottom: "16px" }}>
                Purchase Order Chain
              </Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {PO_CHAIN.map((node, i) => (
                  <ChainCard key={node.label} node={node} index={i} baseDelay={7} active={i === 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTIFICATIONS ──────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-bg)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <SectionIntro
            eyebrow="NOTIFICATION CHOREOGRAPHY"
            eyebrowStyle={{ marginBottom: "16px" }}
            title="Approvers hear about requests wherever they are."
            titleStyle={{
              fontWeight: 400,
              fontSize: "var(--text-heading-2xl)",
              lineHeight: 1.2,
              margin: "0 0 14px",
              maxWidth: "var(--measure-snug)",
              letterSpacing: "0.01em",
            }}
            titleClassName="lg:!text-display-sm"
            lede={
              <>
                Every stage of the lifecycle dispatches notifications through the
                channels your approvers actually check. Decision makers are never
                a bottleneck because they are never out of reach.
              </>
            }
            ledeStyle={{
              fontSize: "var(--text-lg)",
              lineHeight: 1.7,
              margin: "0 0 40px",
              maxWidth: "var(--measure)",
            }}
          />

          <div {...cardGridProps(NOTIFICATIONS.length, {}, { gap: "16px" })}>
            {NOTIFICATIONS.map((n, i) => {
              const Icon = n.icon;
              return (
                <m.div
                  key={n.channel}
                  {...fadeUpOnScroll(i + 3)}
                  style={{
                    backgroundColor: "var(--color-white)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-card)",
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-gold-tint)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
                  </div>
                  <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                    {n.channel}
                  </h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.55, margin: 0 }}>
                    {n.desc}
                  </p>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BEFORE vs AFTER ────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-white)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <SectionIntro
            eyebrow="THE CONTRAST"
            eyebrowStyle={{ marginBottom: "14px" }}
            title="What actually changes day-to-day."
            titleStyle={{
              fontWeight: 400,
              fontSize: "var(--text-heading-2xl)",
              lineHeight: 1.2,
              margin: "0 0 48px",
              maxWidth: "var(--measure-snug)",
              letterSpacing: "0.01em",
            }}
            titleClassName="lg:!text-display-sm"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {/* Header row */}
            <div
              style={{
                backgroundColor: "var(--color-bg-light)",
                padding: "16px 22px",
                borderRight: "1px solid var(--color-border)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <X size={16} strokeWidth={2} style={{ color: "var(--color-danger)" }} aria-hidden="true" />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}
              >
                The old way
              </span>
            </div>
            <div
              style={{
                backgroundColor: "var(--color-bg-light)",
                padding: "16px 22px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldCheck size={16} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-primary)",
                }}
              >
                With {BRAND.name}
              </span>
            </div>

            {COMPARISON.map((row, i) => (
              <div key={row.withPlatform} style={{ display: "contents" }}>
                <m.div
                  {...fadeUpOnScroll(i + 2)}
                  style={{
                    padding: "20px 22px",
                    borderRight: "1px solid var(--color-border)",
                    borderBottom: i < COMPARISON.length - 1 ? "1px solid var(--color-border)" : "none",
                    fontSize: "var(--text-md)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {row.old}
                </m.div>
                <m.div
                  {...fadeUpOnScroll(i + 2)}
                  style={{
                    padding: "20px 22px",
                    borderBottom: i < COMPARISON.length - 1 ? "1px solid var(--color-border)" : "none",
                    fontSize: "var(--text-md)",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.6,
                  }}
                >
                  {row.withPlatform}
                </m.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
