/**
 * CDC NWSS Wastewater Adapter
 * Queries CDC National Wastewater Surveillance System for SARS-CoV-2 detection data.
 * Dataset: g653-rqe2 — Site-level PCR concentration measurements.
 *
 * Real API fields:
 *   key_plot_id  — site identifier with embedded state code (e.g. "NWSS_tx_256_...")
 *   date         — sample date (ISO)
 *   pcr_conc_lin — PCR concentration (linear scale, copies/L)
 *   normalization — normalization method
 *
 * This dataset only contains SARS-CoV-2 data. Multiple sites exist per state,
 * so we aggregate to a per-date median for a clean trend signal.
 */

import type { DataSourceAdapter, DataSourceConfig } from './types'
import type { SurveillanceDataPoint, SyndromeCategory, ResolvedRegion } from '../types'
import { SurveillanceCache } from '../cache/surveillanceCache'

const cache = new SurveillanceCache()

/** Extract the 2-letter state abbreviation from a key_plot_id string.
 *  Pattern: `[Source]_[state]_[siteId]_...` where state is lowercase 2-letter code
 *  followed by `_[digits]`. */
function parseStateFromKeyPlotId(keyPlotId: string): string | null {
  const match = keyPlotId.match(/_([a-z]{2})_\d+_/)
  return match ? match[1].toUpperCase() : null
}

/** Compute median of a numeric array. */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

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
      const stateLC = region.stateAbbrev.toLowerCase()
      const params = new URLSearchParams({
        '$limit': '200',
        '$order': 'date DESC',
        '$where': `key_plot_id LIKE '%_${stateLC}_%'`,
      })

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
    // 1. Parse rows, filter to confirmed state matches, group concentrations by date
    const byDate = new Map<string, number[]>()

    for (const row of rawData) {
      const keyPlotId = row.key_plot_id || ''
      const siteState = parseStateFromKeyPlotId(keyPlotId)
      if (siteState !== region.stateAbbrev) continue

      const concentration = parseFloat(row.pcr_conc_lin)
      if (isNaN(concentration) || concentration < 0) continue

      const date = row.date || ''
      if (!date) continue

      const values = byDate.get(date) || []
      values.push(concentration)
      byDate.set(date, values)
    }

    // 2. Aggregate to median concentration per date, sorted by date DESC
    const aggregated = [...byDate.entries()]
      .map(([date, values]) => ({ date, value: median(values), siteCount: values.length }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10) // keep most recent 10 dates

    // 3. Build data points
    const dataPoints: SurveillanceDataPoint[] = aggregated.map((agg) => ({
      source: this.config.name,
      condition: 'SARS-CoV-2',
      syndromes: ['respiratory_upper', 'respiratory_lower'] as SyndromeCategory[],
      region: region.stateAbbrev,
      geoLevel: 'state' as const,
      periodStart: agg.date,
      periodEnd: agg.date,
      value: agg.value,
      unit: 'wastewater_concentration',
      trend: 'unknown' as const,
      metadata: { source_dataset: 'g653-rqe2', sites_aggregated: agg.siteCount },
    }))

    // 4. Compute trend from 2 most recent aggregated dates
    this.computeTrends(dataPoints)
    return dataPoints
  }

  private computeTrends(dataPoints: SurveillanceDataPoint[]): void {
    if (dataPoints.length < 2) return
    // Data points are sorted DESC — index 0 is most recent
    const recent = dataPoints[0].value
    const prior = dataPoints[1].value
    if (prior === 0) return

    const change = ((recent - prior) / prior) * 100
    dataPoints[0].trend = change > 5 ? 'rising' : change < -5 ? 'falling' : 'stable'
    dataPoints[0].trendMagnitude = Math.round(Math.abs(change))
  }
}
