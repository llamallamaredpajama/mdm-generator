# Story 6.2: Disposition Selector with Saved Flows

Status: done

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Story ID       | BM-6.2                                                  |
| Points         | 5                                                       |
| Dependencies   | BM-1.4 (User Profile Schema), BM-6.1 (Treatment Input)  |
| Epic           | Phase 6: S3 Redesign                                    |
| Priority       | High (structured disposition for S3)                     |

---

## Story

**As an** Emergency Medicine physician using Build Mode,
**I want** a disposition selector with radio buttons, follow-up checkboxes, and saved disposition flow quick-select buttons below the treatment input,
**so that** I can quickly select disposition and follow-up with one tap using my saved workflows.

---

## Acceptance Criteria

1. Disposition radio buttons for 8 options: discharge, observation, admit, ICU, transfer, AMA, LWBS, deceased
2. Follow-up checkboxes: PCP follow-up, Specialist follow-up, Return to ED, custom text
3. Saved flows shown as quick-select buttons at bottom
4. One-tap flow applies disposition + follow-up in one action
5. "Save current as flow" creates new saved flow (persisted to localStorage)
6. DispositionSelector integrated below TreatmentInput in S3 customContent
7. Selections persisted to encounter document (section3.disposition, section3.followUp)
8. `cd frontend && pnpm check` passes

---

## Tasks / Subtasks

### 1. Create DispositionSelector Component (AC: #1-5)

- [ ] Create `frontend/src/components/build-mode/shared/DispositionSelector.tsx`
- [ ] Props: disposition, followUp, savedFlows, onDispositionChange, onFollowUpChange, onApplyFlow, onSaveFlow, disabled
- [ ] Disposition radio buttons with 8 options
- [ ] Follow-up checkboxes with "Add custom" option
- [ ] Saved flow quick-select buttons
- [ ] "Save as flow" button that captures current selections

### 2. Create useDispoFlows Hook (AC: #3-5)

- [ ] Create `frontend/src/hooks/useDispoFlows.ts`
- [ ] localStorage persistence for saved flows
- [ ] CRUD operations: load, save, delete flows
- [ ] Flow structure: { id, name, disposition, followUp }

### 3. Integrate DispositionSelector into EncounterEditor S3 (AC: #6-7)

- [ ] Add DispositionSelector below TreatmentInput in S3 customContent
- [ ] Wire disposition and followUp to encounter document via Firestore updateDoc
- [ ] Sync S3 content to include disposition text for submission

### 4. Create Tests (AC: #8)

- [ ] Test disposition radio selection
- [ ] Test follow-up checkbox toggles
- [ ] Test saved flow application
- [ ] Test save flow functionality
- [ ] Test disabled state

---

## Dev Notes

**Architecture Decisions:**
- Saved flows persisted to localStorage (matching client-side-only medical content pattern)
- Section3Data already has `disposition`, `followUp`, and `appliedDispoFlow` fields
- DispositionOption type already defined in types/encounter.ts

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-s3-redesign.md#Story 6.2]
- [Source: frontend/src/types/encounter.ts#Section3Data]
- [Source: frontend/src/types/encounter.ts#DispositionOption]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
