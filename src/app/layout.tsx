import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { MotionProvider } from "@/components/providers/motion-provider";
import { AdvertisedSuitesProvider } from "@/components/providers/advertised-suites-provider";
import { fetchPricingData } from "@/lib/pricing";
import { advertisedSuiteKeys } from "@/lib/verified-claims";
import { BRAND } from "@/lib/brand";
import { JsonLd, organizationSchema } from "@/lib/seo";
import { AUDIT_TRAIL_KEPT, SITE_DESCRIPTION } from "@/lib/record-keeping";
import "./globals.css";
import { SITE_SLOGAN, SITE_URL } from "@/lib/seo";
import { NO_SCRIPT_CSS } from "@/lib/no-script";
import { SURFACE_CSS } from "@/lib/surfaces";

const OG_TITLE = `${BRAND.name} — ${SITE_SLOGAN}`;
const OG_DESCRIPTION = `Replace scattered approvals with structured authority — a tamper-evident audit trail of every decision, approval, and process your organisation runs, ${AUDIT_TRAIL_KEPT}.`;

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

// Display font — self-hosted from the brand SSOT (@edidi-hq/core/brand/fonts),
// so the file lives in exactly one place across app / site / admin.
const marcellus = localFont({
  src: "../../node_modules/@edidi-hq/core/src/brand/fonts/Marcellus-Regular.ttf",
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND.name} — ${BRAND.positioningStatement}`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
  icons: {
    // The SVG first: browsers that support it render the mark crisply at any
    // size; the .ico stays for those that do not.
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The menus link only to suites with a signed-off module (`@/lib/verified-claims`).
  const advertisedSuites = advertisedSuiteKeys(await fetchPricingData());
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${ibmPlexMono.variable} ${marcellus.variable}`}
    >
      <head>
        <JsonLd data={organizationSchema()} />
      </head>
      <body className="antialiased">
        {/* Each painted surface's focus-ring colour (src/lib/surfaces.ts). */}
        <style>{SURFACE_CSS}</style>
        {/* Only when JavaScript is off: show what script would otherwise reveal. */}
        <noscript>
          <style>{NO_SCRIPT_CSS}</style>
        </noscript>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <AdvertisedSuitesProvider suites={advertisedSuites}>
            <ScrollProgress />
            {children}
          </AdvertisedSuitesProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
