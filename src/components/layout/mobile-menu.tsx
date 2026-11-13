"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section-intro";
import { MOTION_DURATION, MOTION_EASE, fadeUp } from "@/lib/animations";
import { NAV_LINKS, PLATFORM_NAV, SUITE_NAV, TOP_NAV, withAdvertisedSuites } from "@/lib/site-nav";
import { useAdvertisedSuites } from "@/components/providers/advertised-suites-provider";

import { Z_INDEX } from "@/lib/layers";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
}

// The same lists the desktop bar renders (`site-nav.ts`): advertised suites,
// then "All modules" so the full catalogue stays one tap away.
const PRODUCT_SUITES = [...SUITE_NAV, NAV_LINKS.allModules];


export function MobileMenu({ open, onClose, pathname }: MobileMenuProps) {
  const productSuites = withAdvertisedSuites(PRODUCT_SUITES, useAdvertisedSuites());
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Modal dialog behaviour: Escape to close, focus trap, focus-in on open and
  // restore on close, and a body-scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = overlayRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={overlayRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--color-navy-primary)",
            zIndex: Z_INDEX.mobileMenu,
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            overflow: "auto",
          }}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <BrandLogo size={28} variant="on-dark" />
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={24} color="var(--color-gold)" />
            </button>
          </div>

          {/* ── Content ─────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              marginTop: "32px",
              flex: 1,
            }}
          >
            {/* Product section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
              {/* Section header */}
              <Eyebrow as="div" surface="dark" size="group" style={{ marginBottom: "16px" }}>
                Product
              </Eyebrow>

              {/* Module links */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {productSuites.map((mod) => (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    onClick={onClose}
                    style={{
                      fontWeight: 400,
                      fontSize: "var(--text-xl)",
                      color: isActive(mod.href) ? "var(--color-gold)" : "var(--color-white)",
                      textDecoration: "none",
                    }}
                  >
                    {mod.label}
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  backgroundColor: "var(--color-gold-tint)",
                  margin: "8px 0",
                }}
              />

              {/* Platform links */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {PLATFORM_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      fontWeight: 400,
                      fontSize: "var(--text-lg)",
                      color: isActive(item.href) ? "var(--color-gold)" : "var(--color-text-subtle)",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Top-level links other than Product (Product is expanded above) */}
            {TOP_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  style={{
                    fontWeight: 400,
                    fontSize: "var(--text-xl)",
                    color: isActive(link.href) ? "var(--color-gold)" : "var(--color-white)",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* ── Bottom section ──────────────────────────────────────── */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              paddingTop: "24px",
              borderTop: "1px solid var(--color-gold-tint)",
            }}
          >
            <a
              href={NAV_LINKS.login.href}
              style={{
                fontWeight: 400,
                fontSize: "var(--text-md)",
                color: "var(--color-text-subtle)",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              {NAV_LINKS.login.label}
            </a>
            <ButtonLink
              href={NAV_LINKS.contact.href}
              onClick={onClose}
              variant="secondary"
              surface="dark"
              size="md"
              fullWidth
            >
              {NAV_LINKS.contact.label}
            </ButtonLink>
            <ButtonLink href={NAV_LINKS.startTrial.href} onClick={onClose} size="md" fullWidth>
              {NAV_LINKS.startTrial.label} &rarr;
            </ButtonLink>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
