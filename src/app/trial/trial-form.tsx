"use client";

/**
 * TrialForm — the interactive /trial page. Uses `useActionState` to
 * call the server action, renders per-field validation errors, and
 * swaps into one of three terminal states when the request completes:
 *
 *   verification_sent — Path A success: "check your email"
 *   queued_for_review — Path B success: 4-hour SLA commitment
 *   hard_blocked      — any platform rejection (HTTP 403): terminal surface,
 *                       showing the platform's own reason
 *
 * The visual language mirrors /contact and /product/how-it-works —
 * Navbar + Footer wrapper, soft slate-50 main, card-styled form.
 */

import { useActionState, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Check, Mail, Clock, ArrowLeft, AlertCircle } from "lucide-react";
import { ChoiceGroup } from "@/components/ui/form/choice-group";
import { buttonProps } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section-intro";
import { SearchableSelect } from "@/components/ui/form/searchable-select";
import { ORG_SIZE_OPTIONS, DEFAULT_ORG_SIZE } from "@/lib/org-size";
import { BRAND, LEGAL_PAGES } from "@/lib/brand";
import { fadeUpOnLoad } from "@/lib/animations";
import { submitTrialRequest } from "./actions";
import { OTHER_TRIAL_ROLE, TRIAL_ROLES } from "@edidi-hq/core/trial/request-terms";
import { INITIAL_STATE, type TrialFormState } from "./state";
import { trialEmailError } from "./email-check";
import { FORM_LIMITS, hasEmailShape } from "@/lib/form-rules";
import {
  describedBy,
  hasVisibleFieldErrors,
  useServerFieldErrors,
} from "@/components/ui/form/field-errors";
import { FormAlert } from "@/components/ui/form/form-alert";
import { useHydrated } from "@/components/ui/form/hydrated";
import { TurnstileWidget } from "@/components/ui/form/turnstile-widget";
import { HoneypotField } from "@/components/ui/form/honeypot-field";
import { FORM_STEP, JS_ONLY } from "@/lib/no-script";
import { CONTACT_EMAIL } from "@/lib/contacts";
import { submitWithoutReset } from "@/components/ui/form/submit";
import { useFocusAfterFailure } from "@/components/ui/form/focus-after-failure";
import { COUNTRIES, isServedCountry } from "@/data/countries";
import { SECTOR_OPTIONS } from "@edidi-hq/core/sectors";
import { TRIAL_STEPS_DONE, TrialStepper } from "./stepper";
import { TrialTimeline } from "./timeline";
import { READ_ONLY_GRACE_DAYS, TRIAL_LENGTH, TRIAL_MESSAGE_CAP, TRIAL_PLAN_NAME, TRIAL_SEAT_CAP, TRIAL_STORAGE, NO_CARD_REQUIRED, TRIAL_SETUP_TIME, MAGIC_LINK_LIFETIME } from "@/lib/trial-terms";
import { contactHref } from "@/app/contact/tabs";
import { SITE_ROUTES } from "@/lib/routes";
import { looksLikePublicEmailDomain } from "@edidi-hq/core/domains/public-email";

// ────────────────────────────────────────────────────────────────────
// Free-email domain list — Option B: nudge, not block.
// Free-email provider list used for the soft nudge below.
// ────────────────────────────────────────────────────────────────────
/**
 * 15-minute window in milliseconds for duplicate-submission detection. The
 * address is kept in sessionStorage, so it also goes when the tab closes.
 */
const RECENT_SUBMISSION_TTL = 15 * 60 * 1000;

interface RecentSubmission {
  email: string;
  submittedAt: number;
}

const RECENT_SUBMISSION_KEY = "edidi-recent-trial";

/**
 * The stored request as its raw JSON while it is inside the window, else null.
 * A string, so consecutive reads compare equal (useSyncExternalStore snapshot).
 */
function readRecentSubmissionRecord(): string | null {
  try {
    const raw = sessionStorage.getItem(RECENT_SUBMISSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecentSubmission;
    return Date.now() - parsed.submittedAt > RECENT_SUBMISSION_TTL ? null : raw;
  } catch {
    return null;
  }
}

const subscribeNever = () => () => {};

function persistSubmission(email: string) {
  try {
    sessionStorage.setItem(
      RECENT_SUBMISSION_KEY,
      JSON.stringify({ email, submittedAt: Date.now() }),
    );
  } catch {
    // sessionStorage unavailable — silently skip.
  }
}


// Org-size options + default come from the shared SSOT (@/lib/org-size).


const labelStyle: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  fontWeight: 500,
  color: "var(--color-text-primary)",
  letterSpacing: "0.02em",
  display: "block",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  fontSize: "var(--text-md)",
  color: "var(--color-text-primary)",
  width: "100%",
  height: "42px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "0 14px",
  backgroundColor: "var(--color-white)",
};

