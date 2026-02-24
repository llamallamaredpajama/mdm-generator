# Epic: Build Mode UX Rebuild — Clinical Intelligence Core

**Epic ID:** BM-REBUILD
**Created:** 2026-02-23
**Source Spec:** `docs/buildmode-prototype.md`
**Branch:** `build-mode-refactor`

---

## Epic Goal

Transform Build Mode from a 3-section text-dictation workflow into a clinical decision support companion — replacing blank textareas with structured inputs (order selection, result entry, CDR tracking), adding a rich S1 output dashboard, and enabling physicians to build reusable clinical playbooks (order sets, disposition flows, report templates).

## Existing System Context

- **Current functionality**: 3-section progressive MDM generation (S1 dictation → S2 dictation → S3 dictation → Final MDM). S1 outputs a `DifferentialPreview` list. S2 outputs an `MdmPreviewPanel` with 4 collapsible text sections. S3 outputs the final copy-pastable MDM.
- **Technology stack**: React 19 + Vite 7 + TypeScript (frontend), Express + Vertex AI Gemini + Zod (backend), Firebase Auth + Firestore, mobile-first responsive with `useIsMobile()` hook
- **Key patterns**: Firestore `onSnapshot` for real-time sync, local content state in `useEncounter` hook, section progression enforced both client and server-side, `z.any()` for flexible LLM output parsing, split Firestore writes (client for S1/S2, server for S3)
- **Integration points**: Surveillance enrichment (CDC adapters), CDR context (string-based, stored on encounter doc), quota management, Stripe subscription tiers

## Enhancement Details

**What's being changed:**
1. S1 output: flat differential list → 4-area dashboard (differential + CDRs + workup + trends)
2. S2 input: blank textarea → structured result entry (unremarkable/abnormal per test, CDR value fields, paste-parse)
3. S2 output: full MdmPreview → brief CDR calculations report
4. S3 input: single textarea → treatment free-text + structured disposition selector
5. CDR tracking: unstructured string → structured cross-section state machine
6. New user profile data: order sets, disposition flows, report templates, customizable options
7. New master libraries: test catalog, CDR definitions (Firestore collections)
8. ~8 new backend endpoints for libraries, user data CRUD, AI parsing

**How it integrates:**
- Replaces `DifferentialPreview` and `MdmPreviewPanel` components
- Extends `EncounterEditor` to render new section UIs
- Extends Firestore encounter schema (backward-compatible additions)
- Adds new Firestore collections (`testLibrary`, `cdrLibrary`) and user subcollections
- Modifies prompt builders to consume structured data instead of raw text

---

## Stories

### Phase 1: Data Foundation

---

#### Story 1: Master Test Library

**ID:** BM-1.1
**Points:** 3
**Dependencies:** None

**Description:**
Create the master test library as a Firestore collection and a read-only GET endpoint. This is the reference catalog for all ER tests that the order selection UI, result entry UI, and CDR system will consume.

**Scope:**
- Create `testLibrary` Firestore collection with seed data (~60 tests across 4 categories: labs, imaging, procedures/POC)
- Create `GET /v1/libraries/tests` endpoint (authenticated, cached response)
- Define TypeScript types for `TestDefinition` (id, name, category, subcategory, commonIndications, unit, normalRange, quickFindings, feedsCdrs)
- Create seed script in `scripts/seed-test-library.ts`

**Files to create/modify:**
- `backend/src/types/libraries.ts` (new — shared types)
- `backend/src/index.ts` (new endpoint)
- `scripts/seed-test-library.ts` (new — Firestore seeder)
- `frontend/src/types/libraries.ts` (new — mirror types for frontend)

**Acceptance Criteria:**
- [ ] `GET /v1/libraries/tests` returns categorized test list matching spec categories (Labs, Imaging, Procedures/POC)
- [ ] Each test has: id, name, category, subcategory, unit (if applicable), quickFindings (if applicable), feedsCdrs (array of CDR ids)
- [ ] Tests from spec are all present: CBC, BMP, CMP, Troponin, BNP, D-dimer, UA, Lipase, LFTs, Coags, ECG, CXR, CT variants, US variants, etc.
- [ ] Endpoint requires authentication (Firebase ID token)
- [ ] Seed script can be run idempotently
- [ ] Backend builds cleanly (`pnpm build`)

