# Story BM-2.1: Dashboard Output Layout

## Status

**done**

| Field          | Value                                      |
|----------------|--------------------------------------------|
| Story ID       | BM-2.1                                     |
| Points         | 5                                          |
| Dependencies   | BM-1.3 (Encounter Schema Extension)        |
| Epic           | Phase 2: S1 Dashboard                      |
| Priority       | High (first frontend-facing feature story)  |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** the Section 1 output to display as a 4-area dashboard (Differential, CDRs, Workup, Regional Trends) instead of a flat list,
**so that** I can review AI analysis across multiple clinical dimensions at a glance and select my workup before proceeding to Section 2.

---

## Acceptance Criteria

1. S1 output renders as a 4-area dashboard (differential fully functional, CDR/Workup/Trends stubbed)
2. Each differential item shows urgency color dot, diagnosis name, and expand arrow
3. Expanded item shows reasoning text, CDR association (if any), and regional context (if any)
4. "Accept Workup & Continue" button scrolls to / focuses Section 2
5. Mobile: single column stacked layout
6. Desktop: differential full-width top, CDR + Workup side-by-side, Trends full-width bottom
7. No regression: existing S1 submission flow still works, existing encounters render without errors
8. `pnpm check` passes

---

## Tasks / Subtasks

### 1. Extend Frontend DifferentialItem Type (AC: #3, #7)

- [x] Add optional `regionalContext?: string` and `cdrContext?: string` fields to the `DifferentialItem` interface in `frontend/src/types/encounter.ts` to match the backend `DifferentialItemSchema` which already includes these fields
- [x] Verify existing code that uses `DifferentialItem` is unaffected (fields are optional)

### 2. Create DifferentialList Component (AC: #1, #2, #3, #5, #6)

- [x] Create `frontend/src/components/build-mode/shared/DifferentialList.tsx`
- [x] Create `frontend/src/components/build-mode/shared/DifferentialList.css` for component styles
- [x] Render each differential item as a collapsible row with urgency color dot (red/amber/green), diagnosis name, and expand/collapse chevron
- [x] **Design change from DifferentialPreview:** Replace the existing urgency badge pattern (text-only pills) with a color dot + text label pattern. Each row gets a small colored circle AND a text label (Emergent/Urgent/Routine) — this improves scannability over the current badge-only approach.
- [x] Expanded state shows: reasoning text, CDR association from `cdrContext` (if present), regional context from `regionalContext` (if present)
- [x] Urgency summary badges at top (e.g., "3 emergent, 2 urgent, 1 routine")
- [x] "Expand All / Collapse All" toggle button
- [x] Worst-first ordering note at bottom
- [x] Accessibility: color is NOT the only urgency indicator — include text labels (Emergent/Urgent/Routine) alongside color dots for colorblind users

### 3. Create DashboardOutput Component (AC: #1, #4, #5, #6)

- [x] Create `frontend/src/components/build-mode/shared/DashboardOutput.tsx`
- [x] Create `frontend/src/components/build-mode/shared/DashboardOutput.css`
- [x] Layout: 4-area grid with responsive behavior
  - **Mobile** (< 768px): single column stacked — Differential, CDR stub, Workup stub, Trends stub
  - **Desktop** (>= 768px): Differential full-width top row, CDR + Workup side-by-side middle row, Trends full-width bottom row
- [x] Wire `DifferentialList` into the Differential area with encounter's S1 differential data
- [x] Create CDR stub card: "Clinical Decision Rules" header, placeholder text ("CDR matching available after workup — BM-2.3"), or display `cdrContext` strings from differential items if present
- [x] Create Workup stub card: "Recommended Workup" header, placeholder text ("Order selection available — BM-2.2")
- [x] Create Trends stub card: if `TrendAnalysisContext` has data, show one-line summaries per source; if not, show "Regional trends unavailable" or hide card entirely when trends are disabled
- [x] "Accept Workup & Continue" button at the bottom that scrolls to Section 2

### 4. Wire DashboardOutput into EncounterEditor (AC: #1, #4, #7)

