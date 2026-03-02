# Full-Stack MDM Text Change Guide

## 1. Purpose

This is the canonical reference for executing any text or language change across the MDM Generator's full stack. It covers:

- **All three MDM systems:** Legacy one-shot pipeline, Build Mode (3-section progressive workflow with Firestore persistence), and Quick Mode
- **The complete 11-node data pipeline** from constants through LLM output to frontend rendering
- **Architectural patterns** for backward compatibility, field extraction, and dual-shape handling
- **A categorized execution checklist** that scales from simple display text changes (touch 4 files) to full field renames (touch 20+ files)

This guide is structured as a reusable process, not a post-mortem. See **Appendix A** for a concrete case study (the `disclaimer` → `attestation` change) that illustrates the process end-to-end.

---

## 2. Change Category Taxonomy

Before touching code, classify your change. The category determines which pipeline nodes are in scope, which files to modify, and how much backward-compatibility work is needed.

### 2.1 Decision Framework

| Category | What Changes | Example | Complexity | Key Consideration |
|----------|-------------|---------|------------|-------------------|
| **A: Field Name Rename** | JSON key in schema | `disclaimers` → `attestation` | HIGH | Backward compat for Firestore data + LLM output variability |
| **B: Display Text Change** | UI label, no data change | "Differential Diagnosis" → "Differential Diagnoses" | LOW | Only rendering layers affected |
| **C: Content Value Change** | Default/generated text value | Reword attestation statement | MEDIUM | Constants + prompts + test assertions + fallback defaults |
| **D: Section Addition/Removal** | New/removed MDM section | Add "Complications Addressed" section | VERY HIGH | All layers + Firestore schema migration + new rendering path |

### 2.2 Scope Decision Tree

```
Does your change rename a JSON field key (the key itself, not its value)?
├─ Yes → Category A (full pipeline — all 11 nodes)
│        WARNING: Also check if the field name differs between Legacy
│        (snake_case) and Build Mode (camelCase) — you may need to
│        update both naming conventions.
│
└─ No → Does your change add or remove an entire MDM section?
    ├─ Yes → Category D (full pipeline + Firestore schema migration planning)
    │        WARNING: This is the highest-risk category. Consider whether
    │        the new section belongs in the structured JSON, the text blob,
    │        or both. Build Mode finalize generates a text blob; Legacy
    │        constructs text from structured fields.
    │
    └─ No → Does your change modify the text VALUE of a field (not the key)?
        ├─ Yes → Category C (constants + prompts + fallback defaults + tests)
        │        Scope: Nodes 1, 3, 5-6 (if fallbacks), 9 (if rendered), 11
        │
        └─ No → Category B (UI rendering + CSS + tests only)
                 Scope: Nodes 9, 10, 11 only
```

### 2.3 Pipeline Skip-List by Category

This table shows which pipeline nodes (from Section 3) require changes for each category. Use this to scope your work and avoid unnecessary file modifications.

| Pipeline Node | A: Field Rename | B: Display Text | C: Value Change | D: Section Add/Remove |
|---------------|:-:|:-:|:-:|:-:|
| 1. Constants | YES | — | YES | YES |
| 2. Zod Schemas | YES | — | — | YES |
| 3. Prompt Builders | YES | — | If value in prompt | YES |
| 4. LLM Output | *(consequence)* | *(consequence)* | *(consequence)* | *(consequence)* |
| 5. Schema Parse | YES | — | — | YES |
| 6. Field Extraction | YES (add alias) | — | — | YES |
| 7. API Response | *(consequence)* | — | — | YES |
| 8. Frontend Types | YES | — | — | YES |
| 9. Frontend Render | YES | YES | Maybe | YES |
| 10. CSS | If BEM class contains field name | If BEM class contains field name | — | YES |
| 11. Tests + Docs | YES | YES | YES | YES |

**Reading the table:** "YES" = you must check/modify this node. "—" = skip. "*(consequence)*" = this node is affected by upstream changes but you don't modify it directly.

---

## 3. The MDM Data Pipeline

### 3.1 The 11-Node Model

