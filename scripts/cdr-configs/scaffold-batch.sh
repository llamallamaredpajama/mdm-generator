#!/bin/bash
# Scaffolds a new CDR batch config file and its test file.
# Usage: ./scaffold-batch.sh <batch-number> <specialty-slug>
# Example: ./scaffold-batch.sh 31 rheum-autoimmune
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <batch-number> <specialty-slug>"
  echo "Example: $0 31 rheum-autoimmune"
  exit 1
fi

NUM="$1"
SPECIALTY="$2"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Validate inputs
if ! [[ "$NUM" =~ ^[0-9]+$ ]]; then
  echo "Error: batch-number must be numeric"
  exit 1
fi
if ! [[ "$SPECIALTY" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Error: specialty-slug must be lowercase with hyphens (e.g. rheum-autoimmune)"
  exit 1
fi

# Derive camelCase export name: batch31RheumAutoimmuneCdrs
CAMEL=""
IFS='-' read -ra PARTS <<< "$SPECIALTY"
for i in "${!PARTS[@]}"; do
  PART="${PARTS[$i]}"
  CAMEL+="$(echo "${PART:0:1}" | tr '[:lower:]' '[:upper:]')${PART:1}"
done
EXPORT_NAME="batch${NUM}${CAMEL}Cdrs"

BATCH_FILE="batch-${NUM}-${SPECIALTY}.ts"
TEST_FILE="__tests__/batch-${NUM}-${SPECIALTY}.test.ts"

if [ -f "$SCRIPT_DIR/$BATCH_FILE" ]; then
  echo "Error: $BATCH_FILE already exists"
  exit 1
fi

# --- Generate batch config file ---
cat > "$SCRIPT_DIR/$BATCH_FILE" << BATCHEOF
import type { CdrSeed } from './types'

// ---------------------------------------------------------------------------
// Batch ${NUM}: ${SPECIALTY}
// ---------------------------------------------------------------------------

// Each CDR must have:
//   - Unique snake_case id
//   - >=3 user-answerable components (boolean/select + section1/user_input)
//   - suggestedTreatments keys matching scoring.ranges risk values
//   - Valid category from VALID_CATEGORIES in interactivity-validation.test.ts

export const ${EXPORT_NAME}: CdrSeed[] = [
  // Add CdrSeed objects here
]
BATCHEOF

# --- Generate test file ---
cat > "$SCRIPT_DIR/$TEST_FILE" << TESTEOF
import { describe, it, expect } from 'vitest'
import { ${EXPORT_NAME} } from '../${BATCH_FILE%.ts}'

const EXPECTED_CDR_COUNT = 0 // Update when CDRs are added

describe('Batch ${NUM} — ${SPECIALTY}', () => {
  it('has the expected number of CDRs', () => {
    expect(${EXPORT_NAME}).toHaveLength(EXPECTED_CDR_COUNT)
  })

  describe.each(${EXPORT_NAME}.map((cdr) => [cdr.id, cdr] as const))('%s', (_id, cdr) => {
    it('has a unique snake_case id', () => {
      expect(cdr.id).toMatch(/^[a-z][a-z0-9_]*\$/)
    })

    it('has required fields', () => {
      expect(cdr.name).toBeTruthy()
      expect(cdr.fullName).toBeTruthy()
      expect(cdr.category).toBeTruthy()
      expect(cdr.application).toBeTruthy()
      expect(cdr.applicableChiefComplaints.length).toBeGreaterThan(0)
      expect(cdr.keywords.length).toBeGreaterThan(0)
      expect(cdr.components.length).toBeGreaterThanOrEqual(3)
      expect(cdr.scoring.ranges.length).toBeGreaterThan(0)
    })

    it('scoring ranges have no gaps', () => {
      if (cdr.scoring.method !== 'sum') return
      const sorted = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
      for (let i = 1; i < sorted.length; i++) {
        expect(
          sorted[i].min,
          \`Gap between ranges: \${sorted[i - 1].max} → \${sorted[i].min}\`,
        ).toBe(sorted[i - 1].max + 1)
      }
    })

    it('scoring ranges have non-empty risk and interpretation', () => {
      for (const r of cdr.scoring.ranges) {
        expect(r.risk.trim().length).toBeGreaterThan(0)
        expect(r.interpretation.trim().length).toBeGreaterThan(0)
      }
    })
  })
})
TESTEOF

echo "Created: $BATCH_FILE"
echo "Created: $TEST_FILE"
echo ""
echo "Add these imports to complete integration:"
echo ""
echo "-- interactivity-validation.test.ts --"
echo "  import { ${EXPORT_NAME} } from '../${BATCH_FILE%.ts}'"
echo "  ...${EXPORT_NAME},  // add to ALL_CDRS array"
echo ""
echo "-- seed-cdr-library.ts --"
echo "  import { ${EXPORT_NAME} } from './cdr-configs/${BATCH_FILE%.ts}'"
echo "  ...${EXPORT_NAME},  // add to batchOverrides array"
