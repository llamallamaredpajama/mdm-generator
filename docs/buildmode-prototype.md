# Build Mode UX Prototype v2 — Revised Per Feedback

**Date:** 2026-02-23
**Selected Ideas:** 1 (Smart Menu) + 3 (Order Sets) + 7 (Paste Results) + 10 (CDR Chips) + 18 (Dashboard Output)
**Revision:** Eliminated redundant Phase 2a, moved order selection to S1 dashboard, reworked result entry and S3 input

---

## REVISED FLOW SUMMARY

```text
S1 Input (dictation) → S1 Output Dashboard → S2 Results Input → S2 Output (CDR report) → S3 Input (Treatment + Dispo) → Final MDM
```

Key changes from v1:
- **No separate Phase 2a** — order selection happens on S1 output dashboard
- **S1 dashboard has 4 areas**: Differential, CDR cards, Recommended Workup, Regional Trends
- **S2 is purely result entry** — with "unremarkable/abnormal" quick status
- **S2 output is brief** — just CDR calculations, no disposition guidance
- **S3 split into** Treatment & Reassessment (free text) + Disposition (selectable, saveable)
- **Orders never lock** — can add tests at any point before submitting S2

---

## S1 OUTPUT DASHBOARD (Revised)

After Section 1 processes, the user sees a 4-area dashboard.
No "Top Concern" box — the differential's color coding and order make that obvious.

```text
┌─────────────────────────────────────────┐
│ ═══ Section 1 Complete — Room 14 ═══    │
│                                         │
│ ┌─ DIFFERENTIAL (worst-first) ────────┐ │
│ │ 🔴 ACS (STEMI/NSTEMI/UA)        ▸  │ │
│ │ 🔴 Aortic Dissection             ▸  │ │
│ │ 🟡 Pulmonary Embolism            ▸  │ │
│ │ 🟡 Pericarditis                  ▸  │ │
│ │ 🟢 GERD                         ▸  │ │
│ │ 🟢 Musculoskeletal               ▸  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ CDRs ──────────┐ ┌─ WORKUP ───────┐ │
│ │ HEART  ◐ 3/5    │ │ ☑ ECG          │ │
│ │ PERC   ○ 0/8    │ │ ☑ Troponin     │ │
│ │ Wells  ◐ 2/?    │ │ ☑ CBC          │ │
│ │                  │ │ ☑ BMP          │ │
│ │ ◐ partial       │ │ ☑ CXR          │ │
│ │ ● completable   │ │ ☑ D-dimer      │ │
│ │ ○ needs results  │ │               │ │
│ │                  │ │ [✓ Accept All] │ │
│ │ [View CDRs →]   │ │ [Edit... →]    │ │
│ └──────────────────┘ └────────────────┘ │
│                                         │
│ ┌─ REGIONAL TRENDS ──────────────────┐  │
│ │ 📊 Respiratory: ↑ RSV activity     │  │
│ │ 🧪 Wastewater: COVID stable        │  │
│ │ 📋 NNDSS: No alerts                │  │
│ │                              [More] │  │
│ └─────────────────────────────────────┘ │
│                                         │
│       [ Accept Workup & Continue → ]    │
└─────────────────────────────────────────┘
```

### Design Rules for S1 Dashboard

1. **Differential** — always at top. Each item has a ▸ dropdown arrow (collapsed by default). Tap to expand: shows reasoning, what test rules it in/out, any CDR association.

2. **CDR card** — shows summary without needing to open. Checkboxes/status visible at a glance. Tap "View CDRs" to enter swipeable CDR detail view.

3. **Workup card** — AI-recommended tests shown as pre-checked boxes. User can accept all with one tap, or tap "Edit" to open full order selection. Checkboxes are directly tappable WITHOUT opening the card.

4. **Regional Trends card** — concise summary by default (one line per data source). Tap "More" to expand: explanations of data, links to CDC sources, relevance to this encounter.

5. **"Accept Workup & Continue"** — transitions to Section 2 (results input) with the selected tests ready for resulting.

---

## DIFFERENTIAL EXPANDED ITEM

When user taps ▸ on a differential diagnosis:

```text
│ 🔴 ACS (STEMI/NSTEMI/UA)           ▾  │
│    Substernal CP radiating to L arm,    │
│    diaphoresis, HTN, HLD history.       │
│    Key tests: ECG, serial troponins     │
│    CDR: HEART score (in progress)       │
│ 🔴 Aortic Dissection               ▸  │
```

Collapses back when tapped again. Keeps the dashboard compact by default.

---

## CDR SWIPEABLE DETAIL VIEW

When user taps "View CDRs" on the CDR card:

