# MDM Generator — Backend API Contract

> Source of truth for Swift Codable model generation.
> Derived from `backend/src/index.ts` and `backend/src/buildModeSchemas.ts`.
> Last verified: 2026-02-23

---

## Authentication Pattern

All authenticated endpoints require a Firebase ID token. The token is sent in the request body as `userIdToken` (string, min 10 chars). The backend verifies via `admin.auth().verifyIdToken()` and extracts `uid` and `email`.

```
Authorization flow:
  1. Client obtains Firebase ID token from FirebaseAuth SDK
  2. Client includes token as `userIdToken` field in POST body
  3. Backend verifies token, extracts uid
  4. Backend checks subscription tier for authorization
```

---

## Subscription Tiers

| Tier | `plan` value | Monthly Quota | Max Tokens/Request | Priority | Export Formats | Surveillance | API Access |
|------|-------------|--------------|-------------------|----------|---------------|--------------|-----------|
| Free | `"free"` | 10 | 2,000 | No | text | No | No |
| Pro | `"pro"` | 250 | 8,000 | Yes | text, pdf, docx | Yes | Yes |
| Enterprise | `"enterprise"` | 1,000 | 16,000 | Yes | text, pdf, docx, json, hl7 | Yes | Yes |
| Admin | `"admin"` | Unlimited | 32,000 | Yes | All | Yes | Yes |

---

## Endpoints

### 1. GET /health

**Purpose:** Health check. No authentication required.

**Response:**
```json
{ "ok": true }
```

**Swift model:**
```swift
struct HealthResponse: Codable {
    let ok: Bool
}
```

---

### 2. POST /v1/whoami

**Purpose:** Validate auth token, return user info and usage statistics.

**Request body:**
```json
{
  "userIdToken": "firebase-id-token-string"
}
```

**Response (200):**
```json
{
  "ok": true,
  "uid": "user-uid",
  "email": "user@example.com",
  "plan": "free",
  "used": 3,
  "limit": 10,
  "remaining": 7,
  "features": {
    "maxRequestsPerMonth": 10,
    "maxTokensPerRequest": 2000,
    "priorityProcessing": false,
    "exportFormats": ["text"],
    "apiAccess": false,
    "teamMembers": 1
  }
}
```

**Error responses:**
- 400: `{ "error": "Invalid request" }`
- 401: `{ "error": "Unauthorized" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct WhoAmIRequest: Codable {
    let userIdToken: String
}

struct UserFeatures: Codable {
    let maxRequestsPerMonth: Int
    let maxTokensPerRequest: Int
    let priorityProcessing: Bool
    let exportFormats: [String]
    let apiAccess: Bool
    let teamMembers: Int
}

struct WhoAmIResponse: Codable {
    let ok: Bool
    let uid: String
    let email: String
    let plan: String
    let used: Int
    let limit: Int
    let remaining: Int
    let features: UserFeatures
}
```

---

### 3. POST /v1/admin/set-plan

**Purpose:** Admin-only endpoint to set a user's subscription plan. Requires `admin` custom claim on the Firebase token.

**Request body:**
```json
{
  "adminToken": "firebase-id-token-with-admin-claim",
  "targetUid": "target-user-uid",
  "plan": "pro"
}
```

**`plan` enum values:** `"free"`, `"pro"`, `"enterprise"`

**Response (200):**
```json
{
  "ok": true,
  "message": "User {uid} updated to {plan} plan"
}
```

**Error responses:**
- 400: `{ "error": "Invalid request" }`
- 401: `{ "error": "Invalid admin token" }`
- 403: `{ "error": "Admin access required" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct AdminSetPlanRequest: Codable {
    let adminToken: String
    let targetUid: String
    let plan: String  // "free" | "pro" | "enterprise"
}

struct AdminSetPlanResponse: Codable {
    let ok: Bool
    let message: String
}
```

---

### 4. POST /v1/parse-narrative

**Purpose:** Parse a physician narrative into structured MDM fields. UI helper — does NOT count against user quota.

**Rate limit:** 5 requests/min per IP

**Request body:**
```json
{
  "narrative": "Patient narrative text (max 16000 chars)",
  "userIdToken": "firebase-id-token"
}
```

