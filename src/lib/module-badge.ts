/**
 * A plan card's module badge. `shown`: the plan's modules the site advertises
 * (public and signed off); `marketedCount`: how many modules the site markets
 * across every plan, counted BEFORE the sign-off filter — so "All modules
 * included" means every marketed module is on this plan and signed off, and a
 * plan with nothing signed off gets no badge at all (an empty pill, or "all"
 * of nothing, would be a claim).
 */
export function moduleBadgeLabel(shown: readonly string[], marketedCount: number): string {
  if (shown.length === 0) return "";
  return shown.length >= marketedCount ? "All modules included" : shown.join(" + ");
}
