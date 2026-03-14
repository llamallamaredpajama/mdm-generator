#!/bin/bash
#
# E2E API Smoke Tests
# Verifies backend endpoints respond correctly using curl + jq.
#
# Usage:
#   bash scripts/verify-integration.sh          # Full suite (core + LLM)
#   bash scripts/verify-integration.sh --quick   # Core only (no LLM calls)
#
# Requires:
#   - Backend running on localhost:8080
#   - Token file at /tmp/e2e-token.txt (created by e2e-setup.ts)
#   - jq installed
#
# Environment:
#   E2E_VERBOSE=true   Show response bodies on success
#   API_BASE_URL       Override backend URL (default: http://localhost:8080)

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_URL="${API_BASE_URL:-http://localhost:8080}"
TOKEN_PATH="/tmp/e2e-token.txt"
QUICK_MODE=false
VERBOSE="${E2E_VERBOSE:-false}"

PASS=0
FAIL=0
SKIP=0

# Sample narrative (fictional, educational only — matches mockFactories.ts)
SAMPLE_NARRATIVE="55 year old male presenting with acute onset substernal chest pain radiating to left arm. Pain started 2 hours ago at rest. History of hypertension and hyperlipidemia. Vitals stable. EKG shows normal sinus rhythm. Troponin pending."

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------

for arg in "$@"; do
  case $arg in
    --quick) QUICK_MODE=true ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

pass() {
  PASS=$((PASS + 1))
  echo -e "  ${GREEN}PASS${NC} $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo -e "  ${RED}FAIL${NC} $1"
  if [ -n "${2:-}" ]; then
    # Truncate response to 300 chars
    echo -e "       ${RED}${2:0:300}${NC}"
  fi
}

skip() {
  SKIP=$((SKIP + 1))
  echo -e "  ${YELLOW}SKIP${NC} $1"
}

show_body() {
  if [ "$VERBOSE" = "true" ] && [ -n "${1:-}" ]; then
    echo -e "       ${CYAN}${1:0:300}${NC}"
  fi
}

# Assert HTTP status code
# Usage: assert_status "test name" $actual_status $expected_status "$response_body"
assert_status() {
  local name="$1" actual="$2" expected="$3" body="${4:-}"
  if [ "$actual" = "$expected" ]; then
    pass "$name (HTTP $actual)"
    show_body "$body"
  else
    if [ "$actual" = "429" ]; then
      fail "$name — got 429 (rate limited). Try again after cooldown." "$body"
    else
      fail "$name — expected HTTP $expected, got $actual" "$body"
    fi
  fi
}

# Assert jq expression is truthy
# Usage: assert_jq "test name" "$response_body" '.field != null'
assert_jq() {
  local name="$1" body="$2" expr="$3"
  local result
  result=$(echo "$body" | jq -r "$expr" 2>/dev/null) || result="jq_error"
  if [ "$result" = "true" ]; then
    pass "$name"
  else
    fail "$name — jq '$expr' returned '$result'" "$body"
  fi
}

# ---------------------------------------------------------------------------
# Startup checks
# ---------------------------------------------------------------------------

echo -e "\n${CYAN}E2E API Smoke Tests${NC}"
echo -e "Base URL: $BASE_URL"
echo -e "Mode: $([ "$QUICK_MODE" = "true" ] && echo "quick (core only)" || echo "full (core + LLM)")\n"

# Check backend is running
if ! curl -sf "$BASE_URL/health/live" > /dev/null 2>&1; then
  echo -e "${RED}ERROR: Backend not running at $BASE_URL${NC}"
  echo "Start it with: cd backend && pnpm dev"
  exit 1
fi
echo -e "${GREEN}Backend is running${NC}"

# Check token file
if [ ! -f "$TOKEN_PATH" ] || [ ! -s "$TOKEN_PATH" ]; then
  echo -e "${RED}ERROR: Token file missing or empty at $TOKEN_PATH${NC}"
  echo "Run setup first: make e2e-setup"
  exit 1
fi

TOKEN=$(cat "$TOKEN_PATH")
echo -e "${GREEN}Token loaded${NC} (${TOKEN:0:10}...)\n"

# ---------------------------------------------------------------------------
# Tier 1: Core (no LLM calls)
# ---------------------------------------------------------------------------

echo -e "${CYAN}--- Tier 1: Core ---${NC}\n"

# 1. Health checks (no auth)
echo "1. Health checks"