---

#### Story 2: CDR Library

**ID:** BM-1.2
**Points:** 5
**Dependencies:** None (parallel with BM-1.1)

**Description:**
Create the CDR (Clinical Decision Rule) library as a Firestore collection and GET endpoint. Each CDR definition includes its components, scoring formula, interpretation thresholds, and suggested treatments per risk level.

**Scope:**
- Create `cdrLibrary` Firestore collection with definitions for: HEART, PERC, Wells PE, Wells DVT, PECARN, Ottawa Ankle, Ottawa Knee, Canadian C-spine, NEXUS, Centor/McIsaac, CHA2DS2-VASc, CURB-65, qSOFA
- Create `GET /v1/libraries/cdrs` endpoint
- Define TypeScript types for `CdrDefinition` (id, name, fullName, applicableChiefComplaints, components with source/type/options, scoring ranges, suggestedTreatments)
- Create seed script in `scripts/seed-cdr-library.ts`

**Files to create/modify:**
- `backend/src/types/libraries.ts` (extend with CDR types)
- `backend/src/index.ts` (new endpoint)
- `scripts/seed-cdr-library.ts` (new)
- `frontend/src/types/libraries.ts` (extend)

**Acceptance Criteria:**
- [ ] `GET /v1/libraries/cdrs` returns all CDR definitions
- [ ] Each CDR has: components with source field (section1, section2, user_input), scoring ranges with risk levels and interpretations, suggested treatments per risk level
- [ ] HEART score components match spec exactly: History (select 0/1/2), ECG (select 0/1/2), Age (ranges), Risk Factors (select 0/1/≥2), Troponin (select 0/1/2)
- [ ] `applicableChiefComplaints` allows CDR matching from S1 narrative
- [ ] `feedsCdrs` in test library cross-references CDR component sources
- [ ] Backend builds cleanly

---

#### Story 3: Encounter Schema Extension

**ID:** BM-1.3
**Points:** 3
**Dependencies:** BM-1.1, BM-1.2

**Description:**
Extend the encounter Firestore document schema and frontend types to support structured S2 data (selectedTests, testResults, workingDiagnosis), CDR tracking state, and structured S3 data (treatments, disposition, followUp). Must be backward-compatible — existing encounters without new fields continue to work.

**Scope:**
- Extend `EncounterDocument` type with `section2.selectedTests`, `section2.testResults`, `section2.workingDiagnosis`, `cdrTracking`, `section3.treatments`, `section3.disposition`, `section3.followUp`
- Update `buildModeSchemas.ts` with new Zod schemas for the structured fields
- Add defensive defaults in `useEncounter.ts` for encounters missing new fields
- Do NOT change existing endpoint behavior yet (that happens in later stories)

**Files to modify:**
- `frontend/src/types/encounter.ts` (extend types)
- `backend/src/buildModeSchemas.ts` (new schemas)
- `frontend/src/hooks/useEncounter.ts` (defensive defaults)

**Acceptance Criteria:**
- [ ] New types defined: `TestResult`, `CdrTracking`, `CdrComponentState`, `WorkingDiagnosis`, `DispositionData`
- [ ] Existing encounters without new fields render without errors (backward compat)
- [ ] Zod schemas validate new structured data shapes
- [ ] Frontend and backend types are aligned
- [ ] `pnpm check` passes (frontend), `pnpm build` passes (backend)

---

#### Story 4: User Profile Schema Extension

**ID:** BM-1.4
**Points:** 3
**Dependencies:** BM-1.1

**Description:**
Extend user profile in Firestore to support order sets, disposition flows, report templates, and customizable option lists. Create CRUD endpoints for each.

**Scope:**
- Define types: `OrderSet`, `DispositionFlow`, `ReportTemplate`
- Create 3 sets of CRUD endpoints:
  - `GET/POST/PUT/DELETE /v1/user/order-sets`
  - `GET/POST/PUT/DELETE /v1/user/dispo-flows`
  - `GET/POST/PUT/DELETE /v1/user/report-templates`
- Store as subcollections under user doc (or arrays if small — decide based on expected size)
- Include `usageCount` tracking (increment on use)

**Files to create/modify:**
- `backend/src/types/userProfile.ts` (new)
- `backend/src/index.ts` (6+ new endpoints)
- `frontend/src/types/userProfile.ts` (new — mirror types)
- `frontend/src/lib/api.ts` (new API client functions)

