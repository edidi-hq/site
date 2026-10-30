"use client";

/**
 * VerifyConfirm — the magic link's confirm card. Its button posts the token to
 * `confirmTrialVerification`, which spends it and redirects to the workspace
 * invite; works without JavaScript (the form posts to the action itself).
 *
 * VerifyResult — renders the outcome of a magic-link verification. The
 * success path is handled server-side via redirect; this component
 * covers the four non-success states:
 *
 *   expired     — the token timed out; offer a one-click re-issue
 *   not_found   — token hash doesn't match any submission
 *   rejected    — admin rejected the underlying submission
 *   error       — network / platform error; offer to press again (a retry is
 *                 safe: a link already used signs the person in)
 */

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, Clock, RefreshCcw, ShieldCheck } from "lucide-react";
import { SITE_PAGES } from "@/lib/brand";
import { confirmTrialVerification, reissueTrialToken } from "../../actions";
import { INITIAL_VERIFY_STATE } from "./state";
import { FormAlert } from "@/components/ui/form/form-alert";
import { buttonProps } from "@/components/ui/button";
import { submitWithoutReset } from "@/components/ui/form/submit";
import { useFocusAfterFailure } from "@/components/ui/form/focus-after-failure";
import { contactHref } from "@/app/contact/tabs";

const REISSUE_ERROR_ID = "reissue-error";

interface Props {
  status: string;
  message: string;
  token: string;
  /** The confirm action, so an `error` card can offer to press again. */
  retry?: { action: (formData: FormData) => void; pending: boolean };
}

export function VerifyConfirm({ token }: { token: string }) {
  // The server action itself, so the form posts without JavaScript too.
  const [state, action, pending] = useActionState(confirmTrialVerification, INITIAL_VERIFY_STATE);

  if ("message" in state) {
    return (
      <VerifyResult
        status={state.status}
        message={state.message}
        token={token}
        retry={{ action, pending }}
      />
    );
  }

  return (
    <Card
      variant="warning"
      icon={<ShieldCheck size={26} color="var(--color-gold)" strokeWidth={1.8} />}
      title="One step to your workspace."
      message="Press the button to confirm it's you and open your new workspace. The link works once."
    >
      <form action={action} onSubmit={submitWithoutReset(action)} style={{ marginTop: "16px" }}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          {...buttonProps({ size: "md", disabled: pending })}
        >
          {pending ? "Setting up…" : "Set up my workspace"}
        </button>
      </form>
    </Card>
  );
}

export function VerifyResult({ status, message, token, retry }: Props) {
  const [reissueState, reissueAction, reissuePending] = useActionState(
    reissueTrialToken,
    { status: "idle" as const },
  );
  // After a failed resend, focus the message (the form has no fields to fix).
  const reissueFormRef = useRef<HTMLFormElement>(null);
  useFocusAfterFailure(reissueFormRef, reissueState, reissueState.status === "error", REISSUE_ERROR_ID);

  if (reissueState.status === "sent") {
    return (
      <Card
        variant="success"
        icon={<Mail size={26} color="var(--color-gold)" strokeWidth={1.8} />}
        title="A new link is on its way."
        message={reissueState.message ?? "Check your inbox in the next minute."}
      />
    );
  }

  if (status === "expired") {
    return (
      <Card
        variant="warning"
        icon={<Clock size={26} color="var(--color-gold)" strokeWidth={1.8} />}
        title="This link has expired."
        message={message}
      >
        <form
          ref={reissueFormRef}
          action={reissueAction}
          onSubmit={submitWithoutReset(reissueAction)}
          style={{ marginTop: "16px" }}
        >
          <input type="hidden" name="token" value={token} />
          <ReissueButton pending={reissuePending} />
          {reissueState.status === "error" && reissueState.message && (
            <FormAlert
              id={REISSUE_ERROR_ID}
              pending={reissuePending}
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-danger)",
                marginTop: "10px",
              }}
            >
              {reissueState.message}
            </FormAlert>
          )}
        </form>
      </Card>
    );
  }

  if (status === "rejected") {
    return (
      <Card
        variant="error"
        icon={<AlertCircle size={26} style={{ color: "var(--color-danger)" }} strokeWidth={1.8} />}
        title="This request couldn't be provisioned."
        message={message}
      >
        <Link
          href={contactHref("demo")}
          style={{
            marginTop: "16px",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-gold-on-light)",
            textDecoration: "none",
          }}
        >
          Talk to us →
        </Link>
      </Card>
    );
  }

  // Default: not_found / error / anything else
  return (
    <Card
      variant="error"
      icon={<AlertCircle size={26} style={{ color: "var(--color-danger)" }} strokeWidth={1.8} />}
      title="We couldn't verify this link."
      message={message}
    >
      {status === "error" && retry && (
        <form
          action={retry.action}
          onSubmit={submitWithoutReset(retry.action)}
          style={{ marginTop: "16px" }}
        >
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            disabled={retry.pending}
            {...buttonProps({ size: "md", disabled: retry.pending })}
          >
            {retry.pending ? "Setting up…" : "Try again"}
          </button>
        </form>
      )}
      <Link
        href={SITE_PAGES.trial()}
        style={{
          marginTop: "16px",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-gold-on-light)",
          textDecoration: "none",
        }}
      >
        Start over →
      </Link>
    </Card>
  );
}

function ReissueButton({ pending }: { pending: boolean }) {
  // Cooldown guards against spam-clicking: each press disables the button
  // for ~3s. Combined with `pending`, this debounces rapid re-issues.
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(false), 3000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const disabled = pending || cooldown;

  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={() => setCooldown(true)}
      {...buttonProps({ size: "sm", disabled })}
    >
      <RefreshCcw size={14} strokeWidth={2} aria-hidden="true" />
      {pending ? "Sending…" : "Send me a new link"}
    </button>
  );
}

function Card({
  variant,
  icon,
  title,
  message,
  children,
}: {
  variant: "success" | "warning" | "error";
  icon: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  const bg =
    variant === "success"
      ? "var(--color-success-tint)"
      : variant === "warning"
        ? "var(--color-gold-tint)"
        : "var(--color-danger-tint)";
  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "48px 40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-circle)",
          backgroundColor: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <h2
        style={{
          fontWeight: 500,
          fontSize: "var(--text-heading-xs)",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        {title}
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
      {children}
    </div>
  );
}
