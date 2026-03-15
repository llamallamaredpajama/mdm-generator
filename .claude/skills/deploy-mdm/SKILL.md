---
name: deploy-mdm
description: |
  Deploy the aiMDM application to Firebase Hosting and/or Cloud Run.
  This is the ONLY deployment method for the mdm-proj codebase.
  Use when asked to deploy aiMDM, deploy the MDM backend/frontend,
  or ship MDM to production. Do NOT use for other projects.
---

# Deploy aiMDM

Deploy the aiMDM application. Firebase Hosting (frontend) + Cloud Run (backend). NOT Vercel, Netlify, or any other platform.

## CRITICAL RULES

- **EVERY Bash command MUST start with `cd /Users/jeremy/dev/proj/mdm-proj`** — this eliminates the exit 127 path resolution bug
- **NEVER use `run_in_background: true`** for any deploy step — use parallel foreground Bash tool calls instead
- **ALWAYS include `--project mdm-generator`** on every gcloud/firebase command

## Phase 0 — Security Pre-scan

Before anything else, check for PHI and secrets in staged/unstaged changes:

```bash
cd /Users/jeremy/dev/proj/mdm-proj && git diff HEAD --unified=0 | grep -iE '(patient|ssn|dob|mrn|address|phone|\b\d{3}-\d{2}-\d{4}\b)' || echo "PHI scan clean"
```

```bash
cd /Users/jeremy/dev/proj/mdm-proj && git diff --cached --name-only | grep -iE '(\.env|credential|secret|\.ssh)' || echo "No secrets staged"
```

**If either scan finds matches: ABORT immediately.** Show the user what was found and do not proceed.

## Phase 1 — Pre-deploy Quality Gates

Run these checks. Both MUST pass before deploying. Run in parallel (two separate foreground Bash tool calls):

**Backend gate:**
```bash
cd /Users/jeremy/dev/proj/mdm-proj/backend && pnpm build && pnpm test
```

**Frontend gate:**
```bash
cd /Users/jeremy/dev/proj/mdm-proj/frontend && pnpm check
```

**If either fails: STOP.** Fix the issue before proceeding. Do not deploy broken code.

## Determine Scope

If the user didn't specify, ask:
- **Full deploy** (default): both frontend and backend
- **Frontend only**: just Firebase Hosting
- **Backend only**: just Cloud Run

## Phase 2 — Build & Deploy

### Backend Deploy (Cloud Run) — Sequential Steps

**Step 1: Purge gcloud cache** (prevents the known upload flake where only ~195 files upload instead of ~4700):
```bash
cd /Users/jeremy/dev/proj/mdm-proj && gcloud meta cache purge 2>/dev/null || true
```

**Step 2: Cloud Build** (builds Docker image):
```bash
cd /Users/jeremy/dev/proj/mdm-proj && gcloud builds submit --config cloudbuild.yaml --project mdm-generator .
```

Wait for "SUCCESS". If you see `lstat /workspace/backend: no such file or directory` or the upload shows ~195 files instead of ~4700, this is the known upload flake. Run `gcloud meta cache purge` and retry once.

**Step 3: Cloud Run deploy:**
```bash
cd /Users/jeremy/dev/proj/mdm-proj && gcloud run deploy mdm-backend --image gcr.io/mdm-generator/mdm-backend:latest --project mdm-generator --region us-central1
```

### Frontend Deploy (Firebase Hosting)

Can run in **parallel** with backend (as a separate foreground Bash tool call):

**Step 1: Build:**
```bash
cd /Users/jeremy/dev/proj/mdm-proj/frontend && pnpm build
```

**Step 2: Deploy:**
```bash
cd /Users/jeremy/dev/proj/mdm-proj && firebase deploy --only hosting --project mdm-generator
```

Confirm success: look for "Deploy complete!" and the hosting URL.

## Phase 3 — Post-deploy Verification

**Get Cloud Run service URL:**
```bash
cd /Users/jeremy/dev/proj/mdm-proj && gcloud run services describe mdm-backend --project mdm-generator --region us-central1 --format 'value(status.url)'
```

**Hit health probes** (use the URL from above):
```bash
curl -sf <SERVICE_URL>/health/live && echo " ✓ liveness OK" || echo " ✗ liveness FAILED"
```

```bash
curl -sf <SERVICE_URL>/health/ready && echo " ✓ readiness OK" || echo " ✗ readiness FAILED"
```

**Frontend check:**
```bash
curl -sf -o /dev/null -w "%{http_code}" https://aimdm.app && echo " ✓ frontend OK" || echo " ✗ frontend FAILED"
```

## Phase 4 — Report

Summarize to the user:
- What was deployed (frontend, backend, or both)
- Quality gate results (all passed)
- Health check results
- Any issues encountered and how they were resolved

## Important Reminders

- `pnpm build` in backend only compiles TypeScript locally — it does NOT deploy
- Backend changes in `backend/src/` are NOT live until the Cloud Run container is rebuilt and deployed
- NEVER use Vercel, Netlify, or other hosting platforms for this project
- Frontend deploy is fast (~10s), backend Cloud Build takes ~75s
