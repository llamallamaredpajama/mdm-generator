/**
 * Generic in-memory cache with request deduplication.
 *
 * The pending map prevents concurrent expired-cache reads from triggering
 * multiple identical Firestore queries (thundering herd on cache miss).
 */

export interface CacheService<T> {
  get(key: string): T | null
  set(key: string, value: T): void
  getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T>
}

export class InMemoryCache<T> implements CacheService<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>()
  private pending = new Map<string, Promise<T>>()

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }

  /**
   * Get from cache, or fetch and store. Deduplicates concurrent fetches.
   */
  async getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) return cached

    // Request deduplication: if a fetch is already in flight, await it
    const existing = this.pending.get(key)
    if (existing) return existing

    const promise = fetcher().then((value) => {
      this.set(key, value)
      this.pending.delete(key)
      return value
    }).catch((err) => {
      this.pending.delete(key)
      throw err
    })

    this.pending.set(key, promise)
    return promise
  }
}
