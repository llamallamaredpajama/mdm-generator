# Project Context — Build Mode Rebuild

Patterns and conventions established through Phase 1 (BM-1.1 through BM-2.1). Read before implementing any story.

---

## 1. Technology Stack

| Layer | Stack | Key Files |
|-------|-------|-----------|
| Frontend | React 19, Vite 7, TypeScript 5, React Router | `frontend/` |
| Backend | Express, Vertex AI (Gemini), Zod, Firebase Admin | `backend/` |
| Auth | Firebase Auth (Google sign-in) | `frontend/src/lib/firebase.tsx` |
| State | Firestore real-time listeners (`onSnapshot`) | `frontend/src/hooks/useEncounter.ts` |
| Styling | Plain CSS with BEM naming, CSS variables with fallbacks | Component-adjacent `.css` files |
| Testing | Vitest + React Testing Library | `frontend/src/__tests__/` |
| Linting | ESLint (flat config) | `frontend/eslint.config.js` |

---

## 2. Component Hierarchy (Build Mode)

```
BuildMode.tsx (route: /build)
  ├── DesktopKanban.tsx / MobileWalletStack.tsx (encounter cards)
  └── EncounterEditor.tsx (main editor, renders when encounter selected)
        ├── TrendAnalysisToggle.tsx (compact, above S1)
        ├── SectionPanel x3 (S1, S2, S3 — each with textarea + submit)
        ├── DashboardOutput.tsx (between S1 and S2, after S1 completes)
        │     ├── DifferentialList.tsx (collapsible rows)
        │     ├── StubCard (CDR) — placeholder until BM-2.3
        │     ├── StubCard (Workup) — placeholder until BM-2.2
        │     └── TrendsCard (conditional, from surveillance context)
        └── MdmPreviewPanel / FinalMdmPanel (S2/S3 output)
```

State flow: `useEncounter(encounterId)` → Firestore `onSnapshot` → `EncounterDocument` → props down.

---

## 3. CSS / Styling Rules

### BEM Naming
- Block: `.component-name` (e.g., `.diff-list`, `.dashboard-output`)
- Element: `.component-name__element` (e.g., `.diff-row__diagnosis`)
- Modifier: `.component-name--modifier` (e.g., `.diff-row--emergent`, `.dashboard-output--mobile`)

### CSS Variables (with fallbacks)
```css
var(--color-surface, #f8fafc)          /* card backgrounds */
var(--color-background, #ffffff)       /* page/row backgrounds */
var(--color-border, #e2e8f0)           /* borders */
var(--color-text, #1e293b)             /* primary text */
var(--color-text-secondary, #64748b)   /* secondary text */
var(--color-text-muted, #94a3b8)       /* placeholder/muted text */
var(--color-primary, #3b82f6)          /* buttons, links */
var(--color-primary-hover, #2563eb)    /* button hover */
```

### Urgency Colors (hardcoded, not variable — used for clinical meaning)
```css
#dc2626  /* emergent (red) */
#d97706  /* urgent (amber) */
#16a34a  /* routine (green) */
```

Badge backgrounds: `#fef2f2` (emergent), `#fffbeb` (urgent), `#f0fdf4` (routine).

### Responsive Breakpoint
- `useIsMobile()` hook from `hooks/useMediaQuery.ts` — breakpoint at `max-width: 767px`
- Pattern: conditional CSS class, not inline styles:
  ```tsx
  const isMobile = useIsMobile()
  <div className={`block ${isMobile ? 'block--mobile' : 'block--desktop'}`}>
  ```
- Desktop grid for side-by-side: `grid-template-columns: 1fr 1fr; gap: 1rem;`
- Mobile: `flex-direction: column; gap: 1rem;`

### Card Pattern
```css
background: var(--color-surface, #f8fafc);
border: 1px solid var(--color-border, #e2e8f0);
border-radius: 8px;
padding: 1rem;
```

---

## 4. Data Shape Backward Compatibility

