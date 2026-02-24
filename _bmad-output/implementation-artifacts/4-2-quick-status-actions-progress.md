# Story 4.2: Quick Status Actions & Progress

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-4.2                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-4.1 (Result Entry Component)                         |
| Epic           | Phase 4: S2 Results Redesign                             |
| Priority       | High (completes one-tap result entry workflow)            |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** quick-action buttons to mark all results as unremarkable in one tap, a visual progress indicator showing how many tests are responded to, and the ability to add more tests,
**so that** I can rapidly move through normal workups while still highlighting the abnormal findings that matter for my MDM.

---

## Acceptance Criteria

1. "All Results Unremarkable" button at top of result entry list marks all tests unremarkable in one tap
2. "Mark remaining unremarkable" button at bottom marks only tests that are still pending
3. CDR-required values are still highlighted even after "All Unremarkable" (CDR warning persists if value needed)
4. Progress indicator shows visual dots + resulted count + abnormal count
5. "+ Add Test" button opens `OrderSelector`, new tests appear in result list
6. `cd frontend && pnpm check` passes (typecheck + lint + test)
7. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Create ProgressIndicator Component (AC: #4)

- [x] Create `frontend/src/components/build-mode/shared/ProgressIndicator.tsx`
  - Props: `total: number`, `responded: number`, `abnormalCount: number`
  - Renders: visual dot per test (green = unremarkable, red = abnormal, gray = pending) + text summary
  - Text: "{responded}/{total} resulted" + "{abnormalCount} abnormal" if any
- [x] Create `frontend/src/components/build-mode/shared/ProgressIndicator.css`
  - BEM naming: `.progress-indicator`, `.progress-indicator__dots`, `.progress-indicator__dot`, etc.

### 2. Add Quick Action Buttons (AC: #1, #2, #3)

- [x] In the S2 `customContent` area in `EncounterEditor.tsx`:
  - Add "All Results Unremarkable" button at top of the result entry list
  - Add "Mark remaining unremarkable" button at bottom
  - Both dispatch batch updates to testResults via `handleTestResultChange`-like logic (batch write, not per-test)
- [x] Create `handleMarkAllUnremarkable()`: sets all pending+abnormal tests to unremarkable, Firestore write
- [x] Create `handleMarkRemainingUnremarkable()`: sets only pending tests to unremarkable, Firestore write
- [x] After "All Unremarkable": CDR-fed tests should still show the CDR warning (because the CDR component value may still need a specific numeric value, not just "unremarkable")

### 3. Add "+ Add Test" Button (AC: #5)

- [x] Add "+ Add Test" button below the result entry list
- [x] Clicking opens `OrderSelector` overlay (same pattern as DashboardOutput's order selector toggle)
- [x] New tests appear in the result list immediately (via existing `handleSelectedTestsChange`)
- [x] Use a `showOrderSelector` state toggle in the customContent area

### 4. Wire ProgressIndicator (AC: #4)

- [x] Compute `responded`, `abnormalCount` from `testResults` + `selectedTests`
- [x] Render `ProgressIndicator` above the result entry list (below quick actions)

### 5. Testing (AC: #6, #7)

- [x] Create `frontend/src/__tests__/ProgressIndicator.test.tsx`:
  - Test: shows correct dot count matching total
  - Test: shows green dot for unremarkable, red for abnormal, gray for pending
  - Test: shows summary text "X/Y resulted"
  - Test: shows abnormal count when > 0
  - Test: shows no abnormal count when 0
- [x] Add tests to existing `ResultEntry.test.tsx` or create `QuickActions.test.tsx`:
  - Test: "All Unremarkable" button marks all tests unremarkable
  - Test: "Mark remaining" button marks only pending tests
- [x] Run `cd frontend && pnpm check` — passes (153 tests)
- [x] Run `cd backend && pnpm build` — passes

---

## Dev Notes

### Previous Story Intelligence (BM-4.1)

BM-4.1 created the ResultEntry cards and the testResults state management in EncounterEditor. Key patterns:
- **Test results state**: `testResults` local state with debounced Firestore writes via `handleTestResultChange`
- **SectionPanel customContent**: ResultEntry list rendered above the textarea
- **CDR badge computation**: Inline in render, trivial perf cost

### Batch Update Pattern

For "All Unremarkable" and "Mark remaining", we need to batch-update multiple test results at once rather than calling `handleTestResultChange` per test (which would create separate debounce timers). Create a new batch update function that:
1. Builds the full updated `testResults` map
2. Sets local state
3. Schedules a single Firestore write

```typescript
const handleBatchResultUpdate = useCallback(
  (updates: Record<string, TestResult>) => {
    setTestResults((prev) => {
      const merged = { ...prev, ...updates }
      pendingTestResultsRef.current = merged
      return merged
    })
    // Immediate Firestore write (no debounce for explicit user action)
    if (user && encounterId && pendingTestResultsRef.current) {
      const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
      updateDoc(encounterRef, { 'section2.testResults': pendingTestResultsRef.current }).catch(...)
    }
  },
  [user, encounterId]
)
```

### ProgressIndicator Design

```
[●●●○○○○] 3/7 resulted · 1 abnormal
```
- Green filled dots: unremarkable
- Red filled dots: abnormal
- Gray outlined dots: pending
- Summary text to the right of dots

### "+ Add Test" Pattern

Same pattern as `DashboardOutput.tsx` which has `showOrderSelector` state and conditionally renders OrderSelector. The result list and OrderSelector are mutually exclusive views within the customContent area.

### What NOT to Build

- **Do NOT build working diagnosis selector** — that's Story 4.3
- **Do NOT modify backend** — frontend-only changes
- **Do NOT add test result persistence logic** — already done in BM-4.1

### Project Structure Notes

| File | Path | Action |
|------|------|--------|
| ProgressIndicator | `frontend/src/components/build-mode/shared/ProgressIndicator.tsx` | Create |
| ProgressIndicator styles | `frontend/src/components/build-mode/shared/ProgressIndicator.css` | Create |
| EncounterEditor | `frontend/src/components/build-mode/EncounterEditor.tsx` | Modify (add quick actions, progress, add-test) |
| Tests | `frontend/src/__tests__/ProgressIndicator.test.tsx` | Create |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-s2-results.md -- Story 4.2 spec]
- [Source: frontend/src/components/build-mode/EncounterEditor.tsx -- S2 customContent with ResultEntry list]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.tsx -- OrderSelector toggle pattern]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Frontend `pnpm check` passes — 153 tests (10 ProgressIndicator + 6 QuickActions new), typecheck clean, lint clean.
- Backend `pnpm build` passes. No backend changes for this story (frontend-only).
- Architecture decision: Batch update uses `setTimeout(0)` for immediate write after state update (reads from `pendingTestResultsRef.current`) rather than debounced write. This ensures bulk operations hit Firestore in a single write.
- OrderSelector reuse: S2 "+ Add Test" renders the same `OrderSelector` component inline within `customContent`, toggled via `showS2OrderSelector` state. This mirrors the DashboardOutput pattern but scoped to Section 2.

