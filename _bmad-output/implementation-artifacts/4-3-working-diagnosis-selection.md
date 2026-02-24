# Story 4.3: Working Diagnosis Selection

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-4.3                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-4.1 (Result Entry Component)                         |
| Epic           | Phase 4: S2 Results Redesign                             |
| Priority       | High (completes S2 structured workflow, feeds S3)        |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** AI-suggested working diagnoses based on my S1 differential refined by S2 results, with the ability to select or type a custom diagnosis,
**so that** my working diagnosis feeds into Section 3 for treatment suggestions and produces higher-quality MDM documentation.

---

## Acceptance Criteria

1. AI suggests 3-5 working diagnoses ranked by results, displayed as radio button options
2. "Other" option with free text input for custom diagnosis
3. Selected diagnosis persists to `encounter.section2.workingDiagnosis` as structured `WorkingDiagnosis` object
4. Selected diagnosis is displayed in the S2 area and passed to S3 processing
5. The new `WorkingDiagnosisInput` component replaces the existing plain text input field in EncounterEditor
6. A new backend endpoint `POST /v1/build-mode/suggest-diagnosis` generates AI suggestions
7. `cd frontend && pnpm check` passes (typecheck + lint + test)
8. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Create Backend Endpoint (AC: #6)

- [x] Add `SuggestDiagnosisRequestSchema` to `backend/src/buildModeSchemas.ts`:
  - `encounterId: string`
  - `userIdToken: string`
- [x] Add `SuggestDiagnosisResponseSchema`:
  - `ok: boolean`
  - `suggestions: string[]` (3-5 ranked working diagnoses)
- [x] Add `buildSuggestDiagnosisPrompt()` to `backend/src/promptBuilderBuildMode.ts`:
  - Input: S1 differential, S2 content, S2 test results summary, chief complaint
  - Output: prompt asking Gemini Flash to rank 3-5 working diagnoses
- [x] Add `POST /v1/build-mode/suggest-diagnosis` route to `backend/src/index.ts`:
  - Follow 6-step pattern (authenticate, validate, authorize, execute, audit, respond)
  - Reads encounter from Firestore to get S1 differential and S2 test results
  - Calls `callGeminiFlash` for fast response (not Pro — just ranking existing differentials)
  - Rate limit: 10/min (same as other build-mode endpoints)
  - No quota deduction (this is a UI helper, not an MDM generation)

### 2. Add Frontend API Function (AC: #6)

- [x] Add `suggestDiagnosis(encounterId: string, userIdToken: string)` to `frontend/src/lib/api.ts`
  - Returns `{ ok: boolean; suggestions: string[] }`
  - Timeout: 15_000ms (should be fast with Flash)

### 3. Create WorkingDiagnosisInput Component (AC: #1, #2, #3)

- [x] Create `frontend/src/components/build-mode/shared/WorkingDiagnosisInput.tsx`
  - Props: `suggestions: string[]`, `loading: boolean`, `value: WorkingDiagnosis | string | undefined`, `onChange: (wd: WorkingDiagnosis) => void`, `disabled?: boolean`
  - Radio buttons for each suggestion + "Other" option with free text
  - If `value` is a legacy string, treat it as `{ selected: value, custom: null }`
  - Compact design with pill-style radio buttons
- [x] Create `frontend/src/components/build-mode/shared/WorkingDiagnosisInput.css`
  - BEM naming: `.working-diagnosis`, `.working-diagnosis__option`, `.working-diagnosis__radio`, etc.
  - Pill-style radio buttons matching the existing design system

### 4. Wire into EncounterEditor (AC: #3, #4, #5)

- [x] Replace the plain text `workingDiagnosis` input with `WorkingDiagnosisInput`
- [x] Trigger `suggestDiagnosis` API call when S1 is complete and S2 has test results
  - Fire once per encounter (use a ref guard like `analyzedForRef`)
  - Non-blocking — if it fails, the physician can still type a custom diagnosis
- [x] Store structured `WorkingDiagnosis` to `encounter.section2.workingDiagnosis` via Firestore write
- [x] Pass `workingDiagnosis` to `submitSection(2, ...)` — the existing `handleConfirmedSubmit` already passes it

### 5. Testing (AC: #7, #8)

- [x] Create `frontend/src/__tests__/WorkingDiagnosisInput.test.tsx`:
  - Test: renders suggestion radio buttons
  - Test: selecting a suggestion calls onChange with `{ selected: 'diagnosis', custom: null }`
  - Test: selecting "Other" shows free text input
  - Test: typing custom diagnosis calls onChange with `{ selected: null, custom: 'text' }`
  - Test: shows loading state
  - Test: handles legacy string value
- [x] Run `cd frontend && pnpm check` — passes (163 tests)
- [x] Run `cd backend && pnpm build` — passes

---

## Dev Notes

### Previous Story Intelligence (BM-4.1, BM-4.2)

BM-4.1 and BM-4.2 built the S2 result entry system. Key patterns:
- **Test results state**: `testResults` local state with debounced Firestore writes
- **Working diagnosis**: Currently a plain `useState<string>('')` text input in EncounterEditor (lines 120, 629-646)
- **S2 submission**: `handleConfirmedSubmit` passes `workingDiagnosis` to `submitSection(2, workingDiagnosis || undefined)`
- **Encounter type**: `section2.workingDiagnosis` is typed as `string | WorkingDiagnosis | undefined` (both legacy and structured supported)

### WorkingDiagnosis Type (Already Exists)

```typescript
// frontend/src/types/encounter.ts
export interface WorkingDiagnosis {
  selected: string | null        // AI-suggested diagnosis the user selected
  custom?: string | null          // Free text "Other" diagnosis
  suggestedOptions?: string[]     // The AI suggestions (for audit/display)
}

// backend/src/buildModeSchemas.ts
export const WorkingDiagnosisSchema = z.object({
  selected: z.string().nullable(),
  custom: z.string().nullable().optional(),
  suggestedOptions: z.array(z.string()).optional(),
})
```

Both types already exist — no schema changes needed, just wire them up.

### Backend Endpoint Pattern

Follow the same pattern as `POST /v1/build-mode/match-cdrs`:
1. Authenticate via `userIdToken`
2. Validate with Zod schema
3. Read encounter from Firestore to get S1 differential + S2 test results
4. Build prompt from context
5. Call `callGeminiFlash` (fast, cheap — this is just ranking/refining existing differentials)
6. Parse response as JSON array of 3-5 strings
7. Return `{ ok: true, suggestions: [...] }`

The endpoint does NOT deduct quota because it's a UI helper (same as parse-narrative).

### Prompt Design

The suggest-diagnosis prompt should:
- Receive the S1 differential (ranked diagnoses with urgency)
- Receive S2 test results summary (which tests are abnormal, which are unremarkable)
- Receive the chief complaint
- Ask Gemini Flash to produce 3-5 working diagnosis options ranked by:
  1. Consistency with S2 results (abnormal results support certain diagnoses)
  2. Clinical likelihood given the overall picture
  3. The most dangerous-first ordering (EM worst-first mentality)
- Return as a JSON array of diagnosis strings

### EncounterEditor Integration

Current working diagnosis code in EncounterEditor (to be replaced):
```typescript
// Line 120: State
const [workingDiagnosis, setWorkingDiagnosis] = useState('')

// Lines 629-646: JSX (plain text input inside a div)
{isSection1Complete && !encounter.section2.isLocked && !isFinalized && !isArchived && (
  <div className="encounter-editor__working-diagnosis">
    <label htmlFor="working-diagnosis">Working Diagnosis (optional)...</label>
    <input id="working-diagnosis" type="text" value={workingDiagnosis} ... />
  </div>
)}
```

Replace with:
1. State: `const [workingDiagnosis, setWorkingDiagnosis] = useState<WorkingDiagnosis | null>(null)`
2. Add suggestions state: `const [dxSuggestions, setDxSuggestions] = useState<string[]>([])`
3. Add effect to fetch suggestions when test results change significantly
4. Replace the plain input with `<WorkingDiagnosisInput />`
5. Update `handleConfirmedSubmit` to extract the effective diagnosis string from the structured object

### Extracting Effective Diagnosis String

When passing to `submitSection`, the working diagnosis needs to be a plain string:
```typescript
const effectiveDiagnosis = workingDiagnosis?.selected ?? workingDiagnosis?.custom ?? null
```

### Trigger Logic for Suggestions

Suggestions should be fetched when:
- S1 is complete (differential exists)
- At least some S2 test results have been responded to (respondedCount > 0)
- Haven't already fetched for this encounter + results combination

Use a ref guard similar to `cdrMatchedForRef` with a hash of responded test IDs + statuses to avoid refetching on every keystroke.

### Persisting Structured Working Diagnosis

Write the full `WorkingDiagnosis` object to Firestore on change:
```typescript
const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
updateDoc(encounterRef, { 'section2.workingDiagnosis': workingDiagnosis })
```

### What NOT to Build

- **Do NOT modify CDR tracking** — that's handled by BM-3.3
- **Do NOT modify S3 treatment suggestions** — that's Story 6.1
- **Do NOT build disposition pre-population** — that's Story 6.2
- **Do NOT modify the prompt builder for S2 submission** — it already accepts `workingDiagnosis` string

### Project Structure Notes

| File | Path | Action |
|------|------|--------|
| WorkingDiagnosisInput | `frontend/src/components/build-mode/shared/WorkingDiagnosisInput.tsx` | Create |
| WorkingDiagnosisInput styles | `frontend/src/components/build-mode/shared/WorkingDiagnosisInput.css` | Create |
| EncounterEditor | `frontend/src/components/build-mode/EncounterEditor.tsx` | Modify (replace plain input with WorkingDiagnosisInput) |
| Frontend API | `frontend/src/lib/api.ts` | Modify (add suggestDiagnosis function) |
| Backend endpoint | `backend/src/index.ts` | Modify (add suggest-diagnosis route) |
| Backend schemas | `backend/src/buildModeSchemas.ts` | Modify (add request/response schemas) |
| Backend prompts | `backend/src/promptBuilderBuildMode.ts` | Modify (add suggest-diagnosis prompt) |
| Tests | `frontend/src/__tests__/WorkingDiagnosisInput.test.tsx` | Create |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-s2-results.md -- Story 4.3 spec]
- [Source: frontend/src/components/build-mode/EncounterEditor.tsx -- Current working diagnosis plain text input]
- [Source: frontend/src/types/encounter.ts -- WorkingDiagnosis interface, isStructuredDiagnosis guard]
- [Source: backend/src/buildModeSchemas.ts -- WorkingDiagnosisSchema, Section2RequestSchema]
- [Source: backend/src/promptBuilderBuildMode.ts -- buildSection2Prompt with workingDiagnosis param]
- [Source: backend/src/index.ts -- process-section2 route, match-cdrs route pattern]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Frontend `pnpm check` passes — 163 tests (10 new WorkingDiagnosisInput tests), typecheck clean, lint clean.
- Backend `pnpm build` passes. New endpoint compiles cleanly.
- Suggest-diagnosis endpoint uses `callGeminiFlash` for fast response. Fallback to top-3 differential diagnoses if LLM response parsing fails.
- WorkingDiagnosisInput uses pill-style radio buttons with hidden native radios for accessibility.
- Suggestion fetch uses ref guard (`dxSuggestedForRef`) with hash of responded test IDs + statuses to avoid redundant fetches.

