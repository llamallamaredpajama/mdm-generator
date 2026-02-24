# Story 7.2: Report Templates

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-7.2                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-4.1 (Result Entry), BM-1.4 (User Profile)            |
| Epic           | Phase 7: Order Sets                                     |
| Priority       | Medium (physician personalization)                       |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** to save common result descriptions as templates (e.g., "NSR, normal intervals" for ECG) and apply them with one tap,
**so that** I can quickly document routine findings without retyping.

---

## Acceptance Criteria

1. Saved templates shown in result detail view for matching test
2. One-tap applies template text to notes field
3. Templates can specify default status (unremarkable/abnormal)
4. Save modal captures: test ID, name, text, default status
5. `cd frontend && pnpm check` passes

---

## Tasks / Subtasks

### 1. Create useReportTemplates Hook (AC: #1, #4)

- [x] Create `frontend/src/hooks/useReportTemplates.ts`
- [x] localStorage persistence for saved templates
- [x] Templates keyed by test ID
- [x] CRUD operations: load, save, delete

### 2. Add Template Display to ResultDetailExpanded (AC: #1-3)

- [x] Show saved templates for the current test as quick-apply buttons
- [x] One-tap applies template text to notes and optionally sets status
- [x] Add "Save as template" button for current notes

### 3. Tests (AC: #5)

- [x] Test useReportTemplates hook
- [x] Test template application in ResultDetailExpanded
- [x] Test template save flow

---

## Dev Notes

**Architecture Decisions:**
- Templates persisted to localStorage (matching useOrderSets and useDispoFlows patterns)
- Templates keyed by testId so ECG templates only show for ECG results
- Template saves current notes text + optionally current status

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-7-order-sets.md#Story 7.2]
- [Source: frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Completion Notes List

### File List
