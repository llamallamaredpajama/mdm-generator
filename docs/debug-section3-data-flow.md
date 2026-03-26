# Debug Plan: Section 3 Finalize Data Flow Failure

**Date:** 2026-02-22
**Symptom:** "Encounter finalization: Request timed out. Please try again."
**Impact:** Section 3 submission produces no final MDM output

---

## Root Cause Summary

The Section 3 finalize flow has **two independent failure modes** that combine to guarantee failure:

1. **Client-side timeout** — The 60-second `AbortController` fires before Vertex AI completes generation for the largest prompt in the system.
2. **Response parsing bugs** — Even when Vertex AI responds in time, the parser fails to extract the MDM because it doesn't unwrap the `finalMdm` wrapper and uses wrong field names, producing an empty/fallback result.

Sections 1 and 2 work because they have smaller prompts (faster Vertex AI response) **and** their parsers correctly unwrap LLM response wrappers (`index.ts:583` for S1, `index.ts:764` for S2). Section 3's parser lacks this unwrapping.

---

## Bug Inventory

### BUG 1 (Critical): Missing `finalMdm` Response Wrapper Unwrap

**Files:** `backend/src/index.ts:970-983`

The prompt at `promptBuilderBuildMode.ts:296-334` instructs the LLM to return:

```json
{
  "finalMdm": {
    "complexityLevel": "High",
    "text": "Complete copy-pastable MDM text...",
    "json": { ... }
  }
}
```

But the parser does:

```typescript
const rawParsed = JSON.parse(cleanedText)
const candidate: FinalMdm = {
  text: rawParsed.text || '',     // ← undefined: text is at rawParsed.finalMdm.text
  json: {
    problems: rawParsed.json?.problems || rawParsed.problems || [],  // ← undefined
    ...
  },
}
```

**Result:** `candidate.text = ''` and all json fields are `[]` or `''`. The Zod schema accepts these empty values (it only validates types, not emptiness), so the "validated" result is a hollow MDM stub.

**Compare with Section 1** (`index.ts:582-585`):
```typescript
// Section 1 correctly unwraps:
if (!Array.isArray(rawParsed) && rawParsed?.differential && Array.isArray(rawParsed.differential)) {
  rawParsed = rawParsed.differential
}
```

**Compare with Section 2** (`index.ts:763-766`):
```typescript
// Section 2 correctly unwraps:
if (rawParsed.mdmPreview && typeof rawParsed.mdmPreview === 'object') {
  rawParsed = rawParsed.mdmPreview
}
```

**Section 3 is missing the equivalent unwrap logic.**

**Fix:** Add unwrap before field extraction:

```typescript
// After JSON.parse, unwrap the finalMdm wrapper
if (rawParsed.finalMdm && typeof rawParsed.finalMdm === 'object') {
  rawParsed = rawParsed.finalMdm
}
```

---

### BUG 2 (Critical): Prompt Output Schema ≠ Zod Schema Field Names

**Files:**
- Prompt schema: `promptBuilderBuildMode.ts:300-332`
- Zod schema: `buildModeSchemas.ts:115-128`
- Parser mapping: `index.ts:974-982`

| Prompt asks for         | Zod schema expects | Parser reads            | Match? |
|-------------------------|--------------------|-------------------------|--------|
| `problemsAddressed` (array of objects) | `problems` (string \| string[]) | `rawParsed.json?.problems` | NO — LLM returns `problemsAddressed` |
| (not requested)         | `differential` (string \| string[]) | `rawParsed.json?.differential` | NO — LLM has no `differential` in json |
| `dataReviewedOrdered` (object) | `dataReviewed` (string \| string[]) | `rawParsed.json?.dataReviewed` | NO — LLM returns `dataReviewedOrdered` as object |
| `riskAssessment` (object) | `risk` (string \| string[]) | `rawParsed.json?.risk` | NO — LLM returns `riskAssessment` as object |
| `clinicalReasoning` (string) | `reasoning` (string) | `rawParsed.json?.reasoning` | NO — LLM returns `clinicalReasoning` |
| `disposition` (object w/ decision, rationale, etc.) | `disposition` (string) | `rawParsed.json?.disposition` | NO — LLM returns object, schema expects string |
| `complexityLevel` ("High"/"Moderate"/"Low") | `complexityLevel` (`'low'`/`'moderate'`/`'high'`) | `rawParsed.json?.complexityLevel` | NO — case mismatch |

