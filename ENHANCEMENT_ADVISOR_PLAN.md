# Enhancement Advisor Implementation Plan — RESUMABLE

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to continue this plan from Batch 3.
> **Branch:** `mdm-guide-update` (worktree at `.claude/worktrees/mdm-guide-update/`)

---

## Progress Summary

**Completed (7/15 tasks):**
- [x] Task 1: Backend gap schemas
- [x] Task 2: Frontend types
- [x] Task 3: Prompt guide updates
- [x] Task 4: Build Mode prompt builder
- [x] Task 5: Quick Mode prompt builder + parser
- [x] Task 8: User profile gap tallies type
- [x] Task 9: Reprocess prompt builder

**Remaining (8/15 tasks):**
- [ ] Task 6: Finalize endpoint — return gaps
- [ ] Task 7: Quick Mode generate endpoint — return gaps
- [ ] Task 10: Reprocess + dismiss endpoints (blocked by 6, 7)
- [ ] Task 11: Frontend API functions
- [ ] Task 12: Frontend hooks — defensive defaults
- [ ] Task 13: EnhancementAdvisor component (blocked by 11)
- [ ] Task 14: Build Mode integration — EncounterEditor (blocked by 12, 13)
- [ ] Task 15: Quick Mode integration — QuickEncounterEditor (blocked by 12, 13)

**Recommended batches:**
- Batch 3: Tasks 6, 7, 11, 12 (all unblocked now)
- Batch 4: Tasks 10, 13
- Batch 5: Tasks 14, 15
- Post: Run `/simplify`, full test suite, commit & push

**Changed files so far (9 files, +503 lines):**
```
backend/src/__tests__/buildModeSchemas.test.ts    +148
backend/src/__tests__/promptBuilders.test.ts      +143
backend/src/buildModeSchemas.ts                   +61
backend/src/promptBuilderBuildMode.ts             +14
backend/src/promptBuilderQuickMode.ts             +19
backend/src/promptBuilderReprocess.ts             NEW (created)
backend/src/services/userService.ts               +8
docs/mdm-gen-guide-build-s3.md                    +16
docs/mdm-gen-guide-v2.md                          +53
frontend/src/types/encounter.ts                   +43
```

---

## What Was Built (Completed Tasks Detail)

### Task 1: Backend Gap Schemas (`backend/src/buildModeSchemas.ts`)
Added after `FinalizeResponseSchema`, before "Structured Data Schemas":
- `GapBenefitCategorySchema` — `z.enum(['billing', 'medicolegal', 'care'])`
- `GapAcquisitionMethodSchema` — `z.enum(['history', 'data_collection', 'clinical_action'])`
- `GapToggleItemSchema` — `{ id, label, defaultValue }`
- `GapItemSchema` — `{ id, category, method, title, description, toggleItems }`
- `GapsListSchema` — `z.array(GapItemSchema)`
- `safeParseGaps(raw: unknown): GapItem[]` — filters out malformed items, never throws
- `BuildModeReprocessRequestSchema` — `{ encounterId, userIdToken, gapResponses }`
- `QuickModeReprocessRequestSchema` — same shape

All types exported. Tests in `buildModeSchemas.test.ts` (55 tests pass).

### Task 2: Frontend Types (`frontend/src/types/encounter.ts`)
- Added `GapBenefitCategory`, `GapAcquisitionMethod`, `GapToggleItem`, `EnhancementGap` types (before `QuickModeData`)
- Extended `QuickModeData` with: `gaps?`, `enhancementDismissed?`, `enhancementReprocessed?`, `reprocessedMdmOutput?`
- Extended `Section3Data.llmResponse` with: `gaps?`, `reprocessedMdm?`, `reprocessedAt?`
- Extended `EncounterDocument` with: `enhancementDismissed?`, `enhancementReprocessed?`

### Task 3: Prompt Guide Updates
- `docs/mdm-gen-guide-v2.md`: Added §2.10 Documentation Gap Analysis (after §2.9, before §3) — canonical gap ID table (20 IDs), benefit categories, acquisition methods, toggle item design rules
- `docs/mdm-gen-guide-build-s3.md`: Added "Documentation Gap Analysis" section (before "Critical Rules") with Build Mode-specific context instructions

### Task 4: Build Mode Prompt Builder (`backend/src/promptBuilderBuildMode.ts`)
- Modified `buildFinalizePrompt()` user prompt: added `"gaps"` array to JSON output format spec
- Added instruction #9 to system prompt CRITICAL REQUIREMENTS referencing §2.10

