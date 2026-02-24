# Story 2.3: CDR Summary Card

Status: done

| Field          | Value                                          |
|----------------|-------------------------------------------------|
| Story ID       | BM-2.3                                          |
| Points         | 3                                               |
| Dependencies   | BM-1.2 (CDR Library), BM-2.1 (Dashboard Layout) |
| Epic           | Phase 2: S1 Dashboard                           |
| Priority       | High (enables CDR visibility on dashboard)       |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** the CDR card on the S1 dashboard to show which Clinical Decision Rules are identified for this encounter, with indicators showing whether each CDR can be completed now or needs lab/imaging results,
**so that** I can see at a glance which risk stratification tools apply before proceeding to Section 2.

---

## Acceptance Criteria

1. CDR card replaces the stub card on the S1 dashboard and shows CDRs identified from the differential
2. Each CDR shows its name plus a color-coded completion indicator symbol (completable now / needs results)
3. A compact legend explains the indicator meanings
4. "View CDRs" button is present (non-functional until BM-3.2 wires navigation)
5. Graceful fallback: "No CDRs identified" message when no CDRs match the differential
6. Card handles loading state while CDR library fetches
7. `pnpm check` passes

---

## Tasks / Subtasks

### 1. Create `fetchCdrLibrary` API Function + `useCdrLibrary` Hook (AC: #6)

- [x] Add `CdrLibraryResponse` type to `frontend/src/types/libraries.ts` (mirror `TestLibraryResponse` at lines 37-42):
  ```typescript
  export interface CdrLibraryResponse { ok: true; cdrs: CdrDefinition[] }
  ```
- [x] Add `fetchCdrLibrary(userIdToken: string): Promise<CdrLibraryResponse>` to `frontend/src/lib/api.ts`
  - Mirror `fetchTestLibrary` pattern exactly: `GET /v1/libraries/cdrs`, Bearer token auth
- [x] Create `frontend/src/hooks/useCdrLibrary.ts`
  - Mirror `useTestLibrary` hook pattern: `useAuthToken()`, `fetchedRef`, cancellation guard
  - Define return interface:
    ```typescript
    interface UseCdrLibraryResult { cdrs: CdrDefinition[]; loading: boolean; error: string | null }
    ```
  - Return `UseCdrLibraryResult`

### 2. Create `getIdentifiedCdrs` Matching Logic (AC: #1, #2)

- [x] Create `frontend/src/components/build-mode/shared/getIdentifiedCdrs.ts`
- [x] Pure function: `getIdentifiedCdrs(differential: DifferentialItem[], cdrLibrary: CdrDefinition[]): IdentifiedCdr[]`
- [x] Matching strategy (two passes):
  1. For each `DifferentialItem` with a `cdrContext` string, check if any CDR library entry's `name` or `fullName` appears (case-insensitive substring) in the `cdrContext` text
  2. For each CDR in the library, check if any of its `applicableChiefComplaints` appear (case-insensitive substring) in any differential `diagnosis` name
- [x] For each matched CDR, compute `readiness` indicator:
  - `'completable'` — ALL components have `source: 'section1'` or `source: 'user_input'` (can be answered now without lab results)
  - `'needs_results'` — at least one component has `source: 'section2'` (requires lab/imaging data from S2)
- [x] Return type: `IdentifiedCdr = { cdr: CdrDefinition, readiness: 'completable' | 'needs_results' }`
- [x] Deduplicate by CDR `id`

### 3. Create `CdrCard` Component (AC: #1, #2, #3, #4, #5, #6)

- [x] Create `frontend/src/components/build-mode/shared/CdrCard.tsx`
- [x] Create `frontend/src/components/build-mode/shared/CdrCard.css`
- [x] Props: `{ identifiedCdrs: IdentifiedCdr[], loading: boolean, onViewCdrs?: () => void }`
- [x] Render header: "Clinical Decision Rules" with count badge (e.g., "3 identified")
- [x] Render each CDR as a row: colored indicator dot + CDR name + readiness label
  - Completable now: green dot + "(completable)" in muted text
  - Needs results: amber dot + "(needs results)" in muted text
- [x] Compact legend below the list: `● completable now  ● needs results`
- [x] "View CDRs" button at bottom — calls `onViewCdrs()` if provided, otherwise shows "Available in next update" tooltip/text
- [x] Loading state: skeleton/spinner while CDR library loads
- [x] Empty state: "No CDRs identified for this differential" when `identifiedCdrs` is empty
- [x] BEM naming: `.cdr-card__*`

### 4. Integrate CdrCard into DashboardOutput (AC: #1)

