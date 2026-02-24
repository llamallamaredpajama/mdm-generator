# Story 4.1: Result Entry Component

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-4.1                                                  |
| Points         | 5                                                       |
| Dependencies   | BM-1.3 (Encounter Schema Extension), BM-2.2 (Workup Card Order Selection) |
| Epic           | Phase 4: S2 Results Redesign                             |
| Priority       | High (replaces S2 textarea with structured result entry) |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** structured result entry cards for each ordered test in Section 2, with unremarkable/abnormal status, CDR badges, and expandable abnormal detail entry,
**so that** I can rapidly document my workup results in a structured format that feeds CDR scoring and produces higher-quality MDM documentation.

---

## Acceptance Criteria

1. Each selected test from S1 workup appears as a `ResultEntry` card in Section 2
2. Each card shows unremarkable/abnormal radio buttons (NOT "normal/abnormal" — "unremarkable" is the clinical term)
3. Tests that feed active CDRs show a CDR badge with the CDR name (e.g., "HEART Score")
4. Abnormal selection expands the card to show quick-select findings checkboxes (from `TestDefinition.quickFindings`) and a free-text notes field
5. Selecting unremarkable/abnormal writes to `encounter.section2.testResults[testId]` in Firestore
6. The existing S2 `SectionPanel` textarea is replaced with the result entry list (textarea remains as a "free text" fallback at the bottom)
7. Tests with no results yet show a "pending" visual state
8. `cd frontend && pnpm check` passes (typecheck + lint + test)
9. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Create ResultEntry Component (AC: #1, #2, #3, #7)

- [x] Create `frontend/src/components/build-mode/shared/ResultEntry.tsx`
  - Props: `testDef: TestDefinition`, `result: TestResult | undefined`, `activeCdrNames: string[]`, `onResultChange: (testId: string, result: TestResult) => void`
  - Display test name, category badge, and CDR badge(s) if `testDef.feedsCdrs` overlaps with active (non-dismissed) CDRs
  - Radio buttons: "Unremarkable" / "Abnormal" (no default — starts pending)
  - Pending state: subdued/outlined card with no radio selected
  - Unremarkable state: green checkmark, compact card
  - Abnormal state: red indicator, expanded detail area
- [x] Create `frontend/src/components/build-mode/shared/ResultEntry.css`
  - BEM naming: `.result-entry`, `.result-entry__header`, `.result-entry__radio-group`, `.result-entry__cdr-badge`, etc.
  - Follow existing CSS variable patterns (`--color-surface`, `--color-border`, `--color-primary`, etc.)
  - Responsive: stack radio buttons vertically on narrow screens

### 2. Create ResultDetailExpanded Component (AC: #4)

- [x] Create `frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx`
  - Props: `testDef: TestDefinition`, `result: TestResult`, `onResultChange: (result: TestResult) => void`
  - Show quick-select checkboxes from `testDef.quickFindings` (if available)
  - Show free-text notes textarea for additional detail
  - Show value input field if test has `unit` (e.g., troponin value)
  - Changes call `onResultChange` with updated `TestResult`
- [x] Create `frontend/src/components/build-mode/shared/ResultDetailExpanded.css`
  - BEM naming: `.result-detail`, `.result-detail__findings`, `.result-detail__notes`, etc.

### 3. Wire ResultEntry List into EncounterEditor (AC: #1, #5, #6)

- [x] In `EncounterEditor.tsx`, replace the S2 `SectionPanel` with a new S2 content area:
  - Show the result entry list (one `ResultEntry` per selected test)
  - Keep SectionPanel header/footer (submission count, submit button, locked state) — restructure so textarea is optional
  - Add a "Free text notes" textarea at the bottom as fallback (writes to `section2.content`)
- [x] Create `handleTestResultChange(testId: string, result: TestResult)` function:
  - Optimistic local state update
  - Debounced Firestore write to `section2.testResults.{testId}` (same 300ms pattern as selectedTests)
- [x] Compute `activeCdrNames` from `encounter.cdrTracking` — map CDR IDs that aren't dismissed to their names
- [x] Pass `activeCdrNames` per test using `testDef.feedsCdrs` intersection with active CDR IDs

### 4. Testing (AC: #8, #9)

- [x] Create `frontend/src/__tests__/ResultEntry.test.tsx`:
  - Test: renders test name and category
  - Test: shows CDR badge when test feeds active CDR
  - Test: does not show CDR badge when no active CDRs matched
  - Test: clicking "Unremarkable" calls onResultChange with status 'unremarkable'
  - Test: clicking "Abnormal" expands detail area
  - Test: quick findings checkboxes shown for tests with quickFindings
  - Test: free-text notes field works in expanded view
  - Test: pending state renders correctly (no radio selected)
  - Test: value input shown for tests with unit
- [x] Run `cd frontend && pnpm check` — passes (137 tests)
- [x] Run `cd backend && pnpm build` — passes

---

## Dev Notes

### Previous Story Intelligence (BM-3.3)

BM-3.3 implemented S2 → CDR auto-population. Key learnings:
- **Direct Firestore writes from EncounterEditor**: The S2 auto-populate effect writes directly to Firestore (not through useCdrTracking). The same pattern applies for writing testResults.
- **onSnapshot propagation**: Changes written to Firestore propagate back via `useEncounter`'s onSnapshot listener. Local state only needs to be optimistic during the debounce window.
- **TestResult type**: Already defined in `types/encounter.ts` with `status: 'unremarkable' | 'abnormal' | 'pending'`, `quickFindings?: string[]`, `notes?: string | null`, `value?: string | null`, `unit?: string | null`.

### Component Architecture

```
EncounterEditor
  └─ Section 2 Content Area
       ├─ ResultEntry (per selected test)
       │    └─ ResultDetailExpanded (when abnormal)
       ├─ Free-text textarea (fallback, writes to section2.content)
       └─ Submit button + status (reuse from SectionPanel pattern)
```

### TestResult Data Flow

```
User taps "Abnormal" on troponin card
  → handleTestResultChange('troponin', { status: 'abnormal', ... })
  → Optimistic: local testResults state updates
  → Debounced: Firestore write to section2.testResults.troponin
  → onSnapshot: encounter updates, triggers S2→CDR auto-populate effect (BM-3.3)
  → CDR tracking updates if troponin feeds a CDR (e.g., HEART score)
```

### CDR Badge Logic

For each test, check if `testDef.feedsCdrs` array overlaps with keys in `encounter.cdrTracking` that are not dismissed:
```typescript
const activeCdrIds = Object.entries(encounter.cdrTracking)
  .filter(([, entry]) => !entry.dismissed)
  .map(([id]) => id)

const cdrNamesForTest = testDef.feedsCdrs
  .filter(id => activeCdrIds.includes(id))
  .map(id => encounter.cdrTracking[id].name)
```

### Quick Findings

`TestDefinition.quickFindings` is an array of common findings for rapid entry:
- Example for CBC: `["Elevated WBC", "Low Hgb", "Low Platelets", "Bandemia"]`
- Example for CT Head: `["No acute intracranial abnormality", "SDH", "SAH", "Fracture"]`
- Some tests have `null` quickFindings — those only show free-text notes

### S2 Layout Change

Currently S2 uses `SectionPanel` which renders a full textarea. For this story:
1. Keep the `SectionPanel` header (section number, title, expand/collapse, guide button)
2. Replace the textarea body with the `ResultEntry` list
3. Keep the footer (submission status, submit button)
4. Add a collapsed "Additional Notes" textarea at the bottom that writes to `section2.content`

The simplest approach: create a new `Section2ResultsPanel` component that reuses `SectionPanel`'s visual structure but renders result entry cards instead of a textarea. Or, modify `SectionPanel` to accept a `children` render prop for custom content. The latter is cleaner — add an optional `customContent` prop to `SectionPanel` that replaces the textarea when provided.

### What NOT to Build

- **Do NOT build "All Results Unremarkable" button** — that's Story 4.2
- **Do NOT build progress indicator** — that's Story 4.2
- **Do NOT build working diagnosis selector** — that's Story 4.3
- **Do NOT build "+ Add Test" button** — that's Story 4.2
- **Do NOT modify the backend** — all changes are frontend-only (testResults already accepted by process-section2 endpoint)
- **Do NOT modify CDR tracking logic** — BM-3.3 already handles S2 → CDR auto-population

### Project Structure Notes

| File | Path | Action |
|------|------|--------|
| ResultEntry component | `frontend/src/components/build-mode/shared/ResultEntry.tsx` | Create |
| ResultEntry styles | `frontend/src/components/build-mode/shared/ResultEntry.css` | Create |
| ResultDetailExpanded | `frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx` | Create |
| ResultDetailExpanded styles | `frontend/src/components/build-mode/shared/ResultDetailExpanded.css` | Create |
| EncounterEditor | `frontend/src/components/build-mode/EncounterEditor.tsx` | Modify (replace S2 textarea with result list) |
| SectionPanel | `frontend/src/components/build-mode/SectionPanel.tsx` | Modify (add customContent prop) |
| Tests | `frontend/src/__tests__/ResultEntry.test.tsx` | Create |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-s2-results.md -- Story 4.1 spec]
- [Source: frontend/src/types/encounter.ts -- TestResult, TestResultStatus types]
- [Source: frontend/src/types/libraries.ts -- TestDefinition with feedsCdrs, quickFindings]
- [Source: frontend/src/components/build-mode/EncounterEditor.tsx -- Current S2 SectionPanel rendering (L558-597)]
- [Source: frontend/src/components/build-mode/SectionPanel.tsx -- Textarea-based section panel]
- [Source: frontend/src/components/build-mode/shared/OrderSelector.tsx -- Test selection pattern reference]
- [Source: frontend/src/hooks/useCdrTracking.ts -- CDR tracking state management]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Frontend `pnpm check` passes — 137 tests (16 new ResultEntry tests), typecheck clean, lint clean.
- Backend `pnpm build` passes. No backend changes for this story (frontend-only).
- Architecture decision: Added `customContent`, `textareaPlaceholder`, `allowEmptySubmit` props to SectionPanel for S2 extensibility rather than creating a separate panel component.