### Task 5: Quick Mode Prompt Builder (`backend/src/promptBuilderQuickMode.ts`)
- Added `import { safeParseGaps, type GapItem } from './buildModeSchemas.js'`
- Extended `QuickModeGenerationResult` with `gaps: GapItem[]`
- Added `"gaps"` array to response format in system prompt
- Updated `parseQuickModeResponse()` — both primary and fallback paths now call `safeParseGaps(parsed.gaps)`
- Updated `getQuickModeFallback()` — returns `gaps: []`

### Task 8: User Profile (`backend/src/services/userService.ts`)
- Extended `UserDocument` with `gapTallies?: { identified: Record<string, number>, confirmed: Record<string, number> }`

### Task 9: Reprocess Prompt Builder (`backend/src/promptBuilderReprocess.ts`)
- NEW FILE. Exports `buildBuildModeReprocessPrompt()` and `buildQuickModeReprocessPrompt()`
- System prompt: REPROCESS_SYSTEM with rules for enhancing existing MDM
- Build mode: loads S3 guide, includes all 3 section contents + original MDM + formatted gap responses
- Quick mode: loads v2 guide, includes narrative + original MDM + formatted gap responses
- Output format: JSON `{ text, json }` — no gaps array (one-time reprocessing)

---

## Remaining Tasks (Detailed Instructions)

### Task 6: Finalize Endpoint — Return Gaps

**File:** `backend/src/index.ts`

**Key line numbers** (from current state of the file):
- Finalize endpoint starts: L1270
- `extractFinalMdm` defined: L1440-1458
- `extractFinalMdm` called: L1468 (primary), L1490 (fallback)
- Firestore update: L1525-1536
- Response JSON: L1548-1552

**Steps:**

1. Add to imports (around L15-35):
```typescript
import { safeParseGaps } from './buildModeSchemas'
```

2. After `extractFinalMdm(rawParsed)` call (L1468), extract gaps:
```typescript
const gaps = safeParseGaps(rawParsed.gaps)
```

3. Do the same in the fallback parse path (around L1490):
```typescript
const fallbackGaps = safeParseGaps(jsonObj.gaps)
```
Make sure the `gaps` variable is accessible to both the Firestore write and response (may need to declare `let gaps: GapItem[] = []` before the try/catch).

4. Include gaps in Firestore update (L1525-1536):
```typescript
await encounterRef.update({
  'section3.content': content,
  'section3.llmResponse': {
    finalMdm,
    gaps,  // <-- ADD
    processedAt: admin.firestore.Timestamp.now(),
  },
  // ... rest unchanged
})
```

5. Include gaps in API response (L1548-1552):
```typescript
return res.json({
  ok: true,
  finalMdm,
  gaps,  // <-- ADD
  quotaRemaining: stats.remaining,
})
```

6. After Firestore encounter update, increment gap tallies:
```typescript
if (gaps.length > 0) {
  const tallyUpdates: Record<string, FirebaseFirestore.FieldValue> = {}
  for (const gap of gaps) {
    tallyUpdates[`gapTallies.identified.${gap.id}`] = admin.firestore.FieldValue.increment(1)
  }
  await getDb().collection('customers').doc(uid).update(tallyUpdates)
}
```

**Verify:** `cd backend && pnpm build`

### Task 7: Quick Mode Generate Endpoint — Return Gaps

**File:** `backend/src/index.ts`

**Key line numbers:**
- Quick mode endpoint starts: L1961
- `parseQuickModeResponse` called: L2103 — `result` now has `.gaps`
- Firestore update: L2125-2142
- Response JSON: L2153-2160

**Steps:**

1. Include gaps in Firestore update (L2125-2142):
```typescript
await encounterRef.update({
  'quickModeData.status': 'completed',
  'quickModeData.narrative': narrative,
  'quickModeData.patientIdentifier': result.patientIdentifier,
  'quickModeData.mdmOutput': {
    text: result.text,
    json: result.json,
  },
  'quickModeData.gaps': result.gaps,  // <-- ADD
  'quickModeData.processedAt': admin.firestore.Timestamp.now(),
  // ... rest unchanged
})
```

2. Include gaps in API response (L2153-2160):
```typescript
return res.json({
  ok: true,
  mdm: { text: result.text, json: result.json },
  patientIdentifier: result.patientIdentifier,
  gaps: result.gaps,  // <-- ADD
  quotaRemaining,
  // ... rest
})
```

3. Increment gap tallies (same pattern as Task 6).

