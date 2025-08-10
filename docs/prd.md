# Product Requirements Document (PRD)

Title: MDM Generator
Owner: Jeremy
Last updated: 2025-08-08

1. Product summary
- One-liner: Turn your natural EM physician narrative into a compliant, high-complexity MDM draft in a clean, copy-pastable format.
- Problem: EM physicians document under time pressure in systems not aligned with EM “worst-first” thinking, leading to under-documented complexity and missed billing levels.
- Value: Physician‑centric input → complete, compliant, copy‑pastable MDM tailored to EM standards.
- Differentiators: EM‑specific worst‑first orientation; curated prompting from guide; copy‑pastable output; strong safety disclaimers.
- Constraints: Educational use only; no PHI; no long‑term storage.

2. Target users and use cases
- Primary personas: Community EM physician; Academic EM physician; Locums EM physician
- Secondary personas: Scribes; Coding/Billing auditors (read‑only); Medical directors/QI
- Environment: 8h shifts; ~2.5 pph; internet required; devices = mobile (dictation via device) + desktop; most EMRs supported for pasting
- JTBD: fast complete worst‑first MDM; safe defaults with sparse data; clean copy‑pastable output

3. v1 Scope
3.1 Must‑haves
- Input: mobile dictation via device; desktop textarea (typing or OS/Dragon); inline Dictation Guide
- Guardrails: educational‑only + no‑PHI banner; pre‑submit “No PHI” confirmation
- Prompting/output: updated guide drives prompt; default high‑complexity worst‑first; explicit defaults for missing info; structured output
- Flow: one‑shot generation; client‑side minor edits only
- Storage: no long‑term storage; clipboard local; optional ephemeral non‑PHI state only
- Access/subscription: Google Sign‑In; API Gateway checks subscription level before LLM call
- Multi‑device UX: mobile‑first input; desktop review/finalize
- Ops: error handling; token/size guardrails; CI configured

3.2 Out of scope
- Regenerate loops; EMR integrations; persistent docs; team/org; HIPAA/BAA; auto coding export; multilingual; offline

4. Success metrics
- TTFM (time‑to‑first‑MDM) < 60s
- Draft completeness (checklist pass) > 90%
- Heavy edit rate < 20%
- Cost per draft under threshold (TBD)
- Weekly active sessions (non‑PHI)

5. UX overview
- Start: disclaimers + Google Sign‑In
- Compose: large textarea + Dictation Guide + checklist; Generate disabled until confirmations
- Preflight: PHI confirm, token estimate, subscription check
- Output: formatted MDM with copy; “Review required” banner; original narrative collapsible
- Settings: model info and legal notices

6. System overview
- Frontend: React + Vite (TS)
- Auth: Firebase Auth (Google)
- Backend: Cloud Run/Functions behind API Gateway; validate ID token & subscription; size/rate limits; call Vertex AI (Gemini); return structured MDM; metadata‑only logs
- LLM: Vertex AI Gemini with conservative safety
- State: client‑side for content; optional Firestore for ephemeral non‑PHI flags
- Secrets: GCP Secret Manager / service env; never in frontend

7. Risks & mitigations
- PHI entry → pre‑submit checkbox + optional client‑side detector + refusal
- Hallucinations → strict prompt structure + explicit defaults + review warning
- Token costs → input gating and one‑shot generation

8. Open questions
- Gemini model: default gemini‑1.5‑pro?
- Plan tiers: limits for requests/day and max tokens/request?
- PHI detector: hard‑stop or warning‑only?

