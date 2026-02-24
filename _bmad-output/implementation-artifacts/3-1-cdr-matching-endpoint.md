# Story 3.1: CDR Matching Endpoint

Status: done

| Field          | Value                                          |
|----------------|-------------------------------------------------|
| Story ID       | BM-3.1                                          |
| Points         | 5                                               |
| Dependencies   | BM-1.2 (CDR Library), BM-1.3 (Encounter Schema) |
| Epic           | Phase 3: CDR System                             |
| Priority       | High (foundational for CDR detail views)         |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** the system to automatically match relevant Clinical Decision Rules to my encounter after Section 1 processing, and auto-populate CDR components where data is available from the narrative,
**so that** I can see which scoring tools apply and which components are already answered before I start entering workup data in Section 2.

---

## Acceptance Criteria

1. New `POST /v1/build-mode/match-cdrs` endpoint accepts an encounterId and returns matched CDRs with component states
2. Endpoint reads S1 data (differential, content) from the encounter's Firestore document
3. CDR matching uses `applicableChiefComplaints` against S1 differential diagnoses (case-insensitive substring matching)
4. For each matched CDR, Gemini (Flash) attempts to auto-populate section1-sourced components from the S1 narrative
5. Returns structured `cdrTracking` object with per-component state (answered/pending, value, source)
6. Writes matched CDR tracking to encounter `cdrTracking` Firestore field
7. Components indicate source (`section1`, `section2`, `user_input`) and answered status
8. Endpoint follows the 6-step security pattern (authenticate, validate, authorize, execute, audit, respond)
9. Non-LLM matching failures do NOT block (graceful degradation)
10. `cd backend && pnpm build` passes

---

## Tasks / Subtasks

### 1. Add Request/Response Schemas (AC: #1, #5, #7)

- [x] Add to `backend/src/buildModeSchemas.ts`:
  ```typescript
  export const MatchCdrsRequestSchema = z.object({
    encounterId: z.string().min(1),
    userIdToken: z.string().min(10),
  })
  export type MatchCdrsRequest = z.infer<typeof MatchCdrsRequestSchema>

  export const MatchCdrsResponseSchema = z.object({
    ok: z.literal(true),
    cdrTracking: CdrTrackingSchema,
    matchedCount: z.number(),
  })
  export type MatchCdrsResponse = z.infer<typeof MatchCdrsResponseSchema>
  ```

### 2. Create CDR Matching Logic (AC: #3)

- [x] Create `backend/src/services/cdrMatcher.ts`
- [x] Pure function: `matchCdrsFromDifferential(differential: DifferentialItem[], cdrLibrary: CdrDefinition[]): CdrDefinition[]`
- [x] Matching strategy:
  1. For each CDR in the library, check if any of its `applicableChiefComplaints` appear (case-insensitive substring) in any differential item's `diagnosis` field
  2. Also check if CDR `name` or `fullName` appears in any differential item's `cdrContext` field (if present)
- [x] Deduplicate by CDR `id`
- [x] Return matched CDR definitions

### 3. Create CDR Auto-Population Prompt (AC: #4)

- [x] Add `buildCdrAutoPopulatePrompt` function to `backend/src/promptBuilderBuildMode.ts`
- [x] Input: S1 narrative content, matched CDR definitions (names + component labels + types)
- [x] Prompt instructs Gemini to extract values for section1-sourced components from the narrative
- [x] Output format: JSON object mapping `{ cdrId: { componentId: { value: number, confidence: string } } }`
- [x] Only attempt auto-population for components with `source: 'section1'` or `source: 'user_input'`
- [x] Components with `source: 'section2'` are left as pending (they need lab/imaging results)

### 4. Create Match-CDRs Endpoint (AC: #1, #2, #4, #5, #6, #7, #8, #9)

- [x] Add `POST /v1/build-mode/match-cdrs` to `backend/src/index.ts`
- [x] Follow the 6-step security pattern:
  1. **VALIDATE**: Parse request with `MatchCdrsRequestSchema`
  2. **AUTHENTICATE**: Verify Firebase ID token
  3. **AUTHORIZE**: Verify encounter ownership (encounter belongs to authenticated user)
  4. **EXECUTE**:
     a. Read encounter from Firestore (need S1 content + S1 llmResponse)
     b. Verify encounter is in `section1_done` status (or later)
     c. Read CDR library from Firestore (use existing cache pattern from `GET /v1/libraries/cdrs`)
     d. Match CDRs using `matchCdrsFromDifferential()`
     e. If matches found, call Gemini Flash with auto-populate prompt to extract component values
     f. Build `CdrTracking` object from matches + auto-populated values
     g. Write `cdrTracking` to encounter Firestore document
  5. **AUDIT**: Log action metadata (no PHI — only uid, encounterId, matchedCount, timestamp)
  6. **RESPOND**: Return `MatchCdrsResponse`