### S1 `llmResponse` Dual Shape
Old encounters store `llmResponse` as a flat `DifferentialItem[]`. New encounters store `{ differential: DifferentialItem[], processedAt: Timestamp }`.

**Extraction helper** (defined in `DashboardOutput.tsx:33-40`):
```typescript
function getDifferential(llmResponse: unknown): DifferentialItem[] {
  if (Array.isArray(llmResponse)) return llmResponse as DifferentialItem[]
  if (llmResponse && typeof llmResponse === 'object' && 'differential' in llmResponse) {
    const wrapped = llmResponse as { differential?: unknown }
    if (Array.isArray(wrapped.differential)) return wrapped.differential as DifferentialItem[]
  }
  return []
}
```

### New Optional Fields
All fields added in BM-1.3+ use `?` (optional) in TypeScript interfaces. The `useEncounter.ts` onSnapshot handler applies defensive defaults:

```typescript
// S2 defaults
selectedTests: data.section2?.selectedTests ?? [],
testResults: data.section2?.testResults ?? {},
allUnremarkable: data.section2?.allUnremarkable ?? false,
pastedRawText: data.section2?.pastedRawText ?? null,
workingDiagnosis: data.section2?.workingDiagnosis ?? undefined,

// S3 defaults
treatments: data.section3?.treatments ?? undefined,
cdrSuggestedTreatments: data.section3?.cdrSuggestedTreatments ?? [],
disposition: data.section3?.disposition ?? null,
followUp: data.section3?.followUp ?? [],
appliedDispoFlow: data.section3?.appliedDispoFlow ?? null,

// Top-level
cdrTracking: data.cdrTracking ?? {},
```

**Rule**: When adding new fields, always: (1) make optional in interface, (2) add `?? defaultValue` in onSnapshot handler.

### `workingDiagnosis` Union Type
Frontend: `workingDiagnosis?: string | WorkingDiagnosis` — legacy encounters have plain string, v2 uses structured object. Backend Zod: `z.union([z.string(), WorkingDiagnosisSchema]).nullable().optional()`.

---

## 5. Auth / API Patterns

### Frontend Auth
```typescript
import { useAuth, useAuthToken } from '../lib/firebase'
const { user } = useAuth()       // Firebase User | null
const token = useAuthToken()     // string | null (auto-refreshed ID token)
```

### API Calls (Build Mode)
Build Mode endpoints pass `userIdToken` **in the request body**, not as a Bearer header:
```typescript
body: JSON.stringify({ encounterId, content, userIdToken })
```

User Profile CRUD endpoints (BM-1.4) pass `userIdToken` as a **Bearer header**:
```typescript
headers: { 'Authorization': `Bearer ${userIdToken}` }
```

### `apiFetch<T>()` Wrapper
Located in `frontend/src/lib/api.ts`. Handles: timeout (default 30s, LLM calls 60s, finalize 120s), `AbortController`, `ApiError` classification (network/auth/validation/quota/server), and user-friendly error messages.

### API Function Pattern
```typescript
export async function processSection1(
  encounterId: string, content: string, userIdToken: string,
  location?: { zipCode?: string; state?: string }
): Promise<Section1Response> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return apiFetch(`${apiBaseUrl}/v1/build-mode/process-section1`, { ... }, 'Section 1 processing', 60_000)
}
```

---

## 6. Firestore Write Patterns

### Client Writes (S1, S2) — Dot-Notation Nested Updates
```typescript
await updateDoc(encounterRef, {
  'section1.content': content,
  'section1.submissionCount': response.submissionCount,
  'section1.isLocked': response.isLocked,
  'section1.status': 'completed',
  'section1.llmResponse': { differential: response.differential, processedAt: serverTimestamp() },
  status: 'section1_done',
  updatedAt: serverTimestamp(),
})
```

### Server Writes (S3 — Finalize)
Backend writes section3 data + `status: 'finalized'` directly. Client skips the write — Firestore rules block updates when `status == 'finalized'`. The `onSnapshot` listener picks up server changes automatically.

