"use client";

import { AmbientGlow } from "@/components/ui/ambient-glow";

/**
 * DarkHeroBackdrop — the ambient layer behind a dark section further down a
 * page: two drifting gold glows. A page's
 * opening hero never takes it: heroes are flat ink (the brand brief), so
 * there is no hero glow pair to ask for. Drop it inside a section styled
 * `position: relative; overflow: hidden; isolation: isolate`, before the
 * content (which sits at zIndex 2).
 *
 * The one home of the glow pairs. There is no grid texture: the brand is flat,
 * and ui-kit.lock.test.ts fails on a grid gradient typed anywhere.
 */

interface GlowSpec {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number;
  intensity: number;
  duration: number;
  delay?: number;
}

/**
 * closing: a dark section further down the page, softer and lower.
 * centered: the closing CTA banner, glows pulled in to frame centred copy.
 */
export const BACKDROP_GLOWS = {
  closing: [
    { top: "20%", left: "-120px", size: 420, intensity: 0.15, duration: 34 },
    { bottom: "-80px", right: "-100px", size: 480, intensity: 0.13, duration: 40, delay: 0.5 },
  ],
  centered: [
    { top: "-80px", left: "20%", size: 520, intensity: 0.22, duration: 38 },
    { bottom: "-60px", right: "15%", size: 480, intensity: 0.18, duration: 44, delay: 0.5 },
  ],
} as const satisfies Record<string, readonly GlowSpec[]>;

export type BackdropGlows = keyof typeof BACKDROP_GLOWS;

interface DarkHeroBackdropProps {
  glows: BackdropGlows;
}

export function DarkHeroBackdrop({ glows }: DarkHeroBackdropProps) {
  return (
    <>
      {BACKDROP_GLOWS[glows].map((glow, index) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key -- a fixed decoration list
        <AmbientGlow key={index} {...glow} />
      ))}
    </>
  );
}
