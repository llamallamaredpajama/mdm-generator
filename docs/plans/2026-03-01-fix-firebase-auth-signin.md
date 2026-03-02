# Fix Firebase Auth Sign-In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix broken Google sign-in by removing the popup-budget-consuming probe and adding proper error handling + COOP headers.

**Architecture:** Remove the `window.open` popup probe from `signInWithGoogle()` that consumes the browser's one-popup-per-click budget before Firebase can open the actual auth popup. Let `signInWithPopup` run directly, catch `auth/popup-blocked` to fall back to redirect. Add `same-origin-allow-popups` COOP header to Vite dev server to suppress console noise. Add `auth/cancelled-popup-request` handling and production COOP header.

**Tech Stack:** React 19, Firebase Auth SDK 10.x, Vite 7, TypeScript

**Root Cause:** The popup-capability probe at `firebase.tsx:59-67` calls `window.open('', '_blank')` before `signInWithPopup`. Browsers allow one popup per user gesture — the probe consumes it, so Firebase's popup gets silently blocked.

---

### Task 1: Add COOP header to Vite dev server

**Files:**
- Modify: `frontend/vite.config.ts`

**Step 1: Add `same-origin-allow-popups` header to dev server config**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

**Step 2: Verify the header is served**

Run: `cd frontend && pnpm dev &`
Then: `curl -sI http://127.0.0.1:5173 | grep -i cross-origin`
Expected: `Cross-Origin-Opener-Policy: same-origin-allow-popups`
Kill the dev server after verifying.

**Step 3: Commit**

```bash
git add frontend/vite.config.ts
git commit -m "fix(auth): add COOP same-origin-allow-popups header to Vite dev server

Suppresses Cross-Origin-Opener-Policy console warnings from Google OAuth
popup without breaking Firebase signInWithPopup communication."
```

---

### Task 2: Remove popup probe and simplify `signInWithGoogle`

**Files:**
- Modify: `frontend/src/lib/firebase.tsx:54-89`

**Step 1: Rewrite `signInWithGoogle` — remove probe, add missing error codes**

Replace lines 54-89 with:

```typescript
// eslint-disable-next-line react-refresh/only-export-components
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(getAppAuth(), getProvider())
    return result
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string }
    // User cancelled or double-clicked — not an error
    if (
      authError.code === 'auth/popup-closed-by-user' ||
      authError.code === 'auth/cancelled-popup-request'
    ) {
      return
    }
    // Popup blocked — fall back to full-page redirect
    if (authError.code === 'auth/popup-blocked') {
      await signInWithRedirect(getAppAuth(), getProvider())
      return
    }
    alert(`Sign in failed: ${authError.message}`)
    throw error
  }
}
```

Key changes:
- **Removed** the `window.open('', '_blank')` popup probe (lines 55-73) that consumed the popup budget
- **Added** `auth/cancelled-popup-request` handling (double-click guard)
- **Kept** existing `auth/popup-blocked` → redirect fallback
- **Kept** existing `auth/popup-closed-by-user` handling

**Step 2: Clean up unused import if `signInWithRedirect` is still used**

Verify `signInWithRedirect` is still imported (it is — used in the `auth/popup-blocked` fallback). No import changes needed.

**Step 3: Run typecheck**

Run: `cd frontend && pnpm check`
Expected: PASS (no type errors, lint clean, tests pass)

**Step 4: Commit**

```bash
git add frontend/src/lib/firebase.tsx
git commit -m "fix(auth): remove popup probe that consumed browser popup budget

The window.open probe at signInWithGoogle() consumed the one-popup-per-click
allowance before Firebase could open the Google auth popup, silently blocking
sign-in. Now calls signInWithPopup directly and falls back to redirect on
auth/popup-blocked. Also handles auth/cancelled-popup-request for double-clicks."
```

---

### Task 3: Add COOP header to production Firebase Hosting config

**Files:**
- Modify: `firebase.json` (project root)

**Step 1: Read current `firebase.json` to find the hosting config section**

**Step 2: Add COOP header to hosting headers**

Add to the `hosting.headers` array (or create it if absent):

```json
{
  "source": "**",
  "headers": [
    {
      "key": "Cross-Origin-Opener-Policy",
      "value": "same-origin-allow-popups"
    }
  ]
}
```

**Step 3: Verify `firebase.json` is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('firebase.json','utf8')); console.log('valid')"`
Expected: `valid`

**Step 4: Commit**

```bash
git add firebase.json
git commit -m "fix(auth): add COOP same-origin-allow-popups header to Firebase Hosting

Mirrors the Vite dev server header for production. Suppresses COOP console
warnings from Google OAuth popup on mdm-generator.web.app."
```

---

### Task 4: Manual sign-in verification

**Step 1: Start the frontend dev server**

Run: `cd frontend && pnpm dev`

**Step 2: Open `http://127.0.0.1:5173` in browser**

**Step 3: Click Login — verify Google popup opens immediately**

Expected:
- Google sign-in popup appears
- No `Cross-Origin-Opener-Policy policy would block the window.closed call` errors in console
- After signing in, user state updates (Login button becomes user dropdown)

**Step 4: Test double-click on Login**

Expected: No `alert()` dialog — the `auth/cancelled-popup-request` code is handled silently.

**Step 5: Test the "Get Started" and "Sign Up Free" buttons (lines 283, 425 in Start.tsx)**

Expected: Same behavior — Google popup opens, sign-in completes.

---

### Summary of Changes

| File | Change | Why |
|------|--------|-----|
| `frontend/vite.config.ts` | Add `Cross-Origin-Opener-Policy: same-origin-allow-popups` header | Suppress COOP console warnings in dev |
| `frontend/src/lib/firebase.tsx` | Remove popup probe, add `auth/cancelled-popup-request` handling | Fix: probe consumed popup budget, blocking sign-in |
| `firebase.json` | Add COOP header to hosting config | Suppress COOP console warnings in prod |
