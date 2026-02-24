# Phase 8: Persistence & Polish

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-8.1, BM-8.2, BM-8.3
**Dependencies:** Phases 2-7 (various)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**This phase delivers:** End-to-end integration polish — refactoring the S2 submission to use structured data, optimizing desktop layouts, and a comprehensive accessibility pass. These stories tie everything together and ensure production readiness.

**Prerequisite data:** Result entry (BM-4.1), quick status (BM-4.2), working diagnosis (BM-4.3), S2 CDR output (BM-5.3), dashboard (BM-2.1), and all previous stories for the accessibility pass.

---

## Stories

### Story 8.1: S2 Submission Flow Refactor

**ID:** BM-8.1
**Points:** 5
**Dependencies:** BM-4.1, BM-4.2, BM-4.3, BM-5.3

**Description:**
Refactor the S2 submission flow end-to-end: instead of sending raw text to `process-section2`, send structured data (selectedTests, testResults, workingDiagnosis). Update the backend endpoint to consume structured data and return CDR-focused output.

**Scope:**
- Update `Section2RequestSchema` to accept structured result data alongside or instead of raw content
- Update `processSection2` endpoint to build prompt from structured data
- Update `buildSection2Prompt` to format structured results for the LLM
- Update frontend `submitSection(2)` to send structured data
- Maintain backward compatibility for existing encounters that used text-based S2

**Files to modify:**
- `backend/src/buildModeSchemas.ts` (updated S2 request schema)
- `backend/src/index.ts` (updated S2 endpoint)
- `backend/src/promptBuilderBuildMode.ts` (updated S2 prompt)
- `frontend/src/hooks/useEncounter.ts` (updated S2 submit)
- `frontend/src/lib/api.ts` (updated S2 API call)

**Acceptance Criteria:**
- [ ] S2 endpoint accepts structured test results data
- [ ] Prompt builder formats structured data clearly for LLM
- [ ] CDR scores returned in S2 response
- [ ] Old encounters with text-based S2 still work (backward compat)
- [ ] End-to-end flow: S1 → dashboard → workup → S2 results → CDR output → S3
- [ ] `pnpm check` passes, `pnpm build` passes

---

### Story 8.2: Desktop Layout Optimization

**ID:** BM-8.2
**Points:** 3
**Dependencies:** BM-2.1

**Description:**
Optimize the dashboard and S2/S3 layouts for desktop with expanded views: side panels, wider grids, and more content visible at once. The dashboard should use the full desktop width rather than being constrained to mobile column.

**Scope:**
- Dashboard: 2-column layout (differential + CDR detail side-by-side) on desktop
- S2 results: wider cards, side-by-side layout for test results on desktop
- S3: treatment and disposition side-by-side on desktop
- Use existing `useIsMobile()` hook for responsive switching

**Files to modify:**
- `frontend/src/components/build-mode/shared/DashboardOutput.tsx` (desktop layout)
- `frontend/src/components/build-mode/EncounterEditor.tsx` (desktop S2/S3 layout)
- Various component CSS/styles

**Acceptance Criteria:**
- [ ] Dashboard uses full desktop width with multi-column layout
- [ ] S2 results show wider cards with more visible detail
- [ ] S3 treatment + disposition shown side-by-side on desktop
- [ ] Mobile layout unchanged (single column stacked)
- [ ] `pnpm check` passes

---

### Story 8.3: Accessibility Pass

**ID:** BM-8.3
**Points:** 3
**Dependencies:** All previous stories

**Description:**
Comprehensive accessibility pass over all new Build Mode components: keyboard navigation, screen reader labels, focus management, color contrast, ARIA attributes.

**Scope:**
- Keyboard navigation for all interactive elements (checkboxes, radios, expandable items)
- ARIA labels on CDR cards, result entries, progress indicators
- Focus management: return focus after modal close, CDR swipe view keyboard support
- Color contrast: urgency colors must have sufficient contrast + text labels for colorblind users
- Screen reader announcements for state changes (test resulted, CDR completed)

**Files to modify:**
- All new components created in this epic (accessibility attributes)
- Focus management in modal components

**Acceptance Criteria:**
- [ ] All interactive elements reachable via keyboard (Tab, Enter, Space, Arrow keys)
- [ ] Screen readers announce: urgency levels, CDR completion status, result status
- [ ] Modals trap focus and return focus on close
- [ ] Color is not the only indicator for urgency (text labels supplement dots)
- [ ] `pnpm check` passes