- [x] In `frontend/src/components/build-mode/EncounterEditor.tsx`, replace the `DifferentialPreview` in `getSectionPreview(section 1)` with `null` (remove the preview-inside-SectionPanel approach for S1)
- [x] Render `DashboardOutput` as a standalone component between S1's `SectionPanel` and S2's section, visible when `encounter.section1.status === 'completed'` and differential data exists
- [x] Integrate existing `TrendResultsPanel` data into the dashboard's Trends stub card (move the trend display from its current standalone position into the dashboard)
- [x] Remove the now-redundant standalone `TrendResultsPanel` rendering between S1 and S2 (the "View Chart Report" button can remain or move into the Trends card)
- [x] Add `id="section-panel-2"` to the S2 section wrapper (the `div` or `SectionPanel` for Section 2) so the "Accept Workup & Continue" button has a scroll target
- [x] Remove `DifferentialPreview` import from `EncounterEditor.tsx`

### 5. Deprecate DifferentialPreview (AC: #7)

- [x] Verify `DifferentialPreview.tsx` is no longer imported anywhere
- [x] Keep the file for now (do NOT delete) — mark with a deprecation comment at top. Other components may reference its CSS patterns. Actual deletion can happen in a cleanup pass.

### 6. Quality Verification (AC: #7, #8)

- [x] Run `cd frontend && pnpm check` — must pass (typecheck + lint + test)
- [x] Manually verify: load an existing encounter with S1 completed — dashboard renders, differential items expand/collapse *(covered by unit tests: DashboardOutput renders when llmResponse has differential data)*
- [x] Manually verify: load an existing encounter with S1 pending — no dashboard shown, S1 SectionPanel renders normally *(covered by unit test: returns null when no differential data)*
- [x] Manually verify: existing encounters created before this change still render without errors *(covered by unit tests: both flat array and wrapped object data shapes handled)*
- [x] Verify mobile layout (single column stacked) via responsive dev tools or iOS simulator *(CSS verified; unit test confirms class toggling; visual QA recommended)*
- [x] Verify desktop layout (grid with side-by-side CDR + Workup cards) at >= 768px *(CSS verified; unit test confirms desktop class applied; visual QA recommended)*

---

## Dev Notes

### Previous Story Insights (BM-1.3)

BM-1.3 extended the encounter types with structured fields for S2 (selectedTests, testResults, workingDiagnosis), CDR tracking, and S3 (treatments, disposition, followUp). All new fields are optional with defensive defaults in `useEncounter.ts`. The `DifferentialItem` frontend type was NOT updated in BM-1.3 — it still only has `diagnosis`, `urgency`, `reasoning`. This story needs to add the missing optional fields.

### DifferentialItem Type Gap

The **backend** `DifferentialItemSchema` in `backend/src/buildModeSchemas.ts:63-69` includes:
```typescript
export const DifferentialItemSchema = z.object({
  diagnosis: z.string(),
  urgency: z.enum(['emergent', 'urgent', 'routine']),
  reasoning: z.string(),
  regionalContext: z.string().optional(),
  cdrContext: z.string().optional(),
})
```

The **frontend** `DifferentialItem` in `frontend/src/types/encounter.ts:98-105` only has:
```typescript
export interface DifferentialItem {
  diagnosis: string
  urgency: UrgencyLevel
  reasoning: string
}
```

Add `regionalContext?: string` and `cdrContext?: string` to the frontend type. These are already returned by the LLM and stored in Firestore — they're just not typed on the frontend.

### "Key Tests" Field — Not Yet Available

The prototype wireframe shows "Key tests: ECG, serial troponins" in expanded differential items. However, the S1 LLM prompt does NOT currently output a `keyTests` field per diagnosis — this information is embedded in the `reasoning` text. For this story, display `reasoning`, `cdrContext`, and `regionalContext` in the expanded view. The `keyTests` display can be added in BM-2.2 (Workup Card) when the test library integration provides this mapping.

### DashboardOutput Placement in EncounterEditor

