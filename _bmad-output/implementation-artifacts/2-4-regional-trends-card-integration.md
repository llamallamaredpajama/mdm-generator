# Story 2.4: Regional Trends Card Integration

Status: done

| Field          | Value                                          |
|----------------|-------------------------------------------------|
| Story ID       | BM-2.4                                          |
| Points         | 2                                               |
| Dependencies   | BM-2.1 (Dashboard Layout)                       |
| Epic           | Phase 2: S1 Dashboard                           |
| Priority       | Medium (completes Phase 2 dashboard)             |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** the Regional Trends card on the S1 dashboard to show a concise one-line-per-source summary of CDC surveillance data with the ability to expand to a full detail view,
**so that** I can quickly assess relevant regional disease trends before proceeding to Section 2 without being overwhelmed by detail.

---

## Acceptance Criteria

1. Regional Trends card replaces the inline `TrendsCard` component in `DashboardOutput` with a proper `RegionalTrendsCard` component
2. Concise view shows one line per CDC data source (respiratory, wastewater, NNDSS) with trend direction arrow and condition name
3. "More" button expands to `RegionalTrendsDetail` view with full finding explanations, alerts, and data attribution
4. Uses existing `TrendAnalysisContext` data (no new API calls — data comes via `trendAnalysis` prop)
5. Card is hidden/collapsed when no surveillance data is available (user has trends disabled or no data returned)
6. Loading state displays while trend analysis is in progress
7. `pnpm check` passes

---

## Tasks / Subtasks

### 1. Create `RegionalTrendsCard` Component (AC: #1, #2, #5, #6)

- [x] Create `frontend/src/components/build-mode/shared/RegionalTrendsCard.tsx`
- [x] Create `frontend/src/components/build-mode/shared/RegionalTrendsCard.css`
- [x] Props: `{ analysis: TrendAnalysisResult | null, isLoading?: boolean }`
- [x] **Loading state**: When `isLoading` is true, render card with title "Regional Trends" and a loading message "Analyzing regional surveillance data..."
- [x] **Hidden state**: When `analysis` is null/undefined and not loading, return `null` (card is invisible)
- [x] **Empty findings state**: When `analysis.rankedFindings` is empty, show "No significant regional trends detected" message
- [x] **Concise view** (default, collapsed):
  - Header: "Regional Trends" with region label badge (e.g., "US-Central")
  - Show top 3 ranked findings as one-line summaries: trend arrow + condition name + brief summary
  - Trend arrows: `↑` rising (red `#dc2626`), `↓` falling (green `#16a34a`), `→` stable (gray `#64748b`)
  - "Show Details" button at bottom to expand
- [x] **Expanded view**: Toggled by "Show Details" / "Hide Details" button
  - Show ALL ranked findings (not just top 3) with full summary text
  - Show alerts section (if any alerts present) — each alert with level icon and description
  - Data attribution footer: sources queried + analyzed date
  - Disclaimer: "Surveillance data is supplementary. Clinical judgment must guide all decisions."
- [x] BEM naming: `.regional-trends-card__*`
- [x] Use `useState` for expand/collapse toggle

### 2. Integrate RegionalTrendsCard into DashboardOutput (AC: #1)

- [x] In `DashboardOutput.tsx`:
  - Remove the inline `TrendsCard` component function (lines 63-104)
  - Add `import RegionalTrendsCard from './RegionalTrendsCard'`
  - Replace `<TrendsCard analysis={trendAnalysis} isLoading={trendLoading} />` with `<RegionalTrendsCard analysis={trendAnalysis} isLoading={trendLoading} />`
- [x] No new props needed on `DashboardOutputProps` — data already flows via `trendAnalysis` and `trendLoading` props
- [x] Keep the card in the same grid position (full-width, after middle row, before continue button)

### 3. Testing (AC: #7)