const errorStyle: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--color-danger)",
  marginTop: "6px",
  display: "block",
};

/** Muted hint below a field — not a validation error. */
const hintStyle: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--color-text-muted)",
  marginTop: "5px",
  display: "block",
};

/** The fields that live on step 1 of the form. */
const STEP_ONE_FIELDS = ["role", "orgSize", "sector", "country"] as const;

function SubmitButton({ isValid, pending }: { isValid: boolean; pending: boolean }) {
  const disabled = pending || !isValid;
  return (
    <button
      type="submit"
      disabled={disabled}
      {...buttonProps({ size: "md", disabled })}
    >
      {pending ? "Sending…" : "Start my trial →"}
    </button>
  );
}

export function TrialForm({ initialCountry }: { initialCountry: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  // The server action itself, not a wrapper: React can then post the form to
  // it without JavaScript and render the answer on the server.
  const [state, action, isPending] = useActionState<TrialFormState, FormData>(
    submitTrialRequest,
    INITIAL_STATE,
  );
  const hydrated = useHydrated();
  // A refusal hands back what was posted. Fields start from it, which only
  // matters for a page rendered without JavaScript (with it, state persists).
  const posted = state.status === "error" ? (state.values ?? {}) : {};

  // Role, size and country sit on step 1, hidden behind step 2's fields: when
  // a new answer puts one in error, show that step rather than leave it out of
  // sight. Adjusted during render on a new answer (no effect, no extra paint).
  const [answerSeen, setAnswerSeen] = useState(state);
  if (answerSeen !== state) {
    setAnswerSeen(state);
    if (state.status === "error" && STEP_ONE_FIELDS.some((field) => state.fieldErrors?.[field])) {
      setStep(1);
    }
  }

  // A server error steps aside once its field is edited (field-errors.ts).
  const { errors: fieldErrors, clear: clearFieldError } = useServerFieldErrors(
    state.status === "error" ? state.fieldErrors : undefined,
  );

  // After a failed send, focus the first field in error, else the alert.
  const formRef = useRef<HTMLFormElement>(null);
  useFocusAfterFailure(formRef, state, state.status === "error", "trial-form-error");

  // ── Duplicate-submission detection ──────────────────────────────
  // Read from sessionStorage in the browser; the server HTML (and hydration)
  // see none, so the warning never mismatches.
  const recentRecord = useSyncExternalStore(subscribeNever, readRecentSubmissionRecord, () => null);
  const recentSubmission = useMemo(
    () => (recentRecord ? (JSON.parse(recentRecord) as RecentSubmission) : null),
    [recentRecord],
  );

  // ── Controlled field state ──────────────────────────────────────────
  // Email: controlled for free-email hint + dupe check.
  const [emailValue, setEmailValue] = useState(posted.email ?? "");
  // Remaining required fields lifted to state for validity computation.
  const [nameValue, setNameValue] = useState(posted.name ?? "");
  const [organisationValue, setOrganisationValue] = useState(posted.organisation ?? "");
  const [roleValue, setRoleValue] = useState(posted.role ?? "");
  const [roleOtherValue, setRoleOtherValue] = useState(posted.roleOther ?? "");
  const [orgSizeValue, setOrgSizeValue] = useState(posted.orgSize ?? DEFAULT_ORG_SIZE);
  const [sectorValue, setSectorValue] = useState(posted.sector ?? "");
  const [sectorOtherValue, setSectorOtherValue] = useState(posted.sectorOther ?? "");
  const sectorComplete =
    sectorValue !== "" && (sectorValue !== "Other" || sectorOtherValue.trim().length > 0);
  // Country starts where the visitor is (the page reads it; the lead market
  // when unknown) — a refusal keeps what they chose.
  const [countryValue, setCountryValue] = useState<string>(posted.country ?? initialCountry);
  const [consentValue, setConsentValue] = useState(posted.consent === "on");

  // Two-step split: step 1 is the quick tappable setup (role/size/industry/
  // country, size and country defaulted), step 2 collects contact details. Leading with
  // taps builds momentum before the commitment of typing (IKEA + goal-gradient).
  // "Other" must be spelled out — otherwise the qualifying signal is lost.
  const step1Valid =
    roleValue !== "" &&
    orgSizeValue !== "" &&
    sectorComplete &&
    countryValue !== "" &&
    (roleValue !== OTHER_TRIAL_ROLE || roleOtherValue.trim().length > 0);

  // ── Validity derivation ─────────────────────────────────────────────
  const isValid = useMemo(
    () =>
      nameValue.trim().length > 0 &&
      trialEmailError(emailValue.trim()) === undefined &&
      organisationValue.trim().length > 0 &&
      roleValue !== "" &&
      orgSizeValue !== "" &&
      sectorComplete &&
      countryValue !== "" &&
      consentValue === true,
    [nameValue, emailValue, organisationValue, roleValue, orgSizeValue, sectorComplete, countryValue, consentValue],
  );

  // ── Remember a successful request (sessionStorage) ─────────────
  // Both success answers carry the address the request was made with, so the
  // effect reads only the answer. The success card replaces the form, so the
  // warning shows on the next visit to the form within the window (read above).
  useEffect(() => {
    if (state.status !== "verification_sent" && state.status !== "queued_for_review") return;
    if (state.email) persistSubmission(state.email);
  }, [state]);

  if (state.status === "verification_sent") {
    return <VerificationSentCard email={state.email} message={state.message} />;
  }

  if (state.status === "queued_for_review") {
    return <QueuedCard message={state.message} email={state.email || undefined} />;
  }

  if (state.status === "hard_blocked") {
    return <HardBlockedCard message={state.message} />;
  }

  // ── Email: refused before submit ────────────────────────────────
  // Only once the value has an address's shape, so a half-typed domain
  // ("you@test" on its way to "you@testco.ng") never flashes an error.
  // The server action asks the same rule; its error shows otherwise.
  const trimmedEmail = emailValue.trim();
  const emailError =
    (hasEmailShape(trimmedEmail) ? trialEmailError(trimmedEmail) : undefined) ?? fieldErrors.email;

  // ── Free-email hint ─────────────────────────────────────────────
  const emailDomain = emailValue.includes("@")
    ? emailValue.split("@").pop()?.toLowerCase() ?? ""
    : "";
  const showFreeEmailHint = emailDomain !== "" && looksLikePublicEmailDomain(emailDomain);

  // ── Duplicate-submission warning ────────────────────────────────
  const showDuplicateWarning = recentSubmission !== null;

  return (
    <>
      {/* Page intro — centered header. The reassurance line sits as a
          subheading under the H1. */}
      <m.div
        {...fadeUpOnLoad()}
        style={{ textAlign: "center", maxWidth: "var(--measure)", margin: "0 auto 44px" }}
      >
        <Eyebrow style={{ display: "block", marginBottom: "14px" }}>{TRIAL_LENGTH} trial</Eyebrow>
        <h1
          style={{
            fontWeight: 400,
            fontSize: "var(--text-heading-2xl)",
            color: "var(--color-text-primary)",
            lineHeight: 1.2,
            margin: "0 0 12px",
            letterSpacing: "0.01em",
          }}
          className="lg:!text-display-md"
        >
          Start your {TRIAL_LENGTH} trial.
        </h1>
        <p
          style={{
            fontWeight: 400,
            fontSize: "var(--text-3xl)",
            color: "var(--color-text-body)",
            lineHeight: 1.45,
            margin: "0 0 14px",
          }}
        >
          No surprises. You&rsquo;ll always know what&rsquo;s next.
        </p>
        <p
          style={{
            fontSize: "var(--text-lg)",
            color: "var(--color-text-muted)",
            lineHeight: 1.7,
            margin: "0 auto",
            maxWidth: "var(--measure-narrow)",
          }}
        >
          Full {TRIAL_PLAN_NAME} features on your own data — a {TRIAL_SEAT_CAP}-seat
          pilot workspace ({TRIAL_SEAT_CAP} users, {TRIAL_STORAGE} storage,{" "}
          {TRIAL_MESSAGE_CAP} SMS/WhatsApp messages during the trial). {NO_CARD_REQUIRED}.
          Your workspace is ready {TRIAL_SETUP_TIME}.
        </p>
      </m.div>

      {/* Without JavaScript both steps show as one page, so a step counter
          ("Your setup", 33%) would describe a layout that isn't there. */}
      <div {...JS_ONLY}>
        <TrialStepper current={step + 1} />
      </div>
      <m.div
        {...fadeUpOnLoad()}
        style={{ display: "grid", columnGap: "48px", rowGap: "40px", alignItems: "start" }}
        className="grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_1.2fr]"
      >
      {/* Form — first on mobile; right column on desktop */}
      <m.form
        ref={formRef}
        action={action}
        onSubmit={submitWithoutReset(action)}
        className="order-1 lg:order-none lg:col-start-2 lg:row-start-1"
        {...fadeUpOnLoad(2)}
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-2xl)",
          padding: "var(--form-card-padding)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          // Focal action card: lift it off the page and pin it beside the
          // taller left-hand narrative as the visitor scrolls.
          boxShadow: "0 1px 3px rgba(var(--color-navy-primary-rgb), 0.04), 0 18px 44px rgba(var(--color-navy-primary-rgb), 0.07)",
          position: "sticky",
          top: "88px",
          alignSelf: "start",
        }}
        noValidate
      >
        <HoneypotField />
        {/* Back to step 1 — the stepper above conveys the position. */}
        {step === 2 && (
          <button
            {...JS_ONLY}
            type="button"
            onClick={() => setStep(1)}
            style={{ alignSelf: "flex-start", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "2px" }}
          >
            ← Back
          </button>
        )}

        {/* ── Step 1: setup — tappable, already defaulted ─────────────── */}
        <div {...FORM_STEP} style={{ display: step === 1 ? "flex" : "none", flexDirection: "column", gap: "18px" }}>
          <div>
            <span style={labelStyle}>
              Your role
              <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">*</span>
            </span>
            <ChoiceGroup
              name="role"
              variant="cards"
              columns={2}
              value={roleValue}
              onChange={(value) => {
                setRoleValue(value);
                clearFieldError("role");
              }}
              // Likeliest-first, but NOT pre-selected and NOT badged, so the
              // qualifying signal stays honest (an explicit pick).
              options={TRIAL_ROLES}
              ariaLabel="Your role"
              noScriptPlaceholder="Select your role"
              invalid={!!fieldErrors.role}
              describedBy={fieldErrors.role ? "trial-role-error" : "trial-role-hint"}
            />
            {fieldErrors.role ? (
              <span id="trial-role-error" style={errorStyle}>{fieldErrors.role}</span>
            ) : (
              <span id="trial-role-hint" style={hintStyle}>
                Helps us tailor your setup. You&apos;ll configure team roles after signing in.
              </span>
            )}
            {/* Without JavaScript the "Other" box below never appears. */}
            <noscript>
              <input
                type="text"
                name="roleOther"
                defaultValue={posted.roleOther}
                maxLength={FORM_LIMITS.otherDetail}
                placeholder="If you chose Other, your role"
                aria-label="If you chose Other, your role"
                style={{ ...inputStyle, marginTop: "10px" }}
              />
            </noscript>
            {roleValue === OTHER_TRIAL_ROLE && (
              <div style={{ marginTop: "10px" }}>
                <label htmlFor="roleOther" style={labelStyle}>
                  Specify your role
                  <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  id="roleOther"
                  name="roleOther"
                  value={roleOtherValue}
                  maxLength={FORM_LIMITS.otherDetail}
                  onChange={(e) => setRoleOtherValue(e.target.value)}
                  placeholder="Tell us your role"
                  aria-required="true"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div>
            <span style={labelStyle}>
              Organisation size
              <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">*</span>
            </span>
            <div style={{ marginTop: "8px" }}>
              <ChoiceGroup
                name="orgSize"
                variant="chips"
                value={orgSizeValue}
                onChange={(value) => {
                  setOrgSizeValue(value);
                  clearFieldError("orgSize");
                }}
                options={ORG_SIZE_OPTIONS}
                ariaLabel="Organisation size"
                invalid={!!fieldErrors.orgSize}
                describedBy={describedBy(!!fieldErrors.orgSize && "trial-orgSize-error")}
              />
            </div>
            {fieldErrors.orgSize && (
              <span id="trial-orgSize-error" style={errorStyle}>{fieldErrors.orgSize}</span>
            )}
          </div>

          <div>
            <span style={labelStyle}>
              Industry
              <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">*</span>
            </span>
            <SearchableSelect
              name="sector"
              value={sectorValue}
              onChange={(value) => {
                setSectorValue(value);
                clearFieldError("sector");
              }}
              options={SECTOR_OPTIONS}
              ariaLabel="Industry"
              placeholder="Search for your industry…"
              searchLabel="industries"
              invalid={!!fieldErrors.sector}
              describedBy={fieldErrors.sector ? "trial-sector-error" : "trial-sector-hint"}
            />
            {fieldErrors.sector ? (
              <span id="trial-sector-error" style={errorStyle}>{fieldErrors.sector}</span>
            ) : (
              <span id="trial-sector-hint" style={hintStyle}>
                Sets up the modules and first steps that fit organisations like yours.
              </span>
            )}
            {/* Without JavaScript the "Other" box below never appears. */}
            <noscript>
              <input
                type="text"
                name="sectorOther"
                defaultValue={posted.sectorOther}
                maxLength={FORM_LIMITS.otherDetail}
                placeholder="If you chose Other, your industry"
                aria-label="If you chose Other, your industry"
                style={{ ...inputStyle, marginTop: "10px" }}
              />
            </noscript>
            {sectorValue === "Other" && (
              <div style={{ marginTop: "10px" }}>
                <label htmlFor="sectorOther" style={labelStyle}>
                  Describe your industry
                  <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  id="sectorOther"
                  name="sectorOther"
                  value={sectorOtherValue}
                  maxLength={FORM_LIMITS.otherDetail}
                  onChange={(event) => {
                    setSectorOtherValue(event.target.value);
                    clearFieldError("sector");
                  }}
                  placeholder="Tell us your industry"
                  aria-required="true"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div>
            <span style={labelStyle}>
              Country
              <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">*</span>
            </span>
            <SearchableSelect
              name="country"
              value={countryValue}
              onChange={(value) => {
                setCountryValue(value);
                clearFieldError("country");
              }}
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
              ariaLabel="Country"
              placeholder="Search for your country…"
              searchLabel="countries"
              invalid={!!fieldErrors.country}
              describedBy={describedBy(
                fieldErrors.country ? "trial-country-error" : !!countryValue && "trial-country-hint",
              )}
            />
            {fieldErrors.country ? (
              <span id="trial-country-error" style={errorStyle}>{fieldErrors.country}</span>
            ) : countryValue ? (
              <span id="trial-country-hint" style={hintStyle}>
                {isServedCountry(countryValue)
                  ? "Your currency, tax and bank-account formats are set up for this country."
                  : "We don't set this country up automatically yet — our team will review your request and agree your setup with you."}
              </span>
            ) : null}
          </div>

          <div {...JS_ONLY} style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => step1Valid && setStep(2)}
              disabled={!step1Valid}
              {...buttonProps({ size: "md", disabled: !step1Valid })}
            >
              Continue →
            </button>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {NO_CARD_REQUIRED} · about a minute
            </span>
          </div>
        </div>

        {/* ── Step 2: your details ────────────────────────────────────── */}
        <div {...FORM_STEP} style={{ display: step === 2 ? "flex" : "none", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "grid", gap: "14px" }} className="grid-cols-1 md:grid-cols-2">
          <div>
            <label htmlFor="name" style={labelStyle}>
              Full name
              <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={FORM_LIMITS.name}
              autoComplete="name"
              aria-invalid={!!fieldErrors.name || undefined}
              aria-describedby={describedBy(!!fieldErrors.name && "trial-name-error")}
              value={nameValue}
              onChange={(e) => {
                setNameValue(e.target.value);
                clearFieldError("name");
              }}
              style={{
                ...inputStyle,
                borderColor: fieldErrors.name ? "var(--color-danger)" : "var(--color-border)",
              }}
            />
            {fieldErrors.name && <span id="trial-name-error" style={errorStyle}>{fieldErrors.name}</span>}
          </div>
          <div>
            <label htmlFor="email" style={labelStyle}>
              Work email
              <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={FORM_LIMITS.email}
              autoComplete="email"
              aria-invalid={!!emailError || undefined}
              aria-describedby={describedBy(
                !!emailError && "trial-email-error",
                showFreeEmailHint && !emailError && "trial-email-hint",
              )}
              value={emailValue}
              onChange={(e) => {
                setEmailValue(e.target.value);
                clearFieldError("email");
              }}
              style={{
                ...inputStyle,
                borderColor: emailError ? "var(--color-danger)" : "var(--color-border)",
              }}
            />
            {/* Polite live region: the error appears as the visitor types, while
                the field already has focus — describedby alone is not re-read. */}
            <div aria-live="polite">
              {emailError && <span id="trial-email-error" style={errorStyle}>{emailError}</span>}
            </div>
            {/* Free-email nudge — shown when domain matches a personal provider.
                Not a block; the submit button remains enabled. */}
            {showFreeEmailHint && !emailError && (
              <span id="trial-email-hint" style={hintStyle}>
                Tip: work emails get the fastest setup. Personal emails work too.
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="organisation" style={labelStyle}>
            Organisation
            <span style={{ color: "var(--color-required)", marginLeft: 4 }} aria-hidden="true">*</span>
          </label>
          <input
            id="organisation"
            name="organisation"
            type="text"
            required
            maxLength={FORM_LIMITS.organisation}
            autoComplete="organization"
            aria-invalid={!!fieldErrors.organisation || undefined}
            aria-describedby={describedBy(!!fieldErrors.organisation && "trial-organisation-error")}
            value={organisationValue}
            onChange={(e) => {
              setOrganisationValue(e.target.value);
              clearFieldError("organisation");
            }}
            style={{
              ...inputStyle,
              borderColor: fieldErrors.organisation ? "var(--color-danger)" : "var(--color-border)",
            }}
          />
          {fieldErrors.organisation && (
            <span id="trial-organisation-error" style={errorStyle}>{fieldErrors.organisation}</span>
          )}
        </div>

        <div>
          <label htmlFor="source" style={labelStyle}>
            How did you hear about us? (optional)
          </label>
          <input
            id="source"
            name="source"
            type="text"
            defaultValue={posted.source}
            maxLength={FORM_LIMITS.source}
            style={inputStyle}
            placeholder="Referral, search, colleague, event…"
          />
        </div>

        <div>
          <label
            htmlFor="consent"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-body)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
              lineHeight: 1.55,
            }}
          >
            <input
              id="consent"
              name="consent"
              type="checkbox"
              required
              aria-invalid={!!fieldErrors.consent || undefined}
              aria-describedby={describedBy(!!fieldErrors.consent && "trial-consent-error")}
              checked={consentValue}
              onChange={(e) => {
                setConsentValue(e.target.checked);
                clearFieldError("consent");
              }}
              style={{ marginTop: "3px", accentColor: "var(--color-gold)", width: "16px", height: "16px" }}
            />
            <span>
              I agree that {BRAND.name} may use the details above to provision and run my trial
              workspace, in line with the{" "}
              <Link href={LEGAL_PAGES.privacy} style={{ color: "var(--color-gold-on-light)", textDecoration: "none" }}>
                privacy policy
              </Link>
              .{" "}
              <span style={{ color: "var(--color-required)" }} aria-hidden="true">*</span>
            </span>
          </label>
          {fieldErrors.consent && (
            <span id="trial-consent-error" style={errorStyle}>{fieldErrors.consent}</span>
          )}
        </div>

        {/* The summary stays while any field error is still on screen. */}
        {state.status === "error" &&
          state.message &&
          (!state.fieldErrors || hasVisibleFieldErrors(fieldErrors)) && (
          <FormAlert
            id="trial-form-error"
            pending={isPending}
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-danger)",
              backgroundColor: "var(--color-danger-wash)",
              border: "1px solid var(--color-danger-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={14} strokeWidth={2} style={{ marginTop: "2px", flexShrink: 0 }} aria-hidden="true" />
            <span>{state.message}</span>
          </FormAlert>
        )}

        {/* Duplicate-submission warning — informational, not blocking. */}
        {showDuplicateWarning && (
          <div
            role="status"
            aria-live="polite"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-warning)",
              backgroundColor: "rgba(var(--color-notice-rgb), 0.07)",
              border: "1px solid rgba(var(--color-notice-rgb), 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <AlertCircle
              size={14}
              strokeWidth={2}
              style={{ color: "var(--color-warning-accent)", marginTop: "2px", flexShrink: 0 }}
              aria-hidden="true"
            />
            <span>
              We already received a request from this browser at{" "}
              <strong style={{ color: "var(--color-warning-strong)" }}>{recentSubmission!.email}</strong> a few minutes
              ago. Check that inbox first — the verification link expires in {MAGIC_LINK_LIFETIME}.
            </span>
          </div>
        )}

        <TurnstileWidget fallbackEmail={CONTACT_EMAIL.trials} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <SubmitButton isValid={!hydrated || isValid} pending={isPending} />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {NO_CARD_REQUIRED} — nothing to cancel · {TRIAL_LENGTH} trial · Data preserved for{" "}
            {READ_ONLY_GRACE_DAYS} days after trial end.
          </span>
        </div>
        </div>
      </m.form>

      {/* Timeline — after the form on mobile; left column on desktop */}
      <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-1">
        <TrialTimeline />
      </div>
      </m.div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Terminal-state cards
