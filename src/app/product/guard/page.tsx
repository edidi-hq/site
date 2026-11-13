import type { Metadata } from "next";
import { GuardModulePage } from "@/components/product/pages/guard-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { notFoundUnlessPublic } from "@/lib/module-route";
import { moduleName, moduleHref } from "@/lib/brand";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("guard"),
  title: `${moduleName("guard")} — Catch the bad payment before the money moves`,
  description: "Flags on the patterns that drain finance teams — duplicate payments, vendor bank-account switches, and threshold-gaming — surfaced before approval, resolved on an audited review queue.",
  socialDescription: "Duplicate payments, vendor bank-account changes, and structuring flagged before approval — with an audited review-and-resolve queue.",
});

export default async function ProductGuardPage() {
  notFoundUnlessPublic("guard");
  const pricingData = await fetchPricingData();
  return <GuardModulePage {...modulePageData("guard", pricingData)} />;
}
