# PR #7 (cdr-update) — Code Review

**Date**: 2026-02-28
**Branch**: worktree-cdr-update
**Reviewers**: code-reviewer, silent-failure-hunter, pr-test-analyzer, manual review

## Summary

PR replaces the old keyword-based CDR matching system (`cdr/cdrSelector.ts`, `cdr/cdrPromptAugmenter.ts`, `cdr/cdrLoader.ts`, `cdr/clinical-decision-rules.md`) with a Firestore vector search approach (`services/cdrCatalogSearch.ts`, `services/cdrCatalogFormatter.ts`, `services/embeddingService.ts`). Also redesigns the frontend CdrCard component with colored pills, progress squares, expand/collapse, and score display.

**Files changed**: 19 (+5,436 / -4,206)

---

## Critical Issues

None found.

## Important Issues

### 1. IMPORTANT: `onAnswerComponent` prop declared but not consumed
- **File**: `frontend/src/components/build-mode/shared/CdrCard.tsx:24,190`
- **Problem**: The `onAnswerComponent` callback is declared in `CdrCardProps` interface (line 24) but is NOT destructured in the component function (line 190). The parent `DashboardOutput.tsx:285` passes this prop, but CdrCard silently ignores it.
- **Impact**: Inline CDR component answering is broken — users can't answer CDR components from the card. This is a regression from the redesign.
- **Fix**: Destructure `onAnswerComponent` in the component function and wire it up to clickable component rows (or remove the prop from the interface if it's intentionally deferred).

### 2. IMPORTANT: Module-level `JSON.parse` crash risk
- **File**: `backend/src/services/embeddingService.ts:22`
- **Problem**: `JSON.parse(credentialsJson)` executes at module load time. If `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set but contains malformed JSON, the entire backend crashes at startup with an unhandled parse error.
- **Impact**: A single typo in the env var kills the service. This runs before any error handling middleware is available.
- **Fix**: Wrap in try/catch: `credentialsJson ? (() => { try { return JSON.parse(credentialsJson) } catch { return undefined } })() : undefined`. Or validate the JSON before using it.

## Minor Issues (Non-blocking)

### 3. Text truncation at arbitrary boundary
- **File**: `backend/src/services/cdrCatalogFormatter.ts:55-57`
- **Problem**: `output.slice(0, MAX_CHARS)` can cut in the middle of a CDR definition, leaving incomplete text for the LLM.
- **Impact**: Low — LLMs handle truncated context reasonably well. The 12K limit is generous.

## Silent Failure Analysis

### Non-blocking error handling (CORRECT)
- `cdrCatalogSearch.ts:35-38`: The catch block returns `[]` and logs a warning. This matches the project's "CDR enrichment must not block MDM generation" constraint.
- `index.ts` integration: All 3 call sites (S1, S2, Quick Mode) wrap CDR calls in try/catch with `console.warn`. Correct behavior.

### `doc.get('distance') ?? 1` fallback (ACCEPTABLE)
- `cdrCatalogSearch.ts:30`: Falls back to `1` (worst cosine distance) if the distance field is missing. Acceptable since this only affects ranking, not correctness.

## Test Coverage Analysis

### Covered
- `cdrCatalogFormatter.test.ts`: Tests empty input, output format, character limit
- `cdrCatalogSearch.test.ts`: Tests successful search with embedding stripping, error fallback to empty array
- `embeddingService.test.ts`: Tests single embedding, batch embeddings, empty input
- `CdrCard.test.tsx`: Updated tests match new UI structure (pills, status labels, merge behavior)
- `AccessibilityPass.test.tsx`: Updated for chevrons replacing dots

### Test Gaps (Non-blocking)
- No test for `generateEmbedding` when API returns wrong dimension count (error path)
- No test for `generateEmbeddings` batching behavior when texts > 100 (BATCH_LIMIT boundary)
- No integration test for the full search → format pipeline
