# Product Requirements Document (PRD)

**Title**: aiMDM
**Owner**: Jeremy
**Last updated**: 2026-03-14

> Technical implementation details live in the [Backend Technical Reference Document](backend-trd.md). This PRD describes the product — what it does, who it serves, and why.

---

## 1. Product Summary

**One-liner**: Transform Emergency Medicine physician narratives into compliant, high-complexity Medical Decision Making documentation using an EM-specific "worst-first" approach.

**Problem**: EM physicians document under time pressure in systems not aligned with EM "worst-first" thinking. This leads to under-documented complexity, missed billing levels, and documentation that doesn't reflect the actual medical decision making that occurred.

**Value**: Physician-centric input → complete, compliant, copy-pastable MDM tailored to EM standards, with clinical decision support, regional trend enrichment, and documentation gap coaching.

**Differentiators**:
- EM-specific worst-first differential orientation
- Two workflow modes: progressive Build Mode and rapid Quick Mode
- 161 interactive Clinical Decision Rules with real-time scoring
- Regional surveillance enrichment from 3 CDC data sources
- AI-powered documentation gap analytics and coaching
- Curated prompt engineering from EM-specific generation guide
- Copy-pastable output with physician attestation statement

---

## 2. Critical Constraints (Non-Negotiable)

| Constraint | Details |
|------------|---------|
| **No PHI — Ever** | Protected Health Information must never appear in code, logs, comments, API responses, or outputs. Backend logging redacts `narrative`, `mdmText`, and `content.*` fields. |
| **Educational use only** | No real patient data. All users are informed during onboarding. |
| **No long-term medical content storage** | Medical content lives client-side only. Firestore stores structured metadata (encounter status, CDR selections, gap tallies) but never raw narratives or MDM text at rest. |
| **Physician review required** | All AI-generated outputs carry a "Review required" banner and physician attestation statement. No automated clinical decisions. |

---

## 3. Target Users & Use Cases

### Primary Personas
| Persona | Environment | Key Need |
|---------|-------------|----------|
| Community EM physician | 8h shifts, ~2.5 patients/hour | Fast worst-first MDM between patients |
| Academic EM physician | Teaching hospital | Documented decision-making rationale for training |
| Locums EM physician | Variable sites, unfamiliar EMRs | Consistent MDM quality across facilities |

### Secondary Personas
| Persona | Access Level | Key Need |
|---------|-------------|----------|
| Scribes | Full access | Draft documentation for physician review |
| Coding/billing auditors | Read-only | Verify documentation completeness |
| Medical directors / QI | Analytics | Identify documentation patterns and gaps |

### Environment
- Internet required (cloud-based LLM processing)
- Devices: mobile (dictation via device) + desktop (typing, review, finalize)
- Most EMRs supported for pasting output
- Google Sign-In required (Firebase Auth)

### Jobs To Be Done
1. Generate a fast, complete, worst-first MDM from a physician narrative
2. Build a progressive MDM through structured sections with clinical decision support
3. Identify and coach on documentation gaps across encounters
4. Enrich documentation with regional disease surveillance context
5. Score and track clinical decision rules applied during encounters

---

## 4. Feature Matrix

| Feature | Description | Tier | Status |
|---------|-------------|------|--------|
| Quick Mode | One-shot MDM from single narrative | All | Shipped |
| Build Mode | 3-section progressive MDM with Firestore persistence | All | Shipped |
| Encounter Board | Kanban board for encounter management (draft/in-progress/finalized) | All | Shipped |
| Clinical Decision Rules | 161 active CDRs with interactive scoring engine | All | Shipped |
| Test Catalog & Order Sets | Embedding-indexed test library with AI suggestions | All | Shipped |
| Narrative Parsing | LLM-powered narrative → structured fields (no quota) | All | Shipped |
| Gap Analytics | AI-powered documentation gap coaching + dashboard | All | Shipped |
| Onboarding Flow | 5-step guided wizard | All | Shipped |
| Photo Library | 16 categories / 91 subcategories, LLM-assigned encounter photos | All | Shipped |
| User Personalization | Order sets, disposition flows, report templates, saved comments | All | Shipped |
| Surveillance & Trend Analysis | 3 CDC adapters, correlation engine, regional context injection | Pro+ | Shipped |
| PDF Trend Reports | Downloadable regional surveillance reports | Pro+ | Shipped |
| Admin Plan Management | Admin-only user plan assignment | Admin | Shipped |

