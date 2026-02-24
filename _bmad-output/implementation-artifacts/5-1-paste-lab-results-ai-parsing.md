# Story 5.1: Paste Lab Results (AI Parsing)

Status: ready-for-dev

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-5.1                                                  |
| Points         | 5                                                       |
| Dependencies   | BM-4.1 (Result Entry Component)                         |
| Epic           | Phase 5: S2 Intelligence                                 |
| Priority       | High (first AI-powered result entry shortcut)            |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** to paste raw lab/imaging text from my EHR into a modal and have AI parse it into structured results mapped to my ordered tests,
**so that** I can rapidly populate test results without manually clicking through each test card.

---

## Acceptance Criteria

1. "Paste Results" button visible in S2 result entries area (next to quick action buttons)
2. Button opens a modal with a textarea for pasting raw lab/EHR text
3. Pasted text is sent to backend `POST /v1/build-mode/parse-results` endpoint for AI parsing
4. Parsed results shown as a preview before applying (test name, parsed status, parsed value)
5. User can confirm to apply all parsed results, or cancel without changes
6. Applied results map to ordered tests: status (unremarkable/abnormal), values, notes
7. Tests not in the pasted text remain unchanged (only matched tests are updated)
8. Modal shows a loading spinner while AI is parsing
9. `cd frontend && pnpm check` passes (typecheck + lint + test)
10. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Create Backend Schema & Prompt (AC: #3)

- [ ] Add `ParseResultsRequestSchema` to `backend/src/buildModeSchemas.ts`:
  - `encounterId: string`
  - `pastedText: string` (max 8000 chars)
  - `orderedTestIds: string[]` (the tests the physician has selected)
  - `userIdToken: string`
- [ ] Add `ParseResultsResponseSchema`:
  - `ok: boolean`
  - `parsed: Array<{ testId: string, testName: string, status: 'unremarkable' | 'abnormal', value?: string, unit?: string, notes?: string }>`
  - `unmatchedText?: string[]` (fragments that didn't map to any ordered test)
- [ ] Add `buildParseResultsPrompt()` to `backend/src/promptBuilderBuildMode.ts`:
  - Input: pasted text, list of ordered test definitions (id, name, unit, normalRange)
  - Output: prompt for Gemini Flash to extract structured results mapped to test IDs
  - Critical: must only map to tests in the ordered list, never fabricate new tests
  - Include normalRange in prompt so AI can determine unremarkable vs abnormal

### 2. Create Backend Endpoint (AC: #3, #7)

- [ ] Add `POST /v1/build-mode/parse-results` route to `backend/src/index.ts`:
  - Follow 6-step security pattern (authenticate, validate, authorize, execute, audit, respond)
  - Rate limit: same `llmLimiter` as other build-mode endpoints
  - No quota deduction (UI helper, same as suggest-diagnosis)
  - Read encounter from Firestore to verify ownership and get S1 status
  - Load test library to get test definitions for ordered test IDs
  - Call `callGeminiFlash` (fast parsing, not generation)
  - Parse JSON response, validate against ordered test IDs
  - Return structured parsed results

### 3. Add Frontend API Function (AC: #3)

- [ ] Add `parseResults(encounterId, pastedText, orderedTestIds, userIdToken)` to `frontend/src/lib/api.ts`
  - Returns `{ ok: boolean; parsed: ParsedResult[]; unmatchedText?: string[] }`
  - Timeout: 20_000ms

### 4. Create PasteLabModal Component (AC: #1, #2, #4, #5, #8)

- [ ] Create `frontend/src/components/build-mode/shared/PasteLabModal.tsx`:
  - Props: `isOpen`, `onClose`, `orderedTestIds`, `testLibrary`, `onApply: (results: Record<string, TestResult>) => void`
  - States: idle (textarea shown), loading (parsing), preview (results shown), error
  - Textarea: placeholder "Paste lab results from your EHR...", min 2 lines
  - "Parse" button sends text to API
  - Preview mode: shows table of matched tests with parsed status/value, unmatched text list
  - "Apply Results" button calls onApply with the parsed results converted to TestResult format
  - "Cancel" button closes modal without changes
  - Error state: shows error message with retry option
- [ ] Create `frontend/src/components/build-mode/shared/PasteLabModal.css`:
  - BEM naming: `.paste-lab-modal`, `.paste-lab-modal__textarea`, `.paste-lab-modal__preview-table`, etc.
  - Modal overlay with centered card
  - Preview table with test name, status badge (green/red), value column

### 5. Wire into EncounterEditor (AC: #1, #6)

- [ ] Add "Paste Results" button in S2 custom content area (near "All Results Unremarkable" button)
  - Only visible when S2 is not locked and tests are selected
  - Opens PasteLabModal
- [ ] Add `showPasteModal` state and handler
- [ ] `onApply` handler: convert parsed results to `Record<string, TestResult>` and call `handleBatchResultUpdate`
  - Merge with existing results (don't overwrite tests not in parsed set)

### 6. Testing (AC: #9, #10)

- [ ] Create `frontend/src/__tests__/PasteLabModal.test.tsx`:
  - Test: renders textarea in idle state
  - Test: shows loading state when parsing
  - Test: displays preview table with parsed results
  - Test: Apply button calls onApply with correct TestResult records
  - Test: Cancel closes without calling onApply
  - Test: unmatched text shown when present
  - Test: disabled state when S2 locked
- [ ] Run `cd frontend && pnpm check` -- passes
- [ ] Run `cd backend && pnpm build` -- passes

---

## Dev Notes

### Existing Patterns to Follow

- **Batch result update**: Use `handleBatchResultUpdate` (EncounterEditor.tsx line 267) which merges results and writes immediately to Firestore. This is the same pattern used by "All Unremarkable" and "Mark Remaining" buttons.
- **Modal pattern**: Use the same `ConfirmationModal` approach (already imported in EncounterEditor) or create a standalone modal with overlay + card. Reference `TrendReportModal` for a larger modal with content.
- **API pattern**: Follow `suggestDiagnosis` (api.ts) for the frontend API function -- POST with encounterId + userIdToken.
- **Backend pattern**: Follow `match-cdrs` endpoint (index.ts line 1330) for the 6-step pattern with encounter ownership verification.
- **Schema pattern**: Follow `SuggestDiagnosisRequestSchema` for request, add a new response schema with typed parsed array.
- **Prompt pattern**: Follow `buildSuggestDiagnosisPrompt` for a Flash-targeted prompt that returns JSON.

### Key Types

- `TestResult`: `{ status: 'unremarkable' | 'abnormal' | 'pending', quickFindings?, notes?, value?, unit? }` (encounter.ts line 156)
- `TestDefinition`: `{ id, name, category, unit, normalRange, quickFindings, feedsCdrs }` (libraries.ts line 15)
- `handleBatchResultUpdate`: Takes `Record<string, TestResult>`, merges into state and writes to Firestore immediately.

### Architectural Decisions

- **Gemini Flash** (not Pro) for parsing -- this is a structured extraction task, not medical reasoning.
- **No quota deduction** -- this is a UI helper that saves physician time, not an MDM generation step.
- **Ordered tests only** -- the AI can only map to tests the physician has already selected. This prevents unexpected test additions and keeps the workflow physician-driven.
- **Preview before apply** -- required for physician review. AI may misparse values, so the preview step is a safety gate.
- **Unmatched text** -- show any text fragments the AI couldn't map so the physician knows what wasn't captured.

---

## Dev Agent Record

### Agent Model Used

(pending)

### Debug Log References

(pending)

### Completion Notes List

(pending)

### Change Log

(pending)

### File List

(pending)