- [x] In `DashboardOutput.tsx`:
  - Add `import { useCdrLibrary } from '../../../hooks/useCdrLibrary'`
  - Add `import { getIdentifiedCdrs } from './getIdentifiedCdrs'`
  - Add `import CdrCard from './CdrCard'`
  - Call `useCdrLibrary()` inside the component (single owner pattern, same as `useTestLibrary`)
  - Compute `identifiedCdrs` with `useMemo(() => getIdentifiedCdrs(differential, cdrs), [differential, cdrs])`
  - Replace CDR `<StubCard>` with `<CdrCard identifiedCdrs={identifiedCdrs} loading={cdrsLoading} />`
- [x] Keep the CDR card in the same grid position (left side of `dashboard-output__middle-row`, before WorkupCard)
- [x] No new props needed on `DashboardOutputProps` — CDR data is fully self-contained via hooks

### 5. Testing (AC: #7)

- [x] Create `frontend/src/__tests__/useCdrLibrary.test.tsx`
  - Fetches CDR library on token availability
  - Returns empty state while loading
  - Handles fetch error gracefully
  - Does not re-fetch after successful load (fetchedRef guard)
- [x] Create `frontend/src/__tests__/getIdentifiedCdrs.test.ts`
  - Matches CDRs from `cdrContext` strings (name match)
  - Matches CDRs from `applicableChiefComplaints` against diagnoses
  - Returns empty array when no CDRs match
  - Deduplicates CDRs matched by both strategies
  - Correctly computes `completable` vs `needs_results` readiness
  - Handles empty differential or empty CDR library
- [x] Create `frontend/src/__tests__/CdrCard.test.tsx`
  - Renders identified CDRs with name and indicator
  - Shows count badge in header
  - Shows legend
  - Shows loading state
  - Shows empty state when no CDRs identified
  - "View CDRs" button is present
- [x] Update `frontend/src/__tests__/DashboardOutput.test.tsx` (currently 19 tests)
  - Replace the existing "shows CDR stub card" test (~line 143) with CdrCard integration assertions
  - Add `vi.hoisted` mock for `useCdrLibrary` (same pattern as existing `useTestLibrary` mock)
  - CdrCard renders instead of stub card
  - Verify identified CDRs display when mock returns data
- [x] Run `cd frontend && pnpm check` — must pass

---

## Dev Notes

### Previous Story Intelligence (BM-2.2)

BM-2.2 established the pattern for replacing DashboardOutput stub cards. Key learnings:

- **Single hook owner**: `DashboardOutput` is the single owner of library data (useTestLibrary). BM-2.1 QA caught a duplicate hook call when WorkupCard also called useTestLibrary. **For BM-2.3: call `useCdrLibrary()` in DashboardOutput only, pass data down to CdrCard.**
- **Matching logic as pure function**: `getRecommendedTestIds.ts` is a standalone pure function file in `build-mode/shared/`. Follow this pattern for `getIdentifiedCdrs.ts`.
- **Auto-populate pattern**: BM-2.2 added `autoPopulatedRef` + `useEffect` to pre-check recommended tests on fresh encounters. CdrCard does NOT need this — CDRs are read-only indicators on the S1 dashboard.
- **Collapsible headers**: OrderSelector needed collapsible category headers (missed in initial implementation, caught in adversarial review). CdrCard doesn't need collapsible rows — the CDR list is short (typically 1-3 items).
- **Props pattern for stub replacement**: WorkupCard added optional props (`selectedTests`, `onSelectedTestsChange`) to DashboardOutput. CdrCard does NOT need new DashboardOutput props — it's self-contained via `useCdrLibrary` hook.
- **BEM + CSS variables**: Use `.cdr-card__*` naming, same card background/border pattern as `.dashboard-output__stub-card`.
- **Test mock pattern**: `vi.hoisted` for controllable mocks, mock `useCdrLibrary` the same way `useTestLibrary` is mocked.
- **Unmount flush bug**: BM-2.2 had a bug where debounced Firestore writes were lost on unmount. CdrCard has no writes, so this isn't a concern.

### CDR Data Flow — Where CDR Identification Comes From