**Acceptance Criteria:**
- [ ] All CRUD operations work for order sets, dispo flows, and report templates
- [ ] Order sets have: id, name, tests[], tags[], createdAt, usageCount
- [ ] Disposition flows have: id, name, disposition, followUp[], createdAt, usageCount
- [ ] Report templates have: id, testId, name, text, defaultStatus, usageCount
- [ ] Endpoints require authentication and scope to authenticated user
- [ ] Backend builds cleanly

---

### Phase 2: S1 Dashboard

---

#### Story 5: Dashboard Output Layout

**ID:** BM-2.1
**Points:** 5
**Dependencies:** BM-1.3

**Description:**
Replace `DifferentialPreview` with a new `DashboardOutput` component that renders the 4-area S1 output dashboard: Differential, CDRs, Workup, Regional Trends. This story builds the layout shell with the differential area fully functional; CDR, Workup, and Trends cards are stubbed with placeholder content until their respective stories are complete.

**Scope:**
- Create `DashboardOutput` component in `build-mode/shared/`
- Create `DifferentialList` component with color-coded urgency (🔴 emergent, 🟡 urgent, 🟢 routine), collapsible items showing reasoning + key tests + CDR association
- Wire into `EncounterEditor.tsx` replacing `DifferentialPreview` in `getSectionPreview()`
- Responsive: stacked on mobile, 2-column grid on desktop for CDR + Workup cards
- Stub CDR card, Workup card, and Regional Trends card with existing data where available

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (new)
- `frontend/src/components/build-mode/shared/DifferentialList.tsx` (new)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (swap preview)
- `frontend/src/components/build-mode/DifferentialPreview.tsx` (deprecate/remove)

**Acceptance Criteria:**
- [ ] S1 output renders as a 4-area dashboard (differential fully functional, others stubbed)
- [ ] Each differential item shows urgency color dot, diagnosis name, expand arrow
- [ ] Expanded item shows reasoning text, recommended tests, CDR association (if any)
- [ ] "Accept Workup & Continue" button advances to S2
- [ ] Mobile: single column stacked layout
- [ ] Desktop: differential full-width top, CDR + Workup side-by-side, Trends full-width bottom
- [ ] No regression: existing S1 submission flow still works
- [ ] `pnpm check` passes

---

#### Story 6: Workup Card with Order Selection

**ID:** BM-2.2
**Points:** 5
**Dependencies:** BM-1.1, BM-2.1

**Description:**
Build the `WorkupCard` on the S1 dashboard showing AI-recommended tests as pre-checked boxes, with "Accept All" one-tap and "Edit" to open full `OrderSelector`. Implement the full categorized test checklist using the test library.

**Scope:**
- Create `WorkupCard` component showing recommended tests as checkboxes (directly tappable without opening card)
- Create `OrderSelector` component — full categorized checklist (Labs, Imaging, Procedures/POC) loaded from test library endpoint
- "Accept All" button checks all recommended tests
- "Edit" navigates to full `OrderSelector` view (back button returns to dashboard)
- Selected tests count shown on card
- Create frontend hook `useTestLibrary()` to fetch and cache the test library

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/WorkupCard.tsx` (new)
- `frontend/src/components/build-mode/shared/OrderSelector.tsx` (new)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (integrate WorkupCard)
- `frontend/src/hooks/useTestLibrary.ts` (new)

**Acceptance Criteria:**
- [ ] Workup card shows AI-recommended tests as pre-checked boxes
- [ ] Checkboxes tappable directly on dashboard (no need to open card)
- [ ] "Accept All" checks all recommended, "Edit" opens full order selector
- [ ] Full order selector shows categorized test list from test library
- [ ] Selected count displayed, selections persist when navigating back to dashboard
- [ ] `pnpm check` passes

---

#### Story 7: CDR Summary Card

**ID:** BM-2.3
**Points:** 3
**Dependencies:** BM-1.2, BM-2.1

**Description:**
Build the `CdrCard` on the S1 dashboard showing identified CDRs with completion status indicators (◐ partial, ● completable, ○ needs results). "View CDRs" link navigates to CDR detail view (implemented in Phase 3).

**Scope:**
- Create `CdrCard` component showing CDR names with progress indicators
- Parse CDR data from S1 LLM response (currently in `cdrContext` string) and/or from new CDR matching logic
- Show legend: ◐ partial / ● completable now / ○ needs results
- "View CDRs →" button (navigation target built in BM-3.1)

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/CdrCard.tsx` (new)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (integrate CdrCard)