- [x] Create `frontend/src/__tests__/RegionalTrendsCard.test.tsx`
  - Returns null when analysis is null and not loading
  - Shows loading state with loading message
  - Shows empty state when rankedFindings is empty
  - Shows concise view with top 3 findings (trend arrows + conditions)
  - Shows region label in header
  - "Show Details" button expands to full view
  - Expanded view shows all findings (not just top 3)
  - Expanded view shows alerts when present
  - Expanded view shows data attribution
  - "Hide Details" button collapses back to concise view
  - Trend direction arrows render correct symbols and colors
- [x] Update `frontend/src/__tests__/DashboardOutput.test.tsx`
  - Existing trends tests should continue to pass with the component swap (test assertions target text content, not component names)
  - Verify the inline `TrendsCard` removal doesn't break existing tests — if test text changes, update assertions to match new component output
- [x] Run `cd frontend && pnpm check` — must pass

---

## Dev Notes

### Previous Story Intelligence (BM-2.3)

BM-2.3 established the pattern for replacing DashboardOutput stub/inline cards. Key learnings:

- **Single owner pattern**: `DashboardOutput` owns the data and passes it down via props. RegionalTrendsCard receives `analysis` and `isLoading` as props — it does NOT call any hooks internally.
- **Inline component removal**: The inline `TrendsCard` function in DashboardOutput (lines 63-104) is what gets replaced. It already handles loading, null, and data states — the new component needs to handle these same states plus add expand/collapse.
- **BEM + CSS variables**: Use `.regional-trends-card__*` naming, same card background/border pattern as `.dashboard-output__stub-card` and `.cdr-card`.
- **Test mock pattern**: Existing DashboardOutput tests already mock trend data via `mockTrendAnalysis` fixture. The swap from inline `TrendsCard` to imported `RegionalTrendsCard` should be transparent to tests that query by text content.

### Existing TrendsCard Implementation (to be replaced)

The inline `TrendsCard` in `DashboardOutput.tsx` (lines 63-104) currently:
- Shows loading message when `isLoading` is true
- Returns null when analysis is null or has no findings
- Shows top 3 findings with trend arrows (↑/↓/→) + condition name + summary
- Shows attribution line with region label and data sources

The new `RegionalTrendsCard` must handle ALL of these same cases plus add:
- Expand/collapse toggle
- Full findings list in expanded view
- Alerts display in expanded view
- Data attribution footer in expanded view
- Disclaimer text in expanded view

### TrendAnalysisResult Shape (from `frontend/src/types/surveillance.ts`)

```typescript
interface TrendAnalysisResult {
  analysisId: string
  regionLabel: string                    // e.g., "US-Central"
  rankedFindings: TrendFinding[]         // sorted by overallScore desc
  alerts: SurveillanceAlert[]            // critical/warning/info alerts
  summary: string                        // overall summary text
  dataSourcesQueried: string[]           // e.g., ["resp_hosp", "nwss", "nndss"]
  dataSourceSummaries?: DataSourceSummary[]
  analyzedAt: string                     // ISO timestamp
}

interface TrendFinding {
  condition: string                      // e.g., "RSV"
  overallScore: number                   // 0-1 relevance score
  tier: 'high' | 'moderate' | 'low' | 'background'
  trendDirection: 'rising' | 'falling' | 'stable' | 'unknown'
  trendMagnitude?: number
  summary: string                        // e.g., "RSV hospitalizations up 15%"
}

interface SurveillanceAlert {
  level: 'critical' | 'warning' | 'info'
  title: string
  description: string
  condition?: string
}
```

### CSS Color Conventions for Trend Arrows

These colors are already established in `DashboardOutput.css`:
| Direction | Color | CSS |
|-----------|-------|-----|
| Rising | Red | `#dc2626` |
| Falling | Green | `#16a34a` |
| Stable | Gray | `var(--color-text-secondary, #64748b)` |

### Expand/Collapse Pattern

Use simple `useState<boolean>(false)` for expand/collapse. The `TrendResultsPanel` component (at `frontend/src/components/TrendResultsPanel.tsx`) is a full-featured trends display component used outside Build Mode — reference its layout for the expanded view, but do NOT import it. The RegionalTrendsCard should be self-contained.

### What NOT to Build

