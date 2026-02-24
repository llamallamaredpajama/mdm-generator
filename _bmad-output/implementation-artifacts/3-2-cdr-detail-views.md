# Story 3.2: CDR Detail Views

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-3.2                                                  |
| Points         | 5                                                       |
| Dependencies   | BM-3.1 (CDR Matching Endpoint), BM-2.3 (CDR Summary Card) |
| Epic           | Phase 3: CDR System                                     |
| Priority       | High (enables physician CDR interaction)                 |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** to view and interact with matched Clinical Decision Rules after Section 1, answering completable components and dismissing irrelevant CDRs,
**so that** I can complete CDR scoring before entering Section 2 workup data, improving my clinical decision-making workflow.

---

## Acceptance Criteria

1. Mobile: Tapping "View CDRs" from the CdrCard navigates to a dedicated CDR detail view
2. Desktop: Tapping "View CDRs" from the CdrCard navigates to the same CDR detail view (shared layout)
3. CDR detail view shows all matched CDRs in a scrollable list with component states
4. Answerable components (section1/user_input source with options) show tap-to-select inputs
5. AI auto-populated values shown as pre-selected with "(AI)" indicator
6. Completed CDRs show calculated score + risk interpretation from scoring ranges
7. Dismiss button on each CDR with confirmation warning about clinical liability
8. Dismissed CDRs visually distinct (muted, strikethrough name) and excluded from scoring
9. Back navigation returns to S1 dashboard
10. CDR state updates write to encounter `cdrTracking` in Firestore
11. `cd frontend && pnpm check` passes (typecheck + lint + test)

---

## Tasks / Subtasks

### 1. Create useCdrTracking Hook (AC: #10)

- [x] Create `frontend/src/hooks/useCdrTracking.ts`
- [x] Hook reads `cdrTracking` from the encounter document (passed as prop, not fetched separately)
- [x] Provides `answerComponent(cdrId, componentId, value)` — updates local state + debounced Firestore write
- [x] Provides `dismissCdr(cdrId)` — sets `dismissed: true`, status to `'dismissed'`
- [x] Provides `undismissCdr(cdrId)` — reverses dismiss, recomputes status from component states
- [x] Provides `computeScore(cdrId)` — recalculates score when all components answered
- [x] Debounced Firestore write pattern: 300ms debounce (same as selectedTests in EncounterEditor)
- [x] Score calculation: for `sum` method, sum all component values; find matching scoring range for interpretation

### 2. Create CdrComponentInput Component (AC: #4, #5)

- [x] Create `frontend/src/components/build-mode/shared/CdrComponentInput.tsx`
- [x] Create `frontend/src/components/build-mode/shared/CdrComponentInput.css`
- [x] Renders per-component input based on `CdrComponent.type`:
  - `select`: radio button group with option labels and point values
  - `boolean`: toggle button (Present/Absent) with point weight display
  - `number_range`: not interactive in S1 (display "Needs results" for section2 source)
  - `algorithm`: display "Calculated automatically" label
- [x] Props: `component: CdrComponent`, `state: CdrComponentState`, `onAnswer: (value: number) => void`, `disabled?: boolean`
- [x] If `state.answered && state.source === 'section1'`: show "(AI)" badge next to selected value
- [x] Section2-sourced components show "Pending results" state (grayed out, not interactive)
- [x] User-selected values override AI values (no confirmation needed)

### 3. Create CdrDetailView Component (AC: #1, #2, #3, #6, #7, #8, #9)

- [x] Create `frontend/src/components/build-mode/shared/CdrDetailView.tsx`
- [x] Create `frontend/src/components/build-mode/shared/CdrDetailView.css`
- [x] Props: `encounter: EncounterDocument`, `cdrLibrary: CdrDefinition[]`, `onBack: () => void`
- [x] Layout: header with back button + "Clinical Decision Rules" title, scrollable CDR list below
- [x] Each CDR renders as an expandable card:
  - Header: CDR name, status badge (pending/partial/completed/dismissed), score if completed
  - Body: list of CdrComponentInput for each component
  - Footer: dismiss/undismiss button
