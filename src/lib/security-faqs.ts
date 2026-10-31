import { CONTACT_EMAIL, SECURITY_TRIAGE_TIME } from "@/lib/contacts";
import { DATA_RESIDENCY_PUBLIC, RESIDENCY_REQUEST_LINE } from "@/lib/subprocessors";
import { ACCESS_ENDS } from "@/lib/compliance-posture";
import { BRAND } from "@/lib/brand";
/**
 * Security FAQ content — the single source for both the visible accordion on
 * /product/security and the FAQPage JSON-LD on that route. Keeping them in one
 * place stops the rendered copy and the structured data from drifting apart.
 */

interface SecurityFaq {
  q: string;
  a: string;
}

export const SECURITY_FAQS: SecurityFaq[] = [
  {
    q: `Who at ${BRAND.name} can access our data?`,
    a: `No ${BRAND.name} engineer can read customer data by default. Platform administrators can be granted audit-logged, permission-gated access to a specific tenant for support purposes — every action is written to the same tamper-evident audit trail the customer sees.`,
  },
  {
    q: "What happens when someone leaves our organisation?",
    a: `Deactivation ends their active sessions ${ACCESS_ENDS}. If they are deprovisioned through your identity provider (SCIM), this happens automatically when it marks the user inactive. Their historical actions remain in the audit trail — the record is preserved, not deleted.`,
  },
  {
    q: "Can we export everything — for an auditor, regulator, or migration?",
    a: "Yes. The audit-trail export bundles every approval, signature, query, and role change for any period of up to a year into a regulator-ready file. Document PDFs and attachments are exported alongside. You own your data; we don't hold it hostage.",
  },
  {
    q: "Do you support SSO and SCIM?",
    a: "Yes — single sign-on with any OpenID Connect (OIDC) or SAML 2.0 provider, tested with Okta, Microsoft Entra and Google Workspace, and automatic user setup (SCIM 2.0) from Okta and Microsoft Entra. Roles beyond staff access are approved by a person in your organisation first.",
  },
  {
    q: "Where is our data hosted and can it stay in a specific region?",
    a: `${DATA_RESIDENCY_PUBLIC} ${RESIDENCY_REQUEST_LINE}`,
  },
  {
    q: "Can we sign a Data Processing Agreement?",
    a: "Yes. A DPA is available on request for any enterprise engagement. Contact us and we'll send the current version.",
  },
  {
    q: "Do you have a responsible disclosure policy?",
    a: `Yes. Security researchers can report vulnerabilities to ${CONTACT_EMAIL.security}. We triage ${SECURITY_TRIAGE_TIME} and do not pursue legal action against good-faith researchers following standard responsible-disclosure practice.`,
  },
];
