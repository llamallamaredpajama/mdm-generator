# Phase 6: S3 Redesign

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-6.1, BM-6.2, BM-6.3
**Dependencies:** Phase 3 (BM-3.3), Phase 4 (BM-4.3), Phase 5 (BM-5.3), Phase 1 (BM-1.4)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**This phase replaces:** S3's single textarea with structured treatment input (CDR-suggested checkboxes + free-text), disposition selector with saved flows, and an updated finalize prompt that consumes all the structured data from S1/S2/S3.

**Prerequisite data:** CDR state persistence (BM-3.3), working diagnosis (BM-4.3), S2 CDR output (BM-5.3), user profile with saved flows (BM-1.4).

---

## Stories

### Story 6.1: Treatment Input with CDR Suggestions

**ID:** BM-6.1
**Points:** 3
**Dependencies:** BM-3.3, BM-4.3

**Description:**
Replace S3's single textarea with `TreatmentInput` — free-text dictation area plus optional CDR-suggested treatment checkboxes above. Only shows suggestions when a completed CDR includes specific treatment recommendations.

**Scope:**
- Create `TreatmentInput` component — CDR-suggested treatment checkboxes + free-text area
- CDR suggestions derived from completed CDR scores + risk levels (from CDR library `suggestedTreatments`)
- Selecting a checkbox appends treatment text to the free-text area
- Working diagnosis displayed at top for context

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/TreatmentInput.tsx` (new)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (replace S3 content)

**Acceptance Criteria:**
- [ ] CDR-suggested treatments shown as checkboxes only when applicable
- [ ] Selecting checkbox appends to free-text (user can edit after)
- [ ] Free-text area supports dictation
- [ ] Working diagnosis shown at top of S3 for context
- [ ] `pnpm check` passes

---

### Story 6.2: Disposition Selector with Saved Flows

**ID:** BM-6.2
**Points:** 5
**Dependencies:** BM-1.4, BM-6.1

**Description:**
Add `DispositionSelector` below the treatment input — radio buttons for disposition (discharge, observation, admit, ICU, transfer, AMA, LWBS, deceased), checkboxes for follow-up, and saved disposition flow quick-select buttons.

**Scope:**
- Create `DispositionSelector` — radio buttons + follow-up checkboxes + saved flow buttons
- Create `SaveDispoFlowModal` — save current selection as a reusable flow
- Load saved flows from user profile API
- One-tap flow application (sets disposition + follow-up in one action)
- Customizable disposition and follow-up options (user can edit lists in settings)

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/DispositionSelector.tsx` (new)
- `frontend/src/components/build-mode/shared/SaveDispoFlowModal.tsx` (new)
- `frontend/src/hooks/useDispoFlows.ts` (new — fetch/save flows)

**Acceptance Criteria:**
- [ ] Disposition radio buttons match spec list (8 options)
- [ ] Follow-up checkboxes (PCP, specialist, return to ED, custom)
- [ ] Saved flows shown as quick-select buttons at bottom
- [ ] One-tap flow applies full combination
- [ ] "Save current as flow" creates new saved flow
- [ ] `pnpm check` passes

---

### Story 6.3: Update Finalize Prompt for Structured Data

**ID:** BM-6.3
**Points:** 3
**Dependencies:** BM-6.1, BM-6.2, BM-5.3

**Description:**
Update the `buildFinalizePrompt` and finalize endpoint to consume the new structured S2 and S3 data: structured test results, CDR scores, working diagnosis, selected treatments, disposition, and follow-up. The final MDM should incorporate all of this structured data.

**Scope:**
- Update `buildFinalizePrompt` to include: structured test results (not just raw text), completed CDR scores with interpretations, working diagnosis, treatment selections, disposition + follow-up
- Update finalize endpoint to read new structured data from encounter doc
- Ensure final MDM text includes CDR-specific documentation (e.g., "HEART score 5 — moderate risk")

**Files to modify:**
- `backend/src/promptBuilderBuildMode.ts` (update finalize prompt)
- `backend/src/index.ts` (update finalize endpoint data reading)

**Acceptance Criteria:**
- [ ] Finalize prompt includes structured test results, CDR scores, working diagnosis, treatments, disposition
- [ ] Final MDM text incorporates CDR scores with interpretations
- [ ] Final MDM text reflects selected disposition and follow-up
- [ ] All CDR documentation follows medical documentation standards
- [ ] Backend builds cleanly