At S1 completion (when the dashboard renders), there is no server-side CDR matching yet (that's BM-3.1). CDR identification is done **client-side** by matching:

1. **`DifferentialItem.cdrContext`** — Optional string field on each S1 differential item. The LLM may write e.g., `"HEART score applicable for ACS risk stratification"` or `"Consider Wells PE criteria"`. Not all items have this field.
2. **`CdrDefinition.applicableChiefComplaints`** — Array of chief complaints on each CDR library entry (e.g., `["chest pain", "acute coronary syndrome"]`).

**Matching approach**: Cross-reference `cdrContext` text and diagnosis names against CDR library entries. This is intentionally simple — the BM-3.1 server-side matching will be more sophisticated using Gemini.

### CDR Readiness Indicators

Each `CdrDefinition.components[]` has a `source` field indicating where the data comes from:
- `'section1'` — answerable from S1 narrative (age, history, risk factors)
- `'section2'` — requires lab/imaging results from S2
- `'user_input'` — requires physician to manually select (e.g., risk factor checkboxes)

**Readiness logic** for each identified CDR:
- **Completable now** (green) — All components have `source: 'section1'` or `source: 'user_input'`
- **Needs results** (amber) — At least one component has `source: 'section2'`

This readiness is a static assessment based on the CDR definition, not the actual encounter state. When BM-3.1 populates `cdrTracking`, the CdrCard can optionally show richer "partial" status — but for BM-2.3 the definition-based readiness is sufficient.

### CDR Library Endpoint

- **Endpoint**: `GET /v1/libraries/cdrs`
- **Auth**: Bearer token (Firebase ID token)
- **Response**: `{ ok: true, cdrs: CdrDefinition[] }`
- **Backend cache**: 5-minute TTL (in-memory), same pattern as test library
- **Source**: Firestore `cdrLibrary` collection (seeded in BM-1.2)

### CdrDefinition Shape (from `frontend/src/types/libraries.ts:86-95`)

```typescript
interface CdrDefinition {
  id: string                           // e.g., "heart", "wells_pe"
  name: string                         // e.g., "HEART Score"
  fullName: string                     // e.g., "HEART Score for Major Cardiac Events"
  applicableChiefComplaints: string[]  // e.g., ["chest pain", "acute coronary syndrome"]
  components: CdrComponent[]           // scoring components with source field
  scoring: CdrScoring                  // scoring method and risk ranges
  suggestedTreatments?: Record<string, string[]>
}
```

### CdrComponent.source Values (from `frontend/src/types/libraries.ts:58-70`)

```typescript
interface CdrComponent {
  id: string
  label: string
  type: CdrComponentType                // 'select' | 'boolean' | 'number_range' | 'algorithm'
  source: CdrComponentSource            // 'section1' | 'section2' | 'user_input' ← KEY FIELD
  autoPopulateFrom?: string             // field name for auto-population
  // ... other fields
}
```

### DifferentialItem CDR Fields (from `frontend/src/types/encounter.ts:98-109`)

```typescript
interface DifferentialItem {
  diagnosis: string
  urgency: 'emergent' | 'urgent' | 'routine'
  reasoning: string
  regionalContext?: string
  cdrContext?: string  // ← e.g., "HEART score applicable for ACS risk stratification"
}
```

### Auth Token Pattern

Same as BM-2.2: `useAuthToken()` from `frontend/src/lib/firebase.tsx:54`:
```typescript
import { useAuthToken } from '../lib/firebase'
const token = useAuthToken()
```

### CSS Indicator Colors

| Indicator | Dot Color | Text |
|-----------|-----------|------|
| Completable now | `#16a34a` (green — same as `routine` urgency) | "(completable)" in muted text |
| Needs results | `#d97706` (amber — same as `urgent` urgency) | "(needs results)" in muted text |

These colors are already established in the codebase for urgency indicators (see `project-context.md` Section 3).

### What NOT to Build

- **Do NOT create CDR matching endpoint** — that's BM-3.1
- **Do NOT write to `encounter.cdrTracking`** — CdrCard is read-only, BM-3.1 populates tracking
- **Do NOT build CDR detail views** — that's BM-3.2 (CdrSwipeView/CdrDetailPanel)
- **Do NOT build CDR component input UI** — that's BM-3.2 (CdrComponentInput)
- **Do NOT add click handlers to individual CDR rows** — non-interactive until BM-3.2
- **Do NOT add CdrCard-specific props to DashboardOutputProps** — CDR data is self-contained in hooks within DashboardOutput

### Project Structure Notes

All new files follow the established `build-mode/shared/` directory convention:

| File | Path | Action |
|------|------|--------|
| fetchCdrLibrary function | `frontend/src/lib/api.ts` | Modify (add function) |
| useCdrLibrary hook | `frontend/src/hooks/useCdrLibrary.ts` | Create |
| getIdentifiedCdrs utility | `frontend/src/components/build-mode/shared/getIdentifiedCdrs.ts` | Create |
| CdrCard component | `frontend/src/components/build-mode/shared/CdrCard.tsx` | Create |
| CdrCard styles | `frontend/src/components/build-mode/shared/CdrCard.css` | Create |
| DashboardOutput | `frontend/src/components/build-mode/shared/DashboardOutput.tsx` | Modify (replace CDR stub) |
| useCdrLibrary tests | `frontend/src/__tests__/useCdrLibrary.test.tsx` | Create |
| getIdentifiedCdrs tests | `frontend/src/__tests__/getIdentifiedCdrs.test.ts` | Create |
| CdrCard tests | `frontend/src/__tests__/CdrCard.test.tsx` | Create |
| DashboardOutput tests | `frontend/src/__tests__/DashboardOutput.test.tsx` | Modify (add CdrCard mock) |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-2-s1-dashboard.md — Story 2.3 spec]
- [Source: _bmad-output/implementation-artifacts/2-2-workup-card-order-selection.md — Previous story patterns]
- [Source: _bmad-output/project-context.md — Styling, testing, data shape conventions]
- [Source: frontend/src/types/libraries.ts:44-95 — CdrDefinition, CdrComponent, CdrScoring types]
- [Source: frontend/src/types/encounter.ts:98-109 — DifferentialItem with cdrContext field]
- [Source: frontend/src/types/encounter.ts:178-204 — CdrTracking types (future use)]
- [Source: frontend/src/hooks/useTestLibrary.ts — Hook pattern to mirror for useCdrLibrary]
- [Source: frontend/src/lib/api.ts:736-751 — fetchTestLibrary pattern to mirror]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.tsx:165-168 — CDR stub card to replace]
- [Source: frontend/src/components/build-mode/shared/getRecommendedTestIds.ts — Matching logic pattern]
- [Source: backend/src/index.ts:243-292 — GET /v1/libraries/cdrs endpoint]
- [Source: _bmad-output/planning-artifacts/epics/epic-3-cdr-system.md — BM-3.1/3.2 forward dependencies]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- CdrCard legend test failed initially due to "needs results" text appearing both in CDR row readiness label and legend. Fixed by querying `.cdr-card__legend` container directly instead of `screen.getByText`.