### Completion Notes List

- Task 1: Created `ResultEntry.tsx` — per-test card with unremarkable/abnormal radio buttons, CDR badge(s), pending/unremarkable/abnormal visual states. Category badge (Lab/Imaging/Procedure). CDR warning text for pending tests that feed CDRs.
- Task 2: Created `ResultDetailExpanded.tsx` — expanded abnormal detail view with quick findings checkboxes, value input for quantitative tests, and free-text notes textarea.
- Task 3: Wired ResultEntry list into EncounterEditor. Added debounced Firestore testResults state management (same 300ms pattern as selectedTests). SectionPanel S2 now renders ResultEntry cards as customContent above a supplementary "Additional notes" textarea. Computes activeCdrNames per test from cdrTracking.
- Task 4: Added 16 tests covering rendering, CDR badges, status changes, expanded detail, quick findings, value input, notes, pending state, and CSS class modifiers.

### Change Log

- 2026-02-24: Implemented BM-4.1 Result Entry Component — structured result cards replace S2 textarea

### File List

- `frontend/src/components/build-mode/shared/ResultEntry.tsx` -- Created (per-test result entry card)
- `frontend/src/components/build-mode/shared/ResultEntry.css` -- Created (BEM styles with status modifiers)
- `frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx` -- Created (abnormal detail expanded view)
- `frontend/src/components/build-mode/shared/ResultDetailExpanded.css` -- Created (detail view styles)
- `frontend/src/components/build-mode/SectionPanel.tsx` -- Modified (added customContent, textareaPlaceholder, allowEmptySubmit props)
- `frontend/src/components/build-mode/SectionPanel.css` -- Modified (added custom-content-container, supplementary textarea styles)
- `frontend/src/components/build-mode/EncounterEditor.tsx` -- Modified (added testResults state, handleTestResultChange, ResultEntry list for S2)
- `frontend/src/__tests__/ResultEntry.test.tsx` -- Created (16 tests)
