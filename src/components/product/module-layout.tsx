"use client";

/**
 * ProductModuleLayout — shared template for every module product
 * page (Payables / Procurement / Records / Compliance / Integrity / Grants / Integrations). Each page passes
 * a `ModuleConfig` and the layout handles hero, pillars, platform preview,
 * use cases, plan availability, and related modules in a consistent shell.
 *
 * Visual language follows the landing page:
 *   - Dark navy hero with ambient glows + scroll-parallax grid
 *   - Browser-framed real-UI preview
 *   - Light content sections with fade-up entrance
 */

import { MODULE_STATUS_CHIP } from "@/lib/module-status-styles";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  MODULE_STATUS_LABELS,
  MODULES,
  isModulePublic,
  moduleHref,
  moduleName,
  type ModuleKey,
  type ModuleStatus,
} from "@/lib/brand";
import { JsonLd, breadcrumbSchema } from "@/lib/seo";
import { ArrowRight } from "lucide-react";
import { m } from "framer-motion";
import { BrowserFrame, appCaption } from "./previews/preview-primitives";
import { fadeUpOnScroll, cssTransition } from "@/lib/animations";
import { Eyebrow, SectionIntro } from "@/components/ui/section-intro";
import { ButtonLink } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CtaBanner } from "@/components/sections/cta-banner";
import { PRODUCT_HERO_CTAS } from "@/lib/product-hero-ctas";
import { contactHref } from "@/app/contact/tabs";
import type { PlanFeatureKey } from "@edidi-hq/core/billing/features";
import { EVERY_PLAN_NOTE, planScopeNote, type FeaturePlans } from "@/lib/plan-names";
import { SITE_ROUTES } from "@/lib/routes";
import { Z_INDEX } from "@/lib/layers";
import { cardGridProps } from "@/lib/card-grid";

/**
 * Which plans a card's capability is on. `planFeature` names the plan feature
 * that gates it, and the layout says which plans carry it, from the pricing
 * API — unless that is exactly the module's own plans, which the table already
 * shows. `everyPlan` marks a capability no feature gates, so it is on every plan
 * the module is; say it only where it is worth stressing.
 */
interface PlanScoped {
  planFeature?: PlanFeatureKey;
  everyPlan?: true;
}

export interface ModulePillar extends PlanScoped {
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface ModuleUseCase extends PlanScoped {
  title: string;
  body: string;
}

export interface ModulePlan {
  plan: string;
  included: boolean;
  note?: string;
  /** The trial row, which is not a plan of its own. */
  isTrial?: boolean;
}

/** Each item's body with its plan sentence appended, where one says something the table does not. */
function withPlanScope<Item extends PlanScoped & { body: string }>(
  items: Item[],
  featurePlans: FeaturePlans,
  planAvailability: ModulePlan[],
): Item[] {
  const planRows = planAvailability.filter((row) => !row.isTrial);
  const allPlanNames = planRows.map((row) => row.plan);
  const modulePlanNames = planRows.filter((row) => row.included).map((row) => row.plan);
  const sameSet = (left: readonly string[], right: readonly string[]) =>
    left.length === right.length && left.every((name) => right.includes(name));
  return items.map((item) => {
    let note = "";
    if (item.everyPlan) note = EVERY_PLAN_NOTE;
    else if (item.planFeature) {
      const names = featurePlans[item.planFeature] ?? [];
      if (!sameSet(names, modulePlanNames)) note = planScopeNote(names, allPlanNames);
    }
    return note ? { ...item, body: `${item.body} ${note}` } : item;
  });
}

export interface ModuleRelated {
  moduleKey: ModuleKey;
  /** How that module completes this one — the name and link come from the key. */
  desc: string;
}

/**
 * A module page's own words. Its name, status, link and breadcrumb all follow
 * from `moduleKey`, so a page cannot disagree with the catalogue about any of them.
 */
export interface ModuleConfig {
  moduleKey: ModuleKey;
  headline: string;
  description: string;
  /** Caption path above the preview frame, after the brand name: `vouchers / new`. */
  previewPath: string;
  /** React node for the browser-frame preview. Rendered inside a `BrowserFrame`. */
  preview: React.ReactNode;
  pillars: ModulePillar[];
  useCases: ModuleUseCase[];
  relatedModules: ModuleRelated[];
  /** Overrides the default CTA based on status. */
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

function StatusRibbon({ status }: { status: ModuleStatus }) {
  const style = MODULE_STATUS_CHIP.dark[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: style.color,
        backgroundColor: style.bg,
        border: style.border,
        borderRadius: "var(--radius-xs)",
        padding: "4px 10px",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "var(--radius-circle)",
          backgroundColor: style.color,
          display: "inline-block",
        }}
      />
      {MODULE_STATUS_LABELS[status]}
    </span>
  );
}

