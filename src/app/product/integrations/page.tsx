import type { Metadata } from "next";
import { IntegrationsCataloguePage } from "@/components/product/integrations-page";
import { fetchPricingData } from "@/lib/pricing";
import { featurePlans, planNames } from "@/lib/plan-names";
import { BRAND } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";
import { SITE_ROUTES } from "@/lib/routes";

export const metadata: Metadata = pageMetadata({
  path: SITE_ROUTES.integrations,
  title: "Integrations",
  description: "Identity (OIDC / SAML / SCIM), notifications (email / WhatsApp / SMS), accounting (journal export for QuickBooks Online, Zoho Books and Sage Accounting), bank payment files (NIBSS, SEPA, Bacs, ACH), and a first-class developer platform. Everything listed is available today.",
  socialTitle: `${BRAND.name} integrations catalogue`,
  socialDescription: `Plug ${BRAND.name} into the identity, notification, accounting, banking, and developer tools your organisation already runs.`,
});

export default async function IntegrationsPage() {
  const pricingData = await fetchPricingData();
  return (
    <IntegrationsCataloguePage
      featurePlans={featurePlans(pricingData)}
      allPlanNames={planNames(pricingData)}
      verifiedClaims={pricingData.verifiedClaims ?? []}
    />
  );
}
