/**
 * Clinical Correlation Engine
 * Scores pathogen relevance using 5 components (0-100 composite).
 * Deterministic scoring — no LLM calls.
 */

import type {
  SurveillanceDataPoint,
  ClinicalCorrelation,
  TrendAlert,
  SyndromeCategory,
} from './types'

/** Pathogen → expected symptoms for SYMPTOM_MATCH scoring */
const PATHOGEN_SYMPTOM_MAP: Record<string, string[]> = {
  'Influenza': ['fever', 'cough', 'myalgia', 'headache', 'fatigue', 'sore throat', 'chills'],
  'COVID-19': ['fever', 'cough', 'dyspnea', 'fatigue', 'anosmia', 'ageusia', 'myalgia', 'sore throat'],
  'RSV': ['cough', 'wheezing', 'rhinorrhea', 'fever', 'dyspnea', 'bronchiolitis', 'respiratory distress'],
  'Norovirus': ['nausea', 'vomiting', 'diarrhea', 'abdominal pain', 'fever', 'dehydration'],
  'Mpox': ['rash', 'fever', 'lymphadenopathy', 'myalgia', 'headache', 'vesicular'],
  'West Nile Virus': ['fever', 'headache', 'fatigue', 'rash', 'myalgia', 'meningitis', 'encephalitis'],
  'Lyme Disease': ['rash', 'fever', 'headache', 'fatigue', 'joint pain', 'tick bite', 'erythema migrans'],
  'Dengue': ['fever', 'headache', 'myalgia', 'rash', 'hemorrhagic', 'thrombocytopenia'],
  'Salmonella': ['diarrhea', 'fever', 'abdominal pain', 'nausea', 'vomiting'],
  'E. coli': ['diarrhea', 'bloody stool', 'abdominal pain', 'hus', 'hemolytic uremic'],
  'Measles': ['rash', 'fever', 'cough', 'conjunctivitis', 'coryza', 'koplik'],
  'Pertussis': ['cough', 'whooping cough', 'paroxysmal', 'post-tussive vomiting'],
  'Meningococcal Disease': ['fever', 'headache', 'neck stiffness', 'rash', 'petechial', 'altered mental status'],
}

/** Pathogen → peak months (1-12) for SEASONAL_PLAUSIBILITY */
const SEASONAL_PEAKS: Record<string, number[]> = {
  'Influenza': [11, 12, 1, 2, 3],
  'COVID-19': [1, 2, 7, 8, 11, 12], // multiple waves
  'RSV': [10, 11, 12, 1, 2],
  'Norovirus': [11, 12, 1, 2, 3],
  'West Nile Virus': [6, 7, 8, 9, 10],
  'Lyme Disease': [5, 6, 7, 8],
  'Dengue': [6, 7, 8, 9, 10],
}

/**
 * Score how well a pathogen's symptoms match the chief complaint.
 * Range: 0-40
 */
function scoreSymptomMatch(condition: string, chiefComplaint: string): number {
  const symptoms = PATHOGEN_SYMPTOM_MAP[condition]
  if (!symptoms) return 5 // minimal default for unknown pathogens
  const ccLower = chiefComplaint.toLowerCase()
  const matches = symptoms.filter((s) => ccLower.includes(s))
  const ratio = matches.length / symptoms.length
  return Math.round(ratio * 40)
}

/**
 * Score whether the pathogen appears in the provided differential.
 * Range: 0-20
 */
function scoreDifferentialMatch(condition: string, differential: string[]): number {
  const condLower = condition.toLowerCase()
  for (const dx of differential) {
    const dxLower = dx.toLowerCase()
    if (dxLower.includes(condLower) || condLower.includes(dxLower)) {
      return 20 // exact match
    }
  }

  // Check for related family
  const families: Record<string, string[]> = {
    'influenza': ['flu', 'influenza a', 'influenza b', 'h1n1'],
    'covid-19': ['sars-cov-2', 'coronavirus', 'covid'],
    'rsv': ['respiratory syncytial', 'bronchiolitis'],
  }
  const familyTerms = families[condLower] || []
  for (const dx of differential) {
    const dxLower = dx.toLowerCase()
    for (const term of familyTerms) {
      if (dxLower.includes(term)) return 15
    }
  }

  return 0
}

