"use client";

/**
 * SecurityProductPage — the full /product/security deep-dive.
 *
 * Not a module page — security is cross-cutting. Uses the same visual
 * language and motion spec as /product/how-it-works (dark hero, light
 * stack rows with browser-framed mockups, honest framing).
 *
 * Content is grounded in the platform's actual implementation: database-
 * enforced tenant isolation, role and request rules, session revocation, MFA,
 * IP allowlist, SCIM,
 * tamper-evident audit trail. No certification claims — "policies follow SOC 2 structure"
 * framing only, per the stated trust posture.
 */

import Link from "next/link";
import { m } from "framer-motion";
import {
  Database,
  ShieldCheck,
  KeyRound,
  FileSearch,
  UserCog,
  Lock,
  Check,
  Mail,
} from "lucide-react";

import { SECURITY_FAQS } from "@/lib/security-faqs";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CtaBanner } from "@/components/sections/cta-banner";
import {
  IsolationMockup,
  AuthorityMockup,
  SessionMockup,
  AuditMockup,
  LifecycleMockup,
  InfraMockup,
} from "./security-mockups";
import { BrowserFrame } from "./previews/preview-primitives";
import { contactHref } from "@/app/contact/tabs";
import { ENQUIRY_PROMISE, SECURITY_TRIAGE_TIME } from "@/lib/contacts";
import { COMPLIANCE_FRAMEWORKS, COMPLIANCE_STATUS_LABELS, ACCESS_ENDS } from "@/lib/compliance-posture";
import { TRAIL_SEALED_WITH_FINGERPRINT } from "@/lib/record-keeping";
import { DarkHeroBackdrop } from "@/components/ui/dark-hero-backdrop";
import { ButtonLink, buttonProps } from "@/components/ui/button";
import { fadeUpOnScroll } from "@/lib/animations";
import { SectionIntro } from "@/components/ui/section-intro";
import { Z_INDEX } from "@/lib/layers";
import { cardGridProps } from "@/lib/card-grid";
import { BRAND } from "@/lib/brand";

const PILLARS = [
  {
    icon: Database,
    title: "Your data is yours — always",
    body:
      "Each customer's workspace is walled off by the database itself, not just by the app.",
  },
  {
    icon: UserCog,
    title: "Real authority, not just a role label",
    body:
      "Who can approve what, in which department and up to what amount — checked on every click.",
  },
  {
    icon: FileSearch,
    title: "Every action is on the record",
    body:
      `Every action is recorded in a tamper-evident chain and ${TRAIL_SEALED_WITH_FINGERPRINT} you can verify yourself.`,
  },
  {
    icon: KeyRound,
    title: "Access that keeps up with your people",
    body:
      `Joiners get what their role needs; leavers lose access ${ACCESS_ENDS}.`,
  },
];

