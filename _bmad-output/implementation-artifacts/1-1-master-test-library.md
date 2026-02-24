# BM-1.1: Master Test Library

## Status

**Done**

| Field          | Value                          |
|----------------|--------------------------------|
| Story ID       | BM-1.1                         |
| Points         | 3                              |
| Dependencies   | None                           |
| Epic           | Build Mode Rebuild             |
| Priority       | High (foundational data layer) |

---

## Story

**As a** Build Mode backend developer,
**I want** a Firestore-backed master test library with a read-only API endpoint,
**so that** the order selection UI, result entry UI, and CDR system have a canonical reference catalog of all ER tests to consume.

---

## Acceptance Criteria

1. `GET /v1/libraries/tests` returns a categorized test list matching spec categories: **Labs**, **Imaging**, **Procedures/POC**
2. Each test document has: `id`, `name`, `category`, `subcategory`, `unit` (if applicable), `quickFindings` (if applicable), `feedsCdrs` (array of CDR ids)
3. All tests from spec are present: CBC, BMP, CMP, Troponin, BNP, D-dimer, UA, Lipase, LFTs, Coags, ECG, CXR, CT variants, US variants, etc. (full list in Dev Notes)
4. Endpoint requires authentication (Firebase ID token via `Authorization: Bearer <token>` header)
5. Seed script can be run idempotently (re-running produces identical results, no duplicates)
6. Backend builds cleanly (`pnpm build` succeeds with zero errors)

---

## Tasks / Subtasks

### T1: Define TypeScript types (AC: 2)
- [x] Create `backend/src/types/libraries.ts` with `TestDefinition` interface and `TestCategory` type
- [x] Create `frontend/src/types/libraries.ts` with mirror interfaces (plain TS, no Zod)

### T2: Create seed data and seed script (AC: 3, 5)
- [x] Create `scripts/seed-test-library.ts` with full test catalog (~60 tests across 4 subcategories)
- [x] Implement idempotent Firestore writes using `doc.set()` with merge or deterministic doc IDs
- [x] Verify the script runs via `cd backend && NODE_PATH=./node_modules npx tsx ../scripts/seed-test-library.ts`

### T3: Implement GET endpoint (AC: 1, 4)
- [x] Add `GET /v1/libraries/tests` route in `backend/src/index.ts`
- [x] Implement Firebase ID token authentication (Bearer token from `Authorization` header)
- [x] Read from `testLibrary` Firestore collection, group results by category
- [x] Add in-memory cache with TTL (5-minute cache since test library rarely changes)

### T4: Validate build (AC: 6)
- [x] Run `cd backend && pnpm build` — must pass cleanly
- [x] Run `cd frontend && pnpm check` — must pass cleanly (frontend types compile)

---

## Dev Notes

### Source Tree (Relevant Files)

```
backend/
  src/
    index.ts                    # Express app — add new GET route here (1369 lines)
    types/
      libraries.ts              # NEW — TestDefinition, TestCategory types
    buildModeSchemas.ts         # Reference for Zod schema patterns
    services/
      userService.ts            # Reference for Firestore access patterns
  package.json                  # Has tsx, firebase-admin, zod deps
  tsconfig.json                 # target ES2022, CommonJS, strict, outDir: dist
frontend/
  src/
    types/
      encounter.ts              # Reference for frontend type file pattern (JSDoc + interfaces)
      libraries.ts              # NEW — mirror TestDefinition type for frontend
scripts/
  load-zip-crosswalk.ts         # Reference for Firestore seed script pattern
  seed-test-library.ts          # NEW — test library seeder
```

### TypeScript Type Definition

Create `backend/src/types/libraries.ts`:

