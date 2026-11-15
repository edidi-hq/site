import type { Metadata } from "next";
import { AuditModulePage } from "@/components/product/pages/audit-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { notFoundUnlessPublic, notFoundUnlessSignedOff } from "@/lib/module-route";
import { moduleName, moduleHref } from "@/lib/brand";
import { TRAIL_SEALED } from "@/lib/record-keeping";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("audit"),
  title: `${moduleName("audit")} — Compliance without the scramble`,
  description: `A tamper-evident, regulator-ready audit trail of every action in your organisation, ${TRAIL_SEALED} and verifiable without trusting us. Structured events, one-click exports, and policies that follow SOC 2 structure.`,
  socialDescription: `Tamper-evident audit trail ${TRAIL_SEALED}, structured events, regulator-ready PDF + CSV exports. Every action on record for the life of your account.`,
});

export default async function ProductAuditPage() {
  notFoundUnlessPublic("audit");
  const pricingData = await fetchPricingData();
  notFoundUnlessSignedOff("audit", pricingData);
  return <AuditModulePage {...modulePageData("audit", pricingData)} />;
}
