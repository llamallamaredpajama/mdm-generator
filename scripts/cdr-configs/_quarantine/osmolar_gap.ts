import type { CdrSeed } from '../types'

// QUARANTINE REASON: Pure lab calculation — Osmolar Gap = Measured Osm - (2×Na + Glucose/18 + BUN/2.8 + EtOH/4.6).
// All 5 components are section2 number_range (lab values). No published clinical
// scoring criteria for interactive components. Source: Purssell et al., BMC Emerg Med 2001.

export const osmolar_gap: CdrSeed = {
  id: 'osmolar_gap',
  name: 'Osmolar Gap',
  fullName: 'Osmolar Gap',
  category: 'NEPHROLOGY & ELECTROLYTES',
  application:
    'Detects unmeasured osmotically active substances, particularly toxic alcohols (methanol, ethylene glycol, isopropanol). A normal osmolar gap does NOT exclude toxic alcohol ingestion if metabolites have already formed.',
  applicableChiefComplaints: [
    'toxic_ingestion',
    'altered_mental_status',
    'methanol_ingestion',
    'ethylene_glycol_ingestion',
    'metabolic_acidosis',
  ],
  keywords: [
    'osmolar gap',
    'osmol gap',
    'toxic alcohol',
    'methanol',
    'ethylene glycol',
    'isopropanol',
    'calculated osmolality',
    'measured osmolality',
  ],
  requiredTests: ['serum osmolality (measured)', 'serum sodium', 'glucose', 'BUN', 'ethanol level'],
  components: [
    {
      id: 'measured_osm',
      label: 'Measured Serum Osmolality (mOsm/kg)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 200,
      max: 500,
    },
    {
      id: 'serum_sodium',
      label: 'Serum Sodium (mEq/L)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 100,
      max: 180,
    },
    {
      id: 'glucose',
      label: 'Serum Glucose (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 2000,
    },
    {
      id: 'bun',
      label: 'BUN (mg/dL)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 200,
    },
    {
      id: 'ethanol_level',
      label: 'Ethanol Level (mg/dL) (enter 0 if not obtained)',
      type: 'number_range',
      source: 'section2',
      autoPopulateFrom: 'test_result',
      min: 0,
      max: 700,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: -10,
        max: 10,
        risk: 'Normal',
        interpretation:
          'Osmolar gap <10 mOsm/kg: Normal. Does NOT exclude toxic alcohol ingestion (parent compound may have already been metabolized to organic acids).',
      },
      {
        min: 11,
        max: 25,
        risk: 'Elevated',
        interpretation:
          'Osmolar gap >10 mOsm/kg: Suggests unmeasured osmoles; consider toxic alcohol ingestion, propylene glycol, mannitol, or contrast dye.',
      },
      {
        min: 26,
        max: 200,
        risk: 'Highly Elevated',
        interpretation:
          'Osmolar gap >25 mOsm/kg: Highly suggestive of significant toxic alcohol ingestion; initiate empiric fomepizole and contact poison control.',
      },
    ],
  },
  suggestedTreatments: {
    'Highly Elevated': [
      'fomepizole',
      'poison_control_consult',
      'nephrology_consult',
      'consider_hemodialysis',
    ],
    Elevated: ['fomepizole', 'poison_control_consult', 'serial_monitoring'],
  },
}
