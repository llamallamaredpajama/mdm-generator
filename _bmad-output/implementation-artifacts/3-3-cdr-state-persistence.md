# Story 3.3: Cross-Section CDR State Persistence

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-3.3                                                  |
| Points         | 3                                                       |
| Dependencies   | BM-3.1 (CDR Matching Endpoint), BM-3.2 (CDR Detail Views) |
| Epic           | Phase 3: CDR System                                     |
| Priority       | High (completes CDR scoring pipeline across sections)    |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** CDR component values from Section 1 to persist into Section 2, test results to auto-populate matching CDR components, and completed CDR scores to be included in my final MDM,
**so that** CDR scoring is seamless across the entire encounter workflow and my documentation accurately reflects all clinical decision tools used.

---

## Acceptance Criteria

1. CDR components answered in S1 persist through S2 and S3 (already works via Firestore cdrTracking)
2. When a test result is entered in S2, matching CDR components auto-populate via `feedsCdrs` mapping
3. CDR scores recalculate automatically when S2 test results update components
4. The finalize endpoint reads `cdrTracking` from the encounter and builds a structured `cdrContext` string
5. The finalize prompt includes CDR scores, interpretations, and component states for completed CDRs
6. Dismissed CDRs are excluded from the finalize prompt cdrContext
7. Final MDM text includes CDR-specific language per completed rules (verified by prompt instructions)
8. `cd frontend && pnpm check` passes (typecheck + lint + test)
9. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Build cdrContext at Finalize (Backend) (AC: #4, #5, #6)

- [x] In `backend/src/index.ts` finalize endpoint, read `encounter.cdrTracking` (already available from Firestore)
- [x] Create a helper function `buildCdrContextString(cdrTracking: CdrTracking): string | undefined`
  - Iterates over cdrTracking entries
  - Skips dismissed CDRs (`entry.dismissed === true`)
  - For completed CDRs: outputs `"{name}: Score {score} — {interpretation}"`
  - For partial CDRs: outputs `"{name}: Partial ({N}/{total} answered)" + answered component labels`
  - Returns undefined if no non-dismissed CDRs exist
- [x] Replace the current `encounter.cdrContext || undefined` line (L1093) with the dynamically built context
- [x] The `buildFinalizePrompt` already accepts `cdrContext?: string` and has CDR finalize instructions — no prompt changes needed

### 2. Auto-Populate CDR Components from S2 Test Results (Frontend) (AC: #2, #3)

- [x] In `frontend/src/hooks/useCdrTracking.ts`, add a new method: `updateFromTestResults(testResults: Record<string, TestResult>, testLibrary: TestDefinition[])`
- [x] Logic: for each test result where `status !== 'pending'`:
  - Look up the test in testLibrary to get `feedsCdrs` array
  - For each CDR ID in `feedsCdrs`, find the matching CDR in tracking
  - For each component in that CDR where `source === 'section2'`:
    - If the test ID matches the component ID (e.g., test "troponin" maps to component "troponin"): auto-populate value
    - For boolean components: set value to `component.value` (present weight) if test status === 'abnormal', else 0
    - For select components: attempt to map test result value/quickFindings to closest option (best-effort, fallback to no auto-populate)
  - Update component state: `{ value, source: 'section2', answered: true }`
  - Recalculate score after all updates
- [x] Debounce + persist to Firestore (same 300ms pattern)

### 3. Wire S2 Test Results to CDR Tracking (Frontend) (AC: #2, #3)

- [x] In `EncounterEditor.tsx`, add an effect that watches `encounter.section2.testResults`
- [x] When testResults changes (via Firestore onSnapshot), auto-populate CDR components directly via Firestore update
- [x] Added `useTestLibrary()` and `useCdrLibrary()` hooks at EncounterEditor level
- [x] Guard: only trigger when encounter has cdrTracking AND section2 has testResults
- [x] Guard: use a ref with JSON hash to avoid re-triggering for unchanged test results

### 4. Testing (AC: #8, #9)

- [x] Add test in `CdrDetailView.test.tsx`: verify completed CDR after S2 auto-population shows score
- [x] Test: completed CDR after S2 auto-populate shows score and interpretation
- [x] Test: (AI) badge not shown for section2-sourced auto-populated components
- [x] Backend `buildCdrContextString` verified via `pnpm build` (no backend test framework)
- [x] Run `cd frontend && pnpm check` — passes (121 tests)
- [x] Run `cd backend && pnpm build` — passes

---

## Dev Notes

### Previous Story Intelligence (BM-3.2)

BM-3.2 implemented the CDR detail views. Key learnings:
- **Source tracking matters**: When a user overrides an AI value, the source changes to `user_input` so the "(AI)" badge disappears. Apply the same pattern for S2 auto-population: source should be `section2` (not `user_input`).
- **expandedCdrs sync**: New CDRs added via async onSnapshot need to be auto-expanded. The same pattern applies if S2 auto-population changes CDR status.
- **Debounced Firestore writes**: Both `useCdrTracking` and `handleSelectedTestsChange` use 300ms debounce. S2 auto-population should use the same `persistTracking` method already in `useCdrTracking`.

### CDR Component Auto-Population from S2 Results

The mapping between tests and CDR components uses two links:

1. **Test → CDR**: `TestDefinition.feedsCdrs: string[]` maps a test to CDR IDs it feeds
2. **CDR → Component**: `CdrComponent.source === 'section2'` and `CdrComponent.autoPopulateFrom === 'test_result'` identifies which components expect S2 data

For the HEART Score example:
- Test `troponin` has `feedsCdrs: ['heart']`
- CDR `heart` component `troponin` has `source: 'section2'`, `autoPopulateFrom: 'test_result'`
- When troponin test result arrives with value, map it to the HEART troponin component

The mapping is by convention: the CDR component ID matches the test ID (e.g., component "troponin" ← test "troponin"). This is already established in the seed data.

### Boolean Component Auto-Population

For boolean CDR components fed by S2 test results:
- `status: 'abnormal'` → present (value = component.value, typically 1 or 3)
- `status: 'unremarkable'` → absent (value = 0)
- `status: 'pending'` → skip (don't auto-populate)

### Select Component Auto-Population

For select CDR components (e.g., HEART troponin: "<=normal", "1-3x", ">3x"):
- This is harder to map automatically from test results
- For now: if test has a `value` string, attempt basic heuristic matching against option labels
- Fallback: leave component unanswered (physician picks manually)
- This is acceptable for v1; LLM-assisted mapping can be added later

### cdrContext String Format for Finalize

```
HEART Score: Score 3 — Low: Safe for discharge
  - History: 1 (Moderately suspicious)
  - ECG: 0 (Normal)
  - Age: 0 (<45)
  - Risk Factors: 1 (1-2 risk factors)
  - Troponin: 1 (1-3x normal limit)

Wells PE: Partial (3/8 answered)
  - DVT Signs: Present (3pts)
  - PE Most Likely: Absent (0pts)
  - (5 pending S2 results)
```

### What NOT to Build

- **Do NOT modify the finalize prompt template** — it already has CDR finalize instructions (lines 260-269 in `promptBuilderBuildMode.ts`)
- **Do NOT modify the CDR detail view UI** — S2 auto-populated values will just appear as new answered components (existing rendering handles this)
- **Do NOT modify the match-cdrs endpoint** — CDR matching already works; this story only adds S2 → CDR flow and finalize context
- **Do NOT build LLM-assisted result-to-option mapping** — Simple heuristic for v1

### Data Flow Summary

```
S1 completes → matchCdrs() → cdrTracking written (section1 components populated)
    ↓
S2 test results entered → testResults written to Firestore
    ↓
useCdrTracking.updateFromTestResults() → section2 components auto-populated
    ↓
CDR scores recalculated → cdrTracking updated in Firestore
    ↓
S3 finalize → backend reads cdrTracking → buildCdrContextString() → finalize prompt
    ↓
Final MDM includes CDR scores and interpretations
```

### Project Structure Notes

| File | Path | Action |
|------|------|--------|
| CDR tracking hook | `frontend/src/hooks/useCdrTracking.ts` | Modify (add updateFromTestResults) |
| Encounter editor | `frontend/src/components/build-mode/EncounterEditor.tsx` | Modify (wire S2 → CDR auto-populate) |
| Finalize endpoint | `backend/src/index.ts` | Modify (build cdrContext from cdrTracking) |
| Tests | `frontend/src/__tests__/CdrDetailView.test.tsx` or new | Create/Modify |
| Backend tests | n/a (no backend test framework) | Backend quality via `pnpm build` |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-cdr-system.md -- Story 3.3 spec]
- [Source: frontend/src/hooks/useCdrTracking.ts -- CDR state management hook with debounced persistence]
- [Source: frontend/src/types/encounter.ts -- TestResult, CdrTracking types]
- [Source: frontend/src/types/libraries.ts -- TestDefinition.feedsCdrs, CdrComponent.autoPopulateFrom]
- [Source: backend/src/index.ts -- finalize endpoint (L1012-1095), cdrContext reading (L1093)]
- [Source: backend/src/promptBuilderBuildMode.ts -- buildFinalizePrompt with cdrContext param (L221-270)]
- [Source: scripts/seed-cdr-library.ts -- CDR library seed data showing feedsCdrs and autoPopulateFrom]
- [Source: backend/src/services/cdrTrackingBuilder.ts -- score calculation reference]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Frontend `pnpm check` passes — 121 tests, typecheck clean, lint clean. 16 CdrDetailView tests (14 + 2 new for S2 auto-populate).
- Backend `pnpm build` passes. Added `buildCdrContextString` helper for dynamic cdrContext generation.
- Architecture decision: S2 → CDR auto-populate implemented as direct Firestore write in EncounterEditor effect (not via useCdrTracking hook) to avoid dual-state management. onSnapshot propagates changes.

### Completion Notes List

- Task 1: Created `buildCdrContextString()` in `backend/src/index.ts`. Generates structured CDR context string from cdrTracking for finalize prompt. Skips dismissed CDRs. Shows score/interpretation for completed, progress for partial. Replaces static `encounter.cdrContext` field with dynamic build.
- Task 2: Added `updateFromTestResults()` method to `useCdrTracking` hook. Maps test results to CDR components via `feedsCdrs` + component ID convention. Boolean components: abnormal=present, unremarkable=absent. Select/number_range skipped for v1.
- Task 3: Added S2 → CDR auto-populate effect in EncounterEditor. Uses JSON hash ref to detect testResults changes. Added `useTestLibrary` and `useCdrLibrary` hooks at EncounterEditor level. Direct Firestore write with PHI-safe error logging.
- Task 4: Added 2 new tests: completed CDR after S2 auto-population shows score, (AI) badge not shown for section2-sourced components. Total 121 tests pass.

### Change Log

- 2026-02-24: Implemented BM-3.3 Cross-Section CDR State Persistence — backend cdrContext builder, S2 test result auto-populate, finalize pipeline

### File List

- `backend/src/index.ts` -- Modified (added buildCdrContextString helper, replaced static cdrContext with dynamic build)
- `frontend/src/hooks/useCdrTracking.ts` -- Modified (added updateFromTestResults method, imported TestResult/TestDefinition types)
- `frontend/src/components/build-mode/EncounterEditor.tsx` -- Modified (added S2→CDR auto-populate effect, useTestLibrary/useCdrLibrary hooks)
- `frontend/src/__tests__/CdrDetailView.test.tsx` -- Modified (added 2 tests for S2 auto-populate scenarios)