---

## 5. Product Capabilities

### 5.1 Quick Mode

Single narrative → complete MDM in one step. Designed for physicians who want fast output with minimal interaction.

- Accepts a physician narrative (dictated or typed)
- Extracts a patient identifier (age/sex/chief complaint) for encounter labeling
- Generates a full worst-first MDM with all required sections
- Uses a dedicated prompt builder optimized for one-shot generation
- Quota: counts as 1 encounter against monthly limit

### 5.2 Build Mode

Three-section progressive workflow with Firestore persistence, designed for thorough documentation with clinical decision support.

**Section 1 — Initial Evaluation**
- Physician provides narrative, chief complaint, and clinical context
- LLM generates a worst-first differential diagnosis
- CDR matching identifies applicable clinical decision rules
- Surveillance enrichment adds regional trend context (if enabled)
- Photo assignment selects an encounter image from the library

**Section 2 — Workup & Results**
- Physician records tests ordered, results received, and CDR scoring
- Stores structured test/diagnosis data (no LLM call — data persistence only)
- Interactive CDR scoring with real-time point calculation

**Section 3 — Treatment & Disposition**
- Physician documents treatment plan and disposition decision
- LLM generates the final MDM incorporating all three sections
- Encounter marked as finalized; section locked

**Rules**:
- Maximum 2 submissions per section (then section locks)
- Quota counted once per encounter (not per section)
- Section progression enforced server-side
- Backend owns the finalize write — client cannot modify after finalization

### 5.3 Clinical Decision Rules

161 active CDRs (e.g., HEART, PERC, Wells, PECARN, Ottawa Ankle/Knee) with an interactive scoring engine.

- **Vector search matching**: Embedding-based similarity search matches clinical scenarios to applicable CDRs during Section 1
- **Interactive scoring**: Inline accordion cards with Yes/No toggles and select dropdowns for CDR component inputs
- **Scoring engine**: Supports `sum`, `threshold`, and `algorithm` methods with a custom calculator registry (PECARN has a registered algorithm; others fall back to `sum`)
- **Firestore library**: CDR definitions stored in Firestore, seeded from 30 batch configuration files
- **Accuracy requirement**: 100% accuracy or exclusion — CDRs that cannot be verified against original published sources are quarantined