```typescript
/** Category for test library items */
export type TestCategory = 'labs' | 'imaging' | 'procedures_poc'

/**
 * Master test definition — one document per test in the `testLibrary` Firestore collection.
 * Consumed by order selection UI, result entry UI, and CDR system.
 */
export interface TestDefinition {
  /** Unique identifier (lowercase, snake_case). Also the Firestore doc ID. */
  id: string
  /** Display name (e.g., "Troponin", "CT Head") */
  name: string
  /** Top-level category */
  category: TestCategory
  /** Subcategory within the category (e.g., "cardiac", "hepatic", "head_neck") */
  subcategory: string
  /** Common clinical indications (array of indication keywords) */
  commonIndications: string[]
  /** Unit of measurement (null for non-quantitative tests like imaging) */
  unit: string | null
  /** Normal range string (null if not applicable) */
  normalRange: string | null
  /** Quick findings options for rapid result entry (null if freeform only) */
  quickFindings: string[] | null
  /** Array of CDR IDs this test feeds into (defined in BM-1.2). Populate with known mappings now. */
  feedsCdrs: string[]
}

/**
 * Response shape for GET /v1/libraries/tests
 */
export interface TestLibraryResponse {
  ok: true
  tests: TestDefinition[]
  categories: TestCategory[]
  cachedAt: string  // ISO timestamp of when cache was populated
}
```

Create `frontend/src/types/libraries.ts` — mirror types with JSDoc, no Zod:

```typescript
/**
 * Test Library Types
 *
 * Mirror of backend/src/types/libraries.ts for frontend consumption.
 * These types are consumed by the order selection UI and result entry components.
 */

/** Category for test library items */
export type TestCategory = 'labs' | 'imaging' | 'procedures_poc'

/**
 * Master test definition from the testLibrary Firestore collection.
 * Fetched via GET /v1/libraries/tests.
 */
export interface TestDefinition {
  /** Unique identifier (lowercase, snake_case) */
  id: string
  /** Display name (e.g., "Troponin", "CT Head") */
  name: string
  /** Top-level category */
  category: TestCategory
  /** Subcategory within the category */
  subcategory: string
  /** Common clinical indications */
  commonIndications: string[]
  /** Unit of measurement (null for non-quantitative tests) */
  unit: string | null
  /** Normal range string (null if not applicable) */
  normalRange: string | null
  /** Quick findings options for rapid result entry (null if freeform only) */
  quickFindings: string[] | null
  /** Array of CDR IDs this test feeds into */
  feedsCdrs: string[]
}

/** Response shape from GET /v1/libraries/tests */
export interface TestLibraryResponse {
  ok: true
  tests: TestDefinition[]
  categories: TestCategory[]
  cachedAt: string
}
```

### Backend Endpoint Implementation

Add the new route in `backend/src/index.ts`. Place it **after** the existing `app.get('/health', ...)` route and **before** the Build Mode section comment block (around line 425). This follows the existing file organization pattern.

**Authentication pattern** (adapted from existing POST routes to GET):

```typescript
app.get('/v1/libraries/tests', async (req, res) => {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1]
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' })
    try {
      await admin.auth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. No request body to VALIDATE (GET request)
    // 3. No special AUTHORIZATION needed (any authenticated user can read tests)

    // 4. EXECUTE — return from cache or read Firestore
    const now = Date.now()
    if (testLibraryCache && (now - testLibraryCacheTime) < TEST_LIBRARY_CACHE_TTL) {
      return res.json(testLibraryCache)
    }

    const snapshot = await getDb().collection('testLibrary').get()
    const tests = snapshot.docs.map(doc => doc.data() as TestDefinition)
    const categories = [...new Set(tests.map(t => t.category))] as TestCategory[]

    const response: TestLibraryResponse = {
      ok: true,
      tests,
      categories,
      cachedAt: new Date().toISOString(),
    }

    testLibraryCache = response
    testLibraryCacheTime = now

    // 5. AUDIT
    console.log({ action: 'get-test-library', testCount: tests.length, timestamp: new Date().toISOString() })

    // 6. RESPOND
    return res.json(response)
  } catch (e: any) {
    console.error('get-test-library error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
})
```

**In-memory cache variables** (add near the top of the file, after the rate limiter definitions around line 99):

```typescript
// In-memory cache for test library (rarely changes)
import type { TestDefinition, TestCategory, TestLibraryResponse } from './types/libraries'

const TEST_LIBRARY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let testLibraryCache: TestLibraryResponse | null = null
let testLibraryCacheTime = 0
```

**Import**: Add to the import block at the top of `index.ts`:
```typescript
import type { TestDefinition, TestCategory, TestLibraryResponse } from './types/libraries'
```

**CORS note**: The existing CORS middleware (lines 52-66) already allows `GET` in `Access-Control-Allow-Methods`, so no CORS changes needed.

