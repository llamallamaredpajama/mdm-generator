# BM-1.2: CDR Library (Clinical Decision Rule Definitions)

## Status

**Done**

**Points:** 5
**Dependencies:** None (parallel with BM-1.1)
**Branch:** `build-mode-refactor`

---

## Story

As a **Build Mode backend service**, I want a **structured CDR (Clinical Decision Rule) library stored in Firestore** with a GET endpoint, so that the system can **match CDRs to chief complaints, track component-level data across sections, calculate scores on the frontend, and suggest treatments per risk level** — replacing the current unstructured markdown-based CDR system.

---

## Acceptance Criteria

1. `GET /v1/libraries/cdrs` returns all CDR definitions from the `cdrLibrary` Firestore collection
2. Each CDR has: components with `source` field (`section1`, `section2`, `user_input`), scoring ranges with risk levels and interpretations, suggested treatments per risk level
3. HEART score components match spec exactly: History (select 0/1/2), ECG (select 0/1/2), Age (ranges), Risk Factors (select 0/1/>=2), Troponin (select 0/1/2)
4. `applicableChiefComplaints` allows CDR matching from S1 narrative
5. `feedsCdrs` in test library (BM-1.1) cross-references CDR component sources
6. Backend builds cleanly (`cd backend && pnpm build` passes)

---

## Tasks / Subtasks

### T1: Define CDR TypeScript types (AC: 2, 3)
- [x] Add `CdrComponentOption`, `CdrComponent`, `CdrScoringRange`, `CdrScoring`, `CdrDefinition` types to `backend/src/types/libraries.ts`
- [x] Add matching frontend types to `frontend/src/types/libraries.ts` (plain interfaces, no Zod)
- [x] Ensure component `type` supports: `select`, `boolean`, `number_range`, `algorithm`
- [x] Ensure component `source` field uses union: `"section1" | "section2" | "user_input"`
- [x] Include `autoPopulateFrom` optional field on components

### T2: Create GET endpoint (AC: 1, 6)
- [x] Add `GET /v1/libraries/cdrs` route to `backend/src/index.ts`
- [x] Follow the 6-step API route pattern (authenticate, validate, authorize, execute, audit, respond)
- [x] Read all documents from `cdrLibrary` Firestore collection
- [x] Return `{ ok: true, cdrs: CdrDefinition[] }`
- [x] Add appropriate error handling

### T3: Create seed script with all 13 CDR definitions (AC: 2, 3, 4)
- [x] Create `scripts/seed-cdr-library.ts` following pattern from `scripts/load-zip-crosswalk.ts`
- [x] Implement idempotent writes (use `doc(id).set()` so re-runs overwrite)
- [x] Define all 13 CDRs with medically accurate scoring data (see CDR data section below)
- [x] Verify each CDR has: `id`, `name`, `fullName`, `applicableChiefComplaints`, `components[]`, `scoring`, `suggestedTreatments`
- [x] Runnable via `npx tsx scripts/seed-cdr-library.ts`

### T4: Validate HEART score components match spec (AC: 3)
- [x] History: select with options Slightly suspicious (0), Moderately suspicious (1), Highly suspicious (2); source: `section1`; autoPopulateFrom: `narrative_analysis`
- [x] ECG: select with options Normal (0), Non-specific repolarization abnormality (1), Significant ST deviation (2); source: `section2`; autoPopulateFrom: `test_result`
- [x] Age: select with options <45 (0), 45-64 (1), >=65 (2); source: `section1`; autoPopulateFrom: `narrative_analysis`
- [x] Risk Factors: select with options No known risk factors (0), 1-2 risk factors (1), >=3 risk factors or history of atherosclerotic disease (2); source: `section1`; autoPopulateFrom: `narrative_analysis`
- [x] Troponin: select with options <=normal limit (0), 1-3x normal limit (1), >3x normal limit (2); source: `section2`; autoPopulateFrom: `test_result`

### T5: Validate cross-reference with BM-1.1 test library (AC: 5)
- [x] Verify `applicableChiefComplaints` IDs use lowercase snake_case matching the test library's chief complaint identifiers
- [x] Verify component `source` values (`section1`, `section2`, `user_input`) align with BM-1.1 `feedsCdrs` cross-references
- [x] Document the CDR-to-test mapping pattern in code comments

### T6: Build verification (AC: 6)
- [x] Run `cd backend && pnpm build` — must pass
- [x] Run `cd frontend && pnpm check` — must pass
- [x] Verify no PHI in any code, logs, comments, or outputs

---

## Dev Notes

### Relationship to BM-1.1

BM-1.1 **creates** the files `backend/src/types/libraries.ts` and `frontend/src/types/libraries.ts`. This story **extends** those files with CDR-specific types.

**Implementation order handling:**
- If BM-1.1 has already been implemented: extend the existing `libraries.ts` files by adding CDR types alongside the test library types.
- If BM-1.1 has NOT been implemented yet: create the `libraries.ts` files with CDR types only. BM-1.1 will add test types when it runs.

The files live at:
- `backend/src/types/libraries.ts` — Zod schemas + inferred types (backend pattern)
- `frontend/src/types/libraries.ts` — plain TypeScript interfaces with JSDoc (frontend pattern, no Zod)

