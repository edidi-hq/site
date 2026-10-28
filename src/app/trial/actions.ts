"use server";

/**
 * submitTrialRequest — server action behind the /trial form. Forwards
 * the submission to the platform's public trial endpoint and returns a
 * serialisable state object for `useActionState` on the client side.
 *
 * The platform does the real validation, eligibility routing, and
 * magic-link dispatch. This module is a thin adapter that keeps the
 * platform URL out of the client bundle and normalises the response
 * shape. The verify page's button (`confirmTrialVerification`) and the
 * expired-link resend (`reissueTrialToken`) live here too.
 *
 * `"use server"` modules can only export async functions in Next.js 16
 * — the form-state type + INITIAL_STATE live in `./state` so the
 * client form and this module can share them without tripping the
 * compiler check.
 */

import { redirect } from "next/navigation";
import {
  isTrialRole,
  OTHER_ROLE,
  TRIAL_FIELDS,
  type TrialFieldErrors,
  type TrialFormState,
} from "./state";
import { submittedValues } from "@/lib/submitted-values";
import {
  mapTrialResponse,
  type TrialResponsePayload,
} from "./map-response";
import { isOrgSize } from "@/lib/org-size";
import { isSelectableCountry } from "@/data/countries";
import { platformFetch } from "@/lib/platform-fetch";
import { PLATFORM_API_PATHS, PLATFORM_ORIGIN } from "@/lib/platform";
import { buildSectorValue, isStorableSector } from "@edidi-hq/core/sectors";
import { humanCheckRefusal, rateLimitRefusal, screenSubmission } from "@/lib/submission-guard";
import { CONTACT_EMAIL } from "@/lib/contacts";
import { exceedsLimit, FORM_MESSAGES, tooLongMessage, withinLimit } from "@/lib/form-rules";
import { onBehalfOfVisitorHeaders } from "@/lib/visitor";
import { trialEmailError } from "./email-check";
import { VERIFY_FAILED_MESSAGE, type VerifyState } from "./verify/[token]/state";

export async function submitTrialRequest(
  _previous: TrialFormState,
  formData: FormData,
): Promise<TrialFormState> {
  const answer = await answerTrialRequest(formData);
  return answer.status === "error"
    ? { ...answer, values: submittedValues(formData, TRIAL_FIELDS) }
    : answer;
}

async function answerTrialRequest(formData: FormData): Promise<TrialFormState> {
  const screen = await screenSubmission(formData, "trialRequest");
  // A filled decoy field: answer as if it succeeded, and forward nothing.
  if (screen.outcome === "decoy") {
    return { status: "queued_for_review", message: "Thanks — we'll be in touch shortly." };
  }
  if (screen.outcome === "refused") return { status: "error", message: screen.message };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const organisation = String(formData.get("organisation") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const orgSize = String(formData.get("orgSize") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const sectorChoice = String(formData.get("sector") ?? "").trim();
  const sectorOther = withinLimit(String(formData.get("sectorOther") ?? "").trim(), "otherDetail");
  // The app requires one storable industry: a listed one, or "Other: <text>".
  const sector = buildSectorValue(sectorChoice, sectorOther);
  const source = String(formData.get("source") ?? "").trim();
  const roleOther = withinLimit(String(formData.get("roleOther") ?? "").trim(), "otherDetail");
  const consent = formData.get("consent") === "on";

  // Light client-side validation so we fail fast before hitting the
  // platform. Platform re-validates and is the source of truth.
  const fieldErrors: TrialFieldErrors = {};
  if (!name) fieldErrors.name = "Please share your full name.";
  const emailError = trialEmailError(email);
  if (emailError) fieldErrors.email = emailError;
  if (!organisation) fieldErrors.organisation = "Please share your organisation.";
  if (!isTrialRole(role)) {
    fieldErrors.role = "Please select your role.";
  }
  if (!isOrgSize(orgSize)) {
    fieldErrors.orgSize = "Please select your organisation size.";
  }
  if (!sectorChoice) fieldErrors.sector = "Please select your industry.";
  else if (sectorChoice === "Other" && !sectorOther) {
    fieldErrors.sector = "Please describe your industry.";
  } else if (!isStorableSector(sector)) {
    fieldErrors.sector = "Please choose your industry from the list.";
  }
  if (!country) fieldErrors.country = "Please select your country.";
  else if (!isSelectableCountry(country.toUpperCase())) {
    fieldErrors.country = "Please choose your country from the list.";
  }
  if (!consent) fieldErrors.consent = "We need your consent to process this request.";

  // Length bounds — mirror the platform's Zod limits so we fail fast and never
  // forward unbounded input into the request body.
  if (exceedsLimit(name, "name")) fieldErrors.name = tooLongMessage("name", "name");
  if (exceedsLimit(organisation, "organisation")) {
    fieldErrors.organisation = tooLongMessage("organisation name", "organisation");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: FORM_MESSAGES.fixHighlighted, fieldErrors };
  }

  const humanRefusal = await humanCheckRefusal(formData);
  if (humanRefusal) return { status: "error", message: humanRefusal };

  // A typed "Other" role rides along in `source` — the platform's `role` field
  // is an allow-list, so the free-text detail can't go there directly.
  const sourceOut =
    role === OTHER_ROLE && roleOther
      ? source
        ? `Role: ${roleOther} · ${source}`
        : `Role: ${roleOther}`
      : source;

  let response: Response;
  try {
    response = await platformFetch(PLATFORM_API_PATHS.trialRequest, {
      method: "POST",
      // For the visitor: their origin and this site's identity (see visitor.ts).
      headers: { "Content-Type": "application/json", ...(await onBehalfOfVisitorHeaders()) },
      body: JSON.stringify({
        name,
        email,
        organisation,
        role,
        orgSize,
        country: country.toUpperCase(),
        sector,
        source: sourceOut ? withinLimit(sourceOut, "source") : undefined,
        consent: true,
      }),
    });
  } catch {
    return {
      status: "error",
      message:
        `We couldn't reach the provisioning service. Please try again in a moment, or contact ${CONTACT_EMAIL.trials}.`,
    };
  }

  const payload = (await response.json().catch(() => ({}))) as TrialResponsePayload;

  return mapTrialResponse(response.status, payload, email);
}

/**
 * Re-issue a fresh magic-link for a submission whose previous link has
 * expired. The client holds the expired raw token and passes it here.
 */
export async function reissueTrialToken(
  _previous: { status: "idle" | "sent" | "error"; message?: string },
  formData: FormData,
): Promise<{ status: "idle" | "sent" | "error"; message?: string }> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token || exceedsLimit(token, "token")) return { status: "error", message: "Missing or invalid token." };

  const refusal = await rateLimitRefusal("trialResend");
  if (refusal) return { status: "error", message: refusal };

  let response: Response;
  try {
    response = await platformFetch(PLATFORM_API_PATHS.trialReissue, {
      method: "POST",
      // For the visitor: their origin and this site's identity (see visitor.ts).
      headers: { "Content-Type": "application/json", ...(await onBehalfOfVisitorHeaders()) },
      body: JSON.stringify({ token }),
    });
  } catch {
    return { status: "error", message: "Could not contact the service. Try again shortly." };
  }

  const payload = (await response.json().catch(() => ({}))) as { message?: string };

  if (response.ok) {
    return {
      status: "sent",
      message: payload.message ?? "A new verification link has been sent.",
    };
  }

  return {
    status: "error",
    message:
      payload.message ??
      "Could not issue a new link. Please fill in the form again to start fresh.",
  };
}