**Verify:** `cd backend && pnpm build`

### Task 10: Reprocess + Dismiss Endpoints

**File:** `backend/src/index.ts`

**Dependencies:** Tasks 6 and 7 must be done first.

**Steps:**

1. Add imports:
```typescript
import { BuildModeReprocessRequestSchema, QuickModeReprocessRequestSchema } from './buildModeSchemas'
import { buildBuildModeReprocessPrompt, buildQuickModeReprocessPrompt } from './promptBuilderReprocess'
```

2. Add `POST /v1/build-mode/reprocess` endpoint (after finalize endpoint):
   - Uses `llmLimiter`
   - Validates with `BuildModeReprocessRequestSchema`
   - Auth via body token (Build Mode quirk)
   - Verifies encounter ownership + `status === 'finalized'`
   - One-shot guard: if `encounter.enhancementReprocessed === true`, return 400
   - Pro+ check: `userPlan === 'free'` → 403
   - Builds prompt via `buildBuildModeReprocessPrompt()`
   - Calls `callGemini(prompt, 90_000)`
   - Parses response using `extractFinalMdm` pattern
   - Updates Firestore: `section3.llmResponse.reprocessedMdm`, `section3.llmResponse.reprocessedAt`, `enhancementReprocessed: true`
   - Increments `gapTallies.confirmed` for gaps with any YES responses
   - Returns `{ ok: true, finalMdm: reprocessedMdm }`

3. Add `POST /v1/quick-mode/reprocess` endpoint (after quick-mode/generate):
   - Same pattern but reads from `quickModeData`
   - Original MDM: `encounter.quickModeData?.mdmOutput?.text`
   - Narrative: `encounter.quickModeData?.narrative`
   - Uses `buildQuickModeReprocessPrompt()`
   - Stores result at `quickModeData.reprocessedMdmOutput`
   - Sets `quickModeData.enhancementReprocessed: true`

4. Add `POST /v1/enhancement-advisor/dismiss` endpoint:
   - Auth via Bearer header OR body token
   - Takes `{ encounterId, mode }` — mode is `'build'` or `'quick'`
   - Build mode: updates `enhancementDismissed: true`
   - Quick mode: updates `quickModeData.enhancementDismissed: true`
   - Returns `{ ok: true }`

**Important implementation notes:**
- `extractFinalMdm` is defined inline at L1440-1458. Either extract it to a shared helper or duplicate the pattern.
- The `getDb()` pattern: `const getDb = () => admin.firestore()` (L847)
- `callGemini` import already exists at L13
- For user plan check, read from `customers` collection: `const userDoc = await getDb().collection('customers').doc(uid).get()`
- CDR context for reprocess: check if `encounter.cdrTracking` exists and format it. The `cdrTrackingBuilder.ts` service may have a formatter — check `backend/src/services/cdrTrackingBuilder.ts`.

**Verify:** `cd backend && pnpm build`

### Task 11: Frontend API Functions

**File:** `frontend/src/lib/api.ts`

**Steps:**

1. Add import:
```typescript
import type { EnhancementGap } from '../types/encounter'
```

2. Update `FinalizeResponse` interface (L351-354):
```typescript
export interface FinalizeResponse {
  finalMdm: FinalMdm
  gaps: EnhancementGap[]  // <-- ADD
  quotaRemaining: number
}
```

3. Update `QuickModeResponse` interface (L460-468):
```typescript
export interface QuickModeResponse {
  ok: boolean
  mdm: { text: string; json: Record<string, unknown> }
  patientIdentifier: PatientIdentifier
  gaps: EnhancementGap[]  // <-- ADD
  quotaRemaining: number
}
```

4. Add new functions (at end of Build Mode section, before User Profile CRUD):
```typescript
export async function reprocessWithGaps(
  encounterId: string,
  gapResponses: Record<string, Record<string, boolean>>,
  userIdToken: string,
  mode: 'build' | 'quick',
): Promise<{ ok: boolean; finalMdm: FinalMdm }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const endpoint = mode === 'build'
    ? '/v1/build-mode/reprocess'
    : '/v1/quick-mode/reprocess'
  return apiFetch(
    `${apiBaseUrl}${endpoint}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounterId, userIdToken, gapResponses }),
    },
    `Reprocess ${mode} mode`,
    90_000,
  )
}

export async function dismissAdvisor(
  encounterId: string,
  mode: 'build' | 'quick',
  userIdToken: string,
): Promise<{ ok: boolean }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/enhancement-advisor/dismiss`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounterId, mode, userIdToken }),
    },
    'Dismiss advisor',
  )
}
```