### What This Replaces

The current CDR system is markdown-based and lives in `backend/src/cdr/`:

**Current files (OLD system — do NOT modify these):**
- `/backend/src/cdr/cdrLoader.ts` — Parses `clinical-decision-rules.md` into `CdrRule` objects (`{ name, category, fullText, keywords }`)
- `/backend/src/cdr/cdrSelector.ts` — Two-level keyword matching: categories via `CATEGORY_KEYWORDS` map, then individual rule scoring by keyword hits. Returns `CdrRule[]` sorted by relevance.
- `/backend/src/cdr/cdrPromptAugmenter.ts` — Converts selected rules to string context blocks for LLM prompts. Budget: ~4K tokens (~16,000 chars).
- `/backend/src/cdr/clinical-decision-rules.md` — 14-category markdown file with full CDR definitions (TRAUMA, CARDIOVASCULAR, PULMONARY, etc.)

**How old CDR system is consumed in `backend/src/index.ts`:**
```typescript
// Section 1 (line ~551-560):
import { selectRelevantRules } from './cdr/cdrSelector'
import { buildCdrContext } from './cdr/cdrPromptAugmenter'

const selectedRules = selectRelevantRules(content)
if (selectedRules.length > 0) {
  section1CdrCtx = buildCdrContext(selectedRules) || undefined
}
// Result stored as string on encounter doc: { cdrContext: section1CdrCtx }
```

**What the NEW CDR library provides that the old system cannot:**
- Typed components with `source` field (section1/section2/user_input) for per-section data tracking
- `autoPopulateFrom` hints for smart auto-fill from narrative analysis or test results
- Scoring ranges with numeric min/max for client-side score calculation
- Treatment suggestions per risk level for clinical decision support
- `applicableChiefComplaints` for deterministic CDR matching (vs. keyword heuristic)

This story does NOT remove or modify the old CDR system. A future story will wire the new library into the encounter flow and retire the old system.

### CDR TypeScript Type Definitions

**Backend types (Zod schemas in `backend/src/types/libraries.ts`):**

```typescript
import { z } from 'zod'

// ── CDR Component Types ─────────────────────────────────────────────────

export const CdrComponentOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
})
export type CdrComponentOption = z.infer<typeof CdrComponentOptionSchema>

export const CdrComponentSourceSchema = z.enum(['section1', 'section2', 'user_input'])
export type CdrComponentSource = z.infer<typeof CdrComponentSourceSchema>

export const CdrComponentTypeSchema = z.enum(['select', 'boolean', 'number_range', 'algorithm'])
export type CdrComponentType = z.infer<typeof CdrComponentTypeSchema>

export const CdrComponentSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: CdrComponentTypeSchema,
  options: z.array(CdrComponentOptionSchema).optional(),   // for 'select' type
  min: z.number().optional(),                               // for 'number_range'
  max: z.number().optional(),                               // for 'number_range'
  value: z.number().optional(),                             // point weight for 'boolean' type (e.g., Wells PE: DVT signs = 3 pts)
  source: CdrComponentSourceSchema,
  autoPopulateFrom: z.string().optional(),
})
export type CdrComponent = z.infer<typeof CdrComponentSchema>

// ── CDR Scoring ─────────────────────────────────────────────────────────

export const CdrScoringRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  risk: z.string(),             // e.g., "Low", "Moderate", "High"
  interpretation: z.string(),   // clinical meaning
})
export type CdrScoringRange = z.infer<typeof CdrScoringRangeSchema>

export const CdrScoringSchema = z.object({
  method: z.enum(['sum', 'threshold', 'algorithm']).default('sum'),
  ranges: z.array(CdrScoringRangeSchema),
})
export type CdrScoring = z.infer<typeof CdrScoringSchema>

// ── CDR Definition ──────────────────────────────────────────────────────

export const CdrDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  applicableChiefComplaints: z.array(z.string()),
  components: z.array(CdrComponentSchema),
  scoring: CdrScoringSchema,
  suggestedTreatments: z.record(z.string(), z.array(z.string())).optional(),
})
export type CdrDefinition = z.infer<typeof CdrDefinitionSchema>
```

**Frontend types (plain interfaces in `frontend/src/types/libraries.ts`):**

```typescript
/** Option for a CDR select component */
export interface CdrComponentOption {
  label: string
  value: number
}

/** Where a CDR component gets its data */
export type CdrComponentSource = 'section1' | 'section2' | 'user_input'

/** Type of CDR input component */
export type CdrComponentType = 'select' | 'boolean' | 'number_range' | 'algorithm'

/** Individual component of a Clinical Decision Rule */
export interface CdrComponent {
  id: string
  label: string
  type: CdrComponentType
  options?: CdrComponentOption[]
  min?: number
  max?: number
  /** Point weight for boolean components (e.g., Wells PE: DVT signs = 3 pts) */
  value?: number
  source: CdrComponentSource
  autoPopulateFrom?: string
}

/** A scoring range with risk level and interpretation */
export interface CdrScoringRange {
  min: number
  max: number
  risk: string
  interpretation: string
}

/** Scoring configuration for a CDR */
export interface CdrScoring {
  method: 'sum' | 'threshold' | 'algorithm'
  ranges: CdrScoringRange[]
}

/** Complete Clinical Decision Rule definition */
export interface CdrDefinition {
  id: string
  name: string
  fullName: string
  applicableChiefComplaints: string[]
  components: CdrComponent[]
  scoring: CdrScoring
  suggestedTreatments?: Record<string, string[]>
}
```

