#!/bin/bash
# Reminds to run security-reviewer agent when security-relevant files change.
# Always exits 0 (non-blocking). Stdout surfaces as a conversation note.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# --- Backend routes (entry points) ---
case "$FILE_PATH" in
  */backend/src/index.ts | \
  */backend/src/surveillance/routes.ts)
    echo "Backend route changed ($BASENAME) — run security-reviewer agent. Focus: 6-step auth pattern, rate limiting, CORS, error message safety."
    exit 0
    ;;
esac

# --- User service (quota & permissions) ---
case "$FILE_PATH" in
  */backend/src/services/userService.ts)
    echo "User service changed ($BASENAME) — run security-reviewer agent. Focus: atomic quota (runTransaction), subscription checks, admin claims."
    exit 0
    ;;
esac

# --- Frontend auth & payment ---
case "$FILE_PATH" in
  */frontend/src/lib/firebase.tsx | \
  */frontend/src/lib/stripe.ts | \
  */frontend/src/lib/api.ts | \
  */frontend/src/hooks/useSubscription.ts)
    echo "Frontend auth/payment changed ($BASENAME) — run security-reviewer agent. Focus: token handling, sign-in method, no secrets in frontend code."
    exit 0
    ;;
esac

# --- Firestore rules (CRITICAL) ---
case "$FILE_PATH" in
  */firestore.rules)
    echo "CRITICAL: Firestore rules changed — run security-reviewer agent IMMEDIATELY. Focus: default deny, ownership isolation, Stripe write-protection."
    exit 0
    ;;
esac

# --- Infrastructure ---
case "$FILE_PATH" in
  */backend/Dockerfile | \
  */firebase.json)
    echo "Infrastructure changed ($BASENAME) — run security-reviewer agent. Focus: container security, hosting headers (CSP, COOP)."
    exit 0
    ;;
esac

exit 0
