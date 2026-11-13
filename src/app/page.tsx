import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { HowItWorks } from "@/components/sections/how-it-works";
import { SocialProof } from "@/components/sections/social-proof";
import { FeaturesGrid } from "@/components/sections/features-grid";
import { Pricing } from "@/components/sections/pricing";
import { CtaBanner } from "@/components/sections/cta-banner";
import { fetchPricingData } from "@/lib/pricing";
import { advertisedModuleKeys } from "@/lib/verified-claims";
import { JsonLd, softwareApplicationSchema } from "@/lib/seo";

// Title/description/OpenGraph are inherited from the root layout (the home
// page's canonical metadata). Here we only declare the self-canonical.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const pricingData = await fetchPricingData();

  return (
    <>
      <JsonLd data={softwareApplicationSchema(pricingData)} />
      <Navbar />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <SocialProof />
        <FeaturesGrid moduleKeys={advertisedModuleKeys(pricingData)} />
        <Pricing data={pricingData} />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