**Current flow** in `EncounterEditor.tsx`:
```
TrendAnalysisToggle (compact)
SectionPanel for S1 (with DifferentialPreview as preview prop)
TrendResultsPanel (standalone, after S1 completes)  ← lines 358-376
Section 2 (blocked or SectionPanel)
Section 3 (blocked or SectionPanel)
```

**New flow:**
```
TrendAnalysisToggle (compact)
SectionPanel for S1 (NO preview — getSectionPreview returns null for section 1)
DashboardOutput (standalone, after S1 completes)  ← replaces both DifferentialPreview AND TrendResultsPanel
Section 2 (blocked or SectionPanel)
Section 3 (blocked or SectionPanel)
```

The `DashboardOutput` replaces the S1 preview AND the standalone TrendResultsPanel. It is rendered **between** sections, not inside a SectionPanel.

### getSectionPreview Integration Point

In `EncounterEditor.tsx:64-97`, the `getSectionPreview()` function currently returns `DifferentialPreview` for section 1:

```typescript
case 1: {
  const llmResponse = encounter.section1.llmResponse
  const differential = Array.isArray(llmResponse)
    ? llmResponse
    : llmResponse?.differential
  if (Array.isArray(differential) && differential.length > 0) {
    return <DifferentialPreview differential={differential} />
  }
  return null
}
```

Change this to return `null` for section 1. The dashboard is rendered separately outside the SectionPanel.

### Differential Data Shape (Backward Compatibility)

The S1 `llmResponse` has two possible shapes (see `EncounterEditor.tsx:74-78`):
- **Flat array**: `llmResponse` is `DifferentialItem[]` directly (old encounters)
- **Wrapped object**: `llmResponse` is `{ differential: DifferentialItem[], processedAt: Timestamp }`

The `DashboardOutput` must handle both shapes. The existing extraction logic:
```typescript
const differential = Array.isArray(llmResponse) ? llmResponse : llmResponse?.differential
```
should be reused or centralized as a helper.

### Trend Analysis Integration

Currently, `TrendResultsPanel` and `TrendReportModal` are rendered standalone after S1 in `EncounterEditor.tsx:358-376`. The dashboard's Trends stub card should:

1. Use existing `useTrendAnalysis()` hook data (already called in EncounterEditor at line 130)
2. Show concise one-line summaries when data is available
3. Hide entirely when trends are disabled (no `analysis` data)
4. The "View Chart Report" button can move into the Trends card or remain below the dashboard

The full `TrendResultsPanel` component can optionally be rendered inside the Trends card for the stub, or a simplified summary can be shown with a "More" link (the full `RegionalTrendsCard` comes in BM-2.4).

### Responsive Layout Pattern

Use the existing `useIsMobile()` hook from `frontend/src/hooks/useMediaQuery.ts:71` (breakpoint: 767px). Pattern:

```typescript
import { useIsMobile } from '../../../hooks/useMediaQuery'

export default function DashboardOutput({ ... }) {
  const isMobile = useIsMobile()

  return (
    <div className={`dashboard-output ${isMobile ? 'dashboard-output--mobile' : 'dashboard-output--desktop'}`}>
      {/* Differential: always full-width */}
      <div className="dashboard-output__differential">
        <DifferentialList differential={differential} />
      </div>

      {/* CDR + Workup: side-by-side on desktop, stacked on mobile */}
      <div className="dashboard-output__middle-row">
        <div className="dashboard-output__cdr-card">{/* stub */}</div>
        <div className="dashboard-output__workup-card">{/* stub */}</div>
      </div>

      {/* Trends: full-width */}
      <div className="dashboard-output__trends">{/* stub or existing data */}</div>

      {/* Action */}
      <button className="dashboard-output__continue-btn">
        Accept Workup & Continue
      </button>
    </div>
  )
}
```

CSS grid for desktop:
```css
.dashboard-output--desktop .dashboard-output__middle-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
```

### CSS Variables and Existing Patterns

