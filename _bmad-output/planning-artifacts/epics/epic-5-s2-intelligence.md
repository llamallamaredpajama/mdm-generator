# Phase 5: S2 Intelligence

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-5.1, BM-5.2, BM-5.3
**Dependencies:** Phase 3 (BM-3.3), Phase 4 (BM-4.1)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**This phase adds:** AI-powered result entry shortcuts (paste from EHR, dictation-to-structured) and replaces the S2 output from full MDM preview to a brief CDR calculations report. The physician can now paste raw lab text or dictate results and have them automatically mapped to ordered tests.

**Prerequisite data:** Result entry component (BM-4.1), CDR state persistence (BM-3.3).

---

## Stories

### Story 5.1: Paste Lab Results (AI Parsing)

**ID:** BM-5.1
**Points:** 5
**Dependencies:** BM-4.1

**Description:**
Add "Paste Results" button that opens a modal where physicians can paste raw lab text from their EHR. AI parses the text and maps values to ordered tests, marking abnormals and filling values automatically.

**Scope:**
- Create `PasteLabModal` component — textarea for pasting, "Parse" button, preview of parsed results before applying
- Create `POST /v1/build-mode/parse-results` endpoint — AI parsing of pasted lab text into structured results mapped to ordered tests
- Apply parsed results to the result entry cards (pre-fill status + values)

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/PasteLabModal.tsx` (new)
- `backend/src/index.ts` (new endpoint)
- `backend/src/promptBuilderBuildMode.ts` (parsing prompt)
- `frontend/src/lib/api.ts` (new API function)

**Acceptance Criteria:**
- [ ] "Paste Results" button opens modal with textarea
- [ ] Pasted text is sent to backend for AI parsing
- [ ] Parsed results shown as preview before applying (user can confirm/edit)
- [ ] Applied results map to ordered tests: status (unremarkable/abnormal), values, notes
- [ ] Tests not in pasted text remain unchanged
- [ ] CDR-required values auto-populate CDR components
- [ ] `pnpm check` passes, `pnpm build` passes

---

### Story 5.2: Dictation-to-Structured Results

**ID:** BM-5.2
**Points:** 3
**Dependencies:** BM-5.1

**Description:**
Enable dictation mode for S2 where the physician dictates results (e.g., "ECG showed ST depression, troponin 2.5, all other workup unremarkable") and AI maps the dictation to the ordered tests.

**Scope:**
- Add dictation textarea option in S2 (alternative to per-test entry)
- Reuse the `parse-results` endpoint with dictated text
- Same preview-before-apply flow as paste

**Files to modify:**
- `frontend/src/components/build-mode/EncounterEditor.tsx` (add dictation mode toggle)
- Backend: reuse existing `parse-results` endpoint (no new backend work)

**Acceptance Criteria:**
- [ ] Toggle between structured entry and dictation mode
- [ ] Dictated text parsed into structured results
- [ ] Same preview-before-apply flow as paste
- [ ] Can switch between modes without losing data
- [ ] `pnpm check` passes

---

### Story 5.3: Brief S2 CDR Output

**ID:** BM-5.3
**Points:** 3
**Dependencies:** BM-3.3, BM-4.1

**Description:**
Replace `MdmPreviewPanel` S2 output with a brief CDR calculations report. Shows working diagnosis, test summary, and completed CDR scores with one-line interpretations. No disposition guidance, no MDM complexity — just CDR results.

**Scope:**
- Create new S2 output component (replaces `MdmPreviewPanel` in S2 context)
- Show: working diagnosis, test count (X resulted, Y abnormal), completed CDR scores with expandable details
- Update S2 backend response to include CDR calculation results
- Update `buildSection2Prompt` to return CDR scores alongside current data

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/CdrResultsOutput.tsx` (new — S2 output)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (swap S2 preview)
- `frontend/src/components/build-mode/MdmPreviewPanel.tsx` (deprecate/remove)
- `backend/src/promptBuilderBuildMode.ts` (adjust S2 prompt for CDR output)
- `backend/src/index.ts` (adjust S2 response)

**Acceptance Criteria:**
- [ ] S2 output shows: working diagnosis, result summary, CDR scores
- [ ] Each CDR score expandable to show component breakdown
- [ ] No disposition guidance or MDM complexity in output
- [ ] "Continue to Section 3" button
- [ ] All CDR scores, results, and working diagnosis feed into S3 prompt
- [ ] `pnpm check` passes, `pnpm build` passes