- [x] Dismissed CDRs: muted background, name strikethrough, collapse components, show undismiss button
- [x] Completed CDRs: green score badge with interpretation text (e.g., "Score: 3 — Low Risk")
- [x] Partial CDRs: show progress indicator (e.g., "3/5 answered")
- [x] Empty state: "No CDRs matched for this encounter" (should not normally appear since View CDRs only shows when CDRs exist)
- [x] Uses `useCdrTracking` hook for state management

### 4. Wire CdrDetailView into EncounterEditor (AC: #1, #2, #9)

- [x] Add `showCdrDetail` state to EncounterEditor
- [x] Pass `onViewCdrs={() => setShowCdrDetail(true)}` to DashboardOutput
- [x] DashboardOutput passes `onViewCdrs` to CdrCard component
- [x] When `showCdrDetail === true`: render CdrDetailView instead of the normal section panels
- [x] CdrDetailView `onBack` sets `showCdrDetail` back to false
- [x] CdrCard already has `onViewCdrs` prop (added in BM-2.3) — just needs to be wired up

### 5. Add matchCdrs API Call (AC: #10)

- [x] Add `matchCdrs(encounterId: string, userIdToken: string)` to `frontend/src/lib/api.ts`
- [x] Calls `POST /v1/build-mode/match-cdrs` with `{ encounterId, userIdToken }`
- [x] Returns `{ ok: true, cdrTracking: CdrTracking, matchedCount: number }`
- [x] Trigger match-cdrs call after S1 completes (in EncounterEditor, alongside trend analysis)
- [x] Write returned cdrTracking to encounter Firestore doc (or rely on backend write + onSnapshot)

### 6. Testing (AC: #11)

- [x] Create `frontend/src/__tests__/CdrDetailView.test.tsx`
- [x] Test: renders CDR list from cdrTracking + cdrLibrary
- [x] Test: shows "(AI)" badge on auto-populated components
- [x] Test: clicking component option calls onAnswer
- [x] Test: completed CDR shows score and interpretation
- [x] Test: dismiss button sets dismissed state
- [x] Test: dismissed CDR shows muted/strikethrough styling
- [x] Test: back button calls onBack
- [x] Test: section2-sourced components show "Pending results"
- [x] Test: empty cdrTracking shows empty state
- [x] Run `cd frontend && pnpm check` — must pass

---

## Dev Notes

### Previous Story Intelligence (BM-3.1)

BM-3.1 implemented the CDR matching endpoint. Key learnings:
- **Shared cache helper**: Extract reusable helpers when the same logic appears in multiple places.
- **Status validation**: Always validate encounter status, not just data presence.
- **Error logging**: Use `e?.message` instead of full error objects to prevent PHI leakage.

### Component Architecture

The CDR detail view follows the same pattern as OrderSelector — a full-screen overlay that replaces the normal section panels when activated. The EncounterEditor already has this pattern:

```typescript
// Existing pattern in EncounterEditor (OrderSelector):
if (showOrderSelector) return <OrderSelector ... onBack={() => setShowOrderSelector(false)} />

// New pattern for CDR detail:
if (showCdrDetail) return <CdrDetailView ... onBack={() => setShowCdrDetail(false)} />
```

However, CDR detail view should NOT replace the entire EncounterEditor — it should replace just the DashboardOutput area (between S1 and S2). Look at how DashboardOutput renders OrderSelector as a conditional replacement (DashboardOutput.tsx:111-121). The CDR detail view should follow the same pattern — when the user taps "View CDRs", DashboardOutput swaps to CdrDetailView.

Actually, on closer review, the OrderSelector pattern in DashboardOutput replaces the entire DashboardOutput content. The CDR detail view should follow the same approach — CdrDetailView replaces DashboardOutput when active.

### CdrTracking State Source

The encounter document already has `cdrTracking: CdrTracking` (added in BM-1.3). The backend match-cdrs endpoint (BM-3.1) writes to this field. The frontend reads it via the existing `onSnapshot` listener in `useEncounter`. So the data flow is:

