# Story BM-2.2: Workup Card with Order Selection

## Status

**done**

| Field          | Value                                          |
|----------------|-------------------------------------------------|
| Story ID       | BM-2.2                                          |
| Points         | 5                                               |
| Dependencies   | BM-1.1 (Test Library), BM-2.1 (Dashboard Layout)|
| Epic           | Phase 2: S1 Dashboard                           |
| Priority       | High (enables structured workup selection)       |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** the Workup card on the S1 dashboard to show AI-recommended tests as pre-checked boxes with an "Accept All" action and an "Edit" option to open a full categorized order selector,
**so that** I can quickly review and customize my workup orders before proceeding to Section 2.

---

## Acceptance Criteria

1. Workup card replaces the stub card on the S1 dashboard and shows AI-recommended tests as pre-checked checkboxes
2. Checkboxes are tappable directly on the dashboard card (no need to expand/open the card first)
3. "Accept All" button checks all AI-recommended tests; individual checkboxes can be toggled independently
4. "Edit" button navigates to a full `OrderSelector` view showing the complete test library organized by category (Labs, Imaging, Procedures/POC)
5. Full order selector has a "Back" button that returns to the dashboard, preserving all selections
6. Selected test count is displayed on the Workup card header (e.g., "4 selected")
7. Selections persist in component state across card ↔ order selector navigation and are stored on the encounter's `section2.selectedTests` field in Firestore
8. `pnpm check` passes

---

## Tasks / Subtasks

### 1. Create `useTestLibrary` Hook (AC: #4)

- [x] Create `frontend/src/hooks/useTestLibrary.ts`
- [x] Fetch `GET /v1/libraries/tests` using `useAuthToken()` pattern from `frontend/src/lib/firebase.tsx:54`
- [x] Cache response in hook state (the backend already caches for 5 min; frontend caches in React state for component lifetime)
- [x] Return `{ tests: TestDefinition[], categories: TestCategory[], loading: boolean, error: string | null }`
- [x] Handle auth token absence gracefully (return empty state while token resolves)

### 2. Build AI-Recommended Test Matching Logic (AC: #1, #3)

- [x] Create a pure function `getRecommendedTestIds(differential: DifferentialItem[], testLibrary: TestDefinition[]): string[]` — can live in `WorkupCard.tsx` or a small utility
- [x] Matching strategy: for each test in the library, check if the test's `name` (case-insensitive) appears in any differential item's `reasoning` text OR if any of the test's `commonIndications` overlap with differential `diagnosis` names (case-insensitive substring match)
- [x] Return deduplicated array of test IDs that match
- [x] This is intentionally simple — false positives are acceptable because the physician reviews and adjusts

### 3. Create `WorkupCard` Component (AC: #1, #2, #3, #6, #7)

- [x] Create `frontend/src/components/build-mode/shared/WorkupCard.tsx`
- [x] Create `frontend/src/components/build-mode/shared/WorkupCard.css`
- [x] Props: `{ differential: DifferentialItem[], selectedTests: string[], onSelectionChange: (testIds: string[]) => void, onOpenOrderSelector: () => void }`
- [x] Fetch test library via `useTestLibrary()` hook
- [x] Compute AI-recommended tests from differential + library using matching function
- [x] Render header: "Recommended Workup" with selected count badge (e.g., "4 selected")
- [x] Render each recommended test as a labeled checkbox row: `☑ Troponin (Labs)` — category shown in muted text
- [x] "Accept All" button: sets all recommended test IDs as selected
- [x] "Edit" button: calls `onOpenOrderSelector()` callback
- [x] Loading state: show spinner/skeleton while test library loads
- [x] Empty state: "No recommended tests identified" when matching returns empty
- [x] On checkbox toggle, call `onSelectionChange()` with updated test ID array

### 4. Create `OrderSelector` Component (AC: #4, #5, #6)

