---
name: deploy-mdm
description: |
  Deploy aiMDM to production (Firebase Hosting + Cloud Run).
  Runs quality gates first, then deploys frontend and backend.
  Use when the user says "deploy", "ship it", "push to prod",
  "deploy mdm", "deploy to production", or "deploy backend/frontend".
disable-model-invocation: true
---

# Deploy aiMDM

Deploy the aiMDM application. This is a Firebase Hosting + Cloud Run deployment — NOT Vercel, Netlify, or any other platform.

## Pre-Flight Checks (MANDATORY — do not skip)

Run these in parallel:
1. `cd frontend && pnpm check` — typecheck + lint + test (all must pass)
2. `cd backend && pnpm build` — TypeScript compilation (must succeed)

If either fails, STOP and fix the issue before deploying.

## Determine Scope

Ask the user if not clear from context:
- **Full deploy** (default): both frontend and backend
- **Frontend only**: just Firebase Hosting
- **Backend only**: just Cloud Run

## Frontend Deploy (Firebase Hosting)

```bash
cd frontend && pnpm build
firebase deploy --only hosting --project mdm-generator
```

Confirm success: look for "Deploy complete!" and the hosting URL `https://mdm-generator.web.app`.

## Backend Deploy (Cloud Run)

This is a two-step process. Both commands must run from the **project root** (not `backend/`).

### Step 1: Build container image
```bash
gcloud builds submit --config /dev/stdin --project mdm-generator . <<'CLOUDBUILD'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'backend/Dockerfile', '-t', 'gcr.io/mdm-generator/mdm-backend:latest', '.']
images: ['gcr.io/mdm-generator/mdm-backend:latest']
CLOUDBUILD
```

Wait for "SUCCESS" before proceeding.

### Step 2: Deploy to Cloud Run
```bash
gcloud run deploy mdm-backend \
  --image gcr.io/mdm-generator/mdm-backend:latest \
  --project mdm-generator \
  --region us-central1
```

## Post-Deploy Verification

After deployment completes:
1. Hit the health endpoint: `curl https://mdm-backend-<hash>-uc.a.run.app/health`
2. Confirm it returns a healthy response

## Important Reminders
- `pnpm build` in backend only compiles TypeScript locally — it does NOT deploy
- Backend changes are NOT live until the Cloud Run container is rebuilt and deployed
- NEVER use Vercel, Netlify, or other hosting platforms for this project