- [x] Use `llmLimiter` rate limiter (same as other build-mode endpoints)
- [x] LLM auto-populate is supplementary — if Gemini call fails, still return matches with all components as `answered: false`
- [x] Extract differential from `encounter.section1.llmResponse` (handle both flat array and `{ differential }` wrapper)

### 5. Build CdrTracking from Matches + Auto-Populated Values (AC: #5, #7)

- [x] Create `backend/src/services/cdrTrackingBuilder.ts`
- [x] Function: `buildCdrTracking(matchedCdrs: CdrDefinition[], autoPopulated: Record<string, Record<string, { value: number }>> | null): CdrTracking`
- [x] For each matched CDR:
  - Create `CdrTrackingEntry` with `name`, `status`, `identifiedInSection: 1`, `dismissed: false`
  - For each component:
    - If auto-populated value exists: `{ value, source: component.source, answered: true }`
    - If component source is `section2`: `{ value: null, source: 'section2', answered: false }` (needs lab results)
    - Otherwise: `{ value: null, source: component.source, answered: false }`
  - Compute initial status: `'pending'` if no components answered, `'partial'` if some answered, `'completed'` if all answered
- [x] Return `CdrTracking` object (keyed by CDR id)

### 6. Testing (AC: #10)

- [x] Run `cd backend && pnpm build` — must pass (TypeScript compilation)
- [x] Manual verification: endpoint schema types are consistent with existing `CdrTracking` types
- [x] Note: Backend does not have a test runner — quality gate is `pnpm build` only

---

## Dev Notes

### Previous Story Intelligence (BM-2.4)

BM-2.4 completed the Phase 2 dashboard. Key learnings:
- **Code review catches CSS/dead code**: Always clean up when extracting inline components.
- **Parity with replaced code**: When replacing an existing component, ensure all states from the old code are handled.

### Endpoint Pattern Reference

Follow the pattern from `POST /v1/build-mode/process-section1` (lines 573-801 in `index.ts`):
1. Parse with Zod schema
2. Verify Firebase ID token → extract uid
3. Get encounter ref → verify exists → verify ownership (collection path includes uid)
4. Execute business logic
5. Update Firestore
6. Log metadata only (NEVER log medical content)
7. Return JSON response

### CDR Library Cache

The CDR library is already cached in-memory with 5-minute TTL (same pattern as test library). The match-cdrs endpoint can reuse the existing cache by calling the same Firestore query + cache logic used by `GET /v1/libraries/cdrs`. Consider extracting the cache read into a shared helper function `getCachedCdrLibrary()` to avoid code duplication.

### Gemini Flash Call Pattern

Use `callGeminiFlash()` (already imported in index.ts) for the auto-populate prompt. This is the lightweight model call used for all build-mode endpoints. The auto-populate call is supplementary — if it fails, return matches with all components marked `answered: false`.

### CdrTracking Schema (already defined in buildModeSchemas.ts)

```typescript
CdrTrackingEntry = {
  name: string                           // CDR display name
  status: 'pending' | 'partial' | 'completed' | 'dismissed'
  identifiedInSection?: 1 | 2 | 3       // which section identified it
  completedInSection?: 1 | 2 | 3 | null // which section completed it
  dismissed: boolean
  components: Record<string, {           // keyed by component id
    value: number | null
    source: 'section1' | 'section2' | 'user_input' | null
    answered: boolean
  }>
  score?: number | null                  // calculated total score
  interpretation?: string | null         // risk interpretation from scoring ranges
}

CdrTracking = Record<string, CdrTrackingEntry>  // keyed by CDR id
```

### CdrDefinition Shape (from backend/src/types/libraries.ts)

```typescript
CdrDefinition = {
  id: string
  name: string
  fullName: string
  applicableChiefComplaints: string[]
  components: CdrComponent[]
  scoring: CdrScoring
  suggestedTreatments?: Record<string, string[]>
}

CdrComponent = {
  id: string
  label: string
  type: 'select' | 'boolean' | 'number_range' | 'algorithm'
  options?: { label: string, value: number }[]
  source: 'section1' | 'section2' | 'user_input'
  autoPopulateFrom?: string
}
```