RESP=$(curl -sw "\n%{http_code}" "$BASE_URL/health/live" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "GET /health/live" "$HTTP" "200" "$BODY"

RESP=$(curl -sw "\n%{http_code}" "$BASE_URL/health/ready" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "GET /health/ready" "$HTTP" "200" "$BODY"
assert_jq "  firestore check is ok" "$BODY" '.checks.firestore == "ok"'

echo ""

# 2. Auth + User
echo "2. Auth + User"

RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE_URL/v1/whoami" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null)
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "POST /v1/whoami" "$HTTP" "200" "$BODY"
assert_jq "  has uid" "$BODY" '.uid != null'
assert_jq "  has plan" "$BODY" '.plan != null'
assert_jq "  has features.maxTokensPerRequest" "$BODY" '.features.maxTokensPerRequest > 0'
assert_jq "  remaining = limit - used" "$BODY" '(.remaining == (.limit - .used))'

echo ""

# 3. Libraries
echo "3. Libraries"

RESP=$(curl -sw "\n%{http_code}" "$BASE_URL/v1/libraries/tests" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "GET /v1/libraries/tests" "$HTTP" "200" "$BODY"

RESP=$(curl -sw "\n%{http_code}" "$BASE_URL/v1/libraries/cdrs" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "GET /v1/libraries/cdrs" "$HTTP" "200" "$BODY"

echo ""

# 4. Auth rejection
echo "4. Auth rejection"

RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE_URL/v1/whoami" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null)
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "POST /v1/whoami (no token) → 401" "$HTTP" "401" "$BODY"

echo ""

# 5. Section 2 data persistence (no LLM)
echo "5. Section 2 data persistence"

RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE_URL/v1/build-mode/process-section2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"encounterId":"e2e-build-test","content":"Labs ordered, troponin pending"}' 2>/dev/null)
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "POST /v1/build-mode/process-section2" "$HTTP" "200" "$BODY"
assert_jq "  has mdmPreview" "$BODY" '.mdmPreview != null'
assert_jq "  has submissionCount" "$BODY" '.submissionCount >= 0'

echo ""

# ---------------------------------------------------------------------------
# Tier 2: Full (LLM calls via Vertex AI)
# ---------------------------------------------------------------------------

if [ "$QUICK_MODE" = "true" ]; then
  echo -e "${YELLOW}--- Tier 2: Skipped (--quick mode) ---${NC}\n"
  SKIP=$((SKIP + 2))
else
  echo -e "${CYAN}--- Tier 2: Full (LLM calls, ~60-90s) ---${NC}\n"

  # 6. Build Mode round-trip
  echo "6. Build Mode round-trip"

  echo -n "   Processing Section 1... "
  RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE_URL/v1/build-mode/process-section1" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"encounterId\":\"e2e-build-test\",\"content\":\"$SAMPLE_NARRATIVE\"}" \
    --max-time 120 2>/dev/null)
  HTTP=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  echo ""
  assert_status "POST /v1/build-mode/process-section1" "$HTTP" "200" "$BODY"
  assert_jq "  differential is non-empty" "$BODY" '(.differential | length) > 0'
  assert_jq "  submissionCount >= 1" "$BODY" '.submissionCount >= 1'

  echo ""
  echo -n "   Finalizing... "
  RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE_URL/v1/build-mode/finalize" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"encounterId":"e2e-build-test","content":"Discharge home with follow-up"}' \
    --max-time 120 2>/dev/null)
  HTTP=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  echo ""
  assert_status "POST /v1/build-mode/finalize" "$HTTP" "200" "$BODY"
  assert_jq "  finalMdm.text is non-empty" "$BODY" '(.finalMdm.text | length) > 0'
  assert_jq "  finalMdm.json.reasoning exists" "$BODY" '.finalMdm.json.reasoning != null'

  echo ""

  # 7. Quick Mode
  echo "7. Quick Mode"

  echo -n "   Generating... "
  RESP=$(curl -sw "\n%{http_code}" -X POST "$BASE_URL/v1/quick-mode/generate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"encounterId\":\"e2e-quick-test\",\"narrative\":\"$SAMPLE_NARRATIVE\"}" \
    --max-time 120 2>/dev/null)
  HTTP=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  echo ""
  assert_status "POST /v1/quick-mode/generate" "$HTTP" "200" "$BODY"
  assert_jq "  mdm.text is non-empty" "$BODY" '(.mdm.text | length) > 0'
  assert_jq "  patientIdentifier.chiefComplaint is non-empty" "$BODY" '(.patientIdentifier.chiefComplaint | length) > 0'

  echo ""
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

TOTAL=$((PASS + FAIL + SKIP))
echo -e "${CYAN}--- Summary ---${NC}"
echo -e "  Total: $TOTAL  ${GREEN}Pass: $PASS${NC}  ${RED}Fail: $FAIL${NC}  ${YELLOW}Skip: $SKIP${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed.${NC}"
fi