### GET Endpoint Implementation Pattern

Follow the existing pattern in `backend/src/index.ts`. The endpoint is a **GET** (not POST), so authentication uses the `Authorization` header. No request body to validate.

```typescript
// Add BEFORE the surveillance router mount (line ~1357)
app.get('/v1/libraries/cdrs', async (req, res) => {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1]
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' })
    try {
      await admin.auth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. VALIDATE — no body for GET
    // 3. AUTHORIZE — any authenticated user can read CDR library
    // 4. EXECUTE
    const snapshot = await getDb().collection('cdrLibrary').get()
    const cdrs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // 5. AUDIT
    console.log({ action: 'list-cdrs', count: cdrs.length, timestamp: new Date().toISOString() })

    // 6. RESPOND
    return res.json({ ok: true, cdrs })
  } catch (error) {
    console.error('list-cdrs error:', error)
    return res.status(500).json({ error: 'Internal error' })
  }
})
```

Key implementation notes:
- `getDb()` helper already exists at line 430 of `index.ts`: `const getDb = () => admin.firestore()`
- No rate limiter needed for read-only library data (use global limiter only)
- Place the route after the existing Build Mode and Quick Mode sections, before `app.use(surveillanceRouter)` at line 1357

### Seed Script Pattern

Follow the existing seed script at `/scripts/load-zip-crosswalk.ts` for Firebase Admin initialization:

```typescript
// scripts/seed-cdr-library.ts
import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

// Firebase init (same pattern as load-zip-crosswalk.ts)
const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (serviceAccountJson) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  })
} else if (serviceAccountPath) {
  const content = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(content)),
  })
} else {
  admin.initializeApp()
}

const db = admin.firestore()
```

**Idempotent writes:** Use `db.collection('cdrLibrary').doc(cdr.id).set(cdr)` so re-runs overwrite existing documents rather than creating duplicates.

**Batch writes:** With 13 CDRs, a single batch (Firestore limit: 500 per batch) is sufficient. No pagination needed.

### Complete CDR Seed Data (All 13 Definitions)

Each CDR definition must be medically accurate. Below is the specification for all 13 CDRs. The `applicableChiefComplaints` values use lowercase snake_case and should correspond to common EM chief complaint identifiers.

---

#### 1. HEART Score

```
id: "heart"
name: "HEART Score"
fullName: "History, ECG, Age, Risk Factors, Troponin"
applicableChiefComplaints: ["chest_pain", "dyspnea", "syncope"]
scoring.method: "sum"
scoring.ranges:
  - { min: 0, max: 3, risk: "Low", interpretation: "1.7% risk of MACE at 6 weeks. Consider early discharge." }
  - { min: 4, max: 6, risk: "Moderate", interpretation: "12-16.6% risk of MACE at 6 weeks. Consider admission for observation." }
  - { min: 7, max: 10, risk: "High", interpretation: "50-65% risk of MACE at 6 weeks. Early invasive measures indicated." }
components:
  - id: "history", label: "History", type: "select", source: "section1", autoPopulateFrom: "narrative_analysis"
    options: [{ label: "Slightly suspicious", value: 0 }, { label: "Moderately suspicious", value: 1 }, { label: "Highly suspicious", value: 2 }]
  - id: "ecg", label: "ECG", type: "select", source: "section2", autoPopulateFrom: "test_result"
    options: [{ label: "Normal", value: 0 }, { label: "Non-specific repolarization abnormality", value: 1 }, { label: "Significant ST deviation", value: 2 }]
  - id: "age", label: "Age", type: "select", source: "section1", autoPopulateFrom: "narrative_analysis"
    options: [{ label: "<45", value: 0 }, { label: "45-64", value: 1 }, { label: ">=65", value: 2 }]
  - id: "risk_factors", label: "Risk Factors", type: "select", source: "section1", autoPopulateFrom: "narrative_analysis"
    options: [{ label: "No known risk factors", value: 0 }, { label: "1-2 risk factors", value: 1 }, { label: ">=3 risk factors or history of atherosclerotic disease", value: 2 }]
  - id: "troponin", label: "Troponin", type: "select", source: "section2", autoPopulateFrom: "test_result"
    options: [{ label: "<=normal limit", value: 0 }, { label: "1-3x normal limit", value: 1 }, { label: ">3x normal limit", value: 2 }]
suggestedTreatments:
  High: ["aspirin_325", "heparin_drip", "cardiology_consult", "admit_telemetry"]
  Moderate: ["aspirin_325", "serial_troponins", "observation", "cardiology_consult"]
  Low: ["discharge_with_follow_up", "outpatient_stress_test"]
```

#### 2. PERC Rule

