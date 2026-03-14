# Backend Technical Reference Document

> **Status**: Current as of commit `925f7ba` (2026-03-14)
> **Architecture**: Post-refactoring (13-phase, 100 files, 5,630 insertions, 3,607 deletions)
> **Runtime**: Express 4.x on Cloud Run (us-central1), Node.js 20 ESM
> **LLM**: Vertex AI Gemini 2.5 Pro via `@google-cloud/vertexai`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Infrastructure Patterns](#2-infrastructure-patterns)
3. [Domain Module Design](#3-domain-module-design)
4. [Data Access Layer](#4-data-access-layer)
5. [LLM Integration Layer](#5-llm-integration-layer)
6. [Auth & Security Architecture](#6-auth--security-architecture)
7. [Testing Architecture](#7-testing-architecture)
8. [Error Architecture](#8-error-architecture)
9. [Hybrid Architecture Considerations](#9-hybrid-architecture-considerations)
10. [Frontend Alignment](#10-frontend-alignment)
11. [Frontend Alignment To-Do List](#11-frontend-alignment-to-do-list)

---

## 1. Architecture Overview

### 1.1 File Tree

```
backend/src/
├── index.ts                              # Composition root: Firebase init → DI wiring → server start
├── app.ts                                # Express app factory: createApp(deps) → middleware → routes
├── config.ts                             # Zod-validated config (single source for all env vars)
├── logger.ts                             # Pino singleton (PHI redaction, Cloud Trace, severity formatting)
├── errors.ts                             # Typed error hierarchy: AppError → 8 subclasses
├── dependencies.ts                       # DI interface definitions (per-module + aggregate)
├── constants.ts                          # PHYSICIAN_ATTESTATION text
│
├── middleware/
│   ├── auth.ts                           # Firebase token verify (Bearer + body fallback), requireAdmin, requirePlan
│   ├── errorHandler.ts                   # AppError/ZodError/generic → JSON response
│   ├── requestLogger.ts                  # Request ID + Cloud Trace correlation + child logger
│   ├── rateLimiter.ts                    # Factory: createRateLimiter(opts) + 3 presets
│   └── validate.ts                       # Zod schema → req.body replacement
│
├── modules/
│   ├── admin/                            # 1 endpoint: set-plan (admin-only)
│   │   ├── controller.ts
│   │   ├── routes.ts
│   │   └── schemas.ts                    # AdminPlanBodySchema
│   ├── analytics/                        # 1 endpoint: insights (pro+, LLM)
│   │   ├── controller.ts
│   │   └── routes.ts
│   ├── encounter/                        # 7 endpoints: Build Mode core (LLM, Firestore, enrichment)
│   │   ├── controller.ts                 # Thin HTTP adapter (~200 lines)
│   │   ├── encounterOrchestrator.ts      # All business logic (~760 lines)
│   │   ├── enrichmentPipeline.ts         # Surveillance + CDR + test catalog + photo enrichment
│   │   └── routes.ts
│   ├── library/                          # 2 endpoints: test/CDR catalog reads (cached)
│   │   ├── controller.ts
│   │   └── routes.ts
│   ├── narrative/                        # 1 endpoint: parse-narrative (LLM)
│   │   ├── controller.ts
│   │   ├── routes.ts
│   │   └── schemas.ts                    # ParseNarrativeBodySchema
│   ├── quick-mode/                       # 1 endpoint: one-shot MDM (LLM, Firestore)
│   │   ├── controller.ts
│   │   ├── routes.ts
│   │   └── schemas.ts                    # QuickModeGenerateBodySchema
│   └── user/                             # 18 endpoints: profile, onboarding, CRUD (order sets, dispo flows, report templates, options)
│       ├── controller.ts
│       ├── routes.ts
│       └── schemas.ts                    # CompleteOnboardingSchema
│
├── llm/
│   ├── llmClient.ts                      # ILlmClient interface + LlmPrompt/LlmOptions/LlmResponse types
│   ├── vertexProvider.ts                 # VertexLlmClient: Gemini via Vertex AI SDK
│   ├── retryingLlmClient.ts             # RetryingLlmClient decorator (transparent retry)
│   ├── retryPolicy.ts                    # RetryConfig, isRetryable(), calculateDelay()
│   ├── responseParser.ts                 # LlmResponseParser: 7 parse methods with ParseResult<T>
│   └── normalizers.ts                    # Re-exports from shared/llmResponseUtils (transitional)
│
├── data/
│   ├── cache.ts                          # InMemoryCache<T>: generic TTL + thundering-herd dedup
│   └── repositories/
│       ├── encounterRepository.ts        # IEncounterRepository + FirestoreEncounterRepository
│       ├── libraryRepository.ts          # ILibraryRepository + FirestoreLibraryRepository
│       └── userRepository.ts             # IUserRepository + FirestoreUserRepository
│
├── shared/
│   ├── asyncHandler.ts                   # Wraps async Express handlers → catches → next(err)
│   ├── db.ts                             # Firestore client reference (getDb singleton)
│   ├── llmResponseUtils.ts              # Core normalizers: cleanLlmJsonResponse, coerceAndValidateDifferential, etc.
│   ├── paths.ts                          # ESM-compatible __dirname via import.meta.url
│   ├── quotaHelpers.ts                   # checkTokenSize() — token limit enforcement
│   └── surveillanceEnrichment.ts         # Non-blocking surveillance + CDR enrichment runners
│
├── services/                             # Domain services (data-oriented, pre-existing)
│   ├── cdrMatcher.ts                     # matchCdrsFromDifferential() — CDR matching algorithm
│   ├── cdrCatalogFormatter.ts            # CDR catalog → prompt-injectable text
│   ├── cdrCatalogSearch.ts               # Vector search for relevant CDRs
│   ├── cdrTrackingBuilder.ts             # buildCdrTracking() — CDR state builder
│   ├── testCatalogFormatter.ts           # Test catalog → compact prompt string
│   ├── testCatalogSearch.ts              # Vector search for relevant tests
│   ├── embeddingService.ts               # Vertex AI text embedding generation
│   └── userService.ts                    # UserService: ensureUser, quota, usage stats, gap tallies
│
├── surveillance/                         # CDC data module (pre-existing, DI-refined)
│   ├── adapters/
│   │   ├── adapterRegistry.ts            # AdapterRegistry: fetchAll() orchestrator
│   │   ├── types.ts                      # ISurveillanceAdapter interface
│   │   ├── cdcRespiratoryAdapter.ts      # CDC Respiratory Hospital Data
│   │   ├── cdcWastewaterAdapter.ts       # NWSS Wastewater Surveillance
│   │   └── cdcNndssAdapter.ts            # CDC NNDSS Notifiable Diseases
│   ├── cache/
│   │   └── surveillanceCache.ts          # Firestore-backed cache (per-source TTL)
│   ├── correlationEngine.ts              # Ranked clinical correlation scoring
│   ├── pdfGenerator.ts                   # PDFKit trend report generation
│   ├── promptAugmenter.ts               # Surveillance context → prompt injection
│   ├── regionResolver.ts                 # ZIP/state → HHS region resolution
│   ├── syndromeMapper.ts                 # Chief complaint → syndrome mapping
│   ├── routes.ts                         # 2 endpoints: analyze + report
│   ├── schemas.ts                        # TrendAnalysisBodySchema, TrendReportBodySchema
│   └── types.ts                          # TrendAnalysisResult, ClinicalCorrelation, etc.
│
├── types/
│   ├── express.d.ts                      # Express augmentation: req.user, req.requestId, req.log
│   ├── libraries.ts                      # CdrDefinition, TestDefinition, CdrComponent
│   └── userProfile.ts                    # UserProfile + CRUD schemas (OrderSet, DispoFlow, ReportTemplate, Options)
│
├── __tests__/                            # See §7 Testing Architecture
│
├── buildModeSchemas.ts                   # Build Mode Zod schemas (frozen: request + response + Firestore)
├── outputSchema.ts                       # Legacy MDM structure validation + renderMdmText()
├── photoCatalog.ts                       # initPhotoCatalog(db) + buildPhotoCatalogPrompt() + validatePhoto()
├── promptBuilder.ts                      # Legacy one-shot prompt construction
├── promptBuilderBuildMode.ts             # Build Mode section prompts (S1, finalize, CDR auto-populate, suggest diagnosis, parse results)
├── promptBuilderQuickMode.ts             # Quick Mode one-shot prompt + response parsing
├── promptBuilderAnalytics.ts             # Analytics gap pattern prompt
├── parsePromptBuilder.ts                 # Narrative → structured fields parsing prompt
└── vertex.ts                             # Legacy Vertex AI client (retained alongside llm/vertexProvider)
```

**Prompt guide files** (inside Docker context at `backend/prompts/`):

| File | Size | Purpose |
|------|------|---------|
| `mdm-gen-guide-v2.md` | 31 KB | Core prompting logic and MDM template (v2) — fallback for S1 |
| `mdm-gen-guide-build-s1.md` | 6.7 KB | Build Mode Section 1 prompt guide (primary) |
| `mdm-gen-guide-build-s3.md` | 13.6 KB | Build Mode Section 3 / finalize prompt guide |

### 1.2 Layering Strategy

```
Routes → Controllers → Orchestrator/Services → Repositories
```

| Layer | Responsibility | Owns | Does NOT |
|-------|---------------|------|----------|
| **Routes** (`routes.ts`) | Express router, middleware composition | Middleware chain order, HTTP method binding | No business logic, no Firestore, no LLM |
| **Controllers** (`controller.ts`) | Extract from `req`, delegate, format `res` | Request/response transformation | No business logic, no Firestore, no LLM |
| **Orchestrator** (`encounterOrchestrator.ts`) | Business logic, pipeline coordination | Quota, locking, enrichment, error throwing | No `req`/`res` objects, no HTTP concerns |
| **Services** (`services/*.ts`, `userService.ts`) | Domain operations | User management, CDR matching, embeddings | Not directly called by routes |
| **Repositories** (`data/repositories/*.ts`) | Firestore CRUD | Collection paths, field mappings, shape normalization | No business logic |

The encounter module uniquely requires an **Orchestrator** layer because its endpoints coordinate multi-step pipelines (auth → quota → enrichment → LLM → parse → persist → audit). Simpler modules (admin, library, narrative) go directly from controller to service/repository.

### 1.3 Dependency Injection

**Approach**: Manual composition root — no DI container (tsyringe, inversify). Explicit, debuggable, zero framework coupling.

**Wiring flow**:

```
index.ts (composition root)
  │
  ├── initFirebase() → admin.firestore() → db
  ├── initPhotoCatalog(db)
  │
  ├── Creates concrete instances:
  │   ├── UserService(db)
  │   ├── VertexLlmClient() → RetryingLlmClient(vertexClient, config, logger)
  │   ├── LlmResponseParser()
  │   ├── FirestoreEncounterRepository(db)
  │   ├── FirestoreLibraryRepository(db)
  │   ├── InMemoryCache<CdrDefinition[]>(ttlMs)
  │   └── InMemoryCache<TestDefinition[]>(ttlMs)
  │
  └── Assembles AppDependencies → createApp(deps)
        │
        app.ts (app factory)
          │
          ├── Creates requirePlan middleware from userService
          ├── Creates EnrichmentPipeline(libraryCaches)
          ├── Creates EncounterOrchestrator(orchestratorDeps)
          │
          ├── Mounts module routers (each receives its deps slice):
          │   ├── createAdminRoutes({ userService })
          │   ├── createLibraryRoutes({ libraryCaches })
          │   ├── createUserRoutes({ userService, db })
          │   ├── createAnalyticsRoutes({ userService, db, llmClient, requirePlan })
          │   ├── createNarrativeRoutes({ llmClient, responseParser })
          │   ├── createQuickModeRoutes({ encounterRepo, userService, llmClient, responseParser, db })
          │   ├── createEncounterRoutes({ orchestrator })
          │   └── createSurveillanceRoutes({ userService, db, requirePlan })
          │
          └── Registers errorHandler (last)
```

**Per-module dependency interfaces** (`dependencies.ts`):

Each module declares only the dependencies it actually needs. This is enforced at the type level:

```typescript
interface AdminDeps       { userService: UserService }
interface LibraryDeps     { libraryCaches: LibraryCaches }
interface NarrativeDeps   { llmClient: ILlmClient; responseParser: LlmResponseParser }
interface UserModuleDeps  { userService: UserService; db: Firestore }
interface AnalyticsDeps   { userService: UserService; db: Firestore; llmClient: ILlmClient; requirePlan: ... }
interface SurveillanceDeps { userService: UserService; db: Firestore; requirePlan: ... }
interface EncounterDeps   { orchestrator: EncounterOrchestrator }
interface QuickModeDeps   { encounterRepo: IEncounterRepository; userService: UserService; llmClient: ILlmClient; responseParser: LlmResponseParser; db: Firestore }
```

The aggregate `AppDependencies` interface is what `createApp()` receives:

```typescript
interface AppDependencies {
  userService: UserService
  db: FirebaseFirestore.Firestore
  llmClient: ILlmClient
  responseParser: LlmResponseParser
  encounterRepo: IEncounterRepository
  libraryCaches: LibraryCaches
}
```

`LibraryCaches` is a thin interface over cached repository access:

```typescript
interface LibraryCaches {
  getCdrs: () => Promise<CdrDefinition[]>
  getTests: () => Promise<TestDefinition[]>
}
```

### 1.4 Module System

**Native ESM** with TypeScript `NodeNext` module resolution. All internal imports use `.js` extensions (TypeScript resolves to `.ts` at compile time, emits `.js`). The `__dirname` global is unavailable in ESM; `shared/paths.ts` provides `promptPath()` via `import.meta.url`:

```typescript
// shared/paths.ts
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export function promptPath(filename: string): string {
  return path.join(__dirname, '..', '..', 'prompts', filename)
}
```

### 1.5 Data Flow Diagrams

**Request lifecycle**:

```
HTTP Request
  → CORS (manual: localhost regex + allowedOrigins list)
  → express.json({ limit: '1mb' })
  → helmet()
  → requestLogger (assigns req.requestId, req.log child logger)
  → globalLimiter (60 req/min per IP)
  → [route-specific middleware: llmLimiter/parseLimiter, authenticate, requirePlan, validate(schema)]
  → controller.handler()
  → orchestrator/service (business logic)
  → repository (Firestore) / llmClient (Vertex AI)
  → response | throw AppError
  → errorHandler middleware (if error) → JSON response
```

**Encounter pipeline (Section 1)**:

```
Request → authenticate → validate(Section1BodySchema)
  → controller.processSection1()
    → orchestrator.processSection1(uid, email, encounterId, content, location)
      → encounterRepo.get(uid, encounterId)         # Load encounter doc
      → Check submission count (≤2 or SectionLockedError)
      → If !quotaCounted: userService.checkAndIncrementQuota()
      → enrichmentPipeline.enrichForSection1()       # Parallel: surveillance + CDR (non-blocking)
      → getPromptGuide('mdm-gen-guide-build-s1.md')  # Load prompt guide (cached)
      → enrichmentPipeline.resolveTestCatalog()      # Vector search → compact catalog
      → buildSection1Prompt(...)                     # Construct system + user prompt
      → llmClient.generate(prompt, { timeoutMs: 90s })  # RetryingLlmClient → VertexLlmClient
      → responseParser.parseSection1(result.text)    # clean → parse → normalize → validate → fallback
      → encounterRepo.updateSection1(...)            # Persist to Firestore
      → return { differential, cdrAnalysis, workupRecommendations, submissionCount, isLocked, quotaRemaining }
```

---

## 2. Infrastructure Patterns

### 2.1 Middleware Chain

Registration order in `app.ts` is critical — each middleware depends on the preceding ones:

| Order | Middleware | File | What It Does |
|-------|-----------|------|-------------|
| 1 | CORS handler | `app.ts` (inline) | Dynamic origin matching: any `localhost:*` + production domains |
| 2 | `express.json()` | `app.ts` | Body parsing with `{ limit: '1mb' }` |
| 3 | `helmet()` | `app.ts` | Security headers (CSP, HSTS, X-Frame-Options, etc.) |
| 4 | `requestLogger` | `middleware/requestLogger.ts` | Assigns `req.requestId` (Cloud Trace or UUID), creates `req.log` child logger, logs on `res.finish` |
| 5 | `globalLimiter` | `middleware/rateLimiter.ts` | 60 req/min per IP (configurable via `config.limits.globalRateLimit`) |
| 6 | Health probes | `app.ts` (inline) | `/health/live`, `/health/ready`, `/health` (legacy) |
| 7 | Module routers | `modules/*/routes.ts` | Each applies its own per-route middleware (auth, validation, rate limiting) |
| 8 | `errorHandler` | `middleware/errorHandler.ts` | **Must be last** — catches all unhandled errors |

Per-route middleware applied inside module routers (order within each route):

```
[rateLimiter] → authenticate → [requirePlan] → [validate(schema)] → asyncHandler(controller)
```

### 2.2 Config System

**File**: `config.ts`

Zod-validated configuration parsed from `process.env` at module load time. This is the **only** file that reads `process.env` — all other code imports `config`.

```typescript
const ConfigSchema = z.object({
  port:            z.coerce.number().default(8080),
  projectId:       z.string().default('mdm-generator'),
  vertexLocation:  z.string().default('us-central1'),
  credentialsPath: z.string().optional(),           // GOOGLE_APPLICATION_CREDENTIALS
  credentialsJson: z.string().optional(),           // GOOGLE_APPLICATION_CREDENTIALS_JSON
  frontendUrl:     z.string().optional(),           // FRONTEND_URL
  nodeEnv:         z.string().default('production'),
  llm: z.object({
    model:            z.string().default('gemini-2.5-pro'),
    temperature:      z.number().default(0.2),
    topP:             z.number().default(0.95),
    maxOutputTokens:  z.number().default(16384),
    defaultTimeoutMs: z.number().default(55000),     // Standard endpoints
    heavyTimeoutMs:   z.number().default(90000),     // S1 + finalize (long generation)
  }).default({}),
  limits: z.object({
    maxSubmissionsPerSection: z.number().default(2),
    globalRateLimit:         z.number().default(60),  // req/min
    llmRateLimit:            z.number().default(10),  // req/min
    parseRateLimit:          z.number().default(5),   // req/min
    cacheTtlMs:              z.number().default(300000), // 5 minutes
    bodyLimitMb:             z.string().default('1mb'),
    narrativeMaxLength:      z.number().default(16000),
  }).default({}),
})
```

**Startup crash semantics**: If environment variables fail Zod validation, the config parse throws at import time. The server never starts — fail fast, no silent misconfiguration.

### 2.3 Structured Logging

**File**: `logger.ts`

Pino singleton with three key features:

1. **PHI redaction** — automatic at the serialization layer, not developer discipline:
   ```typescript
   redact: {
     paths: ['narrative', 'mdmText', 'content.narrative', 'req.body.narrative', 'req.body.content'],
     censor: '[REDACTED]',
   }
   ```
   Any log statement containing these fields at any nesting depth will have values replaced with `[REDACTED]` before output.

2. **Cloud Logging severity** — Pino levels mapped to GCP severity format:
   ```typescript
   formatters: { level: (label) => ({ severity: label.toUpperCase() }) }
   ```

3. **Cloud Trace correlation** — extracted in `requestLogger` middleware:
   ```typescript
   const traceHeader = req.headers['x-cloud-trace-context']
   const requestId = traceHeader?.split('/')[0] || randomUUID()
   req.log = logger.child({ requestId })
   ```
   Every log line from a request handler includes the `requestId`, enabling cross-log correlation in Cloud Logging.

**Test mode**: Logger level set to `'silent'` when `NODE_ENV === 'test'`.

### 2.4 Health Checks

Three health endpoints, registered directly in `app.ts`:

| Endpoint | Type | Logic | Use |
|----------|------|-------|-----|
| `GET /health/live` | Liveness | `res.json({ status: 'ok' })` — always passes if event loop is responsive | K8s/Cloud Run liveness probe |
| `GET /health/ready` | Readiness | `deps.db.collection('_health').doc('ping').get()` — verifies Firestore connectivity | K8s/Cloud Run readiness probe |
| `GET /health` | Legacy | `res.json({ ok: true })` | Backward compatibility |

Readiness returns `503` with `{ status: 'unhealthy', checks: { firestore: 'failed' } }` on Firestore failure.

### 2.5 Graceful Shutdown

```typescript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
  // Force exit after 95s (longer than max LLM timeout of 90s)
  setTimeout(() => process.exit(1), 95_000)
})
```

The 95-second timeout is intentional: the heaviest LLM calls (S1, finalize) use `heavyTimeoutMs: 90_000`. The shutdown budget gives them 5 extra seconds to complete before force-killing the process. Cloud Run's default termination grace period is 300 seconds, so this fits well within the platform constraint.

---

## 3. Domain Module Design

### 3.1 Module Inventory

| Module | Directory | Endpoints | LLM | Firestore Write | Deps Interface | Complexity |
|--------|-----------|-----------|-----|-----------------|----------------|------------|
| **admin** | `modules/admin/` | 1 | No | Yes (via UserService) | `AdminDeps` | Trivial |
| **analytics** | `modules/analytics/` | 1 | Yes | Yes (Firestore direct) | `AnalyticsDeps` | Simple |
| **encounter** | `modules/encounter/` | 7 | Yes | Yes (via Repository) | `EncounterDeps` | Complex |
| **library** | `modules/library/` | 2 | No | No (read-only cache) | `LibraryDeps` | Simple |
| **narrative** | `modules/narrative/` | 1 | Yes | No | `NarrativeDeps` | Medium |
| **quick-mode** | `modules/quick-mode/` | 1 | Yes | Yes (via Repository) | `QuickModeDeps` | Complex |
| **user** | `modules/user/` | 18 | No | Yes (via UserService + db) | `UserModuleDeps` | Simple |
| **surveillance** | `surveillance/` | 2 | No | Yes (Firestore direct) | `SurveillanceDeps` | Complex |

### 3.2 Complete Endpoint Reference

#### Admin Module (1 endpoint)

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/v1/admin/set-plan` | `authenticate → requireAdmin → validate(AdminPlanBodySchema)` | Set a user's subscription plan (admin only) |

#### Analytics Module (1 endpoint)

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/v1/analytics/insights` | `llmLimiter → authenticate → requirePlan('pro')` | Gap pattern analysis (LLM-powered, pro+ only) |

#### Encounter Module (7 endpoints)

| Method | Path | Rate Limit | Middleware | Description |
|--------|------|-----------|-----------|-------------|
| POST | `/v1/generate` | llm (10/min) | `authenticate → validate(GenerateBodySchema)` | Legacy one-shot MDM generation |
| POST | `/v1/build-mode/process-section1` | llm (10/min) | `authenticate → validate(Section1BodySchema)` | Initial eval → worst-first differential + CDR + workup |
| POST | `/v1/build-mode/process-section2` | none | `authenticate → validate(Section2BodySchema)` | Data persistence only (no LLM) |
| POST | `/v1/build-mode/finalize` | llm (10/min) | `authenticate → validate(FinalizeBodySchema)` | Section 3 → final MDM with surveillance enrichment |
| POST | `/v1/build-mode/match-cdrs` | llm (10/min) | `authenticate → validate(MatchCdrsBodySchema)` | CDR matching + LLM auto-populate |
| POST | `/v1/build-mode/suggest-diagnosis` | llm (10/min) | `authenticate → validate(SuggestDiagnosisBodySchema)` | LLM-driven diagnosis suggestions from S2 data |
| POST | `/v1/build-mode/parse-results` | llm (10/min) | `authenticate → validate(ParseResultsBodySchema)` | Parse pasted lab/EHR text → structured test results |

#### Library Module (2 endpoints)

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| GET | `/v1/libraries/tests` | `authenticate` | Get test catalog (cached, 5-min TTL) |
| GET | `/v1/libraries/cdrs` | `authenticate` | Get CDR catalog (cached, 5-min TTL) |

#### Narrative Module (1 endpoint)

| Method | Path | Rate Limit | Middleware | Description |
|--------|------|-----------|-----------|-------------|
| POST | `/v1/parse-narrative` | parse (5/min) | `authenticate → validate(ParseNarrativeBodySchema)` | Parse narrative → structured fields (no quota charge) |

#### Quick Mode Module (1 endpoint)

| Method | Path | Rate Limit | Middleware | Description |
|--------|------|-----------|-----------|-------------|
| POST | `/v1/quick-mode/generate` | llm (10/min) | `authenticate → validate(QuickModeGenerateBodySchema)` | One-shot MDM + patient identifier extraction |

#### User Module (18 endpoints)

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/v1/whoami` | `authenticate` | Auth validation + user info + usage stats |
| POST | `/v1/user/complete-onboarding` | `authenticate → validate(CompleteOnboardingSchema)` | Complete onboarding flow |
| GET | `/v1/user/order-sets` | `authenticate` | List user's order sets |
| POST | `/v1/user/order-sets` | `authenticate → validate(OrderSetCreateSchema)` | Create order set |
| PUT | `/v1/user/order-sets/:id` | `authenticate → validate(OrderSetUpdateSchema)` | Update order set |
| DELETE | `/v1/user/order-sets/:id` | `authenticate` | Delete order set |
| POST | `/v1/user/order-sets/:id/use` | `authenticate` | Record order set usage |
| GET | `/v1/user/dispo-flows` | `authenticate` | List disposition flows |
| POST | `/v1/user/dispo-flows` | `authenticate → validate(DispositionFlowCreateSchema)` | Create disposition flow |
| PUT | `/v1/user/dispo-flows/:id` | `authenticate → validate(DispositionFlowUpdateSchema)` | Update disposition flow |
| DELETE | `/v1/user/dispo-flows/:id` | `authenticate` | Delete disposition flow |
| POST | `/v1/user/dispo-flows/:id/use` | `authenticate` | Record disposition flow usage |
| GET | `/v1/user/report-templates` | `authenticate` | List report templates |
| POST | `/v1/user/report-templates` | `authenticate → validate(ReportTemplateCreateSchema)` | Create report template |
| PUT | `/v1/user/report-templates/:id` | `authenticate → validate(ReportTemplateUpdateSchema)` | Update report template |
| DELETE | `/v1/user/report-templates/:id` | `authenticate` | Delete report template |
| POST | `/v1/user/report-templates/:id/use` | `authenticate` | Record report template usage |
| GET | `/v1/user/options` | `authenticate` | Get customizable options |
| PUT | `/v1/user/options` | `authenticate → validate(CustomizableOptionsSchema)` | Update customizable options |

#### Surveillance Module (2 endpoints)

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| POST | `/v1/surveillance/analyze` | `authenticate → requirePlan('pro') → validate(TrendAnalysisBodySchema)` | Regional trend analysis (3 CDC sources) |
| POST | `/v1/surveillance/report` | `authenticate → requirePlan('pro') → validate(TrendReportBodySchema)` | PDF trend report download |

**Total: 33 endpoints** (1 admin + 1 analytics + 7 encounter + 2 library + 1 narrative + 1 quick-mode + 18 user + 2 surveillance).

### 3.3 Module Boundaries

Each module receives **only its slice** of `AppDependencies`. The encounter module is the most isolated: it receives only `{ orchestrator: EncounterOrchestrator }` — the orchestrator encapsulates all its own dependencies (repository, LLM client, parser, enrichment pipeline, caches).

**Inter-module communication**: Modules do NOT import from each other. Shared concerns flow through:
- **Shared services** (e.g., `UserService` is used by admin, analytics, encounter, quick-mode, surveillance)
- **Shared utilities** (`shared/` directory)
- **Shared schemas** (`buildModeSchemas.ts`, `types/*.ts`)

### 3.4 Encounter Module Deep Dive

The encounter module is the architectural centerpiece. Its internal layering:

```
routes.ts
  → controller.ts (createEncounterController)
    → encounterOrchestrator.ts (EncounterOrchestrator)
      → enrichmentPipeline.ts (EnrichmentPipeline)
      → encounterRepository.ts (IEncounterRepository)
      → llmClient.ts (ILlmClient → RetryingLlmClient → VertexLlmClient)
      → responseParser.ts (LlmResponseParser)
      → userService.ts (UserService)
      → libraryCaches (LibraryCaches)
```

**OrchestratorDeps interface**:
```typescript
interface OrchestratorDeps {
  encounterRepo: IEncounterRepository
  userService: UserService
  llmClient: ILlmClient
  responseParser: LlmResponseParser
  enrichmentPipeline: EnrichmentPipeline
  libraryCaches: LibraryCaches
}
```

**Key business rules in the orchestrator**:

| Rule | Implementation |
|------|---------------|
| Max 2 submissions per section | `submissionCount >= 2` → `throw new SectionLockedError(section)` |
| Quota counted once per encounter | `encounter.quotaCounted` flag checked before `checkAndIncrementQuota()` |
| Section progression enforced | S2 requires `section1.status === 'completed'`; finalize requires `section2.status === 'completed'` |
| Surveillance is non-blocking | `enrichmentPipeline.enrichForSection1()` uses `Promise.allSettled` pattern — failures return `undefined` |
| CDR auto-populate is non-blocking | Wrapped in try/catch, failure logged as warning |
| Token size validated per plan | `checkTokenSize(content, stats.features.maxTokensPerRequest)` |
| Dual llmResponse shape handled | `getDifferential()` normalizes flat array vs `{ differential: [...] }` |

### 3.5 Shared Kernel

The `shared/` directory provides utilities used across multiple modules:

| File | Exports | Used By |
|------|---------|---------|
| `asyncHandler.ts` | `asyncHandler(fn)` | All route files — wraps async handlers to catch errors and call `next(err)` |
| `db.ts` | `getDb()` | `surveillanceEnrichment.ts` — Firestore singleton (fallback when db not injected) |
| `llmResponseUtils.ts` | `cleanLlmJsonResponse`, `extractJsonFromText`, `coerceAndValidateDifferential`, `getDifferential`, `flattenToStrings`, `stringifyDisposition`, `normalizeComplexity`, `extractFinalMdm` | `responseParser.ts`, `encounterOrchestrator.ts` |
| `paths.ts` | `promptPath(filename)` | `encounterOrchestrator.ts` — resolves prompt guide file paths in ESM |
| `quotaHelpers.ts` | `checkTokenSize(text, maxTokens)` | `encounterOrchestrator.ts`, quick-mode controller |
| `surveillanceEnrichment.ts` | `runSurveillanceEnrichment()`, `runCdrEnrichment()`, `injectSurveillanceIntoMdm()` | `enrichmentPipeline.ts`, `encounterOrchestrator.ts` |

---

## 4. Data Access Layer

### 4.1 Repository Interfaces

Three repository interfaces abstract Firestore access:

**`IEncounterRepository`** (8 methods):
```typescript
interface IEncounterRepository {
  get(uid: string, encounterId: string): Promise<EncounterDocument | null>
  updateSection1(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
  updateSection2(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
  finalize(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
  markQuotaCounted(uid: string, encounterId: string): Promise<void>
  updateCdrTracking(uid: string, encounterId: string, cdrTracking: CdrTracking): Promise<void>
  updateQuickModeStatus(uid: string, encounterId: string, status: string): Promise<void>
  finalizeQuickMode(uid: string, encounterId: string, data: Record<string, any>): Promise<void>
}
```

**`ILibraryRepository`** (2 methods):
```typescript
interface ILibraryRepository {
  getAllTests(): Promise<TestDefinition[]>
  getAllCdrs(): Promise<CdrDefinition[]>
}
```

**`IUserRepository`** (4 methods):
```typescript
interface IUserRepository {
  getUser(uid: string): Promise<UserDocument | null>
  getCustomer(uid: string): Promise<Record<string, any> | null>
  updateCustomer(uid: string, data: Record<string, any>): Promise<void>
  incrementGapTallies(uid: string, updates: Record<string, any>): Promise<void>
}
```

### 4.2 Firestore Paths and Document Shapes

| Collection Path | Repository | Document Shape |
|----------------|-----------|---------------|
| `customers/{uid}` | `FirestoreUserRepository` | User profile, subscription, usage stats, gap tallies, customizable options |
| `customers/{uid}/encounters/{encounterId}` | `FirestoreEncounterRepository` | Encounter document with sections 1-3, CDR tracking, surveillance context, photo |
| `customers/{uid}/checkout_sessions/{sessionId}` | *(Stripe Extension)* | Stripe checkout session data |
| `customers/{uid}/subscriptions/{subId}` | *(Stripe Extension)* | Subscription status, plan, period |
| `users/{uid}` | `FirestoreUserRepository` | Auth-linked user profile (email, displayName, onboarding status) |
| `testLibrary/{testId}` | `FirestoreLibraryRepository` | Test definition (id, name, category, unit, normalRange) |
| `cdrLibrary/{cdrId}` | `FirestoreLibraryRepository` | CDR definition (id, name, components, scoring, conditions) |
| `photoLibrary/{photoId}` | *(photoCatalog.ts)* | Photo metadata (category, subcategory, downloadUrl) |
| `customers/{uid}/orderSets/{setId}` | *(user controller)* | Order set (name, tests[], tags, usageCount) |
| `customers/{uid}/dispoFlows/{flowId}` | *(user controller)* | Disposition flow (name, disposition, followUp[], usageCount) |
| `customers/{uid}/reportTemplates/{templateId}` | *(user controller)* | Report template (testId, name, text, defaultStatus, usageCount) |
| `surveillance_analyses/{analysisId}` | *(surveillance routes)* | Stored analysis results (for PDF generation) |
| `products/{productId}` | *(Stripe Extension)* | Stripe product data |
| `products/{productId}/prices/{priceId}` | *(Stripe Extension)* | Stripe price data |
| `_health/ping` | *(health check)* | Readiness probe target document |

**Encounter document shape** (`EncounterDocument`):
```typescript
interface EncounterDocument {
  status: string                    // 'created' | 'section1_done' | 'section2_done' | 'finalized' | 'section3_error'
  mode?: string                     // 'build' | 'quick'
  chiefComplaint?: string
  quotaCounted?: boolean
  surveillanceContext?: string      // Stored from S1 enrichment, reused at finalize
  cdrContext?: string
  cdrTracking?: CdrTracking        // CDR state machine (from match-cdrs endpoint)
  encounterPhoto?: { category: string; subcategory: string }
  section1?: {
    content?: string               // Physician narrative
    llmResponse?: any              // DUAL SHAPE: flat DifferentialItem[] OR { differential, cdrAnalysis, workupRecommendations, processedAt }
    submissionCount?: number       // 0-2 (locks at 2)
    status?: string                // 'completed'
    lastUpdated?: Timestamp
  }
  section2?: {
    content?: string
    llmResponse?: any
    selectedTests?: string[]        // Test IDs selected by physician
    testResults?: Record<string, TestResult>  // Per-test status, findings, values
    workingDiagnosis?: string | WorkingDiagnosis  // UNION TYPE: legacy string vs structured object
    submissionCount?: number
    status?: string
    lastUpdated?: Timestamp
  }
  section3?: {
    content?: string
    llmResponse?: any              // { finalMdm: FinalMdm, gaps: GapItem[], processedAt }
    treatments?: any
    cdrSuggestedTreatments?: any
    disposition?: any
    followUp?: any
    submissionCount?: number
    status?: string                // 'completed' | 'error'
    lastUpdated?: Timestamp
  }
  quickModeData?: {                // Quick Mode encounters only
    status?: string
    narrative?: string
    patientIdentifier?: any
    mdmOutput?: any
    gaps?: GapItem[]
    processedAt?: Timestamp
    errorMessage?: string
  }
}
```

### 4.3 Caching

**`InMemoryCache<T>`** (`data/cache.ts`):

Generic TTL-based in-memory cache with thundering-herd deduplication:

```typescript
class InMemoryCache<T> implements CacheService<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>()
  private pending = new Map<string, Promise<T>>()  // thundering-herd prevention

  constructor(private readonly ttlMs: number) {}

  getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T>
  // 1. Check cache → return if valid
  // 2. Check pending map → await existing fetch if in-flight
  // 3. Start new fetch → store in pending → on resolve: cache + clear pending
}
```

**Thundering herd prevention**: When multiple concurrent requests hit an expired cache entry, the `pending` map ensures only one Firestore query is made. Subsequent callers await the same Promise.

**Usage in composition root**:
```typescript
const cdrCache = new InMemoryCache<CdrDefinition[]>(config.limits.cacheTtlMs)  // 5 min
const testCache = new InMemoryCache<TestDefinition[]>(config.limits.cacheTtlMs) // 5 min

libraryCaches: {
  getCdrs: () => cdrCache.getOrFetch('all', () => libraryRepo.getAllCdrs()),
  getTests: () => testCache.getOrFetch('all', () => libraryRepo.getAllTests()),
}
```

**Surveillance cache** (separate): `surveillance/cache/surveillanceCache.ts` is Firestore-backed with per-source TTL, designed for CDC data that updates on different schedules per source.

### 4.4 Data Validation at Persistence Boundary

**Dual `llmResponse` shape**: Old encounters have Section 1 `llmResponse` as a flat `DifferentialItem[]`. New encounters have `{ differential, cdrAnalysis, workupRecommendations, processedAt }`. The `getDifferential()` helper handles both:

```typescript
function getDifferential(llmResponse: any): DifferentialItem[] {
  if (Array.isArray(llmResponse)) return llmResponse        // Old shape
  if (llmResponse?.differential) return llmResponse.differential  // New shape
  return []
}
```

**`workingDiagnosis` union**: Can be `string` (legacy) or `WorkingDiagnosis` (structured). The orchestrator resolves this:

```typescript
const resolvedWd = !rawWd ? undefined
  : typeof rawWd === 'string' ? rawWd
  : rawWd.custom || rawWd.selected || undefined
```

---

## 5. LLM Integration Layer

### 5.1 ILlmClient Interface

```typescript
interface LlmPrompt {
  system: string
  user: string
}

interface LlmOptions {
  jsonMode?: boolean      // Force JSON output (responseMimeType: 'application/json')
  timeoutMs?: number      // Override default timeout
}

interface LlmResponse {
  text: string
  usage?: { inputTokens: number; outputTokens: number }
  latencyMs: number
}

interface ILlmClient {
  generate(prompt: LlmPrompt, options?: LlmOptions): Promise<LlmResponse>
}
```

### 5.2 VertexLlmClient

**File**: `llm/vertexProvider.ts`

Implements `ILlmClient` for Google Vertex AI Gemini:

| Setting | Value | Source |
|---------|-------|--------|
| Model | `gemini-2.5-pro` | `config.llm.model` |
| Temperature | `0.2` | `config.llm.temperature` |
| Top-P | `0.95` | `config.llm.topP` |
| Max output tokens | `16384` | `config.llm.maxOutputTokens` |
| Default timeout | `55,000 ms` | `config.llm.defaultTimeoutMs` |
| Safety settings | `BLOCK_MEDIUM_AND_ABOVE` for all 4 harm categories | Hardcoded |

**Credentials**: Parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` (inline JSON) for Cloud Run, falls back to default credentials.

**Multi-part response handling**: Gemini 2.5 Pro may include "thinking" parts. The provider filters these:
```typescript
const answerParts = parts.filter(p => !p.thought && p.text)
const text = answerParts.length > 0
  ? answerParts[answerParts.length - 1].text
  : parts[parts.length - 1]?.text ?? ''
```

**Timeout**: Uses `Promise.race` between the generation call and a timeout promise. Timer is always cleared in `finally`.

### 5.3 RetryingLlmClient

**File**: `llm/retryingLlmClient.ts`

Decorator pattern — wraps any `ILlmClient` with transparent retry:

```typescript
class RetryingLlmClient implements ILlmClient {
  constructor(
    inner: ILlmClient,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    log?: { warn: (obj, msg) => void }
  )
}
```

**Default retry configuration** (`retryPolicy.ts`):

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `maxRetries` | `2` | Maximum retry attempts |
| `baseDelayMs` | `1000` | Initial backoff delay |
| `maxDelayMs` | `3000` | Maximum per-retry delay |
| `totalBudgetMs` | `30,000` | Total time budget for all attempts |

**Backoff calculation**: `delay = min(baseDelay × 2^attempt, maxDelay) + jitter(10-20%)`

**Retryable errors** (classified in `isRetryable()`):

| Retryable | Not Retryable |
|-----------|--------------|
| Timeouts (`timeout`, `timed out`) | Safety blocks (`safety`, `blocked`, `harm`) |
| Rate limits (`429`, `rate limit`) | Client errors (`400`, `401`, `403`, `404`) |
| Server errors (`500`, `502`, `503`, `504`) | Unknown errors (default: not retryable) |
| Network errors (`ECONNREFUSED`, `ECONNRESET`, `fetch failed`) | |

**Budget enforcement**: Before each retry, checks elapsed time against `totalBudgetMs`. If remaining budget is less than the calculated delay, throws immediately rather than waiting.

### 5.4 LlmResponseParser

**File**: `llm/responseParser.ts`

Centralizes all LLM response parsing with a consistent `ParseResult<T>` type:

```typescript
type ParseResult<T> =
  | { success: true; data: T; fallback: false }          // Clean parse
  | { success: true; data: T; fallback: true; reason: string }  // Parse with recovery
  | { success: false; data: T; reason: string }           // Failure with fallback stub
```

**7 parse methods**:

| Method | Input | Output Type | Fallback Strategy |
|--------|-------|-------------|-------------------|
| `parseSection1(rawText)` | S1 LLM response | `Section1ParsedData` | Brace extraction → stub differential |
| `parseFinalize(rawText)` | Finalize LLM response | `FinalizeParsedData` | Defensive unwrap → brace extraction → error MDM |
| `parseQuickMode(rawText)` | Quick mode response | `QuickModeGenerationResult` | Brace extraction → error MDM with attestation |
| `parseNarrative(rawText)` | Narrative parse response | `ParsedNarrative` | Brace extraction → empty narrative with warning |
| `parseSuggestDiagnosis(rawText, fallback)` | Diagnosis suggestions | `string[]` | Top 3 differential diagnoses |
| `parseResults(rawText, validIds)` | Lab results | `{ parsed, unmatchedText }` | Empty with error message |
| `parseCdrAutoPopulate(rawText)` | CDR auto-populate | `AutoPopulatedValues \| null` | Returns `null` (non-blocking) |

**Parse pipeline stages** (consistent across all methods):

```
Raw LLM text
  → cleanLlmJsonResponse()     # Strip fences, preamble, trailing commas
  → JSON.parse()               # Primary parse attempt
  → Zod validation / coercion  # Type safety + urgency normalization
  → Fallback: extractJsonFromText()  # Brace-matching extraction
  → Fallback: stub data        # Guaranteed non-null return
```

### 5.5 Prompt Builders

5 prompt builder files construct `{ system, user }` pairs for LLM calls:

| File | Functions | Used By |
|------|-----------|---------|
| `promptBuilder.ts` | `buildPrompt(narrative)` | Legacy one-shot generate |
| `promptBuilderBuildMode.ts` | `buildSection1Prompt()`, `buildFinalizePrompt()`, `buildCdrAutoPopulatePrompt()`, `buildSuggestDiagnosisPrompt()`, `buildParseResultsPrompt()` | Encounter orchestrator |
| `promptBuilderQuickMode.ts` | `buildQuickModePrompt()` | Quick-mode controller |
| `promptBuilderAnalytics.ts` | `buildAnalyticsPrompt()` | Analytics controller |
| `parsePromptBuilder.ts` | `buildParseNarrativePrompt()` | Narrative controller |

Prompt builders load system prompts from `backend/prompts/*.md` files (cached after first read via `promptGuideCache` Map).

### 5.6 No Streaming (Deferred)

Streaming is intentionally deferred. Current architecture returns full LLM responses synchronously. When implemented, the planned approach is `GET /v1/encounters/:id/stream` with Server-Sent Events (SSE). Deferred because:
- UX feature, not architectural requirement
- LLM response parsing requires full text (JSON structure)
- Retry logic operates on complete responses

---

## 6. Auth & Security Architecture

### 6.1 Unified Auth Middleware

**File**: `middleware/auth.ts`

Single `authenticate` middleware handles two token patterns:

```typescript
function authenticate(req, res, next) {
  const bearerToken = req.headers.authorization?.split('Bearer ')[1]
  const bodyToken = req.body?.userIdToken

  const token = bearerToken || bodyToken  // Bearer takes precedence

  if (bodyToken && !bearerToken) {
    req.log?.warn('Body-token auth is deprecated. Migrate to Authorization: Bearer header.')
  }

  if (!token) return next(new AuthenticationError())

  const decoded = await firebaseAdmin.auth().verifyIdToken(token)
  req.user = { uid: decoded.uid, email: decoded.email, admin: decoded.admin === true }
  next()
}
```

**Express request augmentation** (`types/express.d.ts`):
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email?: string; admin?: boolean }
      requestId?: string
      log?: pino.Logger
    }
  }
}
```

### 6.2 Body-Token Quirk

Build Mode endpoints historically passed `userIdToken` in the request body, not as a Bearer header. This is due to the frontend's original implementation. The unified auth middleware supports both but logs a deprecation warning for body-token usage.

**Route-level handling**: Zod schemas for encounter endpoints include `userIdToken` in the full schema, but routes use `.omit({ userIdToken: true })` variants because auth middleware handles token extraction:

```typescript
const Section1BodySchema = Section1RequestSchema.omit({ userIdToken: true })
router.post('/v1/build-mode/process-section1', llmLimiter, authenticate, validate(Section1BodySchema), asyncHandler(c.processSection1))
```

### 6.3 Authorization Layers

| Middleware | Factory | Purpose | Error |
|-----------|---------|---------|-------|
| `authenticate` | `createAuthMiddleware(admin)` | Verify Firebase ID token | `AuthenticationError` (401) |
| `requireAdmin` | *(standalone)* | Check `req.user.admin === true` | `AuthorizationError` (403) |
| `requirePlan(minPlan)` | `createRequirePlan(userService)` | Check subscription tier ≥ required | `AuthorizationError` (403) |

**Plan tier hierarchy**:
```typescript
const PLAN_TIERS = { free: 0, pro: 1, enterprise: 2, admin: 3 }
```

Admins bypass plan checks (`if (req.user?.admin) return next()`).

### 6.4 PHI Protection as Architecture

PHI protection is enforced at the Pino configuration level, not by developer discipline:

```typescript
// logger.ts
redact: {
  paths: ['narrative', 'mdmText', 'content.narrative', 'req.body.narrative', 'req.body.content'],
  censor: '[REDACTED]',
}
```

This means a developer who writes `logger.info({ narrative: 'patient text...' })` gets `[REDACTED]` in the output automatically. No manual `[REDACTED]` substitution needed.

**Error response safety**: The `errorHandler` middleware never includes:
- Stack traces (only logged server-side for 5xx)
- Database queries
- Medical content
- Internal file paths

### 6.5 Rate Limiting

Factory pattern with three presets:

| Limiter | Rate | Applied To |
|---------|------|-----------|
| `globalLimiter` | 60 req/min per IP | All routes (app-level) |
| `llmLimiter` | 10 req/min per IP | All LLM-calling endpoints |
| `parseLimiter` | 5 req/min per IP | Narrative parse endpoint only |

```typescript
function createRateLimiter(opts: { windowMs?: number; max: number }) {
  return rateLimit({ windowMs: opts.windowMs || 60_000, max: opts.max, standardHeaders: true, legacyHeaders: false })
}
```

Uses `express-rate-limit` with `trust proxy` enabled for Cloud Run's load balancer.

---

## 7. Testing Architecture

### 7.1 Test File Organization

```
backend/src/__tests__/
├── helpers/
│   ├── mockDependencies.ts              # DI mock factory (createMockEncounterRepo, createMockLlmClient, etc.)
│   └── mockFactories.ts                # Test data builders
├── fixtures/
│   └── llmResponses.ts                 # Pre-canned LLM response strings
├── unit/
│   ├── encounterOrchestrator.test.ts   # Business logic, section progression, locking, quota
│   ├── enrichmentPipeline.test.ts      # Enrichment flow, fallback paths
│   ├── errorHandler.test.ts            # Error formatting, AppError → JSON, ZodError handling
│   ├── auth.test.ts                    # Token verification, plan checking, admin gates
│   ├── responseParser.test.ts          # JSON parsing resilience, fallback strategies
│   ├── retryPolicy.test.ts            # Backoff logic, budget tracking, retry decisions
│   └── cdrMatcher.test.ts             # CDR matching algorithm
├── surveillance/
│   ├── cdcNndssAdapter.test.ts
│   ├── cdcRespiratoryAdapter.test.ts
│   ├── cdcWastewaterAdapter.test.ts
│   ├── correlationEngine.test.ts
│   ├── pdfGenerator.test.ts
│   ├── promptAugmenter.test.ts
│   ├── regionResolver.test.ts
│   ├── routes.test.ts
│   ├── surveillanceCache.test.ts
│   └── syndromeMapper.test.ts
├── buildModeSchemas.test.ts
├── cdrCatalogFormatter.test.ts
├── cdrCatalogSearch.test.ts
├── embeddingService.test.ts
├── outputSchema.test.ts
├── promptBuilders.test.ts
├── routes.test.ts
└── userService.test.ts
```

**25 test files**, ~6,160 total lines, ~310 tests. The unit tests from the refactoring contributed ~1,338 new lines; pre-existing surveillance, schema, and integration tests account for the remainder.

### 7.2 DI-Based Mocking

**No module-level mocking** — all mocks are via constructor injection and DI interfaces.

**Mock factory** (`helpers/mockDependencies.ts`):

```typescript
function createMockEncounterRepo(): IEncounterRepository
// Returns mock with fixture encounter document, configurable responses

function createMockLlmClient(response?: Partial<LlmResponse>): ILlmClient
// Returns mock that resolves with configurable text/usage/latency

function createMockUserService(): UserService
// Returns mock with configurable quota, usage stats, plan

function createMockLibraryCaches(): LibraryCaches
// Returns mock CDR and test catalogs
```

Tests construct their own orchestrator/service with mocks:

```typescript
const orchestrator = new EncounterOrchestrator({
  encounterRepo: createMockEncounterRepo(),
  userService: createMockUserService(),
  llmClient: createMockLlmClient({ text: '...' }),
  responseParser: new LlmResponseParser(),
  enrichmentPipeline: createMockEnrichmentPipeline(),
  libraryCaches: createMockLibraryCaches(),
})

const result = await orchestrator.processSection1(uid, email, encounterId, content)
expect(result.differential).toHaveLength(3)
```

### 7.3 Test Patterns

| Pattern | Description |
|---------|-------------|
| **Constructor DI** | Create real class instances with mock dependencies |
| **No HTTP** | Orchestrator/service tests don't require Express or HTTP |
| **No Firebase** | Mock repositories replace all Firestore access |
| **No Vertex AI** | Mock LLM client replaces all LLM calls |
| **Configurable responses** | Each mock accepts overrides for custom test scenarios |
| **Error path testing** | Tests verify correct AppError subclass is thrown |

---

## 8. Error Architecture

### 8.1 Error Hierarchy

```
AppError (abstract)
  ├── AuthenticationError    → 401  UNAUTHORIZED
  ├── AuthorizationError     → 403  FORBIDDEN         (+ details?)
  ├── ValidationError        → 400  VALIDATION_ERROR   (+ ZodIssue[]?)
  ├── QuotaExceededError     → 402  QUOTA_EXCEEDED     (+ quotaInfo)
  ├── NotFoundError          → 404  NOT_FOUND
  ├── RateLimitError         → 429  RATE_LIMITED        (+ retryAfterMs?)
  ├── LlmError               → 500  LLM_ERROR
  └── SectionLockedError     → 400  SECTION_LOCKED     (+ section number)
```

All subclasses inherit:
- `statusCode: number` — HTTP status
- `code: string` — machine-readable error code
- `isOperational: boolean` — always `true` (distinguishes from programmer errors)
- `toJSON()` — `{ error: message, code }`

### 8.2 Error-to-HTTP Mapping

**File**: `middleware/errorHandler.ts`

The centralized error handler maps error types to JSON responses:

```typescript
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    // Log 5xx errors to request logger
    if (err.statusCode >= 500) req.log.error({ err, code: err.code }, err.message)

    const body = { error: err.message, code: err.code }
    if (err.details)      body.details = err.details        // ValidationError
    if (err.quotaInfo)    body.quotaInfo = err.quotaInfo    // QuotaExceededError
    if (err.retryAfterMs) body.retryAfterMs = err.retryAfterMs // RateLimitError

    return res.status(err.statusCode).json(body)
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid request', code: 'VALIDATION_ERROR', details: err.errors })
  }

  // Unknown error — never expose internals
  req.log.error({ err }, 'Unhandled error')
  return res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' })
}
```

### 8.3 Client Error Contract

Frontend can rely on this consistent JSON shape:

```typescript
// All errors
{ error: string, code: string }

// ValidationError additions
{ error: string, code: 'VALIDATION_ERROR', details: ZodIssue[] }

// QuotaExceededError additions
{ error: string, code: 'QUOTA_EXCEEDED', quotaInfo: { remaining: number, plan: string, limit: number, used: number } }

// RateLimitError additions
{ error: string, code: 'RATE_LIMITED', retryAfterMs?: number }

// AuthorizationError additions (plan gating)
{ error: string, code: 'FORBIDDEN', details: { code: 'PLAN_REQUIRED', upgradeRequired: true, requiredPlan: 'pro' | 'enterprise' } }
```

### 8.4 Domain vs Infrastructure Errors

| Error Type | Domain/Infra | Thrown By |
|-----------|-------------|----------|
| `SectionLockedError` | Domain | Orchestrator (business rule) |
| `QuotaExceededError` | Domain | Orchestrator (business rule) |
| `NotFoundError` | Domain | Orchestrator (entity not found) |
| `ValidationError` | Domain | `validate()` middleware, Orchestrator |
| `AuthenticationError` | Infrastructure | `authenticate` middleware |
| `AuthorizationError` | Infrastructure | `requireAdmin`, `requirePlan` middleware |
| `RateLimitError` | Infrastructure | Rate limiter (express-rate-limit) |
| `LlmError` | Infrastructure | Orchestrator (LLM call failed after retries) |

---

## 9. Hybrid Architecture Considerations

### 9.1 Cloud Run for All Backend

The entire backend runs as a single Express application on Cloud Run. No Cloud Functions are currently used for backend logic. The only Firebase-managed backend logic is the **Stripe Extension**, which uses Firestore triggers to sync subscription data.

**Cloud Run configuration**:
- Region: `us-central1`
- Image: `gcr.io/mdm-generator/mdm-backend:latest`
- Docker base: `node:20-slim`
- Trust proxy enabled (for rate limiting behind Cloud Run's load balancer)

### 9.2 Event-Driven Patterns

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| Firestore triggers (Stripe) | Firebase Stripe Extension | Sync `products`, `prices`, `subscriptions` from Stripe to Firestore |
| Firestore `onSnapshot` (frontend) | Client-side listeners | Real-time encounter state, subscription changes |
| Photo catalog init | `initPhotoCatalog(db)` at startup | Load photo library from Firestore into memory |

The backend itself is **request-driven only** — no background workers, no pub/sub consumers, no scheduled tasks.

### 9.3 Non-Blocking Surveillance

Surveillance enrichment uses `Promise.allSettled` semantics — failures are caught and logged but **never block MDM generation**:

```typescript
// EnrichmentPipeline.enrichForSection1()
const [surveillanceContext, cdrContext] = await Promise.all([
  location ? runSurveillanceEnrichment(narrative, location).catch(() => undefined) : undefined,
  runCdrEnrichment(narrative),
])
```

This is a deliberate architectural decision: surveillance data is supplementary context for the LLM, not a required input. A CDC API outage should not prevent physicians from generating MDM documentation.

### 9.4 Deferred Items

| Item | Status | Reason for Deferral |
|------|--------|-------------------|
| SSE/streaming for LLM responses | Deferred | UX feature; response parsing requires full text |
| Circuit breaker for Vertex AI | Deferred | Retry policy covers most failure modes |
| Multi-stage Docker build | Deferred | Image size not impacting cold start significantly |
| Firestore emulator integration tests | Deferred | DI-based unit tests provide sufficient coverage |
| Body-token auth removal | Deferred | Breaking change requiring frontend coordination |
| Prompt builder relocation to `llm/prompts/` | Deferred | Low-impact file moves |

---

## 10. Frontend Alignment

### 10.1 Complete Endpoint Inventory with Frontend Integration

| Endpoint | Auth Pattern | Rate Limit | Frontend Caller | Response Shape |
|----------|-------------|-----------|----------------|---------------|
| `POST /v1/whoami` | Body-token (via authenticate) | global | `useAuth` / app init | `{ uid, email, plan, remaining, limit, used, features }` |
| `POST /v1/admin/set-plan` | Bearer + admin | global | Admin panel | `{ ok, uid, plan }` |
| `POST /v1/parse-narrative` | Body-token | parse (5/min) | Compose page | `{ ok, parsed: ParsedNarrative }` |
| `POST /v1/generate` | Body-token | llm (10/min) | Legacy generate | `{ ok, draft, draftJson, remaining, plan, used, limit }` |
| `POST /v1/build-mode/process-section1` | Body-token | llm (10/min) | `useEncounter` hook | `{ ok, differential, cdrAnalysis?, workupRecommendations?, submissionCount, isLocked, quotaRemaining }` |
| `POST /v1/build-mode/process-section2` | Body-token | none | `useEncounter` hook | `{ ok, submissionCount, isLocked }` |
| `POST /v1/build-mode/finalize` | Body-token | llm (10/min) | `useEncounter` hook | `{ ok, generationFailed, finalMdm, gaps, quotaRemaining }` |
| `POST /v1/build-mode/match-cdrs` | Body-token | llm (10/min) | `useEncounter` hook | `{ ok, cdrTracking, matchedCount }` |
| `POST /v1/build-mode/suggest-diagnosis` | Body-token | llm (10/min) | `useEncounter` hook | `{ ok, suggestions: string[] }` |
| `POST /v1/build-mode/parse-results` | Body-token | llm (10/min) | `useEncounter` hook | `{ ok, parsed: ParsedResultItem[], unmatchedText?: string[] }` |
| `POST /v1/quick-mode/generate` | Body-token | llm (10/min) | `useQuickEncounter` hook | `{ ok, mdm, patientIdentifier, gaps, encounterPhoto?, quotaRemaining }` |
| `GET /v1/libraries/tests` | Bearer | global | Library components | `TestDefinition[]` |
| `GET /v1/libraries/cdrs` | Bearer | global | Library components | `CdrDefinition[]` |
| `POST /v1/analytics/insights` | Bearer + pro | llm (10/min) | Analytics page | `{ ok, insights }` |
| `GET /v1/user/order-sets` | Bearer | global | User settings | `OrderSet[]` |
| `POST /v1/user/order-sets` | Bearer | global | User settings | `{ ok, id }` |
| `PUT /v1/user/order-sets/:id` | Bearer | global | User settings | `{ ok }` |
| `DELETE /v1/user/order-sets/:id` | Bearer | global | User settings | `{ ok }` |
| `POST /v1/user/order-sets/:id/use` | Bearer | global | Build Mode | `{ ok }` |
| `GET /v1/user/dispo-flows` | Bearer | global | User settings | `DispositionFlow[]` |
| *(+ 5 more dispo-flow CRUD)* | Bearer | global | User settings | Similar |
| *(+ 5 more report-template CRUD)* | Bearer | global | User settings | Similar |
| `GET /v1/user/options` | Bearer | global | User settings | `CustomizableOptions` |
| `PUT /v1/user/options` | Bearer | global | User settings | `{ ok }` |
| `POST /v1/user/complete-onboarding` | Bearer | global | Onboarding flow | `{ ok }` |
| `POST /v1/surveillance/analyze` | Bearer + pro | global | `TrendAnalysisContext` | `{ ok, analysis: TrendAnalysisResult }` |
| `POST /v1/surveillance/report` | Bearer + pro | global | `TrendReportModal` | PDF binary (Content-Type: application/pdf) |

### 10.2 Frontend API Client Architecture

**File**: `frontend/src/lib/api.ts` (1,076 lines)

The frontend API client is a custom wrapper around `fetch` with typed error classification:

**`ApiError` class** — classifies backend errors for UI routing:

| Classification | Triggered By | Frontend Behavior |
|---------------|-------------|-------------------|
| `'auth'` | 401 status | Redirect to login, clear auth state |
| `'validation'` | 400 status | Show field-level errors |
| `'quota'` | 402 status | Show quota info, upgrade prompt |
| `'server'` | 500 status | "Generation failed, try again" |
| `'network'` | Fetch failure, timeout | "Connection error, check network" |
| `'unknown'` | Any other | Generic error message |

**`apiFetch()` wrapper** — 30-second default timeout, abort signal handling, automatic JSON parsing.

**Auth token attachment** — two patterns used in the API client:

| Auth Pattern | Endpoints | Frontend Implementation |
|-------------|-----------|----------------------|
| **Body-token** (`userIdToken` in request body) | `whoami`, `parse-narrative`, `generate`, all `build-mode/*`, `quick-mode/generate` | `getIdToken()` → include in `body.userIdToken` |
| **Bearer header** (`Authorization: Bearer <token>`) | All `user/*`, `libraries/*`, `analytics/*`, `surveillance/*`, `admin/*` | `getIdToken()` → `headers: { Authorization: 'Bearer ' + token }` |

The backend accepts both patterns on all endpoints (body-token logs deprecation warning). The distinction matters for the frontend API client layer.

### 10.3 Firestore Real-Time Listeners (Frontend → Firestore Direct)

The frontend maintains real-time subscriptions to Firestore collections that the backend writes to:

| Hook/Context | Collection Path | Frontend File | Pattern | What It Watches |
|-------------|----------------|--------------|---------|----------------|
| `useEncounter` | `customers/{uid}/encounters/{encounterId}` | `hooks/useEncounter.ts` (421 lines) | `onSnapshot` (real-time) | Section status, LLM responses, CDR tracking, submission counts |
| `useEncounterList` | `customers/{uid}/encounters` | `hooks/useEncounterList.ts` (150+ lines) | `onSnapshot` (real-time) | Active encounters list, room number sorting |
| `useSubscription` | `customers/{uid}/subscriptions` | `hooks/useSubscription.ts` (241 lines) | `onSnapshot` (real-time) | Plan changes, period expiry, tier determination |
| `usePhotoLibrary` | `photoLibrary` | `hooks/usePhotoLibrary.ts` (46 lines) | `getDocs` (one-time) | Photo catalog → `Map<string, string>` |
| `TrendAnalysisContext` | *(localStorage, not Firestore)* | `contexts/TrendAnalysisContext.tsx` (101 lines) | `localStorage` | `isEnabled`, `location` persisted with key `mdm-trend-prefs` |

**`useEncounter` details** — the most complex listener:
- Defensive defaults for Firestore null values (lines 112-128)
- Local content state separate from Firestore for editing before submit
- S2 submission uses `updateDoc()` without API call (pure data entry — client-side write)
- S3 submission waits for backend-initiated Firestore write (security rules block client writes when `status: 'finalized'`)

**`useSubscription` details**:
- Filters for `trialing` or `active` subscription status
- Price-to-tier mapping: specific Stripe price IDs → `pro` / `enterprise`
- Generation limits by tier: `free=10`, `pro=250`, `enterprise=1000`

**Critical alignment concern**: The frontend reads encounter documents in real-time that the backend writes to. Both must agree on document shape. The backend's `EncounterDocument` type definition is the source of truth.

### 10.4 Type/Schema Mirror Table

Frontend TypeScript types that correspond to backend Zod schemas / repository types:

| Backend (Zod / Interface) | Frontend (TypeScript) | File |
|--------------------------|----------------------|------|
| `EncounterDocument` (`encounterRepository.ts`) | `EncounterDocument` | `types/encounter.ts` (637 lines) |
| `DifferentialItemSchema` (`buildModeSchemas.ts`) | `DifferentialItem` | `types/encounter.ts` |
| `CdrAnalysisItemSchema` | `CdrAnalysisItem` | `types/encounter.ts` |
| `WorkupRecommendationSchema` | `WorkupRecommendation` | `types/encounter.ts` |
| `CdrTrackingEntrySchema` | `CdrTrackingEntry` | `types/encounter.ts` |
| `FinalMdmSchema` | `FinalMdm` | `types/encounter.ts` |
| `TestResult` (`buildModeSchemas.ts`) | `TestResult` | `types/encounter.ts` |
| `TestDefinition` (`types/libraries.ts`) | `TestDefinition` | `types/libraries.ts` (104 lines) |
| `CdrDefinition` (`types/libraries.ts`) | `CdrDefinition` | `types/libraries.ts` |
| `CdrComponent` | `CdrComponent` | `types/libraries.ts` |
| `CdrScoring` | `CdrScoring` | `types/libraries.ts` |
| `UserDocument` (`userRepository.ts`) | `UserProfile` | `types/userProfile.ts` (58 lines) |
| `OrderSetCreateSchema` (`types/userProfile.ts`) | `OrderSet` | `types/userProfile.ts` |
| `DispositionFlowCreateSchema` | `DispositionFlow` | `types/userProfile.ts` |
| `ReportTemplateCreateSchema` | `ReportTemplate` | `types/userProfile.ts` |
| `TrendAnalysisResult` (`surveillance/types.ts`) | `TrendAnalysisResult` | `types/surveillance.ts` (60 lines) |
| `Section1RequestSchema` | `processSection1()` params | `lib/api.ts` (inline) |
| `Section1ResponseSchema` | `Section1Response` | `lib/api.ts` (inline) |

### 10.5 Error Handling Contract

Backend error codes map to frontend `ApiError` classifications:

| Backend Error | Code | Status | ApiError Class | Frontend Action |
|--------------|------|--------|---------------|----------------|
| `AuthenticationError` | `UNAUTHORIZED` | 401 | `'auth'` | Redirect to login, clear auth state |
| `AuthorizationError` | `FORBIDDEN` | 403 | `'auth'` | Show upgrade prompt (if `PLAN_REQUIRED`) or access denied |
| `ValidationError` | `VALIDATION_ERROR` | 400 | `'validation'` | Show field-level errors from `details` |
| `QuotaExceededError` | `QUOTA_EXCEEDED` | 402 | `'quota'` | Show quota info from `quotaInfo` (remaining, limit, used) |
| `RateLimitError` | `RATE_LIMITED` | 429 | `'server'` | Show "too many requests" with retry timer |
| `LlmError` | `LLM_ERROR` | 500 | `'server'` | Show "generation failed, try again" |
| `SectionLockedError` | `SECTION_LOCKED` | 400 | `'validation'` | Disable submission button, show lock state |
| Unknown (500) | `INTERNAL_ERROR` | 500 | `'server'` | Generic error message |

### 10.6 Subscription/Payment Integration

**Flow**: Stripe Dashboard → Stripe Extension → Firestore → Frontend reads

The backend does NOT manage subscriptions directly. The flow is:
1. Frontend creates a checkout session (writes to `customers/{uid}/checkout_sessions`)
2. Stripe Extension processes payment → writes to `customers/{uid}/subscriptions`
3. Frontend listens to subscription changes via `onSnapshot`
4. Backend reads subscription tier via `UserService.getUsageStats()` → `requirePlan` middleware

**Tier-to-feature mapping** (enforced by `UserService`):

| Plan | Monthly Quota | Max Tokens/Request | PDF Export | Surveillance |
|------|--------------|-------------------|-----------|-------------|
| Free | 10 | Standard | No | No |
| Pro | 250 | Higher | Yes | Yes |
| Enterprise | 1000 | Highest | Yes | Yes |

### 10.7 Surveillance Integration Flow

```
Frontend (TrendAnalysisContext)
  → POST /v1/surveillance/analyze  (with chiefComplaint, differential, location)
  → Backend: mapToSyndromes → RegionResolver → AdapterRegistry.fetchAll → correlationEngine
  → Response: TrendAnalysisResult { region, rankedFindings, alerts, summary, dataSourceSummaries }
  → Frontend: TrendResultsPanel displays results
  → Optional: POST /v1/surveillance/report → PDF download

Separately (Build Mode Section 1):
  → Backend enrichmentPipeline.enrichForSection1() runs surveillance enrichment
  → Stores surveillanceContext on encounter document
  → At finalize: injectSurveillanceIntoMdm() adds surveillance to dataReviewed
```

### 10.8 Quota Tracking

Backend returns `quotaRemaining` in LLM response payloads:

- `processSection1` returns `quotaRemaining` (from `userService.getUsageStats`)
- `finalize` returns `quotaRemaining`
- `generate` (legacy) returns `remaining`, `used`, `limit`, `plan`
- Quick mode returns `quotaRemaining`

Frontend displays this to the user and may disable submission buttons when quota is exhausted.

---

## 11. Frontend Alignment To-Do List

### 11.1 Auth Token Migration

**Issue**: Build Mode and core endpoints use body-token (`userIdToken` in request body). User CRUD, library, analytics, and surveillance endpoints use Bearer header. The backend's unified auth middleware accepts both, but body-token is deprecated.

**Action items**:
- [ ] Audit frontend API client layer — identify all `body.userIdToken` patterns
- [ ] Migrate body-token endpoints to Bearer header pattern in frontend
- [ ] After migration: remove `bodyToken` fallback from backend `authenticate` middleware
- [ ] Remove `.omit({ userIdToken: true })` schema variants from encounter routes (schemas can drop the field entirely)

**Risk**: Low — backend already supports both. Frontend-only change.

### 11.2 Type Synchronization

**Issue**: Backend Zod schemas and frontend TypeScript interfaces are defined independently. Changes to one require manual updates to the other.

**Action items**:
- [ ] Inventory all shared types: `DifferentialItem`, `CdrAnalysisItem`, `WorkupRecommendation`, `FinalMdm`, `GapItem`, `TestResult`, `CdrTracking`, `EncounterDocument`, `TrendAnalysisResult`
- [ ] Evaluate options: (a) shared `types/` package, (b) Zod-to-TS codegen, (c) OpenAPI spec generation from Zod schemas
- [ ] At minimum: document which backend Zod schemas correspond to which frontend TypeScript interfaces
- [ ] Priority types to sync: `EncounterDocument` (frontend reads this via `onSnapshot`), `Section1ParsedData`, `FinalizeParsedData`

### 11.3 Error Handling Alignment

**Issue**: Backend has a structured error hierarchy (`AppError` subclasses with `code`, `details`, `quotaInfo`). Frontend may not fully classify these for user-facing messages.

**Action items**:
- [ ] Audit frontend error handling: does the API client check `response.code` field?
- [ ] Map all backend `code` values to user-facing messages
- [ ] Handle `PLAN_REQUIRED` detail (show upgrade prompt with `requiredPlan`)
- [ ] Handle `QUOTA_EXCEEDED` detail (show quota info with remaining/limit/used)
- [ ] Handle `SECTION_LOCKED` (disable resubmit, show lock indicator)
- [ ] Handle `retryAfterMs` on rate limit errors (show countdown timer)

### 11.4 Firestore Write Rules Alignment

**Issue**: The backend owns certain writes (encounter updates, finalize), while the frontend creates encounters and updates CDR tracking client-side. Firestore security rules must reflect this boundary.

**Action items**:
- [ ] Verify security rules block client writes to `section3.llmResponse` after `status: 'finalized'`
- [ ] Verify client can create encounter documents but cannot modify `quotaCounted` or `section*.submissionCount`
- [ ] Document which Firestore fields are backend-write-only vs client-writable
- [ ] Test security rules against the actual write patterns from both frontend and backend

### 11.5 Subscription Tier Feature-Flag Consistency

**Issue**: Feature gating happens in multiple places — backend (`requirePlan` middleware), frontend (UI visibility), and Firestore rules. These must agree.

**Action items**:
- [ ] Create a single feature-flag matrix: Feature × Plan → enabled/disabled
- [ ] Verify backend `requirePlan('pro')` matches frontend's conditional rendering
- [ ] Verify `UserService.getUsageStats().features` includes all plan-gated features the frontend checks
- [ ] Specifically verify: surveillance (pro+), PDF export (pro+), analytics (pro+), max tokens per request

### 11.6 API Client Modernization

**Issue**: The frontend's API client may not leverage the backend's full error contract or response consistency.

**Action items**:
- [ ] Consider a typed API client layer that mirrors backend response shapes
- [ ] Add request/response logging in the frontend API client (for debugging, with PHI redaction)
- [ ] Consider response caching for idempotent GET endpoints (libraries)
- [ ] Add retry logic for transient failures (network errors, 503s) on the frontend side

### 11.7 Dual llmResponse Shape Handling

**Issue**: Old encounter documents have `section1.llmResponse` as a flat `DifferentialItem[]`. New ones use `{ differential, cdrAnalysis, workupRecommendations, processedAt }`. Both frontend and backend must handle this.

**Action items**:
- [ ] Verify frontend's `useEncounter` hook uses `getDifferential()` or equivalent normalization
- [ ] Verify frontend handles missing `cdrAnalysis` / `workupRecommendations` fields (old encounters)
- [ ] Consider a one-time Firestore migration to normalize old documents to the new shape

### 11.8 Encounter Photo URL Resolution

**Issue**: Photo URLs can come from Firestore (`photoLibrary` collection with Storage download URLs) or local fallback paths (`/encounter-photos/`). The resolution chain must match between `validatePhoto()` (backend) and `getEncounterPhoto()` / `PhotoLibraryProvider` (frontend).

**Action items**:
- [ ] Verify photo category/subcategory values returned by backend match frontend's photo map keys
- [ ] Verify fallback path construction is consistent
- [ ] Verify `PhotoLibraryProvider` handles missing Firestore entries gracefully

---

*End of Backend Technical Reference Document*
