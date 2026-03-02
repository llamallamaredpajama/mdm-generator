---
name: mdm-text-change
description: |
  This skill should be used when the user asks to "rename a field", "change text",
  "update a label", "rename a section", "change wording", "update attestation",
  "change display text", "rename a JSON field", "add a new MDM section",
  "change prompt text", or any modification to text, labels, field names, or language
  across the MDM Generator codebase. Also triggers on "text change", "language change",
  "field rename", "schema rename", "update MDM output", or "change MDM wording".
  Provides a structured 10-phase workflow covering the 11-node data pipeline,
  backward compatibility patterns, and verification protocol.
---

# Full-Stack MDM Text Change

Execute any text, label, field name, or language change across the MDM Generator's full stack. This skill covers all three MDM systems (Legacy, Build Mode, Quick Mode), the complete 11-node data pipeline, backward compatibility patterns, and a verification protocol.

Trace the change through the pipeline to identify all affected files. Work bottom-up: constants → schema → prompts → extraction → types → UI → tests → docs.

## 1. Classify the Change

Before touching code, classify the change. The category determines which pipeline nodes are in scope.

| Category | What Changes | Example | Complexity | Key Consideration |
|----------|-------------|---------|------------|-------------------|
| **A: Field Name Rename** | JSON key in schema | `disclaimers` → `attestation` | HIGH | Backward compat for Firestore data + LLM output variability |
| **B: Display Text Change** | UI label, no data change | "Differential Diagnosis" → "Differential Diagnoses" | LOW | Only rendering layers affected |
| **C: Content Value Change** | Default/generated text value | Reword attestation statement | MEDIUM | Constants + prompts + test assertions + fallback defaults |
| **D: Section Addition/Removal** | New/removed MDM section | Add "Complications Addressed" section | VERY HIGH | All layers + Firestore schema migration + new rendering path |

### Scope Decision Tree

```
Does your change rename a JSON field key (the key itself, not its value)?
├─ Yes → Category A (full pipeline — all 11 nodes)
│        WARNING: Also check if the field name differs between Legacy
│        (snake_case) and Build Mode (camelCase) — you may need to
│        update both naming conventions.
│
└─ No → Does your change add or remove an entire MDM section?
    ├─ Yes → Category D (full pipeline + Firestore schema migration planning)
    │        WARNING: This is the highest-risk category.
    │
    └─ No → Does your change modify the text VALUE of a field (not the key)?
        ├─ Yes → Category C (constants + prompts + fallback defaults + tests)
        │        Scope: Nodes 1, 3, 5-6 (if fallbacks), 9 (if rendered), 11
        │
        └─ No → Category B (UI rendering + CSS + tests only)
                 Scope: Nodes 9, 10, 11 only
```

### Quick Route by Category

| Category | Complexity | Phases to Execute | Typical Files Touched |
|----------|-----------|-------------------|----------------------|
| A: Field Rename | HIGH | All (0-10) | 20+ files |
| B: Display Text | LOW | 0, 6, 7, 8, 9 | 4-8 files |
| C: Value Change | MEDIUM | 0, 1, 3, 4, 6, 8, 9 | 10-15 files |
| D: Section Add/Remove | VERY HIGH | All (0-10) + migration planning | 25+ files |

## 2. Pipeline Skip-List

Use this table to determine which pipeline nodes require changes for each category.

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

**Reading the table:** "YES" = check/modify this node. "—" = skip. "*(consequence)*" = affected by upstream changes but not modified directly.

