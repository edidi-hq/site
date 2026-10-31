import type { Metadata } from "next";
import { ConnectModulePage } from "@/components/product/pages/connect-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { notFoundUnlessPublic } from "@/lib/module-route";
import { moduleName, BRAND, moduleHref } from "@/lib/brand";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("connect"),
  title: `${moduleName("connect")} — ${BRAND.name} in your existing stack`,
  description: `Signed webhooks, scoped API keys, a documented REST API, journal entries for your ledger, and single sign-on (OIDC or SAML) with SCIM. Push ${BRAND.name} events into the systems your organisation already runs.`,
  socialDescription: "Webhooks with Standard Webhooks signatures, scoped API keys, and SSO/SCIM. Your operational record flowing where it needs to go.",
});

export default async function ProductConnectPage() {
  notFoundUnlessPublic("connect");
  const pricingData = await fetchPricingData();
  return <ConnectModulePage {...modulePageData("connect", pricingData)} />;
}