function resolveCtas(config: ModuleConfig, status: ModuleStatus): {
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
} {
  if (status === "partial") {
    return {
      primary: config.primaryCta ?? { label: "Join the beta", href: contactHref("beta") },
      secondary: config.secondaryCta ?? { label: "Talk to us", href: contactHref() },
    };
  }
  return {
    primary: config.primaryCta ?? PRODUCT_HERO_CTAS.primary,
    secondary: config.secondaryCta ?? PRODUCT_HERO_CTAS.secondary,
  };
}

/**
 * What the pricing API says about a module page — which plans include the
 * module, and which plans carry each plan feature. Every module route builds it
 * with `modulePageData(key, pricingData)`; never written by hand.
 */
export interface ModulePageData {
  planAvailability: ModulePlan[];
  featurePlans: FeaturePlans;
  /** Claim keys with a fresh production sign-off (`@/lib/verified-claims`). */
  verifiedClaims: readonly string[];
}

/**
 * The claim a card makes: the plan feature it names, else the page's own
 * module — a card naming no feature describes the module's core capability.
 */
export function cardClaim(item: PlanScoped, moduleKey: ModuleKey): string {
  return item.planFeature ?? moduleKey;
}

/** A module page: its own words (`config`) plus the derived `ModulePageData`. */
export function ProductModuleLayout({
  config,
  planAvailability,
  featurePlans,
  verifiedClaims,
}: ModulePageData & { config: ModuleConfig }) {
  // We advertise only what production is signed off on: a card shows only while its claim is.
  const isShown = (item: PlanScoped) => verifiedClaims.includes(cardClaim(item, config.moduleKey));
  const pillars = withPlanScope(config.pillars.filter(isShown), featurePlans, planAvailability);
  const useCases = withPlanScope(config.useCases.filter(isShown), featurePlans, planAvailability);
  const { name, status } = MODULES[config.moduleKey];
  const { primary, secondary } = resolveCtas(config, status);
  // A related module is linked only while it is advertised (public and signed off).
  const relatedModules = config.relatedModules.filter(
    (related) => isModulePublic(related.moduleKey) && verifiedClaims.includes(related.moduleKey),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Platform", path: SITE_ROUTES.product },
          { name, path: moduleHref(config.moduleKey) },
        ])}
      />
      <Navbar />
      <main id="main">

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
            maxWidth: "var(--layout-max-width)",
            margin: "0 auto",
            display: "grid",
            gap: "56px",
            alignItems: "center",
            position: "relative",
            zIndex: Z_INDEX.content,
          }}
          className="grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.1fr)]"
        >
          {/* Left: copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Eyebrow surface="dark" reveal="scroll">
              {name}
            </Eyebrow>

            <m.div
              {...fadeUpOnScroll(1)}
            >
              <StatusRibbon status={status} />
            </m.div>

            <m.h1
              {...fadeUpOnScroll(2)}
              style={{
                fontWeight: 700,
                fontSize: "var(--text-heading-3xl)",
                color: "var(--color-white)",
                lineHeight: 1.15,
                margin: 0,
              }}
              className="lg:!text-display-2xl"
            >
              {config.headline}
            </m.h1>

            <m.p
              {...fadeUpOnScroll(3)}
              style={{
                fontWeight: 400,
                fontSize: "var(--text-2xl)",
                color: "var(--color-text-subtle)",
                lineHeight: 1.7,
                margin: 0,
                maxWidth: "var(--measure-tight)",
              }}
            >
              {config.description}
            </m.p>

            <m.div
              {...fadeUpOnScroll(4)}
              style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}
            >
              <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
              <ButtonLink href={secondary.href} variant="secondary" surface="dark">
                {secondary.label} →
              </ButtonLink>
            </m.div>
          </div>

          {/* Right: preview */}
          <m.div {...fadeUpOnScroll(4)}>
            <BrowserFrame caption={appCaption(config.previewPath)} surface="dark">
              {config.preview}
            </BrowserFrame>
          </m.div>
        </div>
      </section>

      {/* ── PILLARS ──────────────────────────────────────────────────── */}
      {pillars.length > 0 && (
      <section style={{ backgroundColor: "var(--color-white)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <SectionIntro
            eyebrow="CAPABILITIES"
            eyebrowStyle={{ marginBottom: "12px" }}
            title="What this module does for your organisation."
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

          <div {...cardGridProps(pillars.length, { max: 2 }, { gap: "20px" })}>
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <m.div
                  key={pillar.title}
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
                    {pillar.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--text-md)",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {pillar.body}
                  </p>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ── USE CASES ────────────────────────────────────────────────── */}
      {useCases.length > 0 && (
      <section style={{ backgroundColor: "var(--color-bg)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <SectionIntro
            eyebrow="OUTCOMES"
            eyebrowStyle={{ marginBottom: "12px" }}
            title="What changes operationally."
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

          {/* An odd last card spans both columns, so the row fills the width at any count. */}
          <div
            style={{ display: "grid", gap: "16px" }}
            className="grid-cols-1 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2"
          >
            {useCases.map((uc, i) => (
              <m.div
                key={uc.title}
                {...fadeUpOnScroll(i + 2)}
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  {uc.title}
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-md)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {uc.body}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── PLAN AVAILABILITY + RELATED MODULES ──────────────────────── */}
      <section style={{ backgroundColor: "var(--color-white)", padding: "100px 40px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <div
          style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", display: "grid", gap: "48px" }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Plans */}
          <m.div
            {...fadeUpOnScroll()}
          >
            <SectionIntro
              reveal="none"
              eyebrow="AVAILABILITY"
              eyebrowStyle={{ marginBottom: "12px" }}
              titleAs="h3"
              title="Included in these plans."
              titleStyle={{ fontWeight: 400, fontSize: "var(--text-heading-md)", margin: "0 0 24px" }}
            />
            <div
              style={{
                backgroundColor: "var(--color-bg-light)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {planAvailability.map((p, i) => (
                <div
                  key={p.plan}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "14px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-md)",
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      flexShrink: 0,
                    }}
                  >
                    {p.plan}
                  </span>
                  {p.included ? (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        color: "var(--color-success)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "var(--radius-circle)",
                          backgroundColor: "var(--color-success)",
                        }}
                      />
                      {p.note ?? "Included"}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-subtle)",
                      }}
                    >
                      {p.note ?? "Not included"}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Link
              href={SITE_ROUTES.pricing}
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--color-gold-on-light)",
                textDecoration: "none",
                marginTop: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              See full pricing <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </m.div>

          {/* Related modules */}
          <m.div
            {...fadeUpOnScroll(1)}
          >
            <SectionIntro
              reveal="none"
              eyebrow="PAIRS WELL WITH"
              eyebrowStyle={{ marginBottom: "12px" }}
              titleAs="h3"
              title="Other modules that complete the picture."
              titleStyle={{ fontWeight: 400, fontSize: "var(--text-heading-md)", margin: "0 0 24px" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {relatedModules.map((related) => (
                <Link
                  key={related.moduleKey}
                  href={moduleHref(related.moduleKey)}
                  style={{
                    backgroundColor: "var(--color-bg-light)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px 18px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    transition: cssTransition(["border-color", "background-color"]),
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "var(--text-md)",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        margin: "0 0 2px",
                      }}
                    >
                      {moduleName(related.moduleKey)}
                    </p>
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        margin: 0,
                      }}
                    >
                      {related.desc}
                    </p>
                  </div>
                  <ArrowRight size={16} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </m.div>
        </div>
      </section>

      <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