**Response (200):**
```json
{
  "ok": true,
  "parsed": {
    "chiefComplaint": "chest pain",
    "hpiFields": { ... },
    "examFindings": { ... },
    "riskFactors": [ ... ],
    "initialImpression": "..."
  },
  "confidence": 0.85,
  "warnings": ["Some field could not be extracted"]
}
```

**Error responses:**
- 400: `{ "error": "Invalid request" }`
- 401: `{ "error": "Unauthorized" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct ParseNarrativeRequest: Codable {
    let narrative: String
    let userIdToken: String
}

struct ParsedNarrative: Codable {
    let chiefComplaint: String?
    let hpiFields: [String: String]?
    let examFindings: [String: String]?
    let riskFactors: [String]?
    let initialImpression: String?
}

struct ParseNarrativeResponse: Codable {
    let ok: Bool
    let parsed: ParsedNarrative
    let confidence: Double
    let warnings: [String]
}
```

---

### 5. POST /v1/generate

**Purpose:** Legacy one-shot MDM generation. Single narrative in, complete MDM out. Counts against quota.

**Rate limit:** 10 requests/min per IP

**Request body:**
```json
{
  "narrative": "Full patient narrative (max 16000 chars)",
  "userIdToken": "firebase-id-token"
}
```

**Response (200):**
```json
{
  "ok": true,
  "draft": "Formatted MDM text for EHR paste",
  "draftJson": {
    "differential": [...],
    "data_reviewed_ordered": "...",
    "decision_making": "...",
    "risk": ["..."],
    "disposition": "...",
    "disclaimers": "..."
  },
  "uid": "user-uid",
  "remaining": 7,
  "plan": "free",
  "used": 3,
  "limit": 10
}
```

**Error responses:**
- 400: `{ "error": "Invalid request" }` or `{ "error": "Input too large...", "tokenEstimate": N, "maxAllowed": N }`
- 401: `{ "error": "Unauthorized" }`
- 402: `{ "error": "Monthly quota exceeded", "used": N, "limit": N, "remaining": 0 }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct GenerateRequest: Codable {
    let narrative: String
    let userIdToken: String
}

struct LegacyMdmJson: Codable {
    let differential: [DifferentialEntry]?
    let dataReviewedOrdered: String?
    let decisionMaking: String?
    let risk: [String]?
    let disposition: String?
    let disclaimers: String?

    enum CodingKeys: String, CodingKey {
        case differential
        case dataReviewedOrdered = "data_reviewed_ordered"
        case decisionMaking = "decision_making"
        case risk, disposition, disclaimers
    }
}

struct GenerateResponse: Codable {
    let ok: Bool
    let draft: String
    let draftJson: LegacyMdmJson?
    let uid: String
    let remaining: Int
    let plan: String
    let used: Int
    let limit: Int
}
```

---

### 6. POST /v1/build-mode/process-section1

**Purpose:** Process initial evaluation (Section 1) and generate worst-first differential diagnosis.

**Rate limit:** 10 requests/min per IP
**Max content length:** 4,000 characters

**Request body:**
```json
{
  "encounterId": "encounter-uuid",
  "content": "Patient presentation narrative (max 4000 chars)",
  "userIdToken": "firebase-id-token",
  "location": {
    "zipCode": "90210",
    "state": "CA"
  }
}
```

The `location` field is optional. If provided, enables surveillance enrichment.

**Response (200):**
```json
{
  "ok": true,
  "differential": [
    {
      "diagnosis": "Acute Coronary Syndrome",
      "urgency": "emergent",
      "reasoning": "Chest pain with risk factors...",
      "regionalContext": "Optional surveillance context",
      "cdrContext": "Optional CDR context"
    }
  ],
  "submissionCount": 1,
  "isLocked": false,
  "quotaRemaining": 9
}
```

**`urgency` enum values:** `"emergent"`, `"urgent"`, `"routine"`

**Section locking:** After 2 submissions, `isLocked: true` and further submissions return 400.

**Quota:** Counted once per encounter on first S1 submission.