const STACK = [
  {
    number: "01",
    key: "isolation",
    title: "Isolation",
    subtitle: "Your data is yours — no other customer can ever see it. Enforced by the database itself, not just by the app.",
    body:
      "Every request is tied to one organisation, and the database itself checks that each row it returns belongs to that organisation. The check fails closed: a request that is not tied to an organisation gets nothing back, never someone else's data.",
    icon: Database,
    bullets: [
      "Isolation rules enforced by the database on every table that holds customer data",
      "Every request runs inside its own organisation's context",
      "Fails closed: a request with no organisation sees no rows at all",
      "Checked automatically before every release",
    ],
    Mockup: IsolationMockup,
    caption: "tenant isolation · database layer",
  },
  {
    number: "02",
    key: "authority",
    title: "Authority",
    subtitle: "Two layers of control: what your role lets you do in general, and what's allowed for this specific request — in this specific department, at this specific amount.",
    body:
      "Your role decides the set of things you can do — a fine-grained permission system with clean separation between administrative and operational capability. A second layer then checks the specific request: can the submitter approve their own document, is the Head of Department acting within their department, does the amount exceed their threshold.",
    icon: UserCog,
    bullets: [
      "A fine-grained permission system with clean separation between administrative and operational capability",
      "Separation of duties — submitters cannot approve their own requests",
      "Department scope — Heads of Department act only on their own department",
      "Amount thresholds — high-value requests auto-escalate to the MD",
    ],
    Mockup: AuthorityMockup,
    caption: "role-based authority · attribute overlays",
  },
  {
    number: "03",
    key: "session",
    title: "Session integrity",
    subtitle: `When a role changes or a user leaves, their active sessions are invalid ${ACCESS_ENDS}.`,
    body:
      "Every session is checked on every click. A role change, deactivation, password change, access expiry, or a company-wide sign-out means signing in again on the next click. Two-factor sign-in accepts a passkey, an authenticator app, or a one-time code by email or SMS, with secured recovery codes behind them. Per-tenant IP allowlisting (both IPv4 and IPv6) is available as a hard sign-in gate.",
    icon: ShieldCheck,
    bullets: [
      `Active sessions end ${ACCESS_ENDS} of a role change, deactivation, or password change`,
      "Two-factor sign-in by passkey, authenticator app, email code or SMS — required for everyone or for the roles you choose",
      "Per-tenant IP allowlist (IPv4 and IPv6) available as a hard sign-in gate",
      "Single sign-on via OpenID Connect (OIDC) or SAML 2.0, which a company can require; one sign-in per person across every company they work in",
    ],
    Mockup: SessionMockup,
    caption: "session revocation · identity controls",
  },
  {
    number: "04",
    key: "audit",
    title: "Audit trail",
    subtitle: "Every action recorded and sealed. Every export, regulator-ready.",
    body:
      `The audit log records who did what, when and from where, for every meaningful event. Role changes and board-access lifecycle events have their own dedicated trails. Each entry is chained to the one before it, and edits and deletions are refused by the database. Lawful retention purges leave a verifiable marker in the chain. Every night the chain is sealed with a signed fingerprint your auditor can check without trusting ${BRAND.name}.`,
    icon: FileSearch,
    bullets: [
      "Every approval, query, and role change written to an append-only log",
      "Dedicated trail for role changes, capturing who changed what and why",
      "Board-access lifecycle fully tracked — provisioning, approval, expiry, renewal, revocation",
      "One-click regulator-ready export for any period of up to a year",
    ],
    Mockup: AuditMockup,
    caption: "tamper-evident audit trail · role-change log",
  },
  {
    number: "05",
    key: "lifecycle",
    title: "Access lifecycle",
    subtitle: `People come and go — access keeps up. Joiners get what they need; leavers lose access ${ACCESS_ENDS}.`,
    body:
      "User provisioning flows in automatically from your identity provider (Okta or Microsoft Entra). Auditor and board-level guests get a clear start date and expiry — access is withdrawn on the dot without manual clean-up. Document retention follows your plan; the audit trail itself is never purged while the account is active.",
    icon: KeyRound,
    bullets: [
      "Automated user provisioning (SCIM) with Okta and Microsoft Entra",
      "Directory groups mapped to roles — anything beyond staff access waits for a person in your organisation to approve it",
      "Time-bound access for auditors and provisional board members, with automatic revocation",
      "Per-plan document retention, with the audit trail itself never purged",
      "Attachments served through short-lived, per-upload URLs",
    ],
    Mockup: LifecycleMockup,
    caption: "access lifecycle · SCIM provisioning",
  },
  {
    number: "06",
    key: "infra",
    title: "Encryption & infrastructure",
    subtitle: "Encrypted in transit and at rest — and again on top of that, for the most sensitive pieces like two-factor codes and single sign-on tokens.",
    body:
      "All traffic is encrypted with modern TLS. The application database is encrypted at rest, with automated daily snapshots. Sensitive application secrets — two-factor codes, single sign-on tokens — are encrypted again at the application layer before being written, so even a database leak would not expose them. Attachments live in encrypted object storage and are delivered through short-lived, per-upload URLs.",
    icon: Lock,
    bullets: [
      "Modern TLS in transit, with strict browser-side policies",
      "Database encrypted at rest, with daily snapshots",
      "A second layer of encryption for sensitive fields, with keys per company",
      "Encrypted object storage with short-lived, per-upload delivery URLs",
    ],
    Mockup: InfraMockup,
    caption: "encryption · platform infrastructure",
  },
];

