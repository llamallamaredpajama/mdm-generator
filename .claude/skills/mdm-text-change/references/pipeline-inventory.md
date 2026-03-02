# Pipeline Inventory & Architecture Patterns

Detailed file inventory, architectural pattern code examples, data flow diagrams, and scope discovery protocol for the MDM text change workflow.

## Complete File Inventory

Organized by pipeline node. Use the **Categories** column to determine which files are relevant to your change type.

### Node 1: Constants

| File | System | Categories |
|------|--------|------------|
| `backend/src/constants.ts` | All | A, C, D |

### Node 2: Schemas

| File | System | Categories |
|------|--------|------------|
| `backend/src/outputSchema.ts` | Legacy / Quick | A, D |
| `backend/src/buildModeSchemas.ts` | Build | A, D |

### Node 3: Prompt Builders

| File | System | Categories |
|------|--------|------------|
| `backend/src/promptBuilder.ts` | Legacy | A, C, D |
| `backend/src/promptBuilderBuildMode.ts` | Build | A, C, D |
| `backend/src/promptBuilderQuickMode.ts` | Quick | A, C, D |
| `backend/src/parsePromptBuilder.ts` | All | D |

### Nodes 5-6: Schema Parse + Field Extraction

| File | System | Categories | Notes |
|------|--------|------------|-------|
| `backend/src/index.ts` (~line 621) | Legacy / Quick | A, C, D | Fallback defaults |
| `backend/src/index.ts` (~line 1250) | Build | A, C, D | `extractFinalMdm()` alias chains |

### Node 8: Frontend Types

| File | System | Categories |
|------|--------|------------|
| `frontend/src/types/encounter.ts` | All | A, D |

### Node 9: Frontend Render

| File | System | Categories | Notes |
|------|--------|------------|-------|
| `frontend/src/routes/Output.tsx` | Legacy | B, C | `renderMdmText()` output display |
| `frontend/src/routes/Start.tsx` | All | B, C | Landing page attestation text |
| `frontend/src/routes/Compose.tsx` | All | B, C | Compose page attestation text |
| `frontend/src/components/build-mode/MdmPreviewPanel.tsx` | Build | B, D | SECTIONS array (S2 preview) |
| `frontend/src/components/build-mode/EncounterEditor.tsx` | Build | B, C | Finalized MDM display |
| `frontend/src/components/build-mode/QuickEncounterEditor.tsx` | Quick | B, C | Quick Mode attestation notice |

### Node 10: CSS

| File | System | Categories |
|------|--------|------------|
| `frontend/src/routes/Start.css` | All | B |
| `frontend/src/routes/Compose.css` | All | B |
| `frontend/src/components/build-mode/MdmPreviewPanel.css` | Build | B |
| `frontend/src/components/build-mode/EncounterEditor.css` | Build | B |
| `frontend/src/components/build-mode/QuickEncounterEditor.css` | Quick | B |

### Node 11: Tests

| File | System | Categories |
|------|--------|------------|
| `backend/src/__tests__/outputSchema.test.ts` | Legacy | A, C, D |
| `backend/src/__tests__/buildModeSchemas.test.ts` | Build | A, D |
| `backend/src/__tests__/promptBuilders.test.ts` | All | A, C |
| `backend/src/__tests__/routes.test.ts` | All | A, C, D |
| `backend/src/__tests__/helpers/mockFactories.ts` | All | A, C, D |
| `frontend/src/__tests__/` (27 files — search for affected terms) | varies | varies |

### Node 11: Documentation

| File | Categories | Notes |
|------|------------|-------|
| `docs/generator_engine.md` | A, C, D | Schema and engine documentation |
| `docs/mdm-gen-guide-v2.md` | A, C, D | Core prompt guide |
| `docs/mdm-gen-guide-build-s1.md` | A, D | Build Mode Section 1 prompt guide |
| `docs/mdm-gen-guide-build-s3.md` | A, C, D | Build Mode Section 3 / finalize prompt guide |
| `docs/prd.md` | A, C, D | Product requirements |
| `CLAUDE.md` | A, C, D | Project instructions |
| `.claude/agents/prompt-reviewer.md` | A, D | Review agent patterns |