**Acceptance Criteria:**
- [ ] CDR card renders on S1 dashboard with identified CDRs
- [ ] Each CDR shows name + completion indicator symbol
- [ ] "View CDRs →" button present (can be non-functional until BM-3.1)
- [ ] Graceful fallback when no CDRs are identified
- [ ] `pnpm check` passes

---

#### Story 8: Regional Trends Card Integration

**ID:** BM-2.4
**Points:** 2
**Dependencies:** BM-2.1

**Description:**
Integrate the existing surveillance/trend analysis data into the dashboard as a `RegionalTrendsCard`. Concise one-line-per-source summary by default, expandable to full detail view.

**Scope:**
- Create `RegionalTrendsCard` component (wraps existing trend data from `TrendAnalysisContext`)
- Concise view: one line per CDC source (respiratory, wastewater, NNDSS)
- "More" button expands to `RegionalTrendsDetail` view with full explanations
- Integrate into `DashboardOutput`

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/RegionalTrendsCard.tsx` (new)
- `frontend/src/components/build-mode/shared/RegionalTrendsDetail.tsx` (new)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (integrate)

**Acceptance Criteria:**
- [ ] Trends card shows on dashboard when surveillance data is available
- [ ] Concise summary with expand capability
- [ ] Uses existing `TrendAnalysisContext` data (no new API calls)
- [ ] Hidden/collapsed when no surveillance data (user has trends disabled)
- [ ] `pnpm check` passes

---

### Phase 3: CDR System

---

#### Story 9: CDR Matching Endpoint

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

#### Story 10: CDR Detail Views (Mobile Swipe + Desktop Panel)

**ID:** BM-3.2
**Points:** 5
**Dependencies:** BM-3.1, BM-2.3

**Description:**
Build the CDR detail interaction views: `CdrSwipeView` for mobile (swipeable cards with tap-to-answer) and `CdrDetailPanel` for desktop (scrollable panel). Both allow answering completable CDR components and dismissing irrelevant CDRs.

**Scope:**
- Create `CdrSwipeView` (mobile) — swipeable card stack showing one CDR at a time, swipe up/down to cycle, swipe right to dismiss
- Create `CdrDetailPanel` (desktop) — scrollable panel showing all CDRs
- Both render CDR components: ✅ answered, ⬜ answerable now (tap to select), ○ needs results
- Dismiss logic: dismissed CDRs excluded from final MDM
- Auto-calculated scores for completed CDRs
- Wire into dashboard "View CDRs →" navigation

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
- [ ] AI suggestions shown as hints (e.g., "💡 HTN + HLD detected → ≥2?")
- [ ] Completed CDRs show calculated score + interpretation
- [ ] Dismissed CDRs marked with visual indicator and warning about liability
- [ ] Back navigation returns to S1 dashboard
- [ ] `pnpm check` passes

---

#### Story 11: Cross-Section CDR State Persistence

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

---

### Phase 4: S2 Results Redesign

---

#### Story 12: Result Entry Component

**ID:** BM-4.1
**Points:** 5
**Dependencies:** BM-1.3, BM-2.2

**Description:**
Replace S2's blank textarea with structured `ResultEntry` components for each selected test. Each test shows unremarkable/abnormal radio, CDR badge (⭐) for tests that feed CDRs, and expandable abnormal detail entry.

**Scope:**
- Create `ResultEntry` component — per-test card with unremarkable/abnormal radio buttons
- Create `ResultDetailExpanded` — expanded view for abnormal tests with quick-select findings and free-text notes
- "⭐ CDR" badge on tests that feed active CDRs, with value input field shown by default
- Wire into `EncounterEditor` replacing S2 textarea
- Replace `SectionPanel` textarea approach for S2 with the new result entry list

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/ResultEntry.tsx` (new)
- `frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx` (new)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (replace S2 content)