1. S1 completes → frontend calls `matchCdrs()` API
2. Backend matches CDRs, writes `cdrTracking` to Firestore
3. `onSnapshot` in `useEncounter` picks up the update
4. `encounter.cdrTracking` is available to CdrDetailView

For user interactions (answering components, dismissing), the `useCdrTracking` hook writes directly to Firestore with debounce, and `onSnapshot` picks up the change.

### CdrComponent Types Reference

```typescript
// From frontend/src/types/libraries.ts
CdrComponent = {
  id: string
  label: string
  type: 'select' | 'boolean' | 'number_range' | 'algorithm'
  options?: { label: string, value: number }[]
  min?: number           // for number_range
  max?: number           // for number_range
  value?: number         // point weight for boolean type
  source: 'section1' | 'section2' | 'user_input'
  autoPopulateFrom?: string
}

// From frontend/src/types/encounter.ts
CdrComponentState = {
  value?: number | null
  source?: 'section1' | 'section2' | 'user_input' | null
  answered: boolean
}

CdrTrackingEntry = {
  name: string
  status: 'pending' | 'partial' | 'completed' | 'dismissed'
  identifiedInSection?: 1 | 2 | 3
  completedInSection?: 1 | 2 | 3 | null
  dismissed: boolean
  components: Record<string, CdrComponentState>
  score?: number | null
  interpretation?: string | null
}
```

### Score Calculation (Frontend Mirror of Backend)

The `useCdrTracking` hook needs to recalculate scores when components are updated. Use the same logic as `cdrTrackingBuilder.ts`:

```typescript
function calculateScore(cdr: CdrDefinition, components: Record<string, CdrComponentState>) {
  const allAnswered = Object.values(components).every(c => c.answered)
  if (!allAnswered) return { score: null, interpretation: null }

  if (cdr.scoring.method === 'sum') {
    const score = Object.values(components).reduce((sum, c) => sum + (c.value ?? 0), 0)
    const range = cdr.scoring.ranges.find(r => score >= r.min && score <= r.max)
    return { score, interpretation: range ? `${range.risk}: ${range.interpretation}` : null }
  }
  return { score: null, interpretation: null }
}
```

### Firestore Write Pattern

Follow the debounced write pattern from EncounterEditor's `handleSelectedTestsChange`:

```typescript
const firestoreWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
// On each state change:
if (firestoreWriteTimer.current) clearTimeout(firestoreWriteTimer.current)
firestoreWriteTimer.current = setTimeout(() => {
  updateDoc(encounterRef, { cdrTracking: updatedTracking })
}, 300)
```

### What NOT to Build

- **Do NOT build swipe gestures** — The epic mentions "swipe" but this is a future UX enhancement. For now, a scrollable list is sufficient for both mobile and desktop.
- **Do NOT build cross-section persistence** — That's BM-3.3.
- **Do NOT call match-cdrs from the backend during S1 processing** — The frontend calls it separately.
- **Do NOT modify the backend** — This story is frontend-only.
- **Do NOT build the CDR auto-population for S2 results** — That's BM-3.3.

### Project Structure Notes