## 3. The 11-Node Pipeline

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
Node 9:  Frontend Render     → Three distinct rendering paths (see below)
Node 10: CSS                 → BEM class names (.component-field)
Node 11: Tests + Docs        → Backend + frontend tests, mock factories, documentation
```

### Dual-System Architecture

| Aspect | Legacy One-Shot | Build Mode | Quick Mode |
|--------|----------------|------------|------------|
| **Field naming** | `snake_case` | `camelCase` | Same as Legacy (`snake_case`) |
| **Schema file** | `outputSchema.ts` | `buildModeSchemas.ts` | Uses `outputSchema.ts` |
| **Prompt builder** | `promptBuilder.ts` | `promptBuilderBuildMode.ts` | `promptBuilderQuickMode.ts` |
| **Attestation handling** | Separate JSON field parsed by Zod | Embedded inline in LLM-generated `text` via prompt instruction | Separate JSON field (same as Legacy) |
| **Rendering** | `renderMdmText()` constructs text from structured fields | `MdmPreviewPanel.tsx` SECTIONS array (S2 preview) + `<pre>{text}</pre>` (finalized) | Same as Legacy |
| **Persistence** | None (stateless) | Firestore `encounters` collection | None (stateless) |
| **Field extraction** | Direct Zod parse | `extractFinalMdm()` alias chains (index.ts:1250) | Direct Zod parse |

**Critical:** Legacy uses `snake_case`, Build Mode uses `camelCase`. Always search for **both naming conventions** plus known aliases.

### Header Ownership

| Rendering Path | Who controls section headers? | Where to change them? |
|---------------|-------------------------------|----------------------|
| Legacy `renderMdmText()` | Hardcoded in function | `outputSchema.ts` |
| Build Mode S2 Preview | `SECTIONS` array | `MdmPreviewPanel.tsx` |
| Build Mode Finalized | LLM prompt instructions | `promptBuilderBuildMode.ts` |
| Quick Mode | Same as Legacy | `outputSchema.ts` |

## 4. Architectural Patterns (Summary)

Five patterns recur across text changes. See `references/pipeline-inventory.md` for full code examples.

1. **Zod `.transform()` migration gate** (`outputSchema.ts`) — Accept both old and new field names, normalize to new. Old field stays `.optional()`. Apply for Category A in Legacy/Quick.
2. **`extractFinalMdm()` alias chains** (`index.ts:~1250`) — Try multiple alternative names in priority order. Add old name as new alias; never remove existing aliases. Apply for Category A in Build Mode.
3. **`useEncounter.ts` defensive defaults** (`useEncounter.ts:90-130`) — Bridge Firestore `null` to TypeScript optional semantics. Every new optional field needs a `?? defaultValue` entry. Apply for Category A or D.
4. **Dual-shape extraction helpers** (`DashboardOutput.tsx`) — Handle both old and new LLM response shapes via extraction helper (e.g., `getDifferential()`). Apply when LLM response field structure changes.
5. **Conditional prompt numbering** (`promptBuilderBuildMode.ts`) — Numbered instructions with conditional surveillance items. After inserting/removing an instruction, verify all subsequent numbers are correct.

## 5. Execution Workflow

### Phase 0: Classify + Scope *(all categories)*

- [ ] Classify change using the **Scope Decision Tree** above: Category A / B / C / D
- [ ] Consult the **Pipeline Skip-List** to identify which phases apply
- [ ] Run discovery grep across all conventions:
  ```bash
  grep -ri "<old_term>" --include="*.ts" --include="*.tsx" --include="*.css" --include="*.md" .
  ```
- [ ] Search for **naming divergences** — Legacy `snake_case` AND Build Mode `camelCase` AND aliases:
  ```bash
  grep -ri "<snake_case_term>" --include="*.ts" --include="*.tsx" .
  grep -ri "<camelCaseTerm>" --include="*.ts" --include="*.tsx" .
  ```
- [ ] Check `extractFinalMdm()` alias chains in `index.ts:~1250` for additional aliases
- [ ] If Category A: determine if the field is persisted in Firestore — backward-compat required
- [ ] Document exclusions — what you're NOT changing and why
- [ ] Create a branch and commit plan

### Phase 1: Constants *(Categories A, C, D)*

**Pipeline node:** 1

- [ ] Add or update the canonical value in `backend/src/constants.ts`
- [ ] Verify no circular dependency issues (constants should be leaf imports)
- [ ] `cd backend && pnpm build` — confirm TypeScript compiles

### Phase 2: Backend Schemas *(Categories A, D)*

**Pipeline node:** 2

**Legacy / Quick Mode** — `backend/src/outputSchema.ts`:
- [ ] Add new field name to the Zod schema
- [ ] If Category A: retain old field name with `.optional()` for backward compat
- [ ] If Category A: add `.transform()` to normalize old → new (Pattern 1)

**Build Mode** — `backend/src/buildModeSchemas.ts`:
- [ ] Add/rename field in relevant section schema(s)
- [ ] Do NOT modify frozen request schemas (`Section1Request`, `Section2Request`, `FinalizeRequest`)

- [ ] `cd backend && pnpm build`

### Phase 3: Prompt Builders *(Categories A, C, D)*

**Pipeline node:** 3

- [ ] Update `backend/src/promptBuilder.ts` (Legacy) — JSON schema instructions + prompt text
- [ ] Update `backend/src/promptBuilderBuildMode.ts` (Build Mode) — section prompts + attestation instructions + verify conditional numbering (Pattern 5)
- [ ] Update `backend/src/promptBuilderQuickMode.ts` (Quick Mode) — JSON schema instructions
- [ ] If Category D: update `backend/src/parsePromptBuilder.ts` (narrative parser)
- [ ] `cd backend && pnpm build`

### Phase 4: Backend Fallbacks + Extraction *(Categories A, C, D)*

**Pipeline nodes:** 5-6

- [ ] Update fallback/default MDM in `backend/src/index.ts` (~line 621) — use new field name/value, import constant if applicable
- [ ] If Category A: update `extractFinalMdm()` alias chains in `index.ts` (~line 1250) — **add** old name as new alias, do NOT remove existing aliases (Pattern 2)
- [ ] `cd backend && pnpm build`

### Phase 5: Frontend Types + Hooks *(Categories A, D)*

**Pipeline node:** 8

- [ ] Update `frontend/src/types/encounter.ts` — new fields MUST be optional (`?`)
- [ ] Update `frontend/src/hooks/useEncounter.ts` `onSnapshot` handler — add defensive default `?? defaultValue` (Pattern 3)
- [ ] If changing LLM response shape: create/update extraction helper (Pattern 4)
- [ ] `cd frontend && pnpm check`

### Phase 6: Frontend UI *(all categories)*

**Pipeline node:** 9

- [ ] **Legacy:** Update `Output.tsx` — `renderMdmText()` section headers / content
- [ ] **Build Mode S2 preview:** Update `MdmPreviewPanel.tsx` — `SECTIONS` array field IDs and display titles
- [ ] **Build Mode finalized:** Update `EncounterEditor.tsx` — note: headers in LLM text blob, controlled by prompts (Phase 3)
- [ ] **Quick Mode:** Update `QuickEncounterEditor.tsx`
- [ ] **Other pages:** Update `Start.tsx`, `Compose.tsx` as needed
- [ ] `cd frontend && pnpm check`

### Phase 7: CSS *(Categories A, B, D — if BEM class contains the field name)*

**Pipeline node:** 10

- [ ] Rename BEM classes in affected CSS files (`Start.css`, `Compose.css`, `MdmPreviewPanel.css`, `EncounterEditor.css`, `QuickEncounterEditor.css`)
- [ ] Update every JSX `className` reference to match
- [ ] Visual verification: `cd frontend && pnpm dev` — check all affected pages

### Phase 8: Tests *(all categories)*

**Pipeline node:** 11

**Backend:**
- [ ] Update `outputSchema.test.ts`, `buildModeSchemas.test.ts`, `promptBuilders.test.ts`, `routes.test.ts`
- [ ] Update `mockFactories.ts` — mock data factories
- [ ] If Category A: add backward-compat tests (old field → new field bridging)
- [ ] `cd backend && pnpm build`

**Frontend:**
- [ ] Search `frontend/src/__tests__/` for affected terms and update assertions
- [ ] `cd frontend && pnpm check`

### Phase 9: Documentation *(all categories)*

**Pipeline node:** 11

- [ ] Update `docs/generator_engine.md` — schema and engine documentation
- [ ] Update `docs/mdm-gen-guide-v2.md` — core prompt guide
- [ ] If Build Mode affected: update `docs/mdm-gen-guide-build-s1.md`, `docs/mdm-gen-guide-build-s3.md`
- [ ] Update `docs/prd.md`, `CLAUDE.md`
- [ ] If prompt patterns changed: update `.claude/agents/prompt-reviewer.md`

### Phase 10: Deploy + Smoke Test

- [ ] Run full **Verification Protocol** (Section 6 below) before deploying
- [ ] Deploy order doesn't matter if backward-compat patterns are in place (frontend and backend can deploy independently)
- [ ] **Smoke test all three modes:** Legacy one-shot, Build Mode (S1→S2→finalize), Quick Mode
- [ ] Verify no errors in Cloud Run logs

## 6. Verification Protocol

After completing all execution phases, confirm no references to the old term remain in active code.

### Grep Sweep

```bash
grep -ri "<old_term>" \
  --include="*.ts" --include="*.tsx" --include="*.css" --include="*.md" \
  . | grep -v node_modules | grep -v dist | grep -v ".firecrawl"
