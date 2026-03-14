# CLAUDE.md - aiMDM

> Workflow orchestration, skills, and agent strategies are defined in `~/.claude/CLAUDE.md` (global config).

## What This Is

aiMDM transforms Emergency Medicine physician narratives into compliant, high-complexity Medical Decision Making documentation using an EM-specific "worst-first" approach.

**CRITICAL CONSTRAINTS (Non-Negotiable):**
- **NO PHI EVER** - Protected Health Information must never appear in code, logs, comments, or outputs
- **Educational use only** - No real patient data
- **No long-term medical storage** - Client-side only for content
- **Physician review required** - All outputs need human verification

## Architecture

> For additional implementation patterns (component hierarchy, Firestore write details, testing mocks), see `_bmad-output/project-context.md`.

```
/frontend          React 19 + Vite 7 + TypeScript + Firebase Auth
/backend           Express + TypeScript + Vertex AI (Gemini) + Firebase Admin + Zod
```

| Layer | Stack | Purpose |
|-------|-------|---------|
| Frontend | React 19, Vite 7, React Router | UI with client-side-only medical content |
| Backend | Express, Vertex AI Gemini, Zod | Auth, LLM calls, structured MDM |
| Auth | Firebase Auth (Google) | User authentication |
| Payments | Firebase Stripe Extension | Subscription management |
| Surveillance | 3 CDC adapters, PDFKit, Chart.js | Regional trend analysis + PDF reports |

### Backend Infrastructure (P0 Foundation)

Centralized config, logging, errors, and middleware added in `2931353`. All route handlers use the middleware stack (auth, validation, error handling, request logging).

| Module | File | Purpose |
|--------|------|---------|
| Config | `backend/src/config.ts` | Zod-validated config with defaults (port, LLM params, rate limits) |
| Logger | `backend/src/logger.ts` | Pino structured logging with **PHI redaction** (redacts `narrative`, `mdmText`, `content.*`) |
| Errors | `backend/src/errors.ts` | Typed hierarchy: `AppError` → `AuthenticationError`, `ValidationError`, `QuotaExceededError`, `RateLimitError`, `LlmError`, `SectionLockedError` |
| Auth MW | `backend/src/middleware/auth.ts` | Firebase token verification (Bearer header + body `userIdToken` fallback) |
| Error MW | `backend/src/middleware/errorHandler.ts` | Centralized error → JSON response formatting |
| Rate Limit | `backend/src/middleware/rateLimiter.ts` | Configurable rate limiter factory |
| Request Log | `backend/src/middleware/requestLogger.ts` | Request ID + Cloud Trace correlation + child logger on `req.log` |
| Validate | `backend/src/middleware/validate.ts` | Zod schema validation middleware |

**Firebase Admin init priority**: `GOOGLE_APPLICATION_CREDENTIALS_JSON` (parsed JSON) → `GOOGLE_APPLICATION_CREDENTIALS` (file path) → default credentials (Cloud Run SA).

### Backend Modular Architecture

Post-refactoring, route handlers live in domain modules under `backend/src/modules/`:

| Module | Path | Purpose |
|--------|------|---------|
| `admin/` | `/v1/admin/*` | Plan management (requires admin claim) |
| `analytics/` | `/v1/analytics/*` | Gap analytics insights (LLM-powered) |
| `encounter/` | `/v1/build-mode/*` | Build Mode S1/S2/finalize orchestration |
| `library/` | `/v1/library/*` | CDR + test catalog endpoints |
| `narrative/` | `/v1/parse-narrative` | Narrative → structured fields parsing |
| `quick-mode/` | `/v1/quick-mode/*` | One-shot MDM generation |
| `user/` | `/v1/whoami`, `/v1/user/*` | Auth validation, profile CRUD |

Each module has `controller.ts` (handlers), `routes.ts` (Express router), and optionally `schemas.ts` (Zod validation). App assembly in `app.ts`, entry point in `index.ts`, DI in `dependencies.ts`.

### Frontend Routes
`/` Landing | `/onboarding` Onboarding | `/compose` EncounterBoard | `/preflight` PHI check | `/output` MDM display | `/settings` User prefs | `/analytics` Gap analytics | `/build` → redirects to `/compose`

