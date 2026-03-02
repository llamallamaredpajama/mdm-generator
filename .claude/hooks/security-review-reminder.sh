#!/bin/bash
# Reminds to run security-reviewer agent when backend/src/ files change.
# Always exits 0 (non-blocking). Stdout surfaces as a conversation note.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

if [[ "$FILE_PATH" == */backend/src/* ]]; then
  echo "Backend code changed ($FILE_PATH) — remember to run the security-reviewer agent before completing this task."
fi

exit 0
