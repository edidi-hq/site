import {
  Archive,
  ClipboardCheck,
  CreditCard,
  Link2,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { BRAND, publicModuleKeys, type ModuleKey } from "@/lib/brand";
import { formatEnglishList } from "@/lib/english-list";
import { TRAIL_SEALED } from "@/lib/record-keeping";

/**
 * Each module's card words and icon — the one copy every module list reads.
 *
 * The product overview, the homepage grid and the docs index each used to keep
 * their own list, and between them they had drifted: two capitalisations of the
 * same subtitle, word-for-word duplicate bodies, three icon maps — and none of
 * the three showed Authority, because it was added to the catalogue after the
 * lists were written. Keyed by `ModuleKey`, so a module core adds fails
 * type-check here until it has words, and every list renders `publicModuleKeys()`
 * so a hidden module never appears.
 *
 * `tagline` is the short line under the name; `summary` the card paragraph. A
 * suite page's per-module `claim`/`body` (`product-suites.ts`) is a different
 * job — what sets the module apart from its suite neighbours — and stays there.
 */
export interface ModuleCopy {
  icon: LucideIcon;
  tagline: string;
  summary: string;
  /** The request a person raises in this module, if it has one: "payment voucher". */
  requestNoun?: string;
}

export const MODULE_COPY: Record<ModuleKey, ModuleCopy> = {
  pay: {
    requestNoun: "payment voucher",
    icon: CreditCard,
    tagline: "Payment approvals and authorisation",
    summary:
      "Every payment voucher submitted, reviewed, and sanctioned through a defined approval chain — routed to the right approver by amount, department, and risk, with a bank-ready PDF the moment the final signature lands.",
  },
  procure: {
    requestNoun: "purchase order",
    icon: ShoppingCart,
    tagline: "Purchase orders on record",
    summary:
      "Generate, approve, and issue purchase orders with vendor management, line-item tracking, and role-based approval chains — procurement without email chains or paperwork gaps.",
  },
  vault: {
    icon: Archive,
    tagline: "Financial records in one place",
    summary:
      "Every voucher, purchase order, goods receipt and supplier invoice in one list, with its files and version history, findable by reference, payee, department, status or date.",
  },
  authority: {
    icon: SlidersHorizontal,
    tagline: "Who can approve what, up to how much",
    summary:
      "The delegation-of-authority engine every request runs on: approval limits per role, levels, separation of duties and cover for absence — written once, enforced automatically, and provable on the record.",
  },
  audit: {
    icon: ClipboardCheck,
    tagline: "Compliance and accountability",
    summary:
      `A tamper-evident log of every action — submissions, approvals, queries, signatures — ${TRAIL_SEALED}. Face internal and external audits without the manual scramble.`,
  },
  guard: {
    icon: ShieldAlert,
    tagline: "Anomaly and control flags",
    summary:
      "Catch the payments that shouldn't go out — duplicate payments, vendor bank-account switches, and amounts split to dodge an approval limit — flagged before approval and resolved on an audited review queue.",
  },
  grants: {
    requestNoun: "grant disbursement",
    icon: Wallet,
    tagline: "Grant and fund accounting",
    summary:
      "Tie every payment to its grant and budget line, track burn against each donor's restrictions, oversee sub-grantees, and export donor-ready reports in the grant's own currency.",
  },
  people: {
    requestNoun: "expense claim",
    icon: Users,
    tagline: "Staff expense approvals",
    summary:
      "Staff expense claims routed through the same approval engine and audit trail as your payments — employee-initiated approvals, structured and on record.",
  },
  connect: {
    icon: Link2,
    tagline: "External systems and integrations",
    summary:
      `Push ${BRAND.name} events into your accounting, HR, or data-warehouse stack through webhooks and a documented API — your operational record flowing where it needs to go.`,
  },
};

/**
 * The kinds of request people raise, from the modules the site shows — "payment
 * voucher, purchase order and grant disbursement". Sentences read this rather
 * than naming request types, so a hidden module's request never appears in copy
 * and a newly shown one joins the sentence by itself.
 */
export function requestTypeList(joiner: "conjunction" | "disjunction" = "conjunction"): string {
  const nouns = publicModuleKeys().flatMap((moduleKey) => MODULE_COPY[moduleKey].requestNoun ?? []);
  return formatEnglishList(nouns, joiner);
}