Follow the CSS variable pattern from `DifferentialPreview.css`:
- `var(--color-surface, #f8fafc)` for card backgrounds
- `var(--color-border, #e2e8f0)` for borders
- `var(--color-text, #1e293b)` for primary text
- `var(--color-text-secondary, #64748b)` for secondary text
- Urgency colors: `#dc2626` (emergent red), `#d97706` (urgent amber), `#16a34a` (routine green)

### "Accept Workup & Continue" Button Behavior

This button does NOT change encounter state — S2 is already unlocked when S1 is complete. The button should:
1. Scroll smoothly to the Section 2 panel
2. Optionally collapse the dashboard to save vertical space

**Scroll target:** No `id="section-content-2"` exists in the current codebase. In Task 4, when wiring `DashboardOutput` into `EncounterEditor.tsx`, add `id="section-panel-2"` to the S2 `SectionPanel` wrapper (or the surrounding `div`). Then the button uses:
```typescript
document.getElementById('section-panel-2')?.scrollIntoView({ behavior: 'smooth' })
```

### Existing File Locations

| File | Path | What to do |
|------|------|------------|
| Frontend encounter types | `frontend/src/types/encounter.ts` | Add `regionalContext?` and `cdrContext?` to `DifferentialItem` |
| Encounter editor | `frontend/src/components/build-mode/EncounterEditor.tsx` | Swap preview, render DashboardOutput |
| DifferentialPreview | `frontend/src/components/build-mode/DifferentialPreview.tsx` | Deprecate (add comment, keep file) |
| DifferentialPreview CSS | `frontend/src/components/build-mode/DifferentialPreview.css` | Keep (CSS patterns reusable) |
| New DashboardOutput | `frontend/src/components/build-mode/shared/DashboardOutput.tsx` | Create |
| New DashboardOutput CSS | `frontend/src/components/build-mode/shared/DashboardOutput.css` | Create |
| New DifferentialList | `frontend/src/components/build-mode/shared/DifferentialList.tsx` | Create |
| New DifferentialList CSS | `frontend/src/components/build-mode/shared/DifferentialList.css` | Create (urgency dots, collapsible rows, summary badges) |
| useIsMobile hook | `frontend/src/hooks/useMediaQuery.ts` | Use (do not modify) |
| Trend analysis hook | `frontend/src/hooks/useTrendAnalysis.ts` | Use (do not modify) |
| TrendAnalysisContext | `frontend/src/contexts/TrendAnalysisContext.tsx` | Use (do not modify) |

### Stub Card Design

Stub cards for CDR and Workup should be minimal but visually consistent with the dashboard layout:

```tsx
function StubCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="dashboard-output__stub-card">
      <h4>{title}</h4>
      <p className="dashboard-output__stub-text">{description}</p>
    </div>
  )
}
```

Stubs should:
- Have the same border/padding/radius as the differential card
- Use muted text color for placeholder content
- Not include interactive elements (buttons come in their respective stories)

### No PHI

This story is purely frontend UI. No medical content is created, logged, or transmitted. The differential data displayed is AI-generated clinical vocabulary, not patient data.

### Testing

- **Type safety:** `cd frontend && pnpm check` validates type changes compile and no existing code breaks
- **Visual verification (mobile):** Use responsive dev tools at 375px width. Dashboard should stack all 4 areas vertically.
- **Visual verification (desktop):** At 1024px width. Differential full-width, CDR + Workup side-by-side, Trends full-width.
- **Backward compat:** Load an encounter created before this change — should render without errors. Encounters without `regionalContext`/`cdrContext` fields should display differential items normally (just without those optional details).
- **S1 flow regression:** Create a new encounter, submit S1, verify the dashboard appears with differential data.
- **Expand/collapse:** Click each differential item — should toggle expanded details. "Expand All" / "Collapse All" should work.
- **Continue button:** Click "Accept Workup & Continue" — should scroll to Section 2.
- **Trends integration:** If trend analysis is enabled and has data, the Trends area should show content. If disabled, it should be hidden or show minimal placeholder.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 0.1 | Initial draft — story creation task | Claude |
| 2026-02-23 | 1.0 | Implementation complete — DashboardOutput, DifferentialList, type extension, EncounterEditor wiring, 19 unit tests | Claude Opus 4.6 |

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- TypeScript compilation check caught unused `downloadPdf` destructured variable after removing `TrendResultsPanel` from EncounterEditor — fixed by removing from destructuring.
- `pnpm check` (tsc -b) caught `relevanceScore` field in test fixture — `TrendFinding` uses `overallScore`, not `relevanceScore`. Fixed test mock.