### DifferentialItem Shape (from buildModeSchemas.ts)

```typescript
DifferentialItem = {
  diagnosis: string
  urgency: 'emergent' | 'urgent' | 'routine'
  reasoning: string
  regionalContext?: string
  cdrContext?: string   // e.g., "HEART score applicable for ACS risk stratification"
}
```

### What NOT to Build

- **Do NOT build frontend UI** for CDR matching — that's BM-3.2 (CdrSwipeView/CdrDetailPanel)
- **Do NOT build cross-section persistence** — that's BM-3.3
- **Do NOT call match-cdrs automatically from process-section1** — the frontend will call it separately after S1 completes
- **Do NOT add CDR auto-population for section2 components** — those require lab results (BM-3.3)
- **Do NOT modify the existing process-section1 or process-section2 endpoints** — match-cdrs is a separate endpoint

### Project Structure Notes

| File | Path | Action |
|------|------|--------|
| Request/response schemas | `backend/src/buildModeSchemas.ts` | Modify (add MatchCdrs schemas) |
| CDR matching logic | `backend/src/services/cdrMatcher.ts` | Create |
| CDR tracking builder | `backend/src/services/cdrTrackingBuilder.ts` | Create |
| Auto-populate prompt | `backend/src/promptBuilderBuildMode.ts` | Modify (add buildCdrAutoPopulatePrompt) |
| Match-CDRs endpoint | `backend/src/index.ts` | Modify (add POST /v1/build-mode/match-cdrs) |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-cdr-system.md -- Story 3.1 spec]
- [Source: backend/src/index.ts:573-801 -- process-section1 endpoint pattern]
- [Source: backend/src/index.ts:243-292 -- CDR library endpoint with cache pattern]
- [Source: backend/src/buildModeSchemas.ts:165-191 -- CdrTracking, CdrComponentState, CdrStatus types]
- [Source: backend/src/types/libraries.ts:43-95 -- CdrDefinition, CdrComponent, CdrScoring types]
- [Source: backend/src/promptBuilderBuildMode.ts -- Section prompt builder patterns]
- [Source: backend/src/cdr/cdrSelector.ts -- selectRelevantRules pattern]
- [Source: backend/src/cdr/cdrPromptAugmenter.ts -- buildCdrContext pattern]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Backend `pnpm build` passes on first attempt. No TypeScript compilation errors.
- Frontend `pnpm check` passes (105 tests, typecheck, lint) — no regressions.

### Completion Notes List

- Task 1: Added `MatchCdrsRequestSchema` and `MatchCdrsResponseSchema` to buildModeSchemas.ts. Request takes encounterId + userIdToken, response returns CdrTracking + matchedCount.
- Task 2: Created `cdrMatcher.ts` with `matchCdrsFromDifferential()` — two-strategy matching: (1) applicableChiefComplaints vs diagnosis names, (2) CDR name/fullName vs cdrContext strings. Case-insensitive, deduplicated.
- Task 3: Added `buildCdrAutoPopulatePrompt()` to promptBuilderBuildMode.ts. Builds Gemini prompt targeting only section1/user_input-sourced components. Includes options/values for each component type.
- Task 4: Created `POST /v1/build-mode/match-cdrs` endpoint following 6-step security pattern. Reads S1 data from Firestore, matches CDRs, calls Gemini for auto-population (supplementary — failures don't block), builds CdrTracking, writes to Firestore.
- Task 5: Created `cdrTrackingBuilder.ts` with `buildCdrTracking()`. Computes component states, CDR status (pending/partial/completed), and calculates scores for completed CDRs using sum scoring method.
- Task 6: `cd backend && pnpm build` passes. No test runner for backend.

### Change Log

- 2026-02-24: Implemented BM-3.1 CDR Matching Endpoint — new POST /v1/build-mode/match-cdrs with auto-population

### File List

- `backend/src/buildModeSchemas.ts` -- Modified (added MatchCdrsRequest/Response schemas)
- `backend/src/services/cdrMatcher.ts` -- Created (CDR matching logic)
- `backend/src/services/cdrTrackingBuilder.ts` -- Created (CdrTracking builder with scoring)
- `backend/src/promptBuilderBuildMode.ts` -- Modified (added buildCdrAutoPopulatePrompt)
- `backend/src/index.ts` -- Modified (added POST /v1/build-mode/match-cdrs endpoint)