**Verify:** `cd frontend && npx tsc --noEmit`

### Task 12: Frontend Hooks — Defensive Defaults

**Files:** `frontend/src/hooks/useEncounter.ts`, `frontend/src/hooks/useQuickEncounter.ts`

**useEncounter.ts** — in the onSnapshot handler (L90-164), the `encounterData` object is built. Add:

1. After L128 (section3 spread), add gap defaults to section3:
```typescript
section3: {
  ...data.section3,
  // existing defaults...
  llmResponse: data.section3?.llmResponse ? {
    ...data.section3.llmResponse,
    gaps: data.section3.llmResponse.gaps ?? [],
  } : undefined,
},
```
Note: Be careful not to break the existing section3 spread. The `llmResponse` is already passed through at L95 as `data.section3?.llmResponse` (via spread). We need to enhance it.

Actually, looking at the code more carefully — the section3 spread at L121-128 doesn't touch `llmResponse` explicitly (it comes through `...data.section3`). So add the gap defaults at the `encounterData` level:

```typescript
// After cdrTracking: data.cdrTracking ?? {},
enhancementDismissed: data.enhancementDismissed ?? false,
enhancementReprocessed: data.enhancementReprocessed ?? false,
```

**useQuickEncounter.ts** — in `convertEncounterDoc()` (L55-105), add gap defaults:

1. After L64 (`quickModeData: data.quickModeData,`), enhance:
```typescript
quickModeData: data.quickModeData ? {
  ...data.quickModeData,
  gaps: data.quickModeData.gaps ?? [],
  enhancementDismissed: data.quickModeData.enhancementDismissed ?? false,
  enhancementReprocessed: data.quickModeData.enhancementReprocessed ?? false,
} : undefined,
```

**Verify:** `cd frontend && npx tsc --noEmit`

### Task 13: EnhancementAdvisor Component

**Files to create:**
- `frontend/src/components/build-mode/shared/EnhancementAdvisor.tsx`
- `frontend/src/components/build-mode/shared/EnhancementAdvisor.css`
- `frontend/src/__tests__/EnhancementAdvisor.test.tsx`

**Component props:**
```typescript
interface EnhancementAdvisorProps {
  gaps: EnhancementGap[]
  userPlan: string
  hasReprocessed: boolean
  onSkip: () => void
  onReprocess: (gapResponses: Record<string, Record<string, boolean>>) => void
  isReprocessing: boolean
}
```

**Behavior:**
- Groups gaps by `category` (billing, medicolegal, care) with labels/icons
- Each gap shows method tag + title + description + toggle items
- Toggle items: Yes/No buttons per toggle (managed via local state)
- Footer: "Skip & View MDM" button + "Reprocess with Additions" button (or "Upgrade to Pro" for free users)
- Reprocess button disabled when: already reprocessed, currently reprocessing, or no YES toggles
- CSS: BEM pattern matching existing `.cdr-input__toggle` visual style. Responsive via 767px media query.

**Test expectations:**
- Renders gap items by title
- Shows skip button, calls onSkip on click
- Shows reprocess button for Pro users, upgrade CTA for free users
- Disables reprocess button after reprocessing
- Groups by benefit category (billing/medicolegal/care labels visible)

**Verify:** `cd frontend && npx vitest run src/__tests__/EnhancementAdvisor.test.tsx`

### Task 14: Build Mode Integration — EncounterEditor

**File:** `frontend/src/components/build-mode/EncounterEditor.tsx`

**Key context:**
- MDM display section: L1362-1385
- `finalMdmData` extraction: L956-963
- `useIsMobile` and `useSubscription` are NOT currently imported — need to add
- Uses `useAuth` + `useAuthToken` (already imported)
- `isFinalized` is already a variable used in the JSX

**Steps:**

1. Add imports:
```typescript
import { EnhancementAdvisor } from './shared/EnhancementAdvisor'
import { useIsMobile } from '../../hooks/useIsMobile'
import { reprocessWithGaps, dismissAdvisor } from '../../lib/api'
```

2. Add state and derived values near top of component:
```typescript
const isMobile = useIsMobile()
const [isReprocessing, setIsReprocessing] = useState(false)

// Enhancement advisor derived state
const gaps = encounter?.section3?.llmResponse?.gaps ?? []
const advisorDismissed = encounter?.enhancementDismissed ?? false
const hasReprocessed = encounter?.enhancementReprocessed ?? false
const displayMdm = hasReprocessed && encounter?.section3?.llmResponse?.reprocessedMdm
  ? encounter.section3.llmResponse.reprocessedMdm
  : finalMdmData
const showAdvisor = gaps.length > 0 && !advisorDismissed && !hasReprocessed
const showMdm = !isMobile || !showAdvisor
```