- [x] Create `frontend/src/components/build-mode/shared/OrderSelector.tsx`
- [x] Create `frontend/src/components/build-mode/shared/OrderSelector.css`
- [x] Props: `{ tests: TestDefinition[], selectedTests: string[], recommendedTestIds: string[], onSelectionChange: (testIds: string[]) => void, onBack: () => void }`
- [x] Render categorized test list with collapsible category headers: "Labs", "Imaging", "Procedures / POC"
- [x] Each test row: checkbox + test name + subcategory tag in muted text
- [x] Recommended tests marked with a small "AI" badge or dot to distinguish from manual selections
- [x] "Select All" / "Clear All" per category
- [x] "Back to Dashboard" button at top that calls `onBack()`
- [x] Selected count shown at bottom with category breakdown (e.g., "6 total: 3 Labs, 2 Imaging, 1 Procedure")
- [x] Mobile: full-width stacked list. Desktop: same (no multi-column needed — list is long)

### 5. Integrate WorkupCard into DashboardOutput (AC: #1, #7)

- [x] In `DashboardOutput.tsx`, replace the `<StubCard title="Recommended Workup" .../>` with `<WorkupCard>` component
- [x] Add state management for order selector visibility: `const [showOrderSelector, setShowOrderSelector] = useState(false)`
- [x] When `showOrderSelector === true`, render `<OrderSelector>` in place of the full dashboard (or as a panel overlay)
- [x] Pass `selectedTests` and `onSelectionChange` through from `DashboardOutput` props
- [x] Add new props to `DashboardOutputProps`: `selectedTests: string[]`, `onSelectedTestsChange: (testIds: string[]) => void`
- [x] Extract differential from `llmResponse` using existing `getDifferential()` helper (already in DashboardOutput)

### 6. Wire State in EncounterEditor (AC: #7)

- [x] In `EncounterEditor.tsx`, add local state: `const [selectedTests, setSelectedTests] = useState<string[]>(encounter?.section2?.selectedTests ?? [])`
- [x] Pass `selectedTests` and `setSelectedTests` as props to `DashboardOutput`
- [x] Persist selections to Firestore when they change: `updateDoc(encounterRef, { 'section2.selectedTests': selectedTests })`
- [x] Use a debounced write (300ms) or write on navigation/unmount to avoid excessive Firestore writes on rapid checkbox toggling
- [x] Initialize from existing `encounter.section2.selectedTests` when encounter loads (backward compat: defaults to `[]`)

### 7. Testing (AC: #8)

- [x] Create `frontend/src/__tests__/WorkupCard.test.tsx`
  - Renders recommended tests as checked checkboxes
  - "Accept All" checks all recommended tests
  - Individual checkbox toggle updates selection
  - Shows loading state while test library fetches
  - Shows empty state when no tests match
  - Selected count displays correctly
- [x] Create `frontend/src/__tests__/OrderSelector.test.tsx`
  - Renders tests grouped by category
  - Category "Select All" / "Clear All" works
  - "Back" button calls onBack callback
  - Recommended tests show AI badge
- [x] Update `frontend/src/__tests__/DashboardOutput.test.tsx`
  - WorkupCard renders instead of stub card when props provided
  - Order selector toggles visibility
- [x] Run `cd frontend && pnpm check` — must pass

---

## Dev Notes

### Previous Story Intelligence (BM-2.1)

BM-2.1 created the `DashboardOutput` component with the 4-area S1 dashboard. Key patterns established:
- **Responsive layout**: `useIsMobile()` toggles `dashboard-output--mobile` / `dashboard-output--desktop` classes
- **CSS variables**: `var(--color-surface, #f8fafc)`, `var(--color-border, #e2e8f0)`, `var(--color-text, #1e293b)`, `var(--color-text-secondary, #64748b)`
- **BEM naming**: `.dashboard-output__*` for all child elements
- **StubCard pattern**: `<StubCard title="..." description="..." />` — this is what we're replacing for the Workup area
- **Data shape handling**: `getDifferential()` helper handles both flat `DifferentialItem[]` and wrapped `{ differential, processedAt }` shapes
- **"Accept Workup & Continue" button**: Already exists in DashboardOutput, scrolls to `#section-panel-2`
- **Test patterns**: vi.mock for hooks, vi.hoisted for controllable mocks, `render`/`screen`/`fireEvent` from @testing-library/react

**QA feedback from BM-2.1:**
- `&amp;` in JSX is unnecessary — use `&` directly
- Empty CSS rules add no value — remove them
- `getDifferential()` could be extracted to a shared utility (low priority)

