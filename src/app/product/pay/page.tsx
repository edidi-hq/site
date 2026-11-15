import type { Metadata } from "next";
import { PayModulePage } from "@/components/product/pages/pay-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { notFoundUnlessPublic, notFoundUnlessSignedOff } from "@/lib/module-route";
import { moduleName, moduleHref } from "@/lib/brand";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("pay"),
  title: `${moduleName("pay")} — Structured payment approvals`,
  description: "Every payment voucher submitted, reviewed, and sanctioned through a defined approval chain — with a bank-ready PDF and a tamper-evident audit trail at the end. Replace the email trail with structured authority.",
  socialDescription: "Submit, approve, and authorise every payment through a defined chain. Bank-ready exports and a full audit trail, without the paper.",
});

export default async function ProductPayPage() {
  notFoundUnlessPublic("pay");
  const pricingData = await fetchPricingData();
  notFoundUnlessSignedOff("pay", pricingData);
  return <PayModulePage {...modulePageData("pay", pricingData)} />;
}
