"use client";

/**
 * IntegrationsCataloguePage — /product/integrations. Replaces the stub
 * with an honest catalogue of what connects today, what's coming, and
 * what we'll build for enterprise engagements. Availability labels map
 * to the platform's actual capability, not marketing ambition.
 */

import { PLAN_ORDER } from "@edidi-hq/core/billing/catalog";
import { PLAN_CAPACITY } from "@edidi-hq/core/billing/capacity";
import type { PlanFeatureKey } from "@edidi-hq/core/billing/features";
import { planScopeNote, type FeaturePlans } from "@/lib/plan-names";
import Link from "next/link";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  KeyRound,
  UserCog,
  MessagesSquare,
  Receipt,
  Landmark,
  Webhook,
  ArrowRight,
} from "lucide-react";
import { fadeUpOnScroll, fadeUpOnLoad } from "@/lib/animations";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { contactHref } from "@/app/contact/tabs";
import { ACCESS_ENDS } from "@/lib/compliance-posture";
import { ButtonLink } from "@/components/ui/button";
import { SectionIntro } from "@/components/ui/section-intro";
import { Z_INDEX } from "@/lib/layers";

/**
 * What a webhook can tell you about, in plain words — families of events, not
 * their exact names. The exact names and an example payload for each are API
 * documentation, which the product serves; a marketing page does not repeat it.
 */
const WEBHOOK_EVENT_GROUPS: ReadonlyArray<{ name: string; detail: string }> = [
  { name: "Payments and orders", detail: "Each step of a payment voucher or purchase order, from submission to the bank: submitted, queried, returned, approved, sanctioned, ready for the bank — and a payment the bank sends back." },
  { name: "People and roles", detail: "Invited, activated, role changed, deactivated, access expired." },
  { name: "Suppliers", detail: "Added, updated, bank details changed, deactivated." },
  { name: "Goods received", detail: "Each goods received note as it is recorded." },
  { name: "Delegations", detail: "Cover set up for an absence, and ended." },
  { name: "Privacy requests", detail: "Each step of a data-subject request." },
];


// Only what ships is listed. Unbuilt "talk to us" items, banking connectors and
// the custom-connector offer were removed: the page names nothing the product
// does not do today (`integrations-claims.lock.test.ts`). So there is no
// per-row "Available" badge — the hero says everything here is available.
interface Integration {
  name: string;
  summary: string;
}

interface Category {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lede: string;
  /** Plan feature that gates this category; its plans are named after the lede. */
  planFeature?: PlanFeatureKey;
  integrations: Integration[];
}

/** WhatsApp and SMS ride every plan's monthly message allowance (core's capacity), so say so only while every plan has one. */
const MESSAGING_ON_EVERY_PLAN = PLAN_ORDER.every((planKey) => PLAN_CAPACITY[planKey].monthlyMessageCap > 0);

