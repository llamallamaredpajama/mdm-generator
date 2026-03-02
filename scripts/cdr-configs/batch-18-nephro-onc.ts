import type { CdrSeed } from './types'

/**
 * Batch 18 — Nephrology/Electrolytes & Oncologic CDRs
 *
 * Covers: FEUrea, Osmolar Gap, Corrected Calcium, Winter's Formula, TTKG,
 *         Schwartz Equation, Cairo-Bishop TLS, PLASMIC Score, ECOG PS, Karnofsky PS
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published literature.
 *
 * Sources:
 *  - FEUrea: Carvounis et al., Am J Kidney Dis 2002
 *  - Osmolar Gap: Purssell et al., BMC Emerg Med 2001; Kraut & Kurtz, NEJM 2008
 *  - Corrected Calcium: Payne et al., Br Med J 1973 (standard albumin correction)
 *  - Winter's Formula: Albert et al., Ann Intern Med 1967
 *  - TTKG: Ethier et al., Am J Kidney Dis 1990; West et al., Am J Kidney Dis 1986
 *  - Schwartz Equation: Schwartz et al., Pediatrics 2009 (bedside CKiD formula)
 *  - Cairo-Bishop TLS: Cairo & Bishop, Br J Haematol 2004
 *  - PLASMIC Score: Bendapudi et al., Lancet Haematol 2017
 *  - ECOG Performance Status: Oken et al., Am J Clin Oncol 1982
 *  - Karnofsky PS: Karnofsky & Burchenal, 1949; Mor et al., Cancer 1984
 */

