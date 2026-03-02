# Full-Stack MDM Text Change Guide

## 1. Purpose

> *Placeholder — written in Task 2*

---

## 2. Change Category Taxonomy

> *Placeholder — written in Task 2*

---

## 3. The MDM Data Pipeline

> *Placeholder — written in Task 3*

---

## 4. Architectural Patterns

> *Placeholder — written in Task 4*

---

## 5. Scope Discovery Protocol

> *Placeholder — written in Task 5*

---

## 6. Complete File Inventory

> *Placeholder — written in Task 6*

---

## 7. Execution Checklist

> *Placeholder — written in Task 7*

---

## 8. Verification Protocol

> *Placeholder — written in Task 8*

---

## Appendix A: Case Study — Disclaimer → Physician Attestation

> This case study illustrates the process described in the main sections above. It was a combined **Category A** (field rename: `disclaimers` → `attestation`) **+ Category C** (content value change: generic disclaimer → physician attestation statement) change executed across the Legacy one-shot pipeline.
>
> **Gap analysis:** The original execution correctly handled the Legacy pipeline but did not explicitly document: (1) Build Mode attestation handling via inline prompt instruction rather than a structured field, (2) TypeScript type auto-inference from Zod schemas eliminating the need for manual type updates, (3) Quick Mode prompt builder as a separate touch point.

### A.1 Change Overview

The MDM output's "disclaimer" section — historically containing `"Educational draft. Physician must review. No PHI."` — was replaced with a clinically appropriate **physician attestation** statement:

> *"This documentation was generated from the direct clinical input of the treating physician, based on the patient encounter as described. All content has been reviewed by the physician for accuracy and completeness."*

#### Why

The original disclaimer framing ("physician must review") positioned the tool's output as a *draft requiring validation*. The attestation framing positions it as physician-authored documentation that was *generated from their clinical input* — a more accurate description of how the tool is used in practice. This distinction matters for:

- **Compliance:** Attestation language aligns with how physician documentation is typically certified in medical records.
- **Tone:** Shifts from "be careful, AI wrote this" to "the physician authored this through their clinical input."
- **CLAUDE.md mandate:** The project's requirements already stated "Physician attestation statement always included in MDM output" — the codebase needed to match.

#### Scope Summary

| Metric | Value |
|--------|-------|
| Files changed | 22 |
| Insertions | 267 |
| Deletions | 162 |
| Feature commits | 5 |
| Merge commits | 1 |
| Layers touched | Constants, schemas, prompts, API fallbacks, frontend UI, tests, docs |

### A.2 Explicitly Excluded (and Why)

| Category | Example Files | Why Excluded |
|----------|---------------|-------------|
| Surveillance disclaimers | `TrendResultsPanel.tsx`, `RegionalTrendsCard.tsx`, `pdfGenerator.test.ts` | Different feature; "disclaimer" is semantically correct for trend data caveats |
| CDR disclaimers | `docs/Clinical Decision Rules.md` | Medical disclaimer about decision rules, not MDM output |
| BMAD planning docs | `_bmad/_memory/ios-architect-sidecar/` | Archived planning artifacts; frozen specs from iOS sidecar planning |
| Scraped reference content | `.firecrawl/litfl-procedures.md`, `.firecrawl/wikem-*.md` | Third-party web content, not project code |
| Wireframe docs | `docs/wireframes/README.md` | Historical UX wireframe references |
| Backward-compat bridging code | `outputSchema.ts` `disclaimers` field | Intentionally retained — see Section 4, Pattern 1 |

### A.3 Task Breakdown

#### 6 Tasks, Dependency-Ordered

```
Task 1: Add shared constant          ← no dependencies
Task 2: Update backend schemas/prompts ← depends on Task 1
Task 3: Update frontend UI           ← depends on Task 2 (needs to know the new field name)
Task 4: Update tests                 ← depends on Tasks 2-3
Task 5: Update documentation         ← depends on all above (describes final state)
Task 6: Merge + deploy               ← depends on Task 5
```

**Batch strategy:** Tasks 1–2 are a natural batch (backend). Task 3 is a batch (frontend). Tasks 4–5 are cleanup. Task 6 is deploy. Each batch was committed separately for clean `git bisect` and reviewability.

### A.4 Execution Details

#### Task 1: Add Shared Constant

**Commit:** `f97bc62` — `feat: add shared PHYSICIAN_ATTESTATION constant`

**Files modified:**
- `backend/src/constants.ts` (new file, 2 lines)

**Key decision:** Created a dedicated constants file rather than inlining in `outputSchema.ts`. This allows prompt builders, fallback logic, and tests to all import from one canonical location without circular dependencies.

```typescript
// backend/src/constants.ts
export const PHYSICIAN_ATTESTATION =
  'This documentation was generated from the direct clinical input of the treating physician, based on the patient encounter as described. All content has been reviewed by the physician for accuracy and completeness.'
```

**Verification:** `cd backend && pnpm build` (TypeScript compilation)

---

#### Task 2: Update Backend (Schema, Prompts, Fallbacks)

**Commit:** `3cb4379` — `feat: replace disclaimer with physician attestation in backend`

**Files modified (6):**

| File | Change |
|------|--------|
| `outputSchema.ts` | Zod `.transform()` bridging pattern (see Section 4, Pattern 1) |
| `promptBuilder.ts` | Legacy one-shot: `"disclaimers"` → `"attestation"` in JSON schema instructions |
| `promptBuilderBuildMode.ts` | Finalize prompt: add attestation instruction at position 8, bump surveillance to 9–10 |
| `promptBuilderQuickMode.ts` | Quick Mode: `"disclaimers"` → `"attestation"` in JSON schema instructions |
| `index.ts` | Import constant; update fallback/default MDM to use `attestation` field with constant value |
| `surveillance/pdfGenerator.ts` | "Disclaimers" section header → "Attestation" in PDF output |