**Acceptance Criteria:**
- [ ] Each selected test from S1 workup appears as a result entry card
- [ ] Unremarkable/abnormal radio buttons per test (NOT normal/abnormal — "unremarkable" is the clinical term)
- [ ] ⭐ CDR badge on tests that feed active CDRs
- [ ] CDR-required value input shown by default (not hidden behind button)
- [ ] Warning text on CDR tests: "⚠️ Value needed for [CDR name]"
- [ ] Abnormal detail entry shows quick-select checkboxes (test-specific findings) + free-text notes
- [ ] `pnpm check` passes

---

#### Story 13: Quick Status Actions & Progress

**ID:** BM-4.2
**Points:** 3
**Dependencies:** BM-4.1

**Description:**
Add the one-tap quick actions for S2: "All Results Unremarkable" (top of screen), "All unselected = unremarkable" (bottom), and the visual progress indicator.

**Scope:**
- "All Results Unremarkable" button at top — marks everything unremarkable, enables submit
- "All unselected = unremarkable" button at bottom — marks only un-responded tests
- Create `ProgressIndicator` — visual dots (●●●○○○) + count + abnormal count
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

#### Story 14: Working Diagnosis Selection

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

---

### Phase 5: S2 Intelligence

---

#### Story 15: Paste Lab Results (AI Parsing)

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
- [ ] "📋 Paste Results" button opens modal with textarea
- [ ] Pasted text is sent to backend for AI parsing
- [ ] Parsed results shown as preview before applying (user can confirm/edit)
- [ ] Applied results map to ordered tests: status (unremarkable/abnormal), values, notes
- [ ] Tests not in pasted text remain unchanged
- [ ] CDR-required values auto-populate CDR components
- [ ] `pnpm check` passes, `pnpm build` passes

---

#### Story 16: Dictation-to-Structured Results

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

#### Story 17: Brief S2 CDR Output

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
- [ ] "Continue to Section 3 →" button
- [ ] All CDR scores, results, and working diagnosis feed into S3 prompt
- [ ] `pnpm check` passes, `pnpm build` passes

---

### Phase 6: S3 Redesign

---

#### Story 18: Treatment Input with CDR Suggestions

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

#### Story 19: Disposition Selector with Saved Flows

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

#### Story 20: Update Finalize Prompt for Structured Data

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

---

### Phase 7: Order Sets

---

#### Story 21: Order Set Save & Suggest

**ID:** BM-7.1
**Points:** 5
**Dependencies:** BM-2.2, BM-1.4

**Description:**
Complete the order set lifecycle: saving current selections as a named order set with tags, and AI-suggesting matching saved order sets on the S1 dashboard based on the presentation.

**Scope:**
- Create `SaveOrderSetModal` — name, included tests, optional tags
- Create `OrderSetSuggestion` card on S1 dashboard Workup area — AI matches user's saved order sets to S1 presentation
- "Apply All" / "Customize" / "Skip" buttons on suggestion card
- Order set management in settings page (list, edit, delete)

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/SaveOrderSetModal.tsx` (new)
- `frontend/src/components/build-mode/shared/OrderSetSuggestion.tsx` (new)
- `frontend/src/components/build-mode/shared/WorkupCard.tsx` (integrate suggestion)
- `frontend/src/hooks/useOrderSets.ts` (new — fetch/save/match)
- `frontend/src/routes/Settings.tsx` (order set management section)

**Acceptance Criteria:**
- [ ] Save modal captures name, tests, tags
- [ ] Saved order sets appear in settings with edit/delete
- [ ] S1 dashboard suggests matching order set based on presentation
- [ ] "Apply All" checks all tests from set, "Customize" opens order selector with set pre-loaded
- [ ] Usage count incremented when order set is applied
- [ ] `pnpm check` passes

---

#### Story 22: Report Templates

**ID:** BM-7.2
**Points:** 3
**Dependencies:** BM-4.1, BM-1.4

**Description:**
Add saved report templates to the abnormal result detail entry. Physicians can save common result descriptions (e.g., "NSR, normal intervals" for ECG) and recall them with one tap.

**Scope:**
- Add saved report template display in `ResultDetailExpanded`
- Create `SaveReportTemplateModal`
- Templates saved per-test (ECG templates only show for ECG results)
- Tapping a template auto-fills notes field and optionally sets unremarkable/abnormal status

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/SaveReportTemplateModal.tsx` (new)
- `frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx` (integrate templates)
- `frontend/src/hooks/useReportTemplates.ts` (new — fetch/save)