```text
┌─────────────────────────────────────────┐
│ ← Back to Dashboard                     │
│                                         │
│ ┌─ HEART Score ──────────────────────┐  │
│ │                                     │  │
│ │ ✅ History: Highly suspicious  (2)  │  │
│ │    (substernal, radiating, diaph.)  │  │
│ │                                     │  │
│ │ ○ ECG: needs results           (?)  │  │
│ │                                     │  │
│ │ ✅ Age: 62 (45-64)             (1)  │  │
│ │                                     │  │
│ │ ⬜ Risk factors:                    │  │
│ │    [ 0 ] [ 1 ] [≥2]           (?)  │  │
│ │    💡 HTN + HLD detected → ≥2?     │  │
│ │                                     │  │
│ │ ○ Troponin: needs results      (?)  │  │
│ │                                     │  │
│ │ Score: 3 of 5 known                 │  │
│ │                                     │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ ↕ Swipe up/down for next CDR            │
│ → Swipe right to dismiss this CDR       │
│ ← Swipe left to return to dashboard     │
│                                         │
│ ⚠️ Dismissed CDRs will be excluded from │
│    final MDM (incomplete = liability)   │
└─────────────────────────────────────────┘
```

### CDR Interaction Rules

- **Swipe up/down**: cycle through active CDRs
- **Swipe right**: dismiss CDR (excluded from final MDM — AI will not mention it since incomplete data is a liability)
- **Swipe left**: return to S1 dashboard
- **Tap to answer**: for items that can be completed now (e.g., risk factors)
- **Items needing S2 results**: shown as "○ needs results" — auto-populated when S2 results match
- **If user ignores missing items and submits**: AI excludes that CDR entirely from final output

---

## WORKUP CARD → FULL ORDER SELECTION

When user taps "Edit" on the Workup card, it expands to full order selection (replaces the old Phase 2a):

```text
┌─────────────────────────────────────────┐
│ ← Back to Dashboard                     │
│                                         │
│ ┌─ SUGGESTED ORDER SET ──────────────┐  │
│ │ 💡 "Chest Pain ACS" (your set)     │  │
│ │ ECG, Troponin x2, CBC, BMP, CXR,  │  │
│ │ Mag, Coags, Type & Screen          │  │
│ │                                    │  │
│ │    [ Apply All ✓ ]  [ Customize ]  │  │
│ └────────────────────────────────────┘  │
│                                         │
│ 🔬 RECOMMENDED (from S1 analysis)       │
│ ☑ ECG             ☑ Troponin            │
│ ☑ CBC             ☑ BMP                 │
│ ☑ CXR             ☑ D-dimer             │
│                                         │
│ 🩸 LABS                                 │
│ ☐ CMP         ☐ Mag        ☐ Phos      │
│ ☐ LFTs        ☐ Lipase     ☐ Amylase   │
│ ☐ Coags/INR   ☐ BNP/proBNP ☐ Lactate   │
│ ☐ UA          ☐ UCG        ☐ Blood Cx   │
│ ☐ Type&Screen ☐ VBG/ABG    ☐ ESR/CRP   │
│ ☐ TSH         ☐ LDH        ☐ Fibrinogen │
│ ☐ Haptoglobin ☐ Retic Ct   ☐ Ammonia   │
│ ☐ Ethanol     ☐ Salicylate ☐ APAP      │
│ ☐ Urine tox   ☐ UDS        ☐ Osmolality │
│                                         │
│ 📷 IMAGING                              │
│ ☐ CT Head     ☐ CT C-spine  ☐ CT Chest  │
│ ☐ CTA Chest   ☐ CT Abd/Pelv ☐ CTA Head  │
│ ☐ XR Chest    ☐ XR Ext      ☐ XR Spine  │
│ ☐ US FAST     ☐ US RUQ      ☐ US Aorta  │
│ ☐ US Soft Tiss ☐ US OB      ☐ US Renal  │
│ ☐ Echo TTE    ☐ MRI Brain   ☐ Fluoro    │
│                                         │
│ 🔧 PROCEDURES / POC                     │
│ ☐ ECG (12-lead)  ☐ Repeat ECG           │
│ ☐ LP             ☐ Paracentesis          │
│ ☐ Thoracentesis  ☐ I&D                   │
│ ☐ Bedside US     ☐ Splint/Cast          │
│ ☐ iSTAT          ☐ Rapid Strep          │
│ ☐ Rapid Flu      ☐ COVID rapid           │
│                                         │
│ Selected: 6 tests                       │
│ [ Save as Order Set... ]                │
│ [ Done → Back to Dashboard ]            │
└─────────────────────────────────────────┘
```