const CATEGORIES: Category[] = [
  {
    id: "identity",
    icon: KeyRound,
    eyebrow: "IDENTITY & SINGLE SIGN-ON",
    title: "Sign in with the identity provider you already run.",
    lede:
      `${BRAND.name} speaks the standard identity protocols — OpenID Connect and SAML 2.0 — with no per-provider hacks. Sessions, revocation, and MFA all work the same whether you're on Okta, Entra, or Google Workspace, and each person keeps one sign-in across every company they work in.`,
    planFeature: "sso",
    integrations: [
      { name: "Single sign-on", summary: "Any SAML 2.0 or OpenID Connect identity provider — tested with Okta, Microsoft Entra ID and Google Workspace." },
      { name: "Required single sign-on", summary: "Make your identity provider the way your people sign in, with a password kept for administrators." },
      { name: "One provider for a group", summary: "Companies in a group can accept the sign-in of the group's identity provider." },
    ],
  },
  {
    id: "provisioning",
    icon: UserCog,
    eyebrow: "DIRECTORY PROVISIONING",
    title: "Users flow from your IdP — and leave when they should.",
    lede:
      `SCIM 2.0 keeps ${BRAND.name} in sync with your directory. Add a user in Okta, they land here. Mark them inactive, their session is revoked ${ACCESS_ENDS}. Directory groups can ask for roles — but beyond basic staff access, a person in your organisation approves each one first.`,
    planFeature: "sso",
    integrations: [
      { name: "Automatic user provisioning", summary: "SCIM 2.0 creates, updates and deactivates people from Okta or Microsoft Entra ID." },
      { name: "Groups mapped to roles", summary: "Directory groups request roles; anything beyond staff waits for a person to approve it." },
    ],
  },
  {
    id: "notifications",
    icon: MessagesSquare,
    eyebrow: "NOTIFICATIONS",
    title: "Approvers hear about requests wherever they already look.",
    lede:
      "Every stage of the approval lifecycle can dispatch to the channels your approvers actually check. Multi-channel by default, all tracked to the audit trail.",
    integrations: [
      { name: "Email (transactional)", summary: "Approval-quality emails with deep links, delivered by an enterprise-grade email provider." },
      { name: "WhatsApp", summary: `Approval alerts with a secure review link${MESSAGING_ON_EVERY_PLAN ? ", on every plan" : ""}.` },
      { name: "SMS", summary: "Critical alerts to Nigerian and international numbers." },
      { name: "In-app inbox", summary: "Live badge + typed workspace inbox on every page." },
    ],
  },
  {
    id: "accounting",
    icon: Receipt,
    eyebrow: "ACCOUNTING & ERP",
    title: "Approved spending lands in your ledger, coded your way.",
    lede:
      `Vouchers and order lines carry your own accounting codes, and approved vouchers and payments become balanced journal entries in a file your accounting system imports — each entry exported once, so nothing is posted twice. Use a ready-made layout where your system has one; any other ledger takes the standard CSV, and plans with API access can also read the entries over our API.`,
    planFeature: "budgetCodes",
    integrations: [
      { name: "Your chart of accounts", summary: "Accounts, cost centres, projects and funds on every voucher and order line." },
      { name: "QuickBooks Online", summary: "Journal entries in QuickBooks Online's import layout." },
      { name: "Zoho Books", summary: "Journal entries in Zoho Books' manual-journal import." },
      { name: "Sage Accounting", summary: "Journal entries in Sage Accounting's journal import template." },
      { name: "Any other ledger", summary: "A standard CSV journal with every field, plus period exports with the approval trail on each line." },
    ],
  },
  {
    id: "banking",
    icon: Landmark,
    eyebrow: "BANKING",
    title: "Bank letters and payment files, in your bank's own scheme.",
    lede:
      "Every sanctioned voucher produces a formally formatted bank letter with the MD's signature, and approved payments go out as a payment file in your bank's own scheme — upload it, and the money moves on your rails.",
    integrations: [
      { name: "Bank-ready PDF letter", summary: "Per-voucher letter with MD signature + letterhead." },
      { name: "NIBSS Direct Credit", summary: "Naira batch files accepted by most Nigerian banks, plus GTBank and Access Bank portal imports." },
      { name: "International payment files", summary: "SEPA (euro, ISO 20022), Bacs Standard 18 (sterling) and ACH NACHA (US dollar) files." },
    ],
  },
  {
    id: "developer",
    icon: Webhook,
    eyebrow: "DEVELOPER PLATFORM",
    title: "Build on top of your approval record.",
    lede:
      "A read-access REST API exposes your payment vouchers, purchase orders, users, vendors, budgets, accounting codes, journal entries, audit events and spending summaries, with webhooks for each step of a payment or order, changes to people and suppliers, and every entry in your audit trail. Each API key permission opens exactly the endpoints it names, and long lists come back a page at a time.",
    planFeature: "apiAccess",
    integrations: [
      { name: "REST API (v1)", summary: "Read access to vouchers, orders, users, vendors, budgets, journal entries, audit events and spending summaries." },
      { name: "Webhooks", summary: "Per-tenant event subscriptions with retries, signed to the Standard Webhooks scheme." },
    ],
  },
];

