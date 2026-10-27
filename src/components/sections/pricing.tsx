"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { fadeUpOnScroll, cssTransition } from "@/lib/animations";
import { ButtonLink } from "@/components/ui/button";
import { SectionIntro } from "@/components/ui/section-intro";
import Link from "next/link";
import type {
  PricingData,
  Plan,
  PlanModule,
  PricingCurrency,
} from "@/lib/pricing";
import { formatCurrencyAmount } from "@/lib/money";
import { EVERY_PLAN_LEAD } from "@/lib/plan-names";
import { TRUST_SIGNALS } from "@/lib/compliance-posture";
import { priceTaxNote } from "@/lib/price-tax";
import { BRAND, isModulePublic, moduleShortNameFor, SITE_PAGES } from "@/lib/brand";
import { formatEnglishList } from "@/lib/english-list";
import { ANNUAL_BILLED_MONTHS, PLAN_CATALOG, PLAN_ORDER } from "@edidi-hq/core/billing/catalog";
import { READ_ONLY_GRACE_DAYS, TRIAL_DURATION_DAYS, TRIAL_PLAN, TRIAL_PLAN_NAME, TRIAL_SEAT_CAP, TRIAL_STORAGE, NO_CARD_REQUIRED } from "@/lib/trial-terms";
import { contactHref } from "@/app/contact/tabs";
import { LEAD_CURRENCY, startingCurrency } from "@/lib/market";
import { useVisitorCountry } from "@/lib/hooks/use-visitor-country";
import { ChoiceGroup } from "@/components/ui/form/choice-group";
import { SITE_ROUTES } from "@/lib/routes";
import { Z_INDEX } from "@/lib/layers";
import { cardGridProps } from "@/lib/card-grid";

type BillingCycle = "monthly" | "annual";

/** The plan the card row features — core's recommended tier, never a typed key. */
const FEATURED_PLAN = PLAN_ORDER.find((key) => PLAN_CATALOG[key].recommended);

/** API module names carry the brand ("<brand> Payables"); cards show the bare name. */

/** Months an annual plan does not charge for ("2 months free"), from core. */
const ANNUAL_FREE_MONTHS = 12 - ANNUAL_BILLED_MONTHS;
const ANNUAL_TOGGLE_LABEL = `Annual · ${ANNUAL_FREE_MONTHS} ${ANNUAL_FREE_MONTHS === 1 ? "month" : "months"} free`;

/* ── Helpers ─────────────────────────────────────────────────── */

function getPriceForCurrency(
  plan: Plan,
  currencyCode: string,
): PricingCurrency | undefined {
  return plan.pricing.find((p) => p.currency === currencyCode);
}

function getAvailableCurrencies(data: PricingData): string[] {
  const first = data.plans[0];
  if (!first) return [LEAD_CURRENCY];
  return first.pricing.map((p) => p.currency);
}

function getHighlights(plan: Plan): string[] {
  return plan.highlights ?? [];
}

/**
 * The Trial card is a marketing construct, not a plan — the server's truth is
 * `subscriptionStatus === "trial"` on a tenant whose plan is the trial plan.
 * Its terms come from the API's `trial` block where it has one (the product's
 * live answer) and from core's constants otherwise; nothing here is typed in.
 *
 * Deltas only — the module scope is the card's badge, and the watermark + grace
 * detail lives in the footnote below the CTA (no repetition).
 */
function trialHighlights(planName: string, seatCap: number): string[] {
  return [
    `Full ${planName} tier — switched on, not a sandbox`,
    `Up to ${seatCap} users, ready to invite`,
    "Bank-ready PDF exports (trial watermark)",
    `${TRIAL_STORAGE} storage during trial`,
  ];
}

/* ── Component ───────────────────────────────────────────────── */

interface PricingProps {
  data: PricingData;
  /** Section-title tag. "h1" on the standalone /pricing page (its main
   *  heading); defaults to "h2" when embedded as a section on the home page,
   *  which already has its own page h1. */
  headingAs?: "h1" | "h2";
}

