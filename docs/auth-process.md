# Auth Process Documentation — aiMDM

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 7 + TypeScript | SPA with client-side medical content |
| Backend | Express + TypeScript | API server, LLM orchestration |
| Auth | Firebase Auth (Google OAuth) | User identity via `signInWithPopup` |
| Token Format | Firebase ID Token (JWT) | Signed by Google, verified by Admin SDK |
| Backend Auth | Firebase Admin SDK | `verifyIdToken()` on every request |
| LLM | Vertex AI (Gemini 2.5 Pro) | MDM generation |
| Payments | Firebase Stripe Extension | Subscription tiers (Free/Pro/Enterprise) |
| Hosting | Firebase Hosting (frontend) + Cloud Run (backend) | Production deployment |
| Database | Firestore | Encounters, user profiles, subscriptions |

## Auth Flow — End to End

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

  USER                    FRONTEND                 GOOGLE               BACKEND
   │                    (React SPA)              (OAuth 2.0)          (Express)
   │                        │                        │                    │
   │  1. Click "Sign In"    │                        │                    │
   │───────────────────────>│                        │                    │
   │                        │                        │                    │
   │                        │  2. signInWithPopup()  │                    │
   │                        │───────────────────────>│                    │
   │                        │                        │                    │
   │                    3. Google OAuth popup opens   │                    │
   │<────────────────────────────────────────────────│                    │
   │                        │                        │                    │
   │  4. User authenticates │                        │                    │
   │────────────────────────────────────────────────>│                    │
   │                        │                        │                    │
   │                        │  5. AuthCredential +   │                    │
   │                        │     User object        │                    │
   │                        │<───────────────────────│                    │
   │                        │                        │                    │
   │                        │  6. user.getIdToken()  │                    │
   │                        │     → Firebase JWT     │                    │
   │                        │                        │                    │
   │                        │  7. POST /v1/whoami ───────────────────────>│
   │                        │     body: {userIdToken}│                    │
   │                        │                        │       8. admin     │
   │                        │                        │       .auth()      │
   │                        │                        │       .verifyId    │
   │                        │                        │        Token(jwt)  │
   │                        │                        │                    │
   │                        │  9. { ok, uid, onboardingCompleted, ... } <─│
   │                        │<───────────────────────────────────────────│
   │                        │                        │                    │
   │                        │ 10. AuthProvider sets:  │                    │
   │                        │   user = Firebase User  │                    │
   │                        │   authLoading = false    │                    │
   │                        │   onboardingCompleted    │                    │
   │                        │                        │                    │
   │ 11. Route guards eval  │                        │                    │
   │<───────────────────────│                        │                    │
   │  (redirect or render)  │                        │                    │
