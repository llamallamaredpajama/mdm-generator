/**
 * CDC Respiratory Virus Adapter
 * Queries data.cdc.gov SODA API for ILI/COVID/RSV surveillance data.
 */

import type { DataSourceAdapter, DataSourceConfig } from './types'
import type { SurveillanceDataPoint, SyndromeCategory, ResolvedRegion } from '../types'
import { SurveillanceCache } from '../cache/surveillanceCache'

const cache = new SurveillanceCache()

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
      // Query CDC SODA API for respiratory virus surveillance
      // Dataset: COVID-19/Respiratory Virus data
      const params = new URLSearchParams({
        '$limit': '50',
        '$order': 'week_ending_date DESC',
      })

      // Filter by state if available
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

    for (const row of rawData.slice(0, 20)) {
      const conditions = [
        { name: 'Influenza', field: 'percent_positive_influenza', unit: 'percent_positive' },
        { name: 'COVID-19', field: 'percent_positive_covid', unit: 'percent_positive' },
        { name: 'RSV', field: 'percent_positive_rsv', unit: 'percent_positive' },
      ]

      for (const cond of conditions) {
        const value = parseFloat(row[cond.field])
        if (isNaN(value)) continue

        dataPoints.push({
          source: this.config.name,
          condition: cond.name,
          syndromes: ['respiratory_upper', 'respiratory_lower'],
          region: region.stateAbbrev,
          geoLevel: region.geoLevel === 'county' ? 'state' : region.geoLevel,
          periodStart: row.week_ending_date || '',
          periodEnd: row.week_ending_date || '',
          value,
          unit: cond.unit,
          trend: 'unknown',
          metadata: { source_dataset: 'mpgq-jmmr' },
        })
      }
    }

    // Compute trends by comparing recent vs prior data for same condition
    this.computeTrends(dataPoints)
    return dataPoints
  }

  private computeTrends(dataPoints: SurveillanceDataPoint[]): void {
    const byCondition = new Map<string, SurveillanceDataPoint[]>()
    for (const dp of dataPoints) {
      const list = byCondition.get(dp.condition) || []
      list.push(dp)
      byCondition.set(dp.condition, list)
    }

    for (const [, points] of byCondition) {
      if (points.length < 2) continue
      // Assume sorted DESC by date
      const recent = points[0].value
      const prior = points[1].value
      if (prior === 0) continue

      const change = ((recent - prior) / prior) * 100
      points[0].trend = change > 5 ? 'rising' : change < -5 ? 'falling' : 'stable'
      points[0].trendMagnitude = Math.round(Math.abs(change))
    }
  }
}
