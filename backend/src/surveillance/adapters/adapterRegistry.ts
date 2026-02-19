/**
 * Adapter Registry
 * Orchestrates all CDC data source adapters with cache-first and graceful degradation.
 * Failed adapters contribute errors; successful ones contribute data.
 */

import type { DataSourceAdapter, AdapterFetchResult } from './types'
import type { SyndromeCategory, ResolvedRegion, DataSourceError } from '../types'
import { CdcRespiratoryAdapter } from './cdcRespiratoryAdapter'
import { CdcWastewaterAdapter } from './cdcWastewaterAdapter'
import { CdcNndssAdapter } from './cdcNndssAdapter'

export class AdapterRegistry {
  private adapters: DataSourceAdapter[]

  constructor() {
    this.adapters = [
      new CdcRespiratoryAdapter(),
      new CdcWastewaterAdapter(),
      new CdcNndssAdapter(),
    ]
  }

  /**
   * Fetch data from all relevant adapters in parallel.
   * Uses Promise.allSettled for graceful degradation — failed adapters
   * return errors while successful ones contribute data.
   */
  async fetchAll(
    region: ResolvedRegion,
    syndromes: SyndromeCategory[]
  ): Promise<AdapterFetchResult> {
    const relevantAdapters = this.adapters.filter((a) => a.isRelevant(syndromes))

    if (relevantAdapters.length === 0) {
      return { dataPoints: [], errors: [] }
    }

    const results = await Promise.allSettled(
      relevantAdapters.map((adapter) => adapter.fetch(region, syndromes))
    )

    const dataPoints = []
    const errors: DataSourceError[] = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const adapter = relevantAdapters[i]

      if (result.status === 'fulfilled') {
        dataPoints.push(...result.value)
      } else {
        errors.push({
          source: adapter.config.name,
          error: result.reason?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      }
    }

    return { dataPoints, errors }
  }
}