```
id: "perc"
name: "PERC Rule"
fullName: "Pulmonary Embolism Rule-out Criteria"
applicableChiefComplaints: ["chest_pain", "dyspnea", "pleuritic_chest_pain", "tachycardia"]
scoring.method: "threshold"
scoring.ranges:
  - { min: 0, max: 0, risk: "Low", interpretation: "All 8 criteria negative. PE effectively ruled out (<2% risk). No further workup needed." }
  - { min: 1, max: 8, risk: "Not Low", interpretation: ">=1 criterion positive. PERC rule cannot exclude PE. Proceed to D-dimer or CTPA." }
components (all boolean, all source: section1 or section2):
  - id: "age_gte_50", label: "Age >= 50", type: "boolean", source: "section1", autoPopulateFrom: "narrative_analysis"
  - id: "hr_gte_100", label: "Heart rate >= 100", type: "boolean", source: "section1", autoPopulateFrom: "vital_signs"
  - id: "sao2_lt_95", label: "SpO2 < 95% on room air", type: "boolean", source: "section1", autoPopulateFrom: "vital_signs"
  - id: "unilateral_leg_swelling", label: "Unilateral leg swelling", type: "boolean", source: "section1", autoPopulateFrom: "physical_exam"
  - id: "hemoptysis", label: "Hemoptysis", type: "boolean", source: "section1", autoPopulateFrom: "narrative_analysis"
  - id: "recent_surgery_trauma", label: "Surgery or trauma within 4 weeks", type: "boolean", source: "section1", autoPopulateFrom: "narrative_analysis"
  - id: "prior_pe_dvt", label: "Prior PE or DVT", type: "boolean", source: "section1", autoPopulateFrom: "narrative_analysis"
  - id: "hormone_use", label: "Hormone use (OCP, HRT)", type: "boolean", source: "section1", autoPopulateFrom: "narrative_analysis"
suggestedTreatments:
  Not Low: ["d_dimer", "ctpa_if_d_dimer_positive", "anticoagulation_if_confirmed"]
```

#### 3. Wells PE

```
id: "wells_pe"
name: "Wells PE"
fullName: "Wells Criteria for Pulmonary Embolism"
applicableChiefComplaints: ["chest_pain", "dyspnea", "pleuritic_chest_pain", "tachycardia", "hemoptysis"]
scoring.method: "sum"
scoring.ranges:
  - { min: 0, max: 1, risk: "Low", interpretation: "Low probability PE (~1.3%). Consider PERC rule or D-dimer." }
  - { min: 2, max: 6, risk: "Moderate", interpretation: "Moderate probability PE (~16.2%). D-dimer recommended." }
  - { min: 7, max: 12.5, risk: "High", interpretation: "High probability PE (~37.5%). Consider empiric anticoagulation and CTPA." }
components:
  - id: "clinical_signs_dvt", label: "Clinical signs/symptoms of DVT", type: "boolean", source: "section1", value: 3
  - id: "pe_most_likely", label: "PE is #1 diagnosis or equally likely", type: "boolean", source: "section1", value: 3
  - id: "hr_gt_100", label: "Heart rate > 100", type: "boolean", source: "section1", value: 1.5
  - id: "immobilization_surgery", label: "Immobilization/surgery in previous 4 weeks", type: "boolean", source: "section1", value: 1.5
  - id: "previous_pe_dvt", label: "Previous PE or DVT", type: "boolean", source: "section1", value: 1.5
  - id: "hemoptysis", label: "Hemoptysis", type: "boolean", source: "section1", value: 1
  - id: "malignancy", label: "Malignancy (treatment within 6 months or palliative)", type: "boolean", source: "section1", value: 1
suggestedTreatments:
  High: ["empiric_anticoagulation", "ctpa", "cardiology_or_pulm_consult"]
  Moderate: ["d_dimer", "ctpa_if_positive", "anticoagulation_if_confirmed"]
  Low: ["d_dimer", "perc_rule_if_low_pretest"]
```

> **Note on Wells PE/DVT:** The boolean components carry point values (e.g., "Clinical signs/symptoms of DVT" = 3 points). For `boolean` type components in scoring rules that use weighted points, include a `value` field on each component option. The seed script should store this as a property on the component.

#### 4. Wells DVT

