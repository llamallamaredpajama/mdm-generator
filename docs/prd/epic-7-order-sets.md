# Phase 7: Order Sets

**Epic:** BM-REBUILD — Build Mode UX Rebuild
**Stories:** BM-7.1, BM-7.2
**Dependencies:** Phase 2 (BM-2.2), Phase 4 (BM-4.1), Phase 1 (BM-1.4)

---

## Context

> See `epic-0-master-overview.md` for full epic goal and system context.

**This phase adds:** Reusable clinical playbooks — saved order sets that match presentations, and report templates that pre-fill common result descriptions. These are physician personalization features that make Build Mode faster with repeated use.

**Prerequisite data:** Workup card with order selection (BM-2.2), result entry component (BM-4.1), user profile CRUD (BM-1.4).

---

## Stories

### Story 7.1: Order Set Save & Suggest

**ID:** BM-7.1
**Points:** 5
**Dependencies:** BM-2.2, BM-1.4

**Description:**
Complete the order set lifecycle: saving current selections as a named order set with tags, and AI-suggesting matching saved order sets on the S1 dashboard based on the presentation.

**Scope:**
- Create `SaveOrderSetModal` — name, included tests, optional tags
- Create `OrderSetSuggestion` card on S1 dashboard Workup area — AI matches user's saved order sets to S1 presentation
- "Apply All" / "Customize" / "Skip" buttons on suggestion card
- Order set management in settings page (list, edit, delete)

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/SaveOrderSetModal.tsx` (new)
- `frontend/src/components/build-mode/shared/OrderSetSuggestion.tsx` (new)
- `frontend/src/components/build-mode/shared/WorkupCard.tsx` (integrate suggestion)
- `frontend/src/hooks/useOrderSets.ts` (new — fetch/save/match)
- `frontend/src/routes/Settings.tsx` (order set management section)

**Acceptance Criteria:**
- [ ] Save modal captures name, tests, tags
- [ ] Saved order sets appear in settings with edit/delete
- [ ] S1 dashboard suggests matching order set based on presentation
- [ ] "Apply All" checks all tests from set, "Customize" opens order selector with set pre-loaded
- [ ] Usage count incremented when order set is applied
- [ ] `pnpm check` passes

---

### Story 7.2: Report Templates

**ID:** BM-7.2
**Points:** 3
**Dependencies:** BM-4.1, BM-1.4

**Description:**
Add saved report templates to the abnormal result detail entry. Physicians can save common result descriptions (e.g., "NSR, normal intervals" for ECG) and recall them with one tap.

**Scope:**
- Add saved report template display in `ResultDetailExpanded`
- Create `SaveReportTemplateModal`
- Templates saved per-test (ECG templates only show for ECG results)
- Tapping a template auto-fills notes field and optionally sets unremarkable/abnormal status

**Files to create/modify:**
- `frontend/src/components/build-mode/shared/SaveReportTemplateModal.tsx` (new)
- `frontend/src/components/build-mode/shared/ResultDetailExpanded.tsx` (integrate templates)
- `frontend/src/hooks/useReportTemplates.ts` (new — fetch/save)

**Acceptance Criteria:**
- [ ] Saved templates shown in result detail view for matching test
- [ ] One-tap applies template text to notes field
- [ ] Templates can specify default status (unremarkable/abnormal)
- [ ] Save modal captures: test, name, text, default status
- [ ] `pnpm check` passes
