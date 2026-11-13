"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/logo";
import { Eyebrow } from "@/components/ui/section-intro";
import { BRAND } from "@/lib/brand";
import { FOOTER_COLUMNS, withAdvertisedSuites } from "@/lib/site-nav";
import { useAdvertisedSuites } from "@/components/providers/advertised-suites-provider";

import { MARKET_SCOPE } from "@/lib/market";
import { cssTransition } from "@/lib/animations";

const linkStyle: React.CSSProperties = {
  fontWeight: 400,
  fontSize: "var(--text-xs)",
  // text-subtle, not text-muted: muted reads 4.2:1 on the deep-navy footer, under AA for small text.
  color: "var(--color-text-subtle)",
  textDecoration: "none",
  display: "block",
  marginBottom: "8px",
  transition: cssTransition("color"),
};

function FooterColumn({ label, links }: { label: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <Eyebrow as="div" surface="dark" size="group" style={{ marginBottom: "14px" }}>
        {label}
      </Eyebrow>
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          style={linkStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-gold)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-subtle)"; }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  const advertisedSuites = useAdvertisedSuites();
  return (
    <footer
      style={{
        backgroundColor: "var(--color-navy-deep)",
        padding: "64px 40px 32px",
        borderTop: "0.5px solid var(--color-gold-tint)",
      }}
    >
      <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto" }}>
        {/* Four-column grid */}
        <div
          style={{
            display: "grid",
            gap: "40px",
            marginBottom: "40px",
            // auto-fit fills the full width with however many columns are live
            // (launch-hidden columns collapse instead of leaving a gap).
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* The lockup for the ink shell: parchment mark, gold signature. */}
            <BrandLogo variant="on-dark" size={28} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
                fontSize: "var(--text-3xs)",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
              }}
            >
              {BRAND.publicTagline}
            </span>
            <span
              style={{
                fontWeight: 400,
                fontSize: "var(--text-xs)",
                color: "var(--color-text-subtle)",
                lineHeight: 1.6,
                maxWidth: "200px",
              }}
            >
              {BRAND.positioningStatement} for {MARKET_SCOPE}.
            </span>
          </div>

          {FOOTER_COLUMNS.map((col) => ({ ...col, links: withAdvertisedSuites(col.links, advertisedSuites) }))
            .filter((col) => col.links.length > 0)
            .map((col) => (
              <FooterColumn key={col.label} label={col.label} links={col.links} />
            ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "0.5px solid var(--color-white-wash)",
            paddingTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontWeight: 400,
              fontSize: "var(--text-2xs)",
              color: "var(--color-text-subtle)",
            }}
          >
            {BRAND.copyrightChrome}
          </span>
        </div>
      </div>
    </footer>
  );
}
