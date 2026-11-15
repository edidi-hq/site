import type { Metadata } from "next";
import { MODULE_STATUS_CHIP } from "@/lib/module-status-styles";
import Link from "next/link";
import {
  MODULE_STATUS_LABELS,
  MODULES,
  moduleHref,
  moduleShortName,
  SUITES,
  type ModuleKey,
  SITE_PAGES,
  BRAND,
} from "@/lib/brand";
import { MODULE_COPY } from "@/lib/module-copy";
import { numberInWords } from "@/lib/number-words";
import { fetchPricingData } from "@/lib/pricing";
import { advertisedModuleKeys, advertisedSuiteModuleKeys } from "@/lib/verified-claims";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CtaBanner } from "@/components/sections/cta-banner";
import { ButtonLink } from "@/components/ui/button";
import { SectionIntro } from "@/components/ui/section-intro";
import { pageMetadata } from "@/lib/seo";
import { START_TRIAL_CTA } from "@/lib/trial-terms";
import { SITE_ROUTES } from "@/lib/routes";
import { APPROVAL_LIFECYCLE, lifecycleStepNumber } from "@/lib/approval-lifecycle";
import { cssTransition } from "@/lib/animations";
import { Z_INDEX } from "@/lib/layers";

export const metadata: Metadata = pageMetadata({
  path: SITE_ROUTES.product,
  title: `The ${BRAND.name} platform — spend, oversight, evidence, on one record`,
  description: `${BRAND.name} structures how your organisation spends, who is allowed to approve it, and the record that proves what happened — four suites on one delegation-of-authority engine, one tamper-evident record.`,
  socialDescription: "Spend, Oversight, Evidence and Infrastructure — four suites sharing one approval engine and one tamper-evident record.",
});

