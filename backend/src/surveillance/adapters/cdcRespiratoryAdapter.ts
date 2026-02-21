/**
 * CDC Respiratory Virus Adapter
 * Queries data.cdc.gov SODA API for hospital utilization data (COVID-19/Flu/RSV).
 * Dataset: mpgq-jmmr — Weekly hospital respiratory data by jurisdiction.
 *
 * Real API fields used:
 *   weekendingdate, jurisdiction, pctconfc19inptbeds, pctconffluinptbeds,
 *   pctconfrsvinptbeds, totalconfc19newadmpctchg, totalconfflunewadmpctchg
 */

import type { DataSourceAdapter, DataSourceConfig } from './types'
import type { SurveillanceDataPoint, SyndromeCategory, ResolvedRegion } from '../types'
import { SurveillanceCache } from '../cache/surveillanceCache'

const cache = new SurveillanceCache()

/** Maps each tracked respiratory condition to the real API field names. */
const CONDITION_FIELDS = [
  {
    name: 'Influenza',
    bedPctField: 'pctconffluinptbeds',
    admPctChgField: 'totalconfflunewadmpctchg',
  },
  {
    name: 'COVID-19',
    bedPctField: 'pctconfc19inptbeds',
    admPctChgField: 'totalconfc19newadmpctchg',
  },
  {
    name: 'RSV',
    bedPctField: 'pctconfrsvinptbeds',
    admPctChgField: null, // no precomputed pctchg field for RSV in this dataset
  },
] as const

export class CdcRespiratoryAdapter implements DataSourceAdapter {
  config: DataSourceConfig = {
    name: 'cdc_respiratory',
    baseUrl: 'https://data.cdc.gov/resource',
    cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    relevantSyndromes: ['respiratory_upper', 'respiratory_lower'],
    supportedGeoLevels: ['state', 'hhs_region', 'national'],
  }

  isRelevant(syndromes: SyndromeCategory[]): boolean {
    return syndromes.some((s) => this.config.relevantSyndromes.includes(s))
  }

  async fetch(region: ResolvedRegion, syndromes: SyndromeCategory[]): Promise<SurveillanceDataPoint[]> {
    if (!this.isRelevant(syndromes)) return []

    const cacheKey = `${this.config.name}_${region.stateAbbrev}_respiratory`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    try {
      const params = new URLSearchParams({
        '$limit': '10',
        '$order': 'weekendingdate DESC',
      })

      if (region.stateAbbrev) {
        params.append('jurisdiction', region.stateAbbrev)
      }

      const url = `${this.config.baseUrl}/mpgq-jmmr.json?${params.toString()}`

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('CDC API rate limited')
        }
        throw new Error(`CDC API error: ${response.status}`)
      }

      const rawData = await response.json()
      const dataPoints = this.normalize(rawData, region)

      await cache.set(cacheKey, dataPoints, this.config.cacheTtlMs)
      return dataPoints
    } catch (error) {
      console.warn(`CdcRespiratoryAdapter fetch failed:`, error)
      throw error
    }
  }

  private normalize(rawData: any[], region: ResolvedRegion): SurveillanceDataPoint[] {
    const dataPoints: SurveillanceDataPoint[] = []

    for (const row of rawData.slice(0, 10)) {
      const date = row.weekendingdate || ''

      for (const cond of CONDITION_FIELDS) {
        const value = parseFloat(row[cond.bedPctField])
        if (isNaN(value)) continue

        // Use precomputed week-over-week % change for trend if available
        let trend: SurveillanceDataPoint['trend'] = 'unknown'
        let trendMagnitude: number | undefined
        if (cond.admPctChgField) {
          const pctChg = parseFloat(row[cond.admPctChgField])
          if (!isNaN(pctChg)) {
            trend = pctChg > 5 ? 'rising' : pctChg < -5 ? 'falling' : 'stable'
            trendMagnitude = Math.round(Math.abs(pctChg))
          }
        }

        dataPoints.push({
          source: this.config.name,
          condition: cond.name,
          syndromes: ['respiratory_upper', 'respiratory_lower'],
          region: region.stateAbbrev,
          geoLevel: region.geoLevel === 'county' ? 'state' : region.geoLevel,
          periodStart: date,
          periodEnd: date,
          value,
          unit: 'pct_inpatient_beds',
          trend,
          trendMagnitude,
          metadata: { source_dataset: 'mpgq-jmmr' },
        })
      }
    }

    // For conditions without precomputed trend (RSV), compute from 2-point comparison
    this.computeFallbackTrends(dataPoints)
    return dataPoints
  }

  /** Compute trends for data points that still have 'unknown' trend by comparing consecutive weeks. */
  private computeFallbackTrends(dataPoints: SurveillanceDataPoint[]): void {
    const byCondition = new Map<string, SurveillanceDataPoint[]>()
    for (const dp of dataPoints) {
      if (dp.trend !== 'unknown') continue
      const list = byCondition.get(dp.condition) || []
      list.push(dp)
      byCondition.set(dp.condition, list)
    }

    for (const [, points] of byCondition) {
      if (points.length < 2) continue
      // Data sorted DESC by date; index 0 is most recent
      const recent = points[0].value
      const prior = points[1].value
      if (prior === 0) continue

      const change = ((recent - prior) / prior) * 100
      points[0].trend = change > 5 ? 'rising' : change < -5 ? 'falling' : 'stable'
      points[0].trendMagnitude = Math.round(Math.abs(change))
    }
  }
}