### Completion Notes List

- Task 1: Created `ProgressIndicator.tsx` — visual dots (green/red/gray) + summary text ("X/Y resulted" + "N abnormal"). Props: total, responded, abnormalCount, statuses array for per-dot coloring.
- Task 2: Added three batch handlers to EncounterEditor: `handleBatchResultUpdate` (generic batch with immediate Firestore write), `handleMarkAllUnremarkable` (sets ALL tests to unremarkable, preserves value), `handleMarkRemainingUnremarkable` (sets only pending tests). Added "All Results Unremarkable" button at top and "Mark remaining unremarkable" button at bottom (conditionally shown when pending tests exist).
- Task 3: Added "+ Add Test" button below the result list. Toggles `showS2OrderSelector` state which swaps the customContent to render `OrderSelector` inline. Back button returns to result list. Uses existing `handleSelectedTestsChange` for selection updates.
- Task 4: Wired ProgressIndicator into S2 customContent between the "All Unremarkable" button and the ResultEntry list. Computes statuses, responded count, and abnormal count inline from `selectedTests` and `testResults`.
- Task 5: Created 10 ProgressIndicator tests and 6 QuickActions tests covering all acceptance criteria.

### Change Log

- 2026-02-24: Implemented BM-4.2 Quick Status Actions & Progress — batch actions, progress indicator, add-test button

### File List

- `frontend/src/components/build-mode/shared/ProgressIndicator.tsx` -- Created (visual progress dots + summary)
- `frontend/src/components/build-mode/shared/ProgressIndicator.css` -- Created (BEM styles for dots and summary)
- `frontend/src/components/build-mode/EncounterEditor.tsx` -- Modified (added batch update handlers, quick action buttons, ProgressIndicator, OrderSelector toggle)
- `frontend/src/components/build-mode/EncounterEditor.css` -- Modified (added quick action and add-test button styles)
- `frontend/src/__tests__/ProgressIndicator.test.tsx` -- Created (10 tests)
- `frontend/src/__tests__/QuickActions.test.tsx` -- Created (6 tests)