export default async function ProductOverviewPage() {
  // Only signed-off modules are listed (`@/lib/verified-claims`).
  const advertised = advertisedModuleKeys(await fetchPricingData());
  // Only suites holding a signed-off module, counted from the data, never typed.
  const advertisedSuites = SUITES.filter((suite) => advertisedSuiteModuleKeys(suite.key, advertised).length > 0);
  const suiteCount = numberInWords(advertisedSuites.length);
  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "var(--color-navy-primary)",
          padding: "120px 40px 96px",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >

        <div
          style={{
            maxWidth: "var(--measure-wide)",
            margin: "0 auto",
            position: "relative",
            zIndex: Z_INDEX.content,
            textAlign: "center",
          }}
        >
          <SectionIntro
            surface="dark"
            reveal="none"
            eyebrow={`The ${BRAND.name} Platform`}
            eyebrowStyle={{ display: "inline-block", marginBottom: "20px" }}
            titleAs="h1"
            title={
              <>
                Spend, oversight, evidence. One approval engine. One tamper-evident
                record.
              </>
            }
            titleStyle={{ fontWeight: 700, fontSize: "var(--text-display-xs)", lineHeight: 1.15, margin: "0 0 24px" }}
            titleClassName="lg:!text-display-3xl"
            lede={
              <>
                {BRAND.name} is not a collection of unrelated tools — every financial
                decision, procurement action, and compliance event flows through
                one delegation-of-authority engine: routed to the
                right approver by amount, department, and risk, enforced
                automatically, and provable on the same tamper-evident record.
              </>
            }
            ledeStyle={{
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-subtle)",
              lineHeight: 1.7,
              margin: "0 auto 36px",
              maxWidth: "var(--measure)",
            }}
          />
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <ButtonLink href={SITE_PAGES.trial()}>{START_TRIAL_CTA}</ButtonLink>
            <ButtonLink href={SITE_ROUTES.howItWorks} variant="secondary" surface="dark">
              See how it works →
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── MODULE GRID ─────────────────────────────────────────────── */}
      {advertisedSuites.length > 0 && (
      <section style={{ backgroundColor: "var(--color-white)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <SectionIntro
            reveal="none"
            eyebrow={`THE ${suiteCount.toUpperCase()} ${advertisedSuites.length === 1 ? "SUITE" : "SUITES"}`}
            eyebrowStyle={{ marginBottom: "12px" }}
            title={`${suiteCount.charAt(0).toUpperCase()}${suiteCount.slice(1)} ${advertisedSuites.length === 1 ? "suite" : "suites"}. Each module in them does one thing, precisely.`}
            titleStyle={{
              fontWeight: 400,
              fontSize: "var(--text-heading-2xl)",
              lineHeight: 1.2,
              margin: "0 0 48px",
              maxWidth: "var(--measure-narrow)",
              letterSpacing: "0.01em",
            }}
            titleClassName="lg:!text-display-sm"
          />

          {advertisedSuites.map((suite) => {
            const modules = advertisedSuiteModuleKeys(suite.key, advertised);
            // A suite with nothing signed off renders nothing — no heading over an empty row.
            if (modules.length === 0) return null;
            return (
              <div key={suite.key} style={{ marginBottom: "56px" }}>
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "var(--text-heading-xs)",
                    color: "var(--color-text-primary)",
                    margin: "0 0 4px",
                    letterSpacing: "0.01em",
                  }}
                >
                  {suite.label}
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-md)",
                    color: "var(--color-text-muted)",
                    margin: "0 0 20px",
                    maxWidth: "var(--measure-narrow)",
                  }}
                >
                  {suite.blurb}
                </p>
                {/* auto-fit, not a fixed 3-up: suites hold different numbers of
                    modules, so a fixed three-column grid would leave the smaller
                    ones part-empty. auto-fit stretches whatever a suite has
                    across the full width. */}
                <div
                  style={{
                    display: "grid",
                    gap: "20px",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  }}
                >
                  {modules.map((moduleKey) => (
                    <ModuleCard key={moduleKey} moduleKey={moduleKey} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* ── PLATFORM RHYTHM (how modules share the engine) ─────────── */}
      <section style={{ backgroundColor: "var(--color-bg)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-narrow-width)", margin: "0 auto" }}>
          <SectionIntro
            reveal="none"
            eyebrow="ONE AUTHORITY ENGINE"
            eyebrowStyle={{ marginBottom: "12px" }}
            title="Every module runs on one delegation-of-authority engine."
            titleStyle={{
              fontWeight: 400,
              fontSize: "var(--text-heading-2xl)",
              lineHeight: 1.25,
              margin: "0 0 24px",
              letterSpacing: "0.01em",
            }}
            titleClassName="lg:!text-display-sm"
            lede={<>
            A payment voucher, a purchase order, a grant disbursement, and a
            vendor onboarding all travel the same authority engine: routed to the right
            approver by amount, department, and risk → enforced with no way
            around it → recorded on a tamper-evident trail. Define once who can
            approve what, up to how much, and under which conditions — every
            module obeys it. And for any decision, {BRAND.name} shows exactly which
            rule applied and can prove what policy governed it, years later.
            </>}
            ledeStyle={{ fontSize: "var(--text-xl)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: "var(--measure)" }}
          />

          <div
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-card)",
              padding: "32px",
              display: "grid",
              // One track per stage when they fit, so the strip fills the width at any stage count.
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "24px",
            }}
          >
            {APPROVAL_LIFECYCLE.map((stage, index) => (
              <div key={stage.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontFeatureSettings: '"tnum" 1',
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "var(--color-gold-on-light)",
                  }}
                >
                  {lifecycleStepNumber(index)}
                </span>
                <h4
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  {stage.title}
                </h4>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {stage.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
      <Footer />
    </>
  );
}

/**
 * One module card. Extracted when the grid became four suite sections — the
 * card is identical in every suite, so it is a component rather than the same
 * hundred lines repeated per bucket.
 */
function ModuleCard({ moduleKey }: { moduleKey: ModuleKey }) {
  const { icon: Icon, tagline, summary } = MODULE_COPY[moduleKey];
  const { name, status } = MODULES[moduleKey];
  const badge = MODULE_STATUS_CHIP.light[status];
  return (
    <Link
      href={moduleHref(moduleKey)}
      style={{
        backgroundColor: "var(--color-bg-light)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        textDecoration: "none",
        transition: cssTransition(["border-color", "transform"], "base"),
      }}
      className="hover:!border-[var(--color-gold-border-strong)]"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-gold-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
        </div>
        <span
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: badge.color,
            backgroundColor: badge.bg,
            border: badge.border,
            borderRadius: "var(--radius-xs)",
            padding: "3px 8px",
          }}
        >
          {MODULE_STATUS_LABELS[status]}
        </span>
      </div>

      <div>
        <h3
          style={{
            fontWeight: 600,
            fontSize: "var(--text-3xl)",
            color: "var(--color-text-primary)",
            margin: "0 0 2px",
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-gold-on-light)",
            margin: 0,
            fontWeight: 500,
          }}
        >
          {tagline}
        </p>
      </div>

      <p
        style={{
          fontSize: "var(--text-md)",
          color: "var(--color-text-muted)",
          lineHeight: 1.65,
          margin: 0,
          flex: 1,
        }}
      >
        {summary}
      </p>

      <span
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--color-text-primary)",
          marginTop: "4px",
        }}
      >
        Explore {moduleShortName(moduleKey)} →
      </span>
    </Link>
  );
}
