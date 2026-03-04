# Skill Design Report: Full-Stack Text Change Skill

## 1. Overview

**Source document:** `docs/tmp/full-stack-text-change-report.md` (~1,079 lines, ~7,155 words)

**Goal:** Convert a comprehensive reference guide for executing text/language changes across the aiMDM's full stack into an actionable Claude Code skill that guides Claude through the process step-by-step.

---

## 2. Skill Name & File Location

**Skill name:** `mdm-text-change`

**Directory:** `.claude/skills/mdm-text-change/`

**File structure:**
```
.claude/skills/mdm-text-change/
├── SKILL.md                          (~1,800-2,200 words — core workflow)
├── references/
│   ├── pipeline-inventory.md         (~1,200 words — file inventory + architecture patterns)
│   └── case-study-attestation.md     (~800 words — condensed case study for reference)
```

**Rationale:** No `scripts/`, `examples/`, or `assets/` directories needed. The skill is procedural knowledge — the "scripts" are the grep commands and build commands embedded in the workflow. The case study is useful as a reference but too long for SKILL.md.

---

## 3. Frontmatter

```yaml
---
name: mdm-text-change
description: |
  This skill should be used when the user asks to "rename a field", "change text",
  "update a label", "rename a section", "change wording", "update attestation",
  "change display text", "rename a JSON field", "add a new MDM section",
  "change prompt text", or any modification to text, labels, field names, or language
  across the aiMDM codebase. Also triggers on "text change", "language change",
  "field rename", "schema rename", "update MDM output", or "change MDM wording".
  Provides a structured 10-phase workflow covering the 11-node data pipeline,
  backward compatibility patterns, and verification protocol.
---
```

**Trigger analysis:** The main trigger scenarios are:
- Direct requests: "rename X to Y", "change the text from X to Y"
- Feature work: "update the attestation wording", "add a new section to MDM output"
- Refactoring: "rename this field across the codebase"
- Bug-adjacent: "the old field name is still showing up"

---

## 4. Content Structure (SKILL.md)

The SKILL.md should follow this outline (~1,800-2,200 words):

### Section 1: Purpose (brief — 2-3 sentences)
What this skill does and when to use it.

### Section 2: Change Classification (essential — keep from source)
The 4-category taxonomy (A/B/C/D) and the decision tree. This is the **critical first step** — everything else depends on it. Keep the decision tree verbatim from the source.

### Section 3: Pipeline Skip-List (essential — keep the table)
The pipeline-node-by-category matrix. This is the core reference that determines which phases to execute. Keep verbatim.

### Section 4: The 11-Node Pipeline (condensed)
The node list with file paths — but trim the explanatory prose. Just the node names and canonical file paths. Point to `references/pipeline-inventory.md` for the full file inventory and architecture pattern details.

### Section 5: Architectural Patterns (condensed summary)
One-paragraph summary of each of the 5 patterns with the pattern name, location, and when to apply. Full code examples go in `references/pipeline-inventory.md`.

### Section 6: Execution Workflow (the core — 10 phases)
The 10-phase checklist, but adapted from the source:
- Convert from descriptive prose to **imperative instructions**
- Keep the phase structure (Phase 0-10)
- Keep the checkboxes — they serve as progress tracking
- Trim redundant "verify TypeScript compiles" to a single reminder pattern
- Keep file paths in each phase

### Section 7: Verification Protocol (essential — keep)
The grep sweep, allowed residuals table, and automated verification commands. This is the "done" criteria.

### Section 8: Additional Resources
Pointers to `references/pipeline-inventory.md` and `references/case-study-attestation.md`.

---

## 5. Key Sections: Keep vs. Trim vs. Move

### KEEP in SKILL.md (verbatim or near-verbatim)

**§2.1 Decision Framework table** — The 4-category taxonomy table is essential for classification:
```markdown
| Category | What Changes | Example | Complexity | Key Consideration |
|----------|-------------|---------|------------|-------------------|
| **A: Field Name Rename** | JSON key in schema | `disclaimers` → `attestation` | HIGH | Backward compat for Firestore data + LLM output variability |
| **B: Display Text Change** | UI label, no data change | "Differential Diagnosis" → "Differential Diagnoses" | LOW | Only rendering layers affected |
| **C: Content Value Change** | Default/generated text value | Reword attestation statement | MEDIUM | Constants + prompts + test assertions + fallback defaults |
| **D: Section Addition/Removal** | New/removed MDM section | Add "Complications Addressed" section | VERY HIGH | All layers + Firestore schema migration + new rendering path |
```

