# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Critical constraints (from CLAUDE.md)
- **NO PHI ever** in code, logs, comments, or outputs.
- **Educational use only**; no real patient data.
- **No long-term medical storage**; client-side only for medical content.
- **Physician review required** for all outputs.

## Architecture overview
- **Frontend**: React 19 + Vite + TypeScript + React Router. Client-side medical content only.
- **Backend**: Express + TypeScript + Vertex AI (Gemini) + Firebase Admin. Handles auth validation and MDM generation.
- **Auth**: Firebase Auth (Google).
- **Payments**: Firebase Stripe Extension (Firestore-based subscriptions).

### Primary routes (frontend)
`/` Start • `/compose` Input • `/preflight` PHI check • `/output` MDM display • `/settings` User prefs

### API endpoints (backend)
`GET /healthz` • `POST /v1/whoami` • `POST /v1/generate`

### Medical logic entry points
- `docs/mdm-gen-guide.md`: prompting logic + MDM template
- `docs/prd.md`: product requirements/constraints
- `backend/src/promptBuilder.ts`: prompt construction
- `backend/src/outputSchema.ts`: MDM structure validation
- `frontend/src/routes/Output.tsx`: MDM display
- `frontend/src/components/Checklist.tsx`: PHI verification gate
- `frontend/src/components/DictationGuide.tsx`: physician guidance

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
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_API_BASE_URL` (default `http://localhost:8080`)

### Backend (`backend/.env`)
- `PORT` (default 8080)
- `GOOGLE_APPLICATION_CREDENTIALS`
- `PROJECT_ID`
- `VERTEX_LOCATION` (default `us-central1`)

### Stripe (`.envrc` via direnv)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Stripe data model (Firebase Stripe Extension)
- `customers/{uid}/checkout_sessions`
- `customers/{uid}/subscriptions`
- `products` / `prices` (synced from Stripe)

## Cursor/BMad rules
This repo includes extensive Cursor rules under `.cursor/rules/` that define multiple BMad personas (e.g., `@dev`, `@architect`, `@pm`, `@po`, `@qa`, `@sm`, `@ux-expert`) and their command workflows. If you are operating under those personas, follow the YAML instructions in the corresponding rule file.