### API Endpoints
| Endpoint | Method | Rate Limit | Purpose |
|----------|--------|------------|---------|
| `/health` | GET | none | Legacy health check |
| `/health/live` | GET | none | K8s/Cloud Run liveness probe |
| `/health/ready` | GET | none | K8s/Cloud Run readiness probe (checks Firestore) |
| `/v1/whoami` | POST | global | Auth validation + user info + usage stats |
| `/v1/admin/set-plan` | POST | global | Admin: set user plan (requires admin claim) |
| `/v1/parse-narrative` | POST | 5/min | Parse narrative → structured fields (UI helper, no quota) |
| `/v1/generate` | POST | 10/min | Legacy one-shot MDM generation |
| `/v1/build-mode/process-section1` | POST | 10/min | Initial eval → worst-first differential |
| `/v1/build-mode/process-section2` | POST | 10/min | Workup & results → persist structured data (no LLM) |
| `/v1/build-mode/finalize` | POST | 10/min | Treatment & disposition → final MDM |
| `/v1/quick-mode/generate` | POST | 10/min | One-shot MDM + patient identifier extraction |
| `/v1/surveillance/analyze` | POST | global | Regional trend analysis |
| `/v1/surveillance/report` | POST | global | PDF trend report download (Pro+ only) |

## Two-Mode Architecture

### Build Mode (via EncounterBoard at `/compose`)
3-section progressive workflow with Firestore persistence:
1. **Section 1** (Initial Eval) → generates worst-first differential
2. **Section 2** (Workup & Results) → stores structured test/diagnosis data
3. **Section 3** (Treatment & Disposition) → generates final MDM

Rules: max 2 submissions per section (then locks), quota counted once per encounter (not per section), section progression enforced server-side.

### Quick Mode
One-shot MDM generation: single narrative → complete MDM + extracted patient identifier (age/sex/chief complaint). Uses separate prompt builder (`promptBuilderQuickMode.ts`).

### Surveillance Enrichment
Regional trend analysis from 3 CDC data sources (respiratory hospital data, NWSS wastewater, NNDSS notifiable diseases). **Non-blocking** — failures must never prevent MDM generation. Surveillance context is stored on the encounter doc during Section 1 and reused at finalize. PDF trend reports require Pro+ plan.

## Deployment
- **Frontend**: Firebase Hosting → https://aimdm.app (custom domain), https://mdm-generator.web.app (default)
  - `firebase deploy --only hosting --project mdm-generator` (from project root, after building frontend)
- **Backend**: Cloud Run → `mdm-backend` (us-central1)
  - One command: `bash scripts/deploy-backend.sh` (or `cd backend && pnpm deploy`)
  - Runs pre-deploy gates (build + test), Cloud Build, and Cloud Run deploy
  - Build config: `cloudbuild.yaml` (version-controlled)
- **IMPORTANT**: Backend changes in `backend/src/` are NOT live until the Cloud Run container is rebuilt and deployed. `pnpm build` only compiles locally.
- **Cloud Build context**: `.gcloudignore` excludes `frontend/`, `docs/`, `scripts/`, etc. — only `backend/` is uploaded (~5-10 MB). Prompt guides live in `backend/prompts/` (inside the Docker context).
- **Do NOT** use Vercel, Netlify, or other hosting CLIs

### Decoupled Assets
| Asset | Location | Seeded By |
|-------|----------|-----------|
| Prompt guides | `backend/prompts/*.md` (copied from `docs/`) | Committed to repo, inside Docker context |
| Encounter photos | Firebase Storage `encounter-photos/` + Firestore `photoLibrary` collection | `scripts/seed-photo-library.ts` |

**Photo catalog architecture**: Backend loads `photoLibrary` Firestore collection at startup via `initPhotoCatalog()` → in-memory cache → `buildPhotoCatalogPrompt()` / `validatePhoto()` remain synchronous. Hardcoded `PHOTO_CATALOG` serves as fallback if Firestore read fails.

**Frontend photo URLs**: `PhotoLibraryProvider` (in `App.tsx`) fetches `photoLibrary` docs once, builds a `Map<string, string>` of `"category/subcategory"` → `downloadUrl`. `getEncounterPhoto()` checks this map before falling back to local `/encounter-photos/` paths.

**Seed script**: `cd backend && NODE_PATH=./node_modules npx tsx ../scripts/seed-photo-library.ts` — uploads PNGs from `frontend/public/encounter-photos/` to Storage, writes metadata + download URLs to `photoLibrary` collection.

## Firebase Auth (Google Sign-In)

