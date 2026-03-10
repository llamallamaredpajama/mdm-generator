# MDM Enhancement Advisor

**One-line summary:** Post-generation feedback system that identifies documentation gaps, enables one-click remediation with MDM reprocessing, and tracks user patterns over time to improve future input quality.

---

## Core Concept

After MDM generation (Build Mode post-S3 **and** Quick Mode post-generate), the LLM analyzes the gap between what the user provided and what optimal MDM documentation requires. Results are presented as actionable enhancement opportunities.

## Benefit Categories (each with unique icon)

| Category | Icon Idea | What It Captures |
|----------|-----------|-----------------|
| **Enhanced Billing** | `$` / chart | Items that increase MDM complexity level, improve billing capture, strengthen audit defense |
| **Medicolegal Protection** | shield | Items that reduce liability exposure if added to documentation |
| **Better Patient Care** | heart / stethoscope | Items that improve continuity (help other physicians understand what was done and why), plus things the user may have forgotten to mention |

## Acquisition Method Grouping (color-coded)

Items within each category are further grouped by **how the physician obtains the information**:

| Method | Color | Examples |
|--------|-------|---------|
| **History** (ask patient/user) | **Yellow** | "Did you speak with independent historians?", "Was there a pertinent negative you forgot?" |
| **Data Collection** (order/review) | **Red** | "Were labs resulted?", "Was imaging reviewed?" |
| **Clinical Action** (do/document) | **Blue** | "Was shared decision-making documented?", "Was a risk-benefit discussion held?" |

## Rapid Input UI

- Items presented as a checklist with **yes/no toggle buttons** or **checkboxes** for rapid selection
- No free-text unless absolutely necessary — keep interaction fast
- User selects which items to address, then hits **"Reprocess MDM"**
- **One reprocessing attempt only** — prevents infinite loops

## Educational Feedback ("Pro Tips")

- Even if the user skips reprocessing, the gap analysis is displayed as educational feedback
- Helps users learn what optimal documentation looks like over time

## User Analytics (Firestore)

- Store a **lightweight tally** per user: a table of all MDM documentation areas with a count of how often each is missing
- Very small data footprint — just counters, no PHI
- Enables:
  - **User report**: "You typically miss X, Y, Z"
  - **Recommendations**: Targeted improvement suggestions
  - **Auto-populated reminders**: Pre-fill the narrative input field with the user's top 5 "always forgotten" items as gentle prompts for future cases