**Acceptance Criteria:**
- [ ] Saved templates shown in result detail view for matching test
- [ ] One-tap applies template text to notes field
- [ ] Templates can specify default status (unremarkable/abnormal)
- [ ] Save modal captures: test, name, text, default status
- [ ] `pnpm check` passes

---

### Phase 8: Persistence & Polish

---

#### Story 23: S2 Submission Flow Refactor

**ID:** BM-8.1
**Points:** 5
**Dependencies:** BM-4.1, BM-4.2, BM-4.3, BM-5.3

**Description:**
Refactor the S2 submission flow end-to-end: instead of sending raw text to `process-section2`, send structured data (selectedTests, testResults, workingDiagnosis). Update the backend endpoint to consume structured data and return CDR-focused output.

**Scope:**
- Update `Section2RequestSchema` to accept structured result data alongside or instead of raw content
- Update `processSection2` endpoint to build prompt from structured data
- Update `buildSection2Prompt` to format structured results for the LLM
- Update frontend `submitSection(2)` to send structured data
- Maintain backward compatibility for existing encounters that used text-based S2

**Files to modify:**
- `backend/src/buildModeSchemas.ts` (updated S2 request schema)
- `backend/src/index.ts` (updated S2 endpoint)
- `backend/src/promptBuilderBuildMode.ts` (updated S2 prompt)
- `frontend/src/hooks/useEncounter.ts` (updated S2 submit)
- `frontend/src/lib/api.ts` (updated S2 API call)

**Acceptance Criteria:**
- [ ] S2 endpoint accepts structured test results data
- [ ] Prompt builder formats structured data clearly for LLM
- [ ] CDR scores returned in S2 response
- [ ] Old encounters with text-based S2 still work (backward compat)
- [ ] End-to-end flow: S1 → dashboard → workup → S2 results → CDR output → S3
- [ ] `pnpm check` passes, `pnpm build` passes

---

#### Story 24: Desktop Layout Optimization

**ID:** BM-8.2
**Points:** 3
**Dependencies:** BM-2.1

**Description:**
Optimize the dashboard and S2/S3 layouts for desktop with expanded views: side panels, wider grids, and more content visible at once. The dashboard should use the full desktop width rather than being constrained to mobile column.

**Scope:**
- Dashboard: 2-column layout (differential + CDR detail side-by-side) on desktop
- S2 results: wider cards, side-by-side layout for test results on desktop
- S3: treatment and disposition side-by-side on desktop
- Use existing `useIsMobile()` hook for responsive switching

**Files to modify:**
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (desktop layout)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (desktop S2/S3 layout)
- Various component CSS/styles

**Acceptance Criteria:**
- [ ] Dashboard uses full desktop width with multi-column layout
- [ ] S2 results show wider cards with more visible detail
- [ ] S3 treatment + disposition shown side-by-side on desktop
- [ ] Mobile layout unchanged (single column stacked)
- [ ] `pnpm check` passes

---

#### Story 25: Accessibility Pass

**ID:** BM-8.3
**Points:** 3
**Dependencies:** All previous stories

**Description:**
Comprehensive accessibility pass over all new Build Mode components: keyboard navigation, screen reader labels, focus management, color contrast, ARIA attributes.

**Scope:**
- Keyboard navigation for all interactive elements (checkboxes, radios, expandable items)
- ARIA labels on CDR cards, result entries, progress indicators
- Focus management: return focus after modal close, CDR swipe view keyboard support
- Color contrast: urgency colors (🔴🟡🟢) must have sufficient contrast + text labels for colorblind users
- Screen reader announcements for state changes (test resulted, CDR completed)

**Files to modify:**
- All new components created in this epic (accessibility attributes)
- Focus management in modal components

**Acceptance Criteria:**
- [ ] All interactive elements reachable via keyboard (Tab, Enter, Space, Arrow keys)
- [ ] Screen readers announce: urgency levels, CDR completion status, result status
- [ ] Modals trap focus and return focus on close
- [ ] Color is not the only indicator for urgency (text labels supplement dots)
- [ ] `pnpm check` passes

---

## Dependency Graph

