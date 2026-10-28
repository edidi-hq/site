/* ── The site's plan copy — words only, never figures ─────────── */

import type { PlanCapacity } from "@edidi-hq/core/billing/capacity";
import type { PlanKey } from "@edidi-hq/core/billing/catalog";
import { MODULE_CATALOG } from "@edidi-hq/core/modules/catalog";
import {
  retentionAdjective,
  storageLimitLine,
  userLimitLine,
  documentLimitLine,
} from "../lib/plan-limits";

/**
 * The marketing words for each plan — its one-line description, its curated
 * highlights and the comparison table's feature labels — for the build-time
 * pricing fallback (`src/lib/pricing-fallback-build.ts`).
 *
 * WHY THIS LIVES HERE. Core's plan catalogue holds every FACT about a plan
 * (name, prices, capacity, features, how it is sold) and deliberately no display
 * copy: copy is each consumer's own catalogue. The live pricing API serves the
 * app's copy; this is the site's, used only when the API is unreachable on a
 * cold cache. The site is English-only (no i18n layer), so plain strings.
 *
 * NO FIGURES. Every number a line states — seats, documents, storage,
 * retention — is passed in from core's catalogue (capacity, and retention via
 * `billing/retention`) and formatted by
 * `@/lib/plan-limits`, so a capacity change in core reaches this copy with no
 * edit. Module names are core's too. Keyed by `PlanKey`, so a plan added to
 * core fails the type check here until it has words.
 */

interface PlanCopyInput {
  capacity: PlanCapacity;
  /** Financial-document retention in days for this plan (0 = kept indefinitely). */
  documentRetentionDays: number;
}

interface PlanCopy {
  description: (input: PlanCopyInput) => string;
  highlights: (input: PlanCopyInput) => string[];
}

/** "Up to 10 users" → "up to 10 users", for the middle of a sentence. */
function inSentence(line: string): string {
  return line.charAt(0).toLowerCase() + line.slice(1);
}

/** "10 GiB storage · 7-year record retention" / "Unlimited storage & retention". */
function storageAndRetention({ capacity, documentRetentionDays }: PlanCopyInput): string {
  const years = retentionAdjective(documentRetentionDays);
  if (years === null && capacity.maxStorageBytes === 0) return "Unlimited storage & retention";
  const retention = years === null ? "unlimited record retention" : `${years} record retention`;
  return `${storageLimitLine(capacity.maxStorageBytes)} · ${retention}`;
}

const moduleLabel = (key: keyof typeof MODULE_CATALOG) => MODULE_CATALOG[key].sidebarLabel;

export const PLAN_COPY: Readonly<Record<PlanKey, PlanCopy>> = {
  starter: {
    description: ({ capacity }) =>
      `Payments and procurement for growing teams — ${inSentence(userLimitLine(capacity.maxUsers))}`,
    highlights: (input) => [
      userLimitLine(input.capacity.maxUsers),
      documentLimitLine(input.capacity.maxDocumentsPerMonth),
      "Bank-ready exports (PDF & spreadsheet)",
      "WhatsApp & email alerts",
      storageAndRetention(input),
    ],
  },
  business: {
    description: ({ capacity }) =>
      `Complete operations with compliance and analytics — ${inSentence(userLimitLine(capacity.maxUsers))}`,
    highlights: (input) => [
      userLimitLine(input.capacity.maxUsers),
      "Full compliance audit trail",
      `Anomaly and control flags (${moduleLabel("guard")})`,
      `Grant & restricted-fund tracking (${moduleLabel("grants")})`,
      "Custom approval chains & branding",
      "Analytics, recurring templates, delegation",
      storageAndRetention(input),
      "Priority support",
    ],
  },
  enterprise: {
    description: () => "Unlimited scale, dedicated support, and full platform access",
    highlights: (input) => [
      userLimitLine(input.capacity.maxUsers),
      "See and export across all your companies in one view (read-only)",
      storageAndRetention(input),
      "Employee expense requests",
      "Single sign-on (SSO/SCIM) & advanced approvals",
      "API access for custom integrations",
      "Dedicated onboarding & priority support",
    ],
  },
};

/**
 * Comparison-table row labels, by feature key. Every feature core sells on at
 * least one plan needs one: the generator refuses to build a fallback that
 * would silently drop a sold feature from the table.
 */
export const FEATURE_LABELS: Readonly<Record<string, string>> = {
  pdfExport: "Export approved documents as PDF",
  bankExport: "Export bank-ready payment files",
  bulkBankExport: "Export payments in bulk",
  bankLetterGeneration: "Generate formatted bank-letter PDFs",
  documentAttachments: "Attach supporting documents",
  vendorCompliance: "Track vendor tax & statutory compliance",
  procurementAdvanced: "Record competitive quotes and enforce bid rules",
  csvExport: "Download data as spreadsheets",
  fullAuditTrail: "Complete compliance visibility",
  fullAuditExport: "Export full compliance records",
  controlsMonitoring: "Prove your controls were on and working",
  controlsAttestation: "Sign off that you reviewed your controls",
  apiAccess: "Connect external systems via API",
  approvalChain: "Structured approval workflow",
  delegation: "Delegate approvals while away",
  ipAllowlist: "Restrict access by IP address",
  mfaPolicy: "Enforce multi-factor authentication",
  sso: "Single sign-on (SSO) and SCIM provisioning",
  analytics: "Understand your spending patterns",
  recurringTemplates: "Automate recurring payments",
  slaTracking: "Monitor approval speed",
  budgetCodes: "Tag spending by budget category",
  customApprovalChains: "Design your own approval process",
  multiLevelApprovals: "Route approvals through multiple reviewers",
  advancedApprovalWorkflows: "Approver groups and multi-party approval gates",
  multiCompanyGroup: "Group your companies under one parent",
  groupAdminDashboard: "One read-only view across every company in the group",
  customBranding: "Brand your exported documents",
  dedicatedOnboarding: "Guided setup with a dedicated specialist",
  prioritySupport: "Priority access to support",
  commitmentControl: "Budgets that count commitments, not just spend",
  companyBoard: "Company Board and executive summary",
  oversightRoles: "Auditor and Company Board roles",
  // The app's own words (its `features.secondaryReportingCurrency`), which the
  // live pricing API serves, so the fallback reads the same.
  secondaryReportingCurrency: "Show totals in a second reporting currency",
};
