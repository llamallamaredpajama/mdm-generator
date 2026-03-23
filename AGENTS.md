# AGENTS.md

This file provides guidance to WARP (warp.dev) and other AI agents when working with code in this repository.

> **Note:** For comprehensive details, see `docs/backend-trd.md`, `docs/frontend-trd.md`, `docs/prd.md`, and `CLAUDE.md`.

## Critical constraints (Non-Negotiable)
- **NO PHI ever** in code, logs, comments, or outputs. Protected Health Information is strictly prohibited.
- **Educational use only**; no real patient data.
- **No long-term medical storage**; client-side only for medical narrative content.
- **Physician review required** for all outputs. No automated clinical decisions.
- **100% CDR Accuracy**: Clinical Decision Rules must perfectly match established medical literature.

## Architecture overview
- **Frontend**: React 19 + Vite 7 + TypeScript + React Router + Framer Motion. 
- **Backend**: Express 4.x + TypeScript + Vertex AI (Gemini 2.5 Pro) + Firebase Admin. 
- **Two-Mode Workflow**: 
  - **Build Mode**: 3-section progressive MDM generation with Firestore persistence.
  - **Quick Mode**: One-shot MDM generation.
- **Auth**: Firebase Auth (Google Sign-In).
- **Payments**: Firebase Stripe Extension.

### Primary routes (frontend)
`/` Landing • `/onboarding` Wizard • `/compose` EncounterBoard • `/preflight` PHI check • `/output` MDM display • `/settings` User prefs • `/analytics` Gap analytics

### API endpoints (backend - 33 total)
Organized into 7 modules:
- `/v1/admin/*` (Plan management)
- `/v1/analytics/*` (Gap analytics)
- `/v1/build-mode/*` (Encounters: S1, S2, finalize, match-cdrs, suggest-diagnosis, parse-results)
- `/v1/libraries/*` (Tests and CDRs)
- `/v1/parse-narrative` (Structured extraction)
- `/v1/quick-mode/*` (One-shot MDM)
- `/v1/user/*` (Profile, order sets, dispo flows, templates)

### Medical logic entry points
- **Prompts**: `backend/prompts/*.md` (e.g., `mdm-gen-guide-build-s1.md`)
- **Prompt Builders**: `backend/src/promptBuilderBuildMode.ts`, `promptBuilderQuickMode.ts`, `promptBuilderAnalytics.ts`
- **Schemas**: `backend/src/buildModeSchemas.ts`
- **Frontend Core**: `frontend/src/components/build-mode/EncounterEditor.tsx`, `DashboardOutput.tsx`, `CdrCard.tsx`, `OrdersCard.tsx`

## Common commands
### Frontend
- `cd frontend && pnpm dev` — dev server (:5173)
- `cd frontend && pnpm check` — typecheck + lint + test (required before commits)
- `cd frontend && pnpm build` — production build

### Backend
- `cd backend && pnpm dev` — dev server (:8080)
- `cd backend && pnpm build` — TypeScript compilation (required before commits)

## Environment variables
### Frontend (`frontend/.env`)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_API_BASE_URL` (default `http://localhost:8080`)

### Backend (`backend/.env`)
- `PORT` (default 8080)
- `GOOGLE_APPLICATION_CREDENTIALS` (or `GOOGLE_APPLICATION_CREDENTIALS_JSON`)
- `PROJECT_ID`
- `VERTEX_LOCATION` (default `us-central1`)

### Stripe (`.envrc` via direnv)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Firestore Data Model
- **Users/Auth**: `customers/{uid}`, `users/{uid}`
- **Encounters**: `customers/{uid}/encounters/{encounterId}`
- **Libraries**: `testLibrary/{id}`, `cdrLibrary/{id}`, `photoLibrary/{id}`
- **Stripe**: `customers/{uid}/checkout_sessions`, `customers/{uid}/subscriptions`, `products`, `prices`

## Cursor/BMad rules
Review `.cursor/rules/` for BMad personas (`@dev`, `@architect`, etc.). Follow YAML instructions in the corresponding rule file.
