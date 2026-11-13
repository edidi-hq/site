import type { Metadata } from "next";
import { VaultModulePage } from "@/components/product/pages/vault-module-page";
import { fetchPricingData } from "@/lib/pricing";
import { modulePageData } from "@/lib/module-availability";
import { pageMetadata } from "@/lib/seo";
import { DOCUMENTS_KEPT } from "@/lib/record-keeping";
import { notFoundUnlessPublic } from "@/lib/module-route";
import { moduleName, moduleHref } from "@/lib/brand";

export const metadata: Metadata = pageMetadata({
  path: moduleHref("vault"),
  title: `${moduleName("vault")} — Institutional memory, searchable`,
  description: "Every voucher, purchase order, goods receipt and supplier invoice in one list, with its files and version history. Replace scattered drives, paper files and lost email attachments with one place to find what was approved.",
  socialDescription: `Every financial record in one list, with its files and history — one filter away and ${DOCUMENTS_KEPT}.`,
});

export default async function ProductVaultPage() {
  notFoundUnlessPublic("vault");
  const pricingData = await fetchPricingData();
  return <VaultModulePage {...modulePageData("vault", pricingData)} />;
}