Every text or language change traverses a subset of this pipeline. Understanding the full chain — and where your change enters — prevents missed files and broken rendering.

```
Node 1:  Constants           → backend/src/constants.ts
Node 2:  Zod Schemas         → outputSchema.ts (Legacy/Quick) + buildModeSchemas.ts (Build Mode)
Node 3:  Prompt Builders     → promptBuilder.ts, promptBuilderBuildMode.ts,
                                promptBuilderQuickMode.ts, parsePromptBuilder.ts
Node 4:  LLM Output          → Vertex AI Gemini response (non-deterministic field naming)
Node 5:  Schema Parse        → Zod .parse() with .transform() for backward compat
Node 6:  Field Extraction    → extractFinalMdm() alias chains in index.ts
Node 7:  API Response        → Express JSON response to frontend
Node 8:  Frontend Types      → frontend/src/types/encounter.ts interfaces
Node 9:  Frontend Render     → Three distinct rendering paths (see §3.3)
Node 10: CSS                 → BEM class names (.component-field)
Node 11: Tests + Docs        → Backend + frontend tests, mock factories, documentation
```

**Why bottom-up ordering matters:** If you update the UI before the schema, the frontend will render fields the backend doesn't produce. If you update prompts before the schema, the LLM may output `attestation` but Zod will strip it as an unknown field. Always work bottom-up: constants → schema → prompts → extraction → types → UI → tests → docs. Each layer depends on the foundation beneath it.

### 3.2 Dual-System Architecture

The codebase has **two parallel MDM systems** with different conventions. A text change that appears in both systems requires updating both, and the update mechanisms differ.

| Aspect | Legacy One-Shot | Build Mode | Quick Mode |
|--------|----------------|------------|------------|
| **Field naming** | `snake_case` (`data_reviewed_ordered`) | `camelCase` (`dataReviewed`) | Same as Legacy (`snake_case`) |
| **Schema file** | `outputSchema.ts` | `buildModeSchemas.ts` | Uses `outputSchema.ts` |
| **Prompt builder** | `promptBuilder.ts` | `promptBuilderBuildMode.ts` | `promptBuilderQuickMode.ts` |
| **Attestation handling** | Separate JSON field parsed by Zod | Embedded inline in LLM-generated `text` via prompt instruction | Separate JSON field (same as Legacy) |
| **Rendering** | `renderMdmText()` constructs text from structured fields | `MdmPreviewPanel.tsx` SECTIONS array (S2 preview) + `<pre>{text}</pre>` (finalized) | Same as Legacy |
| **Persistence** | None (stateless) | Firestore `encounters` collection | None (stateless) |
| **Field extraction** | Direct Zod parse | `extractFinalMdm()` alias chains (index.ts:1250) | Direct Zod parse |

**Critical implication for field renames (Category A):** Searching for `data_reviewed_ordered` will miss `dataReviewed` and `dataReviewedOrdered`. You must search for *all naming conventions* — see Section 5, Step 2.5.

### 3.3 Three Rendering Paths

Text changes that affect how MDM content is displayed must account for all three rendering paths. Each has different ownership of section headers and content formatting.

#### Path 1: Legacy `renderMdmText()` — `outputSchema.ts:25-60`

Constructs copy-paste text from structured MDM fields. Section headers are **hardcoded strings** in this function:

```
"Differential:", "Data reviewed/ordered:", "Decision making:",
"Risk:", "Disposition:", "Attestation:"
```

If you rename a section header (e.g., "Attestation:" → "Physician Attestation:"), change it here. This function is also used as fallback rendering in Build Mode finalize when the LLM's text blob is empty.

#### Path 2: Build Mode S2 Preview — `MdmPreviewPanel.tsx:47-52`

The `SECTIONS` array maps field IDs to display titles:

```typescript
const SECTIONS: SectionItem[] = [
  { id: 'problems', title: 'Problems Addressed', icon: '!' },
  { id: 'differential', title: 'Differential Diagnosis', icon: '?' },
  { id: 'dataReviewed', title: 'Data Reviewed', icon: 'D' },
  { id: 'reasoning', title: 'Clinical Reasoning', icon: 'R' },
]
```