| File | Path | Action |
|------|------|--------|
| CDR tracking hook | `frontend/src/hooks/useCdrTracking.ts` | Create |
| Component input | `frontend/src/components/build-mode/shared/CdrComponentInput.tsx` | Create |
| Component input CSS | `frontend/src/components/build-mode/shared/CdrComponentInput.css` | Create |
| CDR detail view | `frontend/src/components/build-mode/shared/CdrDetailView.tsx` | Create |
| CDR detail view CSS | `frontend/src/components/build-mode/shared/CdrDetailView.css` | Create |
| API call | `frontend/src/lib/api.ts` | Modify (add matchCdrs) |
| Dashboard wiring | `frontend/src/components/build-mode/shared/DashboardOutput.tsx` | Modify (add CDR detail navigation) |
| Encounter editor | `frontend/src/components/build-mode/EncounterEditor.tsx` | Modify (trigger match-cdrs after S1) |
| Tests | `frontend/src/__tests__/CdrDetailView.test.tsx` | Create |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-cdr-system.md -- Story 3.2 spec]
- [Source: frontend/src/components/build-mode/shared/CdrCard.tsx -- existing CDR summary card with onViewCdrs prop]
- [Source: frontend/src/components/build-mode/shared/DashboardOutput.tsx -- dashboard layout with OrderSelector conditional]
- [Source: frontend/src/components/build-mode/EncounterEditor.tsx -- main editor with DashboardOutput integration]
- [Source: frontend/src/hooks/useEncounter.ts -- encounter state with onSnapshot]
- [Source: frontend/src/types/encounter.ts -- CdrTracking, CdrTrackingEntry, CdrComponentState types]
- [Source: frontend/src/types/libraries.ts -- CdrDefinition, CdrComponent, CdrScoring types]
- [Source: frontend/src/lib/api.ts -- existing API call patterns]
- [Source: backend/src/services/cdrTrackingBuilder.ts -- score calculation reference]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Frontend `pnpm check` passes — 119 tests, typecheck clean, lint clean. 14 CdrDetailView tests (13 + 1 review-added).
- DashboardOutput test suite needed Firebase mock added due to transitive dependency via CdrDetailView.
- Backend `pnpm build` passes — no backend changes in this story.
- Code review found and fixed 5 issues: PHI-safe error logging (x2), expandedCdrs sync for new CDRs, answerComponent source override, select option key uniqueness.

### Completion Notes List

- Task 1: Created `useCdrTracking.ts` hook with `answerComponent`, `dismissCdr`, `undismissCdr` methods. 300ms debounced Firestore writes. Score calculation mirrors backend `cdrTrackingBuilder.ts`.
- Task 2: Created `CdrComponentInput.tsx` + CSS. Renders select (radio buttons), boolean (Present/Absent toggle), pending (section2), and algorithm component types. Shows "(AI)" badge for auto-populated values.
- Task 3: Created `CdrDetailView.tsx` + CSS. Scrollable CDR list with expandable cards. Dismiss with inline confirmation warning. Completed CDRs show green score badge. Partial CDRs show progress ("3/5 answered"). Dismissed CDRs have strikethrough + muted styling.
- Task 4: Wired CdrDetailView into DashboardOutput (same conditional pattern as OrderSelector). Added `encounter` prop to DashboardOutput. CdrCard `onViewCdrs` now navigates to CdrDetailView when encounter has cdrTracking data.
- Task 5: Added `matchCdrs()` API function to `lib/api.ts`. Added auto-trigger in EncounterEditor: fires after S1 completes (alongside trend analysis), non-blocking (catches errors silently).
- Task 6: Created 13 tests covering CDR list rendering, AI badge, component selection, scoring, dismiss flow, back navigation, empty state, progress indicator, and boolean toggles.

### Change Log

- 2026-02-24: Implemented BM-3.2 CDR Detail Views — interactive CDR component inputs with scoring, dismiss, and navigation
- 2026-02-24: Code review — fixed PHI-safe error logging, expandedCdrs sync, answerComponent source override, select key uniqueness; added AI badge removal test

### File List

- `frontend/src/hooks/useCdrTracking.ts` -- Created (CDR tracking state management with debounced Firestore)
- `frontend/src/components/build-mode/shared/CdrComponentInput.tsx` -- Created (per-component input renderer)
- `frontend/src/components/build-mode/shared/CdrComponentInput.css` -- Created (component input styles)
- `frontend/src/components/build-mode/shared/CdrDetailView.tsx` -- Created (main CDR detail view)
- `frontend/src/components/build-mode/shared/CdrDetailView.css` -- Created (detail view styles)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` -- Modified (added encounter prop, CdrDetailView toggle)
- `frontend/src/components/build-mode/EncounterEditor.tsx` -- Modified (added matchCdrs trigger, encounter prop pass-through)
- `frontend/src/lib/api.ts` -- Modified (added matchCdrs function)
- `frontend/src/__tests__/CdrDetailView.test.tsx` -- Created (13 tests)
- `frontend/src/__tests__/DashboardOutput.test.tsx` -- Modified (added Firebase mock for CdrDetailView dependency)