### AI-Recommended Tests: Where They Come From

The S1 LLM response includes `DifferentialItem[]` where each item has `reasoning` text that mentions specific tests (e.g., "Recommend ECG, serial troponins, CBC"). There is **NO structured `recommendedTests` field** in the S1 response schema.

**Matching approach for BM-2.2:**
1. Fetch the full test library (already seeded: ~20-30 test definitions with `name`, `commonIndications`, `feedsCdrs`)
2. For each test in the library, check if:
   - Test `name` appears in any differential item's `reasoning` (case-insensitive)
   - Any of the test's `commonIndications` appear in any differential `diagnosis` (case-insensitive substring)
3. Return matching test IDs as "AI-recommended"
4. False positives are acceptable — physician reviews and adjusts before proceeding

### Test Library Endpoint

- **Endpoint**: `GET /v1/libraries/tests`
- **Auth**: Bearer token (Firebase ID token)
- **Response**: `{ ok: true, tests: TestDefinition[], categories: TestCategory[], cachedAt: string }`
- **Backend cache**: 5-minute TTL (in-memory)
- **Source**: Firestore `testLibrary` collection (seeded in BM-1.1)

### TestDefinition Shape (from `frontend/src/types/libraries.ts`)

```typescript
interface TestDefinition {
  id: string                    // e.g., "troponin", "ecg"
  name: string                  // e.g., "Troponin", "ECG"
  category: TestCategory        // 'labs' | 'imaging' | 'procedures_poc'
  subcategory: string           // e.g., "cardiac", "hepatic"
  commonIndications: string[]   // e.g., ["chest pain", "mi risk"]
  unit: string | null
  normalRange: string | null
  quickFindings: string[] | null
  feedsCdrs: string[]           // CDR IDs this test impacts
}
```

### Auth Token Pattern

Use `useAuthToken()` from `frontend/src/lib/firebase.tsx:54`:
```typescript
import { useAuthToken } from '../lib/firebase'
const token = useAuthToken()
// token is string | null — null while auth state resolves
```

See `useQuickEncounter.ts:103` and `useTrendAnalysis.ts:20` for existing usage examples.

### Encounter Schema: selectedTests Already Typed

`Section2Data` in `frontend/src/types/encounter.ts:241-269` already includes:
- `selectedTests?: string[]` — array of test IDs
- `testResults?: Record<string, TestResult>` — results keyed by test ID

The `useEncounter` hook already defaults these: `selectedTests ?? []`, `testResults ?? {}`.

**No type changes needed** — the schema already supports this feature from BM-1.3.

### Firestore Write Pattern

From `useEncounter.ts`, Firestore writes use dot-notation for nested fields:
```typescript
await updateDoc(encounterRef, {
  'section2.selectedTests': selectedTests,
})
```

Use the existing `db` and encounter reference pattern. Consider debouncing writes (300ms) to avoid excessive writes during rapid checkbox toggling.

### DashboardOutput Integration Point

Current stub in `DashboardOutput.tsx:117-125`:
```tsx
<StubCard
  title="Recommended Workup"
  description="Order selection available — BM-2.2"
/>
```

Replace this with `<WorkupCard>`. The `DashboardOutput` component will need new props to manage selection state (lifted to `EncounterEditor`).

The `DashboardOutputProps` interface currently:
```typescript
interface DashboardOutputProps {
  llmResponse: unknown
  trendAnalysis: TrendAnalysisResult | null
  trendLoading?: boolean
}
```

Extend with: `selectedTests: string[]`, `onSelectedTestsChange: (testIds: string[]) => void`.

### OrderSelector View Strategy

The OrderSelector should render **in place of** the DashboardOutput (not as a modal or overlay) to keep the UX simple:
- When user taps "Edit" on WorkupCard → `showOrderSelector = true` → render OrderSelector full-width
- When user taps "Back" in OrderSelector → `showOrderSelector = false` → render DashboardOutput

This avoids modal complexity and keeps the flow linear. State lives in `DashboardOutput` (or lifted to `EncounterEditor` if needed).

### CSS Patterns to Follow

