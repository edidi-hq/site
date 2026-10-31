import {
  Banknote,
  ClipboardCheck,
  Archive,
  ShieldAlert,
  SlidersHorizontal,
  Link2,
  Scale,
  FileLock2,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import {
  BRAND,
  suiteHref,
  SUITES,
  MODULE_ORDER,
  moduleSuite,
  isModulePublic,
  type ModuleKey,
  type ModuleSuite,
} from "@/lib/brand";
import { AUDIT_TRAIL_KEPT, TRAIL_SEALED_WITH_FINGERPRINT, TRAIL_SEALED } from "@/lib/record-keeping";

/**
 * Copy for the four SUITE pages (`/product/<suite>`).
 *
 * These pages exist because the navigation stopped listing eight modules and
 * started listing four suites: a visitor now arrives at a group and has to be
 * told, in one page, what the modules in it have in common and what each one
 * uniquely adds — then sent on to the module's own page for the detail.
 *
 * WHAT GOES WHERE. `shared` is the half that used to be repeated, slightly
 * differently, on every module page: one delegation-of-authority engine, one
 * audit trail, one set of permissions. `modules[key]` is the half that is
 * true of exactly one module — if a line here would read as true of its
 * neighbour, it belongs in `shared` instead.
 *
 * The brand rule applies to the hero (name the outcome, never the feature); the
 * module blocks below it are the product tier, where naming the thing is right.
 *
 * EVERY public module in a suite needs an entry: `suite-pages.lock.test.ts`
 * fails otherwise, so a new module cannot ship into a suite with no words.
 */

/** A module's block on its suite page; its icon is the module's own (`MODULE_COPY`). */
interface SuiteModuleBlurb {
  /** The one thing only this module does — a sentence, not a feature list. */
  claim: string;
  body: string;
}

interface SuiteSharedPoint {
  title: string;
  body: string;
  icon: LucideIcon;
}

interface SuitePageConfig {
  /** Page headline — outcome, not feature. */
  headline: string;
  description: string;
  /** Heading above the shared-capability section. */
  sharedTitle: string;
  shared: SuiteSharedPoint[];
  modules: Partial<Record<ModuleKey, SuiteModuleBlurb>>;
  /** What the suite covers, after its name in the browser title: "payments, purchase orders and restricted funds". */
  metaTitleTail: string;
  /** Meta description for the route. */
  metaDescription: string;
}

export const SUITE_PAGES: Record<ModuleSuite, SuitePageConfig> = {
  spend: {
    headline: "Nothing leaves the account without a decision behind it.",
    description:
      `Payments, purchase orders and donor funds all start the same way — somebody asks for money to go out. ${BRAND.name} puts every one of those requests on the same path: routed to whoever is allowed to approve it, at the amount they are allowed to approve, with the answer ${AUDIT_TRAIL_KEPT}.`,
    sharedTitle: "What they have in common",
    shared: [
      {
        icon: Workflow,
        title: "One set of approval rules, not three",
        body:
          "A voucher, a purchase order and a grant payment are different documents with the same question behind them: who is allowed to say yes to this amount? You define that once. Every request type obeys it, so finance does not maintain three sets of limits that drift apart.",
      },
      {
        icon: Scale,
        title: "Limits that hold when nobody is watching",
        body:
          "Amount thresholds, departmental scope and separation of duties are enforced as the request moves, not checked afterwards. Somebody who submits a request cannot approve it, and an amount above a limit routes upward on its own.",
      },
      {
        icon: FileLock2,
        title: "The same audit trail at the end",
        body:
          "Whatever was spent and whoever approved it lands on one tamper-evident trail — the same one your auditors, your board and your donors are shown. No module keeps its own private history.",
      },
    ],
    modules: {
      pay: {
        claim: "Money going out to a supplier, a staff member, or a bank.",
        body:
          "Payment vouchers from submission through finance validation to sanction, with a bank-ready instruction at the end and the payment evidence — reference, value date, receipt — recorded against the voucher afterwards.",
      },
      procure: {
        claim: "Money committed before it is spent.",
        body:
          "Purchase orders with their vendors, line items and delivery terms, reviewed by the department head and issued to the supplier from one record — so a commitment is visible long before the invoice arrives.",
      },
      grants: {
        claim: "Money that came with somebody else's rules attached.",
        body:
          "Restricted funds tied to their grant and budget line, burn tracked against each donor's restrictions, and a donor-ready report produced in the grant's own currency — from the same approvals finance already runs.",
      },
    },
    metaTitleTail: "payments, purchase orders and restricted funds",
    metaDescription:
      `Payments, purchase orders and restricted funds on one approval path — routed to whoever is allowed to approve the amount, with every decision ${AUDIT_TRAIL_KEPT}.`,
  },

  oversight: {
    headline: "The rules are written down, enforced, and watched.",
    description:
      `Most organisations already have approval rules. They live in a policy document nobody opens and get applied by whoever is paying attention that week. ${BRAND.name} is where the rules are stated once, applied to every request automatically, and monitored for the patterns that mean somebody is working around them.`,
    sharedTitle: "What they have in common",
    shared: [
      {
        icon: SlidersHorizontal,
        title: "One place authority is defined",
        body:
          "Who may approve what, up to how much, under which conditions — written once and applied to every payment, order and request in the platform. Changing a limit changes it everywhere, immediately.",
      },
      {
        icon: ShieldAlert,
        title: "Enforcement first, detection second",
        body:
          "A rule that can be enforced is enforced, not flagged: separation of duties and amount limits simply block. Detection is reserved for what enforcement cannot see, like the same invoice arriving twice or a vendor's bank details changing the week of a payment.",
      },
      {
        icon: FileLock2,
        title: "Every decision explains itself later",
        body:
          "Each approval records which rule governed it, so years afterwards you can show not just who approved something but what policy allowed them to.",
      },
    ],
    modules: {
      authority: {
        claim: "Decides who is allowed to approve what.",
        body:
          "The delegation-of-authority engine every request runs on: limits, levels, approver groups, conditions and cover for when somebody is away. Define it once; it is enforced automatically and provable on the record.",
      },
      guard: {
        claim: "Watches for the rules being worked around.",
        body:
          "Checks each payment and order as it is submitted and raises the patterns that drain finance teams — duplicate payments, vendor bank-account switches, amounts split to slip under a limit — so a reviewer sees the risk before approval, not after the money has gone.",
      },
    },
    metaTitleTail: "approval authority, enforced and monitored",
    metaDescription:
      "Define who can approve what, up to how much — enforced on every request automatically, and monitored for the patterns that mean somebody is working around it.",
  },

  evidence: {
    headline: "What happened, and proof it was not edited afterwards.",
    description:
      `A record is only worth having if nobody can quietly change it. Everything ${BRAND.name} approves lands in a record that the people who use it cannot alter — searchable when you need to find something, exportable when somebody official asks.`,
    sharedTitle: "What they have in common",
    shared: [
      {
        icon: FileLock2,
        title: "Nobody can quietly edit history — including us",
        body:
          `Approvals, signatures, queries and access events are written to a tamper-evident trail that no user can modify — not an administrator, not a superadmin — and ${TRAIL_SEALED_WITH_FINGERPRINT} you can check yourself.`,
      },
      {
        icon: Archive,
        title: "Findable after the person has left",
        body:
          "Records can be found by reference, payee, department, status or date, with every submitted version kept, so the answer does not leave when the person who raised it does.",
      },
      {
        icon: ClipboardCheck,
        title: "Export-ready, not export-eventually",
        body:
          "A regulator, auditor or board asking for a period gets a complete bundle produced from the live record, rather than a week of screenshots and spreadsheets.",
      },
    ],
    modules: {
      vault: {
        claim: "The documents themselves, with their history.",
        body:
          "Every voucher, purchase order, goods receipt and supplier invoice, with its files and full submission history, in one list: the working memory of what your organisation has actually approved.",
      },
      audit: {
        claim: "The proof of what was done and by whom.",
        body:
          "A tamper-evident trail of every submission, approval, query, signature and access event, with regulator-ready exports, data-retention controls and data-subject request handling on top.",
      },
    },
    metaTitleTail: "a tamper-evident record of every decision",
    metaDescription:
      `A tamper-evident record of every approval and document, ${TRAIL_SEALED}, searchable years later and exportable for auditors and regulators in one step.`,
  },

  infrastructure: {
    headline: "It reaches your people, and it talks to your other systems.",
    description:
      `A system of record is only useful if the right people are in it and the record does not stay trapped inside it. This is the layer that gets your organisation signed in securely and pushes what ${BRAND.name} approves into the systems that need it next.`,
    sharedTitle: "What it covers",
    shared: [
      {
        icon: Link2,
        title: "Your record, where it needs to go next",
        body:
          "Approved vouchers and payments into your ledger as journal entries, approved orders into the ERP, role changes into the HR system — through signed webhooks, a documented API and ready-to-import files rather than a monthly export somebody assembles by hand.",
      },
      {
        icon: FileLock2,
        title: "Sign-in that matches your policy",
        body:
          "Single sign-on with your existing identity provider — required, if you choose — one sign-in per person across all your companies, enforced multi-factor policy, and access restricted to the networks you nominate.",
      },
      {
        icon: Banknote,
        title: "Alerts people actually receive",
        body:
          "Approvals waiting, requests returned, deadlines approaching — delivered where the person will see them, so the queue does not stall on somebody not knowing it is their turn.",
      },
    ],
    modules: {
      connect: {
        claim: `Connects ${BRAND.name} to everything around it.`,
        body:
          "Webhooks and a documented REST API for accounting, HR and data-warehouse systems, scoped API keys, single sign-on, and the notification delivery the rest of the platform runs on.",
      },
    },
    metaTitleTail: "access, alerts and integrations",
    metaDescription:
      `Single sign-on, enforced access policy, and signed webhooks and a documented API that push what ${BRAND.name} approves into your accounting, HR and data systems.`,
  },
};

/**
 * Public modules in a suite, in the site's display order.
 * Filters MODULE_ORDER, not `Object.keys(MODULES)` — object key order is not
 * the display contract, and the two differ.
 */
export function suiteModuleKeys(suite: ModuleSuite): ModuleKey[] {
  return MODULE_ORDER.filter((key) => isModulePublic(key) && moduleSuite(key) === suite);
}

/** A suite route's metadata: "<brand> Spend — payments, purchase orders and restricted funds". */
export function suitePageMetadata(suite: ModuleSuite): Metadata {
  const config = SUITE_PAGES[suite];
  const label = SUITES.find((entry) => entry.key === suite)!.label;
  return pageMetadata({
    path: suiteHref(suite),
    title: `${BRAND.name} ${label} — ${config.metaTitleTail}`,
    description: config.metaDescription,
    socialDescription: config.headline,
  });
}