- **Do NOT add new API calls** — surveillance data is passed via props from `TrendAnalysisContext`
- **Do NOT import `TrendResultsPanel`** — RegionalTrendsCard is a new self-contained component for the dashboard
- **Do NOT add PDF download** — PDF report button lives in the standalone `TrendResultsPanel`, not the dashboard card
- **Do NOT modify `TrendAnalysisContext`** — no changes to state management
- **Do NOT add new props to `DashboardOutputProps`** — `trendAnalysis` and `trendLoading` already exist

### Project Structure Notes

| File | Path | Action |
|------|------|--------|
| RegionalTrendsCard component | `frontend/src/components/build-mode/shared/RegionalTrendsCard.tsx` | Create |
| RegionalTrendsCard styles | `frontend/src/components/build-mode/shared/RegionalTrendsCard.css` | Create |
| DashboardOutput | `frontend/src/components/build-mode/shared/DashboardOutput.tsx` | Modify (replace inline TrendsCard) |
| DashboardOutput CSS | `frontend/src/components/build-mode/shared/DashboardOutput.css` | Modify (remove inline trends styles if any) |
| RegionalTrendsCard tests | `frontend/src/__tests__/RegionalTrendsCard.test.tsx` | Create |
| DashboardOutput tests | `frontend/src/__tests__/DashboardOutput.test.tsx` | Modify (verify tests pass with component swap) |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-s1-dashboard.md -- Story 2.4 spec]
- [Source: _bmad-output/implementation-artifacts/2-3-cdr-summary-card.md -- Previous story patterns]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.tsx:63-104 -- Inline TrendsCard to replace]
- [Source: frontend/src/types/surveillance.ts -- TrendAnalysisResult, TrendFinding, SurveillanceAlert types]
- [Source: frontend/src/components/TrendResultsPanel.tsx -- Reference implementation for expanded view layout]
- [Source: frontend/src/contexts/TrendAnalysisContext.tsx -- Data flow context]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.css -- Existing card styles]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 104 tests pass on first run (13 new RegionalTrendsCard tests + 91 existing). No test failures or debug cycles needed.
- Code review fix for summary text regression caused 1 test failure (collapse test expected summary hidden). Fixed by updating assertion to verify concise summary remains visible.

### Completion Notes List

- Task 1: Created `RegionalTrendsCard` component with concise/expanded views. Concise view shows top 3 findings with trend arrows and summaries. Expanded view shows all findings, alerts section, data attribution, and disclaimer. Toggle button appears when there are >3 findings or alerts.
- Task 2: Replaced inline `TrendsCard` in `DashboardOutput.tsx` with imported `RegionalTrendsCard`. Removed 42 lines of inline component code. No prop changes needed.
- Task 3: Created 14 RegionalTrendsCard tests covering null, loading, empty, concise, expanded, alerts, attribution, toggle, and arrow rendering. All existing DashboardOutput tests (21) pass without changes.
- Code Review: Fixed 4 issues: (CR1) removed duplicate CSS in --loading/--empty modifiers, (CR2) removed 35 lines of orphaned trends CSS from DashboardOutput.css, (CR3) fixed wasteful double-render in attribution test, (CR4) restored concise summary text to maintain parity with old TrendsCard (UX regression fix). Added 1 new test. Full suite: 105 tests pass.

### Change Log

- 2026-02-24: Implemented BM-2.4 Regional Trends Card Integration -- replaced inline TrendsCard with RegionalTrendsCard component
- 2026-02-24: Code review (adversarial) -- fixed 4 issues: CSS duplication, orphaned styles, test double-render, concise summary regression

### File List

- `frontend/src/components/build-mode/shared/RegionalTrendsCard.tsx` -- Created (trends card with expand/collapse)
- `frontend/src/components/build-mode/shared/RegionalTrendsCard.css` -- Created (trends card styles)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` -- Modified (replaced inline TrendsCard with RegionalTrendsCard import)
- `frontend/src/components/build-mode/shared/DashboardOutput.css` -- Modified (removed orphaned inline trends styles)
- `frontend/src/__tests__/RegionalTrendsCard.test.tsx` -- Created (14 tests)
