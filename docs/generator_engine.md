# MDM Generator Engine - Comprehensive Technical Report

## Executive Summary

This document provides a comprehensive analysis of the MDM Generator's AI engine - the complete pipeline from user input to generated Medical Decision Making documentation. The system transforms physician narratives into compliant, high-complexity MDM drafts using an EM-specific "worst-first" approach powered by Google's Vertex AI (Gemini 2.0 Flash).

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Frontend Input Pipeline](#2-frontend-input-pipeline)
3. [Backend Generation Engine](#3-backend-generation-engine)
4. [Prompt Engineering & LLM Configuration](#4-prompt-engineering--llm-configuration)
5. [MDM Generation Rules](#5-mdm-generation-rules)
6. [Output Schema & Validation](#6-output-schema--validation)
7. [Usage Tracking & Subscription Enforcement](#7-usage-tracking--subscription-enforcement)
8. [Error Handling & Fallbacks](#8-error-handling--fallbacks)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │   Compose   │───▶│  Preflight  │───▶│   Output    │───▶│   Copy   │ │
│  │  (Input)    │    │  (PHI Check)│    │  (Display)  │    │(Clipboard)│ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ POST /v1/generate
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND ENGINE                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │   Validate  │───▶│   Prompt    │───▶│  Vertex AI  │───▶│  Parse   │ │
│  │  Auth+Quota │    │   Builder   │    │   (Gemini)  │    │  Output  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │  Firebase   │    │   Vertex    │    │   Stripe    │                  │
│  │    Auth     │    │     AI      │    │  (via ext)  │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Input Pipeline

### 2.1 Input Collection Modes

The system supports two input modes, both ultimately producing a narrative string for the backend:

#### Simple Mode (Default)
**File:** `frontend/src/routes/Compose.tsx`

- Single textarea captures free-form physician narrative
- Placeholder text guides users with example structure
- Real-time character count display
- State: `text` (line 143)

#### Build Mode (Structured Form)
**File:** `frontend/src/routes/Compose.tsx` + `frontend/src/types/buildMode.ts`

Seven structured sections with validation:

| Section | Key Fields | Validation |
|---------|------------|------------|
| Chief Complaint | complaint, context, age, sex | Required: complaint + context + age |
| Problems Considered | emergent[], nonEmergent[] | Required: 3+ emergent OR any non-emergent |
| Data Reviewed | labs, imaging, EKG, externalRecords | Required: labs AND imaging |
| Risk Assessment | highestRiskElement, patientFactors, etc. | Required: highest risk + patient factors |
| Clinical Reasoning | evaluationApproach, keyDecisionPoints | Required: approach + working diagnosis |
| Treatment | medications, procedures, rationale | Required: medications OR procedures |
| Disposition | decision, levelOfCare, rationale | Required: decision + rationale |

### 2.2 Text Aggregation

**Function:** `aggregateFormToNarrative()` (Compose.tsx:24-97)

Converts Build Mode form data to narrative text:
```typescript
// Example output structure:
"45 year old male presents with chest pain.
Problems considered: [emergent conditions], [non-emergent conditions].
Data reviewed: Labs showing [results], Imaging showing [findings]..."
```

### 2.3 Pre-Submission Validation

**File:** `frontend/src/routes/Compose.tsx` (lines 100-139, 292-299)

Checks before submission:
1. **Content validation:** `currentText.trim().length > 0`
2. **Quota verification:** `(remaining ?? 1) > 0`
3. **Section completeness** (Build Mode): 7 sections validated

### 2.4 Preflight Checklist

**File:** `frontend/src/routes/Preflight.tsx`

- PHI acknowledgment checkbox required before generation
- Single confirmation: "I confirm that NO protected health information (PHI) or real patient data is being submitted"
- Auto-triggers generation when token ready (if `skipConfirmation=true`)

### 2.5 API Call Structure

**File:** `frontend/src/lib/api.ts`

```typescript
// Primary generation endpoint
POST /v1/generate
Body: {
  narrative: string,      // The physician narrative (max 16KB)
  userIdToken: string     // Firebase ID token
}
Response: {
  ok: boolean,
  draft: string,          // Formatted MDM text
  draftJson: Mdm,         // Structured JSON
  remaining: number,      // Quota remaining
  plan: string            // Subscription tier
}
```

---

## 3. Backend Generation Engine

### 3.1 Main Generation Endpoint

**File:** `backend/src/index.ts` (lines 239-357)

**Endpoint:** `POST /v1/generate`

**Request Flow:**

```
1. Input Validation (Zod schema)
   └─ narrative: min 1, max 16000 chars
   └─ userIdToken: min 10 chars

2. Authentication
   └─ Firebase ID token verification
   └─ Extract UID and email

3. User Initialization
   └─ Ensure user document exists in Firestore

4. Quota Check
   └─ Verify monthly usage < plan limit
   └─ Return 402 if exceeded

5. Token Limit Validation
   └─ Estimate: Math.ceil(narrative.length / 4)
   └─ Validate against plan's maxTokensPerRequest

6. Prompt Construction
   └─ buildPrompt(narrative) → {system, user}

7. LLM Generation
   └─ callGeminiFlash(prompt) → raw text

8. Response Parsing
   └─ Extract JSON + text from response
   └─ Validate against MdmSchema

9. Usage Tracking
   └─ Increment usedThisPeriod + totalRequests

10. Return Response
    └─ {ok, draft, draftJson, remaining, ...}
```

### 3.2 Input Validation Schema

```typescript
const GenerateSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})
```

---

## 4. Prompt Engineering & LLM Configuration

### 4.1 Two-Part Prompt Architecture

**File:** `backend/src/promptBuilder.ts`

#### System Prompt (lines 13-25)
```
You are an assistant that generates Emergency Medicine Medical
Decision Making (MDM) drafts.

Requirements:
- Worst-first reasoning: explicitly address dangerous diagnoses
  and red flags when clinically supported.
- High-complexity orientation: include data review/ordering and
  risk when clinically supported.
- No fabrication of facts. If the narrative lacks info, state
  conservative defaults (e.g., labs/imaging/consults considered
  but not indicated) and explain reasoning briefly.
- Educational draft only. The physician must review and is
  responsible for accuracy.

Use the following guide to structure the output and ensure completeness:
--- GUIDE START ---
[Full mdm-gen-guide.md content injected here]
--- GUIDE END ---
```

#### User Prompt (lines 27-35)
```
NARRATIVE (physician-provided; do not assume facts not stated):
[User's narrative text]

OUTPUT FORMAT INSTRUCTIONS:
- Return a strict JSON object with keys: differential,
  data_reviewed_ordered, decision_making, risk, disposition, disclaimers.
- Each key should contain strings or arrays of strings as appropriate;
  avoid placeholders like 'TBD'.
- After the JSON, include a delimiter line: '---TEXT---' and then
  a copy-pastable plain-text rendering of the MDM.
```

### 4.2 Vertex AI / Gemini Configuration

**File:** `backend/src/vertex.ts`

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Model | `gemini-2.0-flash-exp` | Fast, cost-effective |
| Temperature | `0.2` | Low randomness for medical accuracy |
| TopP | `0.95` | Nucleus sampling for natural language |
| maxOutputTokens | `8192` | Full MDM output (~4000 typical) |

**Safety Settings:** All set to `BLOCK_MEDIUM_AND_ABOVE`
- HARM_CATEGORY_HATE_SPEECH
- HARM_CATEGORY_DANGEROUS_CONTENT
- HARM_CATEGORY_SEXUALLY_EXPLICIT
- HARM_CATEGORY_HARASSMENT

---

## 5. MDM Generation Rules

### 5.1 Core Philosophy

**Source:** `docs/mdm-gen-guide.md`

#### Worst-First Differential Diagnosis
> "You take pride in creating broad but accurate and patient complaint focused differential diagnoses with a 'worst-first' mentality that is the standard for Emergency Medicine practice, rather than creating a 'most likely' type of differential diagnosis list."

**Implementation:** Emergent conditions listed first, with explicit exclusion reasoning.

#### No Fabrication Rule
> "CRITICAL: you must NEVER make up or hallucinate any components."

**Implementation:** Missing items are omitted or given conservative defaults, never invented.

### 5.2 Problem Classification System (13 Categories)

| # | Classification | Definition Summary |
|---|---------------|---------------------|
| 1 | Self-limited/minor | Transient, won't permanently alter health |
| 2 | Chronic Stable | Expected duration ≥1 year, at treatment goal |
| 3 | Chronic with exacerbation | Acutely worsening, poorly controlled |
| 4 | Chronic with severe exacerbation | Significant morbidity risk, may need care escalation |
| 5 | Undiagnosed new problem | High morbidity risk without treatment |
| 6 | Acute stable | New problem, treatment initiated, improving |
| 7 | Acute uncomplicated | Low morbidity risk, full recovery expected |
| 8 | Acute uncomplicated requiring hospitalization | Same as #7, hospital setting required |
| 9 | Acute with systemic symptoms | High morbidity risk without treatment |
| 10 | Acute complicated injury | Requires multi-system evaluation |
| 11 | Threat to life/bodily function | Requires near-term treatment |

### 5.3 Problem Formatting Structure

Each problem MUST follow this format:
```
[NUMBER]. [CLASS] considered: [Condition].
Suspected due to: [Inclusion reasoning].
[Exclusion method]- [remaining probability]
```

**Differential Limits:** 3-5 emergent conditions + 3-5 non-emergent conditions

### 5.4 Clinical Decision Tools

When mentioned by user, these must be documented by name:
- Canadian CT Head Injury rule
- HEART score
- NEXUS criteria / Canadian c-spine rule
- Ottawa Ankle/Knee Rules
- PECARN (Pediatric Head Injury)
- PERC Rule (Pulmonary Embolism)
- Pneumonia Severity Index / PORT score
- Well's Criteria (DVT and PE)

### 5.5 Explicit Defaults for Missing Information

| Component | Default When Missing |
|-----------|---------------------|
| Laboratory Tests | "considered but given limited utility, not warranted at this time" |
| Imaging Studies | "benefit not deemed greater than risk" |
| EKG/Rhythm Strips | **Remove entire section** |
| Response to Treatment | **Remove entire section** |
| Procedures Performed | **Remove entire section** |
| Reassessments | "unremarkable" |
| Medications (no dosing) | Add "see MAR for dosing" |
| Medications (none) | "see MAR" |
| Meds Considered But Not Given | List 2 drugs of similar class |
| Disposition (discharge, no physician discussion) | "discussion with referred physician considered; patient/family demonstrate clear understanding of issues and close follow-up with their physician was recommended" |

### 5.6 Forbidden Phrasing

**NEVER use:**
- "not documented"
- "none documented"

**Instead:** Remove the component entirely or use specified default.

### 5.7 Special Medical Conditions

#### Alcohol Withdrawal
If mentioned as highest risk element, add verbatim:
> "Patient is at high risk of premature death from trauma, cancer, and organ failure from chronic alcohol abuse and is at risk of immediate seizure, coma, death from acute cessation of alcohol abuse. This necessitates admission to observation for treatment and monitoring to reduce such risks."

#### Substance Abuse
If mentioned as highest risk element, add verbatim:
> "Patient is at high risk of premature death from trauma, organ failure or overdose from continued substance abuse and is unable to abstain due to severity of withdrawal symptoms. This necessitates admission to observation for treatment and monitoring to control such symptoms and reduce such risks."

---

## 6. Output Schema & Validation

### 6.1 JSON Output Schema

**File:** `backend/src/outputSchema.ts`

```typescript
export const MdmSchema = z.object({
  differential: z.union([z.string(), z.array(z.string())]),
  data_reviewed_ordered: z.union([z.string(), z.array(z.string())]),
  decision_making: z.string(),
  risk: z.union([z.string(), z.array(z.string())]),
  disposition: z.string().optional().default(''),
  disclaimers: z.union([z.string(), z.array(z.string())])
    .optional()
    .default('Educational draft. Physician must review. No PHI.'),
})
```

### 6.2 MDM Template Structure

The complete output follows this structure:

```
EMERGENCY DEPARTMENT MEDICAL DECISION MAKING PROCESS:
MEDICAL DECISION MAKING SUMMARY:
  [Brief statement with age/sex/chief complaint/complexity driver]

PROBLEMS CONSIDERED:
  [Numbered list using 13-category classification]

RISK ASSESSMENT:
  - Highest risk element: [Specific intervention/decision]
  - Patient factors: [Age, comorbidities, social determinants]
  - Diagnostic risks: [Radiation, contrast, procedures]
  - Treatment risks: [Medications, interventions]
  - Disposition risks: [If discharged with uncertainty]

CLINICAL REASONING AND MANAGEMENT:
  - Evaluation approach: [...]
  - Key decision points: [...]

DATA COLLECTED, REVIEWED AND ANALYZED:
  - Laboratory: [...]
  - Imaging: [...]
  - EKG: [...]
  - External records: [...]

WORKING DIAGNOSIS: [...]

TREATMENT, PROCEDURES, INTERVENTIONS:
  - Rationale: [...]
  - Medications: [...]
  - Procedures: [...]

DISPOSITION DECISION PROCESS:
  - Reassessments: [...]
  - Response to treatment: [...]
  - External discussions: [...]

DISPOSITION: [Admit/Discharge/Transfer/AMA with rationale]

NOTES:
  - Educational draft. Physician must review. No PHI.
```

### 6.3 Text Rendering Function

**Function:** `renderMdmText(mdm: Mdm)` (outputSchema.ts:14-49)

Converts JSON to formatted, copy-pastable text with proper headers and bullet points.

---

## 7. Usage Tracking & Subscription Enforcement

### 7.1 Plan Features Matrix

**File:** `backend/src/services/userService.ts`

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Requests/Month | 10 | 250 | 1000 |
| Max Tokens/Request | 2000 | 8000 | 16000 |
| Priority Processing | No | Yes | Yes |
| Export Formats | text | text, pdf, docx | text, pdf, docx, json, hl7 |
| API Access | No | Yes | Yes |
| Team Members | 1 | 3 | Unlimited |

### 7.2 Quota Enforcement

**Check Flow:**
```typescript
1. checkQuota(uid)
   ├─ Get user document from Firestore
   ├─ Reset counter if period changed (YYYY-MM)
   ├─ Compare usedThisPeriod vs plan limit
   └─ Return { allowed, used, limit, remaining }

2. If !allowed → Return 402 Payment Required
```

### 7.3 Stripe Integration

**File:** `backend/src/services/userService.ts` (lines 162-207)

- Checks `customers/{uid}/subscriptions` collection
- Filters for `status === 'active'` or `status === 'trialing'`
- Maps price/product IDs to plan tiers:
  ```typescript
  PRICE_TO_PLAN: {
    'price_1SlgUUC8SiPjuMOqTC4BJ9Kf': 'pro',
    'price_1SlgUYC8SiPjuMOqmY9saU3e': 'enterprise',
  }
  ```

---

## 8. Error Handling & Fallbacks

### 8.1 LLM Response Parsing Strategy

**File:** `backend/src/index.ts` (lines 295-333)

**Three-Layer Parsing:**

1. **Strip markdown fences:**
   ```typescript
   cleanedText.replace(/^```json\s*/gm, '').replace(/^```\s*$/gm, '')
   ```

2. **Split on delimiter:**
   ```typescript
   const [jsonPart, textPart] = cleanedText.split('\n---TEXT---\n')
   ```

3. **Fallback JSON extraction:**
   ```typescript
   // If standard parsing fails, search for JSON braces
   const jsonStart = cleanedText.indexOf('{')
   const jsonEnd = cleanedText.lastIndexOf('}')
   ```

### 8.2 Conservative Fallback Defaults

When all parsing fails, return safe defaults:

```typescript
{
  differential: [],
  data_reviewed_ordered: 'Labs were considered but not indicated based on presentation; clinical monitoring prioritized.',
  decision_making: 'Clinical reasoning provided narrative; defaults applied where data absent. Physician must review.',
  risk: ['Discussed risks/benefits; return precautions given.'],
  disposition: '',
  disclaimers: 'Educational draft. Physician must review. No PHI.',
}
```

### 8.3 Error Response Codes

| Code | Meaning | Trigger |
|------|---------|---------|
| 400 | Bad Request | Invalid input, input too large |
| 401 | Unauthorized | Invalid/expired Firebase token |
| 402 | Payment Required | Monthly quota exceeded |
| 500 | Internal Server Error | LLM failure, parsing failure |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/routes/Compose.tsx` | Input collection (Simple/Build modes) |
| `frontend/src/routes/Preflight.tsx` | PHI confirmation, generation trigger |
| `frontend/src/routes/Output.tsx` | MDM display and copy |
| `frontend/src/lib/api.ts` | API client functions |
| `frontend/src/types/buildMode.ts` | Build Mode type definitions |
| `backend/src/index.ts` | API endpoints, main generation flow |
| `backend/src/promptBuilder.ts` | System/user prompt construction |
| `backend/src/vertex.ts` | Vertex AI/Gemini configuration |
| `backend/src/outputSchema.ts` | MDM schema validation and rendering |
| `backend/src/services/userService.ts` | User management, quota tracking |
| `docs/mdm-gen-guide.md` | Complete MDM generation guide |
| `docs/prd.md` | Product requirements |

---

## Summary

The MDM Generator employs a sophisticated pipeline that:

1. **Collects** physician narratives through flexible input modes
2. **Validates** authentication, quotas, and input constraints
3. **Constructs** carefully engineered prompts with embedded medical guidelines
4. **Generates** MDM documentation using Gemini 2.0 Flash with conservative settings
5. **Parses** and validates output against strict medical documentation schemas
6. **Handles** errors gracefully with medically-safe fallback defaults

The system's core differentiator is its **worst-first approach** - prioritizing dangerous diagnoses over likely ones - combined with **explicit defaults** that prevent fabrication while maintaining clinical utility. All outputs include mandatory disclaimers emphasizing educational use and required physician review.
