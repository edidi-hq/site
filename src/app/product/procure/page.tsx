import type { Metadata } from "next";
import { ProcureModulePage } from "@/components/product/pages/procure-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { notFoundUnlessPublic, notFoundUnlessSignedOff } from "@/lib/module-route";
import { moduleName, moduleHref } from "@/lib/brand";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("procure"),
  title: `${moduleName("procure")} — Procurement on record`,
  description: "Every purchase order submitted, approved, and issued through a structured vendor and approval system. Line items, vendor directory, and a tamper-evident audit trail of every procurement decision.",
  socialDescription: "Submit, approve, and issue purchase orders through a single system of record. Vendor directory + line items + approval chain.",
});

export default async function ProductProcurePage() {
  notFoundUnlessPublic("procure");
  const pricingData = await fetchPricingData();
  notFoundUnlessSignedOff("procure", pricingData);
  return <ProcureModulePage {...modulePageData("procure", pricingData)} />;
}
