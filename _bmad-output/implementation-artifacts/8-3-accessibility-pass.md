# Story 8.3: Accessibility Pass

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-8.3                                                  |
| Points         | 3                                                       |
| Dependencies   | All previous stories                                    |
| Epic           | Phase 8: Persistence & Polish                           |
| Priority       | Medium (accessibility compliance)                       |

---

## Story

**As a** physician using Build Mode with a screen reader or keyboard-only navigation,
**I want** all interactive elements to have proper ARIA labels, focus management, and keyboard support,
**so that** the application is usable regardless of input method or assistive technology.

---

## Acceptance Criteria

1. All interactive elements reachable via keyboard (Tab, Enter, Space, Arrow keys)
2. Screen readers announce: urgency levels, CDR completion status, result status
3. Modals trap focus and return focus on close
4. Color is not the only indicator for urgency (text labels supplement dots)
5. `pnpm check` passes

---

## Tasks / Subtasks

### 1. CdrCard Accessibility (AC: #2, #4)

- [x] Add `role="region"` and `aria-label` to card wrapper
- [x] Add `aria-label` to CDR count badge with count
- [x] Add `role="status"` to loading state, `role="alert"` to error state
- [x] Add `aria-label` to CDR list element
- [x] Add `aria-hidden="true"` to decorative status dots
- [x] Hide legend from screen readers via `aria-hidden="true"`

### 2. ProgressIndicator Accessibility (AC: #2)

- [x] Add `role="status"` for live region announcements
- [x] Add descriptive `aria-label` including progress count and abnormal count
- [x] Dots already hidden via `aria-hidden="true"` (pre-existing)

### 3. ConfirmationModal Focus Management (AC: #3)

- [x] Add `role="dialog"` and `aria-modal="true"` to modal content
- [x] Add `aria-labelledby` pointing to modal title element
- [x] Implement focus trap (Tab/Shift+Tab cycles within modal)
- [x] Auto-focus dialog on open
- [x] Return focus to previous element on close
- [x] Close on Escape key
- [x] Close on backdrop click (but not content click)
- [x] Add `role="alert"` to warning section
- [x] Add `aria-hidden="true"` to decorative warning SVG

### 4. DifferentialList Accessibility (AC: #1, #2, #4)

- [x] Add `role="region"` and `aria-label` to list wrapper
- [x] Add descriptive `aria-label` to Expand All / Collapse All button
- [x] Add `role="status"` and `aria-label` to urgency summary section
- [x] Add `aria-label` to individual urgency badges
- [x] Pre-existing: `aria-expanded`, `aria-controls` on row buttons, `aria-hidden` on dots/chevrons

### 5. ResultEntry Accessibility (AC: #2)

- [x] Add `role="alert"` and `aria-label` to CDR warning message
- [x] Pre-existing: `role="radiogroup"` with `aria-label`, `role="radio"` with `aria-checked`

### 6. Accessibility Tests (AC: #5)

- [x] ProgressIndicator: role="status", aria-label, hidden dots (4 tests)
- [x] CdrCard: role="region", loading status, error alert, badge label, hidden dots, list label (6 tests)
- [x] DifferentialList: role="region", toggle button label, urgency summary, badges, aria-expanded, hidden dots (6 tests)
- [x] ResultEntry: radiogroup label, aria-checked, CDR warning alert (4 tests)
- [x] ConfirmationModal: role="dialog", aria-modal, aria-labelledby, Escape key, alert, hidden SVG, null when closed, overlay click (8 tests)

---

## Dev Notes

**Architecture Decisions:**
- ARIA attributes added directly to JSX elements -- no wrapper components or HOCs needed
- Focus trap implemented with native DOM queries inside `useCallback` + `useEffect`
- `previousFocusRef` pattern captures and restores focus across modal open/close lifecycle
- Legend and decorative elements hidden at the container level (single `aria-hidden="true"` on parent)
- Live regions (`role="status"`) used for progress indicators so screen readers announce changes without requiring focus
- Alert role (`role="alert"`) used for error states and CDR warnings for immediate announcement

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-persistence-polish.md#Story 8.3]
- [Source: frontend/src/components/build-mode/shared/CdrCard.tsx]
- [Source: frontend/src/components/build-mode/shared/ProgressIndicator.tsx]
- [Source: frontend/src/components/build-mode/shared/DifferentialList.tsx]
- [Source: frontend/src/components/build-mode/shared/ResultEntry.tsx]
- [Source: frontend/src/components/ConfirmationModal.tsx]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Completion Notes List
- All 288 frontend tests pass (28 new accessibility tests)
- Backend TypeScript compilation clean
- No PHI in any changes
- Pre-existing accessibility patterns preserved and extended (aria-expanded, aria-controls, radiogroup)

### File List
- frontend/src/components/build-mode/shared/CdrCard.tsx (ARIA roles, labels, hidden decorative elements)
- frontend/src/components/build-mode/shared/ProgressIndicator.tsx (role="status", aria-label with progress)
- frontend/src/components/build-mode/shared/DifferentialList.tsx (role="region", toggle labels, urgency badges)
- frontend/src/components/build-mode/shared/ResultEntry.tsx (CDR warning role="alert")
- frontend/src/components/ConfirmationModal.tsx (role="dialog", focus trap, Escape, focus return)
- frontend/src/__tests__/AccessibilityPass.test.tsx (28 tests)

### Change Log
- 2026-02-24: Comprehensive accessibility pass with ARIA attributes, focus management, and 28 tests