**Key decisions:**
- All prompt builders were updated to instruct the LLM to use `"attestation"` as the JSON key
- The `renderMdmText()` function's section header changed from `"Notes:"` to `"Attestation:"`
- Fallback MDM in `index.ts` (used when LLM parse fails) was updated to use the constant

**Verification:**
```bash
cd backend && pnpm build  # TypeScript compiles clean
```

---

#### Task 3: Update Frontend UI

**Commit:** `78872ac` — `feat: replace disclaimer with attestation in frontend UI`

**Files modified (6):**

| File | Change |
|------|--------|
| `Start.tsx` | Landing page: disclaimer text → attestation language; restructured info section |
| `Start.css` | BEM class rename: `.start-disclaimer` → `.start-attestation` |
| `Compose.tsx` | Compose page: disclaimer text → attestation language |
| `Compose.css` | BEM class rename: `.compose-disclaimer` → `.compose-attestation` |
| `QuickEncounterEditor.tsx` | Quick Mode editor: disclaimer text → attestation notice |
| `QuickEncounterEditor.css` | BEM class rename: `.quick-encounter-editor__disclaimer` → `.quick-encounter-editor__attestation` |

**BEM CSS rename pattern:**

Every CSS class containing `disclaimer` was renamed to `attestation`:
```css
/* Before */
.compose-disclaimer { ... }

/* After */
.compose-attestation { ... }
```

And every JSX `className` reference was updated to match:
```tsx
{/* Before */}
<p className="compose-disclaimer">...</p>

{/* After */}
<p className="compose-attestation">...</p>
```

**Key decision:** The frontend text changes were more than simple find-replace. The attestation language is shorter and more authoritative than the old disclaimer text, so some UI layouts were adjusted (particularly `Start.tsx`, which was refactored from 183 lines to accommodate the new framing).

**Verification:**
```bash
cd frontend && pnpm dev  # Visual verification in browser
cd frontend && pnpm check  # typecheck + lint + test
```

---

#### Task 4: Update Tests

**Commit:** `5c61856` — `test: update tests for attestation field rename`

**Files modified (4):**

| File | Change |
|------|--------|
| `outputSchema.test.ts` | Updated existing tests + added backward-compat tests |
| `mockFactories.ts` | Mock MDM object: `disclaimers` → `attestation` |
| `promptBuilders.test.ts` | Prompt output assertions: "disclaimers" → "attestation" |
| `routes.test.ts` | API response assertions: `disclaimers` → `attestation` |

**New test cases added for backward compatibility:**

```typescript
it('bridges old disclaimers field to attestation', () => {
  const result = MdmSchema.parse({
    ...validMdm,
    disclaimers: 'Old disclaimer text',
  })
  expect(result.attestation).toBe('Old disclaimer text')
  expect((result as Record<string, unknown>).disclaimers).toBeUndefined()
})

it('prefers attestation over disclaimers when both provided', () => {
  const result = MdmSchema.parse({
    ...validMdm,
    attestation: 'New attestation',
    disclaimers: 'Old disclaimer',
  })
  expect(result.attestation).toBe('New attestation')
})
```

**Verification:**
```bash
cd backend && pnpm build  # Compiles
cd frontend && pnpm check  # Full gate: typecheck + lint + test
```

---

#### Task 5: Update Documentation

**Commit:** `f903d86` — `docs: update documentation for attestation language`

**Files modified (5):**

| File | Change |
|------|--------|
| `docs/generator_engine.md` | Schema documentation: `disclaimers` → `attestation`, document `.transform()` pattern |
| `docs/mdm-gen-guide-v2.md` | Core prompt guide: disclaimer references → attestation |
| `docs/prd.md` | Product requirements: disclaimer requirement → attestation requirement |
| `CLAUDE.md` | Project instructions: "Physician review disclaimer" → "Physician attestation statement" |
| `.claude/agents/prompt-reviewer.md` | Prompt reviewer agent: updated what to check for |

**Verification:**
```bash
grep -ri "disclaimer" docs/ --include="*.md" | grep -v "wireframe" | grep -v "Clinical Decision"
# Only expected hits: generator_engine.md documenting the .transform() bridge
```

---

#### Task 6: Merge + Deploy

**Commit:** `454bbb5` — `feat: replace disclaimer with physician attestation` (merge)

This was a worktree merge commit combining all 5 feature commits. The worktree workflow provided isolation during development.

### A.5 Commit Log

| # | Hash | Message | Files | +/- |
|---|------|---------|-------|-----|
| 1 | `f97bc62` | `feat: add shared PHYSICIAN_ATTESTATION constant` | 1 | +2/+0 |
| 2 | `3cb4379` | `feat: replace disclaimer with physician attestation in backend` | 6 | +32/-18 |
| 3 | `78872ac` | `feat: replace disclaimer with attestation in frontend UI` | 6 | +169/-100 |
| 4 | `5c61856` | `test: update tests for attestation field rename` | 4 | +45/-26 |
| 5 | `f903d86` | `docs: update documentation for attestation language` | 5 | +19/-18 |
| M | `454bbb5` | `feat: replace disclaimer with physician attestation` | 22 | +267/-162 |

---

## Appendix B: Architecture Reference

> *Placeholder — written in Task 8*
