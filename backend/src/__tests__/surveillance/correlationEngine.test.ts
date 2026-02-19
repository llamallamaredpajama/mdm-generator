import { describe, it, expect } from 'vitest'
import { computeCorrelations, detectAlerts, type CorrelationInput } from '../../surveillance/correlationEngine'
import type { SurveillanceDataPoint, ClinicalCorrelation } from '../../surveillance/types'

function makeDataPoint(overrides: Partial<SurveillanceDataPoint> = {}): SurveillanceDataPoint {
  return {
    source: 'cdc_respiratory',
    condition: 'Influenza',
    syndromes: ['respiratory_upper'],
    region: 'TX',
    geoLevel: 'state',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-08',
    value: 15,
    unit: 'percent_positive',
    trend: 'rising',
    trendMagnitude: 20,
    ...overrides,
  }
}

describe('correlationEngine', () => {
  describe('computeCorrelations', () => {
    it('scores symptom match for known pathogen', () => {
      const input: CorrelationInput = {
        chiefComplaint: 'fever and cough',
        differential: ['URI'],
        dataPoints: [makeDataPoint({ condition: 'Influenza' })],
      }

      const results = computeCorrelations(input)
      expect(results).toHaveLength(1)
      expect(results[0].components.symptomMatch).toBeGreaterThan(0)
    })

    it('scores differential match when condition is in differential', () => {
      const input: CorrelationInput = {
        chiefComplaint: 'cough',
        differential: ['Influenza', 'Pneumonia'],
        dataPoints: [makeDataPoint({ condition: 'Influenza' })],
      }

      const results = computeCorrelations(input)
      expect(results[0].components.differentialMatch).toBe(20)
    })

    it('scores epidemiologic signal for rising trends', () => {
      const input: CorrelationInput = {
        chiefComplaint: 'cough',
        differential: [],
        dataPoints: [makeDataPoint({ trend: 'rising', trendMagnitude: 30 })],
      }

      const results = computeCorrelations(input)
      expect(results[0].components.epidemiologicSignal).toBeGreaterThan(0)
    })

    it('classifies tiers correctly', () => {
      // Build a high-scoring scenario
      const input: CorrelationInput = {
        chiefComplaint: 'fever cough myalgia headache fatigue',
        differential: ['Influenza'],
        dataPoints: [
          makeDataPoint({ condition: 'Influenza', trend: 'rising', trendMagnitude: 30, geoLevel: 'county' }),
        ],
      }

      const results = computeCorrelations(input)
      expect(results[0].overallScore).toBeGreaterThanOrEqual(40)
      expect(['high', 'moderate']).toContain(results[0].tier)
    })

    it('returns results sorted by score descending', () => {
      const input: CorrelationInput = {
        chiefComplaint: 'fever and cough',
        differential: ['Influenza'],
        dataPoints: [
          makeDataPoint({ condition: 'Influenza', trend: 'rising', trendMagnitude: 30 }),
          makeDataPoint({ condition: 'Norovirus', syndromes: ['gastrointestinal'], trend: 'stable', trendMagnitude: 0 }),
        ],
      }

      const results = computeCorrelations(input)
      expect(results.length).toBe(2)
      expect(results[0].overallScore).toBeGreaterThanOrEqual(results[1].overallScore)
    })

    it('handles empty data points', () => {
      const input: CorrelationInput = {
        chiefComplaint: 'cough',
        differential: ['Influenza'],
        dataPoints: [],
      }

      const results = computeCorrelations(input)
      expect(results).toEqual([])
    })
  })

  describe('detectAlerts', () => {
    it('generates warning for >50% rise', () => {
      const correlations: ClinicalCorrelation[] = [{
        condition: 'RSV',
        syndromes: ['respiratory_lower'],
        overallScore: 60,
        tier: 'high',
        components: { symptomMatch: 20, differentialMatch: 10, epidemiologicSignal: 20, seasonalPlausibility: 7, geographicRelevance: 3 },
        trendDirection: 'rising',
        trendMagnitude: 55,
        dataPoints: [makeDataPoint({ condition: 'RSV', trendMagnitude: 55 })],
        summary: 'test',
      }]

      const alerts = detectAlerts(correlations[0].dataPoints, correlations)
      expect(alerts.some((a) => a.level === 'warning' && a.condition === 'RSV')).toBe(true)
    })

    it('generates critical alert for bioterrorism sentinel', () => {
      const dp = makeDataPoint({
        condition: 'Anthrax',
        syndromes: ['bioterrorism_sentinel'],
      })

      const alerts = detectAlerts([dp], [])
      expect(alerts.some((a) => a.level === 'critical')).toBe(true)
    })

    it('generates info alert for multiple high-tier correlations', () => {
      const makeHighCorr = (condition: string): ClinicalCorrelation => ({
        condition,
        syndromes: ['respiratory_upper'],
        overallScore: 70,
        tier: 'high',
        components: { symptomMatch: 30, differentialMatch: 15, epidemiologicSignal: 15, seasonalPlausibility: 7, geographicRelevance: 3 },
        trendDirection: 'rising',
        trendMagnitude: 10,
        dataPoints: [],
        summary: 'test',
      })

      const correlations = [makeHighCorr('A'), makeHighCorr('B'), makeHighCorr('C')]
      const alerts = detectAlerts([], correlations)
      expect(alerts.some((a) => a.level === 'info')).toBe(true)
    })
  })
})