```
id: "wells_dvt"
name: "Wells DVT"
fullName: "Wells Criteria for Deep Vein Thrombosis"
applicableChiefComplaints: ["leg_pain", "leg_swelling", "calf_pain", "unilateral_edema"]
scoring.method: "sum"
scoring.ranges:
  - { min: -2, max: 0, risk: "Low", interpretation: "Low probability DVT (~5%). D-dimer to rule out." }
  - { min: 1, max: 2, risk: "Moderate", interpretation: "Moderate probability DVT (~17%). D-dimer or ultrasound." }
  - { min: 3, max: 9, risk: "High", interpretation: "High probability DVT (~53%). Ultrasound recommended. Consider empiric anticoagulation." }
components (10 criteria, all boolean with point values):
  - id: "active_cancer", label: "Active cancer (treatment within 6 months or palliative)", type: "boolean", source: "section1", value: 1
  - id: "paralysis_paresis", label: "Paralysis, paresis, or recent plaster immobilization of lower extremity", type: "boolean", source: "section1", value: 1
  - id: "bedridden_gt_3days", label: "Bedridden >3 days or major surgery within 12 weeks", type: "boolean", source: "section1", value: 1
  - id: "tenderness_along_veins", label: "Localized tenderness along distribution of deep venous system", type: "boolean", source: "section1", value: 1
  - id: "entire_leg_swelling", label: "Entire leg swollen", type: "boolean", source: "section1", value: 1
  - id: "calf_swelling_gt_3cm", label: "Calf swelling >3cm compared to asymptomatic leg", type: "boolean", source: "section1", value: 1
  - id: "pitting_edema", label: "Pitting edema confined to symptomatic leg", type: "boolean", source: "section1", value: 1
  - id: "collateral_veins", label: "Collateral superficial veins (non-varicose)", type: "boolean", source: "section1", value: 1
  - id: "previous_dvt", label: "Previously documented DVT", type: "boolean", source: "section1", value: 1
  - id: "alternative_diagnosis", label: "Alternative diagnosis at least as likely as DVT", type: "boolean", source: "section1", value: -2
suggestedTreatments:
  High: ["lower_extremity_ultrasound", "empiric_anticoagulation", "hematology_consult"]
  Moderate: ["d_dimer", "lower_extremity_ultrasound_if_positive"]
  Low: ["d_dimer"]
```

#### 5. PECARN

```
id: "pecarn"
name: "PECARN"
fullName: "Pediatric Emergency Care Applied Research Network Head Injury Rule"
applicableChiefComplaints: ["head_injury", "head_trauma", "fall", "altered_mental_status"]
scoring.method: "algorithm"
scoring.ranges:
  - { min: 0, max: 0, risk: "Very Low", interpretation: "ciTBI risk <0.02-0.05%. CT not recommended. Observation appropriate." }
  - { min: 1, max: 1, risk: "Intermediate", interpretation: "ciTBI risk ~0.9-1.0%. Consider CT vs observation based on clinical factors." }
  - { min: 2, max: 2, risk: "High", interpretation: "ciTBI risk ~4.4%. CT recommended." }
components:
  - id: "age_group", label: "Age Group", type: "select", source: "section1", autoPopulateFrom: "narrative_analysis"
    options: [{ label: "<2 years", value: 0 }, { label: ">=2 years", value: 1 }]
  - id: "gcs_lte_14", label: "GCS <= 14", type: "boolean", source: "section1"
  - id: "altered_mental_status", label: "Altered mental status", type: "boolean", source: "section1"
  - id: "palpable_skull_fracture", label: "Palpable skull fracture (<2y) / Signs of basilar skull fracture (>=2y)", type: "boolean", source: "section1"
  - id: "scalp_hematoma", label: "Occipital/parietal/temporal scalp hematoma (<2y) / History of LOC (>=2y)", type: "boolean", source: "section1"
  - id: "loss_of_consciousness", label: "LOC >= 5 seconds", type: "boolean", source: "section1"
  - id: "severe_mechanism", label: "Severe mechanism of injury", type: "boolean", source: "section1"
  - id: "acting_abnormally", label: "Not acting normally per parent (<2y) / Severe headache (>=2y)", type: "boolean", source: "section1"
suggestedTreatments:
  High: ["ct_head", "neurosurgery_consult", "admission"]
  Intermediate: ["observation_4_6_hours", "ct_head_if_worsening"]
```

#### 6. Ottawa Ankle

```
id: "ottawa_ankle"
name: "Ottawa Ankle"
fullName: "Ottawa Ankle Rules"
applicableChiefComplaints: ["ankle_pain", "ankle_injury", "foot_pain", "foot_injury", "ankle_swelling"]
scoring.method: "threshold"
scoring.ranges:
  - { min: 0, max: 0, risk: "Low", interpretation: "No criteria met. Fracture effectively ruled out. X-ray not indicated." }
  - { min: 1, max: 4, risk: "Not Low", interpretation: ">=1 criterion present. Ankle or foot X-ray indicated." }
components:
  - id: "malleolar_bone_tenderness_posterior", label: "Bone tenderness along distal 6cm of posterior edge of tibia/fibula or tip of malleolus", type: "boolean", source: "section1"
  - id: "inability_to_bear_weight", label: "Inability to bear weight immediately and in ED (4 steps)", type: "boolean", source: "section1"
  - id: "midfoot_bone_tenderness_navicular", label: "Bone tenderness at base of 5th metatarsal", type: "boolean", source: "section1"
  - id: "midfoot_bone_tenderness_cuboid", label: "Bone tenderness at navicular", type: "boolean", source: "section1"
suggestedTreatments:
  Not Low: ["ankle_xray", "foot_xray", "splinting", "ortho_follow_up"]
```

#### 7. Ottawa Knee