**§2.2 Scope Decision Tree** — Keep the full decision tree. It's the classification algorithm:
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

**§2.3 Pipeline Skip-List table** — Keep the full Category × Node matrix. This is THE core routing table:
```markdown
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
```

**§3.1 The 11-Node Model** — Keep the node list with file paths (the compact version):
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

**§3.2 Dual-System Architecture table** — Keep the system comparison table. Critical for knowing which files to touch:
```markdown
| Aspect | Legacy One-Shot | Build Mode | Quick Mode |
|--------|----------------|------------|------------|
| **Field naming** | `snake_case` | `camelCase` | Same as Legacy (`snake_case`) |
| **Schema file** | `outputSchema.ts` | `buildModeSchemas.ts` | Uses `outputSchema.ts` |
| **Prompt builder** | `promptBuilder.ts` | `promptBuilderBuildMode.ts` | `promptBuilderQuickMode.ts` |
| **Attestation handling** | Separate JSON field parsed by Zod | Embedded inline in LLM-generated `text` via prompt instruction | Separate JSON field (same as Legacy) |
| **Rendering** | `renderMdmText()` constructs text from structured fields | `MdmPreviewPanel.tsx` SECTIONS array (S2 preview) + `<pre>{text}</pre>` (finalized) | Same as Legacy |
| **Persistence** | None (stateless) | Firestore `encounters` collection | None (stateless) |
| **Field extraction** | Direct Zod parse | `extractFinalMdm()` alias chains (index.ts:1250) | Direct Zod parse |
```

**§3.3 Header Ownership table** — Keep this summary table:
```markdown
| Rendering Path | Who controls section headers? | Where to change them? |
|---------------|-------------------------------|----------------------|
| Legacy `renderMdmText()` | Hardcoded in function | `outputSchema.ts` |
| Build Mode S2 Preview | `SECTIONS` array | `MdmPreviewPanel.tsx` |
| Build Mode Finalized | LLM prompt instructions | `promptBuilderBuildMode.ts` |
| Quick Mode | Same as Legacy | `outputSchema.ts` |
```

**§7 Execution Checklist (Phases 0-10)** — Keep all phases but condense. See "Adaptation Notes" below.

**§8 Verification Protocol** — Keep grep sweep commands, allowed residuals table, and automated verification commands.

### MOVE to `references/pipeline-inventory.md`

- **§4 Architectural Patterns (full code examples)** — The 5 pattern code blocks are ~120 lines of TypeScript examples. Move them to references with brief summaries in SKILL.md.
- **§6 Complete File Inventory (all tables)** — The full file-by-node inventory tables. SKILL.md should reference this for detailed lookups.
- **§3.3 Three Rendering Paths (detailed prose)** — The extended explanations of each rendering path. Keep only the summary table in SKILL.md.
- **§5 Scope Discovery Protocol (detailed steps)** — Fold the essential parts into Phase 0 of the execution checklist; move the detailed exclusion table template and naming divergence examples to references.
- **§B.2 Data Flow Diagrams** — The ASCII pipeline diagrams for Legacy, Build Mode, and Quick Mode.

### MOVE to `references/case-study-attestation.md`

- **Appendix A (entire)** — The `disclaimer` → `attestation` case study (~280 lines). Condense to ~800 words covering: what changed, task breakdown, key decisions, commit structure. Useful as a concrete reference but not needed for every invocation.

### REMOVE entirely

- **§B.1 Scope Decision Matrix (Quick Reference)** — Exact duplicate of §2.3/§5.2. No need in any file.
- **§B.3 Key Architectural Patterns Summary** — Redundant with the condensed pattern summaries in SKILL.md.
- **§A.5 Commit Log table** — Too specific to the case study; not reusable.
- Explanatory paragraphs that describe *why* the guide exists (§1 Purpose extended prose) — convert to 2-3 sentences.