- **Card base**: Extend `.dashboard-output__stub-card` styles or create `.workup-card` with same `background`, `border`, `border-radius`, `padding`
- **Checkbox rows**: Use native `<input type="checkbox">` with `<label>` for accessibility
- **Category headers**: Use `<h5>` with muted text color and optional collapse chevron
- **Badge**: Small `<span>` with contrasting background for "AI" marker and count
- **BEM naming**: `.workup-card__*` for WorkupCard, `.order-selector__*` for OrderSelector

### No PHI

This story is purely frontend UI. The test library is a clinical vocabulary catalog (test names, categories, reference ranges), not patient data. Selected tests are clinical terminology, not PHI.

### What NOT to Build

- **Do NOT modify the S1 prompt builder** — recommended tests are derived client-side from differential + library
- **Do NOT modify backend schemas** — `Section2RequestSchema` already accepts `selectedTests` (it's the S2 submission that sends them; that wiring is BM-4.1+)
- **Do NOT build result entry** — BM-2.2 is only about test SELECTION, not result entry (that's BM-4.1)
- **Do NOT build order set save/load** — that's BM-7.1
- **Do NOT modify the "Accept Workup & Continue" button** — it already exists in DashboardOutput and scrolls to S2

### Project Structure Notes

All new files follow the established `build-mode/shared/` directory convention:

| File | Path | Action |
|------|------|--------|
| useTestLibrary hook | `frontend/src/hooks/useTestLibrary.ts` | Create |
| WorkupCard component | `frontend/src/components/build-mode/shared/WorkupCard.tsx` | Create |
| WorkupCard styles | `frontend/src/components/build-mode/shared/WorkupCard.css` | Create |
| OrderSelector component | `frontend/src/components/build-mode/shared/OrderSelector.tsx` | Create |
| OrderSelector styles | `frontend/src/components/build-mode/shared/OrderSelector.css` | Create |
| DashboardOutput | `frontend/src/components/build-mode/shared/DashboardOutput.tsx` | Modify (replace stub) |
| DashboardOutput CSS | `frontend/src/components/build-mode/shared/DashboardOutput.css` | Modify (remove stub-card styles if unused) |
| EncounterEditor | `frontend/src/components/build-mode/EncounterEditor.tsx` | Modify (add selectedTests state + props) |
| WorkupCard tests | `frontend/src/__tests__/WorkupCard.test.tsx` | Create |
| OrderSelector tests | `frontend/src/__tests__/OrderSelector.test.tsx` | Create |
| DashboardOutput tests | `frontend/src/__tests__/DashboardOutput.test.tsx` | Update |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-s1-dashboard.md — Story 2.2 spec]
- [Source: _bmad-output/implementation-artifacts/2-1-dashboard-output-layout.md — Previous story patterns and QA]
- [Source: frontend/src/types/encounter.ts:241-269 — Section2Data with selectedTests]
- [Source: frontend/src/types/libraries.ts — TestDefinition, TestCategory, TestLibraryResponse]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.tsx:117-125 — Stub card to replace]
- [Source: frontend/src/hooks/useEncounter.ts:109-116 — Firestore defaults for section2]
- [Source: frontend/src/lib/firebase.tsx:54-65 — useAuthToken() hook]
- [Source: backend/src/index.ts:182-225 — GET /v1/libraries/tests endpoint]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- DashboardOutput test fix: `vi.restoreAllMocks()` was clearing the `useTestLibrary` mock for subsequent tests. Fixed by using `spy.mockRestore()` on the specific `document.getElementById` spy only.
- OrderSelector test fix: "Back to Dashboard" button text includes `←` Unicode arrow — test updated to match full text.

### Completion Notes List

