# CDR Batch Configuration Reference Pattern

## Well-Defined CDR Example: HEART Score

This shows the gold standard of a fully-defined CDR with real clinical components:

```typescript
{
  id: 'heart',
  name: 'HEART Score',
  fullName: 'History, ECG, Age, Risk Factors, Troponin',
  category: 'CARDIOVASCULAR',
  application: 'Risk stratifies emergency department chest pain patients for 6-week risk of major adverse cardiac events (MACE).',
  applicableChiefComplaints: ['chest_pain', 'dyspnea', 'syncope'],
  keywords: ['HEART', 'chest pain', 'ACS', 'MACE', 'troponin', 'cardiac risk'],
  requiredTests: ['troponin', 'ecg'],
  components: [
    {
      id: 'history', label: 'History', type: 'select', source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'Slightly suspicious', value: 0 },
        { label: 'Moderately suspicious', value: 1 },
        { label: 'Highly suspicious', value: 2 },
      ],
    },
    {
      id: 'ecg', label: 'ECG', type: 'select', source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: 'Normal', value: 0 },
        { label: 'Non-specific repolarization abnormality', value: 1 },
        { label: 'Significant ST deviation', value: 2 },
      ],
    },
    {
      id: 'age', label: 'Age', type: 'select', source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '<45', value: 0 },
        { label: '45-64', value: 1 },
        { label: '>=65', value: 2 },
      ],
    },
    {
      id: 'risk_factors', label: 'Risk Factors', type: 'select', source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: 'No known risk factors', value: 0 },
        { label: '1-2 risk factors', value: 1 },
        { label: '>=3 risk factors or history of atherosclerotic disease', value: 2 },
      ],
    },
    {
      id: 'troponin', label: 'Troponin', type: 'select', source: 'section2',
      autoPopulateFrom: 'test_result',
      options: [
        { label: '<=normal limit', value: 0 },
        { label: '1-3x normal limit', value: 1 },
        { label: '>3x normal limit', value: 2 },
      ],
    },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 0, max: 3, risk: 'Low', interpretation: '1.7% risk of MACE at 6 weeks. Consider early discharge.' },
      { min: 4, max: 6, risk: 'Moderate', interpretation: '12-16.6% risk of MACE. Consider admission for observation.' },
      { min: 7, max: 10, risk: 'High', interpretation: '50-65% risk of MACE. Early invasive measures indicated.' },
    ],
  },
  suggestedTreatments: {
    High: ['aspirin_325', 'heparin_drip', 'cardiology_consult', 'admit_telemetry'],
    Moderate: ['aspirin_325', 'serial_troponins', 'observation', 'cardiology_consult'],
    Low: ['discharge_with_follow_up', 'outpatient_stress_test'],
  },
}
```

## Rules for Each CDR

1. **Replace the single `number_range` placeholder** with real clinical components
2. **Component types**:
   - `boolean` for yes/no criteria (set `value` to the point weight, e.g., `value: 3`)
   - `select` for multi-option scales (each option with `label` + `value`)
   - Keep `number_range` only if the component truly is a continuous numeric input (rare)
3. **Source accuracy**:
   - `section1` = available from history/physical exam (hx, vitals, exam findings)
   - `section2` = requires lab or imaging results
   - `user_input` = physician judgment/clinical gestalt
4. **Scoring methods**:
   - `sum`: Add up all component values, match to ranges
   - `threshold`: Count components with value > 0 (e.g., PERC: 0 = safe, >=1 = not safe)
   - `algorithm`: Step-based decision tree (PECARN, Canadian CT Head)
5. **Scoring ranges must be comprehensive**: Cover the full possible score range
6. **Keep existing fields**: id, name, fullName, category, application, applicableChiefComplaints, keywords — update only if inaccurate
7. **Add requiredTests if applicable**: Use test IDs from the test library
8. **Add suggestedTreatments if applicable**: Risk level → treatment array

## File Template

```typescript
import type { CdrSeed } from './types'

export const batch1CardioCdrs: CdrSeed[] = [
  // ... CDR definitions
]
```
