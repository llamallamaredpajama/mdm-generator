# MDM Generator — Backend Technical Requirement Document (TRD)

> **Generated**: 2026-03-13 | **Codebase Snapshot**: commit `ce5f34c` (main branch)
> **Scope**: Exhaustive audit of `/backend/` — every route, helper, API call, Firestore collection, LLM integration, and configuration.

---

## Table of Contents

1. [Step 0: Codebase Orientation](#step-0-codebase-orientation)
2. [Step 1: Express Middleware & Request Pipeline](#step-1-express-middleware--request-pipeline)
3. [Step 2: API Endpoints (Routes)](#step-2-api-endpoints-routes)
4. [Step 3: Internal Helpers, Utilities, and Service Modules](#step-3-internal-helpers-utilities-and-service-modules)
5. [Step 4: External API Integrations](#step-4-external-api-integrations)
6. [Step 5: Firestore Data Model](#step-5-firestore-data-model)
7. [Step 6: LLM / AI Integration Layer](#step-6-llm--ai-integration-layer)
8. [Step 7: Scheduled Jobs & Background Processes](#step-7-scheduled-jobs--background-processes)
9. [Step 8: Authentication & Authorization Model](#step-8-authentication--authorization-model)
10. [Step 9: Configuration, Feature Flags & Operational Concerns](#step-9-configuration-feature-flags--operational-concerns)

---

## Step 0: Codebase Orientation

### Backend Source Tree

```
backend/
├── src/
│   ├── index.ts (2810 lines — Express app entry point, all route handlers, middleware, in-memory caches)
│   ├── vertex.ts — Vertex AI Gemini client (model config, generateContent, timeout, multi-part handling)
│   ├── promptBuilder.ts — Legacy one-shot MDM prompt builder
│   ├── promptBuilderBuildMode.ts — Build Mode section prompts (S1/S2/S3/finalize + helpers)
│   ├── promptBuilderQuickMode.ts — Quick Mode one-shot prompt + response parser
│   ├── promptBuilderReprocess.ts — Gap-reprocessing prompts (Build + Quick mode)
│   ├── promptBuilderAnalytics.ts — Analytics gap insights prompt
│   ├── parsePromptBuilder.ts — Narrative → structured fields parsing prompt
│   ├── buildModeSchemas.ts — Build Mode Zod schemas (requests, responses, Firestore, CDR tracking)
│   ├── outputSchema.ts — Legacy MDM Zod schema + text renderer
│   ├── constants.ts — Physician attestation statement
│   ├── photoCatalog.ts — Photo catalog (Firestore-backed + hardcoded fallback, init, validate, prompt builder)
│   ├── services/
│   │   ├── userService.ts — User CRUD, subscription plan management, quota system
│   │   ├── cdrMatcher.ts — Differential → CDR matching (substring matching algorithm)
│   │   ├── cdrCatalogFormatter.ts — CDR catalog → compact prompt context (max 12K chars)
│   │   ├── cdrCatalogSearch.ts — Vector search CDR library via Firestore embeddings
│   │   ├── cdrTrackingBuilder.ts — CDR tracking initialization + scoring
│   │   ├── testCatalogFormatter.ts — Test catalog → compact prompt context
│   │   ├── testCatalogSearch.ts — Vector search test library via Firestore embeddings
│   │   └── embeddingService.ts — Vertex AI text-embedding-005 client (768 dimensions)
│   ├── surveillance/
│   │   ├── routes.ts — Surveillance API endpoints (/analyze, /report)
│   │   ├── types.ts — Core surveillance domain types
│   │   ├── schemas.ts — Surveillance Zod request schemas
│   │   ├── correlationEngine.ts — Deterministic 5-component clinical correlation scoring (0-100)
│   │   ├── syndromeMapper.ts — Chief complaint → syndrome category keyword mapper
│   │   ├── regionResolver.ts — ZIP/state → HHS region resolver (Firestore + in-memory tables)
│   │   ├── promptAugmenter.ts — Surveillance context builder for LLM injection + MDM text insertion
│   │   ├── pdfGenerator.ts — Multi-page surveillance trend PDF report (PDFKit)
│   │   ├── adapters/
│   │   │   ├── types.ts — Adapter interface contract
│   │   │   ├── adapterRegistry.ts — Orchestrates 3 CDC adapters via Promise.allSettled
│   │   │   ├── cdcRespiratoryAdapter.ts — CDC respiratory hospital data (Influenza/COVID-19/RSV)
│   │   │   ├── cdcWastewaterAdapter.ts — CDC NWSS wastewater SARS-CoV-2 concentrations
│   │   │   └── cdcNndssAdapter.ts — CDC NNDSS notifiable disease case counts
│   │   └── cache/
│   │       └── surveillanceCache.ts — Firestore-backed surveillance data cache with per-source TTL
│   ├── types/
│   │   ├── userProfile.ts — Order set, disposition flow, report template Zod schemas
│   │   └── libraries.ts — Test library & CDR library TypeScript interfaces + Zod schemas
│   └── __tests__/ (test files — not audited)
├── prompts/
│   ├── mdm-gen-guide-v2.md — Core MDM prompt guide (loaded by legacy + Quick Mode builders)
│   ├── mdm-gen-guide-build-s1.md — Build Mode Section 1 prompt guide (loaded by S1 handler)
│   └── mdm-gen-guide-build-s3.md — Build Mode Section 3/finalize prompt guide (loaded by S3 handler)
├── scripts/
│   └── set-plan.ts — Admin script for setting user subscription plans
├── seed-products.ts — Product/price seeding script for Stripe
├── package.json
├── tsconfig.json
├── Dockerfile
└── vitest.config.ts
```

### Runtime Environment

| Setting | Value |
|---------|-------|
| Node.js version | 20 (from `node:20-slim` Docker base image) |
| Cloud Run region | `us-central1` |
| Container base image | `node:20-slim` |
| Module system | CommonJS (via `tsconfig.json`) |
| TypeScript target | ES2022 |
| Default port | 8080 (via `PORT` env var) |
| Build tool | `tsc -p tsconfig.json` → `dist/` output |
| Package manager | pnpm (via Corepack in Docker) |

### Dependencies (with versions)

**Runtime:**

| Package | Version | Purpose |
|---------|---------|---------|
| `@google-cloud/vertexai` | ^1.3.0 | Vertex AI Gemini LLM client |
| `chart.js` | ^4.5.1 | Chart rendering for surveillance PDFs |
| `chartjs-node-canvas` | ^5.0.0 | Server-side chart canvas |
| `dotenv` | ^17.2.1 | Environment variable loading |
| `express` | ^4.19.2 | HTTP framework |
| `express-rate-limit` | ^8.2.1 | Rate limiting middleware |
| `firebase-admin` | ^12.6.0 | Firebase Admin SDK (Auth, Firestore) |
| `google-auth-library` | ^10.6.1 | GCP authentication |
| `helmet` | ^8.1.0 | Security headers |
| `pdfkit` | ^0.17.2 | PDF generation |
| `zod` | ^3.23.8 | Schema validation |

**Dev:**

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/express` | ^4.17.21 | Express type definitions |
| `@types/pdfkit` | ^0.17.5 | PDFKit type definitions |
| `@types/supertest` | ^6.0.3 | Supertest type definitions |
| `supertest` | ^7.2.2 | HTTP testing |
| `tsx` | ^4.19.2 | TypeScript execution (dev server) |
| `typescript` | ~5.8.3 | TypeScript compiler |
| `vitest` | ^4.0.18 | Test framework |

### Environment Variables

| Variable | Required | Purpose | Default |
|----------|----------|---------|---------|
| `PORT` | No | Server listen port | `8080` |
| `PROJECT_ID` | Yes | GCP project ID | — |
| `VERTEX_LOCATION` | No | Vertex AI region | `us-central1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Conditional | Service account key file path (local dev) | — |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Conditional | Service account key as JSON string (Cloud Run) | — |
| `FRONTEND_URL` | No | CORS allowed origin for frontend | — |

### Shared Constants

**`constants.ts`:**

```typescript
export const PHYSICIAN_ATTESTATION = "This documentation was generated from the direct clinical input of the treating physician, based on the patient encounter as described. All content has been reviewed by the physician for accuracy and completeness."
```

### Startup Initialization

| Order | Initialization Step | Happens When | Failure Behavior |
|-------|--------------------|--------------|--------------------|
| 1 | Firebase Admin SDK initialization | `main()` at startup | Tries `GOOGLE_APPLICATION_CREDENTIALS_JSON` (JSON string) → file path → default credentials. Fatal if all fail |
| 2 | Photo catalog warm from Firestore | `initPhotoCatalog(db)` at startup | Logs warning, falls back to hardcoded `PHOTO_CATALOG` (16 categories, ~140 subcategories) |
| 3 | Express listener start | After Firebase + photo init | Listens on `PORT` (default 8080) |

### Prompt Guide Files

| File | Purpose | Loaded By |
|------|---------|-----------|
| `backend/prompts/mdm-gen-guide-v2.md` | Core MDM generation guide — comprehensive EM documentation template with worst-first methodology, complexity determination, required sections | `promptBuilder.ts` (legacy), `promptBuilderQuickMode.ts`, `promptBuilderReprocess.ts` (QM reprocess) |
| `backend/prompts/mdm-gen-guide-build-s1.md` | Build Mode Section 1 guide — initial evaluation and differential diagnosis generation | S1 handler in `index.ts` (line ~1000), with fallback to `mdm-gen-guide-v2.md` |
| `backend/prompts/mdm-gen-guide-build-s3.md` | Build Mode Section 3/finalize guide — treatment, disposition, and final MDM assembly | Finalize handler in `index.ts` (line ~1400), `promptBuilderReprocess.ts` (BM reprocess) |

---

## Step 1: Express Middleware & Request Pipeline

### Middleware Pipeline (Registration Order)

| Order | Middleware | Configuration | Purpose | File:Line |
|-------|-----------|---------------|---------|----|
| 1 | `app.set('trust proxy', true)` | Trusts Cloud Run reverse proxy | Correct client IP for rate limiting | `index.ts:259` |
| 2 | Inline CORS handler | Custom middleware (not `cors()` package) | Cross-origin policy | `index.ts:262-280` |
| 3 | `express.json()` | `{ limit: '1mb' }` | Request body parsing with 1MB limit | `index.ts:282` |
| 4 | `helmet()` | Default configuration | Security headers | `index.ts:285` |
| 5 | `express-rate-limit` (global) | 60 req/min per IP, 60s window | Global rate limiting | `index.ts:288-295` |

### CORS Policy Detail

| Setting | Value |
|---------|-------|
| Allowed Origins | `FRONTEND_URL` env var + `localhost` (any port via regex `/^https?:\/\/localhost(:\d+)?$/`) + Firebase domains (`/^https:\/\/mdm-generator.*\.web\.app$/`) + `https://aimdm.app` |
| Allowed Methods | GET, POST, PUT, DELETE, OPTIONS |
| Allowed Headers | Content-Type, Authorization |
| Credentials | `true` |
| Preflight | Responds `204` to OPTIONS requests |

### Per-Route Rate Limiters (NOT applied globally)

| Limiter | Config | Applied To |
|---------|--------|------------|
| `llmLimiter` | 10 req/min per IP, 60s window | All LLM-calling endpoints (S1, S2, finalize, quick-mode, match-cdrs, suggest-diagnosis, parse-results, legacy generate, analytics) |
| `parseLimiter` | 5 req/min per IP, 60s window | `/v1/parse-narrative` only |

### In-Memory Caches

| Cache | TTL | Key | Content | Populated By |
|-------|-----|-----|---------|-------------|
| `testLibraryCache` | 5 minutes | Singleton | Full `testLibrary` Firestore collection | `getCachedTestLibrary()` helper, line ~315 |
| `cdrLibraryCache` | 5 minutes | Singleton | Full `cdrLibrary` Firestore collection | `getCachedCdrLibrary()` helper, line ~335 |

### Error Handling

No dedicated global error handler middleware. Each route handler wraps its body in `try/catch` and returns `500: { error: 'Internal error' }` on unhandled exceptions. Stack traces are logged to `console.error` but never returned to client.

---

## Step 2: API Endpoints (Routes)

---

### `GET /health`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-001 |
| **Method + Path** | `GET /health` |
| **File Path** | `src/index.ts:480` |
| **Mode** | `shared` |
| **Rate Limit** | Global only (60 req/min) |
| **Authentication** | `none` |
| **Authorization** | None |

**Input Contract:** None (GET, no body)

**Processing Logic:**
1. Returns `{ ok: true }` immediately

**Output Contract:**
```typescript
// Success (200):
{ ok: true }
```

**Firestore Reads/Writes:** None

**Side Effects:** None

**Error Handling:** None

---

### `GET /v1/libraries/tests`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-002 |
| **Method + Path** | `GET /v1/libraries/tests` |
| **File Path** | `src/index.ts:491` |
| **Mode** | `shared` |
| **Rate Limit** | Global only (60 req/min) |
| **Authentication** | `required` — Bearer token in `Authorization` header |
| **Authorization** | Any authenticated user |

**Input Contract:** None (GET, no body). Authorization header required.

**Processing Logic:**
1. Extract `idToken` from `Authorization: Bearer {token}` header
2. Verify token with `admin.auth().verifyIdToken(idToken)`
3. Check `testLibraryCache` — if valid (< 5 min old), return cached response
4. Query Firestore `testLibrary` collection (all documents)
5. Filter: keep docs with `id`, `name`, `category` fields
6. Build unique category list
7. Cache the response with current timestamp
8. Log: `{ action: 'get-test-library', testCount, timestamp }`
9. Return response

**Output Contract:**
```typescript
// Success (200):
interface TestLibraryResponse {
  ok: true;
  tests: TestDefinition[];     // Array of test objects with id, name, category, etc.
  categories: TestCategory[];  // Unique categories: 'labs' | 'imaging' | 'procedures_poc'
  cachedAt: string;            // ISO timestamp of cache population
}

// Error (401): { error: 'Unauthorized' }
// Error (500): { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection/Document Path | Fields Read | Purpose |
|-----------|--------------------------|-------------|---------|
| `read` | `testLibrary` (all docs) | `id`, `name`, `category`, `subcategory`, `commonIndications`, `unit`, `normalRange`, `quickFindings`, `feedsCdrs` | Load test catalog |

**Side Effects:** Populates in-memory cache for 5 minutes.

---

### `GET /v1/libraries/cdrs`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-003 |
| **Method + Path** | `GET /v1/libraries/cdrs` |
| **File Path** | `src/index.ts:549` |
| **Mode** | `shared` |
| **Rate Limit** | Global only (60 req/min) |
| **Authentication** | `required` — Bearer token in `Authorization` header |
| **Authorization** | Any authenticated user |

**Input Contract:** None (GET, no body). Authorization header required.

**Processing Logic:**
1. Extract `idToken` from `Authorization: Bearer {token}` header
2. Verify token with `admin.auth().verifyIdToken(idToken)`
3. Call `getCachedCdrLibrary()` helper (shared 5-min cache)
4. Log: `{ action: 'list-cdrs', cdrCount, timestamp }`
5. Return CDR list

**Output Contract:**
```typescript
// Success (200):
{
  ok: true;
  cdrs: CdrDefinition[];  // Array with id, name, components, scoring, etc.
}

// Error (401): { error: 'Unauthorized' }
// Error (500): { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection/Document Path | Fields Read | Purpose |
|-----------|--------------------------|-------------|---------|
| `read` | `cdrLibrary` (all docs) | All fields except `embedding` | Load CDR catalog (via cache) |

---

### `POST /v1/admin/set-plan`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-004 |
| **Method + Path** | `POST /v1/admin/set-plan` |
| **File Path** | `src/index.ts:578` |
| **Mode** | `admin` |
| **Rate Limit** | Global only (60 req/min) |
| **Authentication** | `admin-only` — verifies admin custom claim |
| **Authorization** | Token holder must have `admin: true` custom claim |

**Input Contract:**
```typescript
interface AdminSetPlanRequest {
  adminToken: string;   // Firebase ID token (min 10 chars)
  targetUid: string;    // User to update (min 1 char)
  plan: 'free' | 'pro' | 'enterprise';  // Target plan
}
// Validated by inline Zod schema
```

**Processing Logic:**
1. Validate request body: `adminToken` (min 10), `targetUid` (min 1), `plan` (enum)
2. Verify `adminToken` with `admin.auth().verifyIdToken()`
3. Check `decoded.admin === true` custom claim
4. Call `userService.adminSetPlan(targetUid, plan)` — sets plan, resets usage, updates features

**Output Contract:**
```typescript
// Success (200): { ok: true, message: 'Plan updated to {plan} for user {targetUid}' }
// Error (400): { error: 'Invalid request' }
// Error (401): { error: 'Invalid admin token' }
// Error (403): { error: 'Admin access required' }
// Error (500): { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection/Document Path | Fields Written | Purpose |
|-----------|--------------------------|----------------|---------|
| `write` | `users/{targetUid}` | `plan`, `features`, `usedThisPeriod` (reset to 0), `subscriptionStartDate`, `updatedAt` | Update user plan |

---

### `POST /v1/whoami`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-005 |
| **Method + Path** | `POST /v1/whoami` |
| **File Path** | `src/index.ts:613` |
| **Mode** | `shared` |
| **Rate Limit** | Global only (60 req/min) |
| **Authentication** | `required` — ID token in **request body** (NOT Bearer header) |
| **Authorization** | Valid Firebase ID token |

**Input Contract:**
```typescript
interface WhoamiRequest {
  userIdToken: string;  // Firebase ID token (min 10 chars)
}
// Validated by inline Zod schema
```

**Processing Logic:**
1. Validate request body
2. Verify `userIdToken` with `admin.auth().verifyIdToken()`
3. Extract `uid`, `email` from decoded token
4. Ensure user exists via `userService.ensureUser(uid, email)` — creates user doc if new
5. Get usage stats via `userService.getUsageStats(uid)` — includes Stripe subscription check
6. Return user profile + stats

**Output Contract:**
```typescript
// Success (200):
interface WhoamiResponse {
  ok: true;
  uid: string;
  email: string;
  onboardingCompleted: boolean;
  displayName: string | null;
  credentialType: 'MD' | 'DO' | 'NP' | 'PA' | null;
  plan: 'free' | 'pro' | 'enterprise' | 'admin';
  used: number;
  limit: number;
  remaining: number;
  features: {
    maxRequestsPerMonth: number;
    maxTokensPerRequest: number;
    priorityProcessing: boolean;
    exportFormats: string[];
    apiAccess: boolean;
    teamMembers: number;
  };
}

// Error (400): { error: 'Invalid request' }
// Error (401): { error: 'Unauthorized' }
// Error (500): { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection/Document Path | Fields Read or Written | Purpose |
|-----------|--------------------------|------------------------|---------|
| `read` | `users/{uid}` | All fields | Load or create user profile |
| `write` (conditional) | `users/{uid}` | `uid`, `email`, `plan`, `features`, `createdAt`, `updatedAt`, `usedThisPeriod`, `periodKey`, `totalRequests`, `onboardingCompleted` | Create new user if not exists |
| `read` | `customers/{uid}/subscriptions` (query) | `status`, `items[0].price.id`, `items[0].price.product` | Check Stripe subscription for effective plan |

---

### `POST /v1/parse-narrative`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-006 |
| **Method + Path** | `POST /v1/parse-narrative` |
| **File Path** | `src/index.ts:655` |
| **Mode** | `shared` |
| **Rate Limit** | `parseLimiter` (5 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | Valid Firebase ID token |

**Input Contract:**
```typescript
interface ParseNarrativeRequest {
  narrative: string;     // 1-16000 chars
  userIdToken: string;   // Firebase ID token (min 10 chars)
}
// Validated by inline Zod schema
```

**Processing Logic:**
1. Validate request body via Zod
2. Verify `userIdToken` — return 401 on failure
3. Build prompt via `buildParsePrompt(narrative)` (HLP-007)
4. Call `callGemini(prompt)` (API-002)
5. Clean response: remove markdown code fences
6. Try JSON parse:
   - Success: use as `ParsedNarrative`
   - Failure: try to find JSON between first `{` and last `}`
   - Complete failure: return `getEmptyParsedNarrative()` fallback
7. Set defaults: `confidence` (default 0.5), `warnings` (default `[]`)
8. Log: `{ action: 'parse-narrative', uid, confidence, timestamp }` (no PHI)
9. Return parsed result

**Output Contract:**
```typescript
// Success (200):
interface ParseNarrativeResponse {
  ok: true;
  parsed: {
    chiefComplaint: { complaint: string; context: string; age: string; sex: string };
    problemsConsidered: { emergent: string[]; nonEmergent: string[] };
    dataReviewed: { labs: string; imaging: string; ekg: string; externalRecords: string; independentHistorian: string };
    riskAssessment: { patientFactors: string; diagnosticRisks: string; treatmentRisks: string; dispositionRisks: string; highestRiskElement: string };
    clinicalReasoning: { evaluationApproach: string; keyDecisionPoints: string; workingDiagnosis: string };
    treatmentProcedures: { medications: string; procedures: string; rationale: string };
    disposition: { decision: string; levelOfCare: string; rationale: string; dischargeInstructions: string; followUp: string; returnPrecautions: string };
    confidence: number;
    warnings: string[];
  };
  confidence: number;
  warnings: string[];
}

// Error (400): { error: 'Invalid request' }
// Error (401): { error: 'Unauthorized' }
// Error (500): { error: 'Internal error' }
```

**Firestore Reads/Writes:** None

**Side Effects:** One LLM call (Gemini). No quota impact.

---

### `POST /v1/generate`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-007 |
| **Method + Path** | `POST /v1/generate` |
| **File Path** | `src/index.ts:733` |
| **Mode** | `legacy` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | Valid Firebase ID token + quota check |

**Input Contract:**
```typescript
interface GenerateRequest {
  narrative: string;     // 1-16000 chars
  userIdToken: string;   // Firebase ID token (min 10 chars)
}
// Validated by inline Zod schema
```

**Processing Logic:**
1. Validate request body
2. Verify token, extract `uid`, `email`
3. `userService.ensureUser(uid, email)`
4. `userService.checkAndIncrementQuota(uid)` — atomic transaction. If quota exceeded: return 402
5. Check token size: `checkTokenSize(narrative, maxTokensPerRequest)`
6. Build prompt: `await buildPrompt(narrative)` (HLP-001)
7. Call `callGemini(prompt)` — expects JSON + `---TEXT---` + rendered text
8. Clean response, split by `\n---TEXT---\n`
9. Parse JSON part with `MdmSchema`, use text part or render via `renderMdmText(mdm)`
10. Fallback on parse error: search for JSON braces
11. On complete failure: return conservative stub with attestation
12. Log: `{ action: 'generate', endpoint, responseLength, timestamp }`

**Output Contract:**
```typescript
// Success (200):
{
  ok: true;
  draft: string;           // Rendered MDM text
  draftJson: Mdm;          // Structured MDM JSON
  uid: string;
  remaining: number;
  plan: string;
  used: number;
  limit: number;
}

// Error (400): { error: 'Invalid request' } or { error: 'Input too large', ... }
// Error (401): { error: 'Unauthorized' }
// Error (402): { error: 'Monthly quota exceeded', remaining, plan, limit, used }
// Error (500): { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection | Purpose |
|-----------|-----------|---------|
| `read+write` (transaction) | `users/{uid}` | Atomic quota check and increment |

---

### `POST /v1/build-mode/process-section1`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-008 |
| **Method + Path** | `POST /v1/build-mode/process-section1` |
| **File Path** | `src/index.ts:861` |
| **Mode** | `build-mode` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must own encounter. Quota counted on first submission only. |

**Input Contract:**
```typescript
// Section1RequestSchema (buildModeSchemas.ts:18-26)
interface Section1Request {
  encounterId: string;   // min 1 char
  content: string;       // min 1, max 2000 chars
  userIdToken: string;   // min 10 chars
  location?: {           // Optional, for surveillance enrichment
    zipCode?: string;
    state?: string;
  };
}
```

**Processing Logic:**
1. **Validate** via `Section1RequestSchema.safeParse()`
2. **Authenticate** via `verifyIdToken(userIdToken)`
3. **Get encounter** from `customers/{uid}/encounters/{encounterId}` — verify exists + ownership
4. **Check submission count**: `section1.submissionCount || 0` — if >= 2, return 400 "Section 1 is locked"
5. **Handle quota** (only on first submission):
   - If `!encounter.quotaCounted`: `ensureUser()` → `checkAndIncrementQuota()` → if exceeded: 402 → else: `update({ quotaCounted: true })`
6. **Check token limit** against plan's `maxTokensPerRequest`
7. **Surveillance enrichment** (non-blocking):
   - If location provided: `mapToSyndromes()` → `RegionResolver.resolve()` → `AdapterRegistry.fetchAll()` → `computeCorrelations()` → `buildSurveillanceContext()`
   - All errors caught and logged as warnings
8. **CDR enrichment** (non-blocking):
   - `searchCdrCatalog(content, db, 15)` → `formatCdrContext(results)`
   - Errors caught and logged
9. **Load prompt guide**: Try `mdm-gen-guide-build-s1.md`, fallback to `mdm-gen-guide-v2.md`
10. **Build test catalog**: `getRelevantTests(content, 50)` or fallback to full cached library → `buildCompactCatalog(tests)`
11. **Build photo catalog**: `buildPhotoCatalogPrompt()`
12. **Build prompt**: `buildSection1Prompt(content, systemPrompt, survCtx, cdrCtx, testCatalog, photoCatalog)` (HLP-002)
13. **Call Gemini**: `callGemini(prompt, { timeoutMs: 90_000 })`
14. **Parse response**:
    - `cleanLlmJsonResponse(result.text)` → JSON.parse
    - Handle legacy format (array) vs new format (object with `differential`, `cdrAnalysis`, `workupRecommendations`, `encounterPhoto`)
    - `coerceAndValidateDifferential(items)` — maps LLM urgency variations to valid enum
    - Validate/deduplicate `cdrAnalysis` (non-blocking)
    - Validate `workupRecommendations` (non-blocking)
    - `validatePhoto(rawParsed.encounterPhoto)` (HLP-012)
    - Fallback on parse error: minimal differential with error message
15. **Update Firestore**: encounter doc with `section1`, `surveillanceContext`, `cdrContext`, `encounterPhoto`, `status: 'section1_done'`
16. **Log**: `{ action: 'process-section1', uid, encounterId, submissionCount, cdrAnalysisCount, workupRecsCount, timestamp }`

**Output Contract:**
```typescript
// Success (200):
interface Section1SuccessResponse {
  ok: true;
  differential: DifferentialItem[];          // { diagnosis, urgency, reasoning, regionalContext?, cdrContext? }
  cdrAnalysis?: CdrAnalysisItem[];           // { name, cdrId?, applicable, score?, interpretation?, missingData?, availableData?, reasoning? }
  workupRecommendations?: WorkupRecommendation[];  // { testName, testId?, reason, source, priority? }
  submissionCount: number;
  isLocked: boolean;
}

// Error (400): "Invalid request" | "Section 1 is locked after 2 submissions" | "Input too large"
// Error (401): { error: 'Unauthorized' }
// Error (402): { error: 'Monthly quota exceeded', remaining, plan, limit, used }
// Error (404): { error: 'Encounter not found' }
// Error (500): { error: 'Internal configuration error' } | { error: 'Failed to process section 1' } | { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection/Document Path | Fields | Purpose |
|-----------|--------------------------|--------|---------|
| `read` | `customers/{uid}/encounters/{encounterId}` | `section1`, `quotaCounted`, `status` | Load encounter state |
| `write` (transaction, conditional) | `users/{uid}` | `usedThisPeriod`, `totalRequests`, `periodKey` | Quota increment |
| `write` | `customers/{uid}/encounters/{encounterId}` | `quotaCounted` | Mark quota as counted |
| `write` | `customers/{uid}/encounters/{encounterId}` | `section1` (content, llmResponse, submissionCount, status, lastUpdated), `surveillanceContext`, `cdrContext`, `encounterPhoto`, `status`, `updatedAt` | Save S1 results |

---

### `POST /v1/build-mode/process-section2`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-009 |
| **Method + Path** | `POST /v1/build-mode/process-section2` |
| **File Path** | `src/index.ts:1181` |
| **Mode** | `build-mode` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must own encounter. S1 must be completed. |

**Input Contract:**
```typescript
// Section2RequestSchema (buildModeSchemas.ts:39-63)
interface Section2Request {
  encounterId: string;    // min 1 char
  content: string;        // min 1, max 2000 chars
  workingDiagnosis?: string;
  userIdToken: string;    // min 10 chars
  selectedTests?: string[];
  testResults?: Record<string, {
    status: 'unremarkable' | 'abnormal' | 'pending';
    quickFindings?: string[];
    notes?: string | null;
    value?: string | null;
    unit?: string | null;
  }>;
  structuredDiagnosis?: string | {
    selected: string | null;
    custom?: string | null;
    suggestedOptions?: string[];
  };
}
```

**Processing Logic:**
1. **Validate** via `Section2RequestSchema.safeParse()`
2. **Authenticate** via `verifyIdToken(userIdToken)`
3. **Get encounter** and verify ownership
4. **Verify S1 completed**: `section1.status !== 'completed'` → 400
5. **Check submission count**: >= 2 → 400 "Section 2 is locked"
6. **Data persistence only — NO LLM call** (S2 is pure data entry)
7. **Update Firestore**: `section2` (content, submissionCount, status: 'completed', selectedTests, testResults, workingDiagnosis), `status: 'section2_done'`
8. **Log**: `{ action: 'process-section2', uid, encounterId, submissionCount, dataOnly: true, timestamp }`

**Output Contract:**
```typescript
// Success (200):
{ ok: true; submissionCount: number; isLocked: boolean }
// NOTE: No mdmPreview returned — S2 is data-only

// Error (400): "Invalid request" | "Section 2 is locked" | "Section 1 must be completed"
// Error (401): { error: 'Unauthorized' }
// Error (404): { error: 'Encounter not found' }
// Error (500): { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection/Document Path | Fields | Purpose |
|-----------|--------------------------|--------|---------|
| `read` | `customers/{uid}/encounters/{encounterId}` | `section1.status`, `section2.submissionCount` | Check prerequisites + lock |
| `write` | `customers/{uid}/encounters/{encounterId}` | `section2` (all fields), `status`, `updatedAt` | Persist S2 data |

**Side Effects:** None — no LLM call, no quota impact.

---

### `POST /v1/build-mode/finalize`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-010 |
| **Method + Path** | `POST /v1/build-mode/finalize` |
| **File Path** | `src/index.ts:1279` |
| **Mode** | `build-mode` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must own encounter. S2 must be completed. No quota impact (already counted in S1). |

**Input Contract:**
```typescript
// FinalizeRequestSchema (buildModeSchemas.ts:71-84)
interface FinalizeRequest {
  encounterId: string;   // min 1 char
  content: string;       // min 1, max 2000 chars (S3 treatment & disposition narrative)
  userIdToken: string;   // min 10 chars
  workingDiagnosis?: string | {
    selected: string | null;
    custom?: string | null;
    suggestedOptions?: string[];
  };
}
```

**Processing Logic:**
1. **Validate** via `FinalizeRequestSchema.safeParse()`
2. **Authenticate** via `verifyIdToken(userIdToken)`
3. **Get encounter** and verify ownership
4. **Verify S2 completed**: `section2.status !== 'completed'` → 400
5. **Check submission count**: >= 2 → 400 "Section 3 is locked"
6. **Check token limit** against plan
7. **Reconstruct S1 response**: handle both legacy (array) and new (object) formats for differential
8. **Build S2 data**: content, mdmPreview (if LLM-processed in old flow), workingDiagnosis
9. **Retrieve stored surveillance context** from encounter (stored during S1)
10. **Build CDR context** dynamically from `encounter.cdrTracking` via `buildCdrContextString()` (HLP-009)
11. **Build structured data** from S2/S3 fields: selectedTests, testResults, workingDiagnosis, treatments, cdrSuggestedTreatments, disposition, followUp
12. **Load S3 prompt guide**: `mdm-gen-guide-build-s3.md` (optional fallback)
13. **Build photo catalog**: `buildPhotoCatalogPrompt()`
14. **Build prompt**: `buildFinalizePrompt(s1Data, s2Data, s3Content, survCtx, cdrCtx, structuredData, s3Guide, photoCatalog)` (HLP-003)
15. **Call Gemini** with JSON mode: `callGemini(prompt, { jsonMode: true, timeoutMs: 90_000 })`
16. **Parse response**:
    - Clean markdown fences, parse JSON
    - Handle `{ finalMdm: {...} }` wrapper vs direct object
    - Normalize fields: `flattenToStrings()`, `stringifyDisposition()`, `normalizeComplexity()`
    - `safeParseGaps(rawParsed.gaps)` (HLP-015)
    - `validatePhoto(rawParsed.encounterPhoto)` (HLP-012)
    - Validate with `FinalMdmSchema` — on failure: fallback MDM with `generationFailed = true`
17. **Deterministic surveillance enrichment**:
    - If stored surveillance context exists AND dataReviewed doesn't already mention surveillance:
      - Add surveillance summary to `dataReviewed` array
      - `appendSurveillanceToMdmText()` inserts surveillance line into MDM text
18. **Update Firestore**: `section3` (content, llmResponse, submissionCount, status), `encounterPhoto`, `status: 'finalized'` (or `'section3_error'` if failed)
19. **Increment gap tallies** on user profile (if gaps exist):
    - `gapTallies.identified.{gapId}` += 1
    - `gapTallies.identifiedByPeriod.{period}.{gapId}` += 1
    - `gapMeta.{gapId}` = { category, method }
20. **Log**: `{ action: 'finalize', uid, encounterId, submissionCount, gapCount, timestamp }`

**Output Contract:**
```typescript
// Success (200):
interface FinalizeSuccessResponse {
  ok: true;
  generationFailed: boolean;    // true if LLM response couldn't be parsed
  finalMdm: {
    text: string;               // Copy-pastable MDM text
    json: {
      problems: string | string[];
      differential: string | string[];
      dataReviewed: string | string[];
      reasoning: string;
      risk: string | string[];
      disposition: string;
      complexityLevel?: 'low' | 'moderate' | 'high';
      regionalSurveillance?: string;
      clinicalDecisionRules?: string;
    };
  };
  gaps: GapItem[];             // Documentation gap opportunities
  quotaRemaining: number;
}

// Error (400): "Invalid request" | "Section 3 is locked" | "Section 2 must be completed" | "Input too large"
// Error (401): { error: 'Unauthorized' }
// Error (404): { error: 'Encounter not found' }
// Error (500): { error: 'Failed to finalize encounter' } | { error: 'Internal error' }
```

**Firestore Reads/Writes:**

| Operation | Collection/Document Path | Fields | Purpose |
|-----------|--------------------------|--------|---------|
| `read` | `customers/{uid}/encounters/{encounterId}` | All | Load full encounter state |
| `write` | `customers/{uid}/encounters/{encounterId}` | `section3`, `encounterPhoto`, `status`, `updatedAt` | Save final MDM |
| `write` (conditional) | `customers/{uid}` | `gapTallies`, `gapMeta` | Increment gap tracking tallies |

---

### `POST /v1/build-mode/match-cdrs`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-011 |
| **Method + Path** | `POST /v1/build-mode/match-cdrs` |
| **File Path** | `src/index.ts:1612` |
| **Mode** | `build-mode` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must own encounter. S1 must be completed. No quota impact. |

**Input Contract:**
```typescript
// MatchCdrsRequestSchema (buildModeSchemas.ts:359-362)
interface MatchCdrsRequest {
  encounterId: string;   // min 1 char
  userIdToken: string;   // min 10 chars
}
```

**Processing Logic:**
1. **Validate** via Zod schema
2. **Authenticate** via `verifyIdToken(userIdToken)`
3. **Get encounter** and verify ownership
4. **Verify S1 completed**: check status in `[section1_done, section2_done, finalized]` and `section1.llmResponse` exists
5. **Extract differential** from S1 response (handle both formats)
6. **Get CDR library** via `getCachedCdrLibrary()`
7. **Match CDRs**: `matchCdrsFromDifferential(differential, cdrs)` (HLP-008) — substring matching
8. **Auto-populate components** (non-blocking):
   - Build prompt: `buildCdrAutoPopulatePrompt(s1Content, matchedCdrs)` (HLP-006)
   - Call Gemini if prompt is valid
   - Parse JSON response (non-blocking on error)
9. **Build CDR tracking**: `buildCdrTracking(matchedCdrs, autoPopulated)` (HLP-009)
10. **Write to Firestore**: `encounterRef.update({ cdrTracking, updatedAt })`
11. **Log**: `{ action: 'match-cdrs', uid, encounterId, matchedCount, autoPopulated, timestamp }`

**Output Contract:**
```typescript
// Success (200):
interface MatchCdrsSuccessResponse {
  ok: true;
  cdrTracking: Record<string, CdrTrackingEntry>;   // { name, status, components, score, ... }
  matchedCount: number;
}

// Error (400): "Invalid request" | "Section 1 must be completed"
// Error (401): { error: 'Unauthorized' }
// Error (404): { error: 'Encounter not found' }
// Error (500): { error: 'Internal error' }
```

---

### `POST /v1/build-mode/suggest-diagnosis`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-012 |
| **Method + Path** | `POST /v1/build-mode/suggest-diagnosis` |
| **File Path** | `src/index.ts:1761` |
| **Mode** | `build-mode` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must own encounter. S1 must be completed. No quota impact. |

**Input Contract:**
```typescript
// SuggestDiagnosisRequestSchema (buildModeSchemas.ts:383-386)
interface SuggestDiagnosisRequest {
  encounterId: string;   // min 1 char
  userIdToken: string;   // min 10 chars
}
```

**Processing Logic:**
1. Validate, authenticate, get encounter, verify S1
2. Extract differential from S1 (handle both formats)
3. Build test results summary from S2 data (if available): format non-pending results
4. Build prompt: `buildSuggestDiagnosisPrompt(differential, chiefComplaint, testResultsSummary)` (HLP-005)
5. Call Gemini → parse JSON array of diagnosis suggestions
6. Filter non-empty, limit to 7 items; fallback: top 3 differential diagnoses
7. Log and return

**Output Contract:**
```typescript
// Success (200):
{ ok: true; suggestions: string[] }  // 1-7 ranked diagnosis suggestions

// Error (400): "Invalid request" | "Section 1 must be completed" | "No differential available"
// Error (401): { error: 'Unauthorized' }
// Error (404): { error: 'Encounter not found' }
// Error (500): { error: 'Internal error' }
```

---

### `POST /v1/build-mode/parse-results`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-013 |
| **Method + Path** | `POST /v1/build-mode/parse-results` |
| **File Path** | `src/index.ts:1880` |
| **Mode** | `build-mode` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must own encounter. No quota impact. |

**Input Contract:**
```typescript
// ParseResultsRequestSchema (buildModeSchemas.ts:406-411)
interface ParseResultsRequest {
  encounterId: string;     // min 1 char
  pastedText: string;      // min 1, max 8000 chars (lab/EHR text)
  orderedTestIds: string[];  // Array of test IDs to match against
  userIdToken: string;     // min 10 chars
}
```

**Processing Logic:**
1. Validate, authenticate, get encounter
2. Load test definitions for ordered tests from cached test library
3. If no valid ordered tests found: return 400
4. Build prompt: `buildParseResultsPrompt(pastedText, orderedTests)` (HLP-006a)
5. Call Gemini → parse `{ parsed: [], unmatchedText: [] }`
6. Validate each parsed item: `testId` must match an ordered test, coerce status
7. Return parsed results + unmatched text

**Output Contract:**
```typescript
// Success (200):
{
  ok: true;
  parsed: Array<{
    testId: string;
    testName: string;
    status: 'unremarkable' | 'abnormal';
    value?: string;
    unit?: string;
    notes?: string;
  }>;
  unmatchedText?: string[];
}

// Error (400): "Invalid request" | "No valid ordered tests found"
// Error (401): { error: 'Unauthorized' }
// Error (404): { error: 'Encounter not found' }
// Error (500): { error: 'Internal error' }
```

---

### `POST /v1/quick-mode/generate`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-014 |
| **Method + Path** | `POST /v1/quick-mode/generate` |
| **File Path** | `src/index.ts:2006` |
| **Mode** | `quick-mode` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must own encounter. Encounter must be `mode: 'quick'`. Quota counted on first submission only. |

**Input Contract:**
```typescript
// QuickModeGenerateSchema (index.ts:1991-1999)
interface QuickModeGenerateRequest {
  encounterId: string;   // min 1 char
  narrative: string;     // 1-16000 chars
  userIdToken: string;   // min 10 chars
  location?: {           // Optional, for surveillance enrichment
    zipCode?: string;
    state?: string;
  };
}
```

**Processing Logic:**
1. Validate, authenticate, get encounter, verify ownership
2. Verify `mode === 'quick'` (400 otherwise)
3. Check if already processed: `quickModeData.status === 'completed'` → 400
4. Handle quota: count only if `!encounter.quotaCounted`
5. Get usage stats, check token limit
6. Mark as processing: `{ 'quickModeData.status': 'processing', 'quickModeData.narrative': narrative }`
7. **Surveillance enrichment** (non-blocking, same pattern as S1)
8. **CDR enrichment** (non-blocking)
9. Build prompt: `buildQuickModePrompt(narrative, survCtx, cdrCtx, photoCatalog)` (HLP-004)
10. Call Gemini with JSON mode: `callGemini(prompt, { jsonMode: true, timeoutMs: 90_000 })`
11. Parse: `parseQuickModeResponse(result.text)` → `{ text, json, patientIdentifier, gaps, encounterPhoto }`
12. Deterministic surveillance enrichment (same pattern as finalize)
13. Update Firestore: `quickModeData`, `chiefComplaint`, `encounterPhoto`, `status`
14. Increment gap tallies (same as finalize)
15. Log and return

**Output Contract:**
```typescript
// Success (200):
{
  ok: true;
  generationFailed: boolean;
  mdm: {
    text: string;
    json: { problems, differential, dataReviewed, dataOrdered, reasoning, risk, disposition, complexityLevel };
  };
  patientIdentifier: { age?: string; sex?: string; chiefComplaint?: string };
  gaps: GapItem[];
  quotaRemaining: number;
}

// Error (400): "Invalid request" | "This endpoint is for quick mode only" | "Encounter already processed" | "Input too large"
// Error (401): { error: 'Unauthorized' }
// Error (402): { error: 'Monthly quota exceeded', remaining, plan, limit, used }
// Error (404): { error: 'Encounter not found' }
// Error (500): { error: 'Internal error' }
```

---

### User Profile CRUD Endpoints

All user profile CRUD endpoints use `authenticateRequest()` helper (Bearer token in Authorization header, returns `uid` or sends 401).

---

#### `GET /v1/user/order-sets`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-015 |
| **File Path** | `src/index.ts:2288` |
| **Mode** | `shared` |
| **Auth** | Bearer token |
| **Firestore Path** | `customers/{uid}/orderSets` |

Returns: `{ ok: true, items: OrderSet[] }`

---

#### `POST /v1/user/order-sets`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-016 |
| **File Path** | `src/index.ts:2302` |
| **Validation** | `OrderSetCreateSchema`: `name` (1-100 chars), `tests` (1-50 items), `tags?` (max 20, default []) |

Creates doc with `createdAt`, `usageCount: 0`. Returns: 201 with created item.

---

#### `PUT /v1/user/order-sets/:id`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-017 |
| **File Path** | `src/index.ts:2325` |
| **Validation** | `OrderSetUpdateSchema`: same fields as create |

Updates only non-undefined fields. Returns updated item.

---

#### `DELETE /v1/user/order-sets/:id`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-018 |
| **File Path** | `src/index.ts:2356` |

Deletes doc. Returns: `{ ok: true, id }`.

---

#### `GET /v1/user/dispo-flows`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-019 |
| **File Path** | `src/index.ts:2380` |
| **Firestore Path** | `customers/{uid}/dispoFlows` |

Same pattern as order sets.

---

#### `POST /v1/user/dispo-flows`

| **Endpoint ID** | EP-020 |
| **File Path** | `src/index.ts:2394` |
| **Validation** | `DispositionFlowCreateSchema`: `name` (1-100), `disposition` (min 1), `followUp?` (max 20, default []) |

---

#### `PUT /v1/user/dispo-flows/:id`

| **Endpoint ID** | EP-021 | **File Path** | `src/index.ts:2417` |

---

#### `DELETE /v1/user/dispo-flows/:id`

| **Endpoint ID** | EP-022 | **File Path** | `src/index.ts:2448` |

---

#### `GET /v1/user/report-templates`

| **Endpoint ID** | EP-023 | **File Path** | `src/index.ts:2472` |
| **Firestore Path** | `customers/{uid}/reportTemplates` |

---

#### `POST /v1/user/report-templates`

| **Endpoint ID** | EP-024 | **File Path** | `src/index.ts:2486` |
| **Validation** | `ReportTemplateCreateSchema`: `testId` (min 1), `name` (1-100), `text` (1-2000), `defaultStatus` ('unremarkable' | 'abnormal') |

---

#### `PUT /v1/user/report-templates/:id`

| **Endpoint ID** | EP-025 | **File Path** | `src/index.ts:2509` |

---

#### `DELETE /v1/user/report-templates/:id`

| **Endpoint ID** | EP-026 | **File Path** | `src/index.ts:2537` |

---

#### Usage Tracking Endpoints

| Endpoint ID | Method + Path | File Path | Purpose |
|-------------|---------------|-----------|---------|
| EP-027 | `POST /v1/user/order-sets/:id/use` | `src/index.ts:2561` | Increment `usageCount` via `FieldValue.increment(1)` |
| EP-028 | `POST /v1/user/dispo-flows/:id/use` | `src/index.ts:2584` | Same pattern |
| EP-029 | `POST /v1/user/report-templates/:id/use` | `src/index.ts:2607` | Same pattern |

All return: `{ ok: true, usageCount: number }`

---

#### `GET /v1/user/options`

| **Endpoint ID** | EP-030 | **File Path** | `src/index.ts:2632` |

Reads `customers/{uid}.customizableOptions`. Returns: `{ ok: true, options: { dispositionOptions?, followUpOptions? } }`

---

#### `PUT /v1/user/options`

| **Endpoint ID** | EP-031 | **File Path** | `src/index.ts:2647` |
| **Validation** | `CustomizableOptionsSchema`: `dispositionOptions?` (max 30), `followUpOptions?` (max 30) |

Merges into `customers/{uid}` doc. Returns updated options.

---

#### `POST /v1/user/complete-onboarding`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-032 |
| **Method + Path** | `POST /v1/user/complete-onboarding` |
| **File Path** | `src/index.ts:2677` |
| **Mode** | `shared` |
| **Rate Limit** | Global only |
| **Authentication** | `required` — Bearer token |
| **Authorization** | Any authenticated user |

**Input Contract:**
```typescript
// CompleteOnboardingSchema (index.ts:2667-2675)
interface CompleteOnboardingRequest {
  displayName: string;               // 1-100 chars
  credentialType: 'MD' | 'DO' | 'NP' | 'PA';
  surveillanceLocation?: {
    state?: string;                  // 2 chars
    zipCode?: string;                // regex /^\d{5}$/
  };
  acknowledgedLimitations: true;     // Must be literal true
}
```

**Processing Logic:**
1. Authenticate via Bearer token
2. Validate body
3. Check if already completed: `user.onboardingCompleted === true` → 409
4. Update `users/{uid}`: `displayName`, `credentialType`, `onboardingCompleted: true`, `updatedAt`, optional `surveillanceLocation`
5. Log: `{ userId, action: 'complete-onboarding', timestamp }`

**Output Contract:**
```typescript
// Success (200): { ok: true }
// Error (400): { error: 'Invalid request' }
// Error (401): { error: 'Unauthorized' }
// Error (409): { error: 'Onboarding already completed' }
// Error (500): { error: 'Internal error' }
```

---

### `POST /v1/analytics/insights`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-033 |
| **Method + Path** | `POST /v1/analytics/insights` |
| **File Path** | `src/index.ts:2721` |
| **Mode** | `shared` |
| **Rate Limit** | `llmLimiter` (10 req/min per IP) + custom 1/hour per user |
| **Authentication** | `required` — Bearer token |
| **Authorization** | Plan must be `pro`, `enterprise`, or `admin` |

**Input Contract:** None (no body fields).

**Processing Logic:**
1. Authenticate via Bearer token
2. Get user via `userService.getUser(uid)`
3. Check plan: free → 403
4. Fetch gap data: `gapTallies.identified`, `gapMeta` from `customers/{uid}`
5. Rate limit: check `lastInsightsGeneratedAt` — if < 1 hour, return 429
6. If no gap data: return static message
7. Build prompt: `buildAnalyticsInsightsPrompt(tallies, meta)` (HLP-013)
8. Call Gemini → returns plain text insights
9. Update: `lastInsightsGeneratedAt` on customer doc
10. Log and return

**Output Contract:**
```typescript
// Success (200): { ok: true; insights: string }  // 2-3 paragraphs of actionable advice
// Error (401): { error: 'Unauthorized' }
// Error (403): { error: 'Pro plan or higher required' }
// Error (404): { error: 'User not found' }
// Error (429): { error: 'Insights can only be generated once per hour', retryAfterMs: number }
// Error (500): { error: 'Internal error' }
```

---

### `POST /v1/surveillance/analyze`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-034 |
| **Method + Path** | `POST /v1/surveillance/analyze` |
| **File Path** | `src/surveillance/routes.ts:129` |
| **Mode** | `surveillance` |
| **Rate Limit** | Global only (60 req/min) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | Plan must be `pro` or `enterprise` (NOT free) |

**Input Contract:**
```typescript
// TrendAnalysisRequestSchema (surveillance/schemas.ts:8-19)
interface TrendAnalysisRequest {
  userIdToken: string;    // min 10 chars
  chiefComplaint: string; // 1-500 chars
  differential: string[]; // 1-20 items
  location: {
    zipCode?: string;     // regex /^\d{5}$/
    state?: string;       // length 2
  };  // Refined: at least one of zipCode or state required
}
```

**Processing Logic:**
1. **Validate** via Zod schema
2. **Authenticate** via `verifyIdToken(userIdToken)`
3. **Authorize**: free plan → 403
4. **Execute**:
   - `mapToSyndromes(chiefComplaint, differential)` (HLP-019)
   - `RegionResolver.resolve(location)` (HLP-020) — 400 if unresolvable
   - `AdapterRegistry.fetchAll(region, syndromes)` (HLP-017) — returns `{ dataPoints, errors, queriedSources }`
   - `computeCorrelations(...)` (HLP-018) — deterministic 5-component scoring
   - `detectAlerts(dataPoints, correlations)` (HLP-018a)
   - Generate `analysisId: crypto.randomUUID()`
   - Build `TrendAnalysisResult` with all above
   - Store in Firestore: `surveillance_analyses/{analysisId}`
5. **Audit**: `{ action: 'surveillance-analyze', uid, analysisId, findingsCount, alertsCount, timestamp }`
6. **Respond**: `{ ok: true, analysis, warnings? }`

**Output Contract:**
```typescript
// Success (200):
{
  ok: true;
  analysis: {
    analysisId: string;
    region: ResolvedRegion;
    regionLabel: string;
    rankedFindings: ClinicalCorrelation[];  // Sorted by overallScore DESC
    alerts: TrendAlert[];
    summary: string;
    dataSourcesQueried: string[];
    dataSourceErrors: DataSourceError[];
    dataSourceSummaries: DataSourceSummary[];
    analyzedAt: string;                     // ISO timestamp
  };
  warnings?: string[];   // Present if errors occurred
}

// Error (400): "Invalid request" | "Could not resolve location"
// Error (401): { error: 'Unauthorized' }
// Error (403): { error: 'Surveillance trend analysis requires Pro or Enterprise plan', upgradeRequired: true, requiredPlan: 'pro' }
// Error (500): { error: 'Internal error' }
```

---

### `POST /v1/surveillance/report`

| Field | Detail |
|-------|--------|
| **Endpoint ID** | EP-035 |
| **Method + Path** | `POST /v1/surveillance/report` |
| **File Path** | `src/surveillance/routes.ts:246` |
| **Mode** | `surveillance` |
| **Rate Limit** | Global only (60 req/min) |
| **Authentication** | `required` — ID token in **request body** |
| **Authorization** | User must have `pdf` in `features.exportFormats` (Pro+). Must own the analysis. |

**Input Contract:**
```typescript
// TrendReportRequestSchema (surveillance/schemas.ts:24-27)
interface TrendReportRequest {
  userIdToken: string;   // min 10 chars
  analysisId: string;    // UUID
}
```

**Processing Logic:**
1. Validate, authenticate, authorize (PDF feature check)
2. Get analysis from `surveillance_analyses/{analysisId}`
3. Verify ownership: `analysisData.uid === uid`
4. Generate PDF: `generateTrendReport(analysisData)` (HLP-022) → `Buffer`
5. Log: `{ action: 'surveillance-report', uid, analysisId, timestamp }`
6. Return PDF with `Content-Type: application/pdf`, `Content-Disposition: attachment`

**Output Contract:**
```
// Success (200): Binary PDF buffer
// Headers: Content-Type: application/pdf, Content-Disposition: attachment; filename="surveillance-report-{analysisId}.pdf"

// Error (400): { error: 'Invalid request' }
// Error (401): { error: 'Unauthorized' }
// Error (403): { error: 'Unauthorized' } (uid mismatch) | { error: 'PDF export requires Pro or Enterprise plan' }
// Error (404): { error: 'Analysis not found' }
// Error (500): { error: 'Internal error' }
```

---

## Step 3: Internal Helpers, Utilities, and Service Modules

---

### `buildPrompt` (Legacy)

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-001 |
| **Name** | `buildPrompt` |
| **File Path** | `src/promptBuilder.ts` |
| **Called By** | EP-007 |
| **Purpose** | Builds legacy one-shot MDM generation prompt from narrative |

**Input/Output:**
```typescript
async function buildPrompt(narrative: string): Promise<{ system: string; user: string }>
```

**Logic:** Loads `mdm-gen-guide-v2.md` from disk. Assembles system prompt with EM MDM instructions + guide content between `--- GUIDE START ---` / `--- GUIDE END ---` delimiters. User prompt includes narrative + output format instructions (JSON + `---TEXT---` + rendered text).

---

### `buildSection1Prompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-002 |
| **Name** | `buildSection1Prompt` |
| **File Path** | `src/promptBuilderBuildMode.ts:37` |
| **Called By** | EP-008 |
| **Purpose** | Builds Build Mode S1 prompt with differential, CDR analysis, workup recommendations |

**Input/Output:**
```typescript
function buildSection1Prompt(
  content: string,
  systemPrompt: string,
  surveillanceContext?: string,
  cdrContext?: string,
  testCatalog?: string,
  photoCatalog?: string
): { system: string; user: string }
```

**Logic:** Appends surveillance context (with rising/absent activity instructions), CDR context (with S1-specific identification instructions), test catalog, and photo catalog to system prompt. User prompt requests structured JSON with `differential[]`, `cdrAnalysis[]`, `workupRecommendations[]`. Urgency classification guide: EMERGENT (STEMI, PE, dissection, sepsis, stroke), URGENT (appendicitis, cholecystitis, DVT), ROUTINE (GERD, musculoskeletal, viral).

---

### `buildFinalizePrompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-003 |
| **Name** | `buildFinalizePrompt` |
| **File Path** | `src/promptBuilderBuildMode.ts:361` |
| **Called By** | EP-010 |
| **Purpose** | Builds finalize prompt assembling all 3 sections into final MDM |

**Input/Output:**
```typescript
function buildFinalizePrompt(
  section1: { content: string; response: Pick<Section1Response, 'differential'> },
  section2: { content: string; response?: Pick<Section2Response, 'mdmPreview'>; workingDiagnosis?: string },
  section3Content: string,
  surveillanceContext?: string,
  cdrContext?: string,
  structuredData?: FinalizeStructuredData,
  s3GuideText?: string,
  photoCatalog?: string
): { system: string; user: string }
```

**Logic:** Reconstructs full clinical context from all 3 sections. System prompt includes S3 guide (if available), accumulated context (S1 narrative + differential, S2 content + working diagnosis + MDM preview), structured data (test results, treatments, disposition, follow-up), surveillance context, CDR context (with calculation documentation instructions). Requests: text (copy-pastable), json (full MDM structure), gaps (3-8 documentation opportunities), optional encounterPhoto.

---

### `buildQuickModePrompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-004 |
| **Name** | `buildQuickModePrompt` |
| **File Path** | `src/promptBuilderQuickMode.ts:42` |
| **Called By** | EP-014 |
| **Purpose** | Builds Quick Mode one-shot MDM prompt with patient identifier extraction |

**Input/Output:**
```typescript
async function buildQuickModePrompt(
  narrative: string,
  surveillanceContext?: string,
  cdrContext?: string,
  photoCatalog?: string
): Promise<{ system: string; user: string }>
```

**Logic:** Loads `mdm-gen-guide-v2.md` (fallback: minimal guidance). Adds Quick Mode instructions: dual task (extract `patientIdentifier` + generate complete MDM), response format spec, surveillance + CDR integration instructions, photo catalog. Output JSON: `{ patientIdentifier, mdm: { text, json }, gaps, encounterPhoto }`.

---

### `buildSuggestDiagnosisPrompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-005 |
| **Name** | `buildSuggestDiagnosisPrompt` |
| **File Path** | `src/promptBuilderBuildMode.ts:589` |
| **Called By** | EP-012 |
| **Purpose** | Builds prompt to rank working diagnosis options from differential + test results |

Returns JSON array of 3-5 ranked diagnosis strings.

---

### `buildCdrAutoPopulatePrompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-006 |
| **Name** | `buildCdrAutoPopulatePrompt` |
| **File Path** | `src/promptBuilderBuildMode.ts:708` |
| **Called By** | EP-011 |
| **Purpose** | Extracts CDR component values from S1 narrative for auto-population |

Returns JSON: `{ [cdrId]: { [componentId]: { value: number } } }`. Only extracts components with `source === 'section1' || source === 'user_input'`.

---

### `buildParsePrompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-007 |
| **Name** | `buildParsePrompt` |
| **File Path** | `src/parsePromptBuilder.ts` |
| **Called By** | EP-006 |
| **Purpose** | Builds narrative → structured fields parsing prompt |

Extracts: chiefComplaint, problemsConsidered, dataReviewed, riskAssessment, clinicalReasoning, treatmentProcedures, disposition, confidence, warnings.

---

### `matchCdrsFromDifferential`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-008 |
| **Name** | `matchCdrsFromDifferential` |
| **File Path** | `src/services/cdrMatcher.ts:20` |
| **Called By** | EP-011 |
| **Purpose** | Maps differential diagnoses to applicable CDRs via substring matching |

**Logic:**
1. Lowercase all diagnoses and cdrContext strings
2. For each CDR: check if any `applicableChiefComplaints` substring-matches any diagnosis (bidirectional: `dx.includes(complaint) OR complaint.includes(dx)`)
3. Fallback: check CDR `name`/`fullName` against cdrContext strings
4. Return deduped matches

---

### `buildCdrTracking` & `buildCdrContextString`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-009 |
| **Name** | `buildCdrTracking`, `computeCdrStatus`, `calculateScore` |
| **File Path** | `src/services/cdrTrackingBuilder.ts` |
| **Called By** | EP-011, EP-010 |
| **Purpose** | Initialize CDR tracking state with auto-populated values and compute scores |

**`computeCdrStatus(components)`:** 0 answered → 'pending', all answered → 'completed', else → 'partial'

**`calculateScore(cdr, components)`:** For 'sum' method: sums all component values, finds matching range. For 'threshold'/'algorithm': returns null (needs custom logic).

**`buildCdrTracking(matchedCdrs, autoPopulated)`:** For each CDR, builds component states (auto-populated or empty), computes status and score.

---

### `formatCdrContext`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-010 |
| **Name** | `formatCdrContext` |
| **File Path** | `src/services/cdrCatalogFormatter.ts` |
| **Called By** | EP-008, EP-014 |
| **Purpose** | Formats CDR search results into compact prompt context (max 12K chars) |

**Logic:** Tier 1: Compact index of all matched CDRs (`id|name|category`). Tier 2: Top 10 detailed definitions with components (labels + point ranges), scoring ranges, required tests. Truncates to 12,000 chars.

---

### `searchCdrCatalog`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-011 |
| **Name** | `searchCdrCatalog` |
| **File Path** | `src/services/cdrCatalogSearch.ts` |
| **Called By** | EP-008, EP-014 |
| **Purpose** | Vector search CDR library using text embeddings |

Embeds query → Firestore `findNearest()` on `cdrLibrary` collection, COSINE distance, returns top 15 results. Non-blocking on error (returns []).

---

### `validatePhoto` & `buildPhotoCatalogPrompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-012 |
| **Name** | `validatePhoto`, `buildPhotoCatalogPrompt`, `initPhotoCatalog`, `getCatalog` |
| **File Path** | `src/photoCatalog.ts` |
| **Called By** | EP-008, EP-010, EP-014 (validate); EP-008, EP-010, EP-014 (catalog prompt); startup (init) |
| **Purpose** | Photo catalog management — Firestore-backed with hardcoded fallback |

**Hardcoded catalog:** 16 categories, ~140 subcategories. Categories include: cardiac, dermatology, ent, gastrointestinal, general, genitourinary, musculoskeletal, neurological, obstetric, ophthalmologic, pediatric, psychiatric, pulmonary, toxicology, trauma, vascular.

**`initPhotoCatalog(db)`:** Reads `photoLibrary` Firestore collection at startup, builds `Record<category, subcategory[]>`. Falls back to hardcoded on error.

**`validatePhoto(photo)`:** Verifies category/subcategory exist in catalog. Falls back to `{ category: 'general', subcategory: 'unspecified' }`.

**`buildPhotoCatalogPrompt()`:** Returns "ENCOUNTER PHOTO CATALOG — select ONE category/subcategory:" followed by all categories and their subcategories.

---

### `buildAnalyticsInsightsPrompt`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-013 |
| **Name** | `buildAnalyticsInsightsPrompt` |
| **File Path** | `src/promptBuilderAnalytics.ts` |
| **Called By** | EP-033 |
| **Purpose** | Builds prompt for LLM-powered documentation gap pattern analysis |

Assembles gap data (sorted by frequency) with summary stats. Requests 2-3 paragraphs of actionable EM-specific advice. No PHI.

---

### `userService`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-014 |
| **Name** | `UserService` (class, singleton) |
| **File Path** | `src/services/userService.ts` |
| **Called By** | EP-004, EP-005, EP-007, EP-008, EP-010, EP-014, EP-032, EP-033, EP-034, EP-035 |
| **Purpose** | User CRUD, plan management, quota enforcement, Stripe subscription checking |

**Methods:**
- `ensureUser(uid, email)`: Get or create user doc (free plan default)
- `getUser(uid)`: Fetch user doc
- `checkAndIncrementQuota(uid)`: **Atomic Firestore transaction** — check + increment in single operation. Resets usage if period rolled over.
- `getUsageStats(uid)`: Returns effective plan (Stripe subscription takes precedence), usage, features
- `getStripeSubscriptionPlan(uid)`: Queries `customers/{uid}/subscriptions` for active/trialing subscription, maps priceId/productId to plan
- `adminSetPlan(uid, plan)`: Admin override — sets plan, resets usage to 0
- `getCurrentPeriodKey()`: Returns `YYYY-MM` (UTC)

**PLAN_FEATURES lookup:**

| Plan | Monthly Quota | Max Tokens | Priority | Export Formats | API Access | Team |
|------|--------------|------------|----------|----------------|------------|------|
| `free` | 10 | 2,000 | No | text | No | 1 |
| `pro` | 250 | 8,000 | Yes | text, pdf, docx | Yes | 3 |
| `enterprise` | 1,000 | 16,000 | Yes | text, pdf, docx, json, hl7 | Yes | Unlimited |
| `admin` | MAX_SAFE_INTEGER | 32,000 | Yes | text, pdf, docx, json, hl7 | Yes | Unlimited |

---

### `safeParseGaps`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-015 |
| **Name** | `safeParseGaps` |
| **File Path** | `src/buildModeSchemas.ts:268` |
| **Called By** | EP-010, EP-014 |
| **Purpose** | Safely parse gap array from LLM output — never fails |

Reduces array, filtering out items that fail `GapItemSchema.safeParse()`. Returns `[]` if input is not an array.

---

### `getRelevantTests` & `buildCompactCatalog`

| Field | Detail |
|-------|--------|
| **Helper ID** | HLP-016 |
| **Name** | `getRelevantTests`, `buildCompactCatalog` |
| **File Path** | `src/services/testCatalogSearch.ts`, `src/services/testCatalogFormatter.ts` |
| **Called By** | EP-008 |
| **Purpose** | Vector search test library + format into compact prompt context |

**`getRelevantTests(narrative, 50)`:** Embeds narrative, vector search on `testLibrary`, COSINE distance, top 50 results.

**`buildCompactCatalog(tests)`:** Groups by category, formats as `LABS: cbc|CBC, bmp|BMP`. Ordered: labs → imaging → procedures_poc.

---

### Surveillance Helpers

#### AdapterRegistry

| **Helper ID** | HLP-017 | **File** | `src/surveillance/adapters/adapterRegistry.ts` |
| **Called By** | EP-008, EP-014, EP-034 |

Orchestrates 3 CDC adapters via `Promise.allSettled()`. Returns `{ dataPoints, errors, queriedSources }`.

#### Correlation Engine

| **Helper ID** | HLP-018 | **File** | `src/surveillance/correlationEngine.ts` |
| **Called By** | EP-008, EP-014, EP-034 |

**5-component scoring (0-100):**

| Component | Range | Algorithm |
|-----------|-------|-----------|
| Symptom Match | 0-40 | Keyword match against `PATHOGEN_SYMPTOM_MAP` (13 pathogens). Score = (matches / total) * 40 |
| Differential Match | 0-20 | Exact match = 20; family match (via variant groupings) = 15; no match = 0 |
| Epidemiologic Signal | 0-25 | Counts rising data points. Rising average magnitude: >50% = 25, >25% = 20, >10% = 15, else 10. Stable only = 5 |
| Seasonal Plausibility | 0-10 | Peak month match = 10; adjacent = 7; other = 2; unknown pathogen = 5 |
| Geographic Relevance | 0-5 | County = 5, state = 4, HHS region = 3, national = 1 |

**Tier:** ≥60 = high, ≥40 = moderate, ≥20 = low, <20 = background

**Alert detection:**
- `trendMagnitude > 50%` → warning
- Bioterrorism sentinel syndrome → critical
- 3+ high-tier correlations → info

#### Syndrome Mapper

| **Helper ID** | HLP-019 | **File** | `src/surveillance/syndromeMapper.ts` |
| **Called By** | EP-008, EP-014, EP-034 |

10 syndrome categories with keyword lists (~15-20 keywords each). Chief complaint keywords weighted 2x vs differential (1x per item). Returns sorted `SyndromeCategory[]`.

#### Region Resolver

| **Helper ID** | HLP-020 | **File** | `src/surveillance/regionResolver.ts` |
| **Called By** | EP-008, EP-014, EP-034 |

Resolution chain: ZIP → Firestore `zip_to_fips` (county-level) → ZIP prefix table (state-level) → state abbreviation table. Contains 3 lookup tables: `STATE_TO_HHS_REGION` (50 states + DC + territories → HHS 1-10), `STATE_NAMES` (abbreviation → full name), `ZIP_PREFIX_TO_STATE` (000-999 → state).

#### Surveillance Cache

| **Helper ID** | HLP-021 | **File** | `src/surveillance/cache/surveillanceCache.ts` |
| **Called By** | All CDC adapters |

Firestore collection `surveillance_cache`. Per-source TTL. `get(key)`: checks `expiresAt`, returns null if expired. `set(key, data, ttlMs)`: stores with timestamps.

#### PDF Generator

| **Helper ID** | HLP-022 | **File** | `src/surveillance/pdfGenerator.ts` |
| **Called By** | EP-035 |

Multi-page PDF via PDFKit: Page 1 (executive summary + findings table), Page 2 (detailed findings with 5-component breakdown), Page 3 (alerts, conditional). Footer on all pages. Color-coded by tier (high=red, moderate=orange, low=cyan, background=gray).

#### Prompt Augmenter

| **Helper ID** | HLP-023 | **File** | `src/surveillance/promptAugmenter.ts` |
| **Called By** | EP-008, EP-010, EP-014 |

`buildSurveillanceContext()`: Filters to high/moderate findings + critical/warning alerts. Includes low/background findings for differential items. Hard cap: 2000 chars (progressive truncation). `appendSurveillanceToMdmText()`: Injects surveillance attestation line into MDM text (before Risk section or at end).

---

### Embedding Service

| **Helper ID** | HLP-024 | **File** | `src/services/embeddingService.ts` |
| **Called By** | HLP-011, HLP-016 |

Uses Vertex AI `text-embedding-005` model (768 dimensions). Supports `RETRIEVAL_QUERY` and `RETRIEVAL_DOCUMENT` task types. Batch limit: 100 texts per request.

---

### Reprocess Prompt Builders

| **Helper ID** | HLP-025 | **File** | `src/promptBuilderReprocess.ts` |
| **Called By** | Not currently wired to any route handler in `index.ts` |

`buildBuildModeReprocessPrompt()` and `buildQuickModeReprocessPrompt()`: Take original MDM + gap responses (YES/NO toggles) and generate enhanced MDM that weaves confirmed gaps into appropriate sections. Uses base `REPROCESS_SYSTEM` with specific gap incorporation guide per gap type.

---

### Parse Results Prompt Builder

| **Helper ID** | HLP-026 | **File** | `src/promptBuilderBuildMode.ts:640` |
| **Called By** | EP-013 |

`buildParseResultsPrompt(pastedText, orderedTests)`: Parses pasted lab/EHR text into structured `{ parsed: [], unmatchedText: [] }`.

---

### Type Definitions

| **Helper ID** | HLP-027 | **File** | `src/types/libraries.ts` |

Defines `TestDefinition` (id, name, category, subcategory, commonIndications, unit, normalRange, quickFindings, feedsCdrs) and `CdrDefinition` (id, name, fullName, applicableChiefComplaints, components, scoring, suggestedTreatments, category, application, keywords, requiredTests, embedding).

| **Helper ID** | HLP-028 | **File** | `src/types/userProfile.ts` |

Defines Zod schemas + interfaces for OrderSet, DispositionFlow, ReportTemplate, CustomizableOptions.

---

## Step 4: External API Integrations

---

### `CDC Respiratory Hospital Data`

| Field | Detail |
|-------|--------|
| **API ID** | API-001a |
| **Service Name** | CDC Respiratory Hospital Occupancy Data |
| **Base URL** | `https://data.cdc.gov/resource` |
| **Dataset** | `mpgq-jmmr` |
| **Authentication** | None (public API via SODA) |
| **Called By** | HLP-017 → `CdcRespiratoryAdapter` |

**Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mpgq-jmmr.json` | GET | Weekly hospital respiratory data by jurisdiction |

**Request Format:**
```
GET https://data.cdc.gov/resource/mpgq-jmmr.json
Query: $limit=10, $order=weekendingdate DESC, jurisdiction={stateAbbrev} (optional)
Headers: None required
Timeout: 15 seconds
```

**Response Fields Used:** `weekendingdate`, `jurisdiction`, `pctconfc19inptbeds`, `pctconffluinptbeds`, `pctconfrsvinptbeds`, `totalconfc19newadmpctchg`, `totalconfflunewadmpctchg`

**Tracked Conditions:** Influenza (bed % + weekly change), COVID-19 (bed % + weekly change), RSV (bed % only, trend computed via 2-point fallback)

**Caching:** Firestore `surveillance_cache`, 7-day TTL, key: `cdc_respiratory_{stateAbbrev}_respiratory`

---

### `CDC NWSS Wastewater`

| Field | Detail |
|-------|--------|
| **API ID** | API-001b |
| **Service Name** | CDC National Wastewater Surveillance System |
| **Base URL** | `https://data.cdc.gov/resource` |
| **Dataset** | `g653-rqe2` |
| **Authentication** | None (public API via SODA) |
| **Called By** | HLP-017 → `CdcWastewaterAdapter` |

**Request:**
```
GET https://data.cdc.gov/resource/g653-rqe2.json
Query: $limit=200, $order=date DESC, $where=key_plot_id LIKE '%_{stateLC}_%'
Timeout: 15 seconds
```

**Condition:** SARS-CoV-2 only. Aggregates multiple sites per state to median PCR concentration per date.

**Caching:** 3-day TTL, key: `cdc_wastewater_{stateAbbrev}_wastewater`

---

### `CDC NNDSS`

| Field | Detail |
|-------|--------|
| **API ID** | API-001c |
| **Service Name** | CDC National Notifiable Diseases Surveillance System (Table II) |
| **Base URL** | `https://data.cdc.gov/resource` |
| **Dataset** | `x9gk-5huc` |
| **Authentication** | None (public API via SODA) |
| **Called By** | HLP-017 → `CdcNndssAdapter` |

**Request:**
```
GET https://data.cdc.gov/resource/x9gk-5huc.json
Query: $limit=100, $order=year DESC, week DESC
Timeout: 15 seconds
```

**Tracked Conditions (13):** West Nile Virus, Lyme Disease, Dengue, Malaria, Measles, Meningococcal Disease, Pertussis, Anthrax, Botulism, Tularemia, Plague. Each mapped to syndromes.

**Caching:** 7-day TTL, key: `cdc_nndss_{stateAbbrev}_nndss`

---

### Adapter Orchestration Pattern

- All 3 adapters called via `Promise.allSettled()` (parallel execution)
- Only relevant adapters are called (filtered by syndrome overlap)
- Graceful degradation: failed adapters contribute to `errors[]`, successful ones contribute to `dataPoints[]`
- Partial results are merged into single `AdapterFetchResult`

---

### `Google Vertex AI (Gemini)`

| Field | Detail |
|-------|--------|
| **API ID** | API-002 |
| **Service Name** | Google Vertex AI Gemini 2.5 Pro |
| **Base URL** | Regional Vertex AI endpoint (`us-central1-aiplatform.googleapis.com`) |
| **Authentication** | GCP service account (Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS`) |
| **Called By** | EP-006, EP-007, EP-008, EP-010, EP-011, EP-012, EP-013, EP-014, EP-033 |

**Configuration (vertex.ts):**

| Setting | Value |
|---------|-------|
| Model | `gemini-2.5-pro` |
| Temperature | `0.2` |
| topP | `0.95` |
| maxOutputTokens | `16384` |
| Default timeout | 55 seconds (overridable to 90s) |
| JSON Mode | Optional (`responseMimeType: 'application/json'`) |

**Safety Settings:**

| Category | Threshold |
|----------|-----------|
| `HARM_CATEGORY_HATE_SPEECH` | `BLOCK_MEDIUM_AND_ABOVE` |
| `HARM_CATEGORY_DANGEROUS_CONTENT` | `BLOCK_MEDIUM_AND_ABOVE` |
| `HARM_CATEGORY_SEXUALLY_EXPLICIT` | `BLOCK_MEDIUM_AND_ABOVE` |
| `HARM_CATEGORY_HARASSMENT` | `BLOCK_MEDIUM_AND_ABOVE` |

**Multi-Part Response Handling:** Gemini 2.5 Pro extended thinking returns multiple parts. Filters out `thought` parts, extracts last answer part. Logs part counts when multiple detected.

**Rate Limits / Error Handling:** Timeout via `Promise.race()`. No retry logic — errors propagate to caller. No fallback model.

---

### `Google Vertex AI Embeddings`

| Field | Detail |
|-------|--------|
| **API ID** | API-003 |
| **Service Name** | Google Vertex AI text-embedding-005 |
| **Base URL** | `https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/text-embedding-005:predict` |
| **Authentication** | GCP service account (GoogleAuth library) |
| **Called By** | HLP-011, HLP-016 |

**Configuration:** 768 dimensions, batch limit 100 texts. Task types: `RETRIEVAL_QUERY` (for search), `RETRIEVAL_DOCUMENT` (for indexing).

---

## Step 5: Firestore Data Model

---

### Collection: `users/{uid}`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-001 |
| **Path Pattern** | `users/{uid}` |
| **Purpose** | User profiles, subscription plans, usage tracking, gap analytics |
| **Access Pattern** | EP-005, EP-007, EP-008, EP-010, EP-014, EP-032, EP-033 read/write |
| **Managed By** | `application` (this codebase creates and updates) |

**Document Schema:**
```typescript
interface UserDocument {
  uid: string;                           // Firebase Auth UID
  email: string;                         // User email
  plan: 'free' | 'pro' | 'enterprise' | 'admin';  // Subscription plan
  features: {                            // Plan-derived feature set
    maxRequestsPerMonth: number;
    maxTokensPerRequest: number;
    priorityProcessing: boolean;
    exportFormats: string[];
    apiAccess: boolean;
    teamMembers: number;
  };
  createdAt: Timestamp;                  // Account creation
  updatedAt: Timestamp;                  // Last modification
  usedThisPeriod: number;               // Monthly usage counter (resets on period rollover)
  periodKey: string;                     // Current period key: 'YYYY-MM'
  totalRequests: number;                 // Lifetime request count
  onboardingCompleted?: boolean;         // True after completing onboarding flow
  displayName?: string;                  // From onboarding
  credentialType?: 'MD' | 'DO' | 'NP' | 'PA';  // From onboarding
  surveillanceLocation?: { state?: string; zipCode?: string };  // From onboarding
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  gapTallies?: {                         // Documentation gap tracking
    identified: Record<string, number>;  // gapId → count
    confirmed: Record<string, number>;
    identifiedByPeriod?: Record<string, Record<string, number>>;  // periodKey → gapId → count
    confirmedByPeriod?: Record<string, Record<string, number>>;
  };
  gapMeta?: Record<string, { category: string; method: string }>;  // gapId → metadata
  lastInsightsGeneratedAt?: Timestamp;   // Rate limiting for analytics
}
```

**Indexes:**

| Fields | Order | Purpose |
|--------|-------|---------|
| `plan` ASC, `createdAt` DESC | Composite | Admin queries by plan |
| `periodKey` ASC, `usedThisPeriod` DESC | Composite | Usage reporting |

---

### Collection: `customers/{uid}`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-002 |
| **Path Pattern** | `customers/{uid}` |
| **Purpose** | Stripe-managed customer data + user customizations + gap tallies |
| **Managed By** | `firebase-extension` (Stripe Extension) + `application` (customizations, gap tallies) |

**Security Rules:** Read by owner only. Write by Stripe Extension only (client writes blocked).

**Application-Written Fields:**
- `customizableOptions`: `{ dispositionOptions?: string[], followUpOptions?: string[] }`
- `gapTallies`, `gapMeta`: Same as `users/{uid}` (some endpoints write to `customers/{uid}` for gap tracking)
- `lastInsightsGeneratedAt`: Analytics rate limiting

**Subcollections:**

| Subcollection | Path | Managed By | Purpose | Security Rules |
|---------------|------|------------|---------|----------------|
| `checkout_sessions` | `customers/{uid}/checkout_sessions/{session}` | Stripe Extension + client create | Payment sessions | Owner can read + create (with mode, success_url, cancel_url) |
| `subscriptions` | `customers/{uid}/subscriptions/{sub}` | Stripe Extension | Active subscriptions | Owner read only |
| `portal_sessions` | `customers/{uid}/portal_sessions/{session}` | Stripe Extension + client create | Billing portal | Owner can read + create (with return_url) |
| `usage` | `customers/{uid}/usage/{doc}` | Application (backend) | Usage tracking | Owner read only |
| `payment_methods` | `customers/{uid}/payment_methods/{method}` | Stripe Extension | Payment methods | Owner read only |
| `invoices` | `customers/{uid}/invoices/{invoice}` | Stripe Extension | Invoices | Owner read only |
| `encounters` | `customers/{uid}/encounters/{encounterId}` | Application (client create, backend update) | Build Mode encounters | See below |
| `orderSets` | `customers/{uid}/orderSets/{id}` | Application | User order set templates | (implicit: auth required) |
| `dispoFlows` | `customers/{uid}/dispoFlows/{id}` | Application | User disposition flow templates | (implicit) |
| `reportTemplates` | `customers/{uid}/reportTemplates/{id}` | Application | User report templates | (implicit) |

---

### Collection: `customers/{uid}/encounters/{encounterId}`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-003 |
| **Path Pattern** | `customers/{uid}/encounters/{encounterId}` |
| **Purpose** | Build Mode and Quick Mode encounter documents |
| **Managed By** | Application (client creates, backend updates sections, client cannot write after finalized) |

**Document Schema:**
```typescript
interface EncounterDocument {
  userId: string;
  roomNumber: string;
  chiefComplaint: string;
  mode?: 'build' | 'quick';                    // Encounter mode
  status: 'draft' | 'section1_done' | 'section2_done' | 'finalized' | 'section3_error' | 'error' | 'archived';
  quotaCounted: boolean;                         // True after quota increment
  quotaCountedAt?: Timestamp;
  section1: SectionData;                         // S1 state (content, llmResponse, submissionCount, status)
  section2: SectionData;                         // S2 state (with selectedTests, testResults, workingDiagnosis)
  section3: SectionData;                         // S3 state (with treatments, disposition, followUp)
  cdrTracking: CdrTracking;                      // CDR component states + scores
  surveillanceContext?: string;                   // Stored during S1 for reuse at finalize
  cdrContext?: string;                           // CDR context from vector search
  encounterPhoto?: { category: string; subcategory: string };
  quickModeData?: {                              // Quick Mode only
    status: 'processing' | 'completed' | 'error';
    narrative: string;
    patientIdentifier?: { age?: string; sex?: string; chiefComplaint?: string };
    mdmOutput?: { text: string; json: object };
    gaps?: GapItem[];
    processedAt?: string;
    errorMessage?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  shiftStartedAt: Timestamp;
}
```

**Security Rules:**
- Owner can read
- Owner can create with required fields + status must be 'draft'
- Owner can update unless status is 'finalized'
- Owner can delete (any status)

**Document State Machine (Build Mode):**

| State | Transitions To | Trigger | Constraints |
|-------|---------------|---------|-------------|
| `draft` | `section1_done` | EP-008 (S1 processed) | Max 2 S1 submissions |
| `section1_done` | `section2_done` | EP-009 (S2 saved) | S1 must be completed, max 2 S2 submissions |
| `section2_done` | `finalized` | EP-010 (finalize) | S2 must be completed, max 2 S3 submissions |
| `section2_done` | `section3_error` | EP-010 (LLM failure) | `generationFailed = true` |
| Any | `archived` | Client action | — |

**Document State Machine (Quick Mode):**

| State | Transitions To | Trigger | Constraints |
|-------|---------------|---------|-------------|
| `draft` | `finalized` | EP-014 (generate) | One-shot, no re-processing |
| `draft` | `error` | EP-014 (LLM failure) | `generationFailed = true` |

**Data Shape Variants:**
```typescript
// S1 llmResponse — Old shape (pre-CDR):
section1.llmResponse: DifferentialItem[]

// S1 llmResponse — New shape (current):
section1.llmResponse: {
  differential: DifferentialItem[];
  cdrAnalysis?: CdrAnalysisItem[];
  workupRecommendations?: WorkupRecommendation[];
  processedAt: string;
}
// Accessor: getDifferential(llmResponse) handles both shapes

// workingDiagnosis — union type:
workingDiagnosis: string | { selected: string | null; custom?: string | null; suggestedOptions?: string[] }
```

**Indexes:**

| Fields | Order | Purpose |
|--------|-------|---------|
| `userId` ASC, `status` ASC, `createdAt` DESC | Composite | User encounter queries filtered by status |
| `userId` ASC, `shiftStartedAt` DESC | Composite | User encounters sorted by shift |
| `status` ASC, `updatedAt` DESC | Composite | Admin status queries |

---

### Collection: `products/{productId}`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-004 |
| **Path Pattern** | `products/{productId}` |
| **Purpose** | Stripe product definitions (synced from Stripe Dashboard) |
| **Managed By** | `firebase-extension` (Stripe Extension) |
| **Security Rules** | Public read. No client write. |

Subcollection: `products/{productId}/prices/{priceId}` — same rules.

---

### Collection: `surveillance_analyses/{analysisId}`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-005 |
| **Path Pattern** | `surveillance_analyses/{analysisId}` |
| **Purpose** | Stored surveillance analysis results for PDF report generation |
| **Managed By** | `application` (EP-034 writes, EP-035 reads) |

**Document Schema:**
```typescript
interface SurveillanceAnalysisDocument extends TrendAnalysisResult {
  uid: string;              // Owner
  createdAt: Timestamp;     // Server timestamp
}
```

---

### Collection: `surveillance_cache`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-006 |
| **Path Pattern** | `surveillance_cache/{key}` |
| **Purpose** | CDC data source cache with per-source TTL |
| **Managed By** | `application` (HLP-021) |

**Document Schema:**
```typescript
{
  key: string;                          // Sanitized cache key
  dataPoints: SurveillanceDataPoint[];  // Cached data
  cachedAt: Timestamp;
  expiresAt: Timestamp;                 // cachedAt + TTL
}
```

---

### Collection: `testLibrary`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-007 |
| **Path Pattern** | `testLibrary/{testId}` |
| **Purpose** | Test definitions for workup recommendations |
| **Managed By** | `external` (seeded via scripts) |
| **Access Pattern** | EP-002, EP-008 (cached reads) |

Contains `TestDefinition` documents with `embedding` field (768-dim vector) for similarity search.

---

### Collection: `cdrLibrary`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-008 |
| **Path Pattern** | `cdrLibrary/{cdrId}` |
| **Purpose** | Clinical Decision Rule definitions with scoring components |
| **Managed By** | `external` (seeded via `scripts/seed-cdr-library.ts`) |
| **Access Pattern** | EP-003, EP-011 (cached reads), HLP-011 (vector search) |

Contains `CdrDefinition` documents with `embedding` field for similarity search. 161 active CDRs + 38 quarantined.

---

### Collection: `photoLibrary`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-009 |
| **Path Pattern** | `photoLibrary/{photoId}` |
| **Purpose** | Encounter photo metadata with Storage download URLs |
| **Managed By** | `external` (seeded via `scripts/seed-photo-library.ts`) |
| **Security Rules** | Authenticated read. No client write. |

---

### Collection: `zip_to_fips`

| Field | Detail |
|-------|--------|
| **Collection ID** | FS-010 |
| **Path Pattern** | `zip_to_fips/{zipCode}` |
| **Purpose** | ZIP code → county/FIPS code lookup for county-level surveillance resolution |
| **Managed By** | `external` (seeded) |
| **Access Pattern** | HLP-020 (`RegionResolver.resolveFromZip()`) |

---

### Collections: `mdm_metadata`, `user_settings`

| **Collection ID** | FS-011, FS-012 |

**`mdm_metadata`:** Authenticated read (owner only), authenticated create (owner, requires `userId` + `timestamp`). No update/delete. Security rules defined but not actively written by current backend code.

**`user_settings`:** Owner read/write with required `theme` (light/dark/system) and `notifications` (map) fields. Not actively written by current backend code.

---

## Step 6: LLM / AI Integration Layer

---

### LLM Client Configuration (Shared)

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-000 (shared client) |
| **Provider / Model** | Google Gemini 2.5 Pro via Vertex AI |
| **File Path** | `src/vertex.ts` |

| Setting | Value |
|---------|-------|
| Model | `gemini-2.5-pro` |
| Temperature | `0.2` |
| topP | `0.95` |
| maxOutputTokens | `16,384` |
| Default timeout | 55 seconds |
| JSON Mode | Per-call: `responseMimeType: 'application/json'` |
| Multi-part handling | Filters `thought` parts, extracts last answer part |
| Safety | All 4 harm categories at `BLOCK_MEDIUM_AND_ABOVE` |
| Retry | None |
| Fallback model | None |

---

### `Parse Narrative`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-001 |
| **Called By** | EP-006 |
| **Purpose** | Extract structured clinical fields from free-form physician narrative |
| **Mode** | `shared` |

**Prompt:** HLP-007. System prompt defines expert EM parser role with extraction guidelines for 7 categories. User prompt injects narrative.

**Output Parsing:** JSON parse → fallback brace extraction → `getEmptyParsedNarrative()` stub. Sets confidence default 0.5.

---

### `Legacy Generate`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-002 |
| **Called By** | EP-007 |
| **Purpose** | One-shot MDM generation (legacy) |
| **Mode** | `legacy` |

**Prompt:** HLP-001. System prompt includes `mdm-gen-guide-v2.md` guide. Expects hybrid JSON + `---TEXT---` + rendered text output.

**Output Parsing:** Split by `---TEXT---`, parse JSON with `MdmSchema`, render text via `renderMdmText()`. Fallback: conservative stub.

---

### `Build Mode Section 1`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-003 |
| **Called By** | EP-008 |
| **Purpose** | Generate worst-first differential, CDR analysis, workup recommendations |
| **Mode** | `build-mode` |
| **JSON Mode** | No (legacy text extraction) |
| **Timeout** | 90 seconds |

**Prompt:** HLP-002. Includes S1 guide, surveillance context, CDR context, test catalog, photo catalog.

**Output Parsing:** `cleanLlmJsonResponse()` → JSON.parse → handle legacy (array) vs new (object) format → `coerceAndValidateDifferential()` (maps urgency variations) → validate cdrAnalysis + workupRecommendations → `validatePhoto()`.

---

### `Build Mode Finalize`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-004 |
| **Called By** | EP-010 |
| **Purpose** | Generate final MDM from all 3 sections |
| **Mode** | `build-mode` |
| **JSON Mode** | Yes |
| **Timeout** | 90 seconds |

**Prompt:** HLP-003. Includes S3 guide, accumulated S1+S2+S3 context, structured data, surveillance, CDR context, photo catalog.

**Output Parsing:** Parse JSON → handle `{ finalMdm: {...} }` wrapper → normalize fields (`flattenToStrings`, `stringifyDisposition`, `normalizeComplexity`) → `safeParseGaps()` → `validatePhoto()` → validate with `FinalMdmSchema`. On failure: fallback MDM with `generationFailed = true`. Deterministic surveillance enrichment post-LLM.

---

### `Quick Mode Generate`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-005 |
| **Called By** | EP-014 |
| **Purpose** | One-shot MDM + patient identifier extraction |
| **Mode** | `quick-mode` |
| **JSON Mode** | Yes |
| **Timeout** | 90 seconds |

**Prompt:** HLP-004. Includes v2 guide, surveillance context, CDR context, photo catalog.

**Output Parsing:** `parseQuickModeResponse()` — strip fences → JSON.parse → fallback brace extraction. Extracts `patientIdentifier`, `mdm`, `gaps`, `encounterPhoto`. On failure: `getQuickModeFallback()`.

---

### `CDR Auto-Populate`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-006 |
| **Called By** | EP-011 |
| **Purpose** | Extract CDR component values from S1 narrative |
| **Mode** | `build-mode` |

**Prompt:** HLP-006. Returns `{ cdrId: { componentId: { value } } }`.

---

### `Suggest Diagnosis`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-007 |
| **Called By** | EP-012 |
| **Purpose** | Rank working diagnosis suggestions |
| **Mode** | `build-mode` |

**Prompt:** HLP-005. Returns JSON array of 3-5 diagnosis strings.

---

### `Parse Results`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-008 |
| **Called By** | EP-013 |
| **Purpose** | Parse pasted lab/EHR text into structured test results |
| **Mode** | `build-mode` |

**Prompt:** HLP-026. Returns `{ parsed: [], unmatchedText: [] }`.

---

### `Analytics Insights`

| Field | Detail |
|-------|--------|
| **LLM ID** | LLM-009 |
| **Called By** | EP-033 |
| **Purpose** | Generate actionable gap pattern analysis |
| **Mode** | `utility` |

**Prompt:** HLP-013. Returns plain text (2-3 paragraphs).

---

## Step 7: Scheduled Jobs & Background Processes

**None found in codebase.** There are no scheduled jobs, cron triggers, Cloud Functions, or Firebase Extension triggers defined in the backend application code. The Stripe Firebase Extension manages webhook-triggered updates to `customers/{uid}/subscriptions` but this is external to this codebase.

**Note:** Some request-scoped processing runs asynchronously within request handlers (e.g., surveillance enrichment is non-blocking within S1/Quick Mode handlers), but these complete within the request lifecycle and are not fire-and-forget.

---

## Step 8: Authentication & Authorization Model

### Auth Provider

Firebase Authentication with **Google Sign-In** (popup method only — `signInWithPopup`). No other sign-in providers configured.

### Token Verification

`admin.auth().verifyIdToken(token)` — standard Firebase Admin SDK verification.

### Custom Claims

| Claim | Type | Purpose | Set By |
|-------|------|---------|--------|
| `admin` | `boolean` | Grants admin access to EP-004 | Manually set via Firebase Admin SDK |

### Auth Token Passing Patterns

| Pattern | Endpoints | Token Location |
|---------|-----------|----------------|
| **Request body field** | EP-005 (whoami), EP-006 (parse-narrative), EP-007 (generate), EP-008 (S1), EP-009 (S2), EP-010 (finalize), EP-011 (match-cdrs), EP-012 (suggest-diagnosis), EP-013 (parse-results), EP-014 (quick-mode), EP-034 (surveillance/analyze), EP-035 (surveillance/report) | `{ userIdToken: "{token}", ... }` |
| **Bearer header** | EP-002 (libraries/tests), EP-003 (libraries/cdrs), EP-004 (admin/set-plan), EP-015–EP-032 (all user profile CRUD), EP-033 (analytics/insights) | `Authorization: Bearer {token}` |

**Critical distinction:** Build Mode and core generation endpoints use body-field pattern. Library endpoints, user profile CRUD, and analytics use Bearer header via `authenticateRequest()` helper.

### Subscription / Plan Authorization

| Plan | Monthly Quota | Max Tokens | Export Formats | Surveillance | PDF Reports |
|------|--------------|------------|----------------|-------------|------------|
| `free` | 10 | 2,000 | text | No (403) | No (403) |
| `pro` | 250 | 8,000 | text, pdf, docx | Yes | Yes |
| `enterprise` | 1,000 | 16,000 | text, pdf, docx, json, hl7 | Yes | Yes |
| `admin` | MAX_SAFE_INTEGER | 32,000 | All | Yes | Yes |

**Quota tracking:** `usedThisPeriod` field on `users/{uid}`, reset when `periodKey` (YYYY-MM) rolls over. Atomic increment via Firestore transaction. Quota counted per encounter (not per section in Build Mode).

### Per-Endpoint Auth Matrix

| Endpoint ID | Auth Required | Auth Method | Plan Required | Quota Counted | Additional Checks |
|-------------|--------------|-------------|---------------|---------------|-------------------|
| EP-001 | No | — | Any | No | — |
| EP-002 | Yes | Bearer | Any | No | — |
| EP-003 | Yes | Bearer | Any | No | — |
| EP-004 | Yes | Bearer (body) | — | No | `admin` custom claim |
| EP-005 | Yes | Body | Any | No | — |
| EP-006 | Yes | Body | Any | No | — |
| EP-007 | Yes | Body | Any | Yes (per encounter) | — |
| EP-008 | Yes | Body | Any | Yes (first S1 only) | Must own encounter, max 2 submissions |
| EP-009 | Yes | Body | Any | No | Must own, S1 done, max 2 |
| EP-010 | Yes | Body | Any | No | Must own, S2 done, max 2 |
| EP-011 | Yes | Body | Any | No | Must own, S1 done |
| EP-012 | Yes | Body | Any | No | Must own, S1 done |
| EP-013 | Yes | Body | Any | No | Must own |
| EP-014 | Yes | Body | Any | Yes (first only) | Must own, mode=quick, not processed |
| EP-015–031 | Yes | Bearer | Any | No | — |
| EP-032 | Yes | Bearer | Any | No | Not already completed (409) |
| EP-033 | Yes | Bearer | pro/enterprise/admin | No | 1/hour rate limit |
| EP-034 | Yes | Body | pro/enterprise | No | — |
| EP-035 | Yes | Body | pro/enterprise (PDF) | No | Must own analysis |

---

## Step 9: Configuration, Feature Flags & Operational Concerns

### Environment Variables

| Variable | Required | Purpose | Default |
|----------|----------|---------|---------|
| `PORT` | No | Server listen port | `8080` |
| `PROJECT_ID` | Yes | GCP project ID | — |
| `VERTEX_LOCATION` | No | Vertex AI region | `us-central1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Conditional | Service account key file path (local dev) | — |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Conditional | Service account key as JSON string (Cloud Run) | — |
| `FRONTEND_URL` | No | Additional CORS allowed origin | — |

### Feature Flags

**None found in codebase.** No formal feature flag system. Behavior gating is controlled by:
- **Subscription plan tiers** (free vs pro vs enterprise) — determines quota, features, export formats
- **Plan-based feature checks** (e.g., `exportFormats.includes('pdf')` for PDF reports, plan check for surveillance)
- **Hardcoded constants** (max submissions per section = 2, character limits = 2000/8000/16000)

### Startup Initialization

| Step | Happens When | Failure Behavior |
|------|-------------|-----------------|
| Firebase Admin SDK init | `main()` at startup | Tries JSON env var → file path → default credentials. Fatal if all fail |
| Photo catalog warm from Firestore | `initPhotoCatalog(db)` after Firebase init | Logs warning, uses hardcoded `PHOTO_CATALOG` (16 categories) |
| Express listener start | After all init | Binds to PORT |

### Deployment Configuration

| Setting | Value |
|---------|-------|
| Cloud Run region | `us-central1` |
| Container base image | `node:20-slim` |
| Build steps | `pnpm install` → copy src + prompts → `tsc` → production |
| Runtime command | `node dist/index.js` |
| Default port | `8080` |
| `NODE_ENV` | `production` (set in Dockerfile) |

**Cloud Build context:** `.gcloudignore` excludes `frontend/`, `docs/`, `scripts/`, `.claude/`, `_bmad*/`, `node_modules/`, `.env*`, Firebase config files. Only `backend/` directory is uploaded (~5-10 MB).

### Monitoring & Logging

**Logging format:** `console.log({ key: value })` — structured JSON objects to stdout (captured by Cloud Run).

**Logged metadata per request:**
- `userId` (uid)
- `action` (endpoint name)
- `timestamp` (ISO string)
- Counts: `submissionCount`, `cdrAnalysisCount`, `workupRecsCount`, `matchedCount`, `gapCount`, `findingsCount`, `alertsCount`

**NEVER logged:** Narrative text, MDM content, patient data, clinical details, medical content of any kind.

**No custom Cloud Monitoring metrics or alerts.** No performance tracing. Error logging via `console.error(error)` for unhandled exceptions (full error objects, not stack traces to clients).

---

*End of Backend Technical Requirement Document*
