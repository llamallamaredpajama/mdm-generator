import type { CdrSeed } from './types'

/**
 * Batch 14 — Pediatric + Hematology CDRs
 *
 * Covers: PIBS, Tal Score, CDS (Pediatric), YOS, Bhutani Nomogram,
 *         Phoenix Sepsis, HEMORR₂HAGES, ISTH DIC, ANC Calculation, RPI
 *
 * Each CDR replaces the placeholder `number_range` component from seed-cdr-library.ts
 * with real clinical criteria drawn from published literature.
 *
 * Sources:
 *  - PIBS: Berger et al., Pediatrics 2016
 *  - Tal Score: Tal et al., J Pediatr 1983; McCallum et al., Pediatrics 2019 (modified)
 *  - CDS (Pediatric): Friedman et al., Pediatrics 2004; Goldman et al., Clin Pediatr 2008
 *  - YOS: McCarthy et al., Pediatrics 1982
 *  - Bhutani Nomogram: Bhutani et al., Pediatrics 1999; AAP Clinical Practice Guideline 2022
 *  - Phoenix Sepsis: Schlapbach et al., JAMA 2024
 *  - HEMORR₂HAGES: Gage et al., Am Heart J 2006
 *  - ISTH DIC: Taylor et al., Thromb Haemost 2001 (ISTH SSC criteria)
 *  - ANC Calculation: Dale et al., Blood 2000; NCCN Febrile Neutropenia Guidelines
 *  - RPI: Piva et al., Am J Clin Pathol 2015; Hoffbrand & Moss, Essential Haematology
 */

