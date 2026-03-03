import type { CdrSeed } from '../types'

/**
 * QUARANTINED: Lund-Browder Chart
 *
 * Reason: Only 1 user-answerable component (patient_age_group select).
 * The remaining 17 components are number_range body region percentages
 * (0-19%, 0-13%, etc.) representing continuous burn TBSA values.
 * These cannot be meaningfully converted to boolean/select without
 * losing clinical precision — the Lund-Browder chart is specifically
 * designed to capture exact burn percentages by body region.
 *
 * Source: Lund CC, Browder NC, Surg Gynecol Obstet 1944;79:352-358
 */
export const lund_browder: CdrSeed = {
  id: 'lund_browder',
  name: 'Lund-Browder',
  fullName: 'Lund-Browder Chart',
  category: 'BURNS & WOUND MANAGEMENT',
  application:
    'Most accurate method for TBSA burn estimation, accounting for age-related body proportion changes. Especially important in pediatrics where head and lower extremity proportions differ from adults.',
  applicableChiefComplaints: ['burns', 'burn_injury', 'pediatric_burns', 'thermal_injury'],
  keywords: [
    'Lund-Browder',
    'TBSA',
    'burn estimation',
    'pediatric burns',
    'total body surface area',
    'age-adjusted',
  ],
  components: [
    {
      id: 'patient_age_group',
      label: 'Patient Age Group',
      type: 'select',
      source: 'section1',
      autoPopulateFrom: 'narrative_analysis',
      options: [
        { label: '0–1 year', value: 0 },
        { label: '1–4 years', value: 1 },
        { label: '5–9 years', value: 2 },
        { label: '10–14 years', value: 3 },
        { label: '15+ years (adult)', value: 4 },
      ],
    },
    {
      id: 'head_neck',
      label: 'Head & Neck (% burned — infant 19%, adult 7%)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 19,
    },
    {
      id: 'anterior_trunk',
      label: 'Anterior Trunk (% burned — 13% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 13,
    },
    {
      id: 'posterior_trunk',
      label: 'Posterior Trunk (% burned — 13% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 13,
    },
    {
      id: 'right_upper_arm',
      label: 'Right Upper Arm (% burned — 4% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 4,
    },
    {
      id: 'left_upper_arm',
      label: 'Left Upper Arm (% burned — 4% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 4,
    },
    {
      id: 'right_lower_arm',
      label: 'Right Lower Arm (% burned — 3% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 3,
    },
    {
      id: 'left_lower_arm',
      label: 'Left Lower Arm (% burned — 3% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 3,
    },
    {
      id: 'right_hand',
      label: 'Right Hand (% burned — 2.5% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 3,
    },
    {
      id: 'left_hand',
      label: 'Left Hand (% burned — 2.5% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 3,
    },
    {
      id: 'buttocks',
      label: 'Buttocks (% burned — 5% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 5,
    },
    {
      id: 'genitalia',
      label: 'Genitalia (% burned — 1% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 1,
    },
    {
      id: 'right_thigh',
      label: 'Right Thigh (% burned — infant 5.5%, adult 9.5%)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 10,
    },
    {
      id: 'left_thigh',
      label: 'Left Thigh (% burned — infant 5.5%, adult 9.5%)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 10,
    },
    {
      id: 'right_lower_leg',
      label: 'Right Lower Leg (% burned — infant 5%, adult 7%)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 7,
    },
    {
      id: 'left_lower_leg',
      label: 'Left Lower Leg (% burned — infant 5%, adult 7%)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 7,
    },
    {
      id: 'right_foot',
      label: 'Right Foot (% burned — 3.5% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 4,
    },
    {
      id: 'left_foot',
      label: 'Left Foot (% burned — 3.5% all ages)',
      type: 'number_range',
      source: 'section1',
      min: 0,
      max: 4,
    },
  ],
  scoring: {
    method: 'algorithm',
    ranges: [
      {
        min: 0,
        max: 9,
        risk: 'Minor Burn',
        interpretation:
          'TBSA <10%: Minor burn. Outpatient management possible for partial-thickness burns in non-critical areas without complicating factors.',
      },
      {
        min: 10,
        max: 19,
        risk: 'Moderate Burn',
        interpretation:
          'TBSA 10–19%: Moderate burn. IV fluid resuscitation per Parkland formula (4 mL/kg/%TBSA). Consider burn center referral.',
      },
      {
        min: 20,
        max: 39,
        risk: 'Major Burn',
        interpretation:
          'TBSA 20–39%: Major burn. Aggressive fluid resuscitation required. Burn center transfer. Monitor for complications (compartment syndrome, rhabdomyolysis).',
      },
      {
        min: 40,
        max: 100,
        risk: 'Critical Burn',
        interpretation:
          'TBSA ≥40%: Critical/life-threatening burn. Burn center ICU. Massive fluid resuscitation, intubation likely, escharotomy evaluation, high mortality risk.',
      },
    ],
  },
  suggestedTreatments: {
    'Critical Burn': [
      'burn_center_transfer',
      'parkland_fluid_resuscitation',
      'intubation_airway_protection',
      'foley_catheter_urine_output_monitoring',
      'escharotomy_evaluation',
      'tetanus_prophylaxis',
    ],
    'Major Burn': [
      'burn_center_referral',
      'parkland_fluid_resuscitation',
      'wound_care_silver_sulfadiazine',
      'pain_management_iv_opioids',
      'tetanus_prophylaxis',
    ],
    'Moderate Burn': [
      'iv_fluid_resuscitation',
      'wound_care',
      'pain_management',
      'burn_center_consultation',
      'tetanus_prophylaxis',
    ],
    'Minor Burn': [
      'outpatient_wound_care',
      'topical_antimicrobials',
      'oral_analgesics',
      'burn_clinic_follow_up',
      'tetanus_prophylaxis',
    ],
  },
}
