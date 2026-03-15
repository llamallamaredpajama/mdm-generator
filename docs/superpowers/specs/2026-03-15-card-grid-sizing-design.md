# Adaptive Card Grid for EncounterBoard

**Date:** 2026-03-15
**Status:** Approved

## Problem

BoardCards on the EncounterBoard are fixed at 150px wide (120px on mobile). On a full-size browser window, cards occupy roughly 10% of available space — the rest is dead space. For a typical ER shift of up to 30 encounters, the board should use the viewport effectively while keeping card images readable.

## Design

Replace the fixed-width horizontal flex layout with a CSS Grid that wraps cards into rows, using both horizontal and vertical space. Cards have a 240px minimum width and stretch to fill available row space (yielding ~5 cards per row on a 1440px viewport). When card count exceeds the available vertical space, the section switches to column-first grid flow with horizontal scrolling.

### Card Sizing

- **Min width:** 240px
- **Max width:** `1fr` (fills available space — no trailing dead space)
- **Photo aspect ratio:** 16:9 (preserved via `aspect-ratio`)
- **Approximate card height:** ~190px at ~280px width (157px photo + 32px footer + border)
- **Mobile min width:** 200px

### Layout Modes

**Normal mode (wrapping grid):**
Cards auto-fill into rows within each status section (COMPOSING, COMPLETE). CSS Grid `repeat(auto-fill, minmax(240px, 1fr))` handles column count automatically and stretches cards to fill any trailing space. With few cards, they fill a single row. As more are added, they wrap to additional rows. No scroll-snap in this mode.

**Overflow mode (horizontal scroll):**
When card count exceeds `maxRows × columnsPerRow`, the section switches to column-first flow with horizontal scrolling. Scroll-snap (`x proximity`) applies only in this mode.

```css
.swim-lane-row--overflow .swim-lane-row__cards {
  grid-template-columns: unset;
  grid-template-rows: repeat(var(--max-rows, 2), auto);
  grid-auto-flow: column;
  grid-auto-columns: minmax(240px, 280px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
}
```

### Card-Slot Wrapper

The existing `motion.div.swim-lane-row__card-slot` wrapper is **kept** but restyled. It currently sets `flex: 0 0 150px` — that sizing rule is removed (the grid cell handles sizing). The wrapper is retained because it carries Framer Motion `variants`, `exit`, and stagger animation props for `AnimatePresence`. The card-slot simply becomes a transparent grid child with no explicit dimensions.

### Overflow Detection

A new `useGridOverflow` hook measures the container via `ResizeObserver` and determines:
- `maxRows`: `floor((sectionHeight - headerHeight) / (cardHeight + gap))`
- `columnsPerRow`: `floor(containerWidth / 240)`
- `isOverflow`: `cardCount > maxRows × columnsPerRow`

The hook sets a CSS custom property `--max-rows` on the container and returns `isOverflow` for class toggling.

**Implementation notes:**
- Uses `ResizeObserver` with 150ms trailing debounce to avoid thrashing during DetailPanel open/close animation (~300ms)
- Cleans up observer on unmount
- `cardHeight` is estimated at 190px (16:9 of 280px + footer); does not need pixel-perfect measurement

### Section Height Budget

Each status section gets up to 50% of the available board area height: `(100vh - TopNav(56px) - padding(32px) - gap(16px)) / 2`.

When one section has 0 cards, the existing behavior (other section gets `flex: 1` to fill available space) is preserved.

When the DetailPanel is open (50% of viewport width), the grid reflows automatically with fewer columns per row. Cards maintain the same 240px minimum.

### Mobile Behavior

Below 767px breakpoint: cards use `minmax(200px, 1fr)`, vertical scroll instead of horizontal. Overflow mode is not used on mobile.

### Transition Behavior

The switch between normal and overflow mode is instant (no CSS transition). The Framer Motion card entrance animations provide sufficient visual continuity.

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/components/board/SwimLaneRow.css` | Replace flex layout with CSS Grid (normal + overflow modes) |
| `frontend/src/components/board/SwimLaneRow.tsx` | Restyle `card-slot` (remove fixed width), add overflow class toggle, set `--max-rows` CSS var |
| `frontend/src/hooks/useGridOverflow.ts` | New hook: ResizeObserver-based container measurement, overflow detection |
| `frontend/src/components/board/BoardCard.css` | No changes needed (card sizes itself to grid cell) |
| `frontend/src/components/board/EncounterBoard.css` | Minor: ensure board-area sections have proper height constraints |

## What Stays the Same

- BoardCard component (no changes to card internals, photo, room overlay, footer)
- Card selection, hover, tap animations (Framer Motion) — card-slot wrapper retained for AnimatePresence
- DetailPanel open/close behavior (50% width split)
- Draft vs active card border styling
- Status dot indicators in card footer

## Overflow Thresholds (Reference)

Assumes 1080p display height (~420px per section = 2 rows). On taller displays (1440p, 4K), `maxRows` increases and overflow triggers later.

| Viewport | Cols/Row | Max Rows (1080p) | Overflow At |
|----------|----------|-------------------|-------------|
| 1440px full | 5 | 2 | 11 cards |
| 1440px + DetailPanel | 3 | 2 | 7 cards |
| 1024px | 4 | 2 | 9 cards |
| 768px (mobile) | 1 | vertical scroll | N/A |
