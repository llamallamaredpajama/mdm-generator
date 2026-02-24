# Story 8.1: S2 Submission Flow Refactor

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-8.1                                                  |
| Points         | 5                                                       |
| Dependencies   | BM-4.1, BM-4.2, BM-4.3, BM-5.3                        |
| Epic           | Phase 8: Persistence & Polish                           |
| Priority       | High (enables structured prompt enrichment)             |

---

## Story

**As a** physician using Build Mode Section 2,
**I want** the S2 submission to send structured test results (selectedTests, testResults, workingDiagnosis) to the backend alongside free-text content,
**so that** the LLM receives precise, structured data for a more accurate MDM preview.

---

## Acceptance Criteria

1. S2 endpoint accepts structured test results data
2. Prompt builder formats structured data clearly for LLM
3. CDR scores returned in S2 response
4. Old encounters with text-based S2 still work (backward compat)
5. End-to-end flow: S1 -> dashboard -> workup -> S2 results -> CDR output -> S3
6. `pnpm check` passes, `pnpm build` passes

---

## Tasks / Subtasks

### 1. Extend Section2RequestSchema (AC: #1, #4)

- [x] Add optional `selectedTests`, `testResults`, `structuredDiagnosis` to Section2RequestSchema
- [x] Use inline Zod definitions to avoid forward-reference issues
- [x] Backward compatible: all new fields optional

### 2. Enhance buildSection2Prompt (AC: #2, #3)

- [x] Add `Section2StructuredData` interface
- [x] Accept optional `structuredData` parameter
- [x] Format structured test results in user prompt block
- [x] Include pending test detection (ordered but no results)
- [x] Resolve working diagnosis from structured or legacy format

### 3. Update Backend Endpoint (AC: #1, #3, #4)

- [x] Destructure structured fields from parsed request
- [x] Build structured data with request → Firestore fallback
- [x] Pass structured data to buildSection2Prompt
- [x] Persist structured data to Firestore on S2 completion

### 4. Update Frontend API & Hook (AC: #5)

- [x] Add `Section2StructuredPayload` interface to api.ts
- [x] Update `processSection2` to accept and send structured data
- [x] Update `useEncounter.submitSection(2)` to collect and pass structured data

### 5. Tests (AC: #6)

- [x] Test processSection2 sends structured data
- [x] Test backward compatibility (no structured data)
- [x] Test structured diagnosis handling (string, object, null)
- [x] Test empty fields are omitted from request body
- [x] Test error handling preserved

---

## Dev Notes

**Architecture Decisions:**
- Structured fields use "prefer request, fallback to Firestore" pattern — fresh data in request body wins, but Firestore data is used when client doesn't send it
- Inlined Zod schemas in S2 request to avoid forward-reference issues (TestResultSchema/WorkingDiagnosisSchema defined later in file)
- `null` → `undefined` conversion at the `resolveWorkingDiagnosis` call site to bridge API boundary permissiveness with internal type strictness
- Free-text `content` field remains required for narrative context and backward compatibility

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-persistence-polish.md#Story 8.1]
- [Source: backend/src/buildModeSchemas.ts]
- [Source: backend/src/promptBuilderBuildMode.ts]
- [Source: backend/src/index.ts]
- [Source: frontend/src/lib/api.ts]
- [Source: frontend/src/hooks/useEncounter.ts]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Completion Notes List
- All 255 frontend tests pass (8 new S2 refactor tests)
- Backend TypeScript compilation clean
- No PHI in any changes

### File List
- backend/src/buildModeSchemas.ts (extended S2 request schema)
- backend/src/promptBuilderBuildMode.ts (Section2StructuredData interface, enhanced buildSection2Prompt)
- backend/src/index.ts (S2 endpoint reads/forwards structured data)
- frontend/src/lib/api.ts (Section2StructuredPayload, updated processSection2)
- frontend/src/hooks/useEncounter.ts (submitSection(2) collects structured data)
- frontend/src/__tests__/S2SubmissionRefactor.test.tsx (8 tests)

### Change Log
- 2026-02-24: Implemented S2 submission flow refactor with structured data
