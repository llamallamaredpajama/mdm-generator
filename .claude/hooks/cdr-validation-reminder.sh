#!/bin/bash
# Surfaces CDR compliance checklist when CDR config files are modified.
# Always exits 0 (non-blocking). Stdout surfaces as a conversation note.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# Skip non-CDR files early
case "$FILE_PATH" in
  */scripts/cdr-configs/*) ;; # Continue to checks below
  *) exit 0 ;;
esac

# Skip test files and quarantine files
case "$FILE_PATH" in
  */__tests__/*) exit 0 ;;
  */_quarantine/*) exit 0 ;;
esac
case "$BASENAME" in
  types.ts) exit 0 ;;
esac

# CDR config file changed — surface validation checklist
echo "CDR config changed ($BASENAME) — run compliance validation:"
echo "  1. Run: cd scripts/cdr-configs && npx vitest run __tests__/interactivity-validation.test.ts"
echo "  2. Verify batch is imported in __tests__/interactivity-validation.test.ts (ALL_CDRS array)"
echo "  3. Verify batch is imported in scripts/seed-cdr-library.ts (batchOverrides array)"
echo "  4. Verify a corresponding __tests__/batch-*.test.ts file exists"
echo "  5. Run full suite: cd scripts/cdr-configs && npx vitest run"
exit 0