```
id: "ottawa_knee"
name: "Ottawa Knee"
fullName: "Ottawa Knee Rules"
applicableChiefComplaints: ["knee_pain", "knee_injury", "knee_swelling"]
scoring.method: "threshold"
scoring.ranges:
  - { min: 0, max: 0, risk: "Low", interpretation: "No criteria met. Fracture effectively ruled out. X-ray not indicated." }
  - { min: 1, max: 5, risk: "Not Low", interpretation: ">=1 criterion present. Knee X-ray indicated." }
components:
  - id: "age_gte_55", label: "Age >= 55", type: "boolean", source: "section1"
  - id: "isolated_patella_tenderness", label: "Tenderness at head of fibula", type: "boolean", source: "section1"
  - id: "fibula_head_tenderness", label: "Isolated patellar tenderness", type: "boolean", source: "section1"
  - id: "inability_to_flex_90", label: "Inability to flex to 90 degrees", type: "boolean", source: "section1"
  - id: "inability_to_bear_weight", label: "Inability to bear weight immediately and in ED (4 steps)", type: "boolean", source: "section1"
suggestedTreatments:
  Not Low: ["knee_xray", "splinting", "ortho_follow_up"]
```

#### 8. Canadian C-Spine Rule

```
id: "canadian_cspine"
name: "Canadian C-Spine"
fullName: "Canadian C-Spine Rule"
applicableChiefComplaints: ["neck_pain", "neck_injury", "trauma", "mvc", "fall"]
scoring.method: "algorithm"
scoring.ranges:
  - { min: 0, max: 0, risk: "Low", interpretation: "No high-risk factors, >=1 low-risk factor, able to actively rotate neck. Imaging not indicated." }
  - { min: 1, max: 1, risk: "Not Low", interpretation: "High-risk factor present OR unable to actively rotate neck 45 degrees. C-spine imaging indicated." }
components:
  - id: "age_gte_65", label: "Age >= 65", type: "boolean", source: "section1"
  - id: "dangerous_mechanism", label: "Dangerous mechanism (fall >=3ft, axial load, MVC >100km/h, bicycle collision, motorized recreational vehicle)", type: "boolean", source: "section1"
  - id: "paresthesias", label: "Paresthesias in extremities", type: "boolean", source: "section1"
  - id: "simple_rear_end_mvc", label: "Simple rear-end MVC (low-risk factor)", type: "boolean", source: "section1"
  - id: "sitting_in_ed", label: "Sitting position in ED (low-risk factor)", type: "boolean", source: "section1"
  - id: "ambulatory_at_any_time", label: "Ambulatory at any time since injury (low-risk factor)", type: "boolean", source: "section1"
  - id: "delayed_onset_neck_pain", label: "Delayed onset of neck pain (low-risk factor)", type: "boolean", source: "section1"
  - id: "midline_tenderness_absent", label: "Absence of midline cervical tenderness (low-risk factor)", type: "boolean", source: "section1"
  - id: "able_to_rotate_neck", label: "Able to actively rotate neck 45 degrees left and right", type: "boolean", source: "section1"
suggestedTreatments:
  Not Low: ["cspine_ct", "cspine_xray", "cervical_collar", "neurosurgery_consult_if_positive"]
```

#### 9. NEXUS Criteria

```
id: "nexus"
name: "NEXUS"
fullName: "National Emergency X-Radiography Utilization Study Criteria"
applicableChiefComplaints: ["neck_pain", "neck_injury", "trauma", "mvc", "fall"]
scoring.method: "threshold"
scoring.ranges:
  - { min: 0, max: 0, risk: "Low", interpretation: "All 5 criteria absent. C-spine fracture effectively ruled out. Imaging not indicated." }
  - { min: 1, max: 5, risk: "Not Low", interpretation: ">=1 criterion present. C-spine imaging indicated." }
components:
  - id: "midline_tenderness", label: "Posterior midline cervical-spine tenderness", type: "boolean", source: "section1"
  - id: "focal_neurologic_deficit", label: "Focal neurologic deficit", type: "boolean", source: "section1"
  - id: "decreased_alertness", label: "Decreased level of alertness", type: "boolean", source: "section1"
  - id: "intoxication", label: "Evidence of intoxication", type: "boolean", source: "section1"
  - id: "distracting_injury", label: "Clinically apparent painful distracting injury", type: "boolean", source: "section1"
suggestedTreatments:
  Not Low: ["cspine_ct", "cspine_xray", "cervical_collar"]
```

#### 10. Centor/McIsaac

```
id: "centor_mcisaac"
name: "Centor/McIsaac"
fullName: "Modified Centor Score (McIsaac) for Strep Pharyngitis"
applicableChiefComplaints: ["sore_throat", "pharyngitis", "throat_pain", "odynophagia"]
scoring.method: "sum"
scoring.ranges:
  - { min: -1, max: 0, risk: "Very Low", interpretation: "1-2.5% likelihood of strep. No testing or antibiotics recommended." }
  - { min: 1, max: 1, risk: "Low", interpretation: "5-10% likelihood of strep. Consider rapid strep test (optional)." }
  - { min: 2, max: 3, risk: "Moderate", interpretation: "11-35% likelihood of strep. Rapid strep test recommended." }
  - { min: 4, max: 5, risk: "High", interpretation: "25-51% likelihood of strep. Empiric antibiotics or rapid strep test." }
components:
  - id: "tonsillar_exudates", label: "Tonsillar exudates or swelling", type: "boolean", source: "section1", value: 1
  - id: "tender_anterior_cervical_lymph", label: "Tender/swollen anterior cervical lymph nodes", type: "boolean", source: "section1", value: 1
  - id: "fever", label: "Temperature >38C (100.4F)", type: "boolean", source: "section1", value: 1
  - id: "absence_of_cough", label: "Absence of cough", type: "boolean", source: "section1", value: 1
  - id: "age_modifier", label: "Age modifier", type: "select", source: "section1", autoPopulateFrom: "narrative_analysis"
    options: [{ label: "3-14 years", value: 1 }, { label: "15-44 years", value: 0 }, { label: ">=45 years", value: -1 }]
suggestedTreatments:
  High: ["rapid_strep_test", "empiric_antibiotics_penicillin_or_amoxicillin"]
  Moderate: ["rapid_strep_test", "antibiotics_if_positive"]
  Low: ["symptomatic_treatment"]
```

