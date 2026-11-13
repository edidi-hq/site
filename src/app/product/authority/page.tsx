import type { Metadata } from "next";
import { AuthorityModulePage } from "@/components/product/pages/authority-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { notFoundUnlessPublic, notFoundUnlessSignedOff } from "@/lib/module-route";
import { moduleName, moduleHref } from "@/lib/brand";

const DESCRIPTION =
  "Write your approval rules down once — who can sanction what, up to how much, and what happens above that — and have them enforced on every request automatically, with the proof kept for you.";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("authority"),
  title: `${moduleName("authority")} — who can approve what, up to how much`,
  description: DESCRIPTION,
  socialTitle: `${moduleName("authority")} — your approval rules, enforced automatically`,
  socialDescription: "Approval limits per role, approver groups and quorum, separation of duties, and cover for absence — enforced on every request.",
});

export default async function ProductAuthorityPage() {
  notFoundUnlessPublic("authority");
  const pricingData = await fetchPricingData();
  notFoundUnlessSignedOff("authority", pricingData);
  return <AuthorityModulePage {...modulePageData("authority", pricingData)} />;
}