---

## 6. Adaptation Notes

### Voice conversion: Descriptive → Imperative

The source document uses descriptive/explanatory prose ("This is the canonical reference...", "Understanding the full chain prevents missed files..."). The skill must use imperative/infinitive form.

**Before (source):**
> "Every text or language change traverses a subset of this pipeline. Understanding the full chain — and where your change enters — prevents missed files and broken rendering."

**After (skill):**
> "Trace the change through the pipeline to identify all affected files. Work bottom-up: constants → schema → prompts → extraction → types → UI → tests → docs."

### Structure conversion: Reference doc → Step-by-step workflow

The source organizes by concept (taxonomy, pipeline, patterns, inventory, checklist, verification). The skill should organize by **workflow phase** with concepts inlined where needed.

Recommended SKILL.md flow:
1. Classify the change (taxonomy + decision tree)
2. Scope the work (skip-list table + discovery grep)
3. Execute phases (10 phases with checkboxes)
4. Verify (grep sweep + build gates)

### Checklist condensation

The source's Phase 0 (Classify + Scope) duplicates content from Sections 2 and 5. Merge them into a single Phase 0 in the skill. Similarly, Phases 8-9 (Tests + Documentation) can be slightly condensed since the file lists are in the references.

### Bottom-up ordering emphasis

The source mentions bottom-up ordering but doesn't enforce it structurally. The skill should make this THE organizing principle — each phase clearly states its pipeline node(s) and the phases are in strict bottom-up order.

### Conditional phase skipping

The source says "use the Category Taxonomy to determine which phases apply" but doesn't make this concrete enough. The skill should include a **quick-route table** at the top:

```markdown
| Category | Skip to | Phases to Execute |
|----------|---------|-------------------|
| A: Field Rename | Start at Phase 0 | All phases (0-10) |
| B: Display Text | Start at Phase 0, skip to Phase 6 | 0, 6, 7, 8, 9, 10 |
| C: Value Change | Start at Phase 0 | 0, 1, 3, 4, 6, 8, 9, 10 |
| D: Section Add/Remove | Start at Phase 0 | All phases (0-10) |
```

### Duplicate tables

The source has 3 copies of the pipeline skip-list matrix (§2.3, §5.2, §B.1). Keep exactly one in SKILL.md.

---

## 7. Size Analysis

### Source document
- **Lines:** 1,079
- **Words:** ~7,155
- **Sections:** 8 main + 2 appendices

### Target SKILL.md
- **Target:** 1,800-2,200 words (per skill-development best practices)
- **Strategy:** Keep all tables/decision trees verbatim (~800 words of tables). Condense prose around them (~1,000-1,400 words). Point to references for details.

### Target references/pipeline-inventory.md
- **Target:** ~1,200 words
- **Content:** Full file inventory tables (§6), architectural pattern code examples (§4), data flow diagrams (§B.2), rendering path details (§3.3 extended), scope discovery details (§5 extended)

### Target references/case-study-attestation.md
- **Target:** ~800 words
- **Content:** Condensed Appendix A — change overview, task breakdown, key decisions, excluded items rationale. Remove commit hashes and exact +/- counts (too specific).

### What's cut (~3,100 words removed)
- Duplicate tables (~600 words across 3 copies of the skip-list)
- Extended explanatory prose in §1, §3, §4 (~1,200 words)
- Appendix A execution details and commit log (~800 words)
- Appendix B redundant summaries (~500 words)

---

## 8. Verbatim Sections for SKILL.md

The following sections from the source should be included **verbatim or near-verbatim** in SKILL.md (Agent 2 can copy these directly):

### 8.1 Decision Framework Table (from §2.1)
Copy the 4-row category table exactly as shown in Section 5 "KEEP" above.

### 8.2 Scope Decision Tree (from §2.2)
Copy the full decision tree exactly as shown in Section 5 "KEEP" above.

### 8.3 Pipeline Skip-List (from §2.3)
Copy the 11-row pipeline node × category matrix exactly as shown in Section 5 "KEEP" above.

