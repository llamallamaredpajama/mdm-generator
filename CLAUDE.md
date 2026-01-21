# CLAUDE.md - MDM Generator

> For workflow patterns, tool selection, parallelization, git safety, and MCP server guidance, see `~/.claude/` (SuperClaude framework).

## What This Is

MDM Generator transforms Emergency Medicine physician narratives into compliant, high-complexity Medical Decision Making documentation using an EM-specific "worst-first" approach.

**CRITICAL CONSTRAINTS (Non-Negotiable):**
- **NO PHI EVER** - Protected Health Information must never appear in code, logs, comments, or outputs
- **Educational use only** - No real patient data
- **No long-term medical storage** - Client-side only for content
- **Physician review required** - All outputs need human verification

## Architecture

```
/frontend          React 19 + Vite + TypeScript + Firebase Auth
/backend           Express + TypeScript + Vertex AI (Gemini) + Firebase Admin
```

| Layer | Stack | Purpose |
|-------|-------|---------|
| Frontend | React 19, Vite, React Router | UI with client-side-only medical content |
| Backend | Express, Vertex AI Gemini | Auth validation, LLM calls, structured MDM |
| Auth | Firebase Auth (Google) | User authentication |
| Payments | Firebase Stripe Extension | Subscription management |

### Routes
`/` Start | `/compose` Input | `/preflight` PHI check | `/output` MDM display | `/settings` User prefs

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/healthz` | GET | Health check |
| `/v1/whoami` | POST | Auth validation + user info |
| `/v1/generate` | POST | Generate MDM from narrative |

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
| `backend/src/promptBuilder.ts` | LLM prompt construction |
| `backend/src/outputSchema.ts` | MDM structure validation |

### Key Components
- `frontend/src/components/DictationGuide.tsx` - Inline physician guidance
- `frontend/src/components/Checklist.tsx` - Pre-submission PHI verification
- `frontend/src/routes/Output.tsx` - MDM display with copy functionality

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
| Documentation | `docs/` |
| Scripts | `scripts/` |

## Common Tasks

| Task | Action |
|------|--------|
| Add route | Create in `frontend/src/routes/`, add to router |
| Modify MDM output | Update `outputSchema.ts` → `promptBuilder.ts` → `Output.tsx` |
| Change prompting | Edit `docs/mdm-gen-guide.md` |

## Important Reminders

1. **Medical tool** - Accuracy and safety are paramount
2. **NO PHI** - This is non-negotiable, check every diff
3. **Educational only** - Always display appropriate disclaimers
4. **Physician review** - Never suggest automated clinical decisions
5. **EM-specific** - Maintain worst-first differential approach
