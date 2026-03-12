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