### Conditional Files

Only relevant for Category D changes that modify the differential field structure or encounter document shape:

| File | System | Why Conditional |
|------|--------|----------------|
| `backend/src/services/cdrMatcher.ts` | Build | Reads differential items for CDR matching |
| `backend/src/services/cdrCatalogFormatter.ts` | Build | Formats CDR catalog for prompt injection |
| `backend/src/services/testCatalogFormatter.ts` | Build | Formats test catalog for prompt injection |
| `frontend/src/hooks/useEncounter.ts` | Build | `onSnapshot` defensive defaults (Pattern 3) |
| `frontend/src/components/build-mode/shared/getRecommendedTestIds.ts` | Build | Reads workup recommendations from S1 |
| `frontend/src/components/build-mode/shared/getIdentifiedCdrs.ts` | Build | Reads CDR analysis from S1 |
| `frontend/src/components/build-mode/shared/DashboardOutput.tsx` | Build | `getDifferential()` dual-shape extraction (Pattern 4) |

---

## Architectural Pattern Code Examples

### Pattern 1: Zod `.transform()` — One-Way Migration Gate

**Where:** `backend/src/outputSchema.ts:15-21`
**When:** Category A (field rename) in the Legacy/Quick Mode pipeline

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

**Rule:** This is a **one-way migration gate**. Old data flows through, but new data never uses the old field name. Never remove the old field acceptance — LLMs may still produce it.

### Pattern 2: `extractFinalMdm()` Alias Chains

**Where:** `backend/src/index.ts:1250-1266`
**When:** Category A (field rename) in the Build Mode finalize pipeline

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

**Rule:** When renaming a field, **add the old name as a new alias** in the chain — don't remove existing aliases. Also search both `j.` (nested under `json`) and `raw.` (top-level) because LLMs inconsistently nest their output.

### Pattern 3: `useEncounter.ts` Defensive Defaults

**Where:** `frontend/src/hooks/useEncounter.ts:90-130`
**When:** Category A or D — any change that adds or renames a field in the encounter document

```typescript
const encounterData: EncounterDocument = {
  // ...
  section2: {
    ...data.section2,
    selectedTests: data.section2?.selectedTests ?? [],
    testResults: data.section2?.testResults ?? {},
    allUnremarkable: data.section2?.allUnremarkable ?? false,
    pastedRawText: data.section2?.pastedRawText ?? null,
    workingDiagnosis: data.section2?.workingDiagnosis ?? undefined,
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

**Rule:** Any new optional field added to the encounter schema **must** have a corresponding default in this handler. Without it, a `null` Firestore value propagates as `null` into React components that expect `undefined` or a typed default.

### Pattern 4: Dual-Shape Extraction (`getDifferential()`)

**Where:** `frontend/src/components/build-mode/shared/DashboardOutput.tsx:65-72`
**When:** Category A or D — when an LLM response field changes structure over time

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

**Rule:** When changing an LLM response field's structure, create an extraction helper that handles both old and new shapes. Old Firestore documents retain the old shape indefinitely.

### Pattern 5: Conditional Prompt Numbering

**Where:** `backend/src/promptBuilderBuildMode.ts:477-489`
**When:** Any prompt modification that inserts or removes a numbered instruction

```typescript
'7. NEVER fabricate information - use only what was provided',
'8. Include the physician attestation at the end of the MDM text: "..."',
...(surveillanceContext ? [
  '9. Include regional surveillance data sources in the Data Reviewed section...',
  '10. Note any regional epidemiologic context...',
] : []),
```

**Rule:** After inserting/removing any numbered prompt instruction, verify all subsequent numbers are correct. Misnumbered instructions can confuse LLMs.

---

## Data Flow Diagrams

### Legacy One-Shot Pipeline

```
constants.ts ──→ outputSchema.ts ──→ promptBuilder.ts ──→ Vertex AI (Gemini)
                                                               │
                                                               ▼
                                                         LLM JSON response
                                                               │
                                                               ▼
                                              Zod .parse() + .transform()
                                              (outputSchema.ts — Pattern 1)
                                                               │
                                                               ▼
                                              renderMdmText() constructs text
                                              (outputSchema.ts:25-60)
                                                               │
                                                               ▼
                                              Express JSON response ──→ Output.tsx
                                                                        │
                                                                        ▼
                                                                   Copy-paste MDM
