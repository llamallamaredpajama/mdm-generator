/**
 * CDC NNDSS Adapter
 * Queries CDC National Notifiable Diseases Surveillance System.
 * Dataset: x9gk-5huc — NNDSS Table II weekly case counts.
 *
 * Real API fields:
 *   label     — disease/condition name
 *   m2        — current week case count
 *   year      — MMWR year
 *   week      — MMWR week
 *   states    — geographic grouping (e.g. "US RESIDENTS")
 *   location1 — state name (when present)
 *   m1_flag / m2_flag — data flags ("-" = no data/suppressed)
 */

import type { DataSourceAdapter, DataSourceConfig } from './types'
import type { SurveillanceDataPoint, SyndromeCategory, ResolvedRegion } from '../types'
import { SurveillanceCache } from '../cache/surveillanceCache'

const cache = new SurveillanceCache()

export class CdcNndssAdapter implements DataSourceAdapter {
  config: DataSourceConfig = {
    name: 'cdc_nndss',
    baseUrl: 'https://data.cdc.gov/resource',
    cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 1 week
    relevantSyndromes: ['neurological', 'vector_borne', 'bioterrorism_sentinel', 'febrile_rash', 'hemorrhagic'],
    supportedGeoLevels: ['state', 'national'],
  }

  /** Condition -> syndrome category mapping (case-insensitive lookup built at init) */
  private conditionSyndromeMap: Record<string, SyndromeCategory[]> = {
    'West Nile Virus disease, Neuroinvasive': ['neurological', 'vector_borne'],
    'West Nile Virus disease, Nonneuroinvasive': ['vector_borne'],
    'West Nile Virus': ['neurological', 'vector_borne'],
    'Lyme disease': ['vector_borne'],
    'Lyme Disease': ['vector_borne'],
    'Dengue': ['vector_borne', 'hemorrhagic'],
    'Malaria': ['vector_borne'],
    'Measles': ['febrile_rash'],
    'Meningococcal disease': ['neurological'],
    'Meningococcal Disease': ['neurological'],
    'Pertussis': ['respiratory_upper'],
    'Anthrax': ['bioterrorism_sentinel'],
    'Botulism': ['bioterrorism_sentinel'],
    'Tularemia': ['bioterrorism_sentinel'],
    'Plague': ['bioterrorism_sentinel'],
  }

  isRelevant(syndromes: SyndromeCategory[]): boolean {
    return syndromes.some((s) => this.config.relevantSyndromes.includes(s))
  }

  async fetch(region: ResolvedRegion, syndromes: SyndromeCategory[]): Promise<SurveillanceDataPoint[]> {
    if (!this.isRelevant(syndromes)) return []

    const cacheKey = `${this.config.name}_${region.stateAbbrev}_nndss`
    const cached = await cache.get(cacheKey)
    if (cached) return cached

    try {
      const params = new URLSearchParams({
        '$limit': '100',
        '$order': 'year DESC, week DESC',
      })

      const url = `${this.config.baseUrl}/x9gk-5huc.json?${params.toString()}`

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(`CDC NNDSS API error: ${response.status}`)
      }

      const rawData = await response.json()
      const dataPoints = this.normalize(rawData, region)

      await cache.set(cacheKey, dataPoints, this.config.cacheTtlMs)
      return dataPoints
    } catch (error) {
      console.warn(`CdcNndssAdapter fetch failed:`, error)
      throw error
    }
  }

  /** Look up syndromes for a condition label, case-insensitive. */
  private getSyndromes(condition: string): SyndromeCategory[] | undefined {
    // Exact match first
    if (this.conditionSyndromeMap[condition]) return this.conditionSyndromeMap[condition]
    // Case-insensitive fallback
    const lower = condition.toLowerCase()
    for (const [key, value] of Object.entries(this.conditionSyndromeMap)) {
      if (key.toLowerCase() === lower) return value
    }
    return undefined
  }

  private normalize(rawData: any[], region: ResolvedRegion): SurveillanceDataPoint[] {
    const dataPoints: SurveillanceDataPoint[] = []

    for (const row of rawData.slice(0, 50)) {
      const condition = row.label || ''
      if (!condition) continue

      // Parse case count from m2 field; skip if flagged as suppressed or missing
      const m2Flag = row.m2_flag || ''
      const rawCount = row.m2
      // "-" flag or missing m2 means no data; still allow 0 as a valid count
      if (m2Flag === '-' && (rawCount === undefined || rawCount === null)) continue

      const value = parseFloat(rawCount ?? '0')
      if (isNaN(value)) continue

      const syndromes = this.getSyndromes(condition) || ['neurological']

      const year = row.year || new Date().getFullYear()
      const week = row.week || 1

      dataPoints.push({
        source: this.config.name,
        condition,
        syndromes,
        region: region.stateAbbrev,
        geoLevel: 'national', // NNDSS is typically national-level
        periodStart: `${year}-W${String(week).padStart(2, '0')}`,
        periodEnd: `${year}-W${String(week).padStart(2, '0')}`,
        value,
        unit: 'case_count',
        trend: 'unknown',
        metadata: { source_dataset: 'x9gk-5huc' },
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
      points[0].trend = change > 10 ? 'rising' : change < -10 ? 'falling' : 'stable'
      points[0].trendMagnitude = Math.round(Math.abs(change))
    }
  }
}