**Rate limiting note**: The `globalLimiter` (60 req/min, applied via `app.use(globalLimiter)` at line 81) already covers this endpoint. No additional rate limiter is needed since this is a simple Firestore read, not an LLM call.

### Seed Script Implementation

Create `scripts/seed-test-library.ts` following the pattern established by `scripts/load-zip-crosswalk.ts`:

**Firebase Admin initialization** (copy from `load-zip-crosswalk.ts` lines 20-36):
```typescript
import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (serviceAccountJson) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  })
} else if (serviceAccountPath) {
  const content = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(content)),
  })
} else {
  admin.initializeApp()
}

const db = admin.firestore()
```

**Idempotency**: Use `doc(test.id).set(testData)` — since doc ID = test.id, re-running overwrites with identical data. Use Firestore batched writes (max 500 per batch, same pattern as `load-zip-crosswalk.ts` line 99-119).

**Invocation**: `npx tsx scripts/seed-test-library.ts` (no CLI arguments needed; data is hardcoded in the script).

### Complete Test Catalog (~60 tests)

The seed script must include ALL of the following tests. The `id` field is the Firestore document ID.

**LABS** (category: `labs`):

| id | name | subcategory | unit | normalRange | feedsCdrs |
|----|------|-------------|------|-------------|-----------|
| cbc | CBC | hematology | — | — | [] |
| bmp | BMP | chemistry | — | — | [] |
| cmp | CMP | chemistry | — | — | [] |
| mag | Magnesium | chemistry | mEq/L | 1.7-2.2 | [] |
| phos | Phosphorus | chemistry | mg/dL | 2.5-4.5 | [] |
| lfts | LFTs | hepatic | — | — | [] |
| lipase | Lipase | hepatic | U/L | 0-160 | [] |
| amylase | Amylase | hepatic | U/L | 30-110 | [] |
| coags_inr | Coags/INR | hematology | — | — | ["wells_dvt"] |
| bnp | BNP/proBNP | cardiac | pg/mL | <100 | ["heart"] |
| lactate | Lactate | chemistry | mmol/L | 0.5-2.0 | ["sepsis"] |
| ua | Urinalysis | genitourinary | — | — | [] |
| ucg | UCG (Urine Pregnancy) | genitourinary | — | — | [] |
| blood_cx | Blood Cultures | infectious | — | — | ["sepsis"] |
| type_screen | Type & Screen | hematology | — | — | [] |
| vbg_abg | VBG/ABG | chemistry | — | — | [] |
| esr_crp | ESR/CRP | inflammatory | — | — | [] |
| tsh | TSH | endocrine | mIU/L | 0.4-4.0 | [] |
| ldh | LDH | chemistry | U/L | 140-280 | [] |
| fibrinogen | Fibrinogen | hematology | mg/dL | 200-400 | [] |
| haptoglobin | Haptoglobin | hematology | mg/dL | 30-200 | [] |
| retic_ct | Reticulocyte Count | hematology | % | 0.5-2.5 | [] |
| ammonia | Ammonia | chemistry | umol/L | 15-45 | [] |
| ethanol | Ethanol Level | toxicology | mg/dL | 0 | [] |
| salicylate | Salicylate Level | toxicology | mg/dL | <30 | [] |
| apap | Acetaminophen Level | toxicology | ug/mL | <20 | ["rumack_matthew"] |
| urine_tox | Urine Tox Screen | toxicology | — | — | [] |
| uds | Urine Drug Screen | toxicology | — | — | [] |
| osmolality | Osmolality | chemistry | mOsm/kg | 275-295 | [] |
| troponin | Troponin | cardiac | ng/mL | <0.04 | ["heart"] |
| d_dimer | D-dimer | hematology | ng/mL FEU | <500 | ["wells_pe", "wells_dvt"] |

**IMAGING** (category: `imaging`):

