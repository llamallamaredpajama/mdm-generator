# Build Mode UX Refactor — Design Thinking Session

**Date:** 2026-02-23
**Facilitator:** Jeremy + Maya (Design Thinking Coach)

---

## DESIGN CHALLENGE

**How might we transform Build Mode's 3-section workflow from a documentation tool into a clinical decision support companion that mirrors the natural rhythm of emergency care — fast enough to keep pace with a busy shift, smart enough to surface the right decisions at the right moment?**

---

## EMPATHIZE: Understanding the Physician User

### The Clinical Workflow Reality

Emergency Medicine physicians have 3 natural breakpoints in patient care that map to Build Mode sections:

1. **Section 1 — Initial Impression**: Take history, perform quick exam, form initial impression. This guides the next phase of care.
2. **Section 2 — Workup & Results**: Order labs/imaging based on S1 impression, interpret results when they come back. This is where CDRs (Clinical Decision Rules) that need lab data get completed.
3. **Section 3 — Working Diagnosis + Treatment + Disposition**: Determine what the problem really is, what treatments to give (meds, procedures), and where patient goes (home, observation, inpatient, ICU, transfer).

### Key User Insights

| Insight | Implication |
|---------|------------|
| The 3 sections map to **real clinical breakpoints** | The workflow structure is sound — refine, don't replace |
| CDRs bridge sections — start in S1, may complete in S2 | Need a persistent CDR tracker that lives across sections |
| Section 2 is currently the weakest link (blank textarea) | Biggest UX opportunity — transform from freeform to structured + dynamic |
| Speed is non-negotiable | Every interaction must minimize taps/clicks |
| Order sets are personalized clinical knowledge | User accounts need a saved order set library |
| AI should pre-populate based on pattern recognition | "60yo male chest pain" -> suggest "R/O MI" order set automatically |
| After orders are selected, focus shifts to results | UI should collapse/hide unselected items to reduce noise |
| Mobile-first but desktop-essential | Dictate on mobile (phone between patients) -> review/paste on desktop (Windows EHR) |
| Cross-device sync required | Mobile and desktop must show same encounter state in real-time |
| Document persistence needed | Firestore keeps 24 hrs / 12 hr sessions -> Google Drive integration for permanent storage |

### Empathy Map

| Dimension | What We Know |
|-----------|-------------|
| **SAYS** | "I don't want the tool to slow me down" / "Section 2 is tedious" |
| **THINKS** | "I already know what tests to order — let me select them fast" / "If I have to type out every lab I ordered, this isn't saving me time" |
| **DOES** | Dictates S1 rapidly -> waits for results -> needs to document what came back and what it means |
| **FEELS** | Pressure of time, cognitive load of multiple patients, frustration when tools add friction instead of removing it |

---

## DEFINE: Problem Framing

### Point of View Statement

> **An Emergency Medicine physician** needs **a mobile-first clinical documentation companion that keeps pace with their shift — capturing impressions, intelligently suggesting workup, completing CDR calculations across sections, and seamlessly syncing to desktop for EHR integration** — because **the current workflow treats documentation as an afterthought (a blank text area) when it should be an active clinical decision support tool that makes their care better while reducing documentation burden.**

### How Might We Questions

| # | How Might We... | Focus Area | Priority |
|---|-----------------|------------|----------|
| **HMW-1** | ...make Section 2 input as fast as selecting from a menu rather than dictating from scratch? | Dynamic workup UI | HIGH |
| **HMW-2** | ...let CDR calculations flow naturally across sections without breaking the physician's workflow? | Cross-section CDR tracker | HIGH |
| **HMW-3** | ...help physicians build reusable "clinical playbooks" (order sets) that learn from their practice patterns? | Saved order sets | MEDIUM |
| **HMW-4** | ...ensure the mobile dictation experience is so fast that physicians prefer it to writing on paper? | Mobile-first input | MEDIUM |
| **HMW-5** | ...bridge the gap between mobile dictation and desktop EHR paste seamlessly? | Cross-device sync | MEDIUM |
| **HMW-6** | ...give physicians permanent access to their work without adding complexity to their workflow? | Google Drive export | LOW |
| **HMW-7** | ...present AI-generated outputs (differential, CDR prompts, recommended tests) in a way that takes seconds to scan and act on? | Output readability | HIGH |

**Prioritized focus: HMW-1 + HMW-2 + HMW-7** (the decision support core)

---

## IDEATE: Generated Solutions (20 Ideas)

### HMW-1: Make Section 2 Input Fast (Dynamic Workup UI)

