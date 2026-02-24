# Phase 4: S2 Results Redesign

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-4.1, BM-4.2, BM-4.3
**Dependencies:** Phase 1 (BM-1.3), Phase 2 (BM-2.2)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**This phase replaces:** S2's blank textarea with structured result entry — per-test unremarkable/abnormal selection, CDR value badges, quick status actions, and working diagnosis selection. The physician moves from dictating free-text results to tapping through structured result cards.

**Prerequisite data:** Extended encounter schema (BM-1.3), workup card with order selection (BM-2.2).

---

## Stories

### Story 4.1: Result Entry Component

**ID:** BM-4.1
**Points:** 5
**Dependencies:** BM-1.3, BM-2.2

**Description:**
Replace S2's blank textarea with structured `ResultEntry` components for each selected test. Each test shows unremarkable/abnormal radio, CDR badge for tests that feed CDRs, and expandable abnormal detail entry.

**Scope:**
- Create `ResultEntry` component — per-test card with unremarkable/abnormal radio buttons
- Create `ResultDetailExpanded` — expanded view for abnormal tests with quick-select findings and free-text notes
- CDR badge on tests that feed active CDRs, with value input field shown by default
- Wire into `EncounterEditor` replacing S2 textarea
- Replace `SectionPanel` textarea approach for S2 with the new result entry list

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/ResultEntry.tsx` (new)
- `frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx` (new)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (replace S2 content)

**Acceptance Criteria:**
- [ ] Each selected test from S1 workup appears as a result entry card
- [ ] Unremarkable/abnormal radio buttons per test (NOT normal/abnormal — "unremarkable" is the clinical term)
- [ ] CDR badge on tests that feed active CDRs
- [ ] CDR-required value input shown by default (not hidden behind button)
- [ ] Warning text on CDR tests: "Value needed for [CDR name]"
- [ ] Abnormal detail entry shows quick-select checkboxes (test-specific findings) + free-text notes
- [ ] `pnpm check` passes

---

### Story 4.2: Quick Status Actions & Progress

**ID:** BM-4.2
**Points:** 3
**Dependencies:** BM-4.1

**Description:**
Add the one-tap quick actions for S2: "All Results Unremarkable" (top of screen), "All unselected = unremarkable" (bottom), and the visual progress indicator.

**Scope:**
- "All Results Unremarkable" button at top — marks everything unremarkable, enables submit
- "All unselected = unremarkable" button at bottom — marks only un-responded tests
- Create `ProgressIndicator` — visual dots + count + abnormal count
- "+ Add Test" button that opens `OrderSelector` (orders never locked)

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/ProgressIndicator.tsx` (new)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (integrate quick actions)

**Acceptance Criteria:**
- [ ] "All Results Unremarkable" one-tap marks everything and enables submit
- [ ] "All unselected = unremarkable" marks only pending tests
- [ ] CDR-required values still highlighted even after "All Unremarkable"
- [ ] Progress indicator shows visual dots + resulted count + abnormal count
- [ ] "+ Add Test" opens order selector, new tests appear in result list
- [ ] `pnpm check` passes

---

### Story 4.3: Working Diagnosis Selection

**ID:** BM-4.3
**Points:** 3
**Dependencies:** BM-4.1

**Description:**
Add the `WorkingDiagnosisInput` at the bottom of S2 results entry. AI suggests diagnoses based on S1 differential refined by S2 results. User selects or types custom. This feeds into S3 for treatment suggestions and disposition pre-population.

**Scope:**
- Create `WorkingDiagnosisInput` component — radio buttons for AI-suggested diagnoses + "Other" with free text
- Create `POST /v1/build-mode/suggest-diagnosis` endpoint — given S1 differential + S2 results, rank working diagnosis options
- Selected diagnosis stored in encounter and passed to S3

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/WorkingDiagnosisInput.tsx` (new)
- `backend/src/index.ts` (new endpoint)
- `frontend/src/lib/api.ts` (new API function)

**Acceptance Criteria:**
- [ ] AI suggests 3-5 working diagnoses ranked by results
- [ ] Radio button selection + "Other" free text option
- [ ] Selected diagnosis displayed at top of S2 output and S3 input
- [ ] Informs S3 treatment suggestions and disposition pre-population
- [ ] `pnpm check` passes, `pnpm build` passes
