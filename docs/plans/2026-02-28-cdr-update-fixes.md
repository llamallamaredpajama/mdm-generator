# PR #7 (cdr-update) — Fix Plan

**Date**: 2026-02-28
**Source**: 2026-02-28-cdr-update-review.md

---

## Fix 1: Wire up `onAnswerComponent` in CdrCard

**File**: `frontend/src/components/build-mode/shared/CdrCard.tsx`
**Lines**: 190 (destructure), 369 (component rows)

**Problem**: `onAnswerComponent` is declared in the props interface (line 24) but not destructured from props at line 190, so the parent's callback is silently ignored. Inline CDR component answering is broken.

**Fix**:
1. Add `onAnswerComponent` to the destructured props at line 190
2. For `select` type components, add click handler on component rows that calls `onAnswerComponent` with the selected value
3. For `boolean` type components, add a click toggle

**Note**: The inline answering UI is complex (dropdowns, toggles). Since the old CdrCard also didn't have full inline editing (it was a planned feature), the minimal fix is to simply destructure the prop so it's available when the UI is added later. The prop contract should not be silently broken.

**Verification**: `cd frontend && pnpm check`

---

## Fix 2: Guard module-level JSON.parse in embeddingService

**File**: `backend/src/services/embeddingService.ts`
**Lines**: 19-23

**Problem**: `JSON.parse(credentialsJson)` at module scope can crash the backend at startup if the env var is malformed.

**Fix**: Wrap the parse in a try/catch that falls back to `undefined` (letting GoogleAuth use default application credentials instead).

```typescript
let parsedCredentials: Record<string, unknown> | undefined
if (credentialsJson) {
  try {
    parsedCredentials = JSON.parse(credentialsJson)
  } catch {
    console.warn('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON, falling back to default credentials')
  }
}
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  ...(parsedCredentials ? { credentials: parsedCredentials } : {}),
})
```

**Verification**: `cd backend && pnpm build`