**Current state**: Blank textarea. Physician types/dictates everything.

| # | Idea | Description |
|---|------|-------------|
| 1 | **Smart Menu** | After S1 analysis, S2 opens with a curated list of recommended labs/imaging, grouped by clinical relevance. Top group = "Recommended for this presentation." One-tap "Select All Recommended." Below that, categorized full list (Cardiac, Heme, Chem, Imaging, etc.) |
| 2 | **Kitchen Ticket** | Section 2 looks like a restaurant order ticket. Left column: ordered tests (checkboxes). Right column: results (fill in as they come back). Visual state: empty -> pending -> resulted. |
| 3 | **Order Set Library** | User maintains saved order sets ("Chest Pain Workup", "Pediatric Fever", "Abdominal Pain"). AI suggests relevant set based on S1 differential. One tap to apply. Can customize per encounter. Save new sets from any encounter. |
| 4 | **Progressive Reveal** | S2 starts showing only AI-recommended tests. As user selects, unselected items fade away. After selection is "locked in," the UI transforms to show ONLY selected tests with result entry fields next to each. |
| 5 | **Two-Phase S2** | Split Section 2 into 2a (Order Selection) and 2b (Result Entry). 2a is checklist/order-set based. 2b appears after orders are "committed" — a clean interface just for entering results. |
| 6 | **Future Lab Integration** | Structure S2 so that when real-time lab integration becomes possible, results auto-populate. For now, the structure is ready — physician just confirms values manually. |
| 7 | **Paste Lab Results** | Many physicians copy lab results from their EHR. "Paste Lab Results" button auto-parses pasted text into structured results using AI. |

### HMW-2: Let CDRs Flow Naturally Across Sections

**Current state**: CDRs are mentioned in the differential but aren't tracked as interactive elements.

| # | Idea | Description |
|---|------|-------------|
| 8 | **CDR Sidebar/Tracker** | A persistent CDR panel that lives alongside the main section workflow. Shows identified CDRs, their completion status (needs: history question, lab value, imaging result), and calculated scores when complete. |
| 9 | **CDR Cards** | Each relevant CDR appears as a swipeable card between sections. Swipe right = answer question, swipe left = dismiss. Card shows what's known, what's missing, and what section the missing data will come from. |
| 10 | **Inline CDR Chips** | After S1 output, CDRs appear as expandable chips: "HEART Score: 3/5 known — tap to complete." Missing items are clearly labeled: "Needs: Troponin (order in S2)" or "Needs: Age >= 65 (answer now: Y/N)." |
| 11 | **CDR Timeline** | Visual timeline showing where each CDR data point comes from across sections. S1: age, history, ECG changes. S2: troponin, chest pain onset. S3: completed score -> disposition recommendation. |
| 12 | **CDR Bridge** | Between each section, a "CDR Status" interstitial shows: "Based on Section 1, we identified 3 relevant CDRs. 2 need lab results from Section 2. 1 can be completed now." Quick-answer interface for completable items. |
| 13 | **Smart CDR Triage** | CDRs are auto-categorized: "Can complete NOW" (all data available from S1) vs "Needs workup results" (deferred to post-S2) vs "Informational only" (no calculation needed, just awareness). |

### HMW-7: Present AI Outputs for Rapid Scanning

**Current state**: DifferentialPreview shows a list. MdmPreviewPanel shows structured text.

| # | Idea | Description |
|---|------|-------------|
| 14 | **Traffic Light** | Color-code outputs: Red = critical/life-threatening (top of differential), Yellow = concerning, Green = likely benign. Physician's eye immediately goes to red. |
| 15 | **Action Cards** | Instead of a text list, each differential diagnosis is a card with: diagnosis name, why it's considered, what test would rule it in/out, CDR if applicable. Tappable to expand. |
| 16 | **Headline + Details** | Show the TL;DR first (1-2 lines: "Top concern: ACS. Recommend: ECG, troponin, HEART score.") with expandable details underneath. |
| 17 | **Decision Tree** | Show the differential as a branching tree. Main branches = major categories. Each branch leads to "if test X shows Y -> likely Z." Interactive — tap to explore. |
| 18 | **Dashboard Output** | Between sections, show a dashboard with: differential (ranked, color-coded), active CDRs (with completion status), recommended tests (pre-selected for S2), missing info flags. All on one screen, scannable in 5-10 seconds. |
| 19 | **Voice Summary** | The AI reads back a 15-second audio summary of the output. Physician can listen while walking to the next patient. (Accessibility win too.) |
| 20 | **Comparison View** | After finalization, show a side-by-side: initial impression (S1) -> final diagnosis (S3) -> what changed and why. Great for learning and documentation. |