function CategoryBlock({ category, index, planNote }: { category: Category; index: number; planNote: string }) {
  const Icon = category.icon;
  return (
    <m.section
      {...fadeUpOnScroll()}
      id={category.id}
      style={{ scrollMarginTop: "90px", position: "relative", overflow: "hidden", isolation: "isolate" }}
    >
      <div style={{ display: "grid", gap: "40px", alignItems: "start" }} className="grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-card)",
                backgroundColor: "var(--color-gold-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={18} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-2xs)",
                color: "var(--color-gold-on-light)",
                letterSpacing: "0.08em",
              }}
            >
              {String(index + 1).padStart(2, "0")} · {category.eyebrow}
            </span>
          </div>
          <h2
            style={{
              fontWeight: 400,
              fontSize: "var(--text-heading-md)",
              color: "var(--color-text-primary)",
              lineHeight: 1.25,
              margin: "0 0 12px",
              letterSpacing: "0.01em",
            }}
            className="lg:!text-heading-xl"
          >
            {category.title}
          </h2>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-muted)", lineHeight: 1.7, margin: 0, maxWidth: "var(--measure-compact)" }}>
            {category.lede}
            {planNote ? ` ${planNote}` : null}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {category.integrations.map((integration, i) => (
            <div
              key={integration.name}
              style={{
                padding: "18px 22px",
                borderTop: i === 0 ? "none" : "1px solid var(--color-bg)",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {integration.name}
                  </span>
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.55, margin: 0 }}>
                  {integration.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </m.section>
  );
}

/** `featurePlans` and `allPlanNames` come from the pricing API through the route. SCIM
 *  provisioning rides on `sso`; the chart of accounts and journal export on `budgetCodes`. */
export function IntegrationsCataloguePage({
  featurePlans,
  allPlanNames,
}: {
  featurePlans: FeaturePlans;
  allPlanNames: string[];
}) {

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
            reveal="load"
            titleAs="h1"
            eyebrow="INTEGRATIONS"
            eyebrowStyle={{
              display: "inline-block",
              marginBottom: "20px",
            }}
            title={`${BRAND.name} plugs into the stack you already run.`}
            titleStyle={{
              fontWeight: 700,
              fontSize: "var(--text-display-xs)",
              lineHeight: 1.15,
              margin: "0 0 24px",
            }}
            titleClassName="lg:!text-display-4xl"
            lede={
              <>
                Identity, provisioning, notifications, accounting, banking, and a
                first-class developer platform. Everything listed here is available
                today.
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
            {...fadeUpOnLoad(3)}
            style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <ButtonLink
              href="#identity"
              size="md"
            >
              Explore the catalogue
            </ButtonLink>
          </m.div>
        </div>
      </section>

      {/* ── CATEGORY NAV ───────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-white)", padding: "40px 40px", borderBottom: "1px solid var(--color-border)", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div
          style={{
            maxWidth: "var(--layout-max-width)",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-3xs)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            Jump to:
          </span>
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`#${c.id}`}
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg-light)",
              }}
            >
              {c.eyebrow.split(" & ")[0].toLowerCase().replace(/^\w/, (ch) => ch.toUpperCase())}
            </Link>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ─────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-bg-light)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "88px" }}>
          {CATEGORIES.map((c, i) => (
            <CategoryBlock
              key={c.id}
              category={c}
              index={i}
              planNote={c.planFeature ? planScopeNote(featurePlans[c.planFeature] ?? [], allPlanNames) : ""}
            />
          ))}
        </div>
      </section>

      {/* ── DEV TEASER ─────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-white)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <div style={{ display: "grid", gap: "48px", alignItems: "center" }} className="grid-cols-1 lg:grid-cols-2">
            <m.div
              {...fadeUpOnScroll()}
            >
              <SectionIntro
                reveal="none"
                eyebrow="DEVELOPER PLATFORM"
                eyebrowStyle={{
                  marginBottom: "12px",
                }}
                title="Each step of a payment or order is an event you can subscribe to."
                titleStyle={{
                  fontWeight: 400,
                  fontSize: "var(--text-heading-xl)",
                  lineHeight: 1.2,
                  margin: "0 0 14px",
                  letterSpacing: "0.01em",
                }}
                titleClassName="lg:!text-heading-3xl"
              />
              <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-muted)", lineHeight: 1.75, margin: "0 0 16px" }}>
                Webhooks signed to the Standard Webhooks scheme, a documented
                example for every event, and automatic retries with growing gaps
                that keep the same delivery id, so you can safely ignore repeats. Build the notifications your
                team actually wants, or sync sanctioned vouchers to your ledger
                the second the MD signs.
              </p>
              <p style={{ fontSize: "var(--text-md)", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 24px" }}>
                Enterprise administrators open the full API reference from
                inside the app.
              </p>
              <Link
                href={contactHref("demo")}
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--color-gold-on-light)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Request API access <ArrowRight size={13} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </m.div>

            <m.div
              {...fadeUpOnScroll(1)}
              style={{
                backgroundColor: "var(--color-navy-primary)",
                borderRadius: "var(--radius-lg)",
                padding: "22px",
                boxShadow: "0 20px 50px rgba(var(--color-navy-primary-rgb), 0.18)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-3xs)",
                  color: "var(--color-text-subtle)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: "0 0 6px",
                }}
              >
                What you can subscribe to
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {WEBHOOK_EVENT_GROUPS.map((group, index) => (
                  <li
                    key={group.name}
                    style={{
                      padding: "14px 0",
                      borderTop: index === 0 ? "none" : "1px solid rgba(var(--color-neutral-tint-rgb), 0.12)",
                    }}
                  >
                    <span style={{ display: "block", fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-white)", marginBottom: "3px" }}>
                      {group.name}
                    </span>
                    <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--color-text-subtle)", lineHeight: 1.55 }}>
                      {group.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </m.div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </>
  );
}
