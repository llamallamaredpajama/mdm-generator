#!/bin/bash
# Reminds to run prompt-reviewer agent when AI pipeline files change.
# Always exits 0 (non-blocking). Stdout surfaces as a conversation note.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Match AI pipeline files
BASENAME=$(basename "$FILE_PATH")
case "$FILE_PATH" in
  */backend/src/promptBuilder*.ts | \
  */backend/src/parsePromptBuilder.ts | \
  */backend/src/outputSchema.ts | \
  */backend/src/buildModeSchemas.ts | \
  */backend/src/vertex.ts | \
  */docs/mdm-gen-guide.md | \
  */docs/generator_engine.md)
    echo "AI pipeline file changed ($BASENAME) — remember to run the prompt-reviewer agent to verify prompt/schema alignment."
    ;;
esac

exit 0
