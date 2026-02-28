# Intake PRD -- Build Mode Section Redesign

Generated: 2026-02-28

## Request Classification
- **Type:** refactor / feature
- **Scope:** cross-layer (frontend + backend)
- **Complexity:** high
- **Risk:** medium -- significant API contract changes but well-contained within Build Mode module; no impact on Quick Mode

## Objective

Redesign the Build Mode 3-section workflow to better match the clinical workflow in Emergency Medicine documentation. The core change: S1 retains AI processing (differential + CDRs + recommended orders), S2 becomes pure data entry (no AI call), and S3 performs full MDM generation using ALL accumulated data from S1 + S2 + S3 user input via a build-mode-specific MDM gen guide.

## Functional Requirements

1. **S1 (Initial Eval) retains AI processing** -- takes HPI, physical exam, initial impression; AI generates worst-first differential, identifies relevant CDRs, and recommends orders for S2. S1 response schema must include `recommendedOrders` field.
2. **S2 (Information Gathering) becomes pure data entry** -- NO AI call. Users enter orders placed and results received. The UI should surface S1's recommended tests/orders to guide data entry. The `process-section2` endpoint is removed or deprecated.
3. **S2 data persistence** -- S2 data (selected tests, test results, working diagnosis, CDR tracking) persists directly to Firestore via client-side writes (no backend endpoint needed for data entry).
4. **S3 (Final Processing) performs full MDM generation** -- takes treatment/procedures, reassessments, working diagnosis, and disposition from user input. Combines ALL data from S1 (differential, CDRs) + S2 (orders, results, working diagnosis) + S3 user input and sends to Vertex AI for complete MDM generation.
5. **Build-mode-specific MDM guides** -- Create S1-specific guide (focused on differential generation, problem classification, worst-first protocol, CDR identification) and S3-specific guide (full MDM template adapted for structured Build Mode input format). S2 needs no guide.
6. **S1 prompt builder enhancement** -- S1 prompt should additionally produce recommended orders based on the generated differential and identified CDRs (e.g., "chest pain differential suggests troponin, ECG, CXR").
7. **S3 prompt builder redesign** -- S3 prompt ingests all structured data (S1 differential/CDRs as structured JSON, S2 orders/results as structured data, S3 treatments/disposition as structured fields) and produces the full MDM using the v2 gen guide.
8. **Encounter status flow update** -- Remove `section2_done` status or repurpose it. S2 completion is determined by user action (clicking "proceed to S3") not by API response. Consider: `draft` -> `section1_done` -> `section2_ready` -> `finalized`.
9. **Frontend S2 UI optimization** -- S2 should be an efficient data entry form: test selector (populated with S1 recommendations), result entry cards, working diagnosis selector, CDR scoring cards. No submit-and-wait-for-AI flow.
10. **Backend schema updates** -- Update `Section2RequestSchema` to remove (or make optional) the `content` field since S2 is no longer submitted to LLM. Update `Section1ResponseSchema` to include `recommendedOrders`. Update `FinalizeRequestSchema` to accept richer structured data from S2.
11. **Backward compatibility** -- Existing encounters in `section1_done` or `section2_done` status should still work. The finalize endpoint must handle both old-format and new-format encounter data gracefully.

## Non-Functional Requirements

- **Performance:** S2 should feel instant (no API latency) since it is pure client-side data entry
- **Security:** No PHI in code, logs, comments. All existing security patterns maintained.
- **Backwards Compatibility:** Existing encounters must not break. New schema fields should be optional/additive.

## Acceptance Criteria

- [ ] S1 endpoint returns differential + CDRs + recommendedOrders in response
- [ ] S2 has no AI processing endpoint call -- data persists via Firestore client writes
- [ ] S3 finalize endpoint accepts and uses full structured data from all 3 sections
- [ ] Build-mode-specific S1 MDM guide exists at `docs/mdm-gen-guide-build-s1.md`
- [ ] Build-mode-specific S3 MDM guide exists at `docs/mdm-gen-guide-build-s3.md`
- [ ] S1 prompt builder injects S1-specific guide and produces recommended orders
- [ ] S3 prompt builder injects S3-specific guide with structured input handling
- [ ] Frontend S2 panel shows test recommendations from S1, enables structured data entry without AI submit button
- [ ] `cd frontend && pnpm check` passes
- [ ] `cd backend && pnpm build` passes
- [ ] No PHI in any changed files
- [ ] Existing encounter data (old format) still works through the finalize flow

## Edge Cases & Error Handling

- **S2 with no tests ordered**: User should be able to proceed to S3 with empty orders (edge case: "no workup performed")
- **S1 fails to generate recommendations**: S2 should still work with manual test selection (existing test library)
- **Legacy encounters**: Encounters created before the redesign (with S2 LLM responses) should still finalize correctly
- **CDR partial completion**: CDRs identified in S1 but not fully scored by user in S2 should be handled gracefully in S3 prompt
- **S2 data loss prevention**: Client-side Firestore writes should use optimistic updates with retry

## UX Expectations

- S2 should feel like a fast, responsive form (no loading spinners for AI processing)
- S1 recommended orders should appear prominently in S2 UI as one-tap selections
- Users can still manually add tests not recommended by S1
- Clear visual progression: S1 (AI processing) -> S2 (your data entry) -> S3 (AI finalization)

## Out of Scope

- Quick Mode changes (separate workflow, unaffected)
- Surveillance module changes (existing enrichment in S1 remains as-is)
- Stripe/billing changes
- Mobile layout redesign (existing responsive components remain)
- New CDR definitions (existing CDR library unchanged)
- User authentication changes

## Constraints

- Backend: Express + TypeScript + Vertex AI (Gemini) + Firebase Admin + Zod
- Frontend: React 19 + Vite 7 + TypeScript + Firebase Auth
- API routes must follow 6-step security pattern
- Max 2 submissions per section (S1 and S3 retain this; S2 no longer applies)
- mdm-gen-guide.md (v1) remains unchanged for legacy/Quick Mode use

## User Clarifications Log

- The user specified S2 should be "pure data entry -- NO AI processing" (unambiguous)
- The user referenced `mdm-gen-guide-v2.md` but this file does not exist yet; the current guide is `docs/mdm-gen-guide.md`. Build-mode-specific guides will be created as new files.
- The user wants S3 to use "the complete mdm-gen-guide-v2" -- interpreted as a build-mode-specific full MDM guide tailored for structured input
- The user explicitly stated the differential should inform CDR application, and both should inform recommended orders for S2