**Error responses:**
- 400: `{ "error": "Invalid request" }` or `{ "error": "Section 1 is locked after 2 submissions", "submissionCount": 2, "isLocked": true }`
- 401: `{ "error": "Unauthorized" }`
- 402: `{ "error": "Monthly quota exceeded", "used": N, "limit": N, "remaining": 0 }`
- 404: `{ "error": "Encounter not found" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct Section1Request: Codable {
    let encounterId: String
    let content: String
    let userIdToken: String
    let location: LocationInput?
}

struct LocationInput: Codable {
    let zipCode: String?
    let state: String?
}

struct DifferentialItem: Codable, Identifiable {
    var id: String { diagnosis }
    let diagnosis: String
    let urgency: Urgency
    let reasoning: String
    let regionalContext: String?
    let cdrContext: String?
}

enum Urgency: String, Codable, CaseIterable {
    case emergent
    case urgent
    case routine
}

struct Section1Response: Codable {
    let ok: Bool
    let differential: [DifferentialItem]
    let submissionCount: Int
    let isLocked: Bool
    let quotaRemaining: Int
}
```

---

### 7. POST /v1/build-mode/process-section2

**Purpose:** Process workup and results (Section 2), generate MDM preview.

**Rate limit:** 10 requests/min per IP
**Max content length:** 3,000 characters
**Prerequisite:** Section 1 must be completed.

**Request body:**
```json
{
  "encounterId": "encounter-uuid",
  "content": "Workup and results narrative (max 3000 chars)",
  "workingDiagnosis": "Optional working diagnosis override",
  "userIdToken": "firebase-id-token"
}
```

**Response (200):**
```json
{
  "ok": true,
  "mdmPreview": {
    "problems": ["Problem 1", "Problem 2"],
    "differential": ["Diagnosis A", "Diagnosis B"],
    "dataReviewed": ["CBC: WNL", "BMP: elevated creatinine"],
    "reasoning": "Clinical reasoning text...",
    "regionalSurveillance": "Optional surveillance context",
    "cdrResults": "Optional CDR results"
  },
  "submissionCount": 1,
  "isLocked": false
}
```

**Note:** The `problems`, `differential`, and `dataReviewed` fields have flexible types from the LLM — they may be strings, string arrays, or objects. The Swift client should handle all variants defensively.

**Error responses:**
- 400: `{ "error": "Section 1 must be completed before processing Section 2" }` or section locked error
- 401: `{ "error": "Unauthorized" }`
- 404: `{ "error": "Encounter not found" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct Section2Request: Codable {
    let encounterId: String
    let content: String
    let workingDiagnosis: String?
    let userIdToken: String
}

struct MdmPreview: Codable {
    let problems: FlexibleStringArray
    let differential: FlexibleStringArray
    let dataReviewed: FlexibleStringArray
    let reasoning: String
    let regionalSurveillance: String?
    let cdrResults: String?
}

struct Section2Response: Codable {
    let ok: Bool
    let mdmPreview: MdmPreview
    let submissionCount: Int
    let isLocked: Bool
}
```

**`FlexibleStringArray`** — a custom Codable type that decodes from `String`, `[String]`, or `[Object]` into `[String]`. Required because LLM output varies.

---

### 8. POST /v1/build-mode/finalize

**Purpose:** Process treatment and disposition (Section 3), generate final MDM text.

**Rate limit:** 10 requests/min per IP
**Max content length:** 2,500 characters
**Prerequisite:** Section 2 must be completed.

**Request body:**
```json
{
  "encounterId": "encounter-uuid",
  "content": "Treatment and disposition narrative (max 2500 chars)",
  "userIdToken": "firebase-id-token"
}
```

**Response (200):**
```json
{
  "ok": true,
  "finalMdm": {
    "text": "Complete MDM text for EHR paste...",
    "json": {
      "problems": ["Problem 1"],
      "differential": ["Diagnosis A", "Diagnosis B"],
      "dataReviewed": ["CBC", "BMP", "CT Head"],
      "reasoning": "Clinical reasoning...",
      "risk": ["Discussed risks/benefits", "Return precautions given"],
      "disposition": "Discharge home with follow-up",
      "complexityLevel": "high",
      "regionalSurveillance": "Optional",
      "clinicalDecisionRules": "Optional"
    }
  },
  "quotaRemaining": 9
}
```

**`complexityLevel` enum values:** `"low"`, `"moderate"`, `"high"`

