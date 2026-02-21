/**
 * Data source adapter interfaces for the surveillance system.
 * Each CDC data source implements the DataSourceAdapter interface
 * to normalize responses into SurveillanceDataPoint format.
 */

import type { SurveillanceDataPoint, SyndromeCategory, GeoLevel, ResolvedRegion, DataSourceError } from '../types'

/** Configuration for a data source */
export interface DataSourceConfig {
  /** Unique identifier for this data source */
  name: string
  /** Base URL for the API */
  baseUrl: string
  /** Cache TTL in milliseconds */
  cacheTtlMs: number
  /** Syndrome categories this source covers */
  relevantSyndromes: SyndromeCategory[]
  /** Geographic levels this source supports */
  supportedGeoLevels: GeoLevel[]
}

/** Interface that all CDC data source adapters must implement */
export interface DataSourceAdapter {
  /** Configuration for this adapter */
  config: DataSourceConfig

  /**
   * Fetch surveillance data for a given region and set of syndromes.
   * Returns normalized data points.
   */
  fetch(region: ResolvedRegion, syndromes: SyndromeCategory[]): Promise<SurveillanceDataPoint[]>

  /**
   * Check if this adapter is relevant for the given set of syndromes.
   * Returns true if any of the syndromes overlap with this source's coverage.
   */
  isRelevant(syndromes: SyndromeCategory[]): boolean
}

/** Result from fetching all adapters */
export interface AdapterFetchResult {
  dataPoints: SurveillanceDataPoint[]
  errors: DataSourceError[]
  /** Source keys that were actually queried (relevant adapters) */
  queriedSources: string[]
}