### Firestore Path
`customers/{uid}/encounters/{encounterId}`

### Reconciliation
onSnapshot checks: if `status === 'finalized'` and `section3.llmResponse` exists, clear stale client error state (handles case where backend finalized after client timeout).

---

## 7. Testing Conventions

### Location
All tests in `frontend/src/__tests__/`. File naming: `{ComponentName}.test.tsx`.

### Mock Pattern (Controllable)
Use `vi.hoisted()` for mocks that need per-test control:
```typescript
const { mockIsMobile } = vi.hoisted(() => ({
  mockIsMobile: vi.fn().mockReturnValue(false),
}))
vi.mock('../hooks/useMediaQuery', () => ({
  useIsMobile: mockIsMobile,
}))
// In tests: mockIsMobile.mockReturnValue(true)
// In beforeEach: mockIsMobile.mockReturnValue(false)
```

### Standard Imports
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
```

### Fixture Pattern
Mock data objects defined at file top level. Use real types from `types/encounter.ts` and `types/surveillance.ts`.

### What to Test
- Rendering with valid data
- Both data shapes (flat array + wrapped object for backward compat)
- Null/empty data → returns null or empty state
- User interactions (expand/collapse, button clicks)
- Responsive variants (mobile/desktop class application)
- Conditional rendering (e.g., trends card only when data present)

### Quality Gate
`cd frontend && pnpm check` = `tsc -b && eslint . && vitest run` — must pass before every commit.

---

## 8. Type Alignment Gotchas

### Known Frontend/Backend Name Divergences
| Frontend (`types/encounter.ts`) | Backend (`buildModeSchemas.ts`) | Reason |
|---|---|---|
| `WorkingDiagnosis` (interface) | `WorkingDiagnosisStructured` (Zod inferred type) | Avoids Zod schema/type name collision |
| `CdrStatus` (type alias) | `CdrStatusType` (Zod inferred type) | Same reason |

### Zod `z.any()` in Legacy Schemas
`MdmPreviewSchema` uses `z.any()` for `problems`, `differential`, `dataReviewed` because LLM output varies (string, string[], object[]). Frontend `MdmPreview` interface types these as `string | string[] | Record<string, unknown>[]`. Always normalize before display (see `MdmPreviewPanel.normalizeToString`).

### Backend Section Schema
`SectionDataSchema` is a single generic schema for all 3 sections. S2/S3-specific fields are `.optional()` — S1 simply ignores them. No separate per-section schemas exist yet.

### Frontend `isLocked` Field
Present on frontend `Section1Data`/`Section2Data`/`Section3Data` interfaces and written to Firestore via client `updateDoc`. NOT present in backend `SectionDataSchema` — computed from `submissionCount` on API response.

---

## 9. Critical Anti-Patterns

| Rule | Why |
|------|-----|
| **No PHI in logs** | `console.log({ userId, action })` OK. `console.log({ narrative })` NEVER. |
| **No `z.any()` in new schemas** | Legacy `MdmPreviewSchema` uses it; new schemas must use explicit types. |
| **No modifying request/response schemas** | Existing `Section1RequestSchema`, `Section2RequestSchema`, `FinalizeRequestSchema` frozen until BM-8.1. |
| **No deleting deprecated components** | Mark with `@deprecated` JSDoc, keep file. Delete in cleanup pass only. |
| **No direct encounter status writes from client for S3** | Backend owns finalize write. Client `updateDoc` blocked by Firestore rules after `status: 'finalized'`. |
| **Always handle both `llmResponse` shapes** | Flat array (old) and wrapped object (new). Use `getDifferential()` pattern. |
| **CSS variables always have fallbacks** | `var(--name, #fallback)` — the theme may not be loaded. |
| **`useIsMobile()` for responsive, not CSS-only media queries** | Component logic must know viewport state for conditional rendering. |