User returns to S1 dashboard with updated workup card showing their selections.

---

## SECTION 2: RESULTS INPUT (Revised — No Phase 2a)

After accepting workup on S1 dashboard, user enters Section 2 which is PURELY result entry.
Orders are NOT locked — user can add more tests at any time.

```text
┌─────────────────────────────────────────┐
│ Section 2: Results                      │
│                                         │
│ ┌─ QUICK STATUS ─────────────────────┐  │
│ │                                     │  │
│ │ [ ✓ All Results Unremarkable ]      │  │
│ │                                     │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ [ 📋 Paste Results ]  [ + Add Test ]    │
│                                         │
│ ── YOUR ORDERED TESTS ──                │
│                                         │
│ ┌─ ECG ⭐ CDR ──────────────────────┐   │
│ │ ( ) unremarkable  (•) abnormal     │   │
│ │ [Enter details →]                  │   │
│ └────────────────────────────────────┘   │
│                                         │
│ ┌─ Troponin ⭐ CDR ─────────────────┐   │
│ │ ( ) unremarkable  ( ) abnormal     │   │
│ │ Value: [        ] ng/mL            │   │
│ │ ⚠️ Value needed for HEART score    │   │
│ └────────────────────────────────────┘   │
│                                         │
│ ┌─ CBC ──────────────────────────────┐   │
│ │ (•) unremarkable  ( ) abnormal     │   │
│ └────────────────────────────────────┘   │
│                                         │
│ ┌─ BMP ──────────────────────────────┐   │
│ │ (•) unremarkable  ( ) abnormal     │   │
│ └────────────────────────────────────┘   │
│                                         │
│ ┌─ CXR ──────────────────────────────┐   │
│ │ ( ) unremarkable  ( ) abnormal     │   │
│ │ [Enter details →]                  │   │
│ └────────────────────────────────────┘   │
│                                         │
│ ┌─ D-dimer ⭐ CDR ──────────────────┐   │
│ │ ( ) unremarkable  ( ) abnormal     │   │
│ │ Value: [        ] ng/mL            │   │
│ │ ⚠️ Value needed for Wells PE       │   │
│ └────────────────────────────────────┘   │
│                                         │
│ ── PROGRESS ──                          │
│ ●●●○○○  3 of 6 resulted                │
│ 🔴 0 abnormal  ⚪ 3 pending             │
│                                         │
│ [ ✓ All unselected = unremarkable ]     │
│                                         │
│ ┌─ WORKING DIAGNOSIS ────────────────┐  │
│ │                                     │  │
│ │ Based on results, what do you think │  │
│ │ this is?                            │  │
│ │                                     │  │
│ │ 💡 Suggested (from S1 differential  │  │
│ │    + results):                      │  │
│ │ (•) NSTEMI / ACS                    │  │
│ │ ( ) Unstable Angina                 │  │
│ │ ( ) Musculoskeletal chest pain      │  │
│ │ ( ) Other: [                   ]    │  │
│ │                                     │  │
│ │ → Informs S3 treatment suggestions  │  │
│ │   and disposition pre-population    │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ [ Submit Results → ]                    │
└─────────────────────────────────────────┘
```

### Results Input Design Rules

1. **"All Results Unremarkable"** — top of screen, one tap, fastest path. Marks everything unremarkable and enables submit. CDR-required values still highlighted for optional entry.

2. **Quick status per test: unremarkable / abnormal** — NOT normal/abnormal. "Unremarkable" is the clinical term (covers "technically abnormal but clinically irrelevant").

3. **Separate detail entry** — "Enter details" button only shown for tests marked abnormal or that need CDR values. User can check "abnormal" without entering details if the value doesn't change management.

4. **⭐ CDR badge** — tests that feed into active CDR calculations are marked with a star. Value input field shown by default for these (not hidden behind a button). Warning text reminds user the value is needed.

5. **"+ Add Test"** — orders are NEVER locked. User can add more tests from the full order list at any point before submitting.

6. **"All unselected = unremarkable"** — at the bottom, after user marks specific tests as abnormal, this one-tap marks everything else unremarkable. Combined with the abnormal selections, this is the fastest path for partial resulting.

7. **Progress indicator** — visual dots (filled = resulted, empty = pending) + count + abnormal count. More scannable than text-only counter.

8. **Dictation mode** — user can dictate: "ECG showed ST depression in lateral leads, no STEMI. Troponin 2.5. All other workup unremarkable." AI parses this and maps to the ordered tests, marking abnormals and filling values.