#### 11. CHA2DS2-VASc

```
id: "cha2ds2_vasc"
name: "CHA2DS2-VASc"
fullName: "CHA2DS2-VASc Score for Atrial Fibrillation Stroke Risk"
applicableChiefComplaints: ["atrial_fibrillation", "afib", "palpitations", "irregular_heartbeat"]
scoring.method: "sum"
scoring.ranges:
  - { min: 0, max: 0, risk: "Low", interpretation: "0.2% annual stroke risk (males). Anticoagulation not recommended." }
  - { min: 1, max: 1, risk: "Low-Moderate", interpretation: "0.6% annual stroke risk. Consider anticoagulation (especially if female with no other risk factors)." }
  - { min: 2, max: 3, risk: "Moderate", interpretation: "2.2-3.2% annual stroke risk. Anticoagulation recommended." }
  - { min: 4, max: 9, risk: "High", interpretation: "4.8-15.2% annual stroke risk. Anticoagulation strongly recommended." }
components:
  - id: "chf", label: "Congestive Heart Failure", type: "boolean", source: "section1", value: 1
  - id: "hypertension", label: "Hypertension", type: "boolean", source: "section1", value: 1
  - id: "age_gte_75", label: "Age >= 75", type: "boolean", source: "section1", value: 2
  - id: "diabetes", label: "Diabetes mellitus", type: "boolean", source: "section1", value: 1
  - id: "stroke_tia", label: "Prior stroke/TIA/thromboembolism", type: "boolean", source: "section1", value: 2
  - id: "vascular_disease", label: "Vascular disease (prior MI, PAD, aortic plaque)", type: "boolean", source: "section1", value: 1
  - id: "age_65_74", label: "Age 65-74", type: "boolean", source: "section1", value: 1
  - id: "sex_female", label: "Sex category (female)", type: "boolean", source: "section1", value: 1
suggestedTreatments:
  High: ["oral_anticoagulation_doac", "rate_or_rhythm_control", "cardiology_referral"]
  Moderate: ["oral_anticoagulation_doac", "rate_control", "cardiology_follow_up"]
  Low-Moderate: ["consider_anticoagulation", "aspirin_alternative", "cardiology_follow_up"]
```

#### 12. CURB-65

```
id: "curb65"
name: "CURB-65"
fullName: "CURB-65 Severity Score for Community-Acquired Pneumonia"
applicableChiefComplaints: ["cough", "dyspnea", "fever", "pneumonia", "respiratory_distress"]
scoring.method: "sum"
scoring.ranges:
  - { min: 0, max: 1, risk: "Low", interpretation: "0.6-2.7% 30-day mortality. Consider outpatient treatment." }
  - { min: 2, max: 2, risk: "Moderate", interpretation: "6.8% 30-day mortality. Consider short inpatient stay or closely supervised outpatient treatment." }
  - { min: 3, max: 5, risk: "High", interpretation: "14-27.8% 30-day mortality. Hospitalize. Consider ICU admission if score 4-5." }
components:
  - id: "confusion", label: "Confusion (new mental confusion)", type: "boolean", source: "section1", value: 1
  - id: "bun_gt_19", label: "BUN > 19 mg/dL (7 mmol/L)", type: "boolean", source: "section2", autoPopulateFrom: "test_result", value: 1
  - id: "respiratory_rate_gte_30", label: "Respiratory rate >= 30", type: "boolean", source: "section1", autoPopulateFrom: "vital_signs", value: 1
  - id: "bp_systolic_lt_90_or_diastolic_lte_60", label: "BP: systolic <90 or diastolic <=60 mmHg", type: "boolean", source: "section1", autoPopulateFrom: "vital_signs", value: 1
  - id: "age_gte_65", label: "Age >= 65", type: "boolean", source: "section1", autoPopulateFrom: "narrative_analysis", value: 1
suggestedTreatments:
  High: ["iv_antibiotics", "icu_admission_if_4_5", "blood_cultures", "respiratory_support"]
  Moderate: ["oral_or_iv_antibiotics", "inpatient_observation", "blood_cultures"]
  Low: ["oral_antibiotics", "outpatient_follow_up_48h"]
```

#### 13. qSOFA