**Note:** `problems`, `differential`, `dataReviewed`, and `risk` may be `string` or `string[]`.

**Error responses:**
- 400: `{ "error": "Section 2 must be completed before finalizing" }` or section locked error
- 401: `{ "error": "Unauthorized" }`
- 404: `{ "error": "Encounter not found" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct FinalizeRequest: Codable {
    let encounterId: String
    let content: String
    let userIdToken: String
}

struct FinalMdmJson: Codable {
    let problems: FlexibleStringArray
    let differential: FlexibleStringArray
    let dataReviewed: FlexibleStringArray
    let reasoning: String
    let risk: FlexibleStringArray
    let disposition: String
    let complexityLevel: ComplexityLevel?
    let regionalSurveillance: String?
    let clinicalDecisionRules: String?
}

enum ComplexityLevel: String, Codable {
    case low
    case moderate
    case high
}

struct FinalMdm: Codable {
    let text: String
    let json: FinalMdmJson
}

struct FinalizeResponse: Codable {
    let ok: Bool
    let finalMdm: FinalMdm
    let quotaRemaining: Int
}
```

---

### 9. POST /v1/quick-mode/generate

**Purpose:** One-shot MDM generation for Quick Mode encounters. Extracts patient identifier and generates complete MDM in a single call.

**Rate limit:** 10 requests/min per IP
**Max narrative length:** 16,000 characters

**Request body:**
```json
{
  "encounterId": "encounter-uuid",
  "narrative": "Full patient narrative (max 16000 chars)",
  "userIdToken": "firebase-id-token",
  "location": {
    "zipCode": "90210",
    "state": "CA"
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "mdm": {
    "text": "Complete MDM text for EHR paste...",
    "json": {
      "problems": [...],
      "differential": [...],
      "dataReviewed": [...],
      "reasoning": "...",
      "risk": [...],
      "disposition": "..."
    }
  },
  "patientIdentifier": {
    "age": "45",
    "sex": "Male",
    "chiefComplaint": "chest pain",
    "roomNumber": "12A"
  },
  "quotaRemaining": 8
}
```

**Encounter constraint:** Must be a `mode: "quick"` encounter. Cannot be re-processed once completed.

**Error responses:**
- 400: `{ "error": "Invalid request" }` or `{ "error": "This endpoint is for quick mode encounters only" }` or `{ "error": "Encounter already processed" }`
- 401: `{ "error": "Unauthorized" }`
- 402: `{ "error": "Monthly quota exceeded", ... }`
- 404: `{ "error": "Encounter not found" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct QuickModeRequest: Codable {
    let encounterId: String
    let narrative: String
    let userIdToken: String
    let location: LocationInput?
}

struct PatientIdentifier: Codable {
    let age: String?
    let sex: String?
    let chiefComplaint: String?
    let roomNumber: String?
}

struct QuickModeMdm: Codable {
    let text: String
    let json: [String: AnyCodable]  // Flexible structure
}

struct QuickModeResponse: Codable {
    let ok: Bool
    let mdm: QuickModeMdm
    let patientIdentifier: PatientIdentifier
    let quotaRemaining: Int
}
```

---

### 10. POST /v1/surveillance/analyze

**Purpose:** Run regional trend analysis against CDC data sources. Requires Pro or Enterprise plan.

**Rate limit:** Global (60/min)

**Request body:**
```json
{
  "userIdToken": "firebase-id-token",
  "chiefComplaint": "cough and fever",
  "differential": ["Pneumonia", "COVID-19", "Influenza"],
  "location": {
    "zipCode": "90210",
    "state": "CA"
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "analysis": {
    "analysisId": "uuid",
    "region": { ... },
    "regionLabel": "Los Angeles, CA area — HHS Region 9",
    "rankedFindings": [
      {
        "condition": "Influenza",
        "tier": "high",
        "relevance": 0.85,
        "explanation": "...",
        "dataPoints": [...]
      }
    ],
    "alerts": [...],
    "summary": "Regional surveillance in LA shows notable activity for Influenza.",
    "dataSourcesQueried": ["CDC Respiratory", "NWSS Wastewater"],
    "dataSourceErrors": [],
    "dataSourceSummaries": [...],
    "analyzedAt": "2026-02-23T12:00:00.000Z"
  },
  "warnings": []
}
```