9. **Working diagnosis** — at the bottom of results, before submit. AI suggests diagnoses based on S1 differential refined by S2 results (e.g., if troponin elevated → NSTEMI moves to top). User selects or types custom. This feeds into S3 to pre-populate treatment suggestions (CDR + diagnosis-specific) and disposition options (e.g., NSTEMI → likely admit/observe).

---

## ABNORMAL RESULT DETAIL ENTRY

When user taps "Enter details" on an abnormal test:

```text
┌─ ECG ⭐ CDR ── ABNORMAL ────────────┐
│ (•) abnormal                         │
│                                      │
│ Quick select:                        │
│ ☐ ST elevation    ☐ ST depression    │
│ ☐ T-wave changes  ☐ New BBB          │
│ ☐ Arrhythmia      ☐ Prolonged QTc    │
│ ☐ LVH             ☐ Other            │
│                                      │
│ Notes: [ST depression lateral leads, │
│         no STEMI criteria          ] │
│                                      │
│ → HEART Score ECG component: (2)     │
│   "Nonspecific repolarization"       │
│                                      │
│ 💾 Saved reports:                    │
│ [ NSR, normal intervals... ]         │
│ [ Sinus tach, no acute ST... ]       │
│                                      │
│ [ Save as Report Template ]          │
│ [ Done ]                             │
└──────────────────────────────────────┘
```

Common findings as quick-select checkboxes for speed. Free text for specifics. CDR auto-calculation shown inline.

### Saved Report Templates

Physicians often document the same test findings the same way. For example, a "normal ECG" might always be: "Normal sinus rhythm, normal intervals, no acute ST-T wave changes." A "normal CXR" might always be: "No acute cardiopulmonary process."

```text
┌─────────────────────────────────────────┐
│ Save Report Template               [×] │
│                                         │
│ Test: ECG                               │
│ Name: [ NSR, normal intervals      ]    │
│                                         │
│ Template text:                          │
│ ┌─────────────────────────────────────┐ │
│ │ Normal sinus rhythm, normal         │ │
│ │ intervals, no acute ST-T wave       │ │
│ │ changes, no arrhythmia.             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ Save Template ]                       │
└─────────────────────────────────────────┘
```

**Rules:**
- Saved per-test (user builds a library of report templates for ECG, CXR, CT, etc.)
- Tapping a saved report auto-fills the notes field
- Stored in user profile alongside order sets and dispo flows
- Can mark a template as "unremarkable" or "abnormal" default (e.g., "NSR" auto-selects unremarkable)

---

## SECTION 2 OUTPUT (Revised — Brief CDR Report Only)

After S2 submits, a brief informational output. No workup suggestions, no disposition guidance, no MDM complexity.

```text
┌─────────────────────────────────────────┐
│ ═══ Results Processed ═══               │
│                                         │
│ Working Dx: NSTEMI / ACS                │
│ 6 tests resulted: 1 abnormal, 5 unremarkable
│                                         │
│ ┌─ COMPLETED CDR CALCULATIONS ───────┐  │
│ │                                     │  │
│ │ HEART Score: 5/10 — Moderate Risk   │  │
│ │  → 12-16% risk MACE at 6 weeks  [▸]│  │
│ │                                     │  │
│ │ Wells PE: 2 — Low Probability       │  │
│ │  → D-dimer negative, PE unlikely [▸]│  │
│ │                                     │  │
│ │ PERC: All criteria met              │  │
│ │  → PE effectively ruled out      [▸]│  │
│ │                                     │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ [▸] = tap to expand CDR details         │
│                                         │
│        [ Continue to Section 3 → ]      │
└─────────────────────────────────────────┘
```

### S2 Output Design Rules

1. **Brief summary** — just test count and abnormal count
2. **CDR calculations only** — completed CDRs with scores and one-line interpretation
3. **Expandable** — tap ▸ to see full CDR breakdown (inputs, scoring, evidence)
4. **No disposition guidance** — physician decides; tool doesn't presume
5. **No MDM complexity** — that's internal to the AI, not useful to the physician here
6. **Backend uses all data** — even though output is brief, all CDR scores, test results, working diagnosis, and analysis feed into Section 3's final MDM generation
7. **Working diagnosis displayed** — confirms the user's selected diagnosis at top, which S3 will use to pre-populate treatment suggestions and disposition

---

## SECTION 3 INPUT (Revised — Treatment/Reassessment + Disposition)

Two distinct input areas: Treatment & Reassessment (free text) and Disposition (selectable).

