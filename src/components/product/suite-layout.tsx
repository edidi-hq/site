/**
 * ProductSuiteLayout — the shared template for the four suite pages
 * (`/product/spend`, `/oversight`, `/evidence`, `/infrastructure`).
 *
 * The navigation lists suites now, not modules, so this page carries the weight
 * the dropdown used to: it says what a group of modules is for, what they share,
 * and what each one adds on its own — then hands off to the module's own page.
 *
 * A SERVER component, deliberately, unlike `module-layout.tsx`, which is
 * "use client" because it animates on scroll and embeds interactive previews.
 * This page renders its prose on the server; only the shared hero backdrop
 * (its ambient glows) is a client island.
 *
 * Copy lives in `@/lib/product-suites`; nothing here is written inline, so the
 * lock test can hold a suite to having words for every module it contains.
 */

import Link from "next/link";

import { SUITES, moduleHref, suiteHref, moduleName, moduleShortName, type ModuleSuite } from "@/lib/brand";
import { MODULE_COPY } from "@/lib/module-copy";
import { notFound } from "next/navigation";
import { SUITE_PAGES } from "@/lib/product-suites";
import { fetchPricingData } from "@/lib/pricing";
import { advertisedModuleKeys, advertisedSuiteModuleKeys } from "@/lib/verified-claims";
import { JsonLd, breadcrumbSchema } from "@/lib/seo";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CtaBanner } from "@/components/sections/cta-banner";
import { SectionIntro } from "@/components/ui/section-intro";
import { ButtonLink } from "@/components/ui/button";
import { PRODUCT_HERO_CTAS } from "@/lib/product-hero-ctas";
import { SITE_ROUTES } from "@/lib/routes";
import { cssTransition } from "@/lib/animations";
import { Z_INDEX } from "@/lib/layers";

export async function ProductSuiteLayout({ suite }: { suite: ModuleSuite }) {
  const config = SUITE_PAGES[suite];
  const meta = SUITES.find((s) => s.key === suite)!;
  // No sign-off, no page: only signed-off modules are listed, and a suite with
  // none answers not-found (the menus drop it too — `advertisedSuiteKeys`).
  const pricingData = await fetchPricingData();
  const moduleKeys = advertisedSuiteModuleKeys(suite, advertisedModuleKeys(pricingData));
  const verifiedClaims = pricingData.verifiedClaims ?? [];
  const sharedPoints = config.shared.filter((point) =>
    (point.claims ?? []).every((key) => verifiedClaims.includes(key)),
  );
  if (moduleKeys.length === 0) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Platform", path: SITE_ROUTES.product },
          { name: meta.label, path: suiteHref(suite) },
        ])}
      />
      <Navbar />
      <main id="main">

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "var(--color-navy-primary)",
          padding: "120px 40px 96px",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {/* The page's own width, so the hero starts on the same left edge as
            every section below it (and as the module pages' heroes); the
            reading width only caps how far the words run. */}
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", position: "relative", zIndex: Z_INDEX.content }}>
          <div style={{ maxWidth: "var(--layout-reading-width)" }}>
          <SectionIntro
            surface="dark"
            reveal="none"
            eyebrow={meta.label}
            eyebrowStyle={{ marginBottom: "18px" }}
            titleAs="h1"
            title={config.headline}
            titleStyle={{ fontWeight: 700, fontSize: "var(--text-heading-3xl)", lineHeight: 1.18, margin: "0 0 22px" }}
            titleClassName="lg:!text-display-2xl"
            lede={config.description}
            ledeStyle={{
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-subtle)",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: "var(--measure)",
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "32px" }}>
            <ButtonLink href={PRODUCT_HERO_CTAS.primary.href}>{PRODUCT_HERO_CTAS.primary.label}</ButtonLink>
            <ButtonLink href={PRODUCT_HERO_CTAS.secondary.href} variant="secondary" surface="dark">
              {PRODUCT_HERO_CTAS.secondary.label} →
            </ButtonLink>
          </div>
          </div>
        </div>
      </section>

      {/* ── WHAT THEY SHARE ────────────────────────────────────────── */}
      {sharedPoints.length > 0 && (
      <section style={{ backgroundColor: "var(--color-bg)", padding: "88px 40px" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <h2
            style={{
              fontWeight: 400,
              fontSize: "var(--text-heading-xl)",
              color: "var(--color-text-primary)",
              lineHeight: 1.2,
              margin: "0 0 40px",
              letterSpacing: "0.01em",
            }}
            className="lg:!text-display-xs"
          >
            {config.sharedTitle}
          </h2>
          <div
            style={{
              display: "grid",
              gap: "20px",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {sharedPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div
                  key={point.title}
                  style={{
                    backgroundColor: "var(--color-white)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
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
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--text-2xl)",
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}
                  >
                    {point.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--text-md)",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {point.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ── WHAT EACH ONE ADDS ─────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--color-white)", padding: "88px 40px" }}>
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
          <h2
            style={{
              fontWeight: 400,
              fontSize: "var(--text-heading-xl)",
              color: "var(--color-text-primary)",
              lineHeight: 1.2,
              margin: "0 0 8px",
              letterSpacing: "0.01em",
            }}
            className="lg:!text-display-xs"
          >
            {moduleKeys.length === 1 ? "What it adds" : "What each one adds"}
          </h2>
          <p
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--color-text-muted)",
              margin: "0 0 40px",
              maxWidth: "var(--measure)",
            }}
          >
            Each is bought and switched on separately. Everything above is true of all of them.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {moduleKeys.map((key) => {
              const blurb = config.modules[key];
              // A module with no copy is a lock-test failure, not a blank card.
              if (!blurb) return null;
              const Icon = MODULE_COPY[key].icon;
              return (
                <Link
                  key={key}
                  href={moduleHref(key)}
                  style={{
                    backgroundColor: "var(--color-bg-light)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "28px",
                    display: "flex",
                    gap: "20px",
                    alignItems: "flex-start",
                    textDecoration: "none",
                    transition: cssTransition("border-color", "base"),
                  }}
                  className="hover:!border-[var(--color-gold-border-strong)]"
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-gold-tint)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontWeight: 600,
                        fontSize: "var(--text-3xl)",
                        color: "var(--color-text-primary)",
                        margin: "0 0 2px",
                      }}
                    >
                      {moduleName(key)}
                    </h3>
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-gold-on-light)",
                        margin: "0 0 10px",
                        fontWeight: 500,
                      }}
                    >
                      {blurb.claim}
                    </p>
                    <p
                      style={{
                        fontSize: "var(--text-md)",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.65,
                        margin: "0 0 12px",
                      }}
                    >
                      {blurb.body}
                    </p>
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      Explore {moduleShortName(key)}{" "}
                      &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <p
            style={{
              fontSize: "var(--text-md)",
              margin: "32px 0 0",
            }}
          >
            <Link href={SITE_ROUTES.product} style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
              See the whole platform &rarr;
            </Link>
          </p>
        </div>
      </section>

      </main>
      <CtaBanner />
      <Footer />
    </>
  );
}
