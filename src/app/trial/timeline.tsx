"use client";

/**
 * TrialTimeline — an honest, public-safe schedule of the trial.
 *
 * Transparency / "no dark patterns": the exact lifecycle is stated up front,
 * including the heads-up before the trial ends and the grace period after it.
 * Every milestone maps to real product behaviour (trial → read-only → grace →
 * close), and every day count is read from core (`@/lib/trial-terms`), so the
 * schedule moves when the product's does. Deliberately omits internal cadence,
 * mechanisms, and infrastructure — only what a customer needs to feel in
 * control appears here.
 */

import { m } from "framer-motion";
import { fadeUpOnScroll } from "@/lib/animations";
import { Eyebrow } from "@/components/ui/section-intro";
import { READ_ONLY_GRACE_DAYS, TRIAL_CLOSE_DAY, TRIAL_DURATION_DAYS, TRIAL_PLAN_NAME, TRIAL_SEAT_CAP, NO_CARD_REQUIRED } from "@/lib/trial-terms";


interface Milestone {
  when: string;
  title: string;
  detail: string;
}

const MILESTONES: Milestone[] = [
  {
    when: "Today",
    title: `Full ${TRIAL_PLAN_NAME} features from day one`,
    detail: `Full ${TRIAL_PLAN_NAME} features on your own data — a ${TRIAL_SEAT_CAP}-seat pilot workspace, with a sample approval already waiting. ${NO_CARD_REQUIRED}.`,
  },
  {
    when: `Days 1–${TRIAL_DURATION_DAYS - 1}`,
    title: "We keep you moving",
    detail:
      "A few getting-started nudges, a mid-trial summary, and a heads-up the day before it ends.",
  },
  {
    when: `Day ${TRIAL_DURATION_DAYS}`,
    title: "Read-only — not gone",
    detail:
      "Keep viewing and exporting everything. Creating resumes the moment you upgrade.",
  },
  {
    when: `Day ${TRIAL_CLOSE_DAY}`,
    title: "Nothing removed without warning",
    detail: `A ${READ_ONLY_GRACE_DAYS}-day grace period after read-only — and a clear heads-up before any data is removed.`,
  },
];

export function TrialTimeline() {
  return (
    <section>
      <Eyebrow reveal="scroll" style={{ display: "block", marginBottom: "20px" }}>
        How the {TRIAL_DURATION_DAYS} days work
      </Eyebrow>

      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {MILESTONES.map((ms, i) => {
          const isLast = i === MILESTONES.length - 1;
          const isNow = i === 0;
          return (
            <m.li
              key={ms.when}
              {...fadeUpOnScroll(i)}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                columnGap: "20px",
                position: "relative",
              }}
            >
              {/* Rail: dot + connecting line */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "var(--radius-circle)",
                    marginTop: "4px",
                    flexShrink: 0,
                    // Today is "now" — filled. Future days stay hollow.
                    backgroundColor: isNow ? "var(--color-gold)" : "var(--color-white)",
                    border: isNow ? "none" : "1.5px solid var(--color-border-strong)",
                    boxShadow: isNow
                      ? "0 0 0 4px var(--color-gold-tint)"
                      : "none",
                  }}
                />
                {!isLast && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: "1.5px",
                      flex: 1,
                      minHeight: "24px",
                      backgroundColor: "var(--color-border)",
                      marginTop: "6px",
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: isLast ? 0 : "22px" }}>
                <Eyebrow style={{ display: "block", marginBottom: "3px" }}>{ms.when}</Eyebrow>
                <h3
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    margin: "0 0 5px",
                    lineHeight: 1.35,
                  }}
                >
                  {ms.title}
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-md)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {ms.detail}
                </p>
              </div>
            </m.li>
          );
        })}
      </ol>
    </section>
  );
}