### Completion Notes List

- Task 1: Added `SuggestDiagnosisRequestSchema` and `SuggestDiagnosisResponseSchema` to buildModeSchemas.ts. Added `buildSuggestDiagnosisPrompt()` to promptBuilderBuildMode.ts. Added `POST /v1/build-mode/suggest-diagnosis` route following the 6-step pattern (same as match-cdrs). Endpoint reads S1 differential + S2 test results, builds prompt, calls Gemini Flash, parses JSON array, falls back to top-3 differential if parsing fails.
- Task 2: Added `suggestDiagnosis()` to frontend api.ts with 15s timeout.
- Task 3: Created `WorkingDiagnosisInput.tsx` with pill-style radio buttons for AI suggestions + "Other" option with free text input. Normalizes legacy string values. Created BEM-named CSS with pill border-radius, hover/selected states, and disabled styles.
- Task 4: Replaced plain text `workingDiagnosis` useState with structured `WorkingDiagnosis | null`. Added `dxSuggestions`, `dxSuggestionsLoading` state. Added `useEffect` to fetch suggestions when S1 complete + S2 has responded results (ref guard with hash). Added `handleWorkingDiagnosisChange` that persists structured object to Firestore. Updated `handleConfirmedSubmit` to extract effective diagnosis string (`selected ?? custom`). Replaced plain input JSX with `<WorkingDiagnosisInput />`.
- Task 5: Created 10 tests covering: renders suggestions, selecting calls onChange, Other shows input, custom typing, loading state, legacy string, no suggestions fallback, disabled state, selected class highlight, label rendering.

### Change Log

- 2026-02-24: Implemented BM-4.3 Working Diagnosis Selection — backend endpoint, prompt builder, frontend component, EncounterEditor wiring

### File List

- `backend/src/buildModeSchemas.ts` -- Modified (added SuggestDiagnosis request/response schemas)
- `backend/src/promptBuilderBuildMode.ts` -- Modified (added buildSuggestDiagnosisPrompt function, TestResult import)
- `backend/src/index.ts` -- Modified (added POST /v1/build-mode/suggest-diagnosis route, SuggestDiagnosisRequestSchema + buildSuggestDiagnosisPrompt imports)
- `frontend/src/lib/api.ts` -- Modified (added suggestDiagnosis function)
- `frontend/src/components/build-mode/shared/WorkingDiagnosisInput.tsx` -- Created (pill-style radio diagnosis selector)
- `frontend/src/components/build-mode/shared/WorkingDiagnosisInput.css` -- Created (BEM styles for diagnosis pills)
- `frontend/src/components/build-mode/EncounterEditor.tsx` -- Modified (replaced plain text input with WorkingDiagnosisInput, structured state, suggestion fetch effect, Firestore persistence)
- `frontend/src/__tests__/WorkingDiagnosisInput.test.tsx` -- Created (10 tests)