```
id: "qsofa"
name: "qSOFA"
fullName: "Quick Sequential Organ Failure Assessment"
applicableChiefComplaints: ["fever", "sepsis", "infection", "altered_mental_status", "hypotension", "tachypnea"]
scoring.method: "sum"
scoring.ranges:
  - { min: 0, max: 1, risk: "Low", interpretation: "Low risk of poor outcome. Continue standard evaluation." }
  - { min: 2, max: 3, risk: "High", interpretation: ">=2 criteria met. High risk of poor outcome (3-14x increased mortality). Assess for organ dysfunction, consider sepsis workup, and escalate care." }
components:
  - id: "altered_mentation", label: "Altered mentation (GCS <15)", type: "boolean", source: "section1", value: 1
  - id: "respiratory_rate_gte_22", label: "Respiratory rate >= 22/min", type: "boolean", source: "section1", autoPopulateFrom: "vital_signs", value: 1
  - id: "systolic_bp_lte_100", label: "Systolic blood pressure <= 100 mmHg", type: "boolean", source: "section1", autoPopulateFrom: "vital_signs", value: 1
suggestedTreatments:
  High: ["blood_cultures", "lactate", "iv_fluids_30ml_kg", "broad_spectrum_antibiotics", "icu_consult"]
```

### Cross-Reference Pattern with BM-1.1 Test Library

The `feedsCdrs` field in BM-1.1's test library creates a test-to-CDR mapping. This story's CDR components create the reverse: CDR-to-data-source mapping.

**Example cross-reference:**
- BM-1.1 test library: `{ id: "troponin", feedsCdrs: ["heart"] }` means the troponin test feeds data into the HEART CDR
- This story's HEART CDR: component `{ id: "troponin", source: "section2", autoPopulateFrom: "test_result" }` means the HEART CDR's troponin component gets data from section 2 test results

The `source` values tell the system which Build Mode section provides the data:
- `"section1"` — Initial Evaluation (HPI, exam, vitals, history)
- `"section2"` — Workup & Results (labs, imaging, EKG)
- `"user_input"` — Manual physician entry (not auto-populated from any section)

### Testing

**Build verification:**
```bash
cd backend && pnpm build    # Must pass — verifies TypeScript compilation
cd frontend && pnpm check   # Must pass — typecheck + lint + test
```

**Seed script verification:**
```bash
npx tsx scripts/seed-cdr-library.ts   # Must run without errors
```

**Manual endpoint verification (after deploying or running locally):**
```bash
# Start backend dev server
cd backend && pnpm dev

# Verify CDR library endpoint returns all 13 definitions
curl -H "Authorization: Bearer <valid-firebase-id-token>" \
  http://localhost:8080/v1/libraries/cdrs | jq '.cdrs | length'
# Expected: 13

# Verify HEART score structure
curl -H "Authorization: Bearer <valid-firebase-id-token>" \
  http://localhost:8080/v1/libraries/cdrs | jq '.cdrs[] | select(.id=="heart") | .components | length'
# Expected: 5
```

**Idempotency check:**
- Run `npx tsx scripts/seed-cdr-library.ts` twice. Second run should overwrite without errors or duplicates.

**No PHI check:**
- `git diff` must not contain any patient names, SSNs, DOBs, MRNs, addresses, phone numbers, or specific ages tied to real individuals
- All CDR data uses generic medical terminology only

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 0.1.0 | Initial draft | Technical Scrum Master |
| 2026-02-23 | 1.0.0 | Implementation complete — 13 CDRs, types, endpoint, seed script | Dev Agent (Claude Opus 4.6) |

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References
- Seed script runs but requires Firebase credentials (expected); TypeScript syntax verified via tsx --eval
- No PHI detected in any changes (grep check against diff)

### Completion Notes List
- 13 CDR definitions seeded: HEART, PERC, Wells PE, Wells DVT, PECARN, Ottawa Ankle, Ottawa Knee, Canadian C-Spine, NEXUS, Centor/McIsaac, CHA2DS2-VASc, CURB-65, qSOFA
- Backend types use Zod schemas (CdrDefinitionSchema, CdrComponentSchema, etc.) while frontend uses plain TypeScript interfaces
- Scoring methods: 7 sum, 4 threshold, 2 algorithm
- Cross-reference with BM-1.1 test library verified; noted that old CDR IDs (sepsis, rumack_matthew, canadian_ct_head, sgarbossa) are from legacy markdown system and not in this library
- `centor` feedsCdrs ID in test library maps to `centor_mcisaac` in new CDR library (documented in code comment)
- Endpoint placed in Library Endpoints section after GET /v1/libraries/tests, before admin routes
- No new npm dependencies needed — zod and firebase-admin already available

### File List
- `backend/src/types/libraries.ts` — **MODIFIED** — Added Zod import, CDR Zod schemas (CdrComponentOptionSchema, CdrComponentSourceSchema, CdrComponentTypeSchema, CdrComponentSchema, CdrScoringRangeSchema, CdrScoringSchema, CdrDefinitionSchema) and inferred types
- `frontend/src/types/libraries.ts` — **MODIFIED** — Added CDR plain TypeScript interfaces (CdrComponentOption, CdrComponentSource, CdrComponentType, CdrComponent, CdrScoringRange, CdrScoring, CdrDefinition)
- `backend/src/index.ts` — **MODIFIED** — Added CdrDefinition import, GET /v1/libraries/cdrs endpoint
- `scripts/seed-cdr-library.ts` — **CREATED** — Idempotent Firestore seed script with 13 CDR definitions

---

## QA Results
_(To be populated during QA phase)_
