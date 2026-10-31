"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { TURNSTILE_SCRIPT_URL, TURNSTILE_SITE_KEY } from "@/lib/turnstile-config";

/** Turnstile's standard widget is a fixed 300px wide; narrower forms get its compact size. */
const STANDARD_WIDGET_WIDTH = 300;

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => void;
}

/**
 * The Cloudflare Turnstile bot check, placed inside a form. Renders nothing
 * when the check is not configured. The widget adds its answer to the form as
 * a hidden field, which the Server Action verifies (`submission-guard.ts`).
 *
 * Without JavaScript the check cannot run and the server would refuse the
 * send, so a <noscript> note says so up front and offers `fallbackEmail`.
 */
export function TurnstileWidget({ fallbackEmail }: { fallbackEmail: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  const renderWidget = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || renderedRef.current || !containerRef.current) return;
    const turnstile = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (!turnstile) return;
    const size = containerRef.current.clientWidth < STANDARD_WIDGET_WIDTH ? "compact" : "normal";
    turnstile.render(containerRef.current, { sitekey: TURNSTILE_SITE_KEY, theme: "light", size });
    renderedRef.current = true;
  }, []);

  // On a client-side navigation the script is already loaded and onReady
  // will not fire again, so try on mount too.
  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <>
      <Script src={TURNSTILE_SCRIPT_URL} strategy="afterInteractive" onReady={renderWidget} />
      <div ref={containerRef} />
      <noscript>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          Our security check needs JavaScript. If you can&apos;t turn it on, email us at{" "}
          <a href={`mailto:${fallbackEmail}`} style={{ color: "var(--color-gold-on-light)" }}>
            {fallbackEmail}
          </a>
          .
        </p>
      </noscript>
    </>
  );
}
