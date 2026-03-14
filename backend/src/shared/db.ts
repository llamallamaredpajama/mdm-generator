/**
 * Shared Firestore access helpers.
 *
 * Most helpers have been replaced by the repository layer (P2).
 * Retained: getDb() (used by surveillance module and health checks),
 * serializeFirestoreDoc() (pure utility).
 */

import admin from 'firebase-admin'

/** Get the Firestore instance (requires Firebase Admin to be initialized) */
export const getDb = () => admin.firestore()

/** Convert Firestore doc to JSON-safe object, serializing Timestamps to ISO strings */
export function serializeFirestoreDoc(doc: admin.firestore.DocumentSnapshot): Record<string, unknown> {
  const data = doc.data()
  if (!data) return { id: doc.id }
  const result: Record<string, unknown> = { id: doc.id }
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      result[key] = value.toDate().toISOString()
    } else {
      result[key] = value
    }
  }
  return result
}
