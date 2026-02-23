# Phase 1: Data Foundation

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-1.1, BM-1.2, BM-1.3, BM-1.4
**Dependencies:** None (this is the foundation phase)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**Existing System:**
- 3-section progressive MDM generation (S1 → S2 → S3 → Final MDM)
- React 19 + Vite 7 + TypeScript (frontend), Express + Vertex AI Gemini + Zod (backend)
- Firebase Auth + Firestore, mobile-first responsive with `useIsMobile()` hook
- Firestore `onSnapshot` for real-time sync, local content state in `useEncounter` hook

**This phase creates:** Master libraries (test catalog, CDR definitions), extended encounter schema, and user profile data structures that all subsequent phases consume.

---

## Stories

### Story 1.1: Master Test Library

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

### Story 1.2: CDR Library

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

### Story 1.3: Encounter Schema Extension

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

### Story 1.4: User Profile Schema Extension

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
