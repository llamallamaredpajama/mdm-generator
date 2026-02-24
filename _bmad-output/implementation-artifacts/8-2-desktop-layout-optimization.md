# Story 8.2: Desktop Layout Optimization

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-8.2                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-2.1                                                  |
| Epic           | Phase 8: Persistence & Polish                           |
| Priority       | Medium (desktop usability improvement)                  |

---

## Story

**As a** physician using Build Mode on a desktop screen,
**I want** the dashboard, S2 results, and S3 inputs to use the full desktop width with multi-column layouts,
**so that** I can see more information at once without excessive scrolling.

---

## Acceptance Criteria

1. Dashboard uses full desktop width with multi-column layout
2. S2 results show wider cards with more visible detail
3. S3 treatment + disposition shown side-by-side on desktop
4. Mobile layout unchanged (single column stacked)
5. `pnpm check` passes

---

## Tasks / Subtasks

### 1. Dashboard 2-Column Top Row (AC: #1)

- [x] Restructure DashboardOutput to use `top-row` container for Differential + CDR
- [x] Desktop: `grid-template-columns: 1.5fr 1fr` for differential + CDR side-by-side
- [x] Mobile: flex-column stacked layout (unchanged)
- [x] Workup card now full-width in its own row

### 2. S2 Result Grid (AC: #2)

- [x] Add `result-grid` CSS class with 2-column grid on desktop (min-width: 768px)
- [x] Wrap ResultEntry cards in grid container
- [x] Full-width utility class for spanning both columns when needed

### 3. S3 Side-by-Side Layout (AC: #3)

- [x] Add `s3-layout` CSS class with 2-column grid on desktop
- [x] Wrap TreatmentInput + DispositionSelector in grid container
- [x] `align-items: start` so columns don't stretch to match height

### 4. Tests (AC: #4, #5)

- [x] Test desktop class application on DashboardOutput
- [x] Test mobile class application on DashboardOutput
- [x] Test top-row structure contains differential + CDR
- [x] Test middle-row structure contains workup

---

## Dev Notes

**Architecture Decisions:**
- CSS-only responsive layout using media queries (min-width: 768px)
- Reuses existing `useIsMobile()` hook for JS-level layout decisions in DashboardOutput
- S2 grid and S3 grid are pure CSS — no JS needed, they use `@media` queries directly
- No changes to mobile layout at all (guaranteed by mobile-first CSS approach)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-persistence-polish.md#Story 8.2]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.tsx]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.css]
- [Source: frontend/src/components/build-mode/EncounterEditor.tsx]
- [Source: frontend/src/components/build-mode/EncounterEditor.css]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Completion Notes List
- All 260 frontend tests pass (5 new desktop layout tests)
- Backend TypeScript compilation clean
- No PHI in any changes

### File List
- frontend/src/components/build-mode/shared/DashboardOutput.tsx (restructured top-row layout)
- frontend/src/components/build-mode/shared/DashboardOutput.css (2-column top row, full-width workup)
- frontend/src/components/build-mode/EncounterEditor.tsx (S2 result grid, S3 side-by-side)
- frontend/src/components/build-mode/EncounterEditor.css (result-grid, s3-layout media queries)
- frontend/src/__tests__/DesktopLayout.test.tsx (5 tests)

### Change Log
- 2026-02-24: Implemented desktop layout optimization with multi-column grids