[→ TRD §3](backend-trd.md#3-domain-module-design) for CDR matching and catalog service implementation.

### 5.4 Test Catalog & Order Sets

Embedding-indexed test library with AI-powered suggestions and user-customizable order sets.

- **Test catalog**: Searchable library of diagnostic tests with vector similarity search
- **AI suggestions**: Tests suggested based on differential diagnosis and clinical context
- **Order sets**: Users create reusable test groupings (CRUD via user profile endpoints)
- **Prompt injection**: Relevant tests and order sets injected into LLM prompts for context-aware MDM generation

### 5.5 Surveillance & Trend Analysis

Regional disease surveillance enrichment from 3 CDC data sources. **Non-blocking** — surveillance failures never prevent MDM generation.

| Data Source | Coverage |
|-------------|----------|
| CDC Respiratory Hospital Data | Respiratory illness hospitalization trends |
| NWSS Wastewater Surveillance | Pathogen detection in wastewater |
| CDC NNDSS Notifiable Diseases | Nationally notifiable disease reports |

- **Correlation engine**: Deterministic ranked clinical correlation scoring between patient presentation and regional trends
- **Context injection**: Surveillance context stored on the encounter during Section 1, reused at finalize
- **Region resolution**: ZIP/state → HHS region mapping for localized data
- **PDF trend reports**: Downloadable regional surveillance reports (Pro+ only)

**Tier gate**: Trend analysis and PDF reports require Pro plan or higher.

### 5.6 Gap Analytics & Enhancement Coaching

AI-powered documentation gap analysis across encounters, helping physicians identify patterns in under-documentation.

- **Gap tallies**: Tracked per-user across encounters in Firestore
- **AI insights**: LLM-powered analysis of documentation patterns and improvement suggestions
- **Analytics dashboard**: Visual gap tracking at `/analytics` route
- **Coaching**: Actionable recommendations for improving MDM quality

### 5.7 Narrative Parsing

LLM-powered narrative → structured fields extraction. Pre-populates Build Mode forms from physician dictation.

- Does not consume quota (helper function, not an encounter generation)
- Extracts: chief complaint, history of present illness, review of systems, physical exam findings, and other structured data
- Dedicated parse prompt builder optimized for field extraction

### 5.8 Encounter Management

Kanban-style encounter board at `/compose` for managing encounters across their lifecycle.

- **Three columns**: Draft → In Progress → Finalized
- **Encounter cards**: Summary view with patient identifier, status, timestamp
- **Detail panel**: Full encounter editing view with section navigation
- **Archive view**: Access to completed/archived encounters
- **Shift timer**: Tracks time within current shift

### 5.9 Photo Library

Visual identity system assigning encounter-appropriate images from a curated library.

- **16 categories / 91 subcategories** covering EM presentation types
- **Firestore-backed**: `photoLibrary` collection with Firebase Storage download URLs
- **LLM-assigned**: Photos selected during Section 1 based on clinical presentation
- **Fallback chain**: Storage URL → local asset path
- **Frontend provider**: `PhotoLibraryProvider` fetches once, builds a category → URL map

### 5.10 User Personalization

Personalization features stored in user profile (18 CRUD endpoints).

| Feature | Description |
|---------|-------------|
| Order Sets | Reusable test groupings (see §5.4) |
| Disposition Flows | Saveable disposition decision path templates |
| Report Templates | Pre-configured MDM output formats |
| Saved Comments | Quick-access narrative snippets library |
| Options | User preferences and settings |

---

## 6. UX Overview

### 6.1 Route Map

| Route | View | Purpose |
|-------|------|---------|
| `/` | Landing | Attestation notice + Google Sign-In |
| `/onboarding` | Onboarding Wizard | 5-step guided setup (see §6.2) |
| `/compose` | Encounter Board | Kanban board + detail panel (main workspace) |
| `/preflight` | PHI Check | Pre-submit PHI confirmation + token estimate + subscription check |
| `/output` | MDM Display | Formatted MDM with copy functionality + "Review required" banner |
| `/settings` | Settings | User preferences, model info, legal notices |
| `/analytics` | Gap Analytics | Documentation gap dashboard + AI coaching |

`/build` redirects to `/compose`.

### 6.2 Onboarding Flow

Five-step wizard for new users:

1. **Limitations acknowledgment** — Educational use only, no PHI, physician review required
2. **Credentials verification** — Confirm EM physician or authorized role
3. **Surveillance location** — Set ZIP/state for regional trend analysis
4. **Plan selection** — Choose subscription tier
5. **Orientation** — Guided tour of the workspace

Onboarding completion is tracked in the user profile. The `OnboardingGuard` route component redirects incomplete users back to `/onboarding`.

### 6.3 Mobile vs Desktop

- **Mobile-first input**: Dictation via device microphone, touch-optimized forms
- **Desktop review/finalize**: Full encounter board, CDR interaction, MDM review and copy
- **Responsive breakpoint**: 767px (via `useIsMobile()` hook)
- **Conditional rendering**: CSS classes, not inline styles

---

## 7. Subscription Tiers & Feature Gating

### 7.1 Tier Definitions

| Tier | Monthly Encounters | Price | Target User |
|------|-------------------|-------|-------------|
| **Free** | 10 | $0 | Trial / evaluation |
| **Pro** | 250 | Paid | Active community physician |
| **Enterprise** | 1,000 | Paid | High-volume / group practice |
| **Admin** | Unlimited | Internal | System administrators |

### 7.2 Feature Access Matrix

| Feature | Free | Pro | Enterprise | Admin |
|---------|------|-----|------------|-------|
| Quick Mode | 10/mo | 250/mo | 1,000/mo | Unlimited |
| Build Mode | 10/mo | 250/mo | 1,000/mo | Unlimited |
| CDR Scoring | Yes | Yes | Yes | Yes |
| Test Catalog | Yes | Yes | Yes | Yes |
| Gap Analytics | Yes | Yes | Yes | Yes |
| Narrative Parsing | Yes | Yes | Yes | Yes |
| Photo Library | Yes | Yes | Yes | Yes |
| Personalization | Yes | Yes | Yes | Yes |
| Trend Analysis | No | Yes | Yes | Yes |
| PDF Trend Reports | No | Yes | Yes | Yes |
| Admin Controls | No | No | No | Yes |

### 7.3 Quota System

- Quota counted per encounter, not per API call or section
- Build Mode consumes 1 quota at first section submission
- Quick Mode consumes 1 quota per generation
- Narrative parsing does not consume quota
- Usage stats returned with auth validation (`/v1/whoami`)
- Monthly reset

### 7.4 Stripe Integration

Subscription management via Firebase Stripe Extension:

- `customers/{uid}/checkout_sessions` — payment sessions
- `customers/{uid}/subscriptions` — active subscriptions
- `products` / `prices` — synced from Stripe dashboard
- Subscription status checked server-side before LLM calls

---

## 8. System Architecture (High-Level)

> For complete technical details, see the [Backend Technical Reference Document](backend-trd.md).

### 8.1 Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Vite 7, TypeScript, React Router, Framer Motion, Chart.js | Client application |
| Backend | Express 4.x, TypeScript, Node.js 20 ESM | API server |
| LLM | Vertex AI Gemini 2.5 Pro (temperature 0.2) | MDM generation, parsing, analytics |
| Auth | Firebase Auth (Google Sign-In, popup only) | User authentication |
| Database | Firestore | Encounter metadata, CDR library, user profiles, gap tallies, photo library |
| Storage | Firebase Storage | Encounter photo assets |
| Payments | Firebase Stripe Extension | Subscription management |
| Hosting | Firebase Hosting (frontend), Cloud Run (backend, us-central1) | Deployment |

### 8.2 Key Architectural Patterns

- **Two-mode workflow**: Quick Mode (one-shot) and Build Mode (3-section progressive) with separate prompt builders
- **Domain modules**: 7 backend modules (admin, analytics, encounter, library, narrative, quick-mode, user) with controller/routes/schemas pattern [→ TRD §3](backend-trd.md#3-domain-module-design)
- **Non-blocking enrichment**: Surveillance, CDR matching, test suggestions, and photo assignment run as an enrichment pipeline that never blocks MDM generation
- **PHI-safe logging**: Pino with field-level redaction; metadata-only audit trail [→ TRD §2](backend-trd.md#2-infrastructure-patterns)
- **5 prompt builders**: Build Mode (S1/finalize), Quick Mode, narrative parsing, and gap analytics — each with dedicated prompt construction logic [→ TRD §5](backend-trd.md#5-llm-integration-layer)
- **Repository pattern**: Firestore access through typed repository interfaces with dependency injection [→ TRD §4](backend-trd.md#4-data-access-layer)

### 8.3 Security Posture Summary

- Firebase Auth token verification on all protected endpoints
- 6-step route handler pattern: Authenticate → Validate → Authorize → Execute → Audit → Respond
- Zod schema validation on all request bodies
- Rate limiting (5–10 req/min on LLM endpoints)
- Error responses never expose stack traces, database queries, medical content, or internal paths
- Admin operations require Firebase custom claims [→ TRD §6](backend-trd.md#6-auth--security-architecture)

---

## 9. Success Metrics

### Core Product Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Time-to-first-MDM (TTFM) | < 60s | Time from narrative submission to MDM display |
| Draft completeness | > 90% | Checklist pass rate (all required MDM sections present) |
| Heavy edit rate | < 20% | Percentage of MDMs requiring substantial post-generation editing |
| Cost per draft | Under threshold (TBD) | Vertex AI token costs per encounter |
| Weekly active sessions | Growing | Non-PHI session tracking |

### Build Mode Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Build Mode completion rate | > 70% | Encounters reaching finalization (S3) vs started (S1) |
| Section re-submission rate | < 30% | Percentage of sections using the second allowed submission |
| Average sections per encounter | ~3 | Completion of all three sections |

### Clinical Decision Support Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| CDR match relevance | > 80% | Percentage of matched CDRs rated as clinically relevant |
| CDR scoring completion | > 50% | Percentage of matched CDRs with user-completed scoring |
| CDR accuracy | 100% | Zero scoring discrepancies vs published sources |

### Engagement Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Surveillance enrichment rate | > 60% | Pro+ encounters with trend analysis enabled |
| Gap coaching engagement | > 30% | Users viewing analytics dashboard monthly |
| Personalization adoption | > 40% | Users with at least one saved order set, dispo flow, or template |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PHI entry by user | High | Critical | Pre-submit checkbox confirmation (Checklist component), Preflight route, backend PHI redaction in logging, educational-only onboarding acknowledgment |
| LLM hallucinations | Medium | High | Strict prompt structure via generation guides, explicit defaults for missing information, "Review required" banner, physician attestation statement |
| CDR scoring inaccuracy | Low | Critical | 100% accuracy policy, quarantine pipeline for unverified CDRs, web search verification required for new CDRs |
| Token cost overruns | Medium | Medium | Input gating, token size checks (`checkTokenSize()`), quota system, rate limiting (5–10 req/min) |
| Surveillance data unavailability | Medium | Low | Non-blocking architecture — surveillance failures never prevent MDM generation, graceful degradation |
| LLM service outage | Low | High | Retry logic with exponential backoff, clear error messages to users |
| Subscription fraud | Low | Medium | Server-side subscription verification before LLM calls, Firebase Stripe Extension webhook validation |

---

## 11. Current Out of Scope

The following capabilities are **not built** and are not planned for the current version:

| Item | Rationale |
|------|-----------|
| EMR integrations | Requires per-vendor certification and BAA agreements |
| HIPAA compliance / BAA | Educational-use-only positioning avoids regulatory scope |
| Automated coding export (CPT/ICD) | Liability concerns; physician review is non-negotiable |
| Multilingual support | English-only market initially |
| Offline mode | Cloud LLM dependency makes offline generation infeasible |
| Team / organization management | Solo practitioner focus for v1; group practice features deferred |
| Real-time collaboration | Single-user encounters by design |
| Auto-save drafts | Client-side content; Firestore stores metadata only |
| Custom LLM model selection | Gemini 2.5 Pro is the verified model; model switching introduces accuracy risk |

---

## 12. Version History

### v2 — 2026-03-14 (Current)

Comprehensive rewrite aligned with shipped implementation. Covers 13 product capabilities, 4 subscription tiers, 7 frontend routes, and 33 API endpoints. All v1 open questions resolved inline.

---

### v1 — 2025-08-08 (Original)

<details>
<summary>Click to expand original v1 PRD</summary>

```
1. Product summary
- One-liner: Turn your natural EM physician narrative into a compliant, high-complexity MDM draft in a clean, copy-pastable format.
- Problem: EM physicians document under time pressure in systems not aligned with EM "worst-first" thinking, leading to under-documented complexity and missed billing levels.
- Value: Physician‑centric input → complete, compliant, copy‑pastable MDM tailored to EM standards.
- Differentiators: EM‑specific worst‑first orientation; curated prompting from guide; copy‑pastable output; physician attestation statement.
- Constraints: Educational use only; no PHI; no long‑term storage.

2. Target users and use cases
- Primary personas: Community EM physician; Academic EM physician; Locums EM physician
- Secondary personas: Scribes; Coding/Billing auditors (read‑only); Medical directors/QI
- Environment: 8h shifts; ~2.5 pph; internet required; devices = mobile (dictation via device) + desktop; most EMRs supported for pasting
- JTBD: fast complete worst‑first MDM; safe defaults with sparse data; clean copy‑pastable output

3. v1 Scope
3.1 Must‑haves
- Input: mobile dictation via device; desktop textarea (typing or OS/Dragon); inline Dictation Guide
- Guardrails: educational‑only + no‑PHI banner; pre‑submit "No PHI" confirmation
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
- Start: attestation notice + Google Sign‑In
- Compose: large textarea + Dictation Guide + checklist; Generate disabled until confirmations
- Preflight: PHI confirm, token estimate, subscription check
- Output: formatted MDM with copy; "Review required" banner; original narrative collapsible
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
  → RESOLVED: Gemini 2.5 Pro (via Vertex AI)
- Plan tiers: limits for requests/day and max tokens/request?
  → RESOLVED: Free (10/mo), Pro (250/mo), Enterprise (1,000/mo), Admin (unlimited)
- PHI detector: hard‑stop or warning‑only?
  → RESOLVED: Pre-submit Checklist confirmation (warning-only UX) + backend PHI field redaction in structured logging
```

</details>
