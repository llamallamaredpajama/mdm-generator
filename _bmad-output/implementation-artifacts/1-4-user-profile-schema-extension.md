# Story BM-1.4: User Profile Schema Extension

## Status

**ready-for-dev**

## Story

As an **Emergency Medicine physician**, I want to **save reusable order sets, disposition flows, report templates, and customizable option lists to my profile**, so that **I can quickly apply my common clinical patterns across encounters without re-entering them each time**.

## Acceptance Criteria

1. All CRUD operations work for order sets, disposition flows, and report templates
2. Order sets have: id, name, tests[], tags[], createdAt, usageCount
3. Disposition flows have: id, name, disposition, followUp[], createdAt, usageCount
4. Report templates have: id, testId, name, text, defaultStatus, usageCount
5. Endpoints require authentication and scope to authenticated user
6. Backend builds cleanly (`cd backend && pnpm build`)
7. Customizable options (dispositionOptions, followUpOptions) can be read and updated on the user profile document

## Tasks / Subtasks

### Backend Types

- [ ] Create `backend/src/types/userProfile.ts` with Zod schemas and inferred TypeScript types for `OrderSet`, `DispositionFlow`, `ReportTemplate`, and `CustomizableOptions` (AC: #2, #3, #4, #7)
- [ ] Add `OrderSetCreateSchema`, `DispositionFlowCreateSchema`, `ReportTemplateCreateSchema`, `CustomizableOptionsSchema` validation schemas for POST/PUT request bodies (AC: #1, #7)
- [ ] Export all types and schemas from the new file (AC: #1)

### CORS Update

- [ ] Update CORS `Access-Control-Allow-Methods` header in `backend/src/index.ts` from `'GET, POST, OPTIONS'` to `'GET, POST, PUT, DELETE, OPTIONS'` (AC: #1)

### Order Sets CRUD Endpoints (4 endpoints)

- [ ] `GET /v1/user/order-sets` — list all order sets for authenticated user (AC: #1, #5)
- [ ] `POST /v1/user/order-sets` — create new order set, return created doc with Firestore-generated ID (AC: #1, #2, #5)
- [ ] `PUT /v1/user/order-sets/:id` — update existing order set by ID, verify ownership (AC: #1, #5)
- [ ] `DELETE /v1/user/order-sets/:id` — delete order set by ID, verify ownership (AC: #1, #5)

### Disposition Flows CRUD Endpoints (4 endpoints)

- [ ] `GET /v1/user/dispo-flows` — list all disposition flows for authenticated user (AC: #1, #5)
- [ ] `POST /v1/user/dispo-flows` — create new disposition flow (AC: #1, #3, #5)
- [ ] `PUT /v1/user/dispo-flows/:id` — update existing disposition flow (AC: #1, #5)
- [ ] `DELETE /v1/user/dispo-flows/:id` — delete disposition flow (AC: #1, #5)

### Report Templates CRUD Endpoints (4 endpoints)

- [ ] `GET /v1/user/report-templates` — list all report templates for authenticated user (AC: #1, #5)
- [ ] `POST /v1/user/report-templates` — create new report template (AC: #1, #4, #5)
- [ ] `PUT /v1/user/report-templates/:id` — update existing report template (AC: #1, #5)
- [ ] `DELETE /v1/user/report-templates/:id` — delete report template (AC: #1, #5)

### Usage Tracking Endpoints

- [ ] `POST /v1/user/order-sets/:id/use` — atomically increment `usageCount` on order set (AC: #2)
- [ ] `POST /v1/user/dispo-flows/:id/use` — atomically increment `usageCount` on disposition flow (AC: #3)
- [ ] `POST /v1/user/report-templates/:id/use` — atomically increment `usageCount` on report template (AC: #4)

### Customizable Options Endpoints (2 endpoints)

- [ ] `GET /v1/user/options` — return the authenticated user's `customizableOptions` from `customers/{uid}` document (AC: #5, #7)
- [ ] `PUT /v1/user/options` — update `customizableOptions` on `customers/{uid}` using `set({ customizableOptions }, { merge: true })` to avoid clobbering Stripe-managed fields (AC: #5, #7)

### Frontend Types

- [ ] Create `frontend/src/types/userProfile.ts` with plain TypeScript interfaces (no Zod) mirroring backend types, including `CustomizableOptions`, with JSDoc comments (AC: #2, #3, #4, #7)

### Frontend API Client

- [ ] Add CRUD functions for order sets to `frontend/src/lib/api.ts`: `getOrderSets()`, `createOrderSet()`, `updateOrderSet()`, `deleteOrderSet()`, `useOrderSet()` (AC: #1)
- [ ] Add CRUD functions for disposition flows to `frontend/src/lib/api.ts`: `getDispoFlows()`, `createDispoFlow()`, `updateDispoFlow()`, `deleteDispoFlow()`, `useDispoFlow()` (AC: #1)
- [ ] Add CRUD functions for report templates to `frontend/src/lib/api.ts`: `getReportTemplates()`, `createReportTemplate()`, `updateReportTemplate()`, `deleteReportTemplate()`, `useReportTemplate()` (AC: #1)
- [ ] Add functions for customizable options to `frontend/src/lib/api.ts`: `getCustomizableOptions()`, `updateCustomizableOptions()` (AC: #7)

### Validation

- [ ] Run `cd backend && pnpm build` — must pass with zero errors (AC: #6)
- [ ] Run `cd frontend && pnpm check` — must pass with zero errors (AC: #6)

## Dev Notes

### Dependency: BM-1.1 (Master Test Library)

BM-1.1 defines `TestDefinition` with string IDs like `"ecg"`, `"troponin_x2"`, `"cbc"`, etc. This story references those IDs in two places:

- `OrderSet.tests[]` is an array of test ID strings (e.g., `["ecg", "troponin_x2", "cbc"]`)
- `ReportTemplate.testId` is a single test ID string (e.g., `"ecg"`)

Do NOT import or define `TestDefinition`. Just use `string` for test IDs. The relationship is by convention, not by foreign key.

### Firestore Storage Pattern

Use **subcollections** under the user's `customers` document (NOT the `users` collection):

```
customers/{uid}/orderSets/{id}
customers/{uid}/dispoFlows/{id}
customers/{uid}/reportTemplates/{id}
```

Rationale: Each item is independently addressable, list queries are efficient, no 1MB document size concern. Expected volume: 5-50 items per user per type.

The `customizableOptions` (disposition options, follow-up options) are stored as fields directly on the user document at `customers/{uid}` since they are small fixed-shape data.

**Important**: The existing `customers/{uid}` path is already used for Stripe subscriptions (`customers/{uid}/checkout_sessions`, `customers/{uid}/subscriptions`). The user profile document itself at `customers/{uid}` may or may not exist yet. Use `set({ customizableOptions }, { merge: true })` when writing to avoid clobbering Stripe-managed fields.

### Firestore Access Pattern

The backend uses a `getDb()` helper at `backend/src/index.ts:430`:

```typescript
const getDb = () => admin.firestore()
```

For subcollection references, follow the existing encounter pattern at line 433:

```typescript
const getEncounterRef = (userId: string, encounterId: string) =>
  getDb().collection('customers').doc(userId).collection('encounters').doc(encounterId)
```

Equivalent helpers for this story:

```typescript
const getOrderSetsCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('orderSets')

const getDispoFlowsCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('dispoFlows')

const getReportTemplatesCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('reportTemplates')

const getUserDoc = (userId: string) =>
  getDb().collection('customers').doc(userId)
```

### Authentication Pattern

Every endpoint MUST authenticate via Bearer token. The pattern is used by all existing endpoints (see `backend/src/index.ts`). Extract and verify like this:

```typescript
const idToken = req.headers.authorization?.split('Bearer ')[1];
if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
let uid: string;
try {
  const decoded = await admin.auth().verifyIdToken(idToken);
  uid = decoded.uid;
} catch {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

All CRUD operations MUST scope queries to the authenticated `uid`. Never allow a user to read/write another user's data. The subcollection path `customers/{uid}/...` inherently enforces this when `uid` comes from the verified token.

### CORS Update (Critical)

The current CORS middleware at `backend/src/index.ts:58` only allows:

```typescript
res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
```

This MUST be updated to:

```typescript
res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
```

Without this change, all PUT and DELETE requests from the frontend will be blocked by the browser's CORS preflight check.

### Request Validation with Zod

Follow the existing pattern of defining Zod schemas for request validation. Example from `backend/src/buildModeSchemas.ts`:

```typescript
export const Section1RequestSchema = z.object({
  encounterId: z.string().min(1),
  content: z.string().min(1).max(SECTION1_MAX_CHARS),
  userIdToken: z.string().min(10),
})
```

For this story, define schemas in `backend/src/types/userProfile.ts`:

```typescript
// Order Set creation/update schema
export const OrderSetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  tests: z.array(z.string().min(1)).min(1).max(50),
  tags: z.array(z.string().min(1)).max(20).default([]),
})

// Disposition Flow creation/update schema
export const DispositionFlowCreateSchema = z.object({
  name: z.string().min(1).max(100),
  disposition: z.string().min(1),
  followUp: z.array(z.string().min(1)).max(20).default([]),
})

// Report Template creation/update schema
export const ReportTemplateCreateSchema = z.object({
  testId: z.string().min(1),
  name: z.string().min(1).max(100),
  text: z.string().min(1).max(2000),
  defaultStatus: z.enum(['unremarkable', 'abnormal']),
})

// Customizable Options schema
export const CustomizableOptionsSchema = z.object({
  dispositionOptions: z.array(z.string().min(1)).max(30).default([]),
  followUpOptions: z.array(z.string().min(1)).max(30).default([]),
})
```

### Atomic usageCount Increment

Use Firestore's `FieldValue.increment()` for atomic usage tracking. NEVER read-then-write:

```typescript
// CORRECT - atomic
await docRef.update({
  usageCount: admin.firestore.FieldValue.increment(1),
})

// WRONG - race condition
const snap = await docRef.get()
const current = snap.data().usageCount
await docRef.update({ usageCount: current + 1 })
```

Provide separate `/use` endpoints rather than handling this in PUT, because incrementing usage is semantically different from editing the resource.

### Timestamp Handling

`createdAt` MUST be set server-side using Firestore timestamps, never from client input:

```typescript
await collectionRef.add({
  ...validatedData,
  createdAt: admin.firestore.Timestamp.now(),
  usageCount: 0,
})
```

### Route Registration in index.ts

All 17 new endpoints go in `backend/src/index.ts`. Register them BEFORE the `app.use(surveillanceRouter)` line (line 1357). The endpoints do NOT need the `llmLimiter` rate limiter since they are simple Firestore CRUD (no Vertex AI calls). They are covered by the global rate limiter (60 req/min).

For cleaner organization, consider grouping all user profile routes with a comment block similar to the existing ones:

```typescript
// ============================================================================
// User Profile CRUD Endpoints
// ============================================================================
```

Use Express route parameters for ID-based operations:

```typescript
app.put('/v1/user/order-sets/:id', async (req, res) => {
  // req.params.id contains the document ID
})

app.delete('/v1/user/order-sets/:id', async (req, res) => {
  // req.params.id contains the document ID
})
```

### Customizable Options Implementation

The `GET /v1/user/options` and `PUT /v1/user/options` endpoints operate on the user document itself, not a subcollection:

```typescript
// GET — read customizableOptions from user doc
app.get('/v1/user/options', async (req, res) => {
  // ... auth ...
  const doc = await getUserDoc(uid).get()
  const data = doc.data()
  const options = data?.customizableOptions ?? { dispositionOptions: [], followUpOptions: [] }
  return res.json({ ok: true, options })
})

// PUT — merge customizableOptions onto user doc (preserves Stripe fields)
app.put('/v1/user/options', async (req, res) => {
  // ... auth + validate with CustomizableOptionsSchema ...
  await getUserDoc(uid).set({ customizableOptions: validated }, { merge: true })
  return res.json({ ok: true, options: validated })
})
```

The `{ merge: true }` is critical — the `customers/{uid}` document may contain Stripe-managed fields from the Firebase Stripe Extension. A plain `set()` would overwrite them.

### Frontend API Client Pattern

All frontend API calls use the `apiFetch<T>()` wrapper in `frontend/src/lib/api.ts`. It handles errors, timeouts, and `ApiError` classification. Follow the existing pattern:

```typescript
export async function getOrderSets(userIdToken: string): Promise<OrderSet[]> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(
    `${apiBaseUrl}/v1/user/order-sets`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userIdToken}`,
      },
    },
    'Fetching order sets'
  )
}
```

Note: existing endpoints pass `userIdToken` in the request body. For GET requests (which have no body), pass it as a Bearer token in the Authorization header. For consistency, the new POST/PUT/DELETE endpoints should also accept the token from the Authorization header (not the body), since this is standard REST practice. The backend auth extraction already reads from `req.headers.authorization`.

### Frontend Types (No Zod)

Frontend types in `frontend/src/types/userProfile.ts` are plain TypeScript interfaces with JSDoc comments. Do NOT use Zod on the frontend. Example:

```typescript
/** A reusable order set for common test combinations */
export interface OrderSet {
  /** Firestore document ID */
  id: string
  /** Display name (e.g., "R/O MI Workup") */
  name: string
  /** Test IDs from the test library (e.g., ["ecg", "troponin_x2"]) */
  tests: string[]
  /** Searchable tags (e.g., ["chest_pain", "cardiac"]) */
  tags: string[]
  /** Server-set creation timestamp (ISO string from Firestore) */
  createdAt: string
  /** Number of times this order set has been used */
  usageCount: number
}

/** User-customizable dropdown options for disposition and follow-up fields */
export interface CustomizableOptions {
  /** Custom disposition labels (e.g., ["Discharge", "Admit", "Observation"]) */
  dispositionOptions: string[]
  /** Custom follow-up labels (e.g., ["Cardiology 48hr", "PCP 1 week"]) */
  followUpOptions: string[]
}
```

### Data Model Reference

**OrderSet**:
| Field | Type | Notes |
|-------|------|-------|
| id | string | Firestore auto-generated |
| name | string | 1-100 chars |
| tests | string[] | Test IDs from BM-1.1 library |
| tags | string[] | Searchable labels |
| createdAt | Timestamp | Server-set |
| usageCount | number | Atomic increment only |

**DispositionFlow**:
| Field | Type | Notes |
|-------|------|-------|
| id | string | Firestore auto-generated |
| name | string | 1-100 chars |
| disposition | string | e.g., "discharge", "admit", "transfer" |
| followUp | string[] | e.g., ["cardiology_48hr", "return_ed_prn"] |
| createdAt | Timestamp | Server-set |
| usageCount | number | Atomic increment only |

**ReportTemplate**:
| Field | Type | Notes |
|-------|------|-------|
| id | string | Firestore auto-generated |
| testId | string | References test library ID |
| name | string | 1-100 chars (e.g., "NSR, normal intervals") |
| text | string | Full report text, max 2000 chars |
| defaultStatus | `"unremarkable" \| "abnormal"` | Auto-sets result status when applied |
| usageCount | number | Atomic increment only |

**CustomizableOptions** (on user doc at `customers/{uid}`, not a subcollection):
| Field | Type | Notes |
|-------|------|-------|
| dispositionOptions | string[] | Custom disposition dropdown labels, max 30 |
| followUpOptions | string[] | Custom follow-up dropdown labels, max 30 |

### HTTP Status Codes

| Operation | Success | Missing ID | Bad Input | Auth Fail | Not Found |
|-----------|---------|------------|-----------|-----------|-----------|
| GET (list) | 200 | N/A | N/A | 401 | 200 (empty array) |
| POST (create) | 201 | N/A | 400 | 401 | N/A |
| PUT (update) | 200 | 400 | 400 | 401 | 404 |
| DELETE | 200 | 400 | N/A | 401 | 404 |
| POST /use | 200 | 400 | N/A | 401 | 404 |
| GET /options | 200 | N/A | N/A | 401 | 200 (empty defaults) |
| PUT /options | 200 | N/A | 400 | 401 | N/A |

### Response Shapes

**GET (list)**: Return `{ ok: true, items: OrderSet[] }` (or `dispoFlows`, `reportTemplates`).

**POST (create)**: Return `{ ok: true, item: OrderSet }` with the created item including its Firestore-generated `id`.

**PUT (update)**: Return `{ ok: true, item: OrderSet }` with the updated item.

**DELETE**: Return `{ ok: true, id: string }` echoing the deleted ID.

**POST /use**: Return `{ ok: true, usageCount: number }` with the new count.

**GET /options**: Return `{ ok: true, options: CustomizableOptions }`.

**PUT /options**: Return `{ ok: true, options: CustomizableOptions }` with the saved values.

### Existing File Locations

| File | Path | What to do |
|------|------|------------|
| Backend entry | `backend/src/index.ts` | Add 17 endpoints + CORS update |
| Backend Zod schemas | `backend/src/buildModeSchemas.ts` | Reference only (do not modify) |
| Backend user service | `backend/src/services/userService.ts` | Reference for `getDb()` pattern (do not modify) |
| Frontend API client | `frontend/src/lib/api.ts` | Add 17 new API functions |
| Frontend types dir | `frontend/src/types/` | Create `userProfile.ts` |
| Backend types dir | `backend/src/types/` | Create `userProfile.ts` (directory may need creating) |

### No PHI

None of these endpoints handle medical content. Order set names, test IDs, disposition labels, and report template text are all clinical vocabulary, not patient data. No special PHI scrubbing is needed, but do NOT log any user-provided text content (follow existing audit pattern: log `userId`, `action`, `timestamp` only).

### Testing

- All 17 endpoints should be testable via curl or Postman with a valid Firebase ID token
- Example curl for creating an order set:
  ```bash
  curl -X POST http://localhost:8080/v1/user/order-sets \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
    -d '{"name":"R/O MI Workup","tests":["ecg","troponin_x2","cbc","bmp"],"tags":["chest_pain","cardiac"]}'
  ```
- Verify subcollection documents appear in Firebase Console under `customers/{uid}/orderSets/`
- Verify `usageCount` starts at 0 and increments atomically via `/use` endpoint
- Verify `createdAt` is a server-side Firestore Timestamp (not client-provided)
- Verify PUT/DELETE return 404 for non-existent document IDs
- Verify all endpoints return 401 for missing/invalid tokens
- Verify `PUT /v1/user/options` uses `merge: true` and does not clobber Stripe fields on `customers/{uid}`
- Verify `GET /v1/user/options` returns empty defaults when no options have been set
- Run `cd backend && pnpm build` to confirm TypeScript compilation
- Run `cd frontend && pnpm check` to confirm frontend typecheck + lint + tests pass

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 0.1 | Initial draft from epic BM-REBUILD | Claude |
| 2026-02-23 | 0.2 | Added CustomizableOptions in-scope (AC #7, tasks, dev notes); fixed Dev Agent Record template | Bob (SM) |

## Dev Agent Record

### Agent Model Used

_(To be filled by dev agent)_

### Debug Log References

_(To be filled by dev agent)_

### Completion Notes List

_(To be filled by dev agent)_

### File List

_(To be filled by dev agent — all files created or modified)_

## QA Results

_(To be filled during QA)_