| id | name | subcategory | quickFindings | feedsCdrs |
|----|------|-------------|---------------|-----------|
| ct_head | CT Head | head_neck | ["Normal", "Bleed", "Mass", "Edema", "Midline shift"] | ["canadian_ct_head"] |
| ct_cspine | CT C-spine | spine | ["Normal", "Fracture", "Subluxation", "Degenerative"] | ["nexus", "canadian_cspine"] |
| ct_chest | CT Chest | chest | ["Normal", "Consolidation", "Effusion", "Mass", "Fracture"] | [] |
| cta_chest | CTA Chest | chest | ["Normal", "PE", "Aortic dissection", "Aneurysm"] | ["wells_pe", "perc"] |
| ct_abd_pelv | CT Abdomen/Pelvis | abdomen | ["Normal", "Appendicitis", "Obstruction", "Free fluid", "Mass"] | [] |
| cta_head | CTA Head/Neck | head_neck | ["Normal", "Occlusion", "Stenosis", "Aneurysm", "Dissection"] | [] |
| xr_chest | Chest X-ray (CXR) | chest | ["Normal", "Infiltrate", "Effusion", "Pneumothorax", "Cardiomegaly"] | [] |
| xr_ext | X-ray Extremity | extremity | ["Normal", "Fracture", "Dislocation", "Soft tissue swelling"] | ["ottawa_ankle", "ottawa_knee"] |
| xr_spine | X-ray Spine | spine | ["Normal", "Fracture", "Compression", "Degenerative"] | [] |
| us_fast | US FAST | abdomen | ["Negative", "Positive - free fluid", "Positive - pericardial"] | [] |
| us_ruq | US RUQ (Gallbladder) | abdomen | ["Normal", "Cholelithiasis", "Cholecystitis", "CBD dilation"] | [] |
| us_aorta | US Aorta | abdomen | ["Normal", "AAA", "Dissection flap"] | [] |
| us_soft_tissue | US Soft Tissue | soft_tissue | ["Normal", "Abscess", "Cellulitis", "Foreign body"] | [] |
| us_ob | US OB (Obstetric) | obstetric | ["IUP confirmed", "No IUP", "Ectopic", "Free fluid"] | [] |
| us_renal | US Renal | genitourinary | ["Normal", "Hydronephrosis", "Stone", "Mass"] | [] |
| echo_tte | Echo TTE | cardiac | ["Normal EF", "Reduced EF", "Wall motion abnormality", "Pericardial effusion", "Valve abnormality"] | ["heart"] |
| mri_brain | MRI Brain | head_neck | ["Normal", "Infarct", "Mass", "Hemorrhage"] | [] |
| fluoro | Fluoroscopy | misc | null | [] |

**PROCEDURES/POC** (category: `procedures_poc`):

| id | name | subcategory | quickFindings | feedsCdrs |
|----|------|-------------|---------------|-----------|
| ecg_12lead | ECG (12-lead) | cardiac | ["Normal sinus", "ST elevation", "ST depression", "Afib", "SVT", "VT", "BBB", "STEMI equivalent"] | ["heart", "sgarbossa"] |
| ecg_repeat | Repeat ECG | cardiac | ["Unchanged", "New ST changes", "Resolution", "Interval change"] | ["heart"] |
| lp | Lumbar Puncture | neurologic | ["Normal", "Elevated WBC", "Elevated protein", "Xanthochromia", "Elevated opening pressure"] | [] |
| paracentesis | Paracentesis | abdominal | ["Transudative", "Exudative", "SBP (elevated PMNs)", "Bloody"] | [] |
| thoracentesis | Thoracentesis | pulmonary | ["Transudative", "Exudative", "Empyema", "Bloody"] | [] |
| incision_drainage | Incision & Drainage | wound | ["Simple abscess", "Complex abscess", "Wound packing"] | [] |
| bedside_us | Bedside Ultrasound | point_of_care | null | [] |
| splint_cast | Splint/Cast | orthopedic | ["Splint applied", "Cast applied", "Reduction performed"] | [] |
| istat | iSTAT (POC Blood Gas) | point_of_care | null | [] |
| rapid_strep | Rapid Strep | point_of_care | ["Positive", "Negative"] | ["centor"] |
| rapid_flu | Rapid Influenza | point_of_care | ["Positive Flu A", "Positive Flu B", "Negative"] | [] |
| covid_rapid | COVID Rapid Test | point_of_care | ["Positive", "Negative"] | [] |

### Firestore Collection Structure

