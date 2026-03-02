# Intake PRD — Regional Trends Card Improvements

Generated: 2026-03-01

## Request Classification
- **Type:** feature + bugfix (mixed)
- **Scope:** cross-layer (backend data enrichment + frontend display + CSS fix)
- **Complexity:** medium
- **Risk:** low — surveillance is non-blocking, changes are additive, no breaking API changes

## Objective
Improve the RegionalTrendsCard component in Build Mode with three changes: (1) surface absolute incidence data alongside existing percent-change trends, (2) fix button text color bug where text becomes invisible on click, and (3) enhance the "Show Details" expanded view to organize information by CDC data source with relevant data and source URLs.

## Functional Requirements
1. Include absolute incidence/measurement values in the frontend trend findings display (e.g., "2.3% of inpatient beds", "45K copies/L", "12 cases/wk") alongside existing trend arrows and percent changes
2. Fix CSS for toggle and report buttons so text remains visible in all interactive states (active, focus, visited)
3. Redesign expanded "Show Details" view to group information by CDC data source
4. Each data source group should show: source name heading, relevant data highlights, and a link to the CDC data source URL
5. CDC data source URLs to include:
   - Respiratory Hospital Data: https://data.cdc.gov/dataset/mpgq-jmmr
   - NWSS Wastewater: https://data.cdc.gov/dataset/g653-rqe2
   - NNDSS Notifiable Diseases: https://data.cdc.gov/dataset/x9gk-5huc
6. The `dataSourceSummaries` field (already in backend `TrendAnalysisResult`) should be passed to frontend and rendered in the expanded view
7. Frontend `TrendFinding` type should include `value`, `unit`, and `trendMagnitude` fields from backend `ClinicalCorrelation`

## Non-Functional Requirements
- Performance: no degradation in Build Mode rendering
- Security: no PHI in code, logs, or comments
- Backwards Compatibility: existing surveillance responses must continue to work; new fields are additive
- Surveillance remains non-blocking — failures must never prevent MDM generation

## Acceptance Criteria
- [ ] Trend findings display absolute values with appropriate units (% beds, copies/L, cases/wk)
- [ ] Toggle button ("Show Details"/"Hide Details") text remains visible when clicked/active/focused
- [ ] Report button text remains visible when clicked/active/focused
- [ ] Expanded view groups data by source with headings
- [ ] Each source group shows data highlights from `dataSourceSummaries`
- [ ] Each source group includes a clickable URL to the CDC dataset
- [ ] Sources with errors show error status gracefully
- [ ] Sources not queried show "Not queried" status
- [ ] `cd frontend && pnpm check` passes (typecheck + lint + test)
- [ ] `cd backend && pnpm build` passes
- [ ] No PHI in any changes
- [ ] Existing tests continue to pass

## Edge Cases & Error Handling
- Data source with error status: show source name + "Data unavailable" message, no URL link needed
- Data source not queried: show source name + "Not queried for this presentation"
- Data source with no data: show source name + "No significant activity detected"
- `dataSourceSummaries` is undefined/missing in older cached analysis: degrade gracefully, show legacy attribution
- Finding with undefined value/unit: show trend summary only, skip incidence display
- All three sources failed: show general error message in expanded view

## UX Expectations
- Incidence values should be concise and clinically meaningful (not raw numbers)
- Source URLs should open in new tab
- Expanded view should be scannable — clear source headings with visual separation
- Button states should feel responsive without jarring color shifts

## Out of Scope
- Changes to CDC adapter fetch logic or data processing
- Changes to correlation engine scoring
- PDF report generation changes
- Changes to surveillance prompt augmenter
- Changes to TrendAnalysisToggle component
- Mobile-specific layout changes (card is shared between desktop/mobile)

## Constraints
- Must use existing React 19 + TypeScript + Vite stack
- Backend `TrendAnalysisResult` type already includes `dataSourceSummaries` — frontend just needs to consume it
- Frontend `TrendFinding` type needs to be extended (not replaced)
- CDC dataset URLs are stable SODA API endpoints
