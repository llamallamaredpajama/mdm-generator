# Phase 3: CDR System

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-3.1, BM-3.2, BM-3.3
**Dependencies:** Phase 1 (BM-1.2, BM-1.3), Phase 2 (BM-2.3)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**This phase builds:** The CDR (Clinical Decision Rule) matching, tracking, and detail view system. CDRs are identified from S1 narrative, components are auto-populated where possible, and physicians can answer remaining components interactively. CDR state persists across all three sections.

**Prerequisite data:** CDR library (BM-1.2), extended encounter schema (BM-1.3), CDR summary card on dashboard (BM-2.3).

---

## Stories

### Story 3.1: CDR Matching Endpoint

**ID:** BM-3.1
**Points:** 5
**Dependencies:** BM-1.2, BM-1.3

**Description:**
Create `POST /v1/build-mode/match-cdrs` endpoint that takes S1 analysis output (differential, chief complaint, narrative) and returns relevant CDRs from the library with auto-populated components where data is available from the narrative.

**Scope:**
- New endpoint: `POST /v1/build-mode/match-cdrs`
- Input: encounterId (to read S1 data from Firestore), or direct data payload
- Logic: match CDRs by `applicableChiefComplaints` against S1 differential diagnoses
- For each matched CDR, attempt to auto-populate components from S1 narrative analysis (use Gemini to extract: age, risk factors, history details)
- Return: matched CDRs with component states (answered/pending/needs_results)
- Write matched CDRs to encounter `cdrTracking` field

**Files to create/modify:**
- `backend/src/index.ts` (new endpoint)
- `backend/src/buildModeSchemas.ts` (request/response schemas)
- `backend/src/promptBuilderBuildMode.ts` (CDR extraction prompt)

**Acceptance Criteria:**
- [ ] Endpoint matches CDRs based on S1 differential diagnoses
- [ ] Auto-populates CDR components where data is available from narrative
- [ ] Returns structured `cdrTracking` object with per-component state
- [ ] Components indicate source (section1, section2, user_input) and answered status
- [ ] Writes to encounter `cdrTracking` Firestore field
- [ ] Backend builds cleanly

---

### Story 3.2: CDR Detail Views (Mobile Swipe + Desktop Panel)

**ID:** BM-3.2
**Points:** 5
**Dependencies:** BM-3.1, BM-2.3

**Description:**
Build the CDR detail interaction views: `CdrSwipeView` for mobile (swipeable cards with tap-to-answer) and `CdrDetailPanel` for desktop (scrollable panel). Both allow answering completable CDR components and dismissing irrelevant CDRs.

**Scope:**
- Create `CdrSwipeView` (mobile) — swipeable card stack showing one CDR at a time, swipe up/down to cycle, swipe right to dismiss
- Create `CdrDetailPanel` (desktop) — scrollable panel showing all CDRs
- Both render CDR components: answered, answerable now (tap to select), needs results
- Dismiss logic: dismissed CDRs excluded from final MDM
- Auto-calculated scores for completed CDRs
- Wire into dashboard "View CDRs" navigation

**Files to create/modify:**
- `frontend/src/components/build-mode/mobile/CdrSwipeView.tsx` (new)
- `frontend/src/components/build-mode/desktop/CdrDetailPanel.tsx` (new)
- `frontend/src/components/build-mode/shared/CdrComponentInput.tsx` (new — reusable per-component input)
- `frontend/src/hooks/useCdrTracking.ts` (new — CDR state management)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (wire navigation)

**Acceptance Criteria:**
- [ ] Mobile: swipe up/down cycles CDRs, swipe right dismisses with warning
- [ ] Desktop: scrollable panel with all CDRs visible
- [ ] Answerable components (e.g., risk factors) show tap-to-select options
- [ ] AI suggestions shown as hints (e.g., "HTN + HLD detected, >=2?")
- [ ] Completed CDRs show calculated score + interpretation
- [ ] Dismissed CDRs marked with visual indicator and warning about liability
- [ ] Back navigation returns to S1 dashboard
- [ ] `pnpm check` passes

---

### Story 3.3: Cross-Section CDR State Persistence

**ID:** BM-3.3
**Points:** 3
**Dependencies:** BM-3.1, BM-3.2

**Description:**
Ensure CDR state persists across sections: components answered in S1 carry to S2, S2 results auto-populate remaining components (troponin value → HEART score troponin component), and completed scores are available at S3 finalize.

**Scope:**
- S2 result entry auto-matches test results to CDR components via `feedsCdrs` mapping
- When a CDR-required test gets a value in S2, auto-update the CDR component state
- CDR tracking state written to Firestore on each update
- S3 finalize reads completed CDR scores for inclusion in final MDM prompt
- Update `buildFinalizePrompt` to include structured CDR data (not just raw string)

**Files to modify:**
- `frontend/src/hooks/useCdrTracking.ts` (cross-section auto-population)
- `frontend/src/hooks/useEncounter.ts` (CDR state persistence on submit)
- `backend/src/promptBuilderBuildMode.ts` (structured CDR data in finalize prompt)
- `backend/src/index.ts` (read CDR tracking at finalize)

**Acceptance Criteria:**
- [ ] CDR components answered in S1 persist to S2 and S3
- [ ] S2 test result values auto-populate matching CDR components
- [ ] CDR scores recalculate when components are updated
- [ ] Finalize prompt includes structured CDR scores and interpretations
- [ ] Final MDM text includes CDR-specific language per completed rules
- [ ] Dismissed CDRs excluded from final output
- [ ] `pnpm check` passes, `pnpm build` passes