```

### Step-by-step breakdown

1. **User clicks "Sign In"** on the landing page (`AuthModal.tsx`), which includes a Google consent attestation checkbox.
2. **`signInWithPopup()`** opens a Google OAuth popup. No redirect fallback is used due to cross-origin cookie issues.
3. **Google OAuth popup** presents the standard Google account chooser/consent screen.
4. **User authenticates** with their Google account.
5. **Firebase SDK receives** an `AuthCredential` containing the authenticated `User` object.
6. **`user.getIdToken()`** returns a Firebase ID Token (JWT) signed by Google.
7. **Frontend calls `POST /v1/whoami`** with the token in the request body (`{ userIdToken }`).
8. **Backend verifies** the JWT using `admin.auth().verifyIdToken(jwt)` from the Firebase Admin SDK.
9. **Backend returns** user info including `uid`, `onboardingCompleted` status, display name, and usage stats.
10. **`AuthProvider`** updates React context: sets `user`, clears `authLoading`, stores `onboardingCompleted`.
11. **Route guards** (`OnboardingGuard`) evaluate and either redirect or render protected content.

## Two Token-Passing Patterns

The backend has **two** authentication patterns for incoming requests:

```
┌─────────────────────────────────────────────────────────────────────┐
│                   TOKEN PASSING PATTERNS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PATTERN A: Bearer Header           PATTERN B: Body Token           │
│  (User profile CRUD endpoints)      (Build Mode, legacy, whoami)    │
│                                                                     │
│  ┌──────────────────────┐           ┌──────────────────────┐        │
│  │ Authorization:       │           │ {                    │        │
│  │   Bearer <jwt>       │           │   "userIdToken":     │        │
│  │                      │           │     "<jwt>",         │        │
│  │ Body: { data... }    │           │   "encounterId":     │        │
│  └──────────────────────┘           │     "abc123",        │        │
│                                     │   "content": "..."   │        │
│  Endpoints:                         │ }                    │        │
│  • /v1/user/complete-onboarding     └──────────────────────┘        │
│  • /v1/user/order-sets                                              │
│  • /v1/user/dispo-flows             Endpoints:                      │
│  • /v1/user/report-templates        • /v1/whoami                    │
│  • /v1/admin/set-plan               • /v1/parse-narrative           │
│                                     • /v1/generate                  │
│                                     • /v1/build-mode/*              │
│                                     • /v1/quick-mode/generate       │
│                                     • /v1/surveillance/*            │
└─────────────────────────────────────────────────────────────────────┘
```

Both patterns call `admin.auth().verifyIdToken(token)` to validate the JWT and extract `uid`.

## Route Protection (Frontend)

```
  Request to /compose, /build, /settings, etc.
       │
       ▼
  ┌──────────────────┐
  │  authLoading?     │──── true ───> Render nothing (wait)
  └──────────────────┘
       │ false
       ▼
  ┌──────────────────┐
  │  user exists?     │──── no ────> Redirect to / (landing)
  └──────────────────┘
       │ yes
       ▼
  ┌──────────────────────────┐
  │ onboardingCompleted?      │── null ──> Render nothing (loading)
  └──────────────────────────┘
       │
       ├── false ──> Redirect to /onboarding
       │
       └── true ───> Render <Outlet /> (protected route)
```

Implemented in `frontend/src/components/OnboardingGuard.tsx`.

## Firebase Admin SDK Initialization (Backend)

The backend uses a 3-tier credential fallback when initializing Firebase Admin:

```
  Backend starts (index.ts)
       │
       ▼
  ┌───────────────────────────────────────┐
  │ GOOGLE_APPLICATION_CREDENTIALS_JSON   │
  │ env var set?                          │
  └───────────────────────────────────────┘
       │                    │
      yes                  no
       │                    ▼
       │         ┌──────────────────────────────┐
       │         │ GOOGLE_APPLICATION_CREDENTIALS│
       │         │ points to .json file?         │
       │         └──────────────────────────────┘
       │              │                │
       │             yes              no
       │              │                │
       ▼              ▼                ▼
  Parse JSON     Read file &     admin.initializeApp()
  from env var   parse JSON      (Application Default
       │              │           Credentials — Cloud Run
       ▼              ▼           service account)
  admin.credential.cert(sa)
  admin.initializeApp({...})
```

- **Cloud Run (production)**: Uses `GOOGLE_APPLICATION_CREDENTIALS_JSON` injected as a Cloud Run secret, or falls back to the default Cloud Run service account (ADC).
- **Local dev**: Uses a service account key file referenced by `GOOGLE_APPLICATION_CREDENTIALS` path.
- **gcloud auth**: If neither env var is set, falls back to default application credentials.

## Environment Variables

### Frontend (Vite — `import.meta.env.VITE_*`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | OAuth redirect domain | `mdm-generator.web.app` |
| `VITE_FIREBASE_PROJECT_ID` | GCP project | `mdm-generator` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:781206...` |
| `VITE_API_BASE_URL` | Backend endpoint | `http://localhost:8080` (dev) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_test_...` |

- **Dev**: `.env` or `.env.local` (gitignored)
- **Prod**: `.env.production` (checked in — contains only public keys)
- Vite injects `VITE_*` vars at build time; non-prefixed vars are NOT exposed to client code

### Backend (dotenv — `process.env.*`)

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `PORT` | Server port (default 8080) | `.env` / Cloud Run |
| `NODE_ENV` | `development` or `production` | `.env` / Dockerfile |
| `PROJECT_ID` | GCP project ID | `.env` / Cloud Run |
| `VERTEX_LOCATION` | Vertex AI region | `.env` / Cloud Run |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service account JSON (inline) | Cloud Run secret |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to SA key file | `.env` (local dev) |
| `STRIPE_SECRET_KEY` | Stripe secret | `.envrc` / Cloud Run |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing | `.envrc` / Cloud Run |
| `ADMIN_TOKEN` | Admin endpoint auth | Cloud Run env var |

### Env Var Loading by Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                  ENV VAR LOADING BY ENVIRONMENT                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL DEV                        PRODUCTION (Cloud Run)         │
│  ─────────                        ──────────────────────         │
│                                                                  │
│  frontend/.env.local              frontend/.env.production       │
│    └─ Vite reads at build time      └─ Baked into static build   │
│                                                                  │
│  backend/.env                     Cloud Run env vars / secrets   │
│    └─ dotenv auto-loads             └─ Injected at deploy time   │
│       import 'dotenv/config'           via gcloud run deploy     │
│                                        --set-env-vars / secrets  │
│                                                                  │
│  Vertex AI:                       Vertex AI:                     │
│    SA key file on disk              Cloud Run default SA (ADC)   │
│    OR GOOGLE_APPLICATION_           — no explicit credentials    │
│       CREDENTIALS_JSON                needed                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Dev-Mode Auth Bypass

For development in embedded browsers (cmux) where popups are blocked:

- **Activate**: `?dev-auth=1` query param (e.g., `http://localhost:5173/build?dev-auth=1`)
- **Mechanism**: `DEV_MOCK_USER` in `frontend/src/lib/firebase.tsx` injects a fake `User` object
- **Guard**: `import.meta.env.DEV` check — tree-shaken from production builds
- **Limitation**: Backend calls fail (mock token `'dev-mock-token'` won't pass `verifyIdToken()`)
- **Use case**: UI-only development

## Key Files

| File | Role in Auth |
|------|-------------|
| `frontend/src/lib/firebase.tsx` | Firebase init, `signInWithGoogle()`, `AuthProvider`, `useAuthToken()`, dev bypass |
| `frontend/src/lib/api.ts` | API client — Bearer header (profile) vs body token (Build Mode) |
| `frontend/src/components/OnboardingGuard.tsx` | Route guard (auth + onboarding checks) |
| `frontend/src/components/AuthModal.tsx` | Sign-in UI with Google consent |
| `backend/src/index.ts` | Firebase Admin init, `verifyIdToken()`, all route handlers |
| `backend/src/vertex.ts` | Vertex AI auth (SA JSON or ADC) |
| `frontend/.env.production` | Frontend Firebase/Stripe config |
| `backend/.env.example` | Backend env var template |
| `backend/Dockerfile` | Production container config |

---

## Security Audit

### Findings by Severity

#### CRITICAL

**1. Token Revocation Checks Missing on All `verifyIdToken()` Calls**

All ~15 occurrences of `verifyIdToken()` across `backend/src/index.ts` and `backend/src/surveillance/routes.ts` omit the `checkRevoked` parameter:

```typescript
// Current (UNSAFE)
await admin.auth().verifyIdToken(idToken)

// Required (SAFE)
await admin.auth().verifyIdToken(idToken, true)  // true = checkRevoked
```

Impact: If a user account is disabled or session revoked (e.g., compromised account), their existing JWT remains valid until natural expiry (~1 hour). For a medical application, this means a revoked user could continue generating MDM documents for up to an hour after revocation.

Files: `backend/src/index.ts` (~12 occurrences), `backend/src/surveillance/routes.ts` (~2 occurrences). Project uses `firebase-admin@12.6.0` which supports this parameter.

**2. CORS Regex Pattern Overly Permissive**

Location: `backend/src/index.ts` CORS middleware

```typescript
origin.match(/^https:\/\/(mdm-generator[^.]*\.web\.app|aimdm\.app)$/)
```

The `[^.]*` wildcard matches any prefix, e.g. `https://evil-mdm-generator.web.app` would be accepted. Combined with `Access-Control-Allow-Credentials: true`, this could enable cross-origin token theft if an attacker registers a matching Firebase Hosting subdomain.

Fix: Replace with explicit allowlist or anchor the pattern:
```typescript
origin.match(/^https:\/\/(mdm-generator\.web\.app|aimdm\.app)$/)
```

#### HIGH

**3. Admin Endpoint Uses Body Token Instead of Bearer Header**

`/v1/admin/set-plan` passes `adminToken` in the POST body instead of the `Authorization` header. Tokens in request bodies are more likely to be captured by proxy logs, WAF logging, and error reporting. OWASP recommends credentials in `Authorization` headers. The endpoint correctly checks Firebase custom claims (`decoded.admin`), but the transport pattern is suboptimal.

**4. Zod Validation Errors Leaked to Clients**

Some endpoints return raw Zod error details:
```typescript
return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors })
```

This exposes internal schema structure (field names, types, constraints) to attackers. Should return only `{ error: 'Invalid request' }`.

#### MEDIUM

**5. No CSP Header on Frontend (Firebase Hosting)**

`firebase.json` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` — but no `Content-Security-Policy`. Helmet provides CSP for backend API responses, but the frontend SPA served by Firebase Hosting has no CSP, leaving it more vulnerable to XSS.

**6. Docker Container Does Not Explicitly Set Non-Root User**

`backend/Dockerfile` uses `node:20-slim` but doesn't include a `USER node` directive. While Cloud Run containers typically run as non-root, an explicit `USER` instruction is defense-in-depth.

**7. `FRONTEND_URL` Likely Unset in Production**

```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL,  // Possibly undefined in Cloud Run
].filter(Boolean) as string[]
```

If unset, CORS falls through entirely to the regex pattern (Finding #2), making origin matching implicit rather than explicit.

**8. Inconsistent Token Transport (Body vs Header)**

The dual pattern (Bearer header for user profile CRUD, body token for Build Mode/Quick Mode/surveillance) is mitigated by HTTPS + CORS + no token logging, but creates cognitive overhead and risk of future developers accidentally logging request bodies containing tokens.

### Confirmed Secure

| Area | Assessment |
|------|-----------|
| Dev-mode auth bypass (`DEV_MOCK_USER`) | Compile-time gated by `import.meta.env.DEV`, tree-shaken from production builds. Backend rejects mock token. Safe. |
| Frontend token storage | React state only (`useState`), never `localStorage`/`sessionStorage`. Listener cleanup via `unsubscribe`. Best practice. |
| `.env.production` in git | Contains only public Firebase config and Stripe publishable key. No secrets. Safe. |
| Firestore security rules | Owner-scoped reads/writes, finalized encounters locked, usage tracking server-write-only. Sound design. |
| Rate limiting | Global 60/min, LLM 10/min, parse 5/min per IP. Trust proxy enabled. Appropriate. |
| Helmet on backend | Enabled (`app.use(helmet())`). Provides HSTS, X-Frame-Options, CSP for API responses. |
| Error handling (frontend) | `ApiError` class returns user-friendly messages, no token/stack trace leakage. |
| Firebase Auth (Google OAuth) | `signInWithPopup` only, no redirect fallback. Firebase-managed, no custom OAuth. |

### Summary Matrix

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Missing `checkRevoked: true` on `verifyIdToken()` | **CRITICAL** | Needs fix |
| 2 | CORS regex accepts unintended origins | **CRITICAL** | Needs fix |
| 3 | Admin token in body instead of header | HIGH | Design issue |
| 4 | Zod validation errors leaked | HIGH | Needs fix |
| 5 | No CSP on frontend hosting | MEDIUM | Needs fix |
| 6 | Docker no explicit `USER node` | MEDIUM | Hardening |
| 7 | `FRONTEND_URL` likely unset in prod | MEDIUM | Verify |
| 8 | Inconsistent token transport | MEDIUM | Design issue |

### Documentation Gaps

This document should additionally cover:

1. **Token revocation policy** — whether/when `checkRevoked` is used and incident response for immediate account disablement
2. **CORS origin allowlist** — explicit list of allowed origins rather than describing a regex
3. **Token expiry lifecycle** — Firebase JWTs expire after ~1 hour and are auto-refreshed by the SDK
4. **HSTS policy** — Helmet provides HSTS on backend; frontend relies on Firebase Hosting defaults
