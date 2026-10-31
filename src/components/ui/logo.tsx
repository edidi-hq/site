/**
 * The brand mark and lockup (mark + wordmark).
 *
 * The mark is DRAWING DATA owned by core: role-tagged shapes on a square canvas
 * (the full Gate-N from 48px up, a ringless small drawing below, the app-icon
 * tile). This component only decides the colour of each role — the shapes come
 * from `markShapesAt(size)`, so a new logo is new drawings in core, never an
 * edit here. The lockup (`BrandLogo`, with or without its wordmark) always
 * takes the full drawing, whatever its size — the same rule as the product's
 * copy of this component; see the note in `BrandLogo`.
 *
 * Variants are named for the surface the mark sits on (core's MARK_VARIANTS):
 *   on-light   — ink ring and gate, gold signature (light pages).
 *   on-dark    — parchment ring and gate, gold signature (the ink shell).
 *   mono-ink   — one colour, ink.
 *   mono-white — one colour, white.
 *   app-icon   — the small drawing on a rounded ink tile.
 * Each reads a theme-invariant `--color-logo-*` token: the mark is drawn for the
 * surface the caller names, whatever the page's theme.
 */

import {
  BRAND,
  BRAND_APP_ICON,
  BRAND_MARK,
  markDrawingFor,
  markRoleColor,
  markShapesAt,
  WORDMARK_SPEC,
  wordmarkBaselineLiftFactor,
  type MarkColors,
  type MarkDrawing,
  type MarkShape,
  type MarkVariant,
} from "@/lib/brand";

// The standalone SVG-string serializer, re-exported so existing
// `@/components/ui/logo` importers keep one import path.
export { brandMarkSvgString } from "@/lib/brand";

interface BrandMarkProps {
  size?: number;
  variant?: MarkVariant;
  className?: string;
}

interface BrandLogoProps extends Omit<BrandMarkProps, "variant"> {
  variant?: Exclude<MarkVariant, "app-icon">;
  showWordmark?: boolean;
  wordmarkColor?: string;
}

// ── Colour engine: which colour each role is painted in ─────────────────────
// CSS-driven, so it works in server components without a JS theme read.

const INK = "var(--color-logo-ink)";
const LIGHT = "var(--color-logo-light)";
const SIGNATURE = "var(--color-logo-signature)";

const VARIANT_COLORS: Record<MarkVariant, MarkColors & { wordmark: string }> = {
  "on-light": { stroke: INK, signature: SIGNATURE, wordmark: INK },
  "on-dark": { stroke: LIGHT, signature: SIGNATURE, wordmark: LIGHT },
  "mono-ink": { stroke: INK, wordmark: INK },
  "mono-white": { stroke: "var(--color-white)", wordmark: "var(--color-white)" },
  "app-icon": { container: INK, stroke: LIGHT, signature: SIGNATURE, wordmark: INK },
};

function Shape({ shape, colors }: { shape: MarkShape; colors: MarkColors }) {
  const fill = markRoleColor(shape.role, colors);
  if (shape.kind === "path") return <path d={shape.d} fill={fill} opacity={shape.opacity} />;
  return (
    <rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      rx={shape.radius}
      fill={fill}
      opacity={shape.opacity}
    />
  );
}

// ── Mark ────────────────────────────────────────────────────────────────────

export function BrandMark({ size = 44, variant = "on-dark", className }: BrandMarkProps) {
  return (
    <MarkSvg
      size={size}
      variant={variant}
      className={className}
      drawing={variant === "app-icon" ? BRAND_APP_ICON : markDrawingFor(size)}
    />
  );
}

function MarkSvg({
  size,
  variant,
  className,
  drawing,
}: Required<Omit<BrandMarkProps, "className">> & { className?: string; drawing: MarkDrawing }) {
  const colors = VARIANT_COLORS[variant];
  const shapes = markShapesAt(size, { drawing, includeContainer: colors.container !== undefined });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${drawing.canvas} ${drawing.canvas}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={BRAND.name}
      role="img"
    >
      {shapes.map((shape, index) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key -- the mark is a fixed drawing
        <Shape key={index} shape={shape} colors={colors} />
      ))}
    </svg>
  );
}

// ── Logo (mark + wordmark) ──────────────────────────────────────────────────

export function BrandLogo({
  size = 44,
  variant = "on-dark",
  showWordmark = true,
  wordmarkColor,
  className,
}: BrandLogoProps) {
  // A lockup always draws the FULL mark (ring, gate, ledger), at any size: it
  // is the official lockup (core's logos), and the wordmark's size and baseline
  // are proportioned to it — and the same mark with the wordmark hidden, as the
  // product's collapsed sidebar does, so the logo never changes shape. The
  // small ringless drawing is for the bare mark alone (`BrandMark`: favicons,
  // icons) — set beside the wordmark it reads larger than the word and leaves
  // the word sitting low.
  const drawing = BRAND_MARK;
  return (
    <div
      className={["flex items-end", className].filter(Boolean).join(" ")}
      style={{ gap: Math.round(size * WORDMARK_SPEC.gapFactor) }}
    >
      <MarkSvg size={size} variant={variant} drawing={drawing} />
      {showWordmark && (
        <span
          className="av-wordmark"
          style={{
            fontFamily: "var(--font-wordmark)",
            fontWeight: WORDMARK_SPEC.weight,
            fontSize: size * WORDMARK_SPEC.sizeFactor,
            letterSpacing: `${WORDMARK_SPEC.tracking}em`,
            color: wordmarkColor ?? VARIANT_COLORS[variant].wordmark,
            lineHeight: 1,
            textTransform: "uppercase" as const,
            fontSynthesis: "none",
            // Lift the cap-trimmed wordmark so its baseline lands on the ledger
            // of the drawing used at this size.
            marginBottom: size * wordmarkBaselineLiftFactor(drawing),
          }}
        >
          {BRAND.name}
        </span>
      )}
    </div>
  );
}

export default BrandLogo;