- **Task 1**: Created `useTestLibrary` hook with `fetchTestLibrary` API function in `api.ts`. Hook uses `useAuthToken()`, fetches on token availability, caches in React state, and uses `fetchedRef` to prevent duplicate requests.
- **Task 2**: Created pure `getRecommendedTestIds()` function as a standalone utility in `build-mode/shared/`. Two-strategy matching: (1) test name in reasoning text, (2) commonIndications overlap with diagnosis names. Both case-insensitive. Deduplicated via `Set`.
- **Task 3**: Built `WorkupCard` component with checkbox rows for recommended tests, count badge, "Accept All" and "Edit" buttons, loading and empty states. Uses BEM CSS with project CSS variables.
- **Task 4**: Built `OrderSelector` component with categorized test list (Labs, Imaging, Procedures/POC), per-category Select All/Clear All, AI badge on recommended tests, summary footer with category breakdown, and Back button.
- **Task 5**: Integrated WorkupCard into DashboardOutput replacing the "Recommended Workup" stub card. Added view switch — when user clicks "Edit", OrderSelector renders in place of the dashboard. New optional props `selectedTests` and `onSelectedTestsChange` maintain backward compatibility (stub card shown when props absent).
- **Task 6**: Wired `selectedTests` state in EncounterEditor with initialization from `encounter.section2.selectedTests`, debounced Firestore write (300ms via `setTimeout`), and cleanup on unmount.
- **Task 7**: Created 58 total tests across 8 test files. New test files: `useTestLibrary.test.tsx` (5 tests), `getRecommendedTestIds.test.ts` (7 tests), `WorkupCard.test.tsx` (9 tests), `OrderSelector.test.tsx` (7 tests). Updated `DashboardOutput.test.tsx` (15 tests, +4 new). Full `pnpm check` (typecheck + lint + test) passes.

### File List

**Created:**
- `frontend/src/hooks/useTestLibrary.ts`
- `frontend/src/components/build-mode/shared/getRecommendedTestIds.ts`
- `frontend/src/components/build-mode/shared/WorkupCard.tsx`
- `frontend/src/components/build-mode/shared/WorkupCard.css`
- `frontend/src/components/build-mode/shared/OrderSelector.tsx`
- `frontend/src/components/build-mode/shared/OrderSelector.css`
- `frontend/src/__tests__/useTestLibrary.test.tsx`
- `frontend/src/__tests__/getRecommendedTestIds.test.ts`
- `frontend/src/__tests__/WorkupCard.test.tsx`
- `frontend/src/__tests__/OrderSelector.test.tsx`

**Modified:**
- `frontend/src/lib/api.ts` (added `fetchTestLibrary` function)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (replaced Workup stub with WorkupCard, added OrderSelector view switch)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (added selectedTests state, Firestore persistence, props to DashboardOutput)
- `frontend/src/__tests__/DashboardOutput.test.tsx` (added WorkupCard/OrderSelector integration tests, added useTestLibrary mock)

### Change Log

