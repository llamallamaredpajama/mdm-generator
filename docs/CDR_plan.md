# CDR Integration Plan — Nontechnical Explanation

## Where the Data Lives

The 116 clinical decision rules live in **a single markdown text file** sitting on the backend server (`backend/src/cdr/clinical-decision-rules.md`). When the server starts up, it reads that file once, parses it into structured pieces (by category and individual rule), and **holds it all in memory** — like reading a reference book and keeping it on your desk.

Intermediate results (which rules were selected, what scores were calculated) get saved to **Firestore** on the encounter document — the same place Build Mode already saves each section's progress. This is just storage between steps, not search.

## How Vertex AI Gets the Rules

**It's stuffed directly into the prompt.** That's it.

When a physician submits a narrative like "45-year-old male with chest pain," the server:

1. **Scans the narrative for keywords** — simple string matching, like ctrl+F. "Chest pain" matches the cardiovascular category. Within that category, it matches rules like HEART score, TIMI, Wells PE.
2. **Grabs the full text** of those matched rules from memory.
3. **Pastes them into the prompt** that gets sent to Gemini (Vertex AI), alongside the physician's narrative and the usual MDM instructions.

Gemini then reads everything in one go — the narrative, the CDR definitions, and the instructions — and generates the MDM with CDR scores calculated.

## What This Is NOT

- **Not semantic search** — no embeddings, no vector databases, no AI-powered retrieval. It's keyword matching: "chest pain" → cardiovascular rules.
- **Not searching Firestore** — Firestore just holds the encounter's in-progress data between Build Mode sections. The rules themselves never go into Firestore.
- **Not traditional RAG** — RAG typically means "use AI to search a knowledge base, then feed results to another AI." This skips the AI-search step entirely.

## What This IS

**Keyword-filtered prompt injection.** The closest analogy:

Imagine a doctor has a 500-page reference book. Instead of handing the entire book to a colleague for every consult, you look at the patient's complaint, flip to the 10-20 relevant pages, photocopy them, and hand those pages along with the patient chart. The colleague (Gemini) reads both together.

The "filtering" (picking which pages) is done by simple word matching on the server — no AI involved in that step. The AI only comes in when Gemini reads the selected rules and applies them to the patient narrative.

## Why Not Just Send All 116 Rules Every Time?

Cost and noise. The full file is ~36K tokens. Sending only the relevant rules cuts that to ~2-8K tokens per request — cheaper, and the AI performs better when it isn't wading through 100+ irrelevant rules about ankle sprains when the patient has chest pain.

---

# CDR Integration Plan — Technical Specification

## Context

The MDM Generator currently mentions 8 clinical decision rules (HEART, PERC, Wells, etc.) passively in `docs/mdm-gen-guide.md` — the model only references them if the physician explicitly mentions them. There is a comprehensive 116-rule CDR reference document (~36K tokens) covering 14 body system categories that is designed for LLM consumption (structured scoring criteria, calculation methods, interpretation thresholds).

**Goal:** Automatically detect which CDRs are applicable based on the patient narrative, actively calculate scores when sufficient data is present, and integrate results into the MDM output — following the same enrichment pattern already used for surveillance data.

**Key design constraint:** The CDR file is ~36K tokens. Rather than injecting all of it every time, we use a two-level selector (category → rule) to inject only relevant CDR definitions (~2-8K tokens per request) plus a compact CDR index (~1.5K tokens, always present) so the model knows what's available.

## Architecture Overview

```
Narrative → CDR Selector → Relevant CDR definitions → Prompt Augmenter → LLM Prompt
              ↓                                              ↓
         Category match                              CDR Index (always)
         Rule match                                  Full definitions (selected)
```

This mirrors the existing surveillance enrichment pattern:
- `surveillance/promptAugmenter.ts` → `cdr/cdrPromptAugmenter.ts`
- `surveillanceContext` on encounter doc → `cdrContext` on encounter doc
- Non-blocking (CDR selection failure must never prevent MDM generation)

## New Files

### 1. `backend/src/cdr/clinical-decision-rules.md`
Copy of the CDR source file. Single source of truth for all 116 rules. Organized by `# CATEGORY` headers with `## Rule Name` subheaders. Easy to update (just replace the file).

### 2. `backend/src/cdr/cdrLoader.ts`
Loads and parses the CDR markdown at startup.

```typescript
interface CdrRule {
  name: string           // "Canadian CT Head Rule (CCHR)"
  category: string       // "TRAUMA"
  fullText: string       // Complete markdown for this rule
  keywords: string[]     // Extracted from application/criteria text
}

interface CdrCategory {
  name: string           // "TRAUMA"
  rules: CdrRule[]
  fullText: string       // Complete markdown for entire category
}

export function loadCdrRules(): CdrCategory[]
export function getCdrIndex(): string  // Compact 1-line-per-rule index (~1.5K tokens)
```

