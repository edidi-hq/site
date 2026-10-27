import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, type LegalSection } from "@/components/legal/legal-page";
import { pageMetadata } from "@/lib/seo";
import { contactHref } from "@/app/contact/tabs";
import { BRAND, LEGAL_PAGES, SITE_HOST } from "@/lib/brand";
import { DATA_RESIDENCY, RESIDENCY_REQUEST_LINE, SUBPROCESSOR_CATEGORIES } from "@/lib/subprocessors";
import { SITE_ROUTES } from "@/lib/routes";

export const metadata: Metadata = pageMetadata({
  path: LEGAL_PAGES.privacy,
  title: "Privacy policy",
  description: `How ${BRAND.name} collects, uses, shares, and protects personal data. Plain-language summary of our practices under the GDPR, the Nigeria Data Protection Act 2023, and equivalent data-protection laws.`,
  socialTitle: `${BRAND.name} privacy policy`,
  socialDescription: "What we collect, why, how we store it, who processes it on our behalf, and your rights as a data subject.",
});

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <>
        <p>
          {BRAND.name} (&ldquo;{BRAND.name}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the approval, procurement, and
          records platform available at <Link href={SITE_ROUTES.home}>{SITE_HOST}</Link> and{" "}
          <a href={BRAND.appUrl} rel="noreferrer">
            {new URL(BRAND.appUrl).host}
          </a>
          . This policy explains how we handle personal data in that service and on this marketing website.
        </p>
        <p>
          For privacy questions, contact{" "}
          <Link href={contactHref("privacy")}>our privacy enquiry form</Link>.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    heading: "What we collect",
    body: (
      <>
        <p>
          <strong>Account information.</strong>{" "}Name, work email, organisation, role, optional profile details, and
          any identity attributes your employer passes through SSO or SCIM.
        </p>
        <p>
          <strong>Content you create.</strong>{" "}Payment vouchers, purchase orders, attachments, approval comments,
          signatures, audit-trail events, and any other material you submit while using the platform.
        </p>
        <p>
          <strong>Usage and device data.</strong>{" "}IP address, user-agent, timestamps, and pages or actions accessed —
          recorded primarily to power the tamper-evident audit trail and to secure the service.
        </p>
        <p>
          <strong>Approximate location.</strong>{" "}The country, and where available the region, our hosting provider
          derives from your IP address. We use it to start forms and price lists on your country and currency, and,
          when you ask for a free trial, to check the request against sanctions rules. It is not stored on its own;
          a trial request keeps only the outcome of that check.
        </p>
        <p>
          <strong>Support correspondence.</strong>{" "}Messages, phone numbers (if shared), and any information you
          voluntarily include when contacting us.
        </p>
        <p>
          <strong>Free-trial record.</strong>{" "}When an organisation starts a free trial, we keep a one-way scrambled
          code derived from the billing email address the trial was started with &mdash; never the address itself
          &mdash; together with the date and which organisation started the trial. If that organisation later replaces
          its billing email address, the same kind of code is kept for the address it replaced. The code cannot be
          turned back into an email address; it only lets us check whether an address we are given has already been
          used for a free trial. See <a href="#how-long">How long we keep it</a>.
        </p>
        <p>
          <strong>Marketing-site analytics.</strong>{" "}We do not run third-party analytics on this website, and we do
          not place advertising cookies.
        </p>
      </>
    ),
  },
  {
    id: "why-we-collect",
    heading: "Why we collect it (lawful basis)",
    body: (
      <>
        <p>We process personal data only where we have a lawful basis to do so:</p>
        <ul>
          <li>
            <strong>Contract.</strong>{" "}To provide the {BRAND.name} service to your organisation — authenticating users,
            routing approvals, generating documents, maintaining audit records.
          </li>
          <li>
            <strong>Legitimate interest.</strong>{" "}To secure the service, prevent abuse and financial crime, verify
            counterparty and payment details, monitor operational health, improve the product, maintain business
            records, and produce aggregated and de-identified statistics &mdash; including corroborating vendor and
            payee details across organisations, in a form that does not identify any customer or individual.
          </li>
          <li>
            <strong>Legal obligation.</strong>{" "}To meet tax, accounting, anti-fraud, and other regulatory duties.
          </li>
          <li>
            <strong>Consent.</strong>{" "}For optional marketing communications, where we ask first and you can withdraw
            at any time.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-share",
    heading: "How we share data",
    body: (
      <>
        <p>We do not sell personal data. We share it only in the following, narrowly defined cases:</p>
        <ul>
          <li>
            <strong>Within your organisation.</strong>{" "}Approval workflows route documents and events to other users
            in your tenant according to roles you configure.
          </li>
          <li>
            <strong>With sub-processors.</strong>{" "}Infrastructure and operational providers we engage to run the
            service. See the list under &ldquo;Sub-processors&rdquo; below.
          </li>
          <li>
            <strong>To comply with law.</strong>{" "}Where a valid legal process compels disclosure. We challenge
            over-broad requests and notify affected customers where law permits.
          </li>
          <li>
            <strong>In a corporate transaction.</strong>{" "}If {BRAND.name} is involved in a merger, acquisition, or asset
            sale, data may transfer under equivalent privacy commitments.
          </li>
          <li>
            <strong>As de-identified, aggregated information.</strong>{" "}We corroborate supplier, vendor, and payee
            details across organisations using de-identified information that carries no identifier of you, your
            organisation, or any individual, and no stored link back to either. Counterparty identities are
            represented by one-way fingerprints that cannot be reversed, and a fact is only surfaced once several
            unrelated organisations independently corroborate it. We never disclose which organisation contributed a
            fact, and we do not sell this information. See{" "}
            <a href="#verification-network">The Verification Network</a> below for detail and how to opt out.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "verification-network",
    heading: "The Verification Network",
    body: (
      <>
        <p>
          Payment fraud in Nigeria frequently follows a pattern that is invisible inside a single organisation: a
          supplier&rsquo;s bank details change shortly before a large payment. One organisation sees an unremarkable
          edit. Several organisations seeing the same change to the same supplier in the same period see a warning.
        </p>
        <p>
          The Verification Network lets {BRAND.name} surface that warning without any organisation disclosing anything
          about itself or its records. It works as follows:
        </p>
        <ul>
          <li>
            <strong>What is contributed.</strong>{" "}Verification facts only &mdash; for example, that a bank account has
            been independently confirmed to belong to a named supplier. Never document content, attachments, amounts,
            names, comments, or free text.
          </li>
          <li>
            <strong>How identities are handled.</strong>{" "}A supplier&rsquo;s account number is converted to a one-way
            cryptographic fingerprint before it leaves your tenant. The fingerprint cannot be reversed, and no reverse
            map exists. It is derived on a separate cryptographic path from the identifiers used inside your tenant, so
            the two cannot be correlated.
          </li>
          <li>
            <strong>No link to you.</strong>{" "}Contributed facts are stored without any identifier of your organisation.
            There is no stored path from a fact back to the organisation that contributed it.
          </li>
          <li>
            <strong>Separation.</strong>{" "}The network store is reached over a separate, restricted database login that
            has no access to operational tables, and operational systems have no access to it.
          </li>
          <li>
            <strong>Corroboration threshold.</strong>{" "}A fact is never surfaced until a minimum number of unrelated
            organisations independently corroborate it.
          </li>
          <li>
            <strong>Participation.</strong>{" "}On by default, because the protection depends on participation. Opt out at
            any time from your organisation&rsquo;s settings, or by writing to us. Opting out stops future
            contributions within 30 days and also stops you receiving network signals; facts already contributed carry
            no link to you and therefore cannot be located or removed. Fraud detection inside your own organisation is
            unaffected either way.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sub-processors",
    heading: "Sub-processors",
    body: (
      <>
        <p>
          We engage trusted infrastructure providers to operate the platform, and limit each to the data it needs to
          perform its function. The categories of provider we rely on today are:
        </p>
        <ul>
          {SUBPROCESSOR_CATEGORIES.map((category) => (
            <li key={category.purpose}>
              {category.purpose} — {category.region}.{category.detail ? ` ${category.detail}` : null}
            </li>
          ))}
        </ul>
        <p>
          The specific named providers in each category are shared with prospective
          customers through <Link href={contactHref("privacy")}>our privacy enquiry form</Link>, typically alongside a
          Data Processing Agreement.
        </p>
      </>
    ),
  },
  {
    id: "where-we-store",
    heading: "Where we store it",
    body: (
      <>
        <p>
          Primary application data is stored in the {DATA_RESIDENCY.primary} on a managed PostgreSQL service. Document
          attachments are stored in encrypted object storage in the {DATA_RESIDENCY.attachments}. Every night a full
          copy of the data is encrypted with a key we hold offline and stored with an independent provider in the{" "}
          {DATA_RESIDENCY.backups}, locked against deletion: daily copies are kept for 30 days and monthly copies for 12
          months.
        </p>
        <p>{RESIDENCY_REQUEST_LINE}</p>
      </>
    ),
  },
  {
    id: "how-long",
    heading: "How long we keep it",
    body: (
      <>
        <p>
          <strong>Account data.</strong>{" "}Retained while your organisation is an {BRAND.name} customer, plus a short
          grace period for reactivation, then deleted or anonymised.
        </p>
        <p>
          <strong>Content &amp; documents.</strong>{" "}Retained per your plan&rsquo;s retention policy. Your
          administrator can export documents at any time, and delete them subject to statutory minimum-retention
          obligations &mdash; financial records such as processed vouchers and purchase orders are held for the minimum
          period Nigerian law (the Nigeria Data Protection Act 2023 and CAMA) requires, and for the duration of any active legal hold, before deletion.
        </p>
        <p>
          <strong>Audit logs.</strong>{" "}Retained permanently for the lifetime of the tenant. Because the log is the
          compliance record of who did what, it is never purged while the account is active.
        </p>
        <p>
          <strong>Support emails and marketing enquiries.</strong>{" "}Retained for the period needed to respond and for
          reasonable record-keeping.
        </p>
        <p>
          <strong>Free-trial record.</strong>{" "}Kept indefinitely, so that each email address can start only one
          free trial. It is not deleted when the organisation&rsquo;s account is deleted (only its link to that
          organisation is removed), and it is not deleted when you ask us to erase your personal data. We keep it on
          the basis of our legitimate interest in preventing fraud and abuse of the free trial (GDPR Article 6(1)(f),
          read with Recital 47, and the legitimate-interest basis in section 25 of the Nigeria Data Protection Act
          2023). It holds only the scrambled code described under{" "}
          <a href="#what-we-collect">What we collect</a>, the date it was recorded, and &mdash; until that
          account is deleted &mdash; which organisation started the trial.
        </p>
        <p>
          <strong>De-identified and aggregated information.</strong>{" "}Retained indefinitely. It contains no personal
          data and no identifier of any customer, so it is not deleted when an account closes and cannot be deleted on
          request &mdash; it cannot be traced to any customer or individual.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: (
      <>
        <p>
          If you are in a jurisdiction with statutory data-protection rights (EU/EEA under GDPR, Nigeria under the Nigeria Data Protection Act 2023,
          California under CCPA, United Kingdom under UK GDPR, and others), you have the right to:
        </p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>
            Request deletion, subject to legal and contractual retention obligations and to the free-trial record
            described under <a href="#how-long">How long we keep it</a>.
          </li>
          <li>Receive a portable copy of your data.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent where consent is the lawful basis.</li>
          <li>Lodge a complaint with your local supervisory authority.</li>
        </ul>
        <p>
          Where {BRAND.name} processes your data on behalf of your employer (most features of the platform), we will
          forward your request to the relevant administrator and assist with its fulfilment. For direct requests,
          email <Link href={contactHref("privacy")}>our privacy enquiry form</Link>.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "How we protect it",
    body: (
      <>
        <p>
          Security is a structural feature of the platform, not a bolt-on. The full stack — tenant isolation,
          role-based authority, session integrity, audit trail, access lifecycle, encryption — is documented at{" "}
          <Link href={LEGAL_PAGES.security}>{LEGAL_PAGES.security}</Link>.
        </p>
        <p>
          No system is perfectly secure; we operate a responsible-disclosure programme and welcome good-faith
          reports through our <Link href={contactHref("disclosure")}>responsible-disclosure form</Link>.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children",
    body: (
      <p>
        {BRAND.name} is a business platform. It is not directed at children under 16 and we do not knowingly collect
        their personal data. If you believe a child has provided data to us, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this policy as our service evolves or laws change. Material changes will be communicated to
        account administrators and noted on this page with a new effective date. Continuing to use {BRAND.name} after a
        change constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <p>
        For any question about this policy, or to exercise a right listed above, write to{" "}
        <Link href={contactHref("privacy")}>our privacy enquiry form</Link>. We respond within one business day for
        enterprise customers and otherwise within a reasonable time not exceeding the statutory deadline applicable
        to your jurisdiction.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="PRIVACY POLICY"
      title="How we handle your data."
      lede={`This policy is a plain-language summary of how ${BRAND.name} collects, uses, and protects personal data. It is designed to be read by a person, not skimmed for keywords.`}
      effectiveDate="26 October 2026"
      sections={SECTIONS}
      footerNote={
        <>
          <strong>Note.</strong>{" "}This policy reflects our current practices. It is not legal advice. Organisations
          with bespoke compliance requirements (regulated industries, specific residency mandates, additional
          controller-processor clauses) should reach out through{" "}
          <Link href={contactHref("privacy")} style={{ color: "var(--color-gold-on-light)", textDecoration: "none" }}>
            our privacy enquiry form
          </Link>{" "}
          for a tailored Data Processing Agreement.
        </>
      }
    />
  );
}
