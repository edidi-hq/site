import type { Metadata } from "next";
import { GrantsModulePage } from "@/components/product/pages/grants-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { notFoundUnlessPublic, notFoundUnlessSignedOff } from "@/lib/module-route";
import { moduleName, moduleHref } from "@/lib/brand";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("grants"),
  title: `${moduleName("grants")} — Prove where every donor naira went`,
  description: "Restricted-fund accounting built into your approvals: tag every payment to a grant and budget line, track burn per donor, oversee sub-grantees, and export donor-ready reports in the grant's own currency.",
  socialDescription: "Restricted-fund tracking, per-grant burn, sub-grantee oversight, and donor-ready report exports — from the same approvals your finance team already runs.",
});

export default async function ProductGrantsPage() {
  notFoundUnlessPublic("grants");
  const pricingData = await fetchPricingData();
  notFoundUnlessSignedOff("grants", pricingData);
  return <GrantsModulePage {...modulePageData("grants", pricingData)} />;
}
