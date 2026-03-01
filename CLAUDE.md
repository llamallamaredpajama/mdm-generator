# CLAUDE.md - MDM Generator

> Workflow orchestration, skills, and agent strategies are defined in `~/.claude/CLAUDE.md` (global config).

## What This Is

MDM Generator transforms Emergency Medicine physician narratives into compliant, high-complexity Medical Decision Making documentation using an EM-specific "worst-first" approach.

**CRITICAL CONSTRAINTS (Non-Negotiable):**
- **NO PHI EVER** - Protected Health Information must never appear in code, logs, comments, or outputs
- **Educational use only** - No real patient data
- **No long-term medical storage** - Client-side only for content
- **Physician review required** - All outputs need human verification

## Architecture

> For comprehensive implementation rules and patterns, see `_bmad-output/project-context.md`.

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

### Routes
`/` Start | `/compose` Input | `/preflight` PHI check | `/output` MDM display | `/settings` User prefs | `/build` Build Mode

### API Endpoints
| Endpoint | Method | Rate Limit | Purpose |
|----------|--------|------------|---------|
| `/health` | GET | global | Health check |
| `/v1/whoami` | POST | global | Auth validation + user info + usage stats |
| `/v1/admin/set-plan` | POST | global | Admin: set user plan (requires admin claim) |
| `/v1/parse-narrative` | POST | 5/min | Parse narrative → structured fields (UI helper, no quota) |
| `/v1/generate` | POST | 10/min | Legacy one-shot MDM generation |
| `/v1/build-mode/process-section1` | POST | 10/min | Initial eval → worst-first differential |
| `/v1/build-mode/process-section2` | POST | 10/min | Workup & results → MDM preview |
| `/v1/build-mode/finalize` | POST | 10/min | Treatment & disposition → final MDM |
| `/v1/quick-mode/generate` | POST | 10/min | One-shot MDM + patient identifier extraction |
| `/v1/surveillance/analyze` | POST | global | Regional trend analysis |
| `/v1/surveillance/report` | POST | global | PDF trend report download (Pro+ only) |

## Two-Mode Architecture

### Build Mode (`/build`)
3-section progressive workflow with Firestore persistence:
1. **Section 1** (Initial Eval) → generates worst-first differential
2. **Section 2** (Workup & Results) → generates MDM preview
3. **Section 3** (Treatment & Disposition) → generates final MDM

Rules: max 2 submissions per section (then locks), quota counted once per encounter (not per section), section progression enforced server-side.

### Quick Mode
One-shot MDM generation: single narrative → complete MDM + extracted patient identifier (age/sex/chief complaint). Uses separate prompt builder (`promptBuilderQuickMode.ts`).

### Surveillance Enrichment
Regional trend analysis from 3 CDC data sources (respiratory hospital data, NWSS wastewater, NNDSS notifiable diseases). **Non-blocking** — failures must never prevent MDM generation. Surveillance context is stored on the encounter doc during Section 1 and reused at finalize. PDF trend reports require Pro+ plan.

## Deployment
- **Frontend**: Firebase Hosting → https://mdm-generator.web.app
  - `firebase deploy --only hosting --project mdm-generator` (from project root, after building frontend)
- **Backend**: Cloud Run → `mdm-backend` (us-central1)
  - Build: `gcloud builds submit --config /dev/stdin --project mdm-generator . <<'CLOUDBUILD'`
    `steps: [{name: 'gcr.io/cloud-builders/docker', args: ['build','-f','backend/Dockerfile','-t','gcr.io/mdm-generator/mdm-backend:latest','.']}]`
    `images: ['gcr.io/mdm-generator/mdm-backend:latest']`
    `CLOUDBUILD`
  - Deploy: `gcloud run deploy mdm-backend --image gcr.io/mdm-generator/mdm-backend:latest --project mdm-generator --region us-central1`
- **IMPORTANT**: Backend changes in `backend/src/` are NOT live until the Cloud Run container is rebuilt and deployed. `pnpm build` only compiles locally.
- **Do NOT** use Vercel, Netlify, or other hosting CLIs

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
| `docs/mdm-gen-guide.md` | Core prompting logic and MDM template |
| `docs/prd.md` | Product requirements and constraints |
| `backend/src/promptBuilder.ts` | Legacy one-shot prompt construction |
| `backend/src/promptBuilderBuildMode.ts` | Build Mode section prompts (S1/S2/finalize) |
| `backend/src/promptBuilderQuickMode.ts` | Quick Mode one-shot prompt + response parsing |
| `backend/src/parsePromptBuilder.ts` | Narrative → structured fields parsing prompt |
| `backend/src/outputSchema.ts` | Legacy MDM structure validation |
| `backend/src/buildModeSchemas.ts` | Build Mode Zod schemas (requests, responses, Firestore) |

