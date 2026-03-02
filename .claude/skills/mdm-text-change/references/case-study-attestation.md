# Case Study: Disclaimer → Physician Attestation

A combined **Category A** (field rename: `disclaimers` → `attestation`) + **Category C** (content value change: generic disclaimer → physician attestation statement) change executed across the full stack.

## What Changed

The MDM output's "disclaimer" section — historically containing `"Educational draft. Physician must review. No PHI."` — was replaced with a clinically appropriate physician attestation statement:

> *"This documentation was generated from the direct clinical input of the treating physician, based on the patient encounter as described. All content has been reviewed by the physician for accuracy and completeness."*

### Why

- **Compliance:** Attestation language aligns with how physician documentation is typically certified in medical records.
- **Tone:** Shifts from "be careful, AI wrote this" to "the physician authored this through their clinical input."
- **CLAUDE.md mandate:** The project requirements stated "Physician attestation statement always included in MDM output" — the codebase needed to match.

### Scope Summary

| Metric | Value |
|--------|-------|
| Files changed | 22 |
| Insertions | 267 |
| Deletions | 162 |
| Feature commits | 5 |
| Layers touched | Constants, schemas, prompts, API fallbacks, frontend UI, tests, docs |

## Task Breakdown

Six tasks executed in dependency order:

```
Task 1: Add shared constant          ← no dependencies
Task 2: Update backend schemas/prompts ← depends on Task 1
Task 3: Update frontend UI           ← depends on Task 2
Task 4: Update tests                 ← depends on Tasks 2-3
Task 5: Update documentation         ← depends on all above
Task 6: Merge + deploy               ← depends on Task 5
```

**Batch strategy:** Tasks 1-2 as backend batch, Task 3 as frontend batch, Tasks 4-5 as cleanup, Task 6 as deploy. Each batch committed separately for clean reviewability.

## Key Decisions

### 1. Shared Constant (Task 1)

Created `backend/src/constants.ts` with `PHYSICIAN_ATTESTATION` rather than inlining. This allows prompt builders, fallback logic, and tests to import from one canonical location without circular dependencies.

### 2. Zod `.transform()` Bridging (Task 2)

Applied Pattern 1: `outputSchema.ts` accepts both `disclaimers` (old) and `attestation` (new), normalizes to `attestation`. Old field kept with `.optional()` — LLMs may still produce it.

### 3. Build Mode Attestation (Task 2)

Build Mode handles attestation differently — it's embedded inline in the LLM-generated text blob via prompt instruction, not as a structured JSON field. Changed the finalize prompt instruction text, not a schema field.

### 4. BEM CSS Renames (Task 3)

Every CSS class containing `disclaimer` was renamed to `attestation` with corresponding JSX `className` updates: `.compose-disclaimer` → `.compose-attestation`, `.quick-encounter-editor__disclaimer` → `.quick-encounter-editor__attestation`, etc.

### 5. Backward-Compat Tests (Task 4)

Added explicit tests verifying: (a) old `disclaimers` field bridges to `attestation`, (b) `attestation` takes precedence when both fields present, (c) old field stripped from output.

## Explicitly Excluded (and Why)

| Category | Example Files | Why Excluded |
|----------|---------------|-------------|
| Surveillance disclaimers | `TrendResultsPanel.tsx`, `RegionalTrendsCard.tsx` | Different feature; "disclaimer" is semantically correct for trend data caveats |
| CDR disclaimers | `docs/Clinical Decision Rules.md` | Medical disclaimer about decision rules, not MDM output |
| BMAD planning docs | `_bmad/_memory/ios-architect-sidecar/` | Archived planning artifacts; frozen specs |
| Scraped reference content | `.firecrawl/litfl-procedures.md`, `.firecrawl/wikem-*.md` | Third-party web content, not project code |
| Backward-compat bridging | `outputSchema.ts` `disclaimers` field | Intentionally retained — Zod `.transform()` migration gate |

## Gap Analysis

The original execution correctly handled the Legacy pipeline but did not explicitly document:
1. Build Mode attestation handling via inline prompt instruction rather than a structured field
2. TypeScript type auto-inference from Zod schemas eliminating the need for manual type updates
3. Quick Mode prompt builder as a separate touch point

These gaps informed the creation of the Dual-System Architecture table and the 3-rendering-paths analysis in the main skill workflow.
