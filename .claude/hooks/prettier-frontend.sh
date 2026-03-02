#!/bin/bash
# Auto-format frontend files with Prettier after Edit/Write
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only format frontend TS/TSX/CSS/JSON files
if [[ "$FILE_PATH" == */frontend/* && ("$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx || "$FILE_PATH" == *.css || "$FILE_PATH" == *.json) ]]; then
  FRONTEND_DIR=$(echo "$FILE_PATH" | sed 's|/frontend/.*|/frontend|')
  cd "$FRONTEND_DIR" && npx prettier --write "$FILE_PATH" 2>/dev/null
fi

exit 0
