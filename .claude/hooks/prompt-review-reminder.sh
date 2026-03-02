#!/bin/bash
# Reminds to run prompt-reviewer agent when AI pipeline files change.
# Always exits 0 (non-blocking). Stdout surfaces as a conversation note.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# --- Prompt builders ---
case "$FILE_PATH" in
  */backend/src/promptBuilder.ts | \
  */backend/src/promptBuilderBuildMode.ts | \
  */backend/src/promptBuilderQuickMode.ts | \
  */backend/src/parsePromptBuilder.ts)
    echo "Prompt builder changed ($BASENAME) — run prompt-reviewer agent. Focus: worst-first ordering, forbidden patterns, safety guardrails."
    exit 0
    ;;
esac

# --- Schemas ---
case "$FILE_PATH" in
  */backend/src/outputSchema.ts | \
  */backend/src/buildModeSchemas.ts)
    echo "Schema changed ($BASENAME) — run prompt-reviewer agent. Focus: schema-prompt alignment (TestResult, CdrTrackingEntry, response shapes)."
    exit 0
    ;;
esac

# --- Structured data pipeline ---
case "$FILE_PATH" in
  */backend/src/services/cdr*.ts | \
  */backend/src/services/test*.ts | \
  */backend/src/services/embeddingService.ts)
    echo "Structured data pipeline changed ($BASENAME) — run prompt-reviewer agent. Focus: CDR/test catalog injection format, data flow into prompts."
    exit 0
    ;;
esac

# --- Surveillance augmentation ---
case "$FILE_PATH" in
  */backend/src/surveillance/promptAugmenter.ts)
    echo "Surveillance augmenter changed ($BASENAME) — run prompt-reviewer agent. Focus: context size limit (<=2000 chars), non-blocking behavior."
    exit 0
    ;;
esac

# --- LLM interface ---
case "$FILE_PATH" in
  */backend/src/vertex.ts)
    echo "LLM interface changed ($BASENAME) — run prompt-reviewer agent. Focus: model config, temperature settings (affects all pipelines)."
    exit 0
    ;;
esac

# --- Medical documentation (source of truth) ---
case "$FILE_PATH" in
  */docs/mdm-gen-guide-v2.md | \
  */docs/mdm-gen-guide-build-s1.md | \
  */docs/mdm-gen-guide-build-s3.md | \
  */docs/generator_engine.md | \
  */docs/prd.md)
    echo "Medical doc changed ($BASENAME) — run prompt-reviewer agent. Focus: source of truth shifted, verify all prompts still align."
    exit 0
    ;;
esac

exit 0
