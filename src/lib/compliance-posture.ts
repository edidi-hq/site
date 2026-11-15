import { SESSION_RECHECK_INTERVAL_MS } from "@edidi-hq/core/auth/session-recheck";
import { MINUTE_MS } from "@edidi-hq/core/dates";
import type { DataProtectionLaw } from "@edidi-hq/core/region/countries";

import { formatEnglishList } from "@/lib/english-list";
import { BRAND } from "@/lib/brand";

/**
 * Where the platform stands against each framework and law a buyer asks about —
 * the one statement the security overview, the trust centre, the trust strips
 * and the contact form all read.
 *
 * The security overview and the trust centre each used to keep their own list,
 * and the two told a reviewer different things: different SOC 2 scope, a
 * different account of how data-subject requests are handled, and Nigeria's law
 * named as the superseded 2019 regulation (NDPR) while the privacy policy
 * correctly cites the Nigeria Data Protection Act 2023.
 *
 * Statements are honest by construction: `status` is one of a fixed set, and
 * nothing here may say "certified" or "compliant" — a framework is either one
 * we have not been audited against, or one the platform is designed to meet.
 */

/**
 * English names for core's data-protection laws. Core keeps the law as a key and
 * leaves the words to each consumer; the site writes English only, so it names
 * them here — typed against core's key, so a law core adds fails type-check
 * until it has a name.
 */
export const DATA_PROTECTION_LAW_NAMES: Record<DataProtectionLaw, { short: string; full: string }> = {
  ndpa: { short: "NDPA", full: "Nigeria Data Protection Act 2023" },
  uk_gdpr: { short: "UK GDPR", full: "UK General Data Protection Regulation" },
  gdpr: { short: "GDPR", full: "EU General Data Protection Regulation" },
};

/** "GDPR and NDPA" — the laws the platform is designed for, by short name. */
export const DESIGNED_FOR_LAWS = formatEnglishList([
  DATA_PROTECTION_LAW_NAMES.gdpr.short,
  DATA_PROTECTION_LAW_NAMES.ndpa.short,
]);

export type ComplianceStatus = "policies_aligned" | "not_certified" | "designed_for";

/** `chip` fits a small badge beside the name; `line` is the full status under it. */
export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, { chip: string; line: string }> = {
  policies_aligned: { chip: "On our roadmap", line: "Policies aligned · audit on our roadmap" },
  not_certified: { chip: "Not certified", line: "Not certified" },
  designed_for: { chip: "Designed-for", line: "Designed-for" },
};

export interface ComplianceFramework {
  key: string;
  name: string;
  status: ComplianceStatus;
  /** A short addition to the status label, e.g. that a DPA is available. */
  statusNote?: string;
  body: string;
}

export const COMPLIANCE_FRAMEWORKS: readonly ComplianceFramework[] = [
  {
    key: "soc2",
    name: "SOC 2 (Type II)",
    status: "policies_aligned",
    body:
      "Our policies for access, change management, encryption, security, uptime and incident response follow SOC 2 structure. A SOC 2 Type II audit is on our roadmap; it is not done yet. We can walk your team through each area on a review call.",
  },
  {
    key: "iso27001",
    name: "ISO 27001",
    status: "not_certified",
    body:
      `${BRAND.name} is not ISO 27001 certified and does not claim to be. If your review asks about it, we will walk your team through how we handle access, assets, encryption, operations and suppliers.`,
  },
  {
    key: "gdpr",
    name: `${DATA_PROTECTION_LAW_NAMES.gdpr.short} & ${DATA_PROTECTION_LAW_NAMES.uk_gdpr.short}`,
    status: "designed_for",
    statusNote: "DPA available",
    body:
      "The rights your users have — to see their data, correct it, delete it, and take it with them — are handled directly in the product: requests arrive through your organisation's own link, identity is verified before anything is disclosed, and the statutory deadline is tracked. A Data Processing Agreement is available to sign on request.",
  },
  {
    key: "ndpa",
    name: `${DATA_PROTECTION_LAW_NAMES.ndpa.full} (${DATA_PROTECTION_LAW_NAMES.ndpa.short})`,
    status: "designed_for",
    body:
      "The way the platform handles personal data follows what Nigeria's data protection law asks for — a lawful reason for collecting it, keeping only what's needed, protecting it, and responding quickly if something goes wrong.",
  },
  {
    key: "ccpa",
    name: "CCPA / CPRA",
    status: "designed_for",
    body:
      `If you operate in California, your customers' rights to know what you hold about them, delete it, and opt out of sale are supported. ${BRAND.name} does not sell personal data — full stop.`,
  },
];

/** The status line under a framework's name. */
export function complianceStatusLine(framework: ComplianceFramework): string {
  const { line } = COMPLIANCE_STATUS_LABELS[framework.status];
  return framework.statusNote ? `${line} · ${framework.statusNote}` : line;
}

/** The three short trust claims that sit under a call to action or a price list. */
export const TRUST_SIGNALS = {
  security: "Enterprise-grade security",
  auditTrail: "Tamper-evident audit trail",
  dataProtection: `Designed for ${DESIGNED_FOR_LAWS}`,
} as const;

/**
 * How fast a removed person's sessions end — role change, deactivation, password change or a
 * directory marking them inactive. The longest path, not the usual one: a change is refused at
 * once, but a session that only reads keeps going until core's session re-check, so the figure
 * is that interval, read from core.
 */
export const ACCESS_ENDS = `within ${SESSION_RECHECK_INTERVAL_MS / MINUTE_MS} minutes`;