### Completion Notes List
- **Task 1:** Added `regionalContext?: string` and `cdrContext?: string` to `DifferentialItem` interface. Zero impact on existing code (optional fields).
- **Task 2:** Created `DifferentialList` component with color dot + text label urgency pattern, collapsible rows, expand/collapse all, urgency summary badges, and accessibility (text labels alongside color dots for colorblind users).
- **Task 3:** Created `DashboardOutput` with 4-area responsive grid (differential, CDR stub, workup stub, trends), backward-compatible data shape handling, and "Accept Workup & Continue" scroll button.
- **Task 4:** Rewired `EncounterEditor.tsx`: removed `DifferentialPreview` from `getSectionPreview`, replaced standalone `TrendResultsPanel` with `DashboardOutput`, added `id="section-panel-2"` scroll target, cleaned up unused imports (`DifferentialPreview`, `TrendResultsPanel`, `downloadPdf`).
- **Task 5:** Added `@deprecated` JSDoc to `DifferentialPreview.tsx`. Verified no remaining imports.
- **Task 6:** `pnpm check` passes (typecheck + lint + 25 tests). 19 new unit tests across 2 test files.
- **Visual QA recommended:** Mobile stacked layout and desktop grid layout verified via CSS and unit test class assertions, but visual browser testing recommended during QA phase.