- Parse by `# CATEGORY` and `## Rule Name` headers
- Extract keywords from each rule's "Application:" line for rule-level matching
- Generate compact index string at load time
- Cache in memory (loaded once at startup)

### 3. `backend/src/cdr/cdrSelector.ts`
Two-level keyword-based selection: category → rule.

```typescript
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  trauma: ['trauma', 'fall', 'mva', 'mvc', 'accident', 'injury', 'fracture', 'head injury', 'laceration', ...],
  cardiovascular: ['chest pain', 'cardiac', 'heart', 'palpitation', 'syncope', 'dvt', 'pe', 'afib', ...],
  pulmonary: ['shortness of breath', 'sob', 'dyspnea', 'cough', 'pneumonia', 'copd', 'asthma', ...],
  // ... all 14 categories
}

export function selectRelevantRules(text: string): CdrRule[]
export function selectRelevantRulesWithDifferential(text: string, differential: DifferentialItem[]): CdrRule[]
```

- `selectRelevantRules(narrative)`: Category keyword match, then rule keyword match within matched categories
- `selectRelevantRulesWithDifferential(text, differential)`: Also matches CDR applicability against diagnosis names from the differential (e.g., "PE" on differential → Wells PE + PERC + PESI)
- Returns matched CdrRule objects for injection

### 4. `backend/src/cdr/cdrPromptAugmenter.ts`
Builds CDR context string for prompt injection. Follows `surveillance/promptAugmenter.ts` pattern.

```typescript
const MAX_CDR_CHARS = 16000  // ~4K tokens budget for selected rule definitions

export function buildCdrContext(selectedRules: CdrRule[]): string
export function buildCdrContextForSection2(section1CdrContext: string, newRules: CdrRule[]): string
```

- Assembles: CDR index (always) + full definitions for selected rules (up to budget)
- If over budget: prioritize rules with more keyword matches (higher relevance score)
- Includes integration instructions for the model

## Modified Files

### 5. `backend/src/promptBuilderBuildMode.ts`

**Section 1** (`buildSection1Prompt`):
- Add `cdrContext?: string` parameter (like `surveillanceContext`)
- Append CDR context block with instructions:
  ```
  CLINICAL DECISION RULES REFERENCE:
  [CDR index + selected rule definitions]

  CDR INTEGRATION INSTRUCTIONS:
  1. Identify which CDRs may be applicable based on the presentation
  2. For each applicable CDR, note which data points from the narrative are present
  3. Calculate partial scores where sufficient data exists
  4. Flag CDRs that are applicable but need additional data (suggest what to order)
  5. Include CDR analysis in your reasoning for each relevant differential item
  ```

**Section 2** (`buildSection2Prompt`):
- Add `cdrContext?: string` parameter
- Add `section1CdrAnalysis?: string` parameter (carried from S1)
- Include CDR context + S1 CDR analysis in system prompt
- Update instructions:
  ```
  CDR INTEGRATION INSTRUCTIONS:
  1. Combine Section 1 data with new workup results for CDR calculation
  2. Calculate all applicable CDRs with complete data
  3. For CDRs with partial data, note what is still missing
  4. Include CDR scores in dataReviewed.clinicalDecisionRules
  5. Use CDR results to update differential probabilities
  ```

**Section 3** (`buildFinalizePrompt`):
- Add `cdrResults?: string` parameter (accumulated CDR results from S1+S2, no re-analysis)
- Include CDR results as context (like surveillance):
  ```
  === CLINICAL DECISION RULE RESULTS ===
  [CDR analysis from S1 + S2]
  ```
- Add instruction: "Include CDR results in the final MDM Data Reviewed section and reference in disposition reasoning where applicable"

### 6. `backend/src/promptBuilderQuickMode.ts`
- Add `cdrContext?: string` parameter to `buildQuickModePrompt`
- Append CDR context with one-shot instructions: identify, calculate, and report in a single pass

### 7. `backend/src/buildModeSchemas.ts`

**DifferentialItemSchema**: Add optional `cdrContext` field (string)
```typescript
cdrContext: z.string().optional()  // CDR applicability and partial scores
```

**MdmPreviewSchema**: Already has `clinicalDecisionRules` in output format. Add:
```typescript
cdrResults: z.string().optional()  // Accumulated CDR calculation results
```

**FinalMdmSchema**: Add:
```typescript
clinicalDecisionRules: z.union([z.string(), z.array(z.string())]).optional()
```