```text
┌─────────────────────────────────────────┐
│ Section 3: Treatment & Disposition      │
│ Working Dx: NSTEMI / ACS               │
│                                         │
│ ┌─ TREATMENT & REASSESSMENT ─────────┐  │
│ │                                     │  │
│ │ 💡 Suggested for NSTEMI/ACS:        │  │
│ │ ☑ Aspirin 325mg (HEART protocol)    │  │
│ │ ☐ Heparin drip (ACS pathway)       │  │
│ │ ☐ Cardiology consult (HEART ≥4)    │  │
│ │                                     │  │
│ │ Dictate or type treatment plan:     │  │
│ │ ┌─────────────────────────────────┐ │  │
│ │ │ Patient given aspirin 325mg.    │ │  │
│ │ │ Pain resolved with sublingual   │ │  │
│ │ │ NTG. Serial troponins trended   │ │  │
│ │ │ down. Patient reassessed,       │ │  │
│ │ │ comfortable, pain-free.         │ │  │
│ │ └─────────────────────────────────┘ │  │
│ │                                     │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ ┌─ DISPOSITION ──────────────────────┐  │
│ │                                     │  │
│ │ (•) Discharge home                  │  │
│ │ ( ) Observation (≤24hr)             │  │
│ │ ( ) Inpatient admission             │  │
│ │ ( ) ICU admission                   │  │
│ │ ( ) Transfer to [           ]       │  │
│ │ ( ) AMA                             │  │
│ │ ( ) LWBS                            │  │
│ │ ( ) Deceased                        │  │
│ │                                     │  │
│ │ Follow-up:                          │  │
│ │ ☑ PCP 1 week                        │  │
│ │ ☐ Cardiology 48 hours              │  │
│ │ ☐ Return to ED PRN                  │  │
│ │ ☐ Specialist: [           ]         │  │
│ │                                     │  │
│ │ 💡 Saved flows:                     │  │
│ │ [ DC + Cards f/u ]  [ Obs + Tele ]  │  │
│ │ [ Save current as flow... ]         │  │
│ │                                     │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ [ Submit & Finalize → ]                 │
└─────────────────────────────────────────┘
```

### S3 Input Design Rules

1. **Treatment & Reassessment** — free dictation/text only. Too many options for programmatic selection.

2. **CDR-suggested treatments** — ONLY shown if a completed CDR includes a specific treatment recommendation (e.g., HEART protocol → aspirin). Offered as optional checkboxes above the text area. Selecting appends to the text.

3. **Disposition** — radio button selection (one choice). Editable options. Users can customize the list and save it to their profile.

4. **Follow-up** — checkboxes for common follow-up patterns. Customizable.

5. **Saved disposition flows** — like order sets but for disposition. "DC + Cards f/u" is a saved combination (discharge home + cardiology follow-up 48hrs + return precautions). One-tap applies the full flow.

6. **"Save current as flow"** — saves the current disposition + follow-up combo for future encounters.

---

## FINAL OUTPUT (Unchanged from v1)

```text
┌─────────────────────────────────────────┐
│ ═══ ENCOUNTER FINALIZED ═══             │
│ Room 14 — Chest Pain — 62yo M           │
│                                         │
│ ┌─ Final MDM ────────────────────────┐  │
│ │ [Full MDM text]                     │  │
│ │                                     │  │
│ │ Includes: differential, all data    │  │
│ │ reviewed, completed CDR scores +    │  │
│ │ interpretations, risk assessment,   │  │
│ │ treatment plan, disposition +       │  │
│ │ rationale, regional trends if       │  │
│ │ applicable                          │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ [ 📋 Copy to Clipboard ]               │
│ [ 💾 Save to Google Drive ]            │
│                                         │
│ ⚠️ Physician must review before use     │
│                                         │
│ [ ← Back to Encounters ]               │
└─────────────────────────────────────────┘
```

---

## ORDER SET SAVE/RECALL FLOW

### Saving

From the full order selection view (Workup card → Edit):

```text
┌─────────────────────────────────────────┐
│ Save as Order Set                  [×]  │
│                                         │
│ Name: [ R/O MI Workup            ]      │
│                                         │
│ Included tests (8):                     │
│ ☑ ECG  ☑ Troponin x2  ☑ CBC  ☑ BMP    │
│ ☑ CXR  ☑ Mag  ☑ Coags  ☑ Type&Screen  │
│                                         │
│ Tags (optional):                        │
│ [ Chest pain ] [ Cardiac ] [ + ]        │
│                                         │
│ [ Save Order Set ]                      │
└─────────────────────────────────────────┘
```

### Recalling (Future Encounter)

AI detects similar presentation in S1 → suggests matching order set on S1 dashboard Workup card:

