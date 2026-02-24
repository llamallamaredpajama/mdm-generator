# Story 6.3: Update Finalize Prompt for Structured Data

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-6.3                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-6.1 (Treatment Input), BM-6.2 (Disposition Selector), BM-5.3 (S2 CDR Output) |
| Epic           | Phase 6: S3 Redesign                                    |
| Priority       | High (completes the structured data pipeline)            |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** the finalize prompt to incorporate all structured data from S2 and S3 (test results, CDR scores, working diagnosis, treatments, disposition, follow-up),
**so that** the final MDM document accurately reflects the structured clinical data I entered rather than relying solely on free-text.

---

## Acceptance Criteria

1. Finalize prompt includes structured test results (not just raw S2 text)
2. Finalize prompt includes completed CDR scores with interpretations
3. Finalize prompt includes working diagnosis (structured or legacy string)
4. Finalize prompt includes selected treatments and CDR-suggested treatments
5. Finalize prompt includes disposition and follow-up selections
6. Final MDM text incorporates CDR scores with interpretations in Data Reviewed
7. Final MDM text reflects selected disposition and follow-up in Disposition section
8. All CDR documentation follows medical documentation standards
9. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Update buildFinalizePrompt Signature and Body (AC: #1-5)

- [x] Add structured data parameters to buildFinalizePrompt function signature
- [x] Build structured test results section from S2 testResults + selectedTests
- [x] Build structured treatments section from S3 treatments + cdrSuggestedTreatments
- [x] Build disposition + follow-up section from S3 disposition + followUp
- [x] Enhance working diagnosis handling (structured WorkingDiagnosis vs legacy string)
- [x] Update prompt instructions to reference structured data sections

### 2. Update Finalize Endpoint to Read Structured Data (AC: #1-5)

- [x] Read S2 structured fields: selectedTests, testResults, workingDiagnosis
- [x] Read S3 structured fields: treatments, cdrSuggestedTreatments, disposition, followUp
- [x] Pass structured data to buildFinalizePrompt

### 3. Enhance Prompt Instructions for MDM Quality (AC: #6-8)

- [x] Add CDR score documentation instructions
- [x] Add disposition rationale instructions
- [x] Add treatment documentation instructions
- [x] Ensure medical documentation standards compliance

### 4. Verify Backend Builds (AC: #9)

- [x] Run `cd backend && pnpm build` and verify clean compilation

---

## Dev Notes

**Architecture Decisions:**
- Structured data is additive — free-text content is still passed through for backward compatibility
- CDR context already built by `buildCdrContextString()` from cdrTracking; this story adds S2/S3 structured fields
- FinalizeRequestSchema stays the same (content is still the primary payload); structured data is read from Firestore encounter doc
- No frontend changes needed — all structured data was already persisted by stories 6.1 and 6.2

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-s3-redesign.md#Story 6.3]
- [Source: backend/src/promptBuilderBuildMode.ts#buildFinalizePrompt]
- [Source: backend/src/index.ts#finalize endpoint]
- [Source: backend/src/buildModeSchemas.ts#SectionDataSchema]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
- backend/src/promptBuilderBuildMode.ts (modified)
- backend/src/index.ts (modified)