function StackRow({ stage, index }: { stage: (typeof STACK)[number]; index: number }) {
  const reverse = index % 2 === 1;
  const Mockup = stage.Mockup;
  const Icon = stage.icon;
  return (
    <m.div
      {...fadeUpOnScroll()}
      style={{ display: "grid", gap: "56px", alignItems: "center" }}
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
              LAYER {stage.number}
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
          {stage.subtitle}
        </p>
        <p
          style={{
            fontSize: "var(--text-lg)",
            color: "var(--color-text-muted)",
            lineHeight: 1.75,
            margin: "0 0 20px",
          }}
        >
          {stage.body}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {stage.bullets.map((b) => (
            <li
              key={b}
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
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup */}
      <BrowserFrame caption={stage.caption} surface="light">
        <Mockup />
      </BrowserFrame>
    </m.div>
  );
}

export function SecurityProductPage() {

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
            eyebrow="SECURITY"
            eyebrowStyle={{
              display: "inline-block",
              marginBottom: "20px",
            }}
            title={
              <>
                Authority at every layer.
                <br />
                By design.
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
                {BRAND.name} is built for organisations where every approval carries
                weight. Security is not a feature bolted on later — it is the
                structural premise of the platform. Here is exactly what that
                means, layer by layer.
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
            <ButtonLink
              href={contactHref("security")}
              size="md"
            >
              Book a security review
            </ButtonLink>
            <a
              href="#stack"
              {...buttonProps({ variant: "secondary", surface: "dark", size: "md" })}
            >
              Read the stack →
            </a>
          </m.div>
        </div>
      </section>

      {/* ── PILLARS ────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-white)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <SectionIntro
            eyebrow="TRUST POSTURE"
            eyebrowStyle={{
              marginBottom: "12px",
            }}
            title="Four foundations. Each built in at the deepest level — not just something the app tries to do."
            titleStyle={{
              fontWeight: 400,
              fontSize: "var(--text-heading-2xl)",
              lineHeight: 1.2,
              margin: "0 0 48px",
              maxWidth: "var(--measure)",
              letterSpacing: "0.01em",
            }}
            titleClassName="lg:!text-display-sm"
          />

          <div {...cardGridProps(PILLARS.length, { max: 2 }, { gap: "20px" })}>
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <m.div
                  key={p.title}
                  {...fadeUpOnScroll(i + 2)}
                  style={{
                    backgroundColor: "var(--color-bg-light)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-gold-tint)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
                  </div>
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--text-3xl)",
                      color: "var(--color-text-primary)",
                      margin: "4px 0 0",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--text-md)",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {p.body}
                  </p>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STACK ──────────────────────────────────────────── */}
      <section id="stack" style={{ backgroundColor: "var(--color-white)", padding: "120px 40px", scrollMarginTop: "80px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "120px" }}>
          {STACK.map((s, i) => (
            <StackRow key={s.key} stage={s} index={i} />
          ))}
        </div>
      </section>

      {/* ── COMPLIANCE POSTURE ─────────────────────────────── */}
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
            eyebrow="COMPLIANCE POSTURE"
            eyebrowStyle={{
              marginBottom: "16px",
            }}
            title={
              <>
                Honest about what we are — and what we&rsquo;re working toward.
              </>
            }
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
                {BRAND.name} does not hold SOC 2 or ISO 27001 certification today. Our
                policies follow SOC 2 structure, a SOC 2 Type II audit is on our
                roadmap, and we can walk you through each control on a security
                review.
              </>
            }
            ledeStyle={{
              fontSize: "var(--text-lg)",
              color: "var(--color-text-subtle)",
              lineHeight: 1.7,
              margin: "0 0 48px",
              maxWidth: "680px",
            }}
          />

          {/* Wrapping flex, not a 3-column grid: five frameworks would strand two
              cards in a part-empty row; here every row's cards grow to fill it. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {COMPLIANCE_FRAMEWORKS.map((c, i) => (
              <m.div
                key={c.key}
                {...fadeUpOnScroll(i + 3)}
                style={{
                  flex: "1 1 300px",
                  backgroundColor: "var(--color-white-wash)",
                  border: "1px solid var(--color-white-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--text-lg)",
                      color: "var(--color-white)",
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-3xs)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-gold)",
                      border: "1px solid var(--color-gold-border)",
                      borderRadius: "var(--radius-xs)",
                      padding: "3px 8px",
                    }}
                  >
                    {COMPLIANCE_STATUS_LABELS[c.status].chip}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-subtle)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {c.body}
                </p>
              </m.div>
            ))}
          </div>

          <m.div
            {...fadeUpOnScroll(6)}
            style={{
              marginTop: "40px",
              padding: "22px 26px",
              backgroundColor: "var(--color-white-wash)",
              border: "1px solid var(--color-white-border)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-3xs)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
              }}
            >
              RESPONSIBLE DISCLOSURE
            </span>
            <p style={{ fontSize: "var(--text-md)", color: "var(--color-border)", margin: 0, lineHeight: 1.7 }}>
              Found a vulnerability?{" "}
              <Link
                href={contactHref("disclosure")}
                style={{ color: "var(--color-gold)", textDecoration: "none" }}
              >
                Submit a responsible-disclosure report
              </Link>
              . We triage {SECURITY_TRIAGE_TIME} and welcome good-faith
              research. A DPA and sub-processor list are available on request.
            </p>
          </m.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-bg)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-narrow-width)", margin: "0 auto" }}>
          <SectionIntro
            eyebrow="QUESTIONS YOUR SECURITY TEAM WILL ASK"
            eyebrowStyle={{
              marginBottom: "12px",
            }}
            title={
              <>
                Direct answers — the kind you&rsquo;ll want to forward to your CISO.
              </>
            }
            titleStyle={{
              fontWeight: 400,
              fontSize: "var(--text-heading-2xl)",
              lineHeight: 1.2,
              margin: "0 0 40px",
              maxWidth: "var(--measure)",
              letterSpacing: "0.01em",
            }}
            titleClassName="lg:!text-display-sm"
          />

          <div
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {SECURITY_FAQS.map((f, i) => (
              <m.details
                key={f.q}
                {...fadeUpOnScroll(i + 2)}
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                  padding: "18px 22px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    listStyle: "none",
                    fontSize: "var(--text-lg)",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {f.q}
                  <span style={{ color: "var(--color-gold-on-light)", fontSize: "var(--text-3xl)", lineHeight: 1 }} aria-hidden="true">
                    +
                  </span>
                </summary>
                <p
                  style={{
                    fontSize: "var(--text-md)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.7,
                    margin: "12px 0 0",
                  }}
                >
                  {f.a}
                </p>
              </m.details>
            ))}
          </div>

          <m.div
            {...fadeUpOnScroll(SECURITY_FAQS.length + 2)}
            style={{
              marginTop: "32px",
              padding: "22px 26px",
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Mail size={18} color="var(--color-gold)" strokeWidth={1.8} aria-hidden="true" />
              <div>
                <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                  Got a question we haven&rsquo;t answered?
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Talk directly with our team. {ENQUIRY_PROMISE}
                </div>
              </div>
            </div>
            <ButtonLink
              href={contactHref("security")}
              size="sm"
            >
              Book a security review
            </ButtonLink>
          </m.div>
        </div>
      </section>

      <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