---

## TOP CONCEPT COMBINATIONS (for selection)

### Concept A: "Clinical Intelligence Core"
- **Ideas**: 1 (Smart Menu) + 3 (Order Set Library) + 5 (Two-Phase S2) + 10 (Inline CDR Chips) + 13 (Smart CDR Triage) + 16 (Headline + Details) + 18 (Dashboard Output)
- **Philosophy**: Structured, methodical. S2 becomes a two-phase order-then-result workflow. CDRs as interactive chips with smart categorization. Outputs use headline-first format with dashboard views.
- **Best for**: Users who want clear structure and predictable interactions.

### Concept B: "Progressive Clinical Companion"
- **Ideas**: 4 (Progressive Reveal) + 3 (Order Set Library) + 7 (Paste Lab Results) + 12 (CDR Bridge) + 10 (Inline CDR Chips) + 14 (Traffic Light) + 15 (Action Cards)
- **Philosophy**: Fluid, adaptive. S2 progressively reveals and hides elements. CDRs appear as bridge screens. Outputs use traffic light severity with action cards.
- **Best for**: Users who want the UI to adapt to them dynamically.

### Concept C: "Kitchen to Operating Room"
- **Ideas**: 2 (Kitchen Ticket) + 3 (Order Set Library) + 5 (Two-Phase S2) + 8 (CDR Sidebar/Tracker) + 13 (Smart CDR Triage) + 18 (Dashboard Output) + 20 (Comparison View)
- **Philosophy**: Visual metaphor-driven. S2 uses ticket format (orders left, results right). CDR sidebar persists. Dashboard between sections, comparison at end.
- **Best for**: Users who respond to visual metaphors and spatial organization.

---

## ADDITIONAL DESIGN CONSIDERATIONS

### Mobile-First Design Requirements
- Primary input device is the physician's phone (between patient encounters)
- Must be thumb-friendly — large tap targets, minimal scrolling for key actions
- Dictation-first input paradigm for narrative sections
- Checkbox/tap interaction for structured data (order selection, CDR answers)
- Apple Wallet-style card stack for encounter management (already implemented)

### Desktop Sync Requirements
- Desktop browser (Windows) must show same encounter in real-time
- Desktop optimized for: output review, MDM copy-to-clipboard, EHR paste
- Desktop may have expanded views (side panels, wider dashboards) vs mobile's stacked layout
- Kanban-style encounter management on desktop (already implemented)

### Data Persistence
- Current: Firestore with 24hr retention, 12hr session limit
- Desired: Google Drive integration for permanent document storage
- "Save to Google Drive" button on finalized encounters
- User manages their own document archive outside the app

### CDR Library Requirements (Future Research Needed)
- Need a curated library of EM clinical decision rules
- Each CDR needs: name, required inputs (with types: history, lab, imaging, calculated), formula/scoring, interpretation thresholds
- Key CDRs: HEART score, PERC rule, Wells criteria (PE and DVT), PECARN, Ottawa ankle/knee, Canadian C-spine, NEXUS, Centor/McIsaac, CHA2DS2-VASc, HAS-BLED, CURB-65, qSOFA, NIH Stroke Scale
- CDRs must be mappable to chief complaints / differential diagnoses

### Order/Test Library Requirements (Future Research Needed)
- Comprehensive list of ER labs and diagnostic tests
- Categories: Labs (CBC, BMP, CMP, Troponin, BNP, D-dimer, UA, Lipase, LFTs, Coags, Blood cultures, etc.), Imaging (X-ray types, CT types, US types, MRI), Procedures (ECG, LP, Paracentesis), Point-of-Care tests (iSTAT, bedside US)
- Each test needs: name, category, common indications, typical turnaround time
- Tests must be groupable into order sets
- Order sets saved per-user in Firestore user profile

---

## NEXT STEPS

1. **Jeremy reviews this document** and selects which concept(s) / specific ideas to pursue
2. **Prototype phase**: Create low-fidelity mockups (ASCII wireframes or Figma) of the selected approach
3. **CDR library research**: Identify and catalog EM clinical decision rules with their data requirements
4. **Test library research**: Catalog ER labs, imaging, and diagnostic tests with categories
5. **Implementation planning**: Break selected concept into epic/stories for development
6. **Mobile-first wireframes**: Design the S2 dynamic UI for phone-sized viewport
7. **Desktop wireframes**: Design the expanded desktop view with sync behavior

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow_
