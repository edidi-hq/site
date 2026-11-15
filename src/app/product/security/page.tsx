import type { Metadata } from "next";
import { SecurityProductPage } from "@/components/product/security-page";
import { JsonLd, pageMetadata, faqPageSchema } from "@/lib/seo";
import { signedOffFaqs } from "@/lib/security-faqs";
import { fetchPricingData } from "@/lib/pricing";
import { LEGAL_PAGES, BRAND } from "@/lib/brand";
import { TRAIL_SEALED } from "@/lib/record-keeping";
import { ACCESS_ENDS } from "@/lib/compliance-posture";

export const metadata: Metadata = pageMetadata({
  path: LEGAL_PAGES.security,
  title: `${BRAND.name} security — authority at every layer`,
  description: `${BRAND.name} is built for organisations where every approval carries weight. Tenant isolation enforced by the database, role-based access with separation of duties and per-request rules, sessions that end ${ACCESS_ENDS} of a role change, a tamper-evident audit trail ${TRAIL_SEALED} and per-company encryption — the complete security posture, explained honestly.`,
  socialDescription: `Tenant isolation at the database. Role + attribute-based authority. Tamper-evident audit, ${TRAIL_SEALED}. Lifecycle-bound access. Per-company encryption. No marketing — the actual stack.`,
});

export default async function SecurityPage() {
  // Paid capabilities show only once signed off (`@/lib/verified-claims`).
  const verifiedClaims = (await fetchPricingData()).verifiedClaims ?? [];
  const faqs = signedOffFaqs(verifiedClaims);
  return (
    <>
      <JsonLd data={faqPageSchema(faqs)} />
      <SecurityProductPage verifiedClaims={verifiedClaims} faqs={faqs} />
    </>
  );
}
