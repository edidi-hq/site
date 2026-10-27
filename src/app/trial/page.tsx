import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TrialForm } from "./trial-form";
import { startingCountry } from "@/data/countries";
import { visitorCountry } from "@/lib/visitor";
import { pageMetadata } from "@/lib/seo";
import { TRIAL_LENGTH, TRIAL_PLAN_NAME, TRIAL_SEAT_CAP, NO_CARD_REQUIRED, TRIAL_SETUP_TIME } from "@/lib/trial-terms";
import { SITE_PAGES, BRAND } from "@/lib/brand";
import { Z_INDEX } from "@/lib/layers";

export const metadata: Metadata = pageMetadata({
  path: SITE_PAGES.trial(),
  title: `Start your ${TRIAL_LENGTH} trial`,
  description: `Provision an ${BRAND.name} workspace ${TRIAL_SETUP_TIME}. Full ${TRIAL_PLAN_NAME} features on a ${TRIAL_SEAT_CAP}-seat pilot workspace, with your real organisational data. ${NO_CARD_REQUIRED}.`,
  socialTitle: `Start your ${TRIAL_LENGTH} ${BRAND.name} trial`,
  socialDescription: `Provision ${TRIAL_SETUP_TIME}. Full ${TRIAL_PLAN_NAME} features on a ${TRIAL_SEAT_CAP}-seat pilot workspace. Your organisation's data, not a demo.`,
});

export default async function TrialPage() {
  // Built per visit: the form starts on the visitor's own country.
  const initialCountry = startingCountry(await visitorCountry());
  return (
    <>
      <Navbar />
      <main
        id="main"
        style={{
          backgroundColor: "var(--color-bg)",
          padding: "56px 40px 96px",
          minHeight: "70vh",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        <div style={{ maxWidth: "var(--layout-max-width)", margin: "0 auto", position: "relative", zIndex: Z_INDEX.raised }}>
          <TrialForm initialCountry={initialCountry} />
        </div>
      </main>
      <Footer />
    </>
  );
}