3. For user plan, get it from the whoAmI response or a subscription hook. Check how other components get user plan. May need to use a context or pass as prop. A simple approach: read from `useAuth` context if it exposes plan, or fetch via `whoAmI`.

4. Add handlers:
```typescript
const handleAdvisorSkip = async () => {
  if (!encounter || !token) return
  try {
    await dismissAdvisor(encounter.id, 'build', token)
  } catch (err) {
    console.error('Failed to dismiss advisor:', err)
  }
}

const handleReprocess = async (gapResponses: Record<string, Record<string, boolean>>) => {
  if (!encounter || !token) return
  setIsReprocessing(true)
  try {
    await reprocessWithGaps(encounter.id, gapResponses, token, 'build')
  } catch (err) {
    console.error('Reprocess failed:', err)
  } finally {
    setIsReprocessing(false)
  }
}
```

5. Replace MDM display JSX (L1362-1385) with responsive layout:
```tsx
{isFinalized && finalMdmData && (
  <div className={`encounter-editor__finalized-view${showAdvisor && !isMobile ? ' encounter-editor__finalized-view--with-advisor' : ''}`}>
    {showAdvisor && (
      <EnhancementAdvisor
        gaps={gaps}
        userPlan={userPlan}
        hasReprocessed={hasReprocessed}
        onSkip={handleAdvisorSkip}
        onReprocess={handleReprocess}
        isReprocessing={isReprocessing}
      />
    )}
    {showMdm && (
      <div className="encounter-editor__final-mdm">
        {/* existing MDM display using displayMdm instead of finalMdmData */}
      </div>
    )}
  </div>
)}
```

6. Add CSS to EncounterEditor.css:
```css
.encounter-editor__finalized-view--with-advisor {
  display: flex;
  gap: 1.5rem;
}
@media (max-width: 767px) {
  .encounter-editor__finalized-view--with-advisor {
    flex-direction: column;
  }
}
```

**Verify:** `cd frontend && pnpm check`

### Task 15: Quick Mode Integration — QuickEncounterEditor

**File:** `frontend/src/components/build-mode/QuickEncounterEditor.tsx`

**Same pattern as Task 14, but:**
- MDM display section: L233-318
- Source data from `encounter.quickModeData`:
  ```typescript
  const gaps = encounter?.quickModeData?.gaps ?? []
  const advisorDismissed = encounter?.quickModeData?.enhancementDismissed ?? false
  const hasReprocessed = encounter?.quickModeData?.enhancementReprocessed ?? false
  const displayMdm = hasReprocessed && encounter?.quickModeData?.reprocessedMdmOutput
    ? encounter.quickModeData.reprocessedMdmOutput
    : mdmOutput
  ```
- Handlers call `dismissAdvisor(id, 'quick', token)` and `reprocessWithGaps(id, responses, token, 'quick')`
- Same responsive logic: pre-gate on mobile, side panel on desktop

**Verify:** `cd frontend && pnpm check`

---

## Verification Checklist (After All Tasks)

1. `cd backend && pnpm build` — compiles
2. `cd backend && npx vitest run` — all tests pass
3. `cd frontend && pnpm check` — typecheck + lint + test
4. Run `/simplify` skill to review all changed code
5. Re-run full test suite after simplification
6. Commit all changes together
7. Push branch to remote
8. Do NOT create a PR or merge

---

## Architecture Reference

**Data flow:** Single LLM call produces MDM + gaps array → backend extracts gaps via `safeParseGaps()` → stored in Firestore alongside MDM → frontend reads via onSnapshot → EnhancementAdvisor component renders → user toggles gaps → reprocess endpoint sends new LLM call with confirmed gaps → enhanced MDM stored as `reprocessedMdm`

**Key design decisions:**
- `safeParseGaps()` filters per-item (one bad gap doesn't kill the list)
- Frontend/backend types are independent (no cross-project imports)
- Mobile: pre-gate (MDM hidden until skip/reprocess). Desktop: side panel alongside MDM.
- One reprocess per encounter (one-shot guard via `enhancementReprocessed` flag)
- Free users see gaps read-only; Pro+ can reprocess
- Gap tallies on user doc for analytics (`gapTallies.identified` / `gapTallies.confirmed`)
