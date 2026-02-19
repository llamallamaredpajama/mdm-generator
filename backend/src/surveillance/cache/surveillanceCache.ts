/**
 * Surveillance Cache
 * Firestore-backed cache with per-source TTL enforcement.
 * Used to avoid redundant CDC API calls within the cache window.
 */

import admin from 'firebase-admin'
import type { SurveillanceDataPoint } from '../types'

/** Sanitize a cache key to be a valid Firestore document ID */
function sanitizeKey(key: string): string {
  return key.replace(/[\/\\. ]/g, '_').slice(0, 128)
}

export class SurveillanceCache {
  private collectionName = 'surveillance_cache'

  /**
   * Get cached data if it exists and hasn't expired.
   * Returns null if expired or not found.
   */
  async get(key: string): Promise<SurveillanceDataPoint[] | null> {
    try {
      const db = admin.firestore()
      const docRef = db.collection(this.collectionName).doc(sanitizeKey(key))
      const snap = await docRef.get()

      if (!snap.exists) return null

      const data = snap.data()!
      const expiresAt = data.expiresAt?.toMillis?.() ?? data.expiresAt
      if (typeof expiresAt === 'number' && Date.now() > expiresAt) {
        // Expired — treat as miss
        return null
      }

      return (data.dataPoints as SurveillanceDataPoint[]) || null
    } catch (error) {
      console.warn('Cache get failed:', error)
      return null
    }
  }

  /**
   * Store data in cache with a specified TTL.
   */
  async set(key: string, data: SurveillanceDataPoint[], ttlMs: number): Promise<void> {
    try {
      const db = admin.firestore()
      const docRef = db.collection(this.collectionName).doc(sanitizeKey(key))
      await docRef.set({
        dataPoints: data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
        key: sanitizeKey(key),
      })
    } catch (error) {
      console.warn('Cache set failed:', error)
      // Cache failures are non-critical — do not throw
    }
  }
}
