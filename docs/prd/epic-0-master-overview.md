# Epic: Build Mode UX Rebuild — Master Overview

**Epic ID:** BM-REBUILD
**Created:** 2026-02-23
**Source Spec:** `docs/buildmode-prototype.md`
**Branch:** `build-mode-refactor`

> This is the master reference containing all 25 stories across 8 phases.
> Individual phase epics are in `epic-1-*.md` through `epic-8-*.md`.

---

## Epic Goal

Transform Build Mode from a 3-section text-dictation workflow into a clinical decision support companion — replacing blank textareas with structured inputs (order selection, result entry, CDR tracking), adding a rich S1 output dashboard, and enabling physicians to build reusable clinical playbooks (order sets, disposition flows, report templates).

## Existing System Context

- **Current functionality**: 3-section progressive MDM generation (S1 dictation → S2 dictation → S3 dictation → Final MDM). S1 outputs a `DifferentialPreview` list. S2 outputs an `MdmPreviewPanel` with 4 collapsible text sections. S3 outputs the final copy-pastable MDM.
- **Technology stack**: React 19 + Vite 7 + TypeScript (frontend), Express + Vertex AI Gemini + Zod (backend), Firebase Auth + Firestore, mobile-first responsive with `useIsMobile()` hook
- **Key patterns**: Firestore `onSnapshot` for real-time sync, local content state in `useEncounter` hook, section progression enforced both client and server-side, `z.any()` for flexible LLM output parsing, split Firestore writes (client for S1/S2, server for S3)
- **Integration points**: Surveillance enrichment (CDC adapters), CDR context (string-based, stored on encounter doc), quota management, Stripe subscription tiers

## Enhancement Details

**What's being changed:**
1. S1 output: flat differential list → 4-area dashboard (differential + CDRs + workup + trends)
2. S2 input: blank textarea → structured result entry (unremarkable/abnormal per test, CDR value fields, paste-parse)
3. S2 output: full MdmPreview → brief CDR calculations report
4. S3 input: single textarea → treatment free-text + structured disposition selector
5. CDR tracking: unstructured string → structured cross-section state machine
6. New user profile data: order sets, disposition flows, report templates, customizable options
7. New master libraries: test catalog, CDR definitions (Firestore collections)
8. ~8 new backend endpoints for libraries, user data CRUD, AI parsing

**How it integrates:**
- Replaces `DifferentialPreview` and `MdmPreviewPanel` components
- Extends `EncounterEditor` to render new section UIs
- Extends Firestore encounter schema (backward-compatible additions)
- Adds new Firestore collections (`testLibrary`, `cdrLibrary`) and user subcollections
- Modifies prompt builders to consume structured data instead of raw text

---

## Phase Summary

| Phase | Epic File | Stories | Focus |
|-------|-----------|---------|-------|
| 1 | `epic-1-data-foundation.md` | BM-1.1 – BM-1.4 | Libraries, schemas, user profile |
| 2 | `epic-2-s1-dashboard.md` | BM-2.1 – BM-2.4 | S1 output dashboard |
| 3 | `epic-3-cdr-system.md` | BM-3.1 – BM-3.3 | CDR matching & tracking |
| 4 | `epic-4-s2-results.md` | BM-4.1 – BM-4.3 | S2 structured result entry |
| 5 | `epic-5-s2-intelligence.md` | BM-5.1 – BM-5.3 | Paste/dictation parsing, S2 output |
| 6 | `epic-6-s3-redesign.md` | BM-6.1 – BM-6.3 | Treatment, disposition, finalize |
| 7 | `epic-7-order-sets.md` | BM-7.1 – BM-7.2 | Reusable order sets & templates |
| 8 | `epic-8-persistence-polish.md` | BM-8.1 – BM-8.3 | S2 refactor, desktop, a11y |

## Dependency Graph

```
BM-1.1 (Test Library)  ──┬──→ BM-2.2 (Workup Card) ──→ BM-7.1 (Order Sets)
                          │                               BM-7.2 (Report Templates)
                          ├──→ BM-1.3 (Encounter Schema) ──→ BM-4.1 (Result Entry)
                          └──→ BM-1.4 (User Profile)   ──→ BM-6.2 (Disposition)
                                                          └→ BM-7.1, BM-7.2

BM-1.2 (CDR Library)   ──┬──→ BM-1.3 (Encounter Schema)
                          ├──→ BM-2.3 (CDR Card)
                          └──→ BM-3.1 (CDR Matching)  ──→ BM-3.2 (CDR Views) ──→ BM-3.3 (CDR Persistence)

BM-1.3 (Encounter Schema) ──→ BM-2.1 (Dashboard) ──→ BM-2.2, BM-2.3, BM-2.4, BM-8.2
                              BM-4.1 (Result Entry) ──→ BM-4.2 (Quick Status)
                                                       BM-4.3 (Working Dx)
                                                       BM-5.1 (Paste Results) ──→ BM-5.2 (Dictation)

BM-3.3 + BM-4.3        ──→ BM-6.1 (Treatment Input) ──→ BM-6.3 (Finalize Prompt)
BM-5.3 (S2 Output)     ──→ BM-6.3 (Finalize Prompt)
BM-6.1 + BM-6.2        ──→ BM-6.3 (Finalize Prompt)

BM-4.1 + BM-4.2 + BM-4.3 + BM-5.3 ──→ BM-8.1 (S2 Submission Refactor)

All stories ──→ BM-8.3 (Accessibility)
```

## Compatibility Requirements

- [x] Existing encounters without new fields continue to render (defensive defaults)
- [x] S1 submission flow unchanged (dictation input is the same)
- [x] S3 finalize still produces the same FinalMdm shape for copy-to-clipboard
- [x] Quick Mode unaffected by Build Mode changes
- [x] Surveillance enrichment continues to work (integrated into dashboard card)
- [x] Stripe subscription tiers and quota management unchanged
- [x] Firebase Auth flow unchanged

## Risk Mitigation

- **Primary Risk:** Schema changes break existing encounters
- **Mitigation:** All new fields are optional with defensive defaults; old encounters get `cdrTracking: {}`, `section2.selectedTests: []`, etc.
- **Rollback Plan:** Feature branch (`build-mode-refactor`) — can revert to main at any point

- **Secondary Risk:** S2 structured data changes break the S2→S3 prompt chain
- **Mitigation:** BM-8.1 (S2 Submission Refactor) maintains backward compat; old text-based S2 data still processed

## Definition of Done

- [ ] All 25 stories completed with acceptance criteria met
- [ ] Full end-to-end flow works: S1 dictation → dashboard → workup selection → S2 result entry → CDR output → S3 treatment + disposition → final MDM
- [ ] Existing encounters without new data render without errors
- [ ] Quick Mode unaffected
- [ ] `cd frontend && pnpm check` passes
- [ ] `cd backend && pnpm build` passes
- [ ] No PHI in any code, logs, or outputs
- [ ] Accessibility: all new components keyboard-navigable with screen reader support
- [ ] Mobile and desktop layouts responsive and functional