### 8. `backend/src/index.ts`

**Section 1 endpoint** (`/v1/build-mode/process-section1`):
- After auth/validation, run CDR selector on narrative content
- Build CDR context string
- Pass to `buildSection1Prompt` alongside surveillance context
- Store `cdrContext` on encounter doc in Firestore (like `surveillanceContext`)
- Extract `cdrAnalysis` from LLM response, store on encounter

**Section 2 endpoint** (`/v1/build-mode/process-section2`):
- Load stored S1 CDR context/analysis from encounter doc
- Run CDR selector on combined S1+S2 content (may find additional rules)
- Build CDR context for S2
- Pass to `buildSection2Prompt`
- Store `cdrResults` on encounter doc

**Section 3 endpoint** (`/v1/build-mode/finalize`):
- Load stored CDR results from encounter doc
- Pass as context to `buildFinalizePrompt` (no re-analysis)

**Quick Mode endpoint** (`/v1/quick-mode/generate`):
- Run CDR selector on narrative
- Build CDR context
- Pass to Quick Mode prompt builder

**Error handling**: CDR selection/injection is non-blocking. If CDR loading or selection fails, log the error and proceed without CDR context (same pattern as surveillance).

### 9. `docs/mdm-gen-guide.md`

Update CDR section (lines 64-74) from passive mention to active calculation:
```
Clinical Decision Rules: When the presentation matches the applicability criteria
for any clinical decision rule, you MUST:
1. Name the rule explicitly
2. Calculate the score using available data
3. State the interpretation and clinical implication
4. Note any missing data points needed for complete calculation
```

Remove the specific rule list (since the CDR index now handles this dynamically).

## Build Mode Data Flow

```
Section 1:
  Input: narrative
  CDR: selector(narrative) → cdrContext
  Output: differential + cdrAnalysis
  Store: encounter.cdrContext, encounter.section1.cdrAnalysis

Section 2:
  Input: workup results
  CDR: selector(S1+S2 text, differential) → expanded cdrContext
  Context: S1 cdrAnalysis passed in
  Output: mdmPreview + cdrResults
  Store: encounter.cdrResults

Section 3:
  Input: treatment/disposition
  CDR: encounter.cdrResults passed as read-only context
  Output: finalMdm (CDR results woven into text + json)
```

## Token Budget Analysis

| Component | Tokens |
|-----------|--------|
| CDR Index (always present) | ~1,500 |
| Selected rules (1-3 categories, filtered to relevant rules) | ~2,000-6,000 |
| CDR integration instructions | ~200 |
| **Total CDR addition per request** | **~3,700-7,700** |

Current prompt max (Section 3): ~11K tokens → with CDRs: ~15-19K tokens. Well within Gemini 3.1 Pro's 1M context.

Estimated per-request cost increase: ~$0.005-0.010 (negligible).

## Implementation Order

1. **CDR data layer**: `cdrLoader.ts` + copy CDR markdown file
2. **CDR selector**: `cdrSelector.ts` with keyword maps
3. **CDR prompt augmenter**: `cdrPromptAugmenter.ts`
4. **Schema updates**: `buildModeSchemas.ts` (add optional CDR fields)
5. **Prompt builder updates**: `promptBuilderBuildMode.ts` + `promptBuilderQuickMode.ts`
6. **Endpoint wiring**: `index.ts` (integrate CDR into request handlers)
7. **Guide update**: `docs/mdm-gen-guide.md`

## Verification

1. **Unit test CDR loader**: Verify all 14 categories and 116 rules parse correctly from markdown
2. **Unit test CDR selector**: Test keyword matching with sample narratives:
   - "45M with chest pain" → should select HEART, TIMI, Wells PE, PERC
   - "3yo fell off playground, hit head" → should select PECARN, CATCH, CHALICE
   - "72F with sudden severe headache" → should select Ottawa SAH, 6-Hour CT Rule
3. **Backend build**: `cd backend && pnpm build` passes
4. **Integration test**: Start backend dev server, submit test encounters through Build Mode API with curl:
   - Verify Section 1 response includes CDR analysis
   - Verify Section 2 response includes calculated CDR scores
   - Verify Section 3 final MDM text mentions CDR results
5. **Quick Mode test**: Submit narrative via Quick Mode, verify CDR inclusion
6. **Negative test**: Submit a simple narrative (e.g., "ankle sprain") that shouldn't trigger cardiovascular CDRs — verify only Ottawa Ankle Rules selected
7. **Failure test**: Temporarily break CDR file path — verify MDM generation still works (non-blocking)
8. **Frontend check**: `cd frontend && pnpm check` still passes (no frontend changes in this phase)