```

### Allowed Residuals

Some hits are expected — these are intentional backward-compatibility mechanisms:

| Location | What Remains | Why It's Correct |
|----------|-------------|-----------------|
| `outputSchema.ts` — raw schema | Old field name with `.optional()` | Zod `.transform()` migration gate — accepts old LLM output |
| `index.ts` — `extractFinalMdm()` | Old field name in alias chain | Alias chain — catches non-deterministic LLM naming |
| Documentation / this guide | References to old term | Documenting the change itself |

If a hit doesn't fall into one of these categories, it's a missed update. Go back to the relevant phase and fix it.

### Automated Verification Commands

```bash
# 1. Backend compiles clean
cd backend && pnpm build

# 2. Frontend full gate (typecheck + lint + test)
cd frontend && pnpm check

# 3. Grep sweep — pipe to file for review
grep -ri "<old_term>" --include="*.ts" --include="*.tsx" --include="*.css" \
  . | grep -v node_modules | grep -v dist > /tmp/residuals.txt
cat /tmp/residuals.txt | wc -l  # Should match expected residual count

# 4. Confirm all three modes reference the new term
grep -r "<new_term>" backend/src/promptBuilder.ts         # Legacy
grep -r "<new_term>" backend/src/promptBuilderBuildMode.ts # Build Mode
grep -r "<new_term>" backend/src/promptBuilderQuickMode.ts # Quick Mode
```

## 7. References

- **`references/pipeline-inventory.md`** — Complete file inventory by pipeline node, architectural pattern code examples, data flow diagrams, and scope discovery details
- **`references/case-study-attestation.md`** — Condensed case study of the `disclaimer` → `attestation` change (Category A + C), illustrating the full workflow end-to-end
