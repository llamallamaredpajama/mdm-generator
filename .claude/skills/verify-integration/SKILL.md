---
name: verify-integration
description: Run E2E integration tests to verify the full API and frontend work end-to-end. Use when asked to "verify integration", "run e2e", "smoke test", "verify the app works", or after major refactoring.
---

# E2E Integration Verification

Run the E2E integration suite to verify the app works end-to-end.

## Prerequisites
- Backend running on localhost:8080 (`cd backend && pnpm dev`)
- Frontend running on localhost:5173 (`cd frontend && pnpm dev`) — for browser tests
- Firebase credentials configured (GOOGLE_APPLICATION_CREDENTIALS)

## Commands

### Quick (core API only, ~10s, no LLM calls)
```bash
make e2e-quick
```

### Full (core + LLM + browser, ~2-3 min)
```bash
make e2e
```

### Individual targets
```bash
make e2e-setup     # Mint token + create test encounters
make e2e-smoke     # API smoke tests (core + LLM)
make e2e-browser   # Playwright browser tests
make e2e-cleanup   # Remove test data from Firestore
```

## On Failure

1. **Token errors**: Re-run `make e2e-setup` (tokens expire after ~1 hour)
2. **401 on API calls**: Verify backend is running and token file exists at `/tmp/e2e-token.txt`
3. **429 rate limit**: Wait 60s and retry
4. **S1/finalize timeout**: Vertex AI may be cold-starting; retry once
5. **Browser test failures**: Ensure frontend dev server is running on :5173
6. **Firestore permission denied**: Check service account has Firestore read/write access

## Verbose Mode
```bash
E2E_VERBOSE=true bash scripts/verify-integration.sh
```
