"use client";

import { Webhook, KeyRound, Network, ShieldCheck } from "lucide-react";
import { ProductModuleLayout, type ModuleConfig, type ModulePageData } from "@/components/product/module-layout";
import { ConnectPreview } from "@/components/product/previews/connect-preview";
import { BRAND } from "@/lib/brand";

const config: ModuleConfig = {
  moduleKey: "connect",
  headline: `${BRAND.name} in your existing stack.`,
  description:
    `The operational record ${BRAND.name} builds doesn't have to stay inside ${BRAND.name}. Push sanctioned vouchers into your accounting system, approved orders into your ERP, or role changes into your HRIS — using signed webhooks, scoped API keys, and a documented REST API.`,
  previewPath: "settings / integrations",
  preview: <ConnectPreview />,

  pillars: [
    {
      icon: Webhook,
      title: "Signed webhooks for each step that matters",
      planFeature: "apiAccess",
      body:
        "Subscribe to each step of a payment voucher or purchase order, every change to people and roles, every change to a supplier's bank details — or every entry in your audit trail. Each event has a fixed name and a documented example payload; deliveries are signed to the Standard Webhooks scheme and retried on failure.",
    },
    {
      icon: KeyRound,
      title: "Scoped, replaceable API keys",
      planFeature: "apiAccess",
      body:
        "Generate keys per integration and give each only the read permissions it needs — every permission opens exactly the endpoints it names, and long lists come back a page at a time. Every successful call is recorded, and you can see when each key was last used. Issue a replacement key before retiring the old one, so integrations never stop.",
    },
    {
      icon: Network,
      title: "Build integrations on a documented API",
      planFeature: "apiAccess",
      body:
        `A documented REST API and signed webhooks let you connect ${BRAND.name} to your accounting system, ERP, or HRIS. Single sign-on via OpenID Connect (OIDC) or SAML 2.0, and automated user provisioning via SCIM, are built in.`,
    },
    {
      icon: ShieldCheck,
      title: "Security on by default",
      body:
        "All delivery URLs must be HTTPS. Every delivery is signed with a secret only your subscription holds, so your receiver can reject forged or replayed requests. Secrets rotate without downtime, and every delivery attempt is logged and can be retried.",
    },
  ],

  useCases: [
    {
      title: `Reconcile ${BRAND.name} payments into your accounting system`,
      planFeature: "apiAccess",
      body:
        `When the MD sanctions a voucher, ${BRAND.name} fires a signed webhook carrying the voucher's reference, amount, currency, department and supplier ID. Your integration reads the voucher and the supplier from the API and posts it to your accounting system as a bill — no double-entry, no month-end reconciliation gap. Or read the balanced journal entries for approved vouchers and payments straight from the API, coded with your own chart of accounts.`,
    },
    {
      title: "React to role changes in your own systems",
      planFeature: "apiAccess",
      body:
        `Subscribe to role-change events and forward them wherever you need — an internal dashboard, a review queue, your data warehouse. (${BRAND.name} emits the event; provisioning stays one-directional — your IdP remains the source of authority via inbound SCIM.)`,
    },
    {
      title: "Post high-value approvals to Slack",
      planFeature: "apiAccess",
      body:
        "Forward the signed sanction event through a small relay of your own, and every approval above your threshold lands in #finance-audit in real time — without granting broad access to the platform UI.",
    },
    {
      title: "Build your own internal integrations",
      planFeature: "apiAccess",
      body:
        "Enterprise administrators open the full API reference, and every webhook event with its example payload, from inside the app. Your platform team can build an integration to your internal data warehouse in an afternoon.",
    },
  ],

  relatedModules: [
    { moduleKey: "pay", desc: "Approved payments as journal entries for your ledger" },
    { moduleKey: "procure", desc: "Send approved orders to your ERP through webhooks and the API" },
    { moduleKey: "audit", desc: "Stream audit events to your SIEM or log aggregator" },
  ],
};

export function ConnectModulePage(data: ModulePageData) {
  return <ProductModuleLayout config={config} {...data} />;
}