- **Collection path**: `testLibrary` (top-level collection, NOT nested under customers)
- **Document ID**: The `id` field value (e.g., `troponin`, `ct_head`, `ecg_12lead`)
- **One document per test**
- No subcollections

### Caching Strategy

The in-memory cache approach is preferred over Firestore's built-in cache because:
1. This data rarely changes (only when seed script re-runs)
2. Avoids repeated Firestore reads for a static dataset
3. Simple to implement and reason about
4. 5-minute TTL is conservative enough to pick up changes from re-seeding

Implementation: Two module-level variables (`testLibraryCache` and `testLibraryCacheTime`) checked before each Firestore read. If cache exists and is within TTL, return cached response directly. This is the same pattern used conceptually by `cdrLoader.ts` (lines 92-141) for the CDR rules cache, adapted for async Firestore reads.

### Key Dependencies and Imports

The endpoint will need:
- `admin` — already imported in `index.ts` line 8
- `getDb()` — already defined in `index.ts` line 430
- `TestDefinition`, `TestCategory`, `TestLibraryResponse` — new import from `./types/libraries`

The seed script will need:
- `firebase-admin` — already a dependency in `backend/package.json`
- `tsx` — already a devDependency in `backend/package.json` (used via `npx tsx`)

### Relationship to BM-1.2

This story creates the `libraries.ts` type files and the `testLibrary` collection. **BM-1.2** (CDR Library) will:
- EXTEND `backend/src/types/libraries.ts` with `CdrDefinition` type
- EXTEND `frontend/src/types/libraries.ts` with the same mirror
- Create a `cdrLibrary` Firestore collection
- Add `GET /v1/libraries/cdrs` endpoint
- The `feedsCdrs` arrays populated here will reference CDR IDs defined in BM-1.2

The CDR IDs used in `feedsCdrs` (e.g., `"heart"`, `"wells_pe"`, `"wells_dvt"`, `"sepsis"`, `"canadian_ct_head"`, `"nexus"`, `"canadian_cspine"`, `"perc"`, `"ottawa_ankle"`, `"ottawa_knee"`, `"rumack_matthew"`, `"centor"`, `"sgarbossa"`) correspond to CDR rules already defined in `backend/src/cdr/clinical-decision-rules.md` and loaded via `backend/src/cdr/cdrLoader.ts`.

### Security Constraints

- **NO PHI**: The test library is a reference catalog of test types, not patient data. No PHI risk.
- **Authentication required**: Every call must validate Firebase ID token.
- **No medical content in logs**: Log only metadata (`action`, `testCount`, `timestamp`).
- **Error messages**: Generic "Internal error" only; never expose stack traces or Firestore details.

---

## Testing

### Test Approach
Since this is a foundational data layer story, testing focuses on:
1. **Build verification** — `cd backend && pnpm build` must pass
2. **Frontend type compilation** — `cd frontend && pnpm check` must pass
3. **Seed script idempotency** — running the seed script twice produces identical Firestore state
4. **Endpoint manual verification** — after seeding, calling the endpoint returns expected data

### Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| `pnpm build` in backend | Compiles with zero errors |
| `pnpm check` in frontend | Typecheck + lint + tests pass |
| Seed script first run | Creates ~60 documents in `testLibrary` collection |
| Seed script second run | Overwrites identically, no duplicates, no errors |
| GET `/v1/libraries/tests` without auth | 401 Unauthorized |
| GET `/v1/libraries/tests` with valid token | 200 with full test list |
| GET `/v1/libraries/tests` twice within 5 min | Second call returns cached data (same `cachedAt`) |
| Response shape validation | Every test has id, name, category, subcategory; feedsCdrs is array |
| Category completeness | Response includes labs, imaging, procedures_poc categories |
| Test count | ~60 tests returned |

### Test Location
- Backend build validation: `cd backend && pnpm build`
- Frontend validation: `cd frontend && pnpm check`
- If writing unit tests, place in `backend/src/__tests__/` (vitest is configured in `backend/package.json`)

---

## Change Log

| Date       | Version | Description               | Author          |
|------------|---------|---------------------------|-----------------|
| 2026-02-23 | 0.1     | Initial draft from epic   | Technical SM    |
| 2026-02-23 | 1.0     | Implementation complete    | Dev Agent (James) |

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References
- Seed script resolves firebase-admin only when NODE_PATH=./node_modules is set (pnpm strict resolution). Updated usage comment accordingly.

