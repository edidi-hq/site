/**
 * State of the verify page's confirm button (`confirmTrialVerification` in
 * ../../actions.ts). Lives outside the "use server" module, which may export
 * only async functions.
 *
 * `idle` shows the confirm card. Any other status is the platform's answer
 * (expired, not_found, rejected) or `error`, rendered by VerifyResult. Success
 * never comes back: the action redirects to the workspace invite.
 */
export type VerifyState = { status: "idle" } | { status: string; message: string };

export const INITIAL_VERIFY_STATE: VerifyState = { status: "idle" };

/**
 * Shown when the platform could not be asked, or gave no reason. The card's
 * title already says the link wasn't verified, so this says what to do. A
 * retry is safe: the platform answers a repeat press of a link it has already
 * used by signing the person in, not by refusing.
 */
export const VERIFY_RETRY_MESSAGE =
  "We couldn't finish setting up your workspace just now. Your link still works until it expires, so please try again.";

/** Shown for a link too long to be one of ours, which is never sent to the platform. */
export const VERIFY_INCOMPLETE_MESSAGE =
  "This link doesn't look complete. Open it again from your email, or start over.";
