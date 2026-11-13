"use client";

import { Archive, Search, FingerprintPattern, Share2, Gavel, CalendarClock, ShieldCheck } from "lucide-react";
import { ProductModuleLayout, type ModuleConfig, type ModulePageData } from "@/components/product/module-layout";
import { VaultPreview } from "@/components/product/previews/vault-preview";
import { financialRetentionFloorYears } from "@edidi-hq/core/billing/retention";

/** The floor the platform enforces on a Nigerian company's financial records (core: platform floor or the country's own, whichever is longer). */
const NIGERIA_RETENTION_YEARS = financialRetentionFloorYears("NG");

const config: ModuleConfig = {
  moduleKey: "vault",
  headline: "Your financial records, in one place.",
  description:
    "Every payment voucher, purchase order, goods receipt and supplier invoice in one list, with the files, questions and submission history behind each. Find any of them by reference, payee, department, status or date, long after the person who raised it has moved on.",
  previewPath: "vault",
  preview: <VaultPreview />,

  pillars: [
    {
      icon: Archive,
      title: "Every record in one list, as soon as it is raised",
      body:
        "Vouchers, purchase orders, goods receipts and supplier invoices appear here the moment they are created in Payables or Procurement, with the files attached to them. Each person sees exactly the records they are allowed to see. The approved PDF and the bank letter are produced fresh from the record whenever they are opened, so they always match it.",
    },
    {
      icon: Search,
      title: "Find any record without its reference number",
      body:
        "Filter by reference, payee or vendor, record type, status, currency, department or date range. Find the voucher from March that paid Brightpath without knowing its number.",
    },
    {
      icon: FingerprintPattern,
      title: "Supporting files that cannot be quietly swapped",
      body:
        "Every file is checked when it is uploaded, fingerprinted, and tied to the one record it was attached to. Once a record is under query, a file can be withdrawn but not deleted, so what the approver saw is still there to prove it.",
    },
    {
      icon: Share2,
      title: "Version history, on the audit trail",
      body:
        "Each submission and resubmission keeps a snapshot of the record, including the files it carried, so you can see what changed between versions. Every file opened and every PDF or bank letter produced is written to the tamper-evident audit trail: who, what and when.",
    },
    {
      icon: CalendarClock,
      title: "Financial records can't be deleted too early",
      body:
        `Nigerian tax and company law expect financial records to be kept for years, so payment vouchers, purchase orders and their version snapshots sit behind a ${NIGERIA_RETENTION_YEARS}-year floor. A shorter retention setting still applies to everything else — it simply cannot purge the documents the law says you must keep.`,
    },
    {
      icon: Gavel,
      title: "Legal hold, for when something is disputed",
      body:
        "Put a hold on a single record or on the whole organisation and deletion stops, including the scheduled clean-ups that would otherwise run. Placing and releasing a hold are themselves recorded, so there is a clean answer to when preservation started and who asked for it.",
    },
    {
      icon: ShieldCheck,
      title: "Custody you can prove, not just claim",
      body:
        "Every record type declares what the platform guarantees about it — whether it can be altered at all, whether it is hash-chained, which fields are encrypted at rest, and what happens to it if someone asks to be erased. Those declarations are checked against the code that enforces them on every build, so what is promised here cannot quietly drift from what the database actually does.",
    },
  ],

  useCases: [
    {
      title: "Give an external auditor exactly what they need",
      body:
        "Auditor asks for \"all Q3 approved vouchers.\" Filter by status and date and export the list as a spreadsheet: exactly the period requested, nothing more. Each record's files are one click away, and every one opened is on the audit trail.",
    },
    {
      title: "One filter away, not a search through folders",
      body:
        "Historical vouchers, purchase orders and invoices are one filter away, even when the person who raised them has left the organisation.",
    },
    {
      title: "Records that survive staff turnover",
      body:
        "When the Finance Director moves on, the records stay. The new director onboards from a complete voucher and purchase-order history instead of a scattered shared drive.",
    },
    {
      title: "Preserve everything, the day the dispute starts",
      body:
        "A contract goes to arbitration, or a regulator opens a query. Put the organisation under legal hold and nothing can be deleted while it runs — no scramble to warn people not to tidy up, and a record of exactly when preservation began.",
    },
    {
      title: "Someone asks to be erased, and you still need the ledger",
      body:
        "A personal-data erasure request does not mean deleting a payment record. Each type of record is handled the way your books and the law both require — some anonymised, some removed outright, some held until a legal obligation lapses — and that decision is declared once per record type rather than argued case by case.",
    },
  ],

  relatedModules: [
    { moduleKey: "audit", desc: "Every file opened and every PDF produced is on the audit trail" },
    { moduleKey: "pay", desc: "Vouchers and supplier invoices appear in Records as they are raised" },
    { moduleKey: "procure", desc: "Purchase orders and goods receipts in the same list" },
  ],
};

export function VaultModulePage(data: ModulePageData) {
  return <ProductModuleLayout config={config} {...data} />;
}