/**
 * Score based on epidemiologic signal (trend direction + magnitude).
 * Range: 0-25
 */
function scoreEpidemiologicSignal(dataPoints: SurveillanceDataPoint[]): number {
  if (dataPoints.length === 0) return 0

  // Average trend magnitude across data points
  const risingPoints = dataPoints.filter((dp) => dp.trend === 'rising')
  if (risingPoints.length === 0) {
    const stablePoints = dataPoints.filter((dp) => dp.trend === 'stable')
    return stablePoints.length > 0 ? 5 : 0
  }

  const avgMagnitude = risingPoints.reduce((sum, dp) => sum + (dp.trendMagnitude || 0), 0) / risingPoints.length

  // Scale: 0-10% = 10pts, 10-25% = 15pts, 25-50% = 20pts, >50% = 25pts
  if (avgMagnitude > 50) return 25
  if (avgMagnitude > 25) return 20
  if (avgMagnitude > 10) return 15
  return 10
}

/**
 * Score based on current month vs pathogen peak season.
 * Range: 0-10
 */
function scoreSeasonalPlausibility(condition: string): number {
  const peaks = SEASONAL_PEAKS[condition]
  if (!peaks) return 5 // neutral for unknown seasonality

  const currentMonth = new Date().getMonth() + 1 // 1-12
  if (peaks.includes(currentMonth)) return 10
  // Check adjacent months
  const adjacent = peaks.some((m) => Math.abs(m - currentMonth) <= 1 || Math.abs(m - currentMonth) >= 11)
  return adjacent ? 7 : 2
}

/**
 * Score based on data granularity (county > state > region > national).
 * Range: 0-5
 */
function scoreGeographicRelevance(dataPoints: SurveillanceDataPoint[]): number {
  if (dataPoints.length === 0) return 0

  const geoScores: Record<string, number> = {
    county: 5,
    state: 4,
    hhs_region: 3,
    national: 1,
  }

  const maxScore = Math.max(
    ...dataPoints.map((dp) => geoScores[dp.geoLevel] || 1)
  )
  return maxScore
}

/**
 * Classify tier based on overall score.
 */
function classifyTier(score: number): ClinicalCorrelation['tier'] {
  if (score >= 60) return 'high'
  if (score >= 40) return 'moderate'
  if (score >= 20) return 'low'
  return 'background'
}

/**
 * Build a human-readable summary line for a correlation.
 */
function buildSummary(condition: string, tier: string, dataPoints: SurveillanceDataPoint[]): string {
  const risingPoints = dataPoints.filter((dp) => dp.trend === 'rising')
  if (risingPoints.length > 0) {
    const avgMag = Math.round(
      risingPoints.reduce((s, dp) => s + (dp.trendMagnitude || 0), 0) / risingPoints.length
    )
    return `${condition} is trending upward (~${avgMag}% increase) in the region. Clinical relevance: ${tier}.`
  }
  const stablePoints = dataPoints.filter((dp) => dp.trend === 'stable')
  if (stablePoints.length > 0) {
    return `${condition} has stable activity in the region. Clinical relevance: ${tier}.`
  }
  return `${condition} has regional surveillance data available. Clinical relevance: ${tier}.`
}

/** Input to the correlation engine */
export interface CorrelationInput {
  chiefComplaint: string
  differential: string[]
  dataPoints: SurveillanceDataPoint[]
}

/**
 * Compute clinical correlations for all conditions found in surveillance data.
 * Returns correlations sorted by overall score (highest first).
 */
