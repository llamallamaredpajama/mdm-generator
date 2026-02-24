# Story 7.1: Order Set Save & Suggest

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-7.1                                                  |
| Points         | 5                                                       |
| Dependencies   | BM-2.2 (Workup Card), BM-1.4 (User Profile)            |
| Epic           | Phase 7: Order Sets                                     |
| Priority       | Medium (physician personalization)                       |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** to save my current test selections as named order sets and have the system suggest matching sets for new encounters,
**so that** I can quickly apply my common workup patterns with one tap instead of selecting tests individually.

---

## Acceptance Criteria

1. Save modal captures name and included test IDs from current selection
2. Saved order sets appear in settings with delete capability
3. S1 dashboard suggests matching order sets based on differential presentation keywords
4. "Apply All" applies full order set, "Customize" opens order selector pre-loaded
5. Usage count incremented when order set is applied
6. `cd frontend && pnpm check` passes

---

## Tasks / Subtasks

### 1. Create useOrderSets Hook (AC: #1-2, #5)

- [x] Create `frontend/src/hooks/useOrderSets.ts`
- [x] localStorage persistence for saved order sets
- [x] CRUD operations: load, save, delete
- [x] Track usage count per order set
- [x] Keyword matching function for suggesting sets

### 2. Create SaveOrderSetModal Component (AC: #1)

- [x] Create `frontend/src/components/build-mode/shared/SaveOrderSetModal.tsx`
- [x] Name input, display of included tests, save/cancel buttons
- [x] Tags input for matching keywords (optional)

### 3. Create OrderSetSuggestion Component (AC: #3-4)

- [x] Create `frontend/src/components/build-mode/shared/OrderSetSuggestion.tsx`
- [x] Shows matching order set name and test count
- [x] "Apply All", "Customize", "Skip" action buttons

### 4. Integrate into WorkupCard and DashboardOutput (AC: #3-4)

- [x] Add "Save as Order Set" button to WorkupCard header
- [x] Show OrderSetSuggestion in DashboardOutput above WorkupCard
- [x] Wire apply/customize/skip actions

### 5. Add Order Set Management to Settings (AC: #2)

- [x] Add "Order Sets" section to Settings.tsx
- [x] List saved sets with name, test count, usage count, delete button

### 6. Tests (AC: #6)

- [x] Test useOrderSets hook operations
- [x] Test SaveOrderSetModal save flow
- [x] Test OrderSetSuggestion actions
- [x] Test WorkupCard save button integration

---

## Dev Notes

**Architecture Decisions:**
- Saved order sets persisted to localStorage (matching useDispoFlows pattern)
- Keyword matching uses simple string matching against differential diagnosis text
- No AI endpoint for matching — client-side keyword match is sufficient for MVP
- Tags are optional free-text that augment keyword matching

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-7-order-sets.md#Story 7.1]
- [Source: frontend/src/components/build-mode/shared/WorkupCard.tsx]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.tsx]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Completion Notes List

### File List