```text
┌─ WORKUP ──────────────────────────────┐
│ 💡 Suggested: "R/O MI Workup" (8)    │
│ [ Apply ] [ Customize ] [ Skip ]      │
│                                       │
│ ☑ ECG  ☑ Troponin  ☑ CBC  ☑ BMP     │
│ ☑ CXR  ☑ D-dimer                     │
│                                       │
│ [✓ Accept All]  [Edit... →]          │
└───────────────────────────────────────┘
```

---

## DISPOSITION FLOW SAVE/RECALL

### Saving

From S3 Disposition section:

```text
┌─────────────────────────────────────────┐
│ Save Disposition Flow              [×]  │
│                                         │
│ Name: [ DC + Cardiology f/u      ]      │
│                                         │
│ Disposition: Discharge home             │
│ Follow-up:                              │
│ ☑ Cardiology 48 hours                  │
│ ☑ Return to ED PRN                     │
│                                         │
│ [ Save Flow ]                           │
└─────────────────────────────────────────┘
```

### Recalling

Saved flows appear as quick-select buttons at bottom of Disposition card. One tap applies the full combination.

---

## REGIONAL TRENDS CARD (Expanded)

When user taps "More" on the Regional Trends card:

```text
┌─────────────────────────────────────────┐
│ ← Back to Dashboard                     │
│                                         │
│ 📊 REGIONAL TRENDS ANALYSIS             │
│ Region: Chicago Metro                   │
│                                         │
│ ┌─ RESPIRATORY (CDC HospData) ───────┐  │
│ │ ↑ RSV hospitalizations up 15% wk/wk│  │
│ │ Flu A: stable, below baseline       │  │
│ │ COVID: declining trend              │  │
│ │                                     │  │
│ │ Relevance: Low (chest pain DDx)     │  │
│ │ 🔗 CDC Respiratory Dashboard        │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ ┌─ WASTEWATER (NWSS) ───────────────┐   │
│ │ COVID viral load: stable, low       │  │
│ │ Influenza: not detected             │  │
│ │                                     │  │
│ │ 🔗 CDC NWSS Wastewater Dashboard   │   │
│ └─────────────────────────────────────┘  │
│                                         │
│ ┌─ NOTIFIABLE DISEASES (NNDSS) ──────┐  │
│ │ No regional alerts for this period  │  │
│ │                                     │  │
│ │ 🔗 CDC NNDSS Weekly Tables         │   │
│ └─────────────────────────────────────┘  │
│                                         │
│ ── Relevance to This Encounter ──       │
│ No significant regional trends          │
│ impacting chest pain differential.      │
│                                         │
│ [ ← Back to Dashboard ]                │
└─────────────────────────────────────────┘
```

---

## DATA MODEL CHANGES

### Encounter Document Additions

```json
{
  "section2": {
    "selectedTests": ["ecg", "troponin", "cbc", "bmp", "cxr", "d-dimer"],
    "testResults": {
      "ecg": {
        "status": "abnormal",
        "quickFindings": ["st_depression"],
        "notes": "ST depression lateral leads, no STEMI criteria",
        "value": null
      },
      "troponin": {
        "status": "abnormal",
        "value": "2.5",
        "unit": "ng/mL",
        "notes": null
      },
      "cbc": { "status": "unremarkable" },
      "bmp": { "status": "unremarkable" },
      "cxr": { "status": "unremarkable" },
      "d-dimer": {
        "status": "unremarkable",
        "value": "380",
        "unit": "ng/mL"
      }
    },
    "allUnremarkable": false,
    "pastedRawText": null,
    "appliedOrderSet": "order-set-id-123",
    "workingDiagnosis": {
      "selected": "nstemi_acs",
      "custom": null,
      "suggestedOptions": ["nstemi_acs", "unstable_angina", "msk_chest_pain"]
    }
  },

  "cdrTracking": {
    "heart": {
      "name": "HEART Score",
      "status": "completed",
      "identifiedInSection": 1,
      "completedInSection": 2,
      "dismissed": false,
      "components": {
        "history": { "value": 2, "source": "section1", "answered": true },
        "ecg": { "value": 2, "source": "section2", "answered": true },
        "age": { "value": 1, "source": "section1", "answered": true },
        "riskFactors": { "value": 2, "source": "user_input", "answered": true },
        "troponin": { "value": 2, "source": "section2", "answered": true }
      },
      "score": 9,
      "interpretation": "High Risk — 50-65% risk MACE at 6 weeks"
    }
  },

  "section3": {
    "treatments": "Patient given aspirin 325mg...",
    "cdrSuggestedTreatments": ["aspirin_325"],
    "disposition": "discharge",
    "followUp": ["cardiology_48hr", "return_ed_prn"],
    "appliedDispoFlow": "dispo-flow-id-456"
  }
}
```

