import type { Bundle, BundleLine } from '../types';

/**
 * Dynamic bundle pricing.
 *  - base rate grows with bundle size: 4% + 2% per experience
 *  - +2% when the bundle mixes 3+ distinct categories (cross-sell incentive)
 *  - capped at 15%; bundles need at least 2 paid experiences
 * Example: 4 experiences (2 categories) totalling €260 → 12% → €229 (save €31).
 */
export function bundleDiscountRate(lines: BundleLine[], distinctCategories = 0): number {
  const paid = lines.filter((l) => l.price > 0).length;
  if (paid < 2) return 0;
  const rate = 0.04 + 0.02 * paid + (distinctCategories >= 3 ? 0.02 : 0);
  return Math.min(0.15, Math.round(rate * 100) / 100);
}

export function createBundle(name: string, lines: BundleLine[], distinctCategories = 0): Bundle {
  const paidLines = lines.filter((l) => l.price > 0);
  const subtotal = paidLines.reduce((s, l) => s + l.price, 0);
  const discountRate = bundleDiscountRate(paidLines, distinctCategories);
  const total = Math.round(subtotal * (1 - discountRate));
  return { name, lines: paidLines, subtotal, discountRate, discount: subtotal - total, total };
}
