/**
 * CDC NWSS Wastewater Adapter
 * Queries CDC National Wastewater Surveillance System for pathogen detection data.
 */

import type { DataSourceAdapter, DataSourceConfig } from './types'
import type { SurveillanceDataPoint, SyndromeCategory, ResolvedRegion } from '../types'
import { SurveillanceCache } from '../cache/surveillanceCache'

const cache = new SurveillanceCache()

export class CdcWastewaterAdapter implements DataSourceAdapter {
  config: DataSourceConfig = {
    name: 'cdc_wastewater',
    baseUrl: 'https://data.cdc.gov/resource',
    cacheTtlMs: 3 * 24 * 60 * 60 * 1000, // 3 days
    relevantSyndromes: ['respiratory_upper', 'respiratory_lower', 'gastrointestinal'],
    supportedGeoLevels: ['state', 'national'],
  }

  isRelevant(syndromes: SyndromeCategory[]): boolean {
    return syndromes.some((s) => this.config.relevantSyndromes.includes(s))
  }

  async fetch(region: ResolvedRegion, syndromes: SyndromeCategory[]): Promise<SurveillanceDataPoint[]> {
    if (!this.isRelevant(syndromes)) return []

    const cacheKey = `${this.config.name}_${region.stateAbbrev}_wastewater`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    try {
      const params = new URLSearchParams({
        '$limit': '50',
        '$order': 'date DESC',
      })

      if (region.stateAbbrev) {
        params.append('state', region.stateAbbrev)
      }

      // NWSS wastewater dataset
      const url = `${this.config.baseUrl}/g653-rqe2.json?${params.toString()}`

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(`CDC Wastewater API error: ${response.status}`)
      }

      const rawData = await response.json()
      const dataPoints = this.normalize(rawData, region)

      await cache.set(cacheKey, dataPoints, this.config.cacheTtlMs)
      return dataPoints
    } catch (error) {
      console.warn(`CdcWastewaterAdapter fetch failed:`, error)
      throw error
    }
  }

  private normalize(rawData: any[], region: ResolvedRegion): SurveillanceDataPoint[] {
    const dataPoints: SurveillanceDataPoint[] = []

    const pathogenSyndromeMap: Record<string, SyndromeCategory[]> = {
      'SARS-CoV-2': ['respiratory_upper', 'respiratory_lower'],
      'Influenza A': ['respiratory_upper', 'respiratory_lower'],
      'RSV': ['respiratory_upper', 'respiratory_lower'],
      'Norovirus': ['gastrointestinal'],
      'Mpox': ['febrile_rash'],
    }

    for (const row of rawData.slice(0, 30)) {
      const pathogen = row.pathogen || row.metric || 'SARS-CoV-2'
      const value = parseFloat(row.percentile || row.concentration || '0')
      if (isNaN(value)) continue

      const syndromes = pathogenSyndromeMap[pathogen] || ['respiratory_lower']

      dataPoints.push({
        source: this.config.name,
        condition: pathogen,
        syndromes,
        region: region.stateAbbrev,
        geoLevel: 'state',
        periodStart: row.date || row.week_end || '',
        periodEnd: row.date || row.week_end || '',
        value,
        unit: 'wastewater_concentration',
        trend: 'unknown',
        metadata: { source_dataset: 'g653-rqe2' },
      })
    }

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
      const recent = points[0].value
      const prior = points[1].value
      if (prior === 0) continue

      const change = ((recent - prior) / prior) * 100
      points[0].trend = change > 5 ? 'rising' : change < -5 ? 'falling' : 'stable'
      points[0].trendMagnitude = Math.round(Math.abs(change))
    }
  }
}