### Key Components
- `frontend/src/components/DictationGuide.tsx` - Inline physician guidance
- `frontend/src/components/Checklist.tsx` - Pre-submission PHI verification
- `frontend/src/routes/Output.tsx` - MDM display with copy functionality
- `frontend/src/routes/BuildMode.tsx` - Build Mode encounter management
- `frontend/src/components/build-mode/desktop/DesktopKanban.tsx` - Desktop encounter layout
- `frontend/src/components/build-mode/mobile/MobileWalletStack.tsx` - Mobile encounter layout
- `frontend/src/components/TrendAnalysisToggle.tsx` - Surveillance enable/disable + location
- `frontend/src/components/TrendResultsPanel.tsx` - Trend analysis results display
- `frontend/src/components/TrendReportModal.tsx` - PDF report download modal
- `frontend/src/contexts/TrendAnalysisContext.tsx` - Surveillance state (persists to localStorage)

## Security Patterns

### API Route Template (6-Step Pattern)
Every backend route MUST follow:
```typescript
router.post('/v1/endpoint', async (req, res) => {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = await admin.auth().verifyIdToken(idToken);

    // 2. VALIDATE request body
    // 3. AUTHORIZE (check subscription/permissions)
    // 4. EXECUTE core operation
    // 5. AUDIT - log metadata only (NEVER log medical content)
    console.log({ userId, timestamp, action }); // OK
    // console.log({ narrative, mdmText }); // NEVER

    // 6. RESPOND
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Internal error' });
  }
});
```

### Error Messages
Never include: stack traces, database queries, medical/PHI content, internal paths

## MDM-Specific Requirements

### Differential Diagnosis
- **Worst-first mentality**: Life-threatening conditions first (EM standard)
- **Problem classification**: Use classes from `docs/mdm-gen-guide.md`
- **Risk stratification tools**: HEART, PERC, Wells, PECARN, etc.

### Output Requirements
- **Copy-pastable** without formatting issues
- All required MDM sections present
- Explicit defaults for missing information
- "Physician must review" disclaimer always included

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
GOOGLE_APPLICATION_CREDENTIALS=
PROJECT_ID=
VERTEX_LOCATION=us-central1
```

### Stripe (`.envrc` via direnv)
```env
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Stripe Integration

Firebase Stripe Extension manages subscriptions via Firestore:
- `customers/{uid}/checkout_sessions` - Payment sessions
- `customers/{uid}/subscriptions` - Active subscriptions
- `products` / `prices` - Synced from Stripe dashboard

**Tiers**: Free (10/mo) | Pro (250/mo) | Enterprise (1000/mo)

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
| Backend services | `backend/src/services/` |
| Surveillance module | `backend/src/surveillance/` (adapters/, cache/) |
| Build Mode components | `frontend/src/components/build-mode/` (desktop/, mobile/, shared/) |
| Frontend contexts | `frontend/src/contexts/` |
| Frontend hooks | `frontend/src/hooks/` |
| Frontend types | `frontend/src/types/` |
| Documentation | `docs/` |
| Scripts | `scripts/` |

## Common Tasks

| Task | Action |
|------|--------|
| Add route | Create in `frontend/src/routes/`, add to `App.tsx` router |
| Modify MDM output | Update `outputSchema.ts` → `promptBuilder.ts` → `Output.tsx` |
| Change prompting | Edit `docs/mdm-gen-guide.md` **→ also update `docs/generator_engine.md`** to reflect any changes to medical logic, template structure, or generation rules |
| Add Build Mode section | Schema in `buildModeSchemas.ts` → prompt in `promptBuilderBuildMode.ts` → endpoint in `index.ts` → UI in `components/build-mode/` |
| Modify surveillance | Adapter in `surveillance/adapters/` → correlation in `correlationEngine.ts` → prompt augmenter → PDF generator |
| Add Quick Mode feature | `promptBuilderQuickMode.ts` → endpoint in `index.ts` → `useQuickEncounter.ts` hook |

## iOS Simulator Testing

Prefix all `xcrun simctl` commands with `DEVELOPER_DIR` (avoids needing `sudo xcode-select -s`):

```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
```

Simulator: iPhone 16 Plus (iOS 26.0), UDID: `A9AE64DD-14FF-44CB-BFF4-080457DE8B3B`

```bash
# Navigate to dev server in simulator Safari
xcrun simctl openurl booted "http://localhost:5173"

# Take screenshot (Claude can read the resulting PNG)
xcrun simctl io booted screenshot /tmp/sim-screenshot.png

# Dark/light mode
xcrun simctl ui booted appearance dark

# Clean status bar for screenshots
xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100
```

Screenshots are 3x Retina. If using AXe for tap interactions, divide pixel coordinates by 3 for point coordinates.

## Worktree Awareness

This project uses git worktrees under `.claude/worktrees/`. When operating in a worktree:
- The working directory is the worktree root (e.g., `.claude/worktrees/SwiftUI/`)
- All relative paths (`_bmad/`, `.bmad-core/`, `docs/`) resolve from the worktree root
- `{project-root}` in BMAD files means the current working directory, NOT the main worktree
- If BMAD files are missing, the worktree branch likely needs to be rebased onto `main`

## Important Reminders

1. **Medical tool** - Accuracy and safety are paramount
2. **NO PHI** - This is non-negotiable, check every diff
3. **Educational only** - Always display appropriate disclaimers
4. **Physician review** - Never suggest automated clinical decisions
5. **EM-specific** - Maintain worst-first differential approach