export const batch14PedsHemeCdrs: CdrSeed[] = [
  // ---------------------------------------------------------------------------
  // PIBS — Pittsburgh Infant Brain Injury Score
  // Sum-based: 5 criteria for evaluating abusive head trauma in infants <12mo
  // ---------------------------------------------------------------------------
  {
    id: 'pibs',
    name: 'PIBS',
    fullName: 'Pittsburgh Infant Brain Injury Score (PIBS)',
    category: 'PEDIATRIC',
    application:
      'Identifies infants (<12 months) at risk for abusive head trauma. Score ≥2 warrants neuroimaging and full abuse evaluation.',
    applicableChiefComplaints: [
      'infant_altered_mental_status',
      'child_abuse',
      'non_accidental_trauma',
      'seizure',
      'vomiting',
      'irritability',
    ],
    keywords: [
      'PIBS',
      'Pittsburgh infant brain injury',
      'abusive head trauma',
      'shaken baby',
      'child abuse',
      'infant',
      'non-accidental trauma',
      'AHT',
    ],
    requiredTests: ['hemoglobin', 'head circumference'],
    components: [
      {
        id: 'abnormal_dermatologic_exam',
        label: 'Abnormal dermatologic exam (bruising, especially in non-mobile infant)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'age_under_3_months',
        label: 'Age <3 months',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'head_circumference_above_90th',
        label: 'Head circumference >90th percentile or crossing percentiles',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hemoglobin_below_11',
        label: 'Hemoglobin <11.2 g/dL',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'abnormal_neuro_exam',
        label: 'Any abnormality on neurologic exam (altered consciousness, seizure, focal deficit)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'Low',
          interpretation:
            'Score 0–1: Lower risk for abusive head trauma; clinical judgment always applies. Consider mechanism and history consistency.',
        },
        {
          min: 2,
          max: 6,
          risk: 'High',
          interpretation:
            'Score ≥2: High risk for abusive head trauma; obtain neuroimaging (CT head) and full abuse evaluation including skeletal survey, ophthalmologic exam, and social work consult.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'ct_head',
        'skeletal_survey',
        'ophthalmologic_exam',
        'social_work_consult',
        'child_protective_services',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Tal Score — Bronchiolitis Severity
  // Sum-based: 4 components (RR, wheezing, retractions, O2 sat), each 0–3
  // ---------------------------------------------------------------------------
  {
    id: 'tal_score',
    name: 'Tal Score',
    fullName: 'Tal Score / Modified Tal Score',
    category: 'PEDIATRIC',
    application:
      'Severity scoring for bronchiolitis in infants. Score ≥9 indicates severe bronchiolitis.',
    applicableChiefComplaints: ['bronchiolitis', 'wheezing', 'respiratory_distress', 'infant_respiratory'],
    keywords: [
      'Tal score',
      'bronchiolitis',
      'RSV',
      'infant',
      'wheezing',
      'retractions',
      'respiratory rate',
      'SpO2',
    ],
    components: [
      {
        id: 'respiratory_rate',
        label: 'Respiratory Rate',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '<40 breaths/min', value: 0 },
          { label: '40–55 breaths/min', value: 1 },
          { label: '56–70 breaths/min', value: 2 },
          { label: '>70 breaths/min', value: 3 },
        ],
      },
      {
        id: 'wheezing',
        label: 'Wheezing',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'End-expiratory only (with stethoscope)', value: 1 },
          { label: 'Entire expiration (with stethoscope) or audible on expiration without stethoscope', value: 2 },
          { label: 'Audible inspiratory and expiratory wheezing without stethoscope, or diminished breath sounds', value: 3 },
        ],
      },
      {
        id: 'retractions',
        label: 'Retractions / Accessory Muscle Use',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'None', value: 0 },
          { label: 'Intercostal only', value: 1 },
          { label: 'Intercostal + subcostal (tracheosternal)', value: 2 },
          { label: 'Intercostal + subcostal + suprasternal (nasal flaring, head bobbing)', value: 3 },
        ],
      },
      {
        id: 'oxygen_saturation',
        label: 'Oxygen Saturation (SpO2)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '≥96%', value: 0 },
          { label: '93–95%', value: 1 },
          { label: '90–92%', value: 2 },
          { label: '<90%', value: 3 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          risk: 'Mild',
          interpretation:
            'Score ≤4: Mild bronchiolitis; supportive care (nasal suctioning, hydration); consider discharge with close follow-up.',
        },
        {
          min: 5,
          max: 8,
          risk: 'Moderate',
          interpretation:
            'Score 5–8: Moderate bronchiolitis; consider admission for observation, supplemental O2 if needed, hydration support.',
        },
        {
          min: 9,
          max: 12,
          risk: 'Severe',
          interpretation:
            'Score 9–12: Severe bronchiolitis; admission required; supplemental O2, continuous monitoring, consider HFNC or CPAP if worsening.',
        },
      ],
    },
    suggestedTreatments: {
      Mild: ['nasal_suctioning', 'oral_hydration', 'discharge_with_follow_up'],
      Moderate: ['supplemental_o2', 'iv_fluids', 'admission_observation'],
      Severe: ['supplemental_o2', 'hfnc', 'iv_fluids', 'continuous_monitoring', 'picu_consult'],
    },
  },

  // ---------------------------------------------------------------------------
  // CDS — Clinical Dehydration Scale (Pediatric)
  // Sum-based: 4 components (general appearance, eyes, mucous membranes, tears), each 0–2
  // ---------------------------------------------------------------------------
  {
    id: 'cds_pediatric',
    name: 'Clinical Dehydration Scale',
    fullName: 'CDS (Clinical Dehydration Scale)',
    category: 'PEDIATRIC',
    application:
      'Simpler pediatric dehydration assessment validated for children 1 month to 3 years with gastroenteritis. Score 5–8 indicates moderate/severe dehydration.',
    applicableChiefComplaints: ['dehydration', 'vomiting', 'diarrhea', 'gastroenteritis'],
    keywords: [
      'CDS',
      'clinical dehydration scale',
      'pediatric',
      'dehydration',
      'gastroenteritis',
      'vomiting',
      'mucous membranes',
      'tears',
    ],
    components: [
      {
        id: 'general_appearance',
        label: 'General Appearance',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Thirsty, restless, or lethargic but irritable when touched', value: 1 },
          { label: 'Drowsy, limp, cold, or sweaty; ± comatose', value: 2 },
        ],
      },
      {
        id: 'eyes',
        label: 'Eyes',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Normal', value: 0 },
          { label: 'Slightly sunken', value: 1 },
          { label: 'Very sunken', value: 2 },
        ],
      },
      {
        id: 'mucous_membranes',
        label: 'Mucous Membranes / Tongue',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Moist', value: 0 },
          { label: 'Sticky / pasty', value: 1 },
          { label: 'Dry', value: 2 },
        ],
      },
      {
        id: 'tears',
        label: 'Tears',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Tears present', value: 0 },
          { label: 'Decreased tears', value: 1 },
          { label: 'Absent tears', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'None',
          interpretation: 'Score 0: No dehydration (<3% fluid deficit); oral rehydration therapy.',
        },
        {
          min: 1,
          max: 4,
          risk: 'Mild',
          interpretation:
            'Score 1–4: Some dehydration (~3–6% fluid deficit); oral rehydration trial; if unsuccessful, consider IV/NG fluids.',
        },
        {
          min: 5,
          max: 8,
          risk: 'Severe',
          interpretation:
            'Score 5–8: Moderate/severe dehydration (~6–9%+ fluid deficit); IV fluid resuscitation (20 mL/kg NS bolus); reassess frequently.',
        },
      ],
    },
    suggestedTreatments: {
      None: ['oral_rehydration', 'discharge_with_follow_up'],
      Mild: ['oral_rehydration_trial', 'ondansetron', 'observation'],
      Severe: ['iv_ns_bolus_20ml_kg', 'electrolyte_panel', 'admission'],
    },
  },

  // ---------------------------------------------------------------------------
  // YOS — Yale Observation Scale
  // Sum-based: 6 components (quality of cry, reaction to parents, state variation,
  //            color, hydration, response to social overtures), each 1/3/5
  // ---------------------------------------------------------------------------
  {
    id: 'yos',
    name: 'Yale Observation Scale',
    fullName: 'Yale Observation Scale (YOS)',
    category: 'PEDIATRIC',
    application:
      'Assesses severity of illness in febrile children aged 3–36 months based on observation. Score ≥16 has ~92% sensitivity for serious bacterial illness.',
    applicableChiefComplaints: ['fever', 'infant_fever', 'irritability', 'ill_appearing_child'],
    keywords: [
      'Yale Observation Scale',
      'YOS',
      'febrile child',
      'observation',
      'serious bacterial illness',
      'pediatric',
      'ill-appearing',
      'toddler',
    ],
    components: [
      {
        id: 'quality_of_cry',
        label: 'Quality of Cry',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Strong cry with normal tone, OR content and not crying', value: 1 },
          { label: 'Whimper or sobbing', value: 3 },
          { label: 'Weak or moaning, OR high-pitched continuous cry', value: 5 },
        ],
      },
      {
        id: 'reaction_to_parents',
        label: 'Reaction to Parent Stimulation',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Cries briefly then stops, OR content and not crying', value: 1 },
          { label: 'Cries on and off', value: 3 },
          { label: 'Continual cry, OR hardly responds', value: 5 },
        ],
      },
      {
        id: 'state_variation',
        label: 'State Variation',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'If awake → stays awake; OR if asleep → wakes up quickly with stimulation', value: 1 },
          { label: 'Eyes close briefly → awakens; OR awakens with prolonged stimulation', value: 3 },
          { label: 'Falls asleep; OR will not arouse', value: 5 },
        ],
      },
      {
        id: 'color',
        label: 'Color',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Pink', value: 1 },
          { label: 'Pale extremities, OR acrocyanosis', value: 3 },
          { label: 'Pale, OR cyanotic, OR mottled, OR ashen', value: 5 },
        ],
      },
      {
        id: 'hydration',
        label: 'Hydration',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Skin and eyes normal, mucous membranes moist', value: 1 },
          { label: 'Skin and eyes normal, mouth slightly dry', value: 3 },
          { label: 'Skin doughy or tented; dry mucous membranes; and/or sunken eyes', value: 5 },
        ],
      },
      {
        id: 'response_to_social_overtures',
        label: 'Response to Social Overtures (smile, talk, reach)',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'Smiles, OR alerts (≤2 months)', value: 1 },
          { label: 'Brief smile, OR alerts briefly (≤2 months)', value: 3 },
          { label: 'No smile; face dull, expressionless; OR no alerting (≤2 months)', value: 5 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 6,
          max: 10,
          risk: 'Low',
          interpretation:
            'Score 6–10: Low risk of serious bacterial illness (<3%); routine well-appearing febrile child workup per age-based guidelines.',
        },
        {
          min: 11,
          max: 15,
          risk: 'Moderate',
          interpretation:
            'Score 11–15: Moderate risk; further evaluation recommended (UA, CBC, blood culture per clinical judgment).',
        },
        {
          min: 16,
          max: 30,
          risk: 'High',
          interpretation:
            'Score ≥16: High risk of serious bacterial illness (~92% sensitivity); full sepsis workup indicated (CBC, blood culture, UA, consider LP, CXR).',
        },
      ],
    },
    suggestedTreatments: {
      Low: ['observation', 'antipyretics', 'discharge_with_follow_up'],
      Moderate: ['blood_culture', 'ua', 'cbc', 'observation'],
      High: ['blood_culture', 'ua', 'cbc', 'lumbar_puncture', 'empiric_antibiotics', 'admission'],
    },
  },

  // ---------------------------------------------------------------------------
  // Bhutani Nomogram — Neonatal Jaundice Risk Stratification
  // Algorithm: TSB (mg/dL) vs postnatal age in hours → risk zone
  // ---------------------------------------------------------------------------
  {
    id: 'bhutani_nomogram',
    name: 'Bhutani Nomogram',
    fullName: 'Bhutani Nomogram (Neonatal Jaundice)',
    category: 'PEDIATRIC',
    application:
      'Risk-stratifies neonatal hyperbilirubinemia by plotting total serum bilirubin (TSB) against postnatal age in hours. Guides need for phototherapy.',
    applicableChiefComplaints: ['neonatal_jaundice', 'hyperbilirubinemia', 'jaundice', 'newborn_jaundice'],
    keywords: [
      'Bhutani',
      'neonatal jaundice',
      'hyperbilirubinemia',
      'bilirubin',
      'phototherapy',
      'newborn',
      'nomogram',
      'kernicterus',
      'AAP 2022',
    ],
    requiredTests: ['total serum bilirubin', 'postnatal age in hours'],
    components: [
      {
        id: 'total_serum_bilirubin',
        label: 'Total Serum Bilirubin (mg/dL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 30,
      },
      {
        id: 'postnatal_age_hours',
        label: 'Postnatal Age (hours)',
        type: 'number_range',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        min: 0,
        max: 144,
      },
      {
        id: 'gestational_age',
        label: 'Gestational Age',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: '≥38 weeks (low risk)', value: 0 },
          { label: '35–37 6/7 weeks (medium risk)', value: 1 },
          { label: '<35 weeks (higher risk)', value: 2 },
        ],
      },
      {
        id: 'neurotoxicity_risk_factors',
        label: 'Neurotoxicity risk factors (isoimmune hemolytic disease, G6PD deficiency, asphyxia, lethargy, temp instability, sepsis, albumin <3.0)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 0,
          risk: 'Low',
          interpretation:
            'Low-risk zone (<40th percentile for age in hours): ~0% risk of subsequent significant hyperbilirubinemia; routine follow-up per AAP guidelines.',
        },
        {
          min: 1,
          max: 1,
          risk: 'Low-Intermediate',
          interpretation:
            'Low-intermediate zone (40th–75th percentile): ~2.2% risk; follow-up within 48 hours; repeat TSB if clinically indicated.',
        },
        {
          min: 2,
          max: 2,
          risk: 'High-Intermediate',
          interpretation:
            'High-intermediate zone (75th–95th percentile): ~13% risk; follow-up within 24–48 hours; consider phototherapy if rising or risk factors present.',
        },
        {
          min: 3,
          max: 3,
          risk: 'High',
          interpretation:
            'High-risk zone (>95th percentile): ~40% risk; initiate phototherapy per AAP thresholds; close follow-up within 24 hours; consider exchange transfusion if approaching critical levels.',
        },
      ],
    },
    suggestedTreatments: {
      High: ['phototherapy', 'repeat_tsb_4_6h', 'consider_exchange_transfusion'],
      'High-Intermediate': ['phototherapy_if_rising', 'repeat_tsb_12_24h', 'follow_up_24_48h'],
      'Low-Intermediate': ['repeat_tsb_if_indicated', 'follow_up_48h'],
      Low: ['routine_follow_up'],
    },
  },

  // ---------------------------------------------------------------------------
  // Phoenix Sepsis Criteria (2024)
  // Sum-based: 4 organ systems (respiratory, cardiovascular, coagulation, neurologic)
  // Each 0–2+ points; sepsis = suspected infection + score ≥2 from ≥2 organ systems
  // ---------------------------------------------------------------------------
  {
    id: 'phoenix_sepsis',
    name: 'Phoenix Sepsis',
    fullName: 'Phoenix Sepsis Criteria (2024)',
    category: 'PEDIATRIC',
    application:
      'New international consensus criteria for pediatric sepsis, replacing previous SIRS-based definitions. Phoenix Sepsis = suspected infection + score ≥2 (≥1 point from ≥2 organ systems).',
    applicableChiefComplaints: ['sepsis', 'pediatric_sepsis', 'fever', 'altered_mental_status', 'shock'],
    keywords: [
      'Phoenix sepsis',
      'pediatric sepsis',
      '2024',
      'organ dysfunction',
      'Phoenix score',
      'septic shock',
      'JAMA 2024',
      'Schlapbach',
    ],
    requiredTests: ['PaO2', 'SpO2', 'FiO2', 'lactate', 'MAP', 'platelets', 'INR', 'D-dimer', 'GCS'],
    components: [
      // --- Respiratory (0–3 points) ---
      {
        id: 'respiratory',
        label: 'Respiratory Dysfunction',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No respiratory dysfunction', value: 0 },
          { label: 'PaO2/FiO2 ratio <400 OR SpO2/FiO2 ratio <292 (on any respiratory support)', value: 1 },
          { label: 'PaO2/FiO2 <200 OR SpO2/FiO2 <220 on invasive mechanical ventilation', value: 2 },
          { label: 'PaO2/FiO2 <100 OR SpO2/FiO2 <148 on invasive mechanical ventilation', value: 3 },
        ],
      },
      // --- Cardiovascular (0–6 points) ---
      {
        id: 'cardiovascular',
        label: 'Cardiovascular Dysfunction',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No cardiovascular dysfunction', value: 0 },
          { label: 'Lactate >5 mmol/L OR age-adjusted MAP below threshold (1 vasoactive)', value: 1 },
          { label: 'Lactate >11 mmol/L OR ≥2 vasoactives required', value: 2 },
        ],
      },
      // --- Coagulation (0–2 points) ---
      {
        id: 'coagulation',
        label: 'Coagulation Dysfunction',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No coagulation dysfunction', value: 0 },
          { label: 'Platelets <100 × 10⁹/L OR INR >1.3 OR D-dimer >2 mg/L FEU', value: 1 },
          { label: 'Platelets <100 AND (INR >1.3 OR D-dimer >2)', value: 2 },
        ],
      },
      // --- Neurologic (0–2 points) ---
      {
        id: 'neurologic',
        label: 'Neurologic Dysfunction',
        type: 'select',
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
        options: [
          { label: 'GCS ≥11 (no neurologic dysfunction)', value: 0 },
          { label: 'GCS ≤10 OR reactive pupillary dysfunction (bilateral fixed)', value: 1 },
          { label: 'GCS ≤10 AND bilateral fixed pupils', value: 2 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'Low',
          interpretation:
            'Phoenix Score <2: Does not meet Phoenix Sepsis criteria. If infection suspected, continue clinical monitoring and reassess.',
        },
        {
          min: 2,
          max: 4,
          risk: 'High',
          interpretation:
            'Phoenix Score ≥2 (with ≥1 point from ≥2 organ systems) + suspected infection = Phoenix Sepsis (~3.5% mortality). Initiate sepsis bundle: blood cultures, empiric antibiotics, fluid resuscitation.',
        },
        {
          min: 5,
          max: 9,
          risk: 'Very High',
          interpretation:
            'Phoenix Score ≥5: Severe organ dysfunction. If cardiovascular score ≥1 = Phoenix Septic Shock (~10–15% mortality). Aggressive resuscitation, vasoactives, ICU admission.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'blood_cultures',
        'empiric_broad_spectrum_antibiotics',
        'aggressive_fluid_resuscitation',
        'vasoactives',
        'picu_admission',
      ],
      High: [
        'blood_cultures',
        'empiric_broad_spectrum_antibiotics',
        'fluid_resuscitation',
        'picu_consult',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // HEMORR₂HAGES — Bleeding Risk Score
  // Sum-based: 12 binary criteria (Re-bleed risk counts double = 2 points)
  // ---------------------------------------------------------------------------
  {
    id: 'hemorr2hages',
    name: 'HEMORR₂HAGES',
    fullName: 'HEMORR₂HAGES Score',
    category: 'HEMATOLOGY / COAGULATION',
    application:
      'Predicts risk of major hemorrhage in elderly patients with atrial fibrillation on anticoagulation. Score ≥5 associated with 12.3% annual hemorrhage rate.',
    applicableChiefComplaints: ['atrial_fibrillation', 'anticoagulation', 'bleeding_risk', 'bleeding', 'fall'],
    keywords: [
      'HEMORR2HAGES',
      'hemorrhage',
      'bleeding risk',
      'atrial fibrillation',
      'anticoagulation',
      'warfarin',
      'elderly',
    ],
    components: [
      {
        id: 'hepatic_renal_disease',
        label: 'Hepatic or renal disease',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'ethanol_abuse',
        label: 'Ethanol (alcohol) abuse',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'malignancy',
        label: 'Malignancy (active cancer)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'older_75',
        label: 'Older age (>75 years)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'reduced_platelets',
        label: 'Reduced platelet count or function (including antiplatelet agents)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'rebleed_risk',
        label: 'Re-bleeding risk (prior major hemorrhage)',
        type: 'boolean',
        value: 2,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'hypertension_uncontrolled',
        label: 'Hypertension (uncontrolled, systolic >160 mmHg)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'anemia',
        label: 'Anemia (Hgb <10 g/dL or Hct <30%)',
        type: 'boolean',
        value: 1,
        source: 'section2',
        autoPopulateFrom: 'test_result',
      },
      {
        id: 'genetic_factors',
        label: 'Genetic factors (CYP2C9 polymorphisms affecting warfarin metabolism)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'excessive_fall_risk',
        label: 'Excessive fall risk (including neuropsychiatric conditions)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
      {
        id: 'stroke_history',
        label: 'Stroke history (prior ischemic stroke)',
        type: 'boolean',
        value: 1,
        source: 'section1',
        autoPopulateFrom: 'narrative_analysis',
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'Low',
          interpretation:
            'Score 0–1: Annual hemorrhage rate 1.9–2.5%; benefits of anticoagulation likely outweigh risks.',
        },
        {
          min: 2,
          max: 3,
          risk: 'Moderate',
          interpretation:
            'Score 2–3: Annual hemorrhage rate 5.3–8.4%; weigh risks and benefits carefully; consider DOAC over warfarin.',
        },
        {
          min: 4,
          max: 12,
          risk: 'High',
          interpretation:
            'Score ≥4: Annual hemorrhage rate ≥10.4%; high bleeding risk; reassess anticoagulation indication; consider shorter courses or alternatives.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // ISTH DIC Score
  // Sum-based: 4 lab components (platelet count, D-dimer, prolonged PT, fibrinogen)
  // ---------------------------------------------------------------------------
  {
    id: 'isth_dic',
    name: 'ISTH DIC Score',
    fullName: 'ISTH DIC Score',
    category: 'HEMATOLOGY / COAGULATION',
    application:
      'Diagnoses overt disseminated intravascular coagulation. Requires underlying condition known to be associated with DIC (sepsis, trauma, malignancy, obstetric complications).',
    applicableChiefComplaints: ['DIC', 'coagulopathy', 'sepsis', 'bleeding', 'thrombocytopenia'],
    keywords: [
      'ISTH',
      'DIC',
      'disseminated intravascular coagulation',
      'coagulopathy',
      'platelets',
      'D-dimer',
      'fibrinogen',
      'PT',
    ],
    requiredTests: ['platelet count', 'D-dimer', 'fibrin degradation products', 'PT', 'fibrinogen'],
    components: [
      {
        id: 'platelet_count',
        label: 'Platelet Count',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≥100 × 10⁹/L', value: 0 },
          { label: '50–99 × 10⁹/L', value: 1 },
          { label: '<50 × 10⁹/L', value: 2 },
        ],
      },
      {
        id: 'd_dimer',
        label: 'D-dimer / Fibrin Degradation Products (FDP)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: 'No increase (normal)', value: 0 },
          { label: 'Moderate increase (elevated but <5× ULN)', value: 2 },
          { label: 'Strong increase (≥5× ULN or markedly elevated)', value: 3 },
        ],
      },
      {
        id: 'prolonged_pt',
        label: 'Prolonged Prothrombin Time (PT)',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '<3 seconds above upper limit of normal', value: 0 },
          { label: '3–6 seconds above upper limit of normal', value: 1 },
          { label: '>6 seconds above upper limit of normal', value: 2 },
        ],
      },
      {
        id: 'fibrinogen',
        label: 'Fibrinogen Level',
        type: 'select',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        options: [
          { label: '≥100 mg/dL (≥1.0 g/L)', value: 0 },
          { label: '<100 mg/dL (<1.0 g/L)', value: 1 },
        ],
      },
    ],
    scoring: {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          risk: 'Low',
          interpretation:
            'Score <5: Not suggestive of overt DIC; repeat in 1–2 days if clinical suspicion remains. Monitor for evolving coagulopathy.',
        },
        {
          min: 5,
          max: 8,
          risk: 'High',
          interpretation:
            'Score ≥5: Compatible with overt DIC; treat underlying cause aggressively + supportive care (platelets if <20 or bleeding, FFP/cryoprecipitate if fibrinogen <100). Repeat score daily.',
        },
      ],
    },
    suggestedTreatments: {
      High: [
        'treat_underlying_cause',
        'platelet_transfusion_if_bleeding',
        'ffp_cryoprecipitate',
        'monitor_coags_q6_12h',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // ANC Calculation — Absolute Neutrophil Count
  // Algorithm: WBC × (%neutrophils + %bands) / 100
  // ---------------------------------------------------------------------------
  {
    id: 'anc_calculation',
    name: 'ANC Calculation',
    fullName: 'Absolute Neutrophil Count (ANC) Calculation',
    category: 'HEMATOLOGY / COAGULATION',
    application:
      'Determines severity of neutropenia to guide infection risk assessment and management. ANC <500 triggers febrile neutropenia protocol.',
    applicableChiefComplaints: ['fever', 'febrile_neutropenia', 'neutropenia', 'immunocompromised', 'cancer'],
    keywords: [
      'ANC',
      'absolute neutrophil count',
      'neutropenia',
      'febrile neutropenia',
      'infection risk',
      'neutrophils',
      'bands',
      'WBC',
    ],
    requiredTests: ['CBC with differential'],
    components: [
      {
        id: 'wbc',
        label: 'WBC (× 10³/µL)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 100,
      },
      {
        id: 'pct_neutrophils',
        label: '% Neutrophils (segs)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 100,
      },
      {
        id: 'pct_bands',
        label: '% Bands',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 100,
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 1500,
          max: 100000,
          risk: 'Normal',
          interpretation: 'ANC >1500/µL: Normal; baseline infection risk.',
        },
        {
          min: 1000,
          max: 1499,
          risk: 'Low',
          interpretation: 'ANC 1000–1500/µL: Mild neutropenia; slight increase in infection risk.',
        },
        {
          min: 500,
          max: 999,
          risk: 'Moderate',
          interpretation:
            'ANC 500–1000/µL: Moderate neutropenia; moderate infection risk; monitor closely.',
        },
        {
          min: 100,
          max: 499,
          risk: 'High',
          interpretation:
            'ANC 100–500/µL: Severe neutropenia; high risk — febrile neutropenia protocol: blood cultures + empiric antipseudomonal beta-lactam (e.g., cefepime, piperacillin-tazobactam).',
        },
        {
          min: 0,
          max: 99,
          risk: 'Very High',
          interpretation:
            'ANC <100/µL: Profound neutropenia; very high risk; empiric broad-spectrum antibiotics; consider empiric antifungal if fever persists >4–7 days.',
        },
      ],
    },
    suggestedTreatments: {
      'Very High': [
        'blood_cultures',
        'empiric_cefepime_or_pip_tazo',
        'consider_empiric_antifungal',
        'admission',
        'infectious_disease_consult',
      ],
      High: [
        'blood_cultures',
        'empiric_cefepime_or_pip_tazo',
        'admission',
      ],
      Moderate: ['close_monitoring', 'blood_cultures_if_febrile'],
    },
  },

  // ---------------------------------------------------------------------------
  // RPI — Reticulocyte Production Index
  // Algorithm: Reticulocyte% × (Patient Hct / Normal Hct) / Maturation factor
  // ---------------------------------------------------------------------------
  {
    id: 'rpi',
    name: 'Reticulocyte Production Index',
    fullName: 'Reticulocyte Production Index (RPI)',
    category: 'HEMATOLOGY / COAGULATION',
    application:
      'Corrects reticulocyte count for anemia severity and reticulocyte maturation time. Distinguishes hypoproliferative vs. hyperproliferative anemia.',
    applicableChiefComplaints: ['anemia', 'fatigue', 'weakness', 'pallor'],
    keywords: [
      'RPI',
      'reticulocyte production index',
      'anemia',
      'reticulocyte',
      'hemolysis',
      'bone marrow',
      'hypoproliferative',
      'hyperproliferative',
    ],
    requiredTests: ['CBC', 'reticulocyte count', 'hematocrit'],
    components: [
      {
        id: 'reticulocyte_pct',
        label: 'Reticulocyte Count (%)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 0,
        max: 30,
      },
      {
        id: 'patient_hct',
        label: 'Patient Hematocrit (%)',
        type: 'number_range',
        source: 'section2',
        autoPopulateFrom: 'test_result',
        min: 5,
        max: 65,
      },
      {
        id: 'normal_hct',
        label: 'Normal Hematocrit (% — typically 45 for males, 40 for females)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Male (normal Hct = 45%)', value: 45 },
          { label: 'Female (normal Hct = 40%)', value: 40 },
        ],
      },
      {
        id: 'maturation_factor',
        label: 'Maturation Factor (based on Hct)',
        type: 'select',
        source: 'user_input',
        options: [
          { label: 'Hct ≥35% → Factor 1.0', value: 1 },
          { label: 'Hct 25–34% → Factor 1.5', value: 2 },
          { label: 'Hct 15–24% → Factor 2.0', value: 3 },
          { label: 'Hct <15% → Factor 2.5', value: 4 },
        ],
      },
    ],
    scoring: {
      method: 'algorithm',
      ranges: [
        {
          min: 0,
          max: 1,
          risk: 'Hypoproliferative',
          interpretation:
            'RPI <2: Inadequate bone marrow response (hypoproliferative) — consider iron deficiency, B12/folate deficiency, anemia of chronic disease, myelodysplastic syndrome, or bone marrow failure. Order iron studies, B12, folate, reticulocyte count.',
        },
        {
          min: 2,
          max: 30,
          risk: 'Hyperproliferative',
          interpretation:
            'RPI ≥2: Appropriate bone marrow response (hyperproliferative) — consistent with hemolysis or acute blood loss. Order LDH, haptoglobin, indirect bilirubin, peripheral smear, direct Coombs test.',
        },
      ],
    },
    suggestedTreatments: {
      Hypoproliferative: [
        'iron_studies',
        'b12_folate_levels',
        'consider_bone_marrow_biopsy',
        'hematology_consult',
      ],
      Hyperproliferative: [
        'ldh_haptoglobin_indirect_bilirubin',
        'peripheral_smear',
        'direct_coombs',
        'type_and_screen',
        'transfuse_if_symptomatic',
      ],
    },
  },
]