### Completion Notes List
- 61 tests seeded across 3 categories: labs (31), imaging (18), procedures_poc (12)
- Endpoint placed after /health, before admin routes, in a new "Library Endpoints" section
- Cache uses module-level variables (same pattern as CDR cache conceptually)
- getDb() is defined later in file (line ~434) but works because route handlers are evaluated lazily at request time
- feedsCdrs arrays populated with CDR IDs from existing clinical-decision-rules.md (heart, wells_pe, wells_dvt, sepsis, canadian_ct_head, nexus, canadian_cspine, perc, ottawa_ankle, ottawa_knee, rumack_matthew, centor, sgarbossa)
- No new npm dependencies needed — firebase-admin and tsx already in backend/package.json

### File List
- `backend/src/types/libraries.ts` — **CREATED** — TestDefinition, TestCategory, TestLibraryResponse types
- `frontend/src/types/libraries.ts` — **CREATED** — Mirror types for frontend consumption
- `scripts/seed-test-library.ts` — **CREATED** — Idempotent Firestore seed script with 61 tests
- `backend/src/index.ts` — **MODIFIED** — Added import, cache variables, GET /v1/libraries/tests endpoint

---

## QA Results

### Review Date: 2026-02-23

### Reviewed By: Quinn (Senior Developer QA)

### Code Quality Assessment

Clean, well-structured implementation that follows established codebase patterns consistently. The 6-step API security pattern is correctly applied to a GET endpoint (adapted from the POST pattern used elsewhere). Type definitions are thorough with useful JSDoc annotations. The seed script mirrors the `load-zip-crosswalk.ts` pattern closely, making it easy for future developers to understand.

The developer made a pragmatic decision to inline types in the seed script rather than importing from the backend types — this keeps the script self-contained and avoids module resolution complexity with pnpm's strict node_modules layout.

### Refactoring Performed

No refactoring needed. The implementation is clean and appropriately scoped.

### Compliance Check

- Coding Standards: ✓ Follows existing patterns (6-step API, Firestore batch writes, JSDoc conventions)
- Project Structure: ✓ Files placed exactly per Dev Notes guidance (`backend/src/types/`, `frontend/src/types/`, `scripts/`)
- Testing Strategy: ✓ Build verification + frontend check pass; story scoped testing to build verification (appropriate for data-layer foundation)
- All ACs Met: ✓ All 6 acceptance criteria verified (see details below)

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| 1. GET endpoint returns categorized list | ✓ | Route at `index.ts:176`, groups by category via `Set` extraction |
| 2. Each test has required fields | ✓ | `TestDefinition` interface has all fields; seed data populates each |
| 3. All spec tests present | ✓ | 61 tests verified: labs (31), imaging (18), procedures_poc (12) — 15/15 spot checks pass |
| 4. Endpoint requires auth | ✓ | Firebase ID token verified at `index.ts:179-185`, returns 401 without token |
| 5. Seed script idempotent | ✓ | Uses `doc(test.id).set(testData)` — deterministic IDs overwrite identically |
| 6. Backend builds cleanly | ✓ | `pnpm build` passes with zero errors; `pnpm check` also clean (6/6 tests) |

### Improvements Checklist

All items handled — no outstanding work needed.

- [x] Types match spec exactly (verified via automated cross-reference of all 61 tests)
- [x] Cache implementation is correct (module-level variables, 5-min TTL)
- [x] Auth follows established 6-step pattern
- [x] No PHI risk (reference catalog only, no patient data)
- [x] Audit logging is metadata-only (action, testCount, timestamp)
- [x] Error responses are generic ("Internal error")

### Security Review

No concerns. The test library is a reference catalog of test types — no PHI, no user-specific data. Authentication is properly required. Error messages are generic. Audit logs contain only metadata. The endpoint is covered by the existing `globalLimiter` (60 req/min).

### Performance Considerations

The in-memory cache with 5-minute TTL is appropriate for this rarely-changing dataset. Concurrent cache misses are benign (both queries produce identical results). The full collection read (~61 small documents) is lightweight and will resolve in <100ms from Firestore.

### Final Status

✓ **Approved — Ready for Done**
