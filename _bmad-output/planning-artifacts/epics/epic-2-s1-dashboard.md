# Phase 2: S1 Dashboard

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-2.1, BM-2.2, BM-2.3, BM-2.4
**Dependencies:** Phase 1 (BM-1.1, BM-1.2, BM-1.3)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**This phase replaces:** `DifferentialPreview` (flat list) with a 4-area dashboard: Differential, CDRs, Workup, Regional Trends. The dashboard becomes the S1 output hub where physicians review AI analysis and select workup before proceeding to S2.

**Prerequisite data:** Test library (BM-1.1), CDR library (BM-1.2), extended encounter schema (BM-1.3).

---

## Stories

### Story 2.1: Dashboard Output Layout

**ID:** BM-2.1
**Points:** 5
**Dependencies:** BM-1.3

**Description:**
Replace `DifferentialPreview` with a new `DashboardOutput` component that renders the 4-area S1 output dashboard: Differential, CDRs, Workup, Regional Trends. This story builds the layout shell with the differential area fully functional; CDR, Workup, and Trends cards are stubbed with placeholder content until their respective stories are complete.

**Scope:**
- Create `DashboardOutput` component in `build-mode/shared/`
- Create `DifferentialList` component with color-coded urgency (emergent, urgent, routine), collapsible items showing reasoning + key tests + CDR association
- Wire into `EncounterEditor.tsx` replacing `DifferentialPreview` in `getSectionPreview()`
- Responsive: stacked on mobile, 2-column grid on desktop for CDR + Workup cards
- Stub CDR card, Workup card, and Regional Trends card with existing data where available

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (new)
- `frontend/src/components/build-mode/shared/DifferentialList.tsx` (new)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (swap preview)
- `frontend/src/components/build-mode/DifferentialPreview.tsx` (deprecate/remove)

**Acceptance Criteria:**
- [ ] S1 output renders as a 4-area dashboard (differential fully functional, others stubbed)
- [ ] Each differential item shows urgency color dot, diagnosis name, expand arrow
- [ ] Expanded item shows reasoning text, recommended tests, CDR association (if any)
- [ ] "Accept Workup & Continue" button advances to S2
- [ ] Mobile: single column stacked layout
- [ ] Desktop: differential full-width top, CDR + Workup side-by-side, Trends full-width bottom
- [ ] No regression: existing S1 submission flow still works
- [ ] `pnpm check` passes

---

### Story 2.2: Workup Card with Order Selection

**ID:** BM-2.2
**Points:** 5
**Dependencies:** BM-1.1, BM-2.1

**Description:**
Build the `WorkupCard` on the S1 dashboard showing AI-recommended tests as pre-checked boxes, with "Accept All" one-tap and "Edit" to open full `OrderSelector`. Implement the full categorized test checklist using the test library.

**Scope:**
- Create `WorkupCard` component showing recommended tests as checkboxes (directly tappable without opening card)
- Create `OrderSelector` component — full categorized checklist (Labs, Imaging, Procedures/POC) loaded from test library endpoint
- "Accept All" button checks all recommended tests
- "Edit" navigates to full `OrderSelector` view (back button returns to dashboard)
- Selected tests count shown on card
- Create frontend hook `useTestLibrary()` to fetch and cache the test library

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/WorkupCard.tsx` (new)
- `frontend/src/components/build-mode/shared/OrderSelector.tsx` (new)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (integrate WorkupCard)
- `frontend/src/hooks/useTestLibrary.ts` (new)

**Acceptance Criteria:**
- [ ] Workup card shows AI-recommended tests as pre-checked boxes
- [ ] Checkboxes tappable directly on dashboard (no need to open card)
- [ ] "Accept All" checks all recommended, "Edit" opens full order selector
- [ ] Full order selector shows categorized test list from test library
- [ ] Selected count displayed, selections persist when navigating back to dashboard
- [ ] `pnpm check` passes

---

### Story 2.3: CDR Summary Card

**ID:** BM-2.3
**Points:** 3
**Dependencies:** BM-1.2, BM-2.1

**Description:**
Build the `CdrCard` on the S1 dashboard showing identified CDRs with completion status indicators. "View CDRs" link navigates to CDR detail view (implemented in Phase 3).

**Scope:**
- Create `CdrCard` component showing CDR names with progress indicators
- Parse CDR data from S1 LLM response (currently in `cdrContext` string) and/or from new CDR matching logic
- Show legend: partial / completable now / needs results
- "View CDRs" button (navigation target built in BM-3.1)

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/CdrCard.tsx` (new)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (integrate CdrCard)

**Acceptance Criteria:**
- [ ] CDR card renders on S1 dashboard with identified CDRs
- [ ] Each CDR shows name + completion indicator symbol
- [ ] "View CDRs" button present (can be non-functional until BM-3.1)
- [ ] Graceful fallback when no CDRs are identified
- [ ] `pnpm check` passes

---

### Story 2.4: Regional Trends Card Integration

**ID:** BM-2.4
**Points:** 2
**Dependencies:** BM-2.1

**Description:**
Integrate the existing surveillance/trend analysis data into the dashboard as a `RegionalTrendsCard`. Concise one-line-per-source summary by default, expandable to full detail view.

**Scope:**
- Create `RegionalTrendsCard` component (wraps existing trend data from `TrendAnalysisContext`)
- Concise view: one line per CDC source (respiratory, wastewater, NNDSS)
- "More" button expands to `RegionalTrendsDetail` view with full explanations
- Integrate into `DashboardOutput`

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/RegionalTrendsCard.tsx` (new)
- `frontend/src/components/build-mode/shared/RegionalTrendsDetail.tsx` (new)
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (integrate)

**Acceptance Criteria:**
- [ ] Trends card shows on dashboard when surveillance data is available
- [ ] Concise summary with expand capability
- [ ] Uses existing `TrendAnalysisContext` data (no new API calls)
- [ ] Hidden/collapsed when no surveillance data (user has trends disabled)
- [ ] `pnpm check` passes
