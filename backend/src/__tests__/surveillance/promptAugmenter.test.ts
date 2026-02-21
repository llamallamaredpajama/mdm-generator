import { describe, it, expect } from 'vitest'
import { buildSurveillanceContext } from '../../surveillance/promptAugmenter'
import type {
  TrendAnalysisResult,
  ClinicalCorrelation,
  TrendAlert,
  ResolvedRegion,
} from '../../surveillance/types'

/* ------------------------------------------------------------------ */
/*  Mock data helpers                                                   */
/* ------------------------------------------------------------------ */

const baseRegion: ResolvedRegion = {
  state: 'Texas',
  stateAbbrev: 'TX',
  hhsRegion: 6,
  geoLevel: 'hhs_region',
}

function makeFinding(overrides: Partial<ClinicalCorrelation> = {}): ClinicalCorrelation {
  return {
    condition: 'Influenza',
    syndromes: ['respiratory_upper'],
    overallScore: 65,
    tier: 'high',
    components: {
      symptomMatch: 25,
      differentialMatch: 15,
      epidemiologicSignal: 15,
      seasonalPlausibility: 7,
      geographicRelevance: 3,
    },
    trendDirection: 'rising',
    trendMagnitude: 35,
    dataPoints: [],
    summary: 'Influenza is trending upward in the region.',
    ...overrides,
  }
}

function makeAlert(overrides: Partial<TrendAlert> = {}): TrendAlert {
  return {
    level: 'warning',
    title: 'Rapid increase in Influenza',
    description: 'Rapid increase in Influenza (~35% increase). Consider in differential.',
    condition: 'Influenza',
    ...overrides,
  }
}