- **`signInWithPopup` only** -- no redirect fallback (cross-origin cookie issues)
- **`redirect_uri_mismatch` errors**: Check OAuth redirect URIs in [GCP Console](https://console.cloud.google.com/apis/credentials?project=mdm-generator) first -- do NOT add COOP headers or workarounds (5-min propagation delay on URI changes)
- **Auth domain**: `mdm-generator.web.app` (set in `frontend/.env.production`)
- **Authorized domains**: `localhost`, `127.0.0.1`, `mdm-generator.firebaseapp.com`, `mdm-generator.web.app`, `aimdm.app` — manageable via Identity Toolkit API (see GCP / Firebase Programmatic Admin)

### Dev-Mode Auth Bypass (cmux / Embedded Browsers)

Google OAuth `signInWithPopup` **does not work** in the cmux embedded browser (popups are blocked). To view auth-gated routes during dev:

1. Navigate to any route with `?dev-auth=1` query param: `http://localhost:5173/onboarding?dev-auth=1`
2. A mock `User` object is injected into `AuthProvider` — route guards pass, UI renders normally
3. `onboardingCompleted` defaults to `false` so onboarding routes are accessible

**Implementation**: `frontend/src/lib/firebase.tsx` — `DEV_MOCK_USER` constant, evaluated at module load. Gated behind `import.meta.env.DEV` so it's **tree-shaken out of production builds**.

**Limitations**: Backend calls that verify the ID token will fail (mock token is `'dev-mock-token'`). Use for UI development only. For full e2e testing, sign in via a real browser.

**When setting up cmux browser splits**: Always append `?dev-auth=1` to localhost URLs for auth-gated routes:
```bash
cmux browser open-split 'http://localhost:5173/onboarding?dev-auth=1'
```

## GCP / Firebase Programmatic Admin

**Claude has full access to Firebase MCP tools, `gcloud`/`firebase` CLIs, and GCP REST APIs.** Default stance: execute programmatically first. Never tell the user to do something in the console without first verifying no API/CLI/MCP tool exists.

### Tool Priority Chain
1. **Firebase MCP tools** — cleanest for data/config operations (no auth token management needed)
2. **CLI** (`firebase`, `gcloud`) — for deployments and infrastructure MCP doesn't cover
3. **GCP REST APIs** (via `gcloud auth print-access-token` + `curl`) — for gaps where neither MCP nor CLI has a command
4. **GCP Console** (browser) — absolute last resort, only when no programmatic API exists

### Firebase MCP Plugin — Available Tools
| Domain | Tools | Use For |
|--------|-------|---------|
| Firestore | `firestore_get/add/update/delete_document`, `list_documents`, `list_collections` | All Firestore CRUD — prefer over REST |
| Auth Users | `auth_get_users`, `auth_update_user` | User lookup, custom claims, disable/enable |
| Security Rules | `firebase_get_security_rules`, `firebase_validate_security_rules` | Read and validate Firestore/Storage/RTDB rules |
| Project/Apps | `firebase_get_project`, `firebase_list_apps`, `firebase_get_sdk_config` | Project info, app config |
| RTDB | `realtimedatabase_get/set_data` | Realtime Database reads/writes |
| Storage | `storage_get_object_download_url` | Get download URLs |
| Messaging | `messaging_send_message` | Send push notifications |
| Remote Config | `remoteconfig_get/update_template` | Read/update remote config |
| Functions | `functions_list_functions`, `functions_get_logs` | List deployed functions, read logs |
| Knowledge | `developerknowledge_search/get_documents` | Firebase documentation search |

### CLI / REST API — For Operations MCP Doesn't Cover
| Operation | Method |
|-----------|--------|
| Firebase Auth authorized domains | Identity Toolkit REST API (see pattern below) |
| Firebase Auth config (read/update) | Identity Toolkit REST API |
| Cloud Build (Docker images) | `gcloud builds submit` |
| Cloud Run deploy/config | `gcloud run deploy`, `gcloud run services update` |
| Firebase Hosting deploy | `firebase deploy --only hosting` |

### REST API Auth Pattern
```bash
ACCESS_TOKEN=$(gcloud auth print-access-token)
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "x-goog-user-project: mdm-generator" \
     "https://identitytoolkit.googleapis.com/admin/v2/projects/mdm-generator/config"
```

### Console-Only Operations (no stable API)
- GCP OAuth 2.0 client JavaScript origins / redirect URIs — [GCP Credentials Console](https://console.cloud.google.com/apis/credentials?project=mdm-generator) only

### Decision Framework
| Confidence | Action |
|------------|--------|
| >90%, minor change | Do it, inform the user what you did |
| <90% or major/destructive | Ask for approval, but state: "I can do this programmatically with your go-ahead" |
| Console-only operation | Ask user, explain why it requires the console |

**NEVER say "you need to do this manually" without first verifying no MCP tool, CLI command, or REST API exists.**

## Commands

```bash
# Frontend
cd frontend && pnpm dev          # Dev server :5173
cd frontend && pnpm check        # typecheck + lint + test (REQUIRED before commits)
cd frontend && pnpm build        # Production build

# Backend
cd backend && pnpm dev           # Dev server :8080
cd backend && pnpm build         # TypeScript compilation (REQUIRED before commits)
```

## Critical Files

### Medical Logic (Read Before Modifying MDM Behavior)
| File | Purpose |
|------|---------|
| `backend/prompts/mdm-gen-guide-v2.md` | Core prompting logic and MDM template (v2) |
| `backend/prompts/mdm-gen-guide-build-s1.md` | Build Mode Section 1 prompt guide |
| `backend/prompts/mdm-gen-guide-build-s3.md` | Build Mode Section 3 / finalize prompt guide |
| `docs/generator_engine.md` | Generator engine documentation |
| `docs/prd.md` | Product requirements and constraints |
| `backend/src/promptBuilder.ts` | Legacy one-shot prompt construction |
| `backend/src/promptBuilderBuildMode.ts` | Build Mode section prompts (S1/S2/finalize) |
| `backend/src/promptBuilderQuickMode.ts` | Quick Mode one-shot prompt + response parsing |
| `backend/src/parsePromptBuilder.ts` | Narrative → structured fields parsing prompt |
| `backend/src/outputSchema.ts` | Legacy MDM structure validation |
| `backend/src/buildModeSchemas.ts` | Build Mode Zod schemas (requests, responses, Firestore) |
| `backend/src/promptBuilderAnalytics.ts` | Gap analytics insights prompt construction |
| `backend/src/llm/vertexProvider.ts` | LLM interface (model config, temperature, safety) |

### Key Components
- `frontend/src/components/board/EncounterBoard.tsx` - Main compose view (kanban board + detail panel)
- `frontend/src/components/board/BoardCard.tsx` - Encounter card in status columns
- `frontend/src/components/board/DetailPanel.tsx` - Encounter detail/editing panel
- `frontend/src/components/board/StatusColumn.tsx` - Kanban column (draft/in-progress/finalized)
- `frontend/src/components/DictationGuide.tsx` - Inline physician guidance
- `frontend/src/components/Checklist.tsx` - Pre-submission PHI verification
- `frontend/src/routes/Output.tsx` - MDM display with copy functionality
- `frontend/src/routes/Analytics.tsx` - Gap analytics dashboard
- `frontend/src/components/build-mode/SectionPanel.tsx` - Build Mode section editor
- `frontend/src/components/build-mode/EncounterEditor.tsx` - Full encounter editing view
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` - Differential + results display
- `frontend/src/contexts/PhotoLibraryContext.tsx` - Photo URL provider (Firestore → Storage URLs)
- `frontend/src/hooks/usePhotoLibrary.ts` - One-time photo library fetch from Firestore
- `frontend/src/lib/photoMapper.ts` - Encounter photo resolver (Storage URL → local fallback)
- `frontend/src/components/TrendAnalysisToggle.tsx` - Surveillance enable/disable + location
- `frontend/src/components/TrendResultsPanel.tsx` - Trend analysis results display
- `frontend/src/components/TrendReportModal.tsx` - PDF report download modal
- `frontend/src/contexts/TrendAnalysisContext.tsx` - Surveillance state (persists to localStorage)

### Structured Data Pipeline
| File | Purpose |
|------|---------|
| `backend/src/services/cdrMatcher.ts` | Maps clinical scenarios to applicable CDRs |
| `backend/src/services/cdrCatalogFormatter.ts` | CDR catalog formatting for prompt injection |
| `backend/src/services/cdrCatalogSearch.ts` | Embedding-based CDR similarity search |
| `backend/src/services/cdrTrackingBuilder.ts` | Builds CDR tracking context for prompts |
| `backend/src/services/testCatalogFormatter.ts` | Test catalog formatting for prompt injection |
| `backend/src/services/testCatalogSearch.ts` | Embedding-based test similarity search |
| `backend/src/services/embeddingService.ts` | Vertex AI text embedding generation |
| `backend/src/services/userService.ts` | User profile + quota management |

## Security Patterns

### API Route Pattern (6-Step)
Every route handler follows: **1. Authenticate** → **2. Validate** (Zod middleware) → **3. Authorize** (subscription check) → **4. Execute** → **5. Audit** (metadata only, NEVER medical content) → **6. Respond**

Post-refactoring, steps 1-2 are handled by shared middleware in the module's `routes.ts`. Controllers focus on steps 3-6.

### Error Messages
Never include: stack traces, database queries, medical/PHI content, internal paths

## Custom Agents & Hooks

### Review Agents (`.claude/agents/`)
| Agent | Trigger Files | Purpose |
|-------|--------------|---------|
| `security-reviewer` | Backend routes, Firestore rules, auth/payment code | 6-step auth pattern, logging safety, error response safety, rate limiting |
| `prompt-reviewer` | Prompt builders, schemas, CDR/test services, medical docs | Worst-first ordering, forbidden patterns, schema-prompt alignment |

PostToolUse hooks in `.claude/hooks/` surface reminders to run these agents when trigger files are edited. Non-blocking (always exit 0).

## MDM-Specific Requirements

### Differential Diagnosis
- **Worst-first mentality**: Life-threatening conditions first (EM standard)
- **Problem classification**: Use classes from `docs/mdm-gen-guide-v2.md`
- **Risk stratification tools**: HEART, PERC, Wells, PECARN, etc.

### Output Requirements
- **Copy-pastable** without formatting issues
- All required MDM sections present
- Explicit defaults for missing information
- Physician attestation statement always included in MDM output

### CDR Library Accuracy (Non-Negotiable)
- **100% accuracy or exclusion** — every CDR component's point value must match the original published source
- **Never guess scoring values** — if unsure, web search the original paper. If still unclear, quarantine the CDR
- **Quarantine over inaccuracy** — CDRs that cannot be verified go to `scripts/cdr-configs/_quarantine/` for manual review
- **This is a medical application with life/death consequences** — a miscalculated CDR is worse than no CDR
- **Web search verification required** for any new CDR or scoring modification not already documented in the codebase
- **Minimum 3 user-answerable components** — each CDR must have >= 3 components with `(type === 'boolean' || type === 'select') && (source === 'section1' || source === 'user_input')`

## Implementation Conventions

> Full details (component hierarchy, Firestore write patterns, testing mocks): `_bmad-output/project-context.md`

### CSS / Styling
- **BEM naming**: `.component-name`, `.component-name__element`, `.component-name--modifier`
- **CSS variables always have fallbacks**: `var(--color-surface, #f8fafc)` -- theme may not be loaded
- **Urgency colors are hardcoded** (clinical meaning): `#dc2626` emergent, `#d97706` urgent, `#16a34a` routine
- **Responsive**: `useIsMobile()` hook in `useMediaQuery.ts` (767px breakpoint), conditional CSS class not inline styles

### Data Shape Backward Compatibility
- **S1 `llmResponse` has dual shape**: Old = flat `DifferentialItem[]`, new = `{ differential, processedAt }`. Use `getDifferential()` extraction helper.
- **New fields must be optional**: Add `?` in interface + `?? defaultValue` in `useEncounter.ts` onSnapshot handler.
- **`workingDiagnosis` is a union**: `string | WorkingDiagnosis` (legacy string vs structured object).

### Build Mode Auth Quirk
Build Mode endpoints pass `userIdToken` **in the request body**, not as a Bearer header. User profile CRUD endpoints use Bearer header.

### Anti-Patterns
| Rule | Why |
|------|-----|
| No PHI in logs | `{ userId, action }` OK. `{ narrative }` NEVER. |
| No `z.any()` in new schemas | Legacy `MdmPreviewSchema` uses it; new schemas must use explicit types |
| No modifying frozen request/response schemas | `Section1Request`, `Section2Request`, `FinalizeRequest` frozen until BM-8.1 |
| No deleting deprecated components | Mark `@deprecated`, keep file. Delete in cleanup pass only |
| No client writes for S3 finalize | Backend owns finalize write. Client blocked by rules after `status: 'finalized'` |
| Always handle both `llmResponse` shapes | Flat array (old) + wrapped object (new). Use `getDifferential()` |

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_API_BASE_URL=http://localhost:8080
```

### Backend (`backend/.env`)
```env
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=        # Path to service account JSON file (local dev)
GOOGLE_APPLICATION_CREDENTIALS_JSON=   # Raw JSON string (Cloud Run — set via Secret Manager)
PROJECT_ID=
VERTEX_LOCATION=us-central1
```

## Stripe Integration

Firebase Stripe Extension manages subscriptions via Firestore:
- `customers/{uid}/checkout_sessions` - Payment sessions
- `customers/{uid}/subscriptions` - Active subscriptions
- `products` / `prices` - Synced from Stripe dashboard

**Tiers**: Free (10/mo) | Pro (250/mo) | Enterprise (1000/mo)

**Config**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.envrc` (via direnv, gitignored).

## Project-Specific Quality Gates

### Pre-Commit Checklist
- [ ] `cd frontend && pnpm check` passes
- [ ] `cd backend && pnpm build` passes
- [ ] `git diff` reviewed - **NO PHI in any changes**
- [ ] No medical content in logs or console statements

### PHI Detection Keywords
If `git diff` shows any of these, STOP and review:
`patient`, `ssn`, `dob`, `mrn`, `name`, `address`, `phone`, specific ages, dates of birth

## File Organization

| Type | Location |
|------|----------|
| Frontend tests | `frontend/src/__tests__/` |
| Test fixtures | `frontend/src/__fixtures__/` |
| Backend infrastructure | `backend/src/config.ts`, `logger.ts`, `errors.ts`, `app.ts`, `dependencies.ts` |
| Backend modules | `backend/src/modules/` (admin/, analytics/, encounter/, library/, narrative/, quick-mode/, user/) |
| Backend middleware | `backend/src/middleware/` |
| Backend services | `backend/src/services/` |
| Backend data layer | `backend/src/data/` (cache.ts, repositories/) |
| Surveillance module | `backend/src/surveillance/` (adapters/, cache/) |
| Encounter board | `frontend/src/components/board/` (EncounterBoard, BoardCard, DetailPanel, StatusColumn) |
| Build Mode components | `frontend/src/components/build-mode/` (shared/) |
| Onboarding flow | `frontend/src/components/onboarding/` |
| Analytics components | `frontend/src/components/analytics/` |
| Frontend contexts | `frontend/src/contexts/` |
| Frontend hooks | `frontend/src/hooks/` |
| Frontend types | `frontend/src/types/` |
| Documentation | `docs/` |
| Prompt guides (deploy) | `backend/prompts/` (inside Docker context) |
| Scripts | `scripts/` |

## Common Tasks

| Task | Action |
|------|--------|
| Add route | Create in `frontend/src/routes/`, add to `App.tsx` router |
| Modify MDM output | Update `outputSchema.ts` → `promptBuilder.ts` → `Output.tsx` |
| Change prompting | Edit prompt guide in `backend/prompts/` (and mirror to `docs/` for reference) **→ also update `docs/generator_engine.md`** |
| Add Build Mode section | Schema in `buildModeSchemas.ts` → prompt in `promptBuilderBuildMode.ts` → controller in `modules/encounter/` → UI in `components/build-mode/` |
| Add backend endpoint | Create/update module in `modules/{domain}/` (controller + routes + schemas) → register in `app.ts` |
| Modify surveillance | Adapter in `surveillance/adapters/` → correlation in `correlationEngine.ts` → prompt augmenter → PDF generator |
| Add Quick Mode feature | `promptBuilderQuickMode.ts` → controller in `modules/quick-mode/` → `useQuickEncounter.ts` hook |

## Worktree Awareness

This project uses git worktrees under `.claude/worktrees/`. When operating in a worktree:
- The working directory is the worktree root (e.g., `.claude/worktrees/SwiftUI/`)
- All relative paths (`_bmad/`, `.bmad-core/`, `docs/`) resolve from the worktree root
- `{project-root}` in BMAD files means the current working directory, NOT the main worktree
- If BMAD files are missing, the worktree branch likely needs to be rebased onto `main`

## Important Reminders

1. **Medical tool** - Accuracy and safety are paramount
2. **NO PHI** - This is non-negotiable, check every diff
3. **Educational only** - Always display appropriate attestation notices
4. **Physician review** - Never suggest automated clinical decisions
5. **EM-specific** - Maintain worst-first differential approach