**Fix:** Two options (choose one):
- **Option A (Recommended):** Update the prompt output format to match the Zod schema field names and types
- **Option B:** Update the parser to map from prompt field names → schema field names with type coercion

---

### BUG 3 (Critical): `complexityLevel` Case Mismatch

**Files:**
- Prompt: `promptBuilderBuildMode.ts:298` — requests `"High" | "Moderate" | "Low"`
- Zod: `buildModeSchemas.ts:124` — validates `z.enum(['low', 'moderate', 'high'])`

When the LLM returns `"High"`, Zod validation fails → entire candidate is rejected → fallback stub MDM.

**Fix:** Either:
- Change prompt to request lowercase values, OR
- Add `.toLowerCase()` normalization in the parser before Zod validation

---

### BUG 4 (High): No Server-Side Timeout on Vertex AI Call

**File:** `backend/src/vertex.ts:42`

```typescript
const res = await model.generateContent({ contents })  // No timeout
```

The `generateContent()` call has no timeout configured. For Section 3, the accumulated prompt includes:
- Full Section 1 content + differential
- Full Section 2 content + MDM preview (JSON.stringify'd)
- Surveillance context (if enabled)
- CDR context (if applicable)
- Section 3 content
- Detailed output format specification

This is 4,000–7,000+ input tokens with `maxOutputTokens: 8192`. Generation can take 40–90 seconds depending on Vertex AI load.

**Fix:** Add a server-side timeout with `AbortController` or `Promise.race`:

```typescript
export async function callGeminiFlash(
  prompt: { system: string; user: string },
  timeoutMs: number = 55_000  // Must be less than client's 60s
): Promise<GenResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await model.generateContent({
      contents,
      // Pass abort signal if SDK supports it, or use Promise.race
    })
    // ...
  } finally {
    clearTimeout(timer)
  }
}
```

---

### BUG 5 (High): Client Timeout Too Short for Section 3

**File:** `frontend/src/lib/api.ts:360`

```typescript
'Encounter finalization',
60_000  // 60-second timeout
```

Section 3 is the largest prompt in the system. The pipeline:
- Firestore reads: ~200ms
- Token limit check: ~100ms
- Prompt construction: ~100ms
- **Vertex AI generation: 40–90 seconds** ← bottleneck
- Response parsing: ~200ms
- Firestore write: ~300ms
- **Total: 41–91 seconds**

The 60-second client timeout will fire during Vertex AI generation for most non-trivial encounters.

**Fix:** Increase to 120 seconds, OR implement streaming/polling (see Architecture Fix below).

---

### BUG 6 (Medium): Model Name May Be Incorrect

**File:** `backend/src/vertex.ts:19`

```typescript
model: 'gemini-3.1-pro-preview'
```

The function is named `callGeminiFlash` but uses `gemini-3.1-pro-preview`. Verify this model exists and is available in the project's Vertex AI region. If this is a valid model, its "pro" tier will be significantly slower than a "flash" model, exacerbating the timeout.

**Fix:** Verify model availability. Consider using a flash-tier model for faster generation, or at minimum rename the function to match the model being used.

---

### BUG 7 (Low): Stale UI After Backend-Completes-After-Client-Timeout

**Scenario:**
1. Client sends finalize request
2. At 60s, client `AbortController` fires → error toast shown
3. Backend continues processing, eventually writes `status: 'finalized'` to Firestore
4. `onSnapshot` listener in `useEncounter.ts:88` fires with finalized encounter
5. UI may show contradictory state (error toast + finalized encounter data)

**Fix:** Add reconciliation logic in `useEncounter.ts` to detect and clear the error state when `onSnapshot` delivers a finalized encounter.

---

## Data Flow Diagram (Current — Broken)

```
FRONTEND (useEncounter.ts:282)                    BACKEND (index.ts:864-1073)
─────────────────────────────                     ──────────────────────────

submitSection(3)
  │
  ├─ finalizeEncounter(id, content, token)  ──►  POST /v1/build-mode/finalize
  │   │                                           │
  │   │ 60s AbortController starts                ├─ Validate (Zod) ✓
  │   │                                           ├─ Authenticate (Firebase) ✓
  │   │                                           ├─ Fetch encounter from Firestore ✓
  │   │                                           ├─ Check S2 completed ✓
  │   │                                           ├─ Check submission count ✓
  │   │                                           ├─ Build prompt
  │   │                                           │   └─ S1 content + S1 response
  │   │                                           │   └─ S2 content + S2 response
  │   │                                           │   └─ S3 content
  │   │                                           │   └─ Surveillance + CDR context
  │   │                                           │
  │   │                                           ├─ callGeminiFlash(prompt) ◄── BUG 4: no timeout
  │   │                                           │   └─ gemini-3.1-pro-preview  ◄── BUG 6: model?
  │   │                                           │   └─ 8192 maxOutputTokens
  │   │                                           │   └─ ~40-90 seconds to complete
  │   │                                           │
  │   ├─ ⚡ 60s TIMEOUT FIRES ◄──────────── BUG 5: too short
  │   │   throw AbortError                        │ (backend still running)
  │   │                                           │
  │   └─ User sees:                               ├─ Parse JSON response ◄── BUG 1: no unwrap
  │      "Encounter finalization:                  │   rawParsed.text → undefined
  │       Request timed out."                      │   rawParsed.json → undefined  ◄── BUG 2
  │                                               │   complexityLevel case ◄── BUG 3
  │                                               │
  │                                               ├─ Zod validates empty stub → passes (!)
  │                                               ├─ Write empty MDM to Firestore
  │                                               └─ Return { ok: true, finalMdm: {text:'', ...} }
  │                                                    (but client already disconnected)
  │
  └─ onSnapshot fires with empty finalMdm ◄── BUG 7: contradicts error state
```

---

## Fix Plan (Ordered by Priority)

### Phase 1: Fix Response Parsing (Bugs 1, 2, 3)

These are the most critical because even with infinite timeout, the current parser produces empty output.

#### 1a. Add `finalMdm` wrapper unwrap (`index.ts`)

In the finalize endpoint, after `JSON.parse(cleanedText)` at line 971, add:

```typescript
let rawParsed = JSON.parse(cleanedText)

// Unwrap { "finalMdm": { ... } } wrapper if present (matches S1/S2 pattern)
if (rawParsed.finalMdm && typeof rawParsed.finalMdm === 'object') {
  rawParsed = rawParsed.finalMdm
}
```

#### 1b. Align prompt output format with Zod schema (`promptBuilderBuildMode.ts`)

Update the user prompt output format (lines 296-334) to request fields matching `FinalMdmSchema`:

```typescript
const user = [
  'TREATMENT AND DISPOSITION:',
  '---',
  section3Content,
  '---',
  '',
  'OUTPUT FORMAT (strict JSON):',
  '{',
  '  "text": "Complete copy-pastable MDM text following EM documentation standards",',
  '  "json": {',
  '    "problems": ["Problem 1", "Problem 2"],',
  '    "differential": ["Diagnosis 1 - reasoning", "Diagnosis 2 - reasoning"],',
  '    "dataReviewed": ["Lab: Result", "Imaging: Finding", "CDR: Score"],',
  '    "reasoning": "Clinical reasoning connecting all data to final assessment",',
  '    "risk": ["Risk factor 1", "Risk factor 2", "Highest risk element"],',
  '    "disposition": "Admit/Discharge/Transfer with rationale",',
  '    "complexityLevel": "low" | "moderate" | "high",',
  '    "regionalSurveillance": "Regional surveillance data summary, if available",',
  '    "clinicalDecisionRules": "CDR results summary, if applicable"',
  '  }',
  '}',
  '',
  'Generate the complete final MDM document.',
  'The "text" field must be ready for direct copy-paste into an EHR.',
].join('\n')
```

Key changes:
- Remove `finalMdm` wrapper — request flat `{ text, json }` structure
- Rename `problemsAddressed` → `problems` (string array)
- Rename `dataReviewedOrdered` → `dataReviewed` (string array)
- Rename `riskAssessment` → `risk` (string array)
- Rename `clinicalReasoning` → `reasoning` (string)
- Flatten `disposition` from object → string
- Use lowercase `complexityLevel` values

#### 1c. Add `complexityLevel` case normalization in parser (`index.ts`)

After extracting `complexityLevel`, normalize case:

```typescript
complexityLevel: (rawParsed.json?.complexityLevel || rawParsed.complexityLevel || 'moderate')
  .toString().toLowerCase(),
```

---

### Phase 2: Fix Timeout Issues (Bugs 4, 5)

#### 2a. Add server-side timeout to Vertex AI call (`vertex.ts`)

```typescript
export async function callGeminiFlash(
  prompt: { system: string; user: string },
  timeoutMs: number = 55_000
): Promise<GenResult> {
  // ... model setup ...

  const resultPromise = model.generateContent({ contents })
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Vertex AI generation timed out')), timeoutMs)
  )

  const res = await Promise.race([resultPromise, timeoutPromise])
  const text = res.response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return { text }
}
```

#### 2b. Increase client timeout for finalize (`api.ts`)

```typescript
// Change line 360 from 60_000 to 120_000
'Encounter finalization',
120_000
```

#### 2c. (Optional) Add progress indicator

In `useEncounter.ts`, add an intermediate state so the UI can show "Generating final MDM..." instead of a blank spinner for 2 minutes.

---

### Phase 3: Improve Resilience (Bug 6, 7)

#### 3a. Verify model name (`vertex.ts`)

Confirm `gemini-3.1-pro-preview` is a valid and available model in the project's Vertex AI region. If not, update to a known-good model. Consider using a flash-tier model for faster generation.

#### 3b. Add onSnapshot reconciliation (`useEncounter.ts`)

In the `onSnapshot` callback (line 88), check if the encounter is finalized while the UI is showing an error:

```typescript
// Inside onSnapshot callback, after setting encounter:
if (encounterData.status === 'finalized' && encounterData.section3?.llmResponse) {
  // Clear any stale error state — backend completed after client timeout
  setError(null)
}
```

---

### Phase 4: Reduce Prompt Size (Performance)

#### 4a. Summarize prior section data instead of including raw content

In `buildFinalizePrompt`, instead of including full Section 1/2 content:

```typescript
// Instead of full section1.content, use a truncated version
const s1Summary = section1.content.length > 500
  ? section1.content.slice(0, 500) + '...'
  : section1.content
```

#### 4b. Reduce `maxOutputTokens` for finalize

The current `8192` forces Vertex AI to potentially generate very long outputs. An MDM note is typically 500-1500 words. Reducing to `4096` would cut generation time significantly:

```typescript
generationConfig: {
  temperature: 0.2,
  topP: 0.95,
  maxOutputTokens: 4096,  // Reduced from 8192
},
```

Or better, make `maxOutputTokens` a parameter to `callGeminiFlash` so each endpoint can specify its needs.

---

## Verification Steps

After implementing fixes, verify:

1. **Backend build:** `cd backend && pnpm build` passes
2. **Manual test flow:**
   - Create encounter → submit S1 → submit S2 → submit S3
   - Verify S3 completes without timeout
   - Verify `finalMdm.text` is non-empty and contains actual MDM content
   - Verify `finalMdm.json` fields are populated
3. **Firestore check:** Verify the encounter document shows `status: 'finalized'` with populated `section3.llmResponse`
4. **Timeout test:** Simulate slow Vertex AI to verify client shows appropriate error (not empty MDM)
5. **Frontend check:** `cd frontend && pnpm check` passes

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `backend/src/index.ts` (lines 970-983) | Add `finalMdm` wrapper unwrap, fix field mapping, normalize complexityLevel | P0 |
| `backend/src/promptBuilderBuildMode.ts` (lines 289-338) | Align output format with Zod schema | P0 |
| `backend/src/vertex.ts` (line 42) | Add server-side timeout, verify model name | P1 |
| `frontend/src/lib/api.ts` (line 360) | Increase client timeout to 120s | P1 |
| `frontend/src/hooks/useEncounter.ts` (line 88) | Add onSnapshot reconciliation for post-timeout finalization | P2 |
| `backend/src/buildModeSchemas.ts` (lines 115-128) | No changes needed if prompt is updated to match | — |