**Error responses:**
- 400: `{ "error": "Invalid request" }` or `{ "error": "Could not resolve location" }`
- 401: `{ "error": "Unauthorized" }`
- 403: `{ "error": "Surveillance trend analysis requires a Pro or Enterprise plan", "upgradeRequired": true, "requiredPlan": "pro" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct SurveillanceAnalyzeRequest: Codable {
    let userIdToken: String
    let chiefComplaint: String
    let differential: [String]
    let location: LocationInput
}

struct ClinicalCorrelation: Codable, Identifiable {
    var id: String { condition }
    let condition: String
    let tier: String          // "high", "moderate", "low"
    let relevance: Double
    let explanation: String
    let dataPoints: [SurveillanceDataPoint]?
}

struct SurveillanceDataPoint: Codable {
    let source: String
    let condition: String
    let value: Double
    let unit: String
    let trend: String          // "rising", "falling", "stable"
    let trendMagnitude: Double?
    let periodEnd: String
}

struct TrendAlert: Codable {
    let condition: String
    let severity: String
    let message: String
}

struct DataSourceSummary: Codable {
    let source: String
    let label: String
    let status: String         // "data", "error", "no_data", "not_queried"
    let highlights: [String]
}

struct TrendAnalysisResult: Codable {
    let analysisId: String
    let regionLabel: String
    let rankedFindings: [ClinicalCorrelation]
    let alerts: [TrendAlert]
    let summary: String
    let dataSourcesQueried: [String]
    let dataSourceSummaries: [DataSourceSummary]?
    let analyzedAt: String
}

struct SurveillanceAnalyzeResponse: Codable {
    let ok: Bool
    let analysis: TrendAnalysisResult
    let warnings: [String]?
}
```

---

### 11. POST /v1/surveillance/report

**Purpose:** Generate and download a PDF trend report. Requires Pro or Enterprise plan (PDF export feature).

**Rate limit:** Global (60/min)

**Request body:**
```json
{
  "userIdToken": "firebase-id-token",
  "analysisId": "uuid-from-analyze-endpoint"
}
```

**Response (200):** Binary PDF data with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="surveillance-report-{analysisId}.pdf"`

**Error responses:**
- 400: `{ "error": "Invalid request" }`
- 401: `{ "error": "Unauthorized" }`
- 403: `{ "error": "PDF export requires a Pro or Enterprise plan" }`
- 404: `{ "error": "Analysis not found" }`
- 500: `{ "error": "Internal error" }`

**Swift models:**
```swift
struct SurveillanceReportRequest: Codable {
    let userIdToken: String
    let analysisId: String
}

// Response is raw PDF Data, not JSON
```

---

## Common Error Response Shape

All error responses follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

Some errors include additional fields:
- Quota exceeded: `"used"`, `"limit"`, `"remaining"`
- Token exceeded: `"tokenEstimate"`, `"maxAllowed"`
- Section locked: `"submissionCount"`, `"isLocked"`
- Upgrade required: `"upgradeRequired"`, `"requiredPlan"`

**Swift model:**
```swift
struct APIError: Codable, LocalizedError {
    let error: String
    let used: Int?
    let limit: Int?
    let remaining: Int?
    let tokenEstimate: Int?
    let maxAllowed: Int?
    let submissionCount: Int?
    let isLocked: Bool?
    let upgradeRequired: Bool?
    let requiredPlan: String?

    var errorDescription: String? { error }
}
```

---

## Utility Type: FlexibleStringArray

The LLM backend returns some fields as `string`, `string[]`, or `object[]` depending on the model's output. The Swift client must handle all variants.

```swift
/// Decodes a JSON value that may be a string, an array of strings,
/// or an array of objects (stringified) into `[String]`.
struct FlexibleStringArray: Codable, Equatable {
    let values: [String]

    init(_ values: [String]) {
        self.values = values
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let single = try? container.decode(String.self) {
            values = [single]
        } else if let array = try? container.decode([String].self) {
            values = array
        } else if let objectArray = try? container.decode([[String: String]].self) {
            values = objectArray.map { dict in
                dict.map { "\($0.key): \($0.value)" }.joined(separator: ", ")
            }
        } else {
            values = []
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(values)
    }
}
```