export function Pricing({ data, headingAs = "h2" }: PricingProps) {
  // Default to annual — the higher-value cycle we already frame as "N months
  // free". The card keeps the monthly-equivalent and annual total visible so
  // the default informs rather than tricks.
  const [billing, setBilling] = useState<BillingCycle>("annual");

  const currencies = getAvailableCurrencies(data);
  // Opens in the lead currency (the page is pre-built), then in the visitor's
  // own once the site says where they are — unless they have already chosen.
  // Asked only when there is a currency to choose between.
  const visitorCountry = useVisitorCountry(currencies.length > 1);
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  const currency = chosenCurrency ?? startingCurrency(visitorCountry, currencies);

  // Contrast / anchoring: render plans in ascending price so the premium tier
  // (Enterprise) sits to the right of the featured plan and anchors it — the
  // standard, honest three-tier layout. Deterministic regardless of API order.
  const orderedPlans = (
    data.planOrder
      .map((key) => data.plans.find((p) => p.key === key))
      .filter(Boolean) as Plan[]
  ).sort((a, b) => {
    const pa = getPriceForCurrency(a, currency)?.monthly ?? Infinity;
    const pb = getPriceForCurrency(b, currency)?.monthly ?? Infinity;
    return pa - pb;
  });

  // The universal engine every plan runs on (the API's `platformModules` =
  // Authority, the always-on approval engine), shown once as an "included on
  // every plan" trust line. NOT Compliance/Integrations — those are tier-gated
  // paid modules and appear as badges. Empty on a stale/pre-deploy API → the
  // strip falls back to generic always-on copy (no module over-claim).
  const platformNames = (data.platformModules ?? []).map((m) =>
    moduleShortNameFor(m),
  );

  // A module badge shows a plan's publicly-marketed modules from the API's
  // per-plan `modules` (the real tier entitlement — includes tier-gated
  // Compliance/Integrations). `isModulePublic` only drops what the site doesn't
  // market (Requests) + unknown keys.
  const isBadgeModule = (key: string) => isModulePublic(key);
  const publicPlanModules = (p: Plan) =>
    p.modules.filter((m) => isBadgeModule(m.key));
  // Sector qualifiers for the badge above. A module the API marks
  // `availableToSectors` is an add-on only those industries can use, so the card
  // says so in plain words instead of over-claiming. Sector NAMES come from the
  // API — reclassifying a sector upstream changes this copy with no site edit.
  //
  // The sentence deliberately ends on the sector list with no trailing noun.
  // API sector names are already complete noun phrases ("Religious
  // Organisations"), so appending one produced "…Religious Organisations
  // organisations". Don't reintroduce it — any noun that reads correctly for
  // one sector name will read wrongly for another.
  const sectorNotes = (mods: PlanModule[]): string[] =>
    mods
      .filter((m) => m.availableToSectors?.length)
      .map((m) => {
        const sectors = m.availableToSectors as string[];
        return `${moduleShortNameFor(m)} is for ${formatEnglishList(sectors)}`;
      });

  // "All modules included" when a plan carries every module the site markets
  // across all tiers (derived — no hardcoded count to drift).
  const marketedModuleCount = new Set(
    data.plans.flatMap((p) => publicPlanModules(p).map((m) => m.key)),
  ).size;

  // The trial provisions a real tier — its chip lists that tier's own
  // publicly-marketed modules (incl. Compliance), straight from the API data so
  // it can't drift from that tier's card. Days and seats are the API's live
  // terms when it publishes them, core's constants when it does not.
  const trialPlan = data.plans.find((p) => p.key === (data.trial?.plan ?? TRIAL_PLAN));
  const trialPlanName = trialPlan?.name ?? TRIAL_PLAN_NAME;
  const trialDays = data.trial?.days ?? TRIAL_DURATION_DAYS;
  const trialSeatCap = data.trial?.seatCap ?? TRIAL_SEAT_CAP;
  const trialModuleLabel = (trialPlan ? publicPlanModules(trialPlan) : [])
    .map((m) => moduleShortNameFor(m))
    .join(" + ");

  return (
    <section
      style={{
        backgroundColor: "var(--color-bg)",
        padding: "100px 40px",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <div
        style={{
          maxWidth: "var(--layout-max-width)",
          margin: "0 auto",
          position: "relative",
          zIndex: Z_INDEX.raised,
        }}
      >
        <SectionIntro
          align="center"
          eyebrow="PRICING"
          eyebrowStyle={{ marginBottom: "16px" }}
          titleAs={headingAs}
          title="Structured pricing for every stage of growth."
          titleStyle={{
            fontWeight: 400,
            fontSize: "var(--text-display-xs)",
            lineHeight: 1.3,
            margin: "0 auto 12px",
          }}
          titleClassName="lg:!text-display-lg"
          lede={
            <>
              Every plan starts with a {trialDays}-day trial. {NO_CARD_REQUIRED}, nothing
              to cancel. Scale as your organisation grows. No hidden fees.
            </>
          }
          ledeStyle={{
            fontWeight: 400,
            fontSize: "var(--text-xl)",
            lineHeight: 1.7,
            margin: "0 auto 32px",
            maxWidth: "var(--measure-short)",
          }}
        />

        {/* Controls row */}
        <m.div
          {...fadeUpOnScroll(3)}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}
        >
          {/* Billing period and currency: radio groups, so a screen reader hears which is chosen. */}
          <ChoiceGroup
            variant="segmented"
            ariaLabel="Billing period"
            value={billing}
            onChange={(value) => setBilling(value === "monthly" ? "monthly" : "annual")}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "annual", label: ANNUAL_TOGGLE_LABEL, emphasis: true },
            ]}
          />
          {currencies.length > 1 && (
            <ChoiceGroup
              variant="segmented"
              ariaLabel="Currency"
              value={currency}
              onChange={setChosenCurrency}
              options={currencies.map((code) => ({ value: code, label: code }))}
            />
          )}
        </m.div>

        {/* Plan Cards */}
        {/* The trial card plus one per plan the API returns. */}
        <div {...cardGridProps(orderedPlans.length + 1, {}, { gap: "20px" })}>
          {/* Trial card — marketing-only, not a real plan */}
          <m.div
            {...fadeUpOnScroll(4)}
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: "var(--text-heading-xs)",
                color: "var(--color-text-primary)",
                margin: "0 0 6px",
              }}
            >
              Try {BRAND.name}
            </h3>
            <p
              style={{
                fontWeight: 400,
                fontSize: "var(--text-md)",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
                margin: "0 0 20px",
              }}
            >
              The full {trialPlanName} tier, switched on for your own data the
              moment you verify — not a demo environment.
            </p>
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "var(--text-display-xs)",
                  color: "var(--color-text-primary)",
                }}
              >
                {formatCurrencyAmount(0, currency)}
              </span>
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "var(--text-md)",
                  color: "var(--color-text-muted)",
                }}
              >
                {" "}
                / {trialDays} days
              </span>
            </div>
            <p
              style={{
                fontWeight: 400,
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
                margin: "0 0 20px",
                minHeight: "16px",
              }}
            >
              {NO_CARD_REQUIRED}
            </p>
            <div
              style={{
                display: "inline-block",
                fontSize: "var(--text-2xs)",
                fontWeight: 500,
                padding: "4px 10px",
                borderRadius: "var(--radius-badge)",
                backgroundColor: "var(--color-gold-ghost)",
                color: "var(--color-gold-on-light)",
                border: "1px solid var(--color-gold-divider)",
                marginBottom: "16px",
                alignSelf: "flex-start",
              }}
            >
              {trialModuleLabel}
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 24px",
                flex: 1,
              }}
            >
              {trialHighlights(trialPlanName, trialSeatCap).map((feature) => (
                <li
                  key={feature}
                  style={{
                    fontWeight: 400,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.5,
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{ color: "var(--color-available)", fontWeight: 600, flexShrink: 0 }}
                  >
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={SITE_PAGES.trial()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "44px",
                borderRadius: "var(--radius-pill)",
                fontSize: "var(--text-md)",
                fontWeight: 600,
                textDecoration: "none",
                transition: cssTransition("border-color"),
                backgroundColor: "transparent",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-navy-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              Start your {trialDays}-day trial
            </Link>
            <p
              style={{
                fontWeight: 400,
                fontSize: "var(--text-2xs)",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
                margin: "12px 0 0",
              }}
            >
              Exports carry an {BRAND.name} Trial watermark until you upgrade. Data
              is preserved for {READ_ONLY_GRACE_DAYS} days after your trial ends.
            </p>
          </m.div>

          {orderedPlans.map((plan, i) => {
            const isFeatured = plan.key === FEATURED_PLAN;
            const priceData = getPriceForCurrency(plan, currency);
            // Derived from the product API, never from the tier NAME. A name
            // check silently becomes wrong the day a second tier is quote-priced
            // or Enterprise becomes self-serve, and nothing would fail — the page
            // would just quietly sell, or refuse to sell, the wrong thing.
            const isQuotePriced = !plan.selfServeCheckout;

            const displayAmount =
              billing === "annual" && priceData?.annualPerMonth != null
                ? priceData.annualPerMonth
                : (priceData?.monthly ?? 0);

            // Honest contrast: on annual, show the real monthly struck through
            // and the genuine yearly saving — a true discount, not a fake anchor.
            const showStrike =
              !isQuotePriced &&
              billing === "annual" &&
              priceData?.annualPerMonth != null &&
              priceData.monthly > priceData.annualPerMonth;
            const annualSaving =
              !isQuotePriced &&
              billing === "annual" &&
              priceData?.annualTotal != null
                ? priceData.monthly * 12 - priceData.annualTotal
                : 0;

            // Prices are before tax. A tax line ("+ <rate> VAT") shows only where
            // core says tax is charged (registered); the API's rate only formats
            // it — never typed. None for USD.
            const taxNote = priceData ? priceTaxNote(currency, priceData.taxRate) : null;

            const features = getHighlights(plan);
            // Ladder: every tier above the cheapest lists only its DELTAS,
            // under an "Everything in <next-cheaper tier>, plus —" lead-in.
            // Order-derived (orderedPlans is sorted ascending) so it never
            // hardcodes tier names.
            const inheritFrom = i > 0 ? orderedPlans[i - 1] : undefined;

            // The plan's publicly-marketed modules from the API (real tier
            // entitlement — includes tier-gated Compliance/Integrations). The
            // always-on engine (Authority) is not badged — it's in the "included
            // on every plan" strip below; Requests is hidden by the site.
            const badgeModules = publicPlanModules(plan);
            const moduleNames = badgeModules
              .map((m) => moduleShortNameFor(m))
              .join(" + ");
            // No hardcoded count in the label (it drifts — the same reason the
            // app's pricing lock test forbids "N modules" copy); a plan carrying
            // every marketed module reads "All modules included".
            const moduleLabel =
              badgeModules.length >= marketedModuleCount
                ? "All modules included"
                : moduleNames;

            return (
              <m.div
                key={plan.key}
                {...fadeUpOnScroll(i + 4)}
                style={{
                  backgroundColor: isFeatured ? "var(--color-navy-primary)" : "var(--color-white)",
                  border: isFeatured
                    ? "1px solid var(--color-gold-border)"
                    : "1px solid var(--color-border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* MOST POPULAR badge */}
                {isFeatured && (
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "var(--color-gold)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--text-2xs)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      padding: "6px 14px",
                      borderRadius: "var(--radius-badge)",
                      marginBottom: "8px",
                      alignSelf: "flex-start",
                    }}
                  >
                    MOST POPULAR
                  </span>
                )}

                {/* Plan name */}
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "var(--text-heading-xs)",
                    color: isFeatured ? "var(--color-white)" : "var(--color-text-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  {plan.name}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontWeight: 400,
                    fontSize: "var(--text-md)",
                    color: isFeatured ? "var(--color-text-subtle)" : "var(--color-text-muted)",
                    lineHeight: 1.5,
                    margin: "0 0 20px",
                  }}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div
                  style={{
                    marginBottom: "6px",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {isQuotePriced && (
                    <span
                      style={{
                        fontWeight: 400,
                        fontSize: "var(--text-xl)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      From
                    </span>
                  )}
                  {showStrike && priceData && (
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: "var(--text-3xl)",
                        textDecoration: "line-through",
                        color: isFeatured ? "var(--color-text-subtle)" : "var(--color-text-muted)",
                      }}
                    >
                      {formatCurrencyAmount(priceData.monthly, currency)}
                    </span>
                  )}
                  <span style={{ whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "var(--text-heading-3xl)",
                        color: isFeatured ? "var(--color-white)" : "var(--color-text-primary)",
                      }}
                    >
                      {formatCurrencyAmount(displayAmount, currency)}
                    </span>
                    <span
                      style={{
                        fontWeight: 400,
                        fontSize: "var(--text-md)",
                        color: isFeatured ? "var(--color-text-subtle)" : "var(--color-text-muted)",
                      }}
                    >
                      /month
                    </span>
                  </span>
                </div>

                {taxNote && (
                  <p
                    style={{
                      fontWeight: 400,
                      fontSize: "var(--text-xs)",
                      color: isFeatured ? "var(--color-text-subtle)" : "var(--color-text-muted)",
                      margin: "0 0 8px",
                    }}
                  >
                    {taxNote}
                  </p>
                )}

                {/* Real yearly saving on annual — honest contrast */}
                {annualSaving > 0 && (
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--text-xs)",
                      color: isFeatured
                        ? "var(--color-gold)"
                        : "var(--color-gold-on-light)",
                      margin: "0 0 8px",
                    }}
                  >
                    Save {formatCurrencyAmount(annualSaving, currency)} a year
                  </p>
                )}

                {/* Billing note */}
                <p
                  style={{
                    fontWeight: 400,
                    fontSize: "var(--text-sm)",
                    color: isFeatured ? "var(--color-text-inverse-muted)" : "var(--color-text-muted)",
                    margin: "0 0 20px",
                    minHeight: "18px",
                    lineHeight: 1.5,
                  }}
                >
                  {isQuotePriced ? (
                    "Custom pricing — tailored to your organisation"
                  ) : billing === "annual" ? (
                    priceData?.annualTotal != null ? (
                      // The per-month figure is the big price above; this
                      // line is what is actually paid — once, for the year.
                      <>
                        <strong
                          style={{
                            fontWeight: 600,
                            color: isFeatured ? "var(--color-white)" : "var(--color-text-primary)",
                          }}
                        >
                          {formatCurrencyAmount(priceData.annualTotal, currency)}
                        </strong>{" "}
                        billed once a year
                      </>
                    ) : (
                      "Billed annually"
                    )
                  ) : (
                    "Cancel anytime"
                  )}
                </p>

                {/* Modules badge */}
                {moduleLabel && (
                  <div
                    style={{
                      display: "inline-block",
                      fontSize: "var(--text-2xs)",
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-badge)",
                      backgroundColor: isFeatured
                        ? "var(--color-gold-tint)"
                        : "var(--color-gold-ghost)",
                      color: isFeatured
                        ? "var(--color-gold)"
                        : "var(--color-gold-on-light)",
                      border: "1px solid var(--color-gold-divider)",
                      marginBottom: "16px",
                      alignSelf: "flex-start",
                    }}
                  >
                    {moduleLabel}
                  </div>
                )}

                {/* Sector-restricted modules on this plan (e.g. Grants, which is
                    for grant-funded organisations). The tier includes them, but a
                    customer outside those sectors cannot use them — so the badge
                    above must not be left to imply every buyer gets them.
                    API-driven (`availableToSectors`), no hardcoded sector names. */}
                {sectorNotes(badgeModules).map((note) => (
                  <div
                    key={note}
                    style={{
                      fontSize: "var(--text-2xs)",
                      color: "var(--color-text-muted)",
                      margin: "-8px 0 16px",
                      alignSelf: "flex-start",
                    }}
                  >
                    {note}
                  </div>
                ))}

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 24px",
                    flex: 1,
                  }}
                >
                  {inheritFrom && (
                    <li
                      style={{
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        color: isFeatured ? "var(--color-white)" : "var(--color-text-primary)",
                        marginBottom: "12px",
                      }}
                    >
                      Everything in {inheritFrom.name}, plus &mdash;
                    </li>
                  )}
                  {features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        fontWeight: 400,
                        fontSize: "var(--text-sm)",
                        color: isFeatured ? "var(--color-text-subtle)" : "var(--color-text-muted)",
                        lineHeight: 1.5,
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: isFeatured ? "var(--color-gold)" : "var(--color-available)",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <ButtonLink
                  href={isQuotePriced ? contactHref("demo") : SITE_PAGES.trial()}
                  variant={isFeatured ? "primary" : "secondary"}
                  surface="light"
                  size="md"
                  fullWidth
                >
                  {isQuotePriced ? "Talk to us" : "Start my trial"}
                </ButtonLink>
              </m.div>
            );
          })}
        </div>

        {/* Reassurance strip */}
        <m.p
          {...fadeUpOnScroll(8)}
          style={{
            fontWeight: 400,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            textAlign: "center",
            marginTop: "40px",
          }}
        >
          {platformNames.length > 0
            ? `${EVERY_PLAN_LEAD}: ${platformNames.join(" · ")} — the always-on approval engine, tamper-evident audit trail and enterprise-grade security.`
            : `${EVERY_PLAN_LEAD}: ${Object.values(TRUST_SIGNALS).join(" · ")}`}
        </m.p>

        <m.p
          {...fadeUpOnScroll(9)}
          style={{
            fontSize: "var(--text-sm)",
            textAlign: "center",
            marginTop: "12px",
          }}
        >
          <Link
            href={SITE_ROUTES.savingsEstimator}
            style={{
              color: "var(--color-gold-on-light)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Not sure yet? Estimate what you&rsquo;d save &rarr;
          </Link>
        </m.p>
      </div>
    </section>
  );
}
