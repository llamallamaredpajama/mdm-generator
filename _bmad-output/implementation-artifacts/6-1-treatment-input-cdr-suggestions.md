# Story 6.1: Treatment Input with CDR Suggestions

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-6.1                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-3.3 (CDR State Persistence), BM-4.3 (Working Diagnosis) |
| Epic           | Phase 6: S3 Redesign                                    |
| Priority       | High (first step in S3 structured input)                 |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** Section 3 to show CDR-suggested treatment checkboxes above a free-text treatment area with my working diagnosis displayed for context,
**so that** I can quickly select evidence-based treatments recommended by completed CDRs while still having the flexibility to dictate custom treatments.

---

## Acceptance Criteria

1. CDR-suggested treatments shown as checkboxes only when a completed CDR includes `suggestedTreatments` for the relevant risk level
2. Selecting a checkbox appends the treatment text to the free-text area (user can edit after)
3. Free-text area supports dictation and manual typing for treatment descriptions
4. Working diagnosis shown at top of S3 for clinical context
5. When no CDRs have suggested treatments, the treatment section shows only the free-text area (no empty checkbox area)
6. Treatment text and selected CDR suggestions are persisted to the encounter document (`section3.treatments` and `section3.cdrSuggestedTreatments`)
7. `cd frontend && pnpm check` passes (typecheck + lint + test)
8. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Create TreatmentInput Component (AC: #1-5)

- [ ] Create `frontend/src/components/build-mode/shared/TreatmentInput.tsx`
- [ ] Props: `encounter: EncounterDocument`, `onUpdate: (treatments: string, cdrSuggestions: string[]) => void`, `disabled?: boolean`
- [ ] Display working diagnosis at top (from `encounter.section2.workingDiagnosis` — use `isStructuredDiagnosis` helper)
- [ ] Read completed CDRs from `encounter.cdrTracking` — for each completed CDR, look up its definition from `useCdrLibrary` to get `suggestedTreatments`
- [ ] Match CDR score interpretation (risk level) against `suggestedTreatments` keys to get applicable treatment strings
- [ ] Render checkbox list of applicable treatments (grouped by CDR name)
- [ ] When a checkbox is checked, append treatment text to the free-text textarea
- [ ] When a checkbox is unchecked, remove the corresponding treatment text from textarea
- [ ] Free-text textarea with character limit matching SECTION3_MAX_CHARS
- [ ] If no CDRs have applicable treatments, render only the free-text area

### 2. TreatmentInput CSS (AC: #1-5)

- [ ] BEM-styled: `.treatment-input`, `.treatment-input__diagnosis`, `.treatment-input__suggestions`, `.treatment-input__textarea`
- [ ] CDR suggestion group headers with CDR name and score badge
- [ ] Checkbox styling consistent with existing build-mode components
- [ ] Responsive layout (stacks on mobile, wider on desktop)

### 3. Integrate TreatmentInput into EncounterEditor S3 (AC: #3, #6)

- [ ] In EncounterEditor, replace the S3 textarea content with TreatmentInput component
- [ ] Wire `onUpdate` callback to persist `treatments` and `cdrSuggestedTreatments` to encounter doc via Firestore `updateDoc`
- [ ] Ensure S3 content still populates for submission (treatments text goes into `section3.content` for the finalize prompt)
- [ ] S3 guide (Section3Guide) remains — TreatmentInput is the content area, not the guide

### 4. Create Tests (AC: #7)

- [ ] Test TreatmentInput renders working diagnosis when present
- [ ] Test TreatmentInput renders CDR-suggested treatments when CDRs are completed with treatments
- [ ] Test selecting a checkbox appends treatment text to textarea
- [ ] Test deselecting a checkbox removes treatment text from textarea
- [ ] Test no suggestion section shown when no CDRs have suggested treatments
- [ ] Test disabled state prevents interaction

---

## Dev Notes

**Architecture Decisions:**
- TreatmentInput is a frontend-only component reading data already on the encounter document
- CDR treatment suggestions are derived client-side: completed CDR score + interpretation -> look up `suggestedTreatments[riskLevel]` from CDR library definition
- The free-text content from TreatmentInput feeds into `section3.content` which the finalize prompt already reads
- `section3.cdrSuggestedTreatments` stores IDs of selected CDR treatments for potential use by the finalize prompt (Story 6.3)
- `section3.treatments` stores the free-text treatment description

**Key Patterns:**
- CDR library access via `useCdrLibrary()` hook (see `frontend/src/hooks/useCdrLibrary.ts`)
- CDR tracking data lives on `encounter.cdrTracking` as `Record<string, CdrTrackingEntry>`
- Working diagnosis via `encounter.section2.workingDiagnosis` — use `isStructuredDiagnosis()` type guard from `types/encounter.ts`
- Firestore updates via `updateDoc(doc(db, 'customers', uid, 'encounters', encounterId), { ... })`
- BEM CSS naming per existing shared/ components
- Section3Data already has `treatments`, `cdrSuggestedTreatments`, and `disposition` fields defined in `types/encounter.ts`

**Files to Touch:**
- `frontend/src/components/build-mode/shared/TreatmentInput.tsx` (NEW)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (integrate TreatmentInput in S3)
- `frontend/src/__tests__/TreatmentInput.test.tsx` (NEW)

**What NOT to Build:**
- No backend changes — all data is already on the encounter document and in the CDR library
- No new API endpoints
- No disposition selector (that's Story 6.2)
- No finalize prompt changes (that's Story 6.3)

### Project Structure Notes

- New component follows `frontend/src/components/build-mode/shared/` pattern (peer to ResultEntry, WorkupCard, etc.)
- Tests in `frontend/src/__tests__/` matching existing test file convention

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-s3-redesign.md#Story 6.1]
- [Source: frontend/src/types/encounter.ts#Section3Data] — defines `treatments`, `cdrSuggestedTreatments`, `disposition`, `followUp`
- [Source: frontend/src/types/libraries.ts#CdrDefinition] — defines `suggestedTreatments?: Record<string, string[]>`
- [Source: frontend/src/hooks/useCdrLibrary.ts] — CDR library access hook
- [Source: frontend/src/components/build-mode/EncounterEditor.tsx] — S3 section integration point

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
