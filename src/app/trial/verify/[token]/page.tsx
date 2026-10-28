import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { VerifyConfirm, VerifyResult } from "./client";
import { TRIAL_STEPS_DONE, TrialStepper } from "../../stepper";
import { BRAND } from "@/lib/brand";
import { exceedsLimit } from "@/lib/form-rules";
import { VERIFY_INCOMPLETE_MESSAGE } from "./state";
import { Z_INDEX } from "@/lib/layers";

export const metadata: Metadata = {
  title: `Verifying your ${BRAND.name} trial`,
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * The magic link's landing page. Opening it spends nothing: it shows a confirm
 * button, and only pressing that (a POST to `confirmTrialVerification`) spends
 * the token. Email link scanners open links before the person does — had the
 * page spent the token on load, a scanner would receive the one-time invite and
 * the person would find their link already used.
 */
export default async function VerifyPage({ params }: PageProps) {
  const { token } = await params;
  // An absurd token is never offered to the platform.
  const plausible = token.length > 0 && !exceedsLimit(token, "token");

  return (
    <>
      <Navbar />
      <main
        style={{
          backgroundColor: "var(--color-bg)",
          padding: "120px 32px",
          minHeight: "70vh",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        <div style={{ maxWidth: "var(--measure-narrow)", margin: "0 auto", position: "relative", zIndex: Z_INDEX.raised }}>
          <TrialStepper current={TRIAL_STEPS_DONE} />
          {plausible ? (
            <VerifyConfirm token={token} />
          ) : (
            <VerifyResult status="not_found" message={VERIFY_INCOMPLETE_MESSAGE} token={token} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
