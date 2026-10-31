"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, ArrowRight } from "lucide-react";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { BrandLogo } from "@/components/ui/logo";
import { buttonProps } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section-intro";
import { BRAND } from "@/lib/brand";
import { NAV_LINKS, PLATFORM_NAV, SUITE_NAV, TOP_NAV } from "@/lib/site-nav";
import { cssTransition } from "@/lib/animations";
import { SITE_ROUTES } from "@/lib/routes";
import { Z_INDEX } from "@/lib/layers";

/* ── Navbar ───────────────────────────────────────────────────────────────── */

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* scroll detection */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* dropdown helpers */
  const openDropdown = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setDropdownOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  }, []);

  const closeDropdownImmediate = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setDropdownOpen(false);
  }, []);

  /* active link helper */
  const isActive = (href: string) => {
    if (href === NAV_LINKS.product.href) return pathname.startsWith(href);
    return pathname === href;
  };

  /**
   * The bar's surface, defined ONCE and consumed by both the pill and the
   * dropdown that hangs off it — the dropdown is part of the bar, so it must
   * never be styled independently of it. Two literals in two places is exactly
   * how a navy panel ended up hanging off a cream pill.
   *
   * `onLight` then drives every foreground in the bar: white on the navy top
   * state, navy on the cream scrolled state. Gold follows the same rule through
   * its own on-light token, because plain gold is a dark-surface colour.
   */
  const onLight = scrolled;
  const barSurface = {
    background: onLight ? "rgba(var(--color-nav-surface-rgb), 0.96)" : "var(--color-navy-primary)",
    // The SAME colour, opaque. The bar is a thin strip, so 0.96 + blur reads as
    // frosted glass; the dropdown is a 520px panel over body copy, and at the
    // same alpha the page showed straight through it — headings behind the menu
    // were legible through the menu. Matching the bar means matching its colour,
    // not inheriting a transparency that only works on a strip.
    panel: onLight ? "var(--color-nav-surface)" : "var(--color-navy-primary)",
    blur: "blur(12px)",
    border: onLight ? "1px solid var(--color-navy-hairline)" : "1px solid var(--color-gold-tint)",
    text: onLight ? "var(--color-text-primary)" : "var(--color-white)",
    mutedText: onLight ? "var(--color-text-secondary)" : "var(--color-text-inverse-muted)",
    accent: onLight ? "var(--color-gold-on-light)" : "var(--color-gold)",
  };

  /** Login and Contact us: quieter than the nav links, brightening on hover. */
  const secondaryActionProps = {
    style: {
      fontWeight: 400,
      fontSize: "var(--text-md)",
      color: barSurface.mutedText,
      textDecoration: "none",
      whiteSpace: "nowrap",
      transition: cssTransition("color"),
    },
    onMouseEnter: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.currentTarget.style.color = barSurface.text;
    },
    onMouseLeave: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.currentTarget.style.color = barSurface.mutedText;
    },
  } satisfies React.AnchorHTMLAttributes<HTMLAnchorElement>;

  const activeLinkStyle = (href: string): React.CSSProperties => {
    const active = isActive(href);
    return {
      fontWeight: 400,
      fontSize: "var(--text-md)",
      color: active ? barSurface.accent : barSurface.text,
      textDecoration: "none",
      transition: cssTransition("color"),
      borderBottom: active
        ? `2px solid ${barSurface.accent}`
        : "2px solid transparent",
      paddingBottom: "2px",
    };
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Transparent when scrolled so the inner container reads as a floating
          // pill; solid navy at the top so it stays legible over any page.
          backgroundColor: scrolled ? "transparent" : barSurface.background,
          borderBottom: scrolled
            ? "0.5px solid transparent"
            : "0.5px solid var(--color-gold-divider)",
          // The page's side padding lives on the bar, so the content box
          // inside it is exactly as wide as every section's content: the logo
          // lines up with the headings below it.
          padding: "0 var(--page-side-padding)",
          zIndex: Z_INDEX.header,
          transition: cssTransition(["background-color", "border-color"], "slow"),
        }}
      >
        <div
          style={{
            // On scroll this container morphs into a centered frosted pill.
            width: "100%",
            maxWidth: scrolled ? "var(--nav-pill-max-width)" : "var(--layout-max-width)",
            margin: "0 auto",
            padding: scrolled ? "0 24px" : "0",
            height: scrolled ? "48px" : "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            // Frosted CREAM pill when scrolled, transparent over the navy bar
            // at the top. The MARK is the platform's in both states; the text
            // beside it is not, and cannot be: white on cream is unreadable, so
            // the wordmark, the links and the menu button all follow the surface
            // they sit on. The mark is what carries the brand; the word next to
            // it only has to be legible.
            // Transparent at the top because the nav bar behind it is already
            // `barSurface.background`; the pill only paints its own surface once
            // it detaches on scroll.
            backgroundColor: scrolled ? barSurface.background : "transparent",
            backdropFilter: scrolled ? barSurface.blur : "none",
            WebkitBackdropFilter: scrolled ? barSurface.blur : "none",
            borderRadius: scrolled ? "var(--radius-pill)" : "0",
            border: scrolled ? barSurface.border : "1px solid transparent",
            boxShadow: scrolled ? "0 8px 32px rgba(var(--color-shadow-rgb), 0.28)" : "none",
            transition:
              cssTransition(["max-width", "height", "padding", "background-color", "border-color", "box-shadow", "border-radius"], "slow"),
          }}
        >
          {/* ── Logo ──────────────────────────────────────────────── */}
          <Link href={SITE_ROUTES.home} aria-label={`${BRAND.name} home`}>
            {/* The MARK is the platform's `primary` lockup — gold container,
                navy gate — in both scroll states, the same thing the app and
                admin sidebars render. It used to be two static SVGs that swapped
                on scroll (bare gold gate → bare navy gate), so a visitor moving
                between the site and the product saw three different marks for
                one brand.

                The WORDMARK is the one piece that cannot be fixed: it is plain
                text, and the bar it sits on is navy at the top of the page and
                cream once scrolled. White on cream is unreadable, so it takes
                the readable colour for its surface. The gold-on-navy container
                carries the brand either way. */}
            <BrandLogo
              size={scrolled ? 30 : 36}
              variant={onLight ? "on-light" : "on-dark"}
              wordmarkColor={barSurface.text}
            />
          </Link>

          {/* ── Center nav links ──────────────────────────────────── */}
          <div
            className="hidden md:flex"
            style={{ gap: "48px", alignItems: "center" }}
          >
            {/* Product (with dropdown) */}
            <div
              ref={dropdownRef}
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
              onFocus={openDropdown}
              onBlur={(e) => {
                // Close when focus leaves the whole dropdown (keyboard tab-out).
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  closeDropdown();
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeDropdownImmediate();
              }}
              style={{ position: "relative" }}
            >
              <Link
                href={NAV_LINKS.product.href}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                style={{
                  ...activeLinkStyle(NAV_LINKS.product.href),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(NAV_LINKS.product.href))
                    e.currentTarget.style.color = barSurface.accent;
                }}
                onMouseLeave={(e) => {
                  if (!isActive(NAV_LINKS.product.href))
                    e.currentTarget.style.color = barSurface.text;
                }}
              >
                {NAV_LINKS.product.label}
                <ChevronDown
                  size={12}
                  style={{
                    transition: cssTransition("transform", "base"),
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </Link>

              {/* ── Mega dropdown ─────────────────────────────────── */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 12px)",
                    left: "-16px",
                    width: "520px",
                    // Matches the bar it hangs off, in both states.
                    backgroundColor: barSurface.panel,
                    border: barSurface.border,
                    borderRadius: "var(--radius-card)",
                    padding: "24px",
                    boxShadow: onLight
                      ? "0 16px 40px rgba(var(--color-navy-primary-rgb), 0.14)"
                      : "0 16px 40px rgba(var(--color-shadow-rgb), 0.3)",
                    display: "flex",
                    gap: "24px",
                    zIndex: Z_INDEX.overlay,
                  }}
                >
                  {/* Left column — Modules */}
                  <div style={{ flex: "0 0 60%" }}>
                    <Eyebrow as="div" size="group" style={{ color: barSurface.accent, marginBottom: "12px" }}>
                      Suites
                    </Eyebrow>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      {SUITE_NAV.map((suite) => (
                        <Link
                          key={suite.href}
                          href={suite.href}
                          onClick={closeDropdownImmediate}
                          style={{
                            display: "block",
                            padding: "10px 8px",
                            borderRadius: "var(--radius-md)",
                            textDecoration: "none",
                            transition: cssTransition("background-color"),
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--color-gold-ghost)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: "var(--text-md)",
                              color: barSurface.text,
                              lineHeight: 1.3,
                            }}
                          >
                            {suite.label}
                          </div>
                          <div
                            style={{
                              fontWeight: 400,
                              fontSize: "var(--text-xs)",
                              color: barSurface.mutedText,
                              lineHeight: 1.4,
                            }}
                          >
                            {suite.description}
                          </div>
                        </Link>
                      ))}
                      {/* The module index is still one click away: the suites
                          group the catalogue, they do not hide it. */}
                      <Link
                        href={NAV_LINKS.allModules.href}
                        onClick={closeDropdownImmediate}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "8px",
                          padding: "8px",
                          fontSize: "var(--text-sm)",
                          fontWeight: 500,
                          color: barSurface.accent,
                          textDecoration: "none",
                        }}
                      >
                        {NAV_LINKS.allModules.label}
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  {/* Right column — Platform */}
                  <div style={{ flex: "0 0 35%" }}>
                    <Eyebrow as="div" size="group" style={{ color: barSurface.accent, marginBottom: "12px" }}>
                      Platform
                    </Eyebrow>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      {PLATFORM_NAV.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeDropdownImmediate}
                          style={{
                            fontWeight: 400,
                            fontSize: "var(--text-md)",
                            color: barSurface.text,
                            textDecoration: "none",
                            padding: "8px",
                            borderRadius: "var(--radius-md)",
                            transition: cssTransition("background-color"),
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--color-gold-ghost)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* The top-level links after Product — the same list the mobile menu shows. */}
            {TOP_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={activeLinkStyle(link.href)}
                onMouseEnter={(e) => {
                  if (!isActive(link.href)) e.currentTarget.style.color = barSurface.accent;
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.href)) e.currentTarget.style.color = barSurface.text;
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right-side actions ─────────────────────────────────── */}
          <div
            className="hidden md:flex"
            style={{ alignItems: "center", gap: "24px" }}
          >
            {/* Login and Contact us stay in both states — the pill keeps them,
                in the colours of the surface it sits on. */}
            <a href={NAV_LINKS.login.href} {...secondaryActionProps}>
              {NAV_LINKS.login.label}
            </a>
            <Link href={NAV_LINKS.contact.href} {...secondaryActionProps}>
              {NAV_LINKS.contact.label}
            </Link>

            <a
              href={NAV_LINKS.startTrial.href}
              {...buttonProps({ size: "nav" })}
            >
              {NAV_LINKS.startTrial.label} &rarr;
            </a>
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────── */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-haspopup="dialog"
            aria-controls="mobile-menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            {/* Follows the bar it sits on, like the links beside it. */}
            <Menu size={18} color={barSurface.text} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Spacer to prevent content from sliding behind fixed nav */}
      <div style={{ height: "64px" }} />

      {/* ── Mobile menu ─────────────────────────────────────────── */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
      />
    </>
  );
}