### Completion Notes List

- Task 1: Added `CdrLibraryResponse` type, `fetchCdrLibrary` API function (mirrors `fetchTestLibrary` pattern), and `useCdrLibrary` hook (mirrors `useTestLibrary` with `fetchedRef` guard).
- Task 2: Created `getIdentifiedCdrs` pure function with two-pass matching: (1) cdrContext text against CDR name/fullName, (2) applicableChiefComplaints against diagnosis names. Computes readiness based on component `source` fields.
- Task 3: Created `CdrCard` component with BEM CSS. Renders CDR list with green/amber dots, count badge, legend, loading/empty states, and "View CDRs" button with fallback tooltip.
- Task 4: Integrated `CdrCard` into `DashboardOutput` — replaced CDR `StubCard`, added `useCdrLibrary()` hook call and `useMemo` for `identifiedCdrs`.
- Task 5: All 42 story-specific tests pass (4 + 9 + 9 + 20). Full suite: 87 tests pass.
- Code Review: Fixed stale docblock (M1), added disabled state to View CDRs button (M2), added error prop to CdrCard and wired from DashboardOutput (M3), added 4 new tests for callback/disabled/error (M4). Full suite: 91 tests pass.

### Change Log

- 2026-02-24: Implemented BM-2.3 CDR Summary Card — replaced stub card with live CDR matching and display
- 2026-02-24: Code review (adversarial) — fixed 4 issues: stale docblock, disabled button state, error state pass-through, added 4 tests

### File List

- `frontend/src/types/libraries.ts` — Modified (added `CdrLibraryResponse` interface)
- `frontend/src/lib/api.ts` — Modified (added `fetchCdrLibrary` function)
- `frontend/src/hooks/useCdrLibrary.ts` — Created (CDR library fetch hook)
- `frontend/src/components/build-mode/shared/getIdentifiedCdrs.ts` — Created (CDR matching logic)
- `frontend/src/components/build-mode/shared/CdrCard.tsx` — Created (CDR summary card component)
- `frontend/src/components/build-mode/shared/CdrCard.css` — Created (CDR card styles)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` — Modified (replaced CDR stub with CdrCard)
- `frontend/src/__tests__/useCdrLibrary.test.tsx` — Created (4 tests)
- `frontend/src/__tests__/getIdentifiedCdrs.test.ts` — Created (9 tests)
- `frontend/src/__tests__/CdrCard.test.tsx` — Created (9 tests)
- `frontend/src/__tests__/DashboardOutput.test.tsx` — Modified (added useCdrLibrary mock, replaced stub test with CdrCard integration tests)