### File List
**Created:**
- `frontend/src/components/build-mode/shared/DifferentialList.tsx`
- `frontend/src/components/build-mode/shared/DifferentialList.css`
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx`
- `frontend/src/components/build-mode/shared/DashboardOutput.css`
- `frontend/src/__tests__/DifferentialList.test.tsx`
- `frontend/src/__tests__/DashboardOutput.test.tsx`

**Modified:**
- `frontend/src/types/encounter.ts` (added `regionalContext?`, `cdrContext?` to `DifferentialItem`)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (swapped preview, wired DashboardOutput, removed unused imports)
- `frontend/src/components/build-mode/DifferentialPreview.tsx` (added `@deprecated` comment)

---

## QA Results

### Review Date: 2026-02-23

### Reviewed By: Quinn (Senior Developer QA)

### Code Quality Assessment

Excellent implementation. The developer delivered a well-structured, accessible, and backward-compatible dashboard with clean separation between DifferentialList (reusable) and DashboardOutput (composition). Key strengths:

- **Backward compatibility**: `getDifferential()` correctly handles both flat array and wrapped object data shapes from older/newer encounters
- **Accessibility**: Color dots paired with text labels (Emergent/Urgent/Routine) for colorblind users, `aria-expanded`/`aria-controls` on collapsible rows, `aria-hidden` on decorative elements
- **Component architecture**: `handleScrollToSection2` defined outside the component (no closure deps = no needless `useCallback`), `StubCard` and `TrendsCard` as focused sub-components
- **Clean EncounterEditor wiring**: Removed `DifferentialPreview` and `TrendResultsPanel` from Build Mode flow, added `id="section-panel-2"` scroll target, preserved "View Chart Report" button

### Refactoring Performed

- **File**: `frontend/src/__tests__/DashboardOutput.test.tsx`
  - **Change**: Replaced static `vi.mock` returning `false` with `vi.hoisted` + `vi.fn()` controllable mock, added `beforeEach` reset, added mobile layout test case
  - **Why**: Original test suite only tested desktop layout class. No test verified the `dashboard-output--mobile` class was applied when `useIsMobile()` returns `true` — a gap in responsive layout coverage
  - **How**: New test brings DashboardOutput test count from 10 to 11 (total suite from 25 to 26) and validates both layout paths

- **File**: `frontend/src/components/build-mode/shared/DashboardOutput.tsx`
  - **Change**: Replaced `&amp;` with `&` in button text
  - **Why**: JSX handles literal `&` directly — HTML entities like `&amp;` are unnecessary in JSX text content and look out-of-place to React developers
  - **How**: No functional change; rendered output is identical

- **File**: `frontend/src/components/build-mode/shared/DifferentialList.css`
  - **Change**: Removed empty `.diff-row__detail-section { /* empty: just grouping */ }` rule
  - **Why**: Empty CSS rules add no styling; the `<div>` grouping is already clear from the HTML structure
  - **How**: Eliminates dead CSS without affecting layout

### Compliance Check

- Coding Standards: ✓ — BEM CSS naming, CSS variables with fallbacks matching existing patterns, proper component composition, no PHI
- Project Structure: ✓ — New components in `shared/` directory per story spec, tests in `__tests__/`, types extended in-place
- Testing Strategy: ✓ — 20 unit tests across 2 files (9 DifferentialList + 11 DashboardOutput) covering rendering, interaction, data shapes, accessibility, and responsive layout
- All ACs Met: ✓ — See verification below

### AC Verification

1. **S1 output renders as 4-area dashboard** — ✓ DashboardOutput renders differential, CDR stub, workup stub, and conditional trends card
2. **Each differential item shows urgency color dot, diagnosis name, expand arrow** — ✓ DifferentialRow renders `.diff-row__dot`, `.diff-row__diagnosis`, `.diff-row__chevron` with urgency-specific CSS classes
3. **Expanded item shows reasoning, CDR association, regional context** — ✓ Conditional rendering of `cdrContext` and `regionalContext` in expanded view; tested in DifferentialList.test.tsx
4. **"Accept Workup & Continue" scrolls to Section 2** — ✓ `handleScrollToSection2()` calls `getElementById('section-panel-2').scrollIntoView({ behavior: 'smooth' })`; `id="section-panel-2"` added to EncounterEditor S2 wrapper
5. **Mobile: single column stacked layout** — ✓ `useIsMobile()` toggles `dashboard-output--mobile` class; CSS uses flex column layout
6. **Desktop: differential full-width, CDR + Workup side-by-side, Trends full-width** — ✓ `dashboard-output--desktop` class applies `grid-template-columns: 1fr 1fr` to middle row
7. **No regression** — ✓ `getSectionPreview` returns null for S1 (dashboard renders separately), existing imports cleaned up, backward-compatible data shape handling, `pnpm check` passes
8. **`pnpm check` passes** — ✓ typecheck + lint + 26 tests pass (26 = 5 formatTrendReport + 11 DashboardOutput + 9 DifferentialList + 1 App)

### Improvements Checklist

- [x] Added mobile layout test case (DashboardOutput.test.tsx)
- [x] Simplified `&amp;` to `&` in JSX button text (DashboardOutput.tsx)
- [x] Removed empty CSS rule (DifferentialList.css)
- [ ] Consider extracting `getDifferential()` to a shared utility — the same data shape logic exists in EncounterEditor.tsx:135 for trend analysis (low priority, 2-line duplication)
- [ ] CDR stub card could display aggregated `cdrContext` strings from differential items when present (story says "or display cdrContext strings" — current approach uses static placeholder, which is valid for a stub; enhancement can come with BM-2.3)
- [ ] Visual browser QA recommended for mobile stacked layout and desktop grid layout (unit tests verify class names but not actual CSS rendering)

### Security Review

No concerns. This story is purely frontend UI with no API calls, no medical content creation, and no data transmission. Differential data displayed is AI-generated clinical vocabulary sourced from the existing Firestore encounter document. No PHI pathways introduced.

### Performance Considerations

No concerns. DifferentialList computes urgency counts via three `filter()` passes — negligible for typical 3-10 item differentials. State management uses `Set<number>` for O(1) expand/collapse lookups. CSS transitions are lightweight (0.15s ease on hover/rotate). No unnecessary re-renders — `toggleItem` is memoized via `useCallback`, `toggleAll` depends only on `allExpanded` and `differential`.

### Final Status

✓ Approved - Ready for Done