export function computeCorrelations(input: CorrelationInput): ClinicalCorrelation[] {
  const { chiefComplaint, differential, dataPoints } = input

  // Group data points by condition
  const byCondition = new Map<string, SurveillanceDataPoint[]>()
  for (const dp of dataPoints) {
    const existing = byCondition.get(dp.condition) || []
    existing.push(dp)
    byCondition.set(dp.condition, existing)
  }

  const correlations: ClinicalCorrelation[] = []

  for (const [condition, conditionDataPoints] of byCondition) {
    const symptomMatch = scoreSymptomMatch(condition, chiefComplaint)
    const differentialMatch = scoreDifferentialMatch(condition, differential)
    const epidemiologicSignal = scoreEpidemiologicSignal(conditionDataPoints)
    const seasonalPlausibility = scoreSeasonalPlausibility(condition)
    const geographicRelevance = scoreGeographicRelevance(conditionDataPoints)

    const overallScore = symptomMatch + differentialMatch + epidemiologicSignal + seasonalPlausibility + geographicRelevance
    const tier = classifyTier(overallScore)

    // Determine overall trend direction
    const risingCount = conditionDataPoints.filter((dp) => dp.trend === 'rising').length
    const fallingCount = conditionDataPoints.filter((dp) => dp.trend === 'falling').length
    let trendDirection: SurveillanceDataPoint['trend'] = 'unknown'
    if (risingCount > fallingCount) trendDirection = 'rising'
    else if (fallingCount > risingCount) trendDirection = 'falling'
    else if (conditionDataPoints.length > 0) trendDirection = 'stable'

    const avgMagnitude = conditionDataPoints
      .filter((dp) => dp.trendMagnitude != null)
      .reduce((s, dp, _, arr) => s + (dp.trendMagnitude || 0) / arr.length, 0)

    // Collect unique syndromes
    const syndromes = [...new Set(conditionDataPoints.flatMap((dp) => dp.syndromes))]

    correlations.push({
      condition,
      syndromes: syndromes as SyndromeCategory[],
      overallScore,
      tier,
      components: {
        symptomMatch,
        differentialMatch,
        epidemiologicSignal,
        seasonalPlausibility,
        geographicRelevance,
      },
      trendDirection,
      trendMagnitude: avgMagnitude > 0 ? Math.round(avgMagnitude) : undefined,
      dataPoints: conditionDataPoints,
      summary: buildSummary(condition, tier, conditionDataPoints),
    })
  }

  return correlations.sort((a, b) => b.overallScore - a.overallScore)
}

/**
 * Detect alerts from surveillance data patterns.
 * Checks for rapid rises, bioterrorism sentinels, etc.
 */
export function detectAlerts(
  dataPoints: SurveillanceDataPoint[],
  correlations: ClinicalCorrelation[]
): TrendAlert[] {
  const alerts: TrendAlert[] = []

  // Alert: Any condition with >50% rise
  for (const corr of correlations) {
    if (corr.trendMagnitude && corr.trendMagnitude > 50) {
      alerts.push({
        level: 'warning',
        title: `Rapid increase in ${corr.condition}`,
        description: `${corr.condition} has increased ~${corr.trendMagnitude}% in the region. Consider in differential.`,
        condition: corr.condition,
      })
    }
  }

  // Alert: Bioterrorism sentinel conditions detected
  const bioterrorismConditions = dataPoints.filter((dp) =>
    dp.syndromes.includes('bioterrorism_sentinel')
  )
  if (bioterrorismConditions.length > 0) {
    const conditions = [...new Set(bioterrorismConditions.map((dp) => dp.condition))]
    alerts.push({
      level: 'critical',
      title: 'Bioterrorism sentinel condition detected',
      description: `Surveillance data includes: ${conditions.join(', ')}. Verify with local public health authorities.`,
    })
  }

  // Alert: Multiple high-tier correlations
  const highTier = correlations.filter((c) => c.tier === 'high')
  if (highTier.length >= 3) {
    alerts.push({
      level: 'info',
      title: 'Multiple significant regional trends',
      description: `${highTier.length} conditions showing high clinical relevance. Consider broadening differential.`,
    })
  }

  return alerts
}
