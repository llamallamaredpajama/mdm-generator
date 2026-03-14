#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Pre-deploy gates ==="
(cd backend && pnpm build && pnpm test)

echo "=== Building container image via Cloud Build ==="
gcloud builds submit --config cloudbuild.yaml --project mdm-generator .

echo "=== Deploying to Cloud Run ==="
gcloud run deploy mdm-backend \
  --image gcr.io/mdm-generator/mdm-backend:latest \
  --project mdm-generator \
  --region us-central1

echo "=== Backend deployment complete ==="