```

### Build Mode Pipeline (3-Section Progressive)

```
constants.ts ──→ buildModeSchemas.ts ──→ promptBuilderBuildMode.ts ──→ Vertex AI
                                                                          │
                                                                          ▼
                    ┌─────────────────────────────────────────── LLM JSON response
                    │                                                     │
                    │                                                     ▼
                    │                              extractFinalMdm() alias chains
                    │                              (index.ts:~1250 — Pattern 2)
                    │                                                     │
                    │                                                     ▼
                    │                              Firestore write (encounter doc)
                    │                                                     │
                    │                                                     ▼
                    │                              onSnapshot + defensive defaults
                    │                              (useEncounter.ts — Pattern 3)
                    │                                                     │
                    ▼                                                     ▼
              S2 Preview                                          Finalized MDM
        ┌─────────────────┐                                 ┌──────────────────┐
        │ MdmPreviewPanel │                                 │ EncounterEditor  │
        │ SECTIONS array  │                                 │ <pre>{text}</pre>│
        │ (structured)    │                                 │ (LLM text blob)  │
        └─────────────────┘                                 └──────────────────┘
```

### Quick Mode Pipeline

```
constants.ts ──→ outputSchema.ts ──→ promptBuilderQuickMode.ts ──→ Vertex AI
                                                                       │
                                                                       ▼
                                                                 LLM JSON response
                                                                       │
                                                                       ▼
                                                      Zod .parse() + .transform()
                                                      (same as Legacy — Pattern 1)
                                                                       │
                                                                       ▼
                                               Express JSON response ──→ QuickEncounterEditor.tsx
                                                                         │
                                                                         ▼
                                                                    Copy-paste MDM
```

---

## Scope Discovery Protocol

### Step 0 — Classify

Use the Scope Decision Tree in the main SKILL.md. The category determines which pipeline nodes are in scope.

### Step 1 — Grep for the old term

```bash
grep -ri "<old_term>" --include="*.ts" --include="*.tsx" --include="*.css" --include="*.md" .
```

Expect false positives — different features may use the same word in unrelated contexts.

### Step 2 — Filter results using architectural knowledge

Classify each hit as:
- **(a) Must change** — part of the MDM data pipeline for this change
- **(b) Intentionally retained** — backward-compat bridging code, migration gates
- **(c) Different feature** — same word, unrelated context (e.g., surveillance disclaimers vs. MDM disclaimers)

### Step 2.5 — Account for naming divergences (often missed)

Legacy uses `snake_case`, Build Mode uses `camelCase`. Search for **both** plus known aliases:

```bash
# Example: searching for a field related to "data reviewed"
grep -ri "data_reviewed_ordered" --include="*.ts" --include="*.tsx" .
grep -ri "dataReviewed" --include="*.ts" --include="*.tsx" .
grep -ri "dataReviewedOrdered" --include="*.ts" --include="*.tsx" .
```

Also check `extractFinalMdm()` alias chains in `index.ts` — the field may have additional aliases.

### Step 3 — Trace the data flow

```
Constants → Prompt instruction → LLM JSON response → Zod parse → API response → Frontend render
                                                          ↑
                                                 Fallback defaults (index.ts)
                                                 extractFinalMdm() aliases (index.ts)
```

### Exclusion Table Template

After discovery, document what you're NOT changing and why:

| Category | Example Files | Why Excluded |
|----------|---------------|--------------|
| Different feature using same term | *(files)* | *(rationale)* |
| Archived/frozen artifacts | *(files)* | *(rationale)* |
| Third-party/scraped content | *(files)* | *(rationale)* |
| Intentional backward-compat | *(files)* | *(rationale)* |
