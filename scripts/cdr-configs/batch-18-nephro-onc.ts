import type { CdrSeed } from './types'

/**
 * Batch 18 — Nephrology/Electrolytes & Oncologic CDRs
 *
 * Covers: Cairo-Bishop TLS
 *
 * Quarantined (pure lab formulas — no published clinical scoring criteria):
 *   FEUrea, Osmolar Gap, Corrected Calcium, Winter's Formula, TTKG, Schwartz Equation
 * Quarantined (insufficient section1/user_input components in published source):
 *   PLASMIC Score (only 2 of 7 criteria are clinical history)
 * Quarantined (single-dimension classification scales):
 *   ECOG Performance Status, Karnofsky PS
 *
 * Sources:
 *  - Cairo-Bishop TLS: Cairo & Bishop, Br J Haematol 2004
 */

export const batch18NephroOncCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // Cairo-Bishop TLS Criteria
  // Threshold: Lab TLS = >=2 of 4 metabolic abnormalities within 3d pre / 7d post
  //   chemo. Clinical TLS = Lab TLS + organ dysfunction.
  // ---------------------------------------------------------------------------
  {
    id: 'cairo_bishop_tls',
    name: 'Cairo-Bishop TLS',
    fullName: 'Cairo-Bishop Criteria \u2014 Tumor Lysis Syndrome (TLS)',
    category: 'ONCOLOGIC EMERGENCY',
    application:
      'Defines laboratory and clinical TLS to guide prophylaxis and treatment intensity. Laboratory TLS requires >=2 metabolic abnormalities within 3 days before or 7 days after cytotoxic therapy.',
    applicableChiefComplaints: [
      'tumor_lysis_syndrome',
      'oncologic_emergency',
      'hyperkalemia',
      'hyperuricemia',
      'renal_failure',
    ],
    keywords: [
      'Cairo-Bishop',
      'tumor lysis syndrome',
      'TLS',
      'hyperuricemia',
      'hyperkalemia',
      'hyperphosphatemia',
      'hypocalcemia',
      'rasburicase',
      'allopurinol',
    ],
    requiredTests: ['uric acid', 'potassium', 'phosphorus', 'calcium', 'creatinine', 'LDH'],
    components: [
      {
        id: 'uric_acid_elevated',
        label: 'Uric acid >=8 mg/dL or 25% increase from baseline',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'potassium_elevated',
        label: 'Potassium >=6.0 mEq/L or 25% increase from baseline',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'phosphorus_elevated',
        label: 'Phosphorus >=4.5 mg/dL (adults) or >=6.5 mg/dL (children), or 25% increase from baseline',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'calcium_decreased',
        label: 'Corrected calcium <=7.0 mg/dL or 25% decrease from baseline',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'creatinine_elevated',
        label: 'Creatinine >=1.5x upper limit of normal (clinical TLS criterion)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'cytotoxic_therapy_timing',
        label:
          'Cytotoxic therapy initiated or administered within surveillance window (3 days before to 7 days after onset of lab abnormalities)',
        type: 'boolean',
        value: 0,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'cardiac_arrhythmia',
        label: 'Cardiac arrhythmia or sudden death (clinical TLS criterion)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'seizure',
        label: 'Seizure (clinical TLS criterion)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'threshold',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'No Lab TLS',
          interpretation:
            'Fewer than 2 metabolic criteria met: Does not meet laboratory TLS definition. Continue prophylaxis and monitoring per risk stratification.',
        },
        {
          min: 2,
          max: 4,
          risk: 'Laboratory TLS',
          interpretation:
            '>=2 of 4 metabolic criteria (uric acid, K+, PO4, Ca2+) met: Laboratory TLS diagnosed. Aggressive hydration, rasburicase (or allopurinol), frequent lab monitoring. Assess for clinical TLS.',
        },
        {
          min: 5,
          max: 7,
          risk: 'Clinical TLS',
          interpretation:
            'Laboratory TLS + organ dysfunction (renal injury, arrhythmia, or seizure): Clinical TLS. ICU-level monitoring, aggressive rasburicase, consider emergent hemodialysis. Mortality risk significantly elevated.',
        },
      ],
    },
    suggestedTreatments: {
      'Clinical TLS': [
        'icu_admission',
        'rasburicase',
        'aggressive_iv_hydration',
        'consider_hemodialysis',
        'cardiac_monitoring',
        'nephrology_consult',
      ],
      'Laboratory TLS': [
        'aggressive_iv_hydration',
        'rasburicase_or_allopurinol',
        'frequent_lab_monitoring_q4_6h',
        'nephrology_consult',
      ],
      'No Lab TLS': ['prophylactic_allopurinol', 'iv_hydration', 'lab_monitoring_q8_12h'],
    },
  },
]