interface VerifyResponse {
  status?: string;
  message?: string;
  /** Preferred field returned by the current platform API. */
  inviteUrl?: string;
  /** Legacy field — kept for backward compatibility. */
  loginUrl?: string;
}

/**
 * Spends a magic-link token: asks the platform to verify it and, on success,
 * sends the visitor to the workspace invite. Runs only when the visitor
 * presses the button on the verify page — never on page load — because email
 * link scanners open links before the person does, and a token spent by a
 * scanner leaves the person with no invite.
 */
export async function confirmTrialVerification(
  _previous: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "").trim();
  // Guard against absurd token input before forwarding to the platform.
  if (!token || exceedsLimit(token, "token")) {
    return { status: "not_found", message: VERIFY_FAILED_MESSAGE };
  }

  let response: Response;
  let payload: VerifyResponse;
  try {
    response = await platformFetch(PLATFORM_API_PATHS.trialVerify, {
      method: "POST",
      // For the visitor: their origin and this site's identity (see visitor.ts).
      headers: { "Content-Type": "application/json", ...(await onBehalfOfVisitorHeaders()) },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    payload = (await response.json().catch(() => ({}))) as VerifyResponse;
  } catch {
    // Network failure or timeout — the error card.
    return { status: "error", message: VERIFY_FAILED_MESSAGE };
  }

  // Success — the platform has provisioned (or found an existing) tenant.
  // Prefer inviteUrl; fall back to loginUrl when it is absent.
  // SECURITY (open-redirect guard): this is a token-bearing flow, so only ever
  // redirect to the trusted platform origin — never to an arbitrary URL echoed
  // back in the response.
  const successUrl = payload.inviteUrl ?? payload.loginUrl;
  if (response.ok && payload.status === "provisioned" && successUrl) {
    const appOrigin = new URL(PLATFORM_ORIGIN).origin;
    let target: URL | null = null;
    try {
      target = new URL(successUrl);
    } catch {
      target = null;
    }
    if (target && target.origin === appOrigin) {
      redirect(target.toString());
    }
    // Untrusted or malformed target — fall through to the error card.
    return { status: "error", message: VERIFY_FAILED_MESSAGE };
  }

  return {
    status: payload.status && payload.status !== "provisioned" ? payload.status : "error",
    message: payload.message ?? VERIFY_FAILED_MESSAGE,
  };
}
