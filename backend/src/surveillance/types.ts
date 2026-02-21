/**
 * Surveillance feature shared types.
 * Defines the core data structures for regional ED trend analysis.
 */

/** Syndrome categories for mapping clinical presentations to surveillance data */
export type SyndromeCategory =
  | 'respiratory_upper'
  | 'respiratory_lower'
  | 'gastrointestinal'
  | 'neurological'
  | 'febrile_rash'
  | 'hemorrhagic'
  | 'sepsis_shock'
  | 'cardiovascular'
  | 'vector_borne'
  | 'bioterrorism_sentinel'

/** Geographic granularity levels */
export type GeoLevel = 'county' | 'state' | 'hhs_region' | 'national'

/** Resolved geographic region with all granularity levels */
export interface ResolvedRegion {
  zipCode?: string
  county?: string
  fipsCode?: string
  state: string
  stateAbbrev: string
  hhsRegion: number
  geoLevel: GeoLevel
}

/** Normalized data point from any CDC source */
export interface SurveillanceDataPoint {
  source: string
  condition: string
  syndromes: SyndromeCategory[]
  region: string
  geoLevel: GeoLevel
  periodStart: string   // ISO date
  periodEnd: string     // ISO date
  value: number
  unit: string
  trend: 'rising' | 'falling' | 'stable' | 'unknown'
  trendMagnitude?: number  // percentage change from prior period
  metadata?: Record<string, unknown>
}

/** Aggregated surveillance result for a region */
export interface RegionalSurveillanceResult {
  region: ResolvedRegion
  dataPoints: SurveillanceDataPoint[]
  fetchedAt: string   // ISO timestamp
  sources: string[]
  errors: DataSourceError[]
}

/** Partial failure tracking for data sources */
export interface DataSourceError {
  source: string
  error: string
  timestamp: string
}

/** Scored pathogen with 5 scoring components */
export interface ClinicalCorrelation {
  condition: string
  syndromes: SyndromeCategory[]
  overallScore: number        // 0-100 composite
  tier: 'high' | 'moderate' | 'low' | 'background'
  components: {
    symptomMatch: number        // 0-40
    differentialMatch: number   // 0-20
    epidemiologicSignal: number // 0-25
    seasonalPlausibility: number // 0-10
    geographicRelevance: number  // 0-5
  }
  trendDirection: 'rising' | 'falling' | 'stable' | 'unknown'
  trendMagnitude?: number
  dataPoints: SurveillanceDataPoint[]
  summary: string
}

/** Alert for unusual surveillance patterns */
export interface TrendAlert {
  level: 'critical' | 'warning' | 'info'
  title: string
  description: string
  condition?: string
  source?: string
}

/** Per-source summary of what each CDC data feed returned */
export interface DataSourceSummary {
  source: string   // 'cdc_respiratory' | 'cdc_wastewater' | 'cdc_nndss'
  label: string    // Human-readable: 'CDC Respiratory Hospital Data'
  status: 'data' | 'no_data' | 'error' | 'not_queried'
  highlights: string[]  // Per-condition one-liners
}

/** Complete trend analysis output */
export interface TrendAnalysisResult {
  analysisId: string
  region: ResolvedRegion
  regionLabel: string
  rankedFindings: ClinicalCorrelation[]
  alerts: TrendAlert[]
  summary: string
  dataSourcesQueried: string[]
  dataSourceErrors: DataSourceError[]
  dataSourceSummaries: DataSourceSummary[]
  analyzedAt: string   // ISO timestamp
}
