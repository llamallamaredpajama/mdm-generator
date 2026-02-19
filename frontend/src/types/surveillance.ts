/**
 * Frontend types for the surveillance trend analysis feature.
 * These mirror the backend response types for type-safe API consumption.
 */

/** Location input for trend analysis */
export interface SurveillanceLocation {
  zipCode?: string
  state?: string
}

/** Individual trend finding */
export interface TrendFinding {
  condition: string
  overallScore: number
  tier: 'high' | 'moderate' | 'low' | 'background'
  trendDirection: 'rising' | 'falling' | 'stable' | 'unknown'
  trendMagnitude?: number
  summary: string
}

/** Alert from surveillance analysis */
export interface SurveillanceAlert {
  level: 'critical' | 'warning' | 'info'
  title: string
  description: string
  condition?: string
}

/** Complete trend analysis result */
export interface TrendAnalysisResult {
  analysisId: string
  regionLabel: string
  rankedFindings: TrendFinding[]
  alerts: SurveillanceAlert[]
  summary: string
  dataSourcesQueried: string[]
  analyzedAt: string
}

/** API response wrapper for analyze endpoint */
export interface SurveillanceAnalyzeResponse {
  ok: boolean
  analysis: TrendAnalysisResult | null
  warnings?: string[]
}
