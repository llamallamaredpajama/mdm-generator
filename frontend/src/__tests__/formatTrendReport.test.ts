import { describe, it, expect } from 'vitest'
import { formatTrendReport } from '../lib/formatTrendReport'
import type { TrendAnalysisResult } from '../types/surveillance'

const mockAnalysis: TrendAnalysisResult = {
  analysisId: 'test-123',
  regionLabel: 'Suffolk, MA area — HHS Region 1',
  rankedFindings: [
    {
      condition: 'Influenza',
      overallScore: 72,
      tier: 'high',
      trendDirection: 'rising',
      trendMagnitude: 15.2,
      summary: 'Rising ~15% from prior week. High prevalence in Massachusetts.',
    },
    {
      condition: 'RSV',
      overallScore: 45,
      tier: 'moderate',
      trendDirection: 'stable',
      summary: 'Stable activity in the region.',
    },
  ],
  alerts: [
    {
      level: 'warning',
      title: 'Co-Circulation Pattern',
      description: 'Influenza and RSV both above 15% positive.',
    },
  ],
  summary: 'Regional surveillance shows notable activity for Influenza, RSV.',
  dataSourcesQueried: ['CDC Respiratory', 'NWSS Wastewater'],
  analyzedAt: '2026-02-19T15:34:22.123Z',
}

describe('formatTrendReport', () => {
  it('includes region label', () => {
    const report = formatTrendReport(mockAnalysis)
    expect(report).toContain('Suffolk, MA area')
  })

  it('includes findings with tier and trend', () => {
    const report = formatTrendReport(mockAnalysis)
    expect(report).toContain('Influenza')
    expect(report).toContain('HIGH')
    expect(report).toContain('Rising')
  })

  it('includes alerts', () => {
    const report = formatTrendReport(mockAnalysis)
    expect(report).toContain('Co-Circulation Pattern')
  })

  it('includes data source attribution', () => {
    const report = formatTrendReport(mockAnalysis)
    expect(report).toContain('CDC Respiratory')
  })

  it('includes disclaimer', () => {
    const report = formatTrendReport(mockAnalysis)
    expect(report).toContain('supplementary')
  })
})