```
BM-1.1 (Test Library)  ──┬──→ BM-2.2 (Workup Card) ──→ BM-7.1 (Order Sets)
                          │                               BM-7.2 (Report Templates)
                          ├──→ BM-1.3 (Encounter Schema) ──→ BM-4.1 (Result Entry)
                          └──→ BM-1.4 (User Profile)   ──→ BM-6.2 (Disposition)
                                                          └→ BM-7.1, BM-7.2

BM-1.2 (CDR Library)   ──┬──→ BM-1.3 (Encounter Schema)
                          ├──→ BM-2.3 (CDR Card)
                          └──→ BM-3.1 (CDR Matching)  ──→ BM-3.2 (CDR Views) ──→ BM-3.3 (CDR Persistence)

BM-1.3 (Encounter Schema) ──→ BM-2.1 (Dashboard) ──→ BM-2.2, BM-2.3, BM-2.4, BM-8.2
                              BM-4.1 (Result Entry) ──→ BM-4.2 (Quick Status)
                                                       BM-4.3 (Working Dx)
                                                       BM-5.1 (Paste Results) ──→ BM-5.2 (Dictation)

BM-3.3 + BM-4.3        ──→ BM-6.1 (Treatment Input) ──→ BM-6.3 (Finalize Prompt)
BM-5.3 (S2 Output)     ──→ BM-6.3 (Finalize Prompt)
BM-6.1 + BM-6.2        ──→ BM-6.3 (Finalize Prompt)

BM-4.1 + BM-4.2 + BM-4.3 + BM-5.3 ──→ BM-8.1 (S2 Submission Refactor)

All stories ──→ BM-8.3 (Accessibility)
```

## Compatibility Requirements

- [x] Existing encounters without new fields continue to render (defensive defaults)
- [x] S1 submission flow unchanged (dictation input is the same)
- [x] S3 finalize still produces the same FinalMdm shape for copy-to-clipboard
- [x] Quick Mode unaffected by Build Mode changes
- [x] Surveillance enrichment continues to work (integrated into dashboard card)
- [x] Stripe subscription tiers and quota management unchanged
- [x] Firebase Auth flow unchanged

## Risk Mitigation

- **Primary Risk:** Schema changes break existing encounters
- **Mitigation:** All new fields are optional with defensive defaults; old encounters get `cdrTracking: {}`, `section2.selectedTests: []`, etc.
- **Rollback Plan:** Feature branch (`build-mode-refactor`) — can revert to main at any point

- **Secondary Risk:** S2 structured data changes break the S2→S3 prompt chain
- **Mitigation:** BM-8.1 (S2 Submission Refactor) maintains backward compat; old text-based S2 data still processed

## Definition of Done

- [ ] All 25 stories completed with acceptance criteria met
- [ ] Full end-to-end flow works: S1 dictation → dashboard → workup selection → S2 result entry → CDR output → S3 treatment + disposition → final MDM
- [ ] Existing encounters without new data render without errors
- [ ] Quick Mode unaffected
- [ ] `cd frontend && pnpm check` passes
- [ ] `cd backend && pnpm build` passes
- [ ] No PHI in any code, logs, or outputs
- [ ] Accessibility: all new components keyboard-navigable with screen reader support
- [ ] Mobile and desktop layouts responsive and functional

---

## Story Manager Handoff

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running React 19 + Vite 7 + TypeScript (frontend) and Express + Vertex AI Gemini + Zod (backend), with Firebase Auth + Firestore
- Integration points: Firestore encounter documents, existing `useEncounter` hook, `EncounterEditor` composition, `buildModeSchemas.ts` Zod validation, `promptBuilderBuildMode.ts` prompt construction, surveillance context from `TrendAnalysisContext`, existing card-based encounter management (mobile wallet + desktop kanban)
- Existing patterns to follow: `onSnapshot` for real-time sync, local content state in hooks, PHI confirmation before submission, defensive response unwrapping for LLM output, split Firestore writes (client S1/S2, server S3)
- Critical compatibility requirements: existing encounters must render without errors, Quick Mode must be unaffected, S3 FinalMdm shape must be preserved for copy-to-clipboard
- Each story must include verification that existing functionality remains intact

The epic should maintain system integrity while delivering a clinical decision support dashboard that transforms Build Mode from text-dictation into structured clinical workflow."

---

_Generated from `docs/buildmode-prototype.md` using BMad Brownfield Create Epic task_