### User Document Additions

```json
{
  "orderSets": [
    {
      "id": "order-set-id-123",
      "name": "R/O MI Workup",
      "tests": ["ecg", "troponin_x2", "cbc", "bmp", "cxr", "mag", "coags", "type_screen"],
      "tags": ["chest_pain", "cardiac"],
      "createdAt": "2026-02-23T...",
      "usageCount": 14
    }
  ],
  "dispositionFlows": [
    {
      "id": "dispo-flow-id-456",
      "name": "DC + Cardiology f/u",
      "disposition": "discharge",
      "followUp": ["cardiology_48hr", "return_ed_prn"],
      "createdAt": "2026-02-23T...",
      "usageCount": 8
    }
  ],
  "reportTemplates": [
    {
      "id": "rpt-001",
      "testId": "ecg",
      "name": "NSR, normal intervals",
      "text": "Normal sinus rhythm, normal intervals, no acute ST-T wave changes, no arrhythmia.",
      "defaultStatus": "unremarkable",
      "usageCount": 42
    },
    {
      "id": "rpt-002",
      "testId": "cxr",
      "name": "No acute process",
      "text": "No acute cardiopulmonary process. Heart size normal. No effusion.",
      "defaultStatus": "unremarkable",
      "usageCount": 38
    }
  ],
  "dispositionOptions": [
    "Discharge home",
    "Observation (≤24hr)",
    "Inpatient admission",
    "ICU admission",
    "Transfer",
    "AMA",
    "LWBS",
    "Deceased"
  ],
  "followUpOptions": [
    "PCP 1 week",
    "Cardiology 48 hours",
    "Return to ED PRN",
    "Specialist"
  ]
}
```

### Master Libraries (New Collections)

**`testLibrary` collection** — master list of all ER tests:

```json
{
  "id": "troponin",
  "name": "Troponin",
  "category": "labs",
  "subcategory": "cardiac",
  "commonIndications": ["chest_pain", "acs", "heart_failure"],
  "unit": "ng/mL",
  "normalRange": "<0.04",
  "quickFindings": null,
  "feedsCdrs": ["heart"]
}
```

**`cdrLibrary` collection** — CDR definitions:

```json
{
  "id": "heart",
  "name": "HEART Score",
  "fullName": "History, ECG, Age, Risk Factors, Troponin",
  "applicableChiefComplaints": ["chest_pain", "dyspnea"],
  "components": [
    {
      "id": "history",
      "label": "History",
      "type": "select",
      "options": [
        { "label": "Slightly suspicious", "value": 0 },
        { "label": "Moderately suspicious", "value": 1 },
        { "label": "Highly suspicious", "value": 2 }
      ],
      "source": "section1",
      "autoPopulateFrom": "narrative_analysis"
    }
  ],
  "scoring": {
    "ranges": [
      { "min": 0, "max": 3, "risk": "Low", "interpretation": "1.7% risk MACE..." },
      { "min": 4, "max": 6, "risk": "Moderate", "interpretation": "12-16.6% risk..." },
      { "min": 7, "max": 10, "risk": "High", "interpretation": "50-65% risk..." }
    ]
  },
  "suggestedTreatments": {
    "High": ["aspirin_325", "heparin_drip", "cardiology_consult"],
    "Moderate": ["aspirin_325", "serial_troponins", "observation"]
  }
}
```

---