### 8.4 11-Node Pipeline List (from §3.1)
Copy the compact node list with file paths exactly as shown in Section 5 "KEEP" above.

### 8.5 Dual-System Architecture Table (from §3.2)
Copy the system comparison table exactly as shown in Section 5 "KEEP" above.

### 8.6 Header Ownership Table (from §3.3)
Copy the 4-row header ownership table exactly as shown in Section 5 "KEEP" above.

### 8.7 Verification Commands (from §8.4)
Copy the 4-step automated verification block:
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

### 8.8 Allowed Residuals Table (from §8.2)
Copy the 3-row allowed residuals table:
```markdown
| Location | What Remains | Why It's Correct |
|----------|-------------|-----------------|
| `outputSchema.ts` — raw schema | Old field name with `.optional()` | Zod `.transform()` migration gate — accepts old LLM output |
| `index.ts` — `extractFinalMdm()` | Old field name in alias chain | Alias chain — catches non-deterministic LLM naming |
| Documentation / this guide | References to old term | Documenting the change itself |
```

---

## 9. Verbatim Sections for `references/pipeline-inventory.md`

### 9.1 Complete File Inventory (from §6)
Copy ALL file inventory tables from §6 (Nodes 1, 2, 3, 5-6, 8, 9, 10, 11, 11-docs, conditional files). These are the definitive file lookup tables.

### 9.2 Architectural Pattern Code Examples (from §4)
Copy the 5 pattern code blocks with their explanations:
- Pattern 1: Zod `.transform()` — the `RawMdmSchema`/`MdmSchema` example (~25 lines)
- Pattern 2: `extractFinalMdm()` — the alias chain function (~20 lines)
- Pattern 3: `useEncounter.ts` defensive defaults — the `onSnapshot` handler (~20 lines)
- Pattern 4: Dual-shape `getDifferential()` — the extraction helper (~10 lines)
- Pattern 5: Conditional prompt numbering — the numbered instruction example (~8 lines)

Include the "Rule:" statement after each pattern — these are the key takeaways.

### 9.3 Data Flow Diagrams (from §B.2)
Copy all three ASCII pipeline diagrams (Legacy, Build Mode, Quick Mode).

### 9.4 Scope Discovery Details (from §5)
Copy the extended discovery steps (Steps 0-3), naming divergence examples, and the exclusion table template.

---

## 10. Quick-Route Table (new — not in source)

Add this to SKILL.md as a shortcut for common cases:

```markdown
### Quick Route by Category

| Category | Complexity | Phases to Execute | Typical Files Touched |
|----------|-----------|-------------------|----------------------|
| A: Field Rename | HIGH | All (0-10) | 20+ files |
| B: Display Text | LOW | 0, 6, 7, 8, 9 | 4-8 files |
| C: Value Change | MEDIUM | 0, 1, 3, 4, 6, 8, 9 | 10-15 files |
| D: Section Add/Remove | VERY HIGH | All (0-10) + migration planning | 25+ files |
```

---

## 11. Implementation Notes for Agent 2

1. **Create the directory structure first:** `mkdir -p .claude/skills/mdm-text-change/references`

2. **Write SKILL.md first**, then the two reference files. The SKILL.md must be self-contained enough to guide a simple Category B change without loading references.

3. **Use the existing `deploy-mdm` skill as a style reference** — it's already in this project at `.claude/skills/deploy-mdm/SKILL.md` and demonstrates the local conventions (imperative voice, checklist format).

4. **The execution phases (§7 from source) are the skeleton of SKILL.md** — restructure everything around them. The taxonomy, pipeline, and patterns are supporting context *for* the phases.

5. **Do NOT include `disable-model-invocation: true`** — this skill should be invocable by Claude automatically when it detects a text change task, unlike the deploy skill which requires explicit user invocation.

6. **Test trigger by mentally simulating:** "I need to rename the `risk` field to `riskAssessment`" — would the description match? "Change the wording of the attestation statement" — would it match? "Update the label on the differential section" — would it match? All three should trigger.

7. **The `references/case-study-attestation.md` is optional** — if the skill is already at the word limit, this can be omitted. The pipeline-inventory reference is the essential one.
