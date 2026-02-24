# Story BM-1.3: Encounter Schema Extension

## Status

**Done**

## Story

As a **Build Mode developer**, I want the encounter Firestore document schema and frontend types extended to support structured S2 data (selectedTests, testResults, workingDiagnosis), CDR tracking state, and structured S3 data (treatments, disposition, followUp), so that later stories can build structured input UIs and CDR tracking on top of a well-defined, backward-compatible data model.

## Acceptance Criteria

1. New types defined: `TestResult`, `CdrTracking`, `CdrComponentState`, `WorkingDiagnosis`, `DispositionData`
2. Existing encounters without new fields render without errors (backward compat)
3. Zod schemas validate new structured data shapes
4. Frontend and backend types are aligned
5. `pnpm check` passes (frontend), `pnpm build` passes (backend)

## Tasks / Subtasks

### Frontend Types — `frontend/src/types/encounter.ts`

- [x] Define `TestResultStatus` type: `"unremarkable" | "abnormal" | "pending"` (AC: #1)
- [x] Define `TestResult` interface with fields: `status: TestResultStatus`, `quickFindings?: string[]`, `notes?: string | null`, `value?: string | null`, `unit?: string | null` (AC: #1, #4)
- [x] Define `WorkingDiagnosis` interface with fields: `selected: string | null`, `custom?: string | null`, `suggestedOptions?: string[]` (AC: #1, #4)
- [x] Define `CdrComponentSource` type: `"section1" | "section2" | "user_input"` (AC: #1)
- [x] Define `CdrComponentState` interface with fields: `value?: number | null`, `source?: CdrComponentSource | null`, `answered: boolean` (AC: #1, #4)
- [x] Define `CdrStatus` type: `"pending" | "partial" | "completed" | "dismissed"` (AC: #1)
- [x] Define `CdrTrackingEntry` interface with fields: `name: string`, `status: CdrStatus`, `identifiedInSection?: SectionNumber`, `completedInSection?: SectionNumber | null`, `dismissed: boolean`, `components: Record<string, CdrComponentState>`, `score?: number | null`, `interpretation?: string | null` (AC: #1, #4)
- [x] Define `CdrTracking` type: `Record<string, CdrTrackingEntry>` (keyed by CDR ID strings like `"heart"`, `"wells_pe"`) (AC: #1)
- [x] Define `DispositionOption` type: `"discharge" | "observation" | "admit" | "icu" | "transfer" | "ama" | "lwbs" | "deceased"` (AC: #1)
- [x] Define `DispositionData` interface with fields: `disposition?: DispositionOption | null`, `followUp?: string[]`, `appliedDispoFlow?: string | null` (AC: #1, #4)
- [x] Extend `Section2Data` with optional fields: `selectedTests?: string[]`, `testResults?: Record<string, TestResult>`, `allUnremarkable?: boolean`, `pastedRawText?: string | null`, `appliedOrderSet?: string | null`, `workingDiagnosis?: WorkingDiagnosis` (AC: #1, #2)
- [x] Extend `Section3Data` with optional fields: `treatments?: string`, `cdrSuggestedTreatments?: string[]`, `disposition?: DispositionOption | null`, `followUp?: string[]`, `appliedDispoFlow?: string | null` (AC: #1, #2)
- [x] Add optional `cdrTracking?: CdrTracking` field to `EncounterDocument` interface (AC: #1, #2)
- [x] Verify all new fields are optional (use `?`) so existing encounters without them compile without errors (AC: #2)

### Backend Zod Schemas — `backend/src/buildModeSchemas.ts`

- [x] Add `TestResultStatusSchema`: `z.enum(["unremarkable", "abnormal", "pending"])` (AC: #3)
- [x] Add `TestResultSchema`: `z.object({ status: TestResultStatusSchema, quickFindings: z.array(z.string()).optional(), notes: z.string().nullable().optional(), value: z.string().nullable().optional(), unit: z.string().nullable().optional() })` (AC: #3, #4)
- [x] Add `WorkingDiagnosisSchema`: `z.object({ selected: z.string().nullable(), custom: z.string().nullable().optional(), suggestedOptions: z.array(z.string()).optional() })` (AC: #3, #4)
- [x] Add `CdrComponentSourceSchema`: `z.enum(["section1", "section2", "user_input"])` (AC: #3)
- [x] Add `CdrComponentStateSchema`: `z.object({ value: z.number().nullable().optional(), source: CdrComponentSourceSchema.nullable().optional(), answered: z.boolean() })` (AC: #3, #4)
- [x] Add `CdrStatusSchema`: `z.enum(["pending", "partial", "completed", "dismissed"])` (AC: #3)
- [x] Add `CdrTrackingEntrySchema`: `z.object({ name: z.string(), status: CdrStatusSchema, identifiedInSection: z.number().int().min(1).max(3).optional(), completedInSection: z.number().int().min(1).max(3).nullable().optional(), dismissed: z.boolean(), components: z.record(z.string(), CdrComponentStateSchema), score: z.number().nullable().optional(), interpretation: z.string().nullable().optional() })` (AC: #3, #4)
- [x] Add `CdrTrackingSchema`: `z.record(z.string(), CdrTrackingEntrySchema).optional().default({})` (AC: #3)
- [x] Add `DispositionOptionSchema`: `z.enum(["discharge", "observation", "admit", "icu", "transfer", "ama", "lwbs", "deceased"])` (AC: #3)
- [x] Extend `EncounterDocumentSchema` with `.optional().default()` for `cdrTracking`, and extended section schemas with `.optional()` / `.default()` for new fields (AC: #2, #3)
- [x] Do NOT modify existing `Section1RequestSchema`, `Section2RequestSchema`, `FinalizeRequestSchema`, or any response schemas — endpoint behavior is unchanged (AC: #3, #5)

### Defensive Defaults — `frontend/src/hooks/useEncounter.ts`

- [x] In the `onSnapshot` handler, spread defaults for `section2` new fields: `selectedTests: data.section2?.selectedTests ?? []`, `testResults: data.section2?.testResults ?? {}`, `allUnremarkable: data.section2?.allUnremarkable ?? false`, `pastedRawText: data.section2?.pastedRawText ?? null`, `appliedOrderSet: data.section2?.appliedOrderSet ?? null`, `workingDiagnosis: data.section2?.workingDiagnosis ?? undefined` (AC: #2)
- [x] In the `onSnapshot` handler, spread defaults for `section3` new fields: `treatments: data.section3?.treatments ?? undefined`, `cdrSuggestedTreatments: data.section3?.cdrSuggestedTreatments ?? []`, `disposition: data.section3?.disposition ?? null`, `followUp: data.section3?.followUp ?? []`, `appliedDispoFlow: data.section3?.appliedDispoFlow ?? null` (AC: #2)
- [x] Add defensive default for `cdrTracking`: `cdrTracking: data.cdrTracking ?? {}` (AC: #2)
- [x] Verify existing encounters without the new fields still hydrate correctly through the `onSnapshot` handler without runtime errors (AC: #2, #5)

### Quality Verification

- [x] Run `cd frontend && pnpm check` — must pass (typecheck + lint + test) (AC: #5)
- [x] Run `cd backend && pnpm build` — must pass (TypeScript compilation) (AC: #5)
- [ ] Manually verify: load an existing encounter document that has no new fields — no console errors, renders normally (AC: #2)

## Dev Notes

### File 1: `frontend/src/types/encounter.ts`

**Full path:** `frontend/src/types/encounter.ts`

This file defines all TypeScript interfaces for the encounter data model. The current `Section2Data` interface (lines 169-187) and `Section3Data` interface (lines 194-210) need extension. The `EncounterDocument` interface (lines 229-269) needs a `cdrTracking` field.

**Current `Section2Data` (lines 169-187):**
```typescript
export interface Section2Data {
  status: SectionStatus
  content: string
  submissionCount: number
  isLocked: boolean
  workingDiagnosis?: string  // NOTE: currently a plain string, will coexist with new WorkingDiagnosis type
  llmResponse?: {
    mdmPreview: MdmPreview
    processedAt: Timestamp
  }
}
```

**Current `Section3Data` (lines 194-210):**
```typescript
export interface Section3Data {
  status: SectionStatus
  content: string
  submissionCount: number
  isLocked: boolean
  llmResponse?: {
    finalMdm: FinalMdm
    processedAt: Timestamp
  }
}
```

**Key decisions:**
- The existing `workingDiagnosis?: string` on `Section2Data` stays as-is for backward compatibility. The new `WorkingDiagnosis` interface is a richer structured type that will be used by the new UI. Both can coexist — the plain string is what existing encounters have, the structured `WorkingDiagnosis` is what new encounters will populate.
- All new fields MUST use `?` (optional) in the TypeScript interfaces so that existing encounters missing these fields remain type-compatible.
- `selectedTests` stores test ID strings (e.g., `"ecg"`, `"troponin"`) which correspond to `TestDefinition.id` from the test library (BM-1.1). Do NOT import or reference `TestDefinition` — just use `string[]`.
- `testResults` is a `Record<string, TestResult>` keyed by test ID. Not all selected tests will have results yet.
- CDR IDs in `CdrTracking` keys (e.g., `"heart"`, `"wells_pe"`) correspond to `CdrDefinition.id` from the CDR library (BM-1.2). Do NOT import or reference `CdrDefinition`.

**Placement:** Add new type definitions in a new section between the "LLM Response Types" block and the "Section Data Interfaces" block (between lines 135 and 137). This keeps them grouped logically before they are used in the section interfaces.

### File 2: `backend/src/buildModeSchemas.ts`

**Full path:** `backend/src/buildModeSchemas.ts`

This file uses Zod for all schema definitions. The existing pattern uses `.default()` on section fields within `EncounterDocumentSchema` (lines 182-194).

**Current `EncounterDocumentSchema` (lines 182-194):**
```typescript
export const EncounterDocumentSchema = z.object({
  userId: z.string(),
  roomNumber: z.string(),
  chiefComplaint: z.string(),
  status: EncounterStatusSchema.default('draft'),
  quotaCounted: z.boolean().default(false),
  section1: SectionDataSchema.default({}),
  section2: SectionDataSchema.default({}),
  section3: SectionDataSchema.default({}),
  createdAt: z.any(),
  updatedAt: z.any(),
  shiftStartedAt: z.any(),
})
```

**Key decisions:**
- New schemas should be placed AFTER the existing `FinalizeResponseSchema` block (after line 140) and BEFORE the Firestore Document Schemas section (line 142). This groups all the new structured-data schemas together.
- Use `.optional()` on all new fields within the section schema extensions so that existing data without these fields passes validation.
- Use `.default({})` on `cdrTracking` in the `EncounterDocumentSchema` so it always resolves to an empty object.
- Do NOT modify any existing request or response schemas (`Section1RequestSchema`, `Section2RequestSchema`, `FinalizeRequestSchema`, `Section1ResponseSchema`, `Section2ResponseSchema`, `FinalizeResponseSchema`). Endpoint behavior changes happen in later stories (BM-8.1).
- The `SectionDataSchema` is currently generic for all sections. The new structured fields for S2 and S3 can be added as `.optional()` fields directly to `SectionDataSchema` (since S1 will simply ignore them), OR separate S2/S3-specific schemas can be created. **Recommended approach:** Add the new fields as `.optional()` to `SectionDataSchema` since the existing pattern is a single generic schema. This avoids breaking the `EncounterDocumentSchema` which references `SectionDataSchema` for all three sections.

### File 3: `frontend/src/hooks/useEncounter.ts`

**Full path:** `frontend/src/hooks/useEncounter.ts`

The `onSnapshot` handler (lines 88-144) constructs `EncounterDocument` from raw Firestore data. This is where defensive defaults must be applied.

**Current onSnapshot handler construction (lines 97-117):**
```typescript
const encounterData: EncounterDocument = {
  id: snapshot.id,
  userId: data.userId,
  roomNumber: data.roomNumber,
  chiefComplaint: data.chiefComplaint,
  status: data.status,
  currentSection: data.currentSection,
  mode: data.mode || 'build',
  quickModeData: data.quickModeData,
  section1: data.section1,
  section2: data.section2,
  section3: data.section3,
  quotaCounted: data.quotaCounted,
  quotaCountedAt: data.quotaCountedAt,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  shiftStartedAt: data.shiftStartedAt,
  archivedAt: data.archivedAt,
}
```

**Required change:** Replace the direct `data.section2` / `data.section3` assignments with spread+defaults:

```typescript
section2: {
  ...data.section2,
  selectedTests: data.section2?.selectedTests ?? [],
  testResults: data.section2?.testResults ?? {},
  allUnremarkable: data.section2?.allUnremarkable ?? false,
  pastedRawText: data.section2?.pastedRawText ?? null,
  appliedOrderSet: data.section2?.appliedOrderSet ?? null,
  workingDiagnosis: data.section2?.workingDiagnosis ?? undefined,
},
section3: {
  ...data.section3,
  treatments: data.section3?.treatments ?? undefined,
  cdrSuggestedTreatments: data.section3?.cdrSuggestedTreatments ?? [],
  disposition: data.section3?.disposition ?? null,
  followUp: data.section3?.followUp ?? [],
  appliedDispoFlow: data.section3?.appliedDispoFlow ?? null,
},
cdrTracking: data.cdrTracking ?? {},
```

Note: `section1` is NOT modified in this story — S1 has no new structured fields.

**Import changes:** The `useEncounter.ts` import block (lines 15-24) already imports `Section2Data` and `Section3Data`. If the new types are only used by the interfaces (which they are — the hook just spreads defaults), no new imports are needed in this file.

### Data Model Reference (from prototype spec)

**Section 2 Additions — full shape:**
```json
{
  "section2": {
    "selectedTests": ["ecg", "troponin", "cbc", "bmp", "cxr", "d-dimer"],
    "testResults": {
      "ecg": {
        "status": "abnormal",
        "quickFindings": ["st_depression"],
        "notes": "ST depression lateral leads, no STEMI criteria",
        "value": null
      },
      "troponin": {
        "status": "abnormal",
        "value": "2.5",
        "unit": "ng/mL",
        "notes": null
      },
      "cbc": { "status": "unremarkable" },
      "bmp": { "status": "unremarkable" }
    },
    "allUnremarkable": false,
    "pastedRawText": null,
    "appliedOrderSet": "order-set-id-123",
    "workingDiagnosis": {
      "selected": "nstemi_acs",
      "custom": null,
      "suggestedOptions": ["nstemi_acs", "unstable_angina", "msk_chest_pain"]
    }
  }
}
```

**CDR Tracking — full shape:**
```json
{
  "cdrTracking": {
    "heart": {
      "name": "HEART Score",
      "status": "completed",
      "identifiedInSection": 1,
      "completedInSection": 2,
      "dismissed": false,
      "components": {
        "history": { "value": 2, "source": "section1", "answered": true },
        "ecg": { "value": 2, "source": "section2", "answered": true },
        "age": { "value": 1, "source": "section1", "answered": true },
        "riskFactors": { "value": 2, "source": "user_input", "answered": true },
        "troponin": { "value": 2, "source": "section2", "answered": true }
      },
      "score": 9,
      "interpretation": "High Risk - 50-65% risk MACE at 6 weeks"
    }
  }
}
```

**Section 3 Additions — full shape:**
```json
{
  "section3": {
    "treatments": "Patient given aspirin 325mg...",
    "cdrSuggestedTreatments": ["aspirin_325"],
    "disposition": "discharge",
    "followUp": ["cardiology_48hr", "return_ed_prn"],
    "appliedDispoFlow": "dispo-flow-id-456"
  }
}
```

### Cross-Story Dependencies

- **BM-1.1 (Master Test Library):** Defines `TestDefinition` with `.id` field. The `selectedTests: string[]` and `testResults: Record<string, TestResult>` keys use these IDs. This story does NOT import `TestDefinition` — it just uses `string` keys.
- **BM-1.2 (CDR Library):** Defines `CdrDefinition` with `.id` field. The `CdrTracking` record keys use these IDs. The `CdrComponentState.source` values (`"section1"`, `"section2"`, `"user_input"`) match the CDR library's component source enum. This story does NOT import `CdrDefinition`.
- **Downstream consumers:** BM-2.1 (Dashboard), BM-3.1 (CDR Matching), BM-4.1 (Result Entry), BM-6.1 (Treatment Input), BM-6.2 (Disposition Selector), and BM-8.1 (S2 Submission Refactor) all depend on the types defined in this story.

### Scope Boundaries

- This story is **schema-only**. No endpoint behavior changes. No UI changes. No prompt builder changes.
- The `Section2RequestSchema` and `FinalizeRequestSchema` are NOT modified — those changes happen in BM-8.1 and BM-6.3 respectively.
- The existing `workingDiagnosis?: string` field on `Section2Data` is preserved as-is. The new structured `WorkingDiagnosis` type is an additional optional field (or the existing field could be widened to `string | WorkingDiagnosis` if preferred — but separate fields are cleaner for backward compat).

### Testing

- **Type safety:** `cd frontend && pnpm check` validates that all type changes compile cleanly and that no existing code breaks from the new optional fields.
- **Backend compilation:** `cd backend && pnpm build` validates that Zod schema changes compile and don't conflict with existing schemas.
- **Runtime backward compat:** Load an existing encounter (one created before this change) via the dev environment. Verify:
  - No console errors in browser DevTools
  - Encounter renders normally in Build Mode kanban/wallet
  - Section 2 and Section 3 display existing content without issues
  - The `onSnapshot` handler hydrates the document with default values for missing fields
- **No existing test breakage:** Any existing tests in `frontend/src/__tests__/` that reference encounter types must still pass. If tests construct mock `EncounterDocument` objects, they should still compile because all new fields are optional.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 0.1 | Initial draft | AI Story Writer |
| 2026-02-23 | 1.0 | Implementation complete | Dev Agent |
| 2026-02-23 | 1.1 | QA review + refactoring (SectionNumber ordering, CdrTrackingSchema reusability) | Quinn QA |

## File List

| Action | File |
|--------|------|
| Modified | `frontend/src/types/encounter.ts` |
| Modified | `backend/src/buildModeSchemas.ts` |
| Modified | `frontend/src/hooks/useEncounter.ts` |

## Dev Agent Record

### Implementation Notes
- Added 10 new types/interfaces to `frontend/src/types/encounter.ts` in a new "Structured Data Types (Build Mode v2 Extensions)" section between LLM Response Types and Section Data Interfaces
- Added 10 corresponding Zod schemas to `backend/src/buildModeSchemas.ts` in a new "Structured Data Schemas" section between Response Schemas and Firestore Document Schemas
- Extended `SectionDataSchema` with optional S2/S3 fields (single generic schema approach per dev notes)
- Added `cdrTracking` with `.optional().default({})` to `EncounterDocumentSchema`
- Applied defensive defaults in `useEncounter.ts` onSnapshot handler for all new S2, S3, and cdrTracking fields
- All existing tests pass (6/6), no regressions

### Decisions Made
- **workingDiagnosis union type**: Widened existing `workingDiagnosis?: string` to `workingDiagnosis?: string | WorkingDiagnosis` in frontend types and `z.union([z.string(), WorkingDiagnosisSchema]).nullable().optional()` in backend schema. This allows gradual migration from plain string (legacy encounters) to structured object (v2 encounters) without a field rename. The union approach was chosen over separate fields because Firestore will hold either format in the same field path.
- **Single SectionDataSchema**: Added all new S2/S3 fields as `.optional()` to the existing generic `SectionDataSchema` (per dev notes recommendation) rather than creating separate S2/S3-specific schemas. S1 simply ignores the absent fields.

### Deviations from Story
- The `workingDiagnosis` field on `Section2Data` was widened to `string | WorkingDiagnosis` instead of keeping the existing `string` unchanged and adding a separate field. The dev notes suggested either approach; the union type is more pragmatic since Firestore will store both formats in the same field path.
- Manual verification task (loading existing encounter in browser) left unchecked — requires running dev server and manual browser testing by the user.

## QA Results

### Review Date: 2026-02-23

### Reviewed By: Quinn (Senior Developer QA)

### Code Quality Assessment

Strong implementation. All 10 new types/interfaces defined cleanly with proper optional fields for backward compatibility. The union type approach for `workingDiagnosis` (`string | WorkingDiagnosis`) is pragmatic and well-documented. Defensive defaults in `useEncounter.ts` cover all new fields correctly. The single `SectionDataSchema` approach (rather than per-section schemas) is appropriate for this phase — the generic schema keeps the existing `EncounterDocumentSchema` intact.

### Refactoring Performed

- **File**: `frontend/src/types/encounter.ts`
  - **Change**: Moved `SectionNumber` type from Utility Types section (line 400) to a new "Foundational Types" section before the Structured Data Types block (line 137)
  - **Why**: `CdrTrackingEntry.identifiedInSection` and `.completedInSection` reference `SectionNumber` 220 lines before its definition. TypeScript hoists declarations so it compiles, but top-to-bottom readability suffers.
  - **How**: Readers encountering `CdrTrackingEntry` now see `SectionNumber` already defined above, improving code navigation and comprehension.

- **File**: `backend/src/buildModeSchemas.ts`
  - **Change**: Removed `.optional().default({})` from `CdrTrackingSchema` definition; applied it at the field level in `EncounterDocumentSchema` instead (`cdrTracking: CdrTrackingSchema.optional().default({})`)
  - **Why**: Baking `.optional().default({})` into the schema definition means every consumer inherits those modifiers. If a downstream story (e.g., BM-8.1) needs `CdrTrackingSchema` for request validation where missing data should be an error, it can't reuse the schema.
  - **How**: The schema now describes the data shape only. Field-level concerns (optional, defaults) are applied at the point of use, making the schema reusable for both lenient (Firestore document) and strict (request validation) contexts.

### Compliance Check

- Coding Standards: ✓ — All new types follow existing naming conventions, JSDoc comments match existing style
- Project Structure: ✓ — Types in `frontend/src/types/encounter.ts`, schemas in `backend/src/buildModeSchemas.ts`, defaults in `useEncounter.ts`
- Testing Strategy: ✓ — Existing 6/6 tests pass, no new runtime behavior to test (schema-only story)
- All ACs Met: ✓ — See detailed check below:
  - AC1 (New types defined): ✓ `TestResult`, `CdrTracking`, `CdrComponentState`, `WorkingDiagnosis`, `DispositionData` all defined
  - AC2 (Backward compat): ✓ All fields optional, defensive defaults in onSnapshot handler
  - AC3 (Zod schemas): ✓ All 10 schemas added, SectionDataSchema extended, EncounterDocumentSchema extended
  - AC4 (Frontend/backend aligned): ✓ with note (see below)
  - AC5 (pnpm check/build pass): ✓ Both pass after refactoring

### Improvements Checklist

- [x] Moved `SectionNumber` type above structured data types for readability (encounter.ts)
- [x] Separated `CdrTrackingSchema` definition from field-level modifiers for reusability (buildModeSchemas.ts)
- [ ] Consider aligning backend exported type names with frontend: `WorkingDiagnosisStructured` → `WorkingDiagnosis`, `CdrStatusType` → `CdrStatus` — currently divergent to avoid Zod schema/type name collisions, but downstream stories importing from both layers will need to know about this
- [ ] Manual browser verification: load existing encounter without new fields, confirm no console errors (requires dev server)

### Security Review

No security concerns. This is a schema-only change with no new endpoints, no new Firestore writes, and no user input handling. All new fields are validated by Zod schemas with appropriate constraints.

### Performance Considerations

No performance concerns. The spread+defaults in `useEncounter.ts` onSnapshot handler adds negligible overhead (object spread of ~6 fields per section, executed once per Firestore snapshot).

### Final Status

✓ Approved - Ready for Done

All acceptance criteria met. Two minor items left unchecked (backend type name alignment and manual browser verification) are non-blocking — the naming divergence is a downstream concern, and the browser verification requires a running dev environment with existing encounter data.
