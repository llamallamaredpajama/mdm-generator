/**
 * A5: Consistent color palette for CDR-workup correlation indicators.
 * Each CDR gets a unique color based on its index in the merged list.
 * The same colors are used in CdrCard, OrdersCard, and ResultEntry.
 */

export const CDR_COLORS = [
  '#7c3aed', // purple
  '#059669', // emerald
  '#dc2626', // red
  '#2563eb', // blue
  '#d97706', // amber
  '#0891b2', // cyan
  '#c026d3', // fuchsia
  '#65a30d', // lime
] as const

/**
 * Build a map of CDR name (lowercase) -> color for correlation indicators.
 * Names are sorted alphabetically to ensure deterministic color assignment
 * regardless of iteration order (e.g., Object.values(), merged list index).
 *
 * Single source of truth — used by EncounterEditor, CdrCard, OrdersCard, ResultEntry.
 */
export function buildCdrColorMap(cdrNames: string[]): Map<string, string> {
  const sorted = [...cdrNames].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  const map = new Map<string, string>()
  sorted.forEach((name, idx) => {
    map.set(name.toLowerCase(), CDR_COLORS[idx % CDR_COLORS.length])
  })
  return map
}