- 2026-02-23: Implemented BM-2.2 — Workup Card with Order Selection. Created useTestLibrary hook, AI-recommended test matching logic, WorkupCard and OrderSelector components, integrated into DashboardOutput, wired Firestore persistence in EncounterEditor. 58 tests pass, pnpm check passes.
- 2026-02-23: QA Review (Pass 1) — Fixed 3 issues: duplicate useTestLibrary hook (architecture), lost Firestore write on unmount (bug), inline style breaking BEM (style). Tests updated. 58 tests pass.
- 2026-02-23: BMM Adversarial Review (Pass 2) — Fixed 2 additional MEDIUM issues: (1) Added collapsible category headers to OrderSelector (task 4 overclaim), (2) Added auto-populate of recommended tests as pre-checked on fresh encounters (AC#1 compliance). 4 LOW issues documented but not fixed (codebase-wide patterns). 62 tests pass.

---

## QA Results

### Review Date: 2026-02-23

### Reviewed By: Quinn (Senior Developer QA) — 2 review passes

### Code Quality Assessment

Solid implementation overall. Clean component architecture, appropriate use of hooks and memoization, consistent BEM styling, and comprehensive test coverage. The developer followed established patterns from BM-2.1 well. Two review passes performed: Pass 1 found and fixed 3 issues (duplicate API call, unmount data loss, style inconsistency). Pass 2 (adversarial) found and fixed 2 additional issues (missing collapsible headers, missing pre-checked behavior).

### Refactoring Performed

**Pass 1 (QA Review):**

- **File**: `frontend/src/components/build-mode/shared/WorkupCard.tsx`
  - **Change**: Removed internal `useTestLibrary()` hook call and `getRecommendedTestIds()` computation. Changed props from `{ differential }` to `{ tests, recommendedTestIds, loading }`.
  - **Why**: Both `DashboardOutput` and `WorkupCard` independently called `useTestLibrary()`, causing two parallel API requests to `/v1/libraries/tests` on every render.
  - **How**: DashboardOutput is now the single owner of test library data, passing it down.

- **File**: `frontend/src/components/build-mode/shared/WorkupCard.tsx` + `WorkupCard.css`
  - **Change**: Replaced inline `style={{ display: 'flex', alignItems: 'center' }}` with BEM class `.workup-card__title-group`.
  - **Why**: Inline styles break the BEM convention used consistently across the codebase.

- **File**: `frontend/src/components/build-mode/EncounterEditor.tsx`
  - **Change**: Added `pendingTestsRef` to track unflushed Firestore writes. On unmount, flush immediately instead of dropping.
  - **Why**: Original code cleared the debounce timer on unmount but never flushed the pending write, silently losing the last selection change.

**Pass 2 (BMM Adversarial Review):**

- **File**: `frontend/src/components/build-mode/shared/OrderSelector.tsx` + `OrderSelector.css`
  - **Change**: Added collapsible category headers with chevron toggle, `openCategories` state (default: all open), and CSS transition for chevron rotation. Fixed nested `<button>` HTML validation issue.
  - **Why**: Task 4 subtask claimed "collapsible category headers" but implementation had static, non-collapsible headers.

- **File**: `frontend/src/components/build-mode/shared/DashboardOutput.tsx`
  - **Change**: Added `autoPopulatedRef` and `useEffect` that auto-populates `selectedTests` with `recommendedTestIds` on fresh encounters (selectedTests empty + recommended available).
  - **Why**: AC#1 says "pre-checked checkboxes" but implementation started all recommended tests unchecked.

- **File**: `frontend/src/__tests__/OrderSelector.test.tsx`
  - **Change**: Added 2 tests: collapsible category hides tests, collapsed category can be re-expanded.

- **File**: `frontend/src/__tests__/DashboardOutput.test.tsx`
  - **Change**: Added 2 tests: auto-populates recommended on fresh encounter, does not auto-populate when selections exist.

### Compliance Check

- Coding Standards: ✓ BEM CSS, CSS variables with fallbacks, consistent component patterns
- Project Structure: ✓ All files in correct locations per `build-mode/shared/` convention
- Testing Strategy: ✓ 62 tests across 8 files, covering unit + integration + collapsible + auto-populate
- All ACs Met: ✓ All 8 acceptance criteria verified (including AC#1 pre-checked now implemented)

### Improvements Checklist

- [x] Eliminated duplicate `useTestLibrary` API call (Pass 1)
- [x] Fixed lost Firestore write on unmount (Pass 1)
- [x] Replaced inline style with BEM class (Pass 1)
- [x] Added collapsible category headers to OrderSelector (Pass 2)
- [x] Added auto-populate of recommended tests as pre-checked (Pass 2)
- [x] Fixed nested `<button>` HTML validation issue (Pass 2)
- [x] Added 4 new tests for collapsible + auto-populate behavior (Pass 2)
- [x] Verified `pnpm check` passes (typecheck + lint + 62 tests)

### Unresolved LOW Issues (documented, not fixed)

- `fetchTestLibrary` sends `Content-Type: application/json` on GET request (codebase-wide pattern, not BM-2.2 specific)
- `DashboardOutput` unconditionally calls `useTestLibrary()` even in stub-card path (React hooks rules constraint)
- `useTestLibrary` hook blocks re-fetch after token refresh (acceptable for static clinical vocabulary data)
- OrderSelector test relies on DOM ordering for category identification (acceptable given stable category order)

### Security Review

No concerns. This story is purely frontend UI operating on clinical vocabulary (test names, categories), not PHI. No user input is rendered via raw HTML injection. Auth tokens are properly passed via `useAuthToken()`. Firestore writes use dot-notation for nested field updates (safe).

### Performance Considerations

The duplicate API call was the main performance concern — fixed by consolidating `useTestLibrary` to a single call in DashboardOutput. The `getRecommendedTestIds` function is O(n*m) where n=tests and m=differential items, which is fine for the expected library size (~30 tests).

### Final Status

✓ Approved - Ready for Done