export const batch18NephroOncCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // FEUrea — Fractional Excretion of Urea
  // Algorithm: FEUrea = (Urine Urea × Serum Cr) / (Serum Urea × Urine Cr) × 100
  // Preferred over FENa in patients on diuretics
  // ---------------------------------------------------------------------------
  {
    id: 'feurea',
    name: 'FEUrea',
    fullName: 'Fractional Excretion of Urea (FEUrea)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Alternative to FENa when the patient is on diuretics. Urea handling is less affected by diuretics than sodium, making this the preferred test in diuretic-treated patients.',
    applicableChiefComplaints: ['acute_kidney_injury', 'oliguria', 'elevated_creatinine'],
    keywords: [
      'FEUrea',
      'fractional excretion of urea',
      'prerenal',
      'ATN',
      'diuretics',
      'AKI differentiation',
    ],
    requiredTests: ['urine urea', 'plasma urea', 'urine creatinine', 'serum creatinine'],
    components: [
      {
        id: 'urine_urea',
        label: 'Urine Urea (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 3000,
      },
      {
        id: 'serum_urea',
        label: 'Serum Urea / BUN (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 1,
        max: 200,
      },
      {
        id: 'urine_creatinine',
        label: 'Urine Creatinine (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 500,
      },
      {
        id: 'serum_creatinine',
        label: 'Serum Creatinine (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0.1,
        max: 30,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 35,
          risk: 'Prerenal',
          interpretation:
            'FEUrea <35%: Prerenal azotemia; tubular urea reabsorption preserved despite diuretic use.',
        },
        {
          min: 35,
          max: 50,
          risk: 'Indeterminate',
          interpretation:
            'FEUrea 35-50%: Indeterminate zone; clinical correlation required. Consider repeat testing or additional workup.',
        },
        {
          min: 50,
          max: 100,
          risk: 'Intrinsic Renal',
          interpretation:
            'FEUrea >50%: Intrinsic renal disease (ATN or other parenchymal injury); impaired tubular urea reabsorption.',
        },
      ],
    },
    suggestedTreatments: {
      Prerenal: ['iv_fluid_resuscitation', 'discontinue_nephrotoxins', 'optimize_hemodynamics'],
      'Intrinsic Renal': [
        'nephrology_consult',
        'discontinue_nephrotoxins',
        'renal_supportive_care',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Osmolar Gap
  // Algorithm: Osmolar Gap = Measured Osm - Calculated Osm
  // Calculated Osm = 2×Na + Glucose/18 + BUN/2.8 + EtOH/4.6
  // ---------------------------------------------------------------------------
  {
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
  },

  // ---------------------------------------------------------------------------
  // Corrected Calcium
  // Algorithm: Corrected Ca = Measured Ca + 0.8 × (4.0 - Albumin)
  // ---------------------------------------------------------------------------
  {
    id: 'calcium_correction',
    name: 'Calcium Correction',
    fullName: 'Calcium Correction for Albumin',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Corrects total serum calcium for hypoalbuminemia, since approximately 40% of calcium is protein-bound. Each 1 g/dL decrease in albumin below 4.0 causes total calcium to appear ~0.8 mg/dL lower than the true value.',
    applicableChiefComplaints: ['hypocalcemia', 'hypercalcemia', 'electrolyte_abnormality'],
    keywords: [
      'calcium correction',
      'corrected calcium',
      'albumin',
      'hypocalcemia',
      'hypercalcemia',
      'ionized calcium',
      'protein-bound calcium',
    ],
    requiredTests: ['serum calcium', 'serum albumin'],
    components: [
      {
        id: 'measured_calcium',
        label: 'Measured Total Calcium (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 2,
        max: 20,
      },
      {
        id: 'serum_albumin',
        label: 'Serum Albumin (g/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0.5,
        max: 6,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 8.4,
          risk: 'Hypocalcemia',
          interpretation:
            'Corrected calcium <8.5 mg/dL: True hypocalcemia. Evaluate for: hypoparathyroidism, vitamin D deficiency, magnesium depletion, pancreatitis, tumor lysis. Treat symptomatic patients with IV calcium gluconate.',
        },
        {
          min: 8.5,
          max: 10.5,
          risk: 'Normal',
          interpretation:
            'Corrected calcium 8.5-10.5 mg/dL: Normal range. No calcium-specific intervention needed.',
        },
        {
          min: 10.6,
          max: 20,
          risk: 'Hypercalcemia',
          interpretation:
            'Corrected calcium >10.5 mg/dL: True hypercalcemia. Evaluate for: malignancy, primary hyperparathyroidism, granulomatous disease, medication effect (thiazides, lithium). >14 mg/dL is a medical emergency.',
        },
      ],
    },
    suggestedTreatments: {
      Hypocalcemia: ['iv_calcium_gluconate', 'magnesium_repletion', 'vitamin_d_supplementation'],
      Hypercalcemia: [
        'iv_normal_saline',
        'calcitonin',
        'zoledronic_acid',
        'treat_underlying_cause',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Winter's Formula
  // Algorithm: Expected pCO2 = 1.5 × HCO3 + 8 (± 2)
  // Compares measured pCO2 to expected to detect mixed acid-base disorders
  // ---------------------------------------------------------------------------
  {
    id: 'winters_formula',
    name: "Winter's Formula",
    fullName: "Winter's Formula",
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      "Predicts expected PaCO2 compensation for metabolic acidosis to identify concurrent respiratory acid-base disorders. Formula: Expected PaCO2 = (1.5 \u00d7 HCO3\u207b) + 8 \u00b1 2.",
    applicableChiefComplaints: ['metabolic_acidosis', 'respiratory_failure', 'acid_base_disorder'],
    keywords: [
      "Winter's formula",
      'metabolic acidosis',
      'respiratory compensation',
      'PaCO2',
      'acid-base',
      'bicarbonate',
      'mixed disorder',
    ],
    requiredTests: ['ABG', 'serum bicarbonate'],
    components: [
      {
        id: 'serum_bicarb',
        label: 'Serum Bicarbonate / HCO3 (mEq/L)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 1,
        max: 45,
      },
      {
        id: 'measured_paco2',
        label: 'Measured PaCO2 (mmHg)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 5,
        max: 120,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Appropriate Compensation',
          interpretation:
            'Measured PaCO2 within expected range (1.5 x HCO3 + 8 +/- 2): Appropriate respiratory compensation for simple metabolic acidosis.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Concurrent Respiratory Acidosis',
          interpretation:
            'Measured PaCO2 ABOVE expected range: Concurrent respiratory acidosis (inadequate compensation). Evaluate for respiratory failure, airway compromise, sedation.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Concurrent Respiratory Alkalosis',
          interpretation:
            'Measured PaCO2 BELOW expected range: Concurrent respiratory alkalosis (hyperventilation beyond compensation). Evaluate for pain, anxiety, sepsis, salicylate toxicity, hepatic encephalopathy.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // TTKG — Transtubular Potassium Gradient
  // Algorithm: TTKG = (Urine K / Serum K) x (Serum Osm / Urine Osm)
  // Valid only if Urine Osm > Serum Osm and Urine Na >25 mEq/L
  // ---------------------------------------------------------------------------
  {
    id: 'ttkg',
    name: 'TTKG',
    fullName: 'Transtubular Potassium Gradient (TTKG)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Assesses renal potassium handling to distinguish renal from extrarenal causes of hyperkalemia or hypokalemia. Requires urine osmolality > plasma osmolality and urine Na+ >25 mEq/L.',
    applicableChiefComplaints: ['hyperkalemia', 'hypokalemia', 'electrolyte_abnormality'],
    keywords: [
      'TTKG',
      'transtubular potassium gradient',
      'hyperkalemia',
      'hypokalemia',
      'aldosterone',
      'renal potassium wasting',
    ],
    requiredTests: [
      'urine potassium',
      'serum potassium',
      'urine osmolality',
      'plasma osmolality',
      'urine sodium',
    ],
    components: [
      {
        id: 'urine_potassium',
        label: 'Urine Potassium (mEq/L)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 200,
      },
      {
        id: 'serum_potassium',
        label: 'Serum Potassium (mEq/L)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 1,
        max: 10,
      },
      {
        id: 'serum_osmolality',
        label: 'Serum Osmolality (mOsm/kg)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 200,
        max: 400,
      },
      {
        id: 'urine_osmolality',
        label: 'Urine Osmolality (mOsm/kg)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 50,
        max: 1400,
      },
      {
        id: 'urine_sodium',
        label: 'Urine Sodium (mEq/L) (must be >25 for TTKG validity)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 300,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 2,
          risk: 'Appropriate Conservation',
          interpretation:
            'TTKG <2 in hypokalemia: Appropriate renal K+ conservation; cause is extrarenal (GI losses, transcellular shift, inadequate intake).',
        },
        {
          min: 3,
          max: 5,
          risk: 'Renal Wasting (Hypokalemia)',
          interpretation:
            'TTKG >3 in hypokalemia: Renal potassium wasting; consider hyperaldosteronism, diuretics, renal tubular acidosis, Bartter/Gitelman syndrome.',
        },
        {
          min: 6,
          max: 7,
          risk: 'Indeterminate (Hyperkalemia)',
          interpretation:
            'TTKG 6-7 in hyperkalemia: Borderline aldosterone effect; clinical correlation needed. May indicate early aldosterone deficiency or resistance.',
        },
        {
          min: 8,
          max: 20,
          risk: 'Appropriate Excretion (Hyperkalemia)',
          interpretation:
            'TTKG >8 in hyperkalemia: Appropriate renal K+ excretion; cause is extrarenal (cellular shift, tissue breakdown, exogenous load).',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Schwartz Equation — Pediatric GFR
  // Algorithm: eGFR = k x Height(cm) / Serum Creatinine(mg/dL)
  // Bedside CKiD (2009): k = 0.413 (enzymatic Cr assay)
  // Classic: k = 0.55 (children), 0.70 (adolescent males)
  // ---------------------------------------------------------------------------
  {
    id: 'schwartz_equation',
    name: 'Schwartz Equation',
    fullName: 'Schwartz Equation (Pediatric GFR)',
    category: 'NEPHROLOGY & ELECTROLYTES',
    application:
      'Estimates GFR in children using serum creatinine and height. Use the 2009 bedside formula (0.413 constant) with enzymatic creatinine assays.',
    applicableChiefComplaints: [
      'pediatric_renal_failure',
      'pediatric_chronic_kidney_disease',
      'elevated_creatinine',
    ],
    keywords: [
      'Schwartz',
      'pediatric GFR',
      'eGFR children',
      'creatinine clearance pediatric',
      'renal function pediatrics',
    ],
    requiredTests: ['serum creatinine', 'height'],
    components: [
      {
        id: 'height_cm',
        label: 'Height (cm)',
        type: 'number_range',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        min: 30,
        max: 200,
      },
      {
        id: 'serum_creatinine',
        label: 'Serum Creatinine (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0.1,
        max: 15,
      },
      {
        id: 'k_constant',
        label: 'k Constant (formula version)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Bedside CKiD 2009 (k=0.413, enzymatic Cr)', value: 0 },
          { label: 'Classic - children/adolescent females (k=0.55, Jaffe Cr)', value: 1 },
          { label: 'Classic - adolescent males (k=0.70, Jaffe Cr)', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 14,
          risk: 'Kidney Failure',
          interpretation:
            'eGFR <15 mL/min/1.73m2: Stage 5 CKD / Kidney failure; pediatric nephrology consult for dialysis evaluation.',
        },
        {
          min: 15,
          max: 29,
          risk: 'Severely Decreased',
          interpretation:
            'eGFR 15-29 mL/min/1.73m2: Stage 4 CKD; severely decreased renal function. Urgent nephrology referral.',
        },
        {
          min: 30,
          max: 59,
          risk: 'Moderately Decreased',
          interpretation:
            'eGFR 30-59 mL/min/1.73m2: Stage 3 CKD; moderately decreased renal function. Dose-adjust renally cleared medications.',
        },
        {
          min: 60,
          max: 89,
          risk: 'Mildly Decreased',
          interpretation:
            'eGFR 60-89 mL/min/1.73m2: Stage 2 CKD; mildly decreased. Monitor for progression, manage risk factors.',
        },
        {
          min: 90,
          max: 300,
          risk: 'Normal',
          interpretation:
            'eGFR >=90 mL/min/1.73m2: Normal or high GFR for age. Stage 1 if other markers of kidney damage are present.',
        },
      ],
    },
  },

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

  // ---------------------------------------------------------------------------
  // PLASMIC Score for TTP
  // Sum: 7 binary criteria; predicts severe ADAMTS13 deficiency
  // ---------------------------------------------------------------------------
  {
    id: 'plasmic_score',
    name: 'PLASMIC Score',
    fullName: 'PLASMIC Score (for TTP)',
    category: 'ONCOLOGIC EMERGENCY',
    application:
      'Predicts likelihood of ADAMTS13 severe deficiency (thrombotic thrombocytopenic purpura) to guide empiric plasma exchange before ADAMTS13 results return.',
    applicableChiefComplaints: [
      'thrombocytopenia',
      'microangiopathic_hemolytic_anemia',
      'ttp',
      'tma',
    ],
    keywords: [
      'PLASMIC',
      'TTP',
      'thrombotic thrombocytopenic purpura',
      'ADAMTS13',
      'plasma exchange',
      'TMA',
      'thrombotic microangiopathy',
      'MAHA',
    ],
    requiredTests: [
      'platelet count',
      'reticulocyte count',
      'haptoglobin',
      'bilirubin',
      'MCV',
      'INR',
      'creatinine',
    ],
    components: [
      {
        id: 'platelet_low',
        label: 'Platelet count <30,000/uL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'hemolysis_variable',
        label: 'Combined hemolysis variable (reticulocyte count >2.5%, undetectable haptoglobin, OR indirect bilirubin >2.0 mg/dL)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'no_active_cancer',
        label: 'No active cancer (no malignancy treated or diagnosed in past year)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'no_solid_organ_transplant',
        label: 'No history of solid-organ or stem-cell transplant',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'mcv_low',
        label: 'MCV <90 fL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'inr_low',
        label: 'INR <1.5',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'creatinine_low',
        label: 'Creatinine <2.0 mg/dL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          risk: 'Low Risk',
          interpretation:
            'PLASMIC 0-4: ADAMTS13 severely deficient in 0-4%. TTP unlikely; consider alternative diagnoses (HUS, DIC, HELLP, malignant HTN).',
        },
        {
          min: 5,
          max: 5,
          risk: 'Intermediate Risk',
          interpretation:
            'PLASMIC 5: ADAMTS13 severely deficient in ~24%. Close monitoring; send ADAMTS13 activity level; consider hematology consult.',
        },
        {
          min: 6,
          max: 7,
          risk: 'High Risk',
          interpretation:
            'PLASMIC 6-7: ADAMTS13 severely deficient in 62-82%. Strongly consider initiating empiric plasma exchange (TPE) before ADAMTS13 results return.',
        },
      ],
    },
    suggestedTreatments: {
      'High Risk': [
        'emergent_plasma_exchange',
        'hematology_consult',
        'steroids',
        'avoid_platelet_transfusion',
        'send_adamts13',
      ],
      'Intermediate Risk': [
        'hematology_consult',
        'send_adamts13',
        'close_monitoring',
        'prepare_for_possible_tpe',
      ],
      'Low Risk': ['evaluate_alternative_diagnoses', 'send_adamts13', 'supportive_care'],
    },
  },

  // ---------------------------------------------------------------------------
  // ECOG Performance Status
  // Select: single 0–5 ordinal scale
  // ---------------------------------------------------------------------------
  {
    id: 'ecog_performance',
    name: 'ECOG Performance Status',
    fullName: 'ECOG Performance Status',
    category: 'ONCOLOGIC EMERGENCY',
    application:
      'Standardized assessment of cancer patient functional status used for treatment decisions and clinical trial eligibility. Correlates with survival across most cancer types.',
    applicableChiefComplaints: [
      'oncologic_emergency',
      'cancer_related_weakness',
      'functional_decline',
    ],
    keywords: [
      'ECOG',
      'performance status',
      'functional status',
      'cancer',
      'oncology',
      'clinical trial eligibility',
      'Eastern Cooperative Oncology Group',
    ],
    components: [
      {
        id: 'ecog_grade',
        label: 'ECOG Performance Status Grade',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          {
            label: '0 - Fully active, able to carry on all pre-disease performance without restriction',
            value: 0,
          },
          {
            label: '1 - Restricted in physically strenuous activity but ambulatory and able to carry out work of a light or sedentary nature',
            value: 1,
          },
          {
            label: '2 - Ambulatory and capable of all self-care but unable to carry out any work activities; up and about >50% of waking hours',
            value: 2,
          },
          {
            label: '3 - Capable of only limited self-care; confined to bed or chair >50% of waking hours',
            value: 3,
          },
          {
            label: '4 - Completely disabled; cannot carry on any self-care; totally confined to bed or chair',
            value: 4,
          },
          { label: '5 - Dead', value: 5 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'Good',
          interpretation:
            'ECOG 0-1: Good functional status. Generally eligible for aggressive chemotherapy regimens and clinical trials.',
        },
        {
          min: 2,
          max: 2,
          risk: 'Moderate',
          interpretation:
            'ECOG 2: Moderate functional limitation. May still benefit from treatment; case-by-case decision with oncology. Some clinical trials accept ECOG 0-2.',
        },
        {
          min: 3,
          max: 4,
          risk: 'Poor',
          interpretation:
            'ECOG 3-4: Poor functional status. Limited benefit from most cytotoxic therapies; consider palliative/supportive care focus. Discuss goals of care.',
        },
        {
          min: 5,
          max: 5,
          risk: 'Deceased',
          interpretation: 'ECOG 5: Dead.',
        },
      ],
    },
    suggestedTreatments: {
      Poor: ['palliative_care_consult', 'goals_of_care_discussion', 'symptom_management'],
      Moderate: ['oncology_consult', 'case_by_case_treatment_decision'],
      Good: ['standard_oncologic_therapy', 'clinical_trial_eligibility'],
    },
  },

  // ---------------------------------------------------------------------------
  // Karnofsky Performance Status (KPS)
  // Select: single 0–100 scale in 10-point increments
  // ---------------------------------------------------------------------------
  {
    id: 'karnofsky_ps',
    name: 'Karnofsky Performance Status',
    fullName: 'Karnofsky Performance Status (KPS)',
    category: 'ONCOLOGIC EMERGENCY',
    application:
      'Numeric rating of functional status on 0-100 scale. More granular than ECOG. Widely used in neuro-oncology and palliative care.',
    applicableChiefComplaints: [
      'oncologic_emergency',
      'cancer_related_weakness',
      'functional_decline',
      'palliative_care',
    ],
    keywords: [
      'KPS',
      'Karnofsky',
      'performance status',
      'cancer',
      'functional status',
      'neuro-oncology',
      'palliative',
    ],
    components: [
      {
        id: 'kps_score',
        label: 'Karnofsky Performance Status Score',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '100 - Normal; no complaints; no evidence of disease', value: 100 },
          { label: '90 - Able to carry on normal activity; minor signs or symptoms of disease', value: 90 },
          { label: '80 - Normal activity with effort; some signs or symptoms of disease', value: 80 },
          { label: '70 - Cares for self but unable to carry on normal activity or active work', value: 70 },
          { label: '60 - Requires occasional assistance but able to care for most personal needs', value: 60 },
          { label: '50 - Requires considerable assistance and frequent medical care', value: 50 },
          { label: '40 - Disabled; requires special care and assistance', value: 40 },
          { label: '30 - Severely disabled; hospitalization indicated though death not imminent', value: 30 },
          { label: '20 - Very sick; hospitalization and active supportive care necessary', value: 20 },
          { label: '10 - Moribund; fatal processes progressing rapidly', value: 10 },
          { label: '0 - Dead', value: 0 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Deceased',
          interpretation: 'KPS 0: Dead.',
        },
        {
          min: 10,
          max: 40,
          risk: 'Significant Disability',
          interpretation:
            'KPS 10-40: Unable to care for self; requires institutional or equivalent care. Consider hospice referral (KPS <=40 median survival ~1-3 months). Palliative focus.',
        },
        {
          min: 50,
          max: 60,
          risk: 'Moderate Disability',
          interpretation:
            'KPS 50-60: Requires varying amounts of assistance. Carefully weigh treatment benefit vs. burden with oncology. Some therapies may still improve quality of life.',
        },
        {
          min: 70,
          max: 100,
          risk: 'Independent',
          interpretation:
            'KPS 70-100: Able to live at home and care for most personal needs with varying degrees of assistance. Generally eligible for active cancer treatment.',
        },
      ],
    },
    suggestedTreatments: {
      'Significant Disability': [
        'palliative_care_consult',
        'hospice_evaluation',
        'goals_of_care_discussion',
        'symptom_management',
      ],
      'Moderate Disability': [
        'oncology_consult',
        'palliative_care_consult',
        'case_by_case_treatment_decision',
      ],
      Independent: ['standard_oncologic_therapy', 'continue_current_regimen'],
    },
  },
]