## NEW BACKEND ENDPOINTS

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/v1/libraries/tests` | GET | Master test list with categories |
| `/v1/libraries/cdrs` | GET | CDR definitions with components |
| `/v1/user/order-sets` | GET/POST/PUT/DELETE | CRUD for saved order sets |
| `/v1/user/dispo-flows` | GET/POST/PUT/DELETE | CRUD for saved disposition flows |
| `/v1/build-mode/parse-results` | POST | AI-parse pasted lab text → structured results |
| `/v1/build-mode/match-cdrs` | POST | Given S1 analysis → identify relevant CDRs |
| `/v1/user/report-templates` | GET/POST/PUT/DELETE | CRUD for saved result report templates |
| `/v1/build-mode/suggest-diagnosis` | POST | Given S1 differential + S2 results → rank working dx options |

---

## NEW FRONTEND COMPONENTS

| Component | Location | Purpose |
| --- | --- | --- |
| `DashboardOutput` | `build-mode/shared/` | S1 + S2 output dashboard (replaces DifferentialPreview) |
| `DifferentialList` | `build-mode/shared/` | Color-coded collapsible differential items |
| `CdrCard` | `build-mode/shared/` | CDR summary chip on dashboard |
| `CdrSwipeView` | `build-mode/mobile/` | Swipeable CDR detail cards |
| `CdrDetailPanel` | `build-mode/desktop/` | CDR detail panel (desktop equivalent) |
| `WorkupCard` | `build-mode/shared/` | Workup summary + accept on dashboard |
| `OrderSelector` | `build-mode/shared/` | Full categorized test checklist |
| `OrderSetSuggestion` | `build-mode/shared/` | Saved order set suggestion card |
| `SaveOrderSetModal` | `build-mode/shared/` | Save current selections as order set |
| `RegionalTrendsCard` | `build-mode/shared/` | Trends summary on dashboard |
| `RegionalTrendsDetail` | `build-mode/shared/` | Expanded trends with sources |
| `ResultEntry` | `build-mode/shared/` | Per-test unremarkable/abnormal + details |
| `ResultDetailExpanded` | `build-mode/shared/` | Expanded abnormal result entry with quick-selects |
| `SaveReportTemplateModal` | `build-mode/shared/` | Save result notes as reusable report template |
| `WorkingDiagnosisInput` | `build-mode/shared/` | AI-suggested diagnosis selection at end of S2 |
| `PasteLabModal` | `build-mode/shared/` | Paste + parse lab results dialog |
| `TreatmentInput` | `build-mode/shared/` | S3 treatment free text + CDR suggestions |
| `DispositionSelector` | `build-mode/shared/` | S3 disposition radio + follow-up + saved flows |
| `SaveDispoFlowModal` | `build-mode/shared/` | Save disposition flow |
| `ProgressIndicator` | `build-mode/shared/` | Visual dots + counts for result progress |

---

## IMPLEMENTATION PHASES (Revised)

### Phase 1: Data Foundation
- Master test library (Firestore collection + GET endpoint)
- CDR library (Firestore collection + GET endpoint)
- Updated encounter schema (section2 restructure, cdrTracking)
- User schema additions (orderSets, dispositionFlows, customOptions)

### Phase 2: S1 Dashboard
- DashboardOutput replacing DifferentialPreview
- DifferentialList with color coding + collapsible items
- WorkupCard with pre-checked AI recommendations + "Accept All"
- RegionalTrendsCard with concise summary (existing trend analysis integration)
- CdrCard summary chips

### Phase 3: CDR System
- CDR matching from S1 analysis (backend endpoint)
- CdrSwipeView for mobile CDR detail interaction
- CdrDetailPanel for desktop
- CDR auto-population from narrative analysis
- CDR dismiss logic (excluded from final MDM)
- Cross-section CDR state persistence

### Phase 4: S2 Results Redesign
- ResultEntry with unremarkable/abnormal quick status
- "All Results Unremarkable" one-tap
- "All unselected = unremarkable" one-tap
- CDR-required value highlighting (⭐ badge)
- ResultDetailExpanded for abnormal findings
- ProgressIndicator (visual dots)
- "+ Add Test" (orders never locked)

### Phase 5: S2 Intelligence
- Paste lab results (AI parsing endpoint)
- Dictation → structured result mapping
- CDR auto-completion from S2 results
- S2 output: brief CDR calculations report

### Phase 6: S3 Redesign
- TreatmentInput (free text + CDR-suggested treatments)
- DispositionSelector (radio + follow-up + saved flows)
- SaveDispoFlowModal
- Updated final MDM prompt to include all new structured data

### Phase 7: Order Sets
- OrderSelector full UI (from S1 dashboard Workup → Edit)
- SaveOrderSetModal
- OrderSetSuggestion (AI matching from S1 analysis)
- User order set management (settings page)

### Phase 8: Persistence & Polish
- Google Drive export integration
- Cross-device sync optimization
- Desktop-specific expanded layouts
- Mobile gesture refinement (CDR swipe)
- Accessibility pass

---

## KEY ASSUMPTIONS TO TEST

1. **"Unremarkable/abnormal is faster than normal/abnormal"** — clinical terminology match
2. **"One-tap All Unremarkable is used >50% of cases"** — validates the shortcut
3. **"CDR swipe dismiss is intuitive on mobile"** — gesture discovery
4. **"Order selection on S1 dashboard eliminates need for separate Phase 2a"** — flow validation
5. **"Saved disposition flows save time like order sets do"** — user adoption
6. **"Brief S2 output (CDR only) is sufficient"** — physicians don't want disposition guidance here
7. **"Paste lab results works reliably across EHR formats"** — technical validation
8. **"Saved report templates get reused frequently"** — physicians have standardized documentation patterns
9. **"Working diagnosis in S2 meaningfully pre-populates S3"** — reduces S3 input time

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow v2_
