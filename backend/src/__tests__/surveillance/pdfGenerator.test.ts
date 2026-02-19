import { describe, it, expect } from 'vitest'
import { generateTrendReport } from '../../surveillance/pdfGenerator'
import type { TrendAnalysisResult } from '../../surveillance/types'

/** Build a fully-populated mock analysis result. */
function makeMockAnalysis(
  overrides: Partial<TrendAnalysisResult> = {},
): TrendAnalysisResult {
  return {
    analysisId: 'test-analysis-001',
    region: {
      state: 'Texas',
      stateAbbrev: 'TX',
      hhsRegion: 6,
      geoLevel: 'state',
      zipCode: '77001',
      county: 'Harris',
    },
    regionLabel: 'Houston, TX area — HHS Region 6',
    rankedFindings: [
      {
        condition: 'Influenza A',
        syndromes: ['respiratory_upper'],
        overallScore: 78,
        tier: 'high',
        components: {
          symptomMatch: 35,
          differentialMatch: 15,
          epidemiologicSignal: 18,
          seasonalPlausibility: 7,
          geographicRelevance: 3,
        },
        trendDirection: 'rising',
        trendMagnitude: 25,
        dataPoints: [],
        summary:
          'Influenza A positivity is rising sharply in the region, consistent with seasonal patterns and the presenting chief complaint.',
      },
      {
        condition: 'RSV',
        syndromes: ['respiratory_lower'],
        overallScore: 52,
        tier: 'moderate',
        components: {
          symptomMatch: 20,
          differentialMatch: 10,
          epidemiologicSignal: 14,
          seasonalPlausibility: 5,
          geographicRelevance: 3,
        },
        trendDirection: 'stable',
        trendMagnitude: 2,
        dataPoints: [],
        summary:
          'RSV levels remain moderate in the area with a stable trend over the past two weeks.',
      },
      {
        condition: 'Norovirus',
        syndromes: ['gastrointestinal'],
        overallScore: 28,
        tier: 'low',
        components: {
          symptomMatch: 8,
          differentialMatch: 0,
          epidemiologicSignal: 12,
          seasonalPlausibility: 6,
          geographicRelevance: 2,
        },
        trendDirection: 'falling',
        trendMagnitude: -10,
        dataPoints: [],
        summary: 'Norovirus activity is waning in the region.',
      },
    ],
    alerts: [
      {
        level: 'warning',
        title: 'Influenza A surge',
        description:
          'Influenza A positivity has increased >50% over the prior two-week period in HHS Region 6.',
        condition: 'Influenza A',
      },
      {
        level: 'info',
        title: 'Multiple respiratory pathogens elevated',
        description:
          'Two or more respiratory pathogens are at moderate or high tiers simultaneously.',
      },
    ],
    summary:
      'Regional surveillance data indicate a significant rise in Influenza A positivity with moderate RSV co-circulation. Consider influenza testing for febrile respiratory presentations.',
    dataSourcesQueried: ['CDC ILINet', 'CDC NREVSS', 'CDC NSSP'],
    dataSourceErrors: [],
    analyzedAt: '2026-02-18T14:30:00.000Z',
    ...overrides,
  }
}

describe('pdfGenerator', () => {
  describe('generateTrendReport', () => {
    it('returns a Buffer', async () => {
      const analysis = makeMockAnalysis()
      const result = await generateTrendReport(analysis)
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('buffer starts with PDF magic bytes (%PDF)', async () => {
      const analysis = makeMockAnalysis()
      const result = await generateTrendReport(analysis)
      const header = result.subarray(0, 5).toString('ascii')
      expect(header).toBe('%PDF-')
    })

    it('handles empty rankedFindings gracefully', async () => {
      const analysis = makeMockAnalysis({ rankedFindings: [] })
      const result = await generateTrendReport(analysis)
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('handles empty alerts gracefully', async () => {
      const analysis = makeMockAnalysis({ alerts: [] })
      const result = await generateTrendReport(analysis)
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('includes disclaimer text in output', async () => {
      const analysis = makeMockAnalysis()
      const result = await generateTrendReport(analysis)
      // PDFKit encodes text as hex in TJ operators, so search for the
      // hex-encoded form of "Educational tool only" within the raw buffer.
      const disclaimerHex = Buffer.from('Educational tool only').toString('hex')
      const pdfContent = result.toString('latin1')
      expect(pdfContent).toContain(disclaimerHex)
    })
  })
})
