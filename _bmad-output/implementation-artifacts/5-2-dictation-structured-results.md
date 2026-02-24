# Story 5.2: Dictation-to-Structured Results

Status: ready-for-dev

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-5.2                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-5.1 (Paste Lab Results AI Parsing)                    |
| Epic           | Phase 5: S2 Intelligence                                 |
| Priority       | Medium (alternative result entry mode)                   |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** to toggle to a dictation mode in Section 2 where I type or dictate a natural language summary of my results (e.g., "ECG showed ST depression, troponin 2.5, all other workup unremarkable") and have AI map it to my ordered tests,
**so that** I can quickly populate results without clicking through individual test cards.

---

## Acceptance Criteria

1. Toggle button visible in S2 custom content area that switches between "structured" (default) and "dictation" mode
2. Dictation mode shows a textarea for typing/dictating result narrative
3. "Process Results" button sends dictated text to existing `parse-results` endpoint
4. Same preview-before-apply flow as paste modal (shows matched tests, status, values)
5. Applied results map to ordered tests identically to the paste flow
6. Switching modes preserves existing test result data (no data loss)
7. Dictation textarea preserves its text when switching back to structured and returning
8. Toggle is disabled when S2 is locked or submitting
9. `cd frontend && pnpm check` passes (typecheck + lint + test)

---

## Tasks / Subtasks

### 1. Add Dictation Mode State and Toggle (AC: #1, #6, #8)

- [ ] Add `s2EntryMode` state to EncounterEditor: `'structured' | 'dictation'` (default: 'structured')
- [ ] Add `dictationText` state to persist typed dictation text across mode toggles
- [ ] Add toggle button in S2 `customContent` area (above the result entries or quick actions)
- [ ] Toggle button disabled when `isS2Locked` or `isS2Submitting`
- [ ] Switching modes does NOT clear `testResults` or `selectedTests`

### 2. Create Dictation Entry UI (AC: #2, #3, #7)

- [ ] When `s2EntryMode === 'dictation'`, show dictation textarea instead of ResultEntry cards
- [ ] Textarea placeholder: "Describe your results... e.g., 'ECG normal sinus rhythm, troponin negative, CBC unremarkable, CT head shows no acute findings'"
- [ ] "Process Results" button below textarea (disabled when textarea empty or locked)
- [ ] Button calls existing `parseResults` API function from `api.ts`
- [ ] On successful parse, open PasteLabModal in preview mode (skip idle state, go straight to preview)

### 3. Adapt PasteLabModal for External Preview Mode (AC: #4, #5)

- [ ] Add optional prop `initialParsedResults` and `initialUnmatchedText` to PasteLabModal
- [ ] When these props are provided, skip idle state and show preview directly
- [ ] Apply button works identically to paste flow (calls `onApply` with mapped results)
- [ ] Back button in this mode returns to dictation (closes modal) instead of showing textarea

### 4. Add CSS for Toggle and Dictation Mode (AC: #1, #2)

- [ ] Style toggle button (compact pill toggle, "Structured" / "Dictation" labels)
- [ ] Style dictation textarea (matches PasteLabModal textarea but embedded inline)
- [ ] Style "Process Results" button

### 5. Create Tests (AC: #9)

- [ ] Test toggle between structured and dictation modes
- [ ] Test dictation textarea renders in dictation mode
- [ ] Test "Process Results" button disabled when textarea is empty
- [ ] Test that switching modes preserves existing test results
- [ ] Test that dictation text persists when toggling back and forth

---

## Dev Notes

**Architecture Decisions:**
- Reuse the existing `parse-results` endpoint — no new backend work needed
- Reuse PasteLabModal's preview-and-apply flow for consistency
- The dictation textarea is inline in S2 (not a modal), but the preview uses the modal
- Mode toggle is visual-only — both modes write to the same `testResults` state

**Key Patterns to Follow:**
- `showS2OrderSelector` state pattern in EncounterEditor for toggle management
- `PasteLabModal` component for the preview-before-apply flow
- `handleBatchResultUpdate` for applying parsed results to Firestore

**What NOT to Build:**
- No speech-to-text / Web Speech API (that's a future enhancement)
- No new backend endpoint
- No persistent mode preference (always starts in structured mode)
- No auto-save of dictation text to Firestore