// ────────────────────────────────────────────────────────────────────

function VerificationSentCard({ email, message }: { email: string; message: string }) {
  return (
    <>
      <TrialStepper current={TRIAL_STEPS_DONE} />
    <div
      style={{
        maxWidth: "var(--measure-narrow)",
        margin: "0 auto",
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "48px 40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-circle)",
          backgroundColor: "var(--color-gold-tint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Mail size={26} strokeWidth={1.8} color="var(--color-gold)" aria-hidden="true" />
      </div>
      <h2
        style={{
          fontWeight: 500,
          fontSize: "var(--text-heading-sm)",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Check your email.
      </h2>
      <p
        style={{
          fontSize: "var(--text-lg)",
          color: "var(--color-text-muted)",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: "var(--measure-compact)",
        }}
      >
        We sent a verification link to{" "}
        <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong>. Check your inbox —
        it expires in {MAGIC_LINK_LIFETIME}.
      </p>
      <p
        style={{
          fontSize: "var(--text-md)",
          color: "var(--color-text-secondary)",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: "var(--measure-compact)",
        }}
      >
        {message}
      </p>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "12px" }}>
        <Clock
          size={11}
          strokeWidth={2}
          style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}
          aria-hidden="true"
        />
        If the link expires, the page you land on will let you request a new
        one — no need to fill in the form again.
      </p>
    </div>
    </>
  );
}

function QueuedCard({ message, email }: { message: string; email?: string }) {
  return (
    <>
      <TrialStepper current={TRIAL_STEPS_DONE} />
    <div
      style={{
        maxWidth: "var(--measure-narrow)",
        margin: "0 auto",
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "48px 40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-circle)",
          backgroundColor: "var(--color-success-tint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Check size={26} strokeWidth={2} style={{ color: "var(--color-success)" }} aria-hidden="true" />
      </div>
      <h2
        style={{
          fontWeight: 500,
          fontSize: "var(--text-heading-sm)",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Request received.
      </h2>
      {email && (
        <p
          style={{
            fontSize: "var(--text-md)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.65,
            margin: 0,
            maxWidth: "var(--measure-compact)",
          }}
        >
          We&rsquo;ll be in touch at{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong>.
        </p>
      )}
      <p
        style={{
          fontSize: "var(--text-lg)",
          color: "var(--color-text-muted)",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: "var(--measure-compact)",
        }}
      >
        {message}
      </p>
      <Link
        href={SITE_ROUTES.home}
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--color-gold-on-light)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "8px",
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
        Back to home
      </Link>
    </div>
    </>
  );
}

function HardBlockedCard({ message }: { message: string }) {
  return (
    <div
      style={{
        maxWidth: "var(--measure-narrow)",
        margin: "0 auto",
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "48px 40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-circle)",
          backgroundColor: "var(--color-danger-tint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertCircle size={26} strokeWidth={1.8} style={{ color: "var(--color-danger)" }} aria-hidden="true" />
      </div>
      <h2
        style={{
          fontWeight: 500,
          fontSize: "var(--text-heading-xs)",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Trial already used.
      </h2>
      <p
        style={{
          fontSize: "var(--text-md)",
          color: "var(--color-text-muted)",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: "var(--measure-compact)",
        }}
      >
        {message}
      </p>
      <Link
        href={contactHref("demo")}
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-gold-on-light)",
          textDecoration: "none",
        }}
      >
        Talk to us about your options →
      </Link>
    </div>
  );
}