The `normalizeToString()` helper handles LLM output variability (string/array/object). Adding a section here requires adding to the `SECTIONS` array and handling it in `normalizeToString()`. Note: attestation is **not shown** in S2 preview — it only appears in the finalized text.

#### Path 3: Build Mode Finalized Text — `EncounterEditor.tsx:1377-1400`

Displays `finalMdmData.text` as a `<pre>` block:

```tsx
<pre>{finalMdmData.text}</pre>
```

The text blob is **entirely LLM-generated** — section headers and attestation are *inside the text*, controlled by prompt instructions in `promptBuilderBuildMode.ts`, not by frontend rendering logic. Changing a section header in the finalized MDM means changing the prompt instruction, not the component code.

**Summary of header ownership:**

| Rendering Path | Who controls section headers? | Where to change them? |
|---------------|-------------------------------|----------------------|
| Legacy `renderMdmText()` | Hardcoded in function | `outputSchema.ts` |
| Build Mode S2 Preview | `SECTIONS` array | `MdmPreviewPanel.tsx` |
| Build Mode Finalized | LLM prompt instructions | `promptBuilderBuildMode.ts` |
| Quick Mode | Same as Legacy | `outputSchema.ts` |

---

## 4. Architectural Patterns

These patterns recur every time you make a text or field change. They exist because LLMs are non-deterministic about field naming, Firestore documents persist across schema versions, and the codebase has two parallel MDM systems with different conventions.

### Pattern 1: Zod `.transform()` — One-Way Migration Gate

**Where:** `backend/src/outputSchema.ts:15-21`
**When:** Category A (field rename) in the Legacy/Quick Mode pipeline

When you rename a JSON field, existing Firestore documents and in-flight LLM responses still use the old name. A hard rename breaks parsing. Instead, accept both and normalize:

```typescript
// Accept BOTH old 'disclaimers' and new 'attestation' from LLM output
const RawMdmSchema = z.object({
  // ... other fields ...
  attestation: z.union([z.string(), z.array(z.string())]).optional(),
  disclaimers: z.union([z.string(), z.array(z.string())]).optional(),  // OLD name
})

export const MdmSchema = RawMdmSchema.transform((data) => {
  const { disclaimers, attestation, ...rest } = data
  return {
    ...rest,
    attestation: attestation ?? disclaimers ?? PHYSICIAN_ATTESTATION,
  }
})
```

**Properties:**
- New name takes precedence if both are present
- Falls back to old name for legacy data
- Falls back to constant when neither exists
- Old field is **stripped from output** — downstream code only sees the new name
- `z.infer<typeof MdmSchema>` produces the new type automatically — no manual type updates needed

**Rule:** This is a **one-way migration gate**. Old data flows through, but new data never uses the old field name. Never remove the old field acceptance — LLMs may still produce it.

### Pattern 2: `extractFinalMdm()` Alias Chains

**Where:** `backend/src/index.ts:1250-1266`
**When:** Category A (field rename) in the Build Mode finalize pipeline

LLMs are non-deterministic about field naming. The same prompt may produce `dataReviewed` in one call and `dataReviewedOrdered` in the next. The extraction function tries multiple alternative names in priority order:

```typescript
const extractFinalMdm = (raw: Record<string, unknown>): FinalMdm => {
  const j = (raw.json && typeof raw.json === 'object' ? raw.json : {}) as Record<string, unknown>
  return {
    text: (raw.text as string) || '',
    json: {
      problems: asStringOrArr(j.problems) || asStringOrArr(raw.problems)
        || flattenToStrings(j.problemsAddressed) || flattenToStrings(raw.problemsAddressed) || [],
      differential: asStringOrArr(j.differential) || asStringOrArr(raw.differential) || [],
      dataReviewed: asStringOrArr(j.dataReviewed) || asStringOrArr(raw.dataReviewed)
        || flattenNestedObj(j.dataReviewedOrdered) || flattenNestedObj(raw.dataReviewedOrdered) || [],
      reasoning: (j.reasoning || raw.reasoning
        || j.clinicalReasoning || raw.clinicalReasoning || '') as string,
      risk: asStringOrArr(j.risk) || asStringOrArr(raw.risk)
        || flattenNestedObj(j.riskAssessment) || flattenNestedObj(raw.riskAssessment) || [],
      disposition: stringifyDisposition(j.disposition || raw.disposition),
      complexityLevel: normalizeComplexity(j.complexityLevel || raw.complexityLevel),
    },
  }
}
```