function makeAnalysis(overrides: Partial<TrendAnalysisResult> = {}): TrendAnalysisResult {
  return {
    analysisId: 'test-001',
    region: baseRegion,
    regionLabel: 'Houston, TX area — HHS Region 6',
    rankedFindings: [makeFinding()],
    alerts: [makeAlert()],
    summary: 'Influenza rising in region.',
    dataSourcesQueried: ['CDC Respiratory', 'NWSS Wastewater'],
    dataSourceErrors: [],
    dataSourceSummaries: [],
    analyzedAt: '2026-02-18T12:00:00Z',
    ...overrides,
  }
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe('buildSurveillanceContext', () => {
  it('returns empty string for null analysis', () => {
    expect(buildSurveillanceContext(null)).toBe('')
  })

  it('returns empty string for undefined analysis', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(buildSurveillanceContext(undefined as any)).toBe('')
  })

  it('returns "no significant signals" message when no significant findings and no differential', () => {
    const analysis = makeAnalysis({
      rankedFindings: [
        makeFinding({ tier: 'low' }),
        makeFinding({ tier: 'background', condition: 'Norovirus' }),
      ],
      alerts: [makeAlert({ level: 'info' })],
    })

    const output = buildSurveillanceContext(analysis)
    expect(output).toContain('No significant regional surveillance signals detected')
  })

  it('includes only high and moderate tier findings without differential', () => {
    const analysis = makeAnalysis({
      rankedFindings: [
        makeFinding({ tier: 'high', condition: 'Influenza' }),
        makeFinding({ tier: 'moderate', condition: 'RSV', trendDirection: 'stable', trendMagnitude: undefined, summary: 'RSV stable.' }),
        makeFinding({ tier: 'low', condition: 'Norovirus' }),
        makeFinding({ tier: 'background', condition: 'Adenovirus' }),
      ],
      alerts: [],
    })

    const output = buildSurveillanceContext(analysis)

    expect(output).toContain('Influenza')
    expect(output).toContain('RSV')
    expect(output).not.toContain('Norovirus')
    expect(output).not.toContain('Adenovirus')
  })

  it('includes absence data for differential-matched low/background findings', () => {
    const analysis = makeAnalysis({
      rankedFindings: [
        makeFinding({ tier: 'high', condition: 'Influenza' }),
        makeFinding({ tier: 'background', condition: 'Lyme Disease' }),
        makeFinding({ tier: 'low', condition: 'RMSF', trendDirection: 'stable' }),
      ],
      alerts: [],
    })

    const output = buildSurveillanceContext(analysis, ['Lyme Disease', 'RMSF', 'Meningitis'])

    expect(output).toContain('Influenza')
    expect(output).toContain('Conditions Not Significantly Active')
    expect(output).toContain('Lyme Disease')
    expect(output).toContain('Below background levels')
    expect(output).toContain('RMSF')
    expect(output).toContain('Low regional activity')
  })

  it('does not include absence data for findings not on the differential', () => {
    const analysis = makeAnalysis({
      rankedFindings: [
        makeFinding({ tier: 'background', condition: 'Adenovirus' }),
      ],
      alerts: [],
    })

    const output = buildSurveillanceContext(analysis, ['Chest Pain', 'PE'])

    expect(output).not.toContain('Adenovirus')
    expect(output).toContain('No significant regional surveillance signals')
  })

  it('includes critical and warning alerts but not info', () => {
    const analysis = makeAnalysis({
      alerts: [
        makeAlert({ level: 'critical', description: 'Critical outbreak detected.' }),
        makeAlert({ level: 'warning', description: 'Rapid increase detected.' }),
        makeAlert({ level: 'info', description: 'Multiple conditions co-circulating.' }),
      ],
    })

    const output = buildSurveillanceContext(analysis)

    expect(output).toContain('[CRITICAL]')
    expect(output).toContain('[WARNING]')
    expect(output).not.toContain('[INFO]')
  })

  it('output stays under 2000 characters with many findings', () => {
    const manyFindings: ClinicalCorrelation[] = []
    for (let i = 0; i < 30; i++) {
      manyFindings.push(
        makeFinding({
          condition: `Condition-${i}`,
          tier: 'high',
          summary: `Condition-${i} is trending upward significantly in the region with notable increases.`,
        }),
      )
    }

    const manyAlerts: TrendAlert[] = []
    for (let i = 0; i < 10; i++) {
      manyAlerts.push(
        makeAlert({
          level: 'warning',
          description: `Alert for Condition-${i}: rapid increase detected in recent surveillance data.`,
        }),
      )
    }

    const analysis = makeAnalysis({
      rankedFindings: manyFindings,
      alerts: manyAlerts,
    })

    const output = buildSurveillanceContext(analysis)

    expect(output.length).toBeLessThanOrEqual(2000)
  })

  it('includes region label and data sources', () => {
    const output = buildSurveillanceContext(makeAnalysis())

    expect(output).toContain('Houston, TX area — HHS Region 6')
    expect(output).toContain('CDC Respiratory')
    expect(output).toContain('NWSS Wastewater')
  })

  it('includes trend direction and magnitude for rising conditions', () => {
    const analysis = makeAnalysis({
      rankedFindings: [
        makeFinding({ trendDirection: 'rising', trendMagnitude: 35 }),
      ],
    })

    const output = buildSurveillanceContext(analysis)

    expect(output).toContain('Rising')
    expect(output).toContain('~35% increase')
    expect(output).toContain('HIGH relevance')
  })

  it('formats stable trends without magnitude', () => {
    const analysis = makeAnalysis({
      rankedFindings: [
        makeFinding({
          condition: 'RSV',
          tier: 'moderate',
          trendDirection: 'stable',
          trendMagnitude: undefined,
          summary: 'RSV activity remains stable.',
        }),
      ],
      alerts: [],
    })

    const output = buildSurveillanceContext(analysis)

    expect(output).toContain('Stable activity')
    expect(output).toContain('MODERATE relevance')
  })

  it('formats falling trends with decrease label', () => {
    const analysis = makeAnalysis({
      rankedFindings: [
        makeFinding({
          condition: 'RSV',
          tier: 'moderate',
          trendDirection: 'falling',
          trendMagnitude: 20,
          summary: 'RSV declining.',
        }),
      ],
      alerts: [],
    })

    const output = buildSurveillanceContext(analysis)

    expect(output).toContain('Falling')
    expect(output).toContain('~20% decrease')
  })
})