**Alias chains visible:**
- `problems` → `problemsAddressed`
- `dataReviewed` → `dataReviewedOrdered`
- `reasoning` → `clinicalReasoning`
- `risk` → `riskAssessment`

**Rule:** When renaming a field, **add the old name as a new alias** in the chain — don't remove any existing aliases. The LLM may still produce any of them. Aliases also search both `j.` (nested under `json`) and `raw.` (top-level) because LLMs inconsistently nest their output.

### Pattern 3: `useEncounter.ts` Defensive Defaults

**Where:** `frontend/src/hooks/useEncounter.ts:90-130`
**When:** Category A or D — any change that adds or renames a field in the encounter document

Firestore documents may have `null` for fields not yet populated (e.g., a section 2 field before section 2 is submitted). The `onSnapshot` handler bridges Firestore `null` to TypeScript optional semantics:

```typescript
const encounterData: EncounterDocument = {
  // ...
  section2: {
    ...data.section2,
    selectedTests: data.section2?.selectedTests ?? [],
    testResults: data.section2?.testResults ?? {},
    allUnremarkable: data.section2?.allUnremarkable ?? false,
    pastedRawText: data.section2?.pastedRawText ?? null,
    workingDiagnosis: data.section2?.workingDiagnosis ?? undefined, // null → undefined
  },
  section3: {
    ...data.section3,
    treatments: data.section3?.treatments ?? undefined,
    disposition: data.section3?.disposition ?? null,
    followUp: data.section3?.followUp ?? [],
  },
  cdrTracking: data.cdrTracking ?? {},
  // ...
}
```

**Rule:** Any new optional field added to the encounter schema **must** have a corresponding default in this handler. Without it, a `null` Firestore value propagates as `null` into React components that expect `undefined` or a typed default, causing runtime errors.

### Pattern 4: Dual-Shape Extraction (`getDifferential()`)

**Where:** `frontend/src/components/build-mode/shared/DashboardOutput.tsx:65-72`
**When:** Category A or D — when an LLM response field changes structure over time

S1 `llmResponse` has a dual shape: old encounters store a flat `DifferentialItem[]`, new encounters store `{ differential, cdrAnalysis, workupRecommendations, processedAt }`. The extraction helper handles both:

```typescript
function getDifferential(llmResponse: unknown): DifferentialItem[] {
  if (Array.isArray(llmResponse)) return llmResponse as DifferentialItem[]
  if (llmResponse && typeof llmResponse === 'object' && 'differential' in llmResponse) {
    const wrapped = llmResponse as { differential?: unknown }
    if (Array.isArray(wrapped.differential)) return wrapped.differential as DifferentialItem[]
  }
  return []
}
```

**Rule:** When changing an LLM response field's structure, create an extraction helper that handles both old and new shapes. Old Firestore documents retain the old shape indefinitely — there is no migration step.

### Pattern 5: Conditional Prompt Numbering

**Where:** `backend/src/promptBuilderBuildMode.ts:477-489`
**When:** Any prompt modification that inserts or removes a numbered instruction

Build Mode prompts use numbered instructions where surveillance items are conditionally appended. Inserting a new instruction bumps all subsequent numbers:

```typescript
'7. NEVER fabricate information - use only what was provided',
'8. Include the physician attestation at the end of the MDM text: "..."',
...(surveillanceContext ? [
  '9. Include regional surveillance data sources in the Data Reviewed section...',
  '10. Note any regional epidemiologic context...',
] : []),
```

**Rule:** After inserting/removing any numbered prompt instruction, verify all subsequent numbers are correct. Misnumbered instructions can confuse LLMs — they may skip or duplicate items when numbers are inconsistent.

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
