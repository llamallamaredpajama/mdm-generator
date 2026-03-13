/**
 * Shared Firestore access helpers.
 *
 * Provides typed document/collection references used across modules.
 * Will be replaced by repository layer in P2.
 */

import admin from 'firebase-admin'

/** Get the Firestore instance (requires Firebase Admin to be initialized) */
export const getDb = () => admin.firestore()

/** Get an encounter document reference */
export const getEncounterRef = (userId: string, encounterId: string) =>
  getDb().collection('customers').doc(userId).collection('encounters').doc(encounterId)

/** Get a user's customer document reference */
export const getUserDoc = (userId: string) =>
  getDb().collection('customers').doc(userId)

/** Get a user's order sets subcollection */
export const getOrderSetsCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('orderSets')

/** Get a user's disposition flows subcollection */
export const getDispoFlowsCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('dispoFlows')

/** Get a user's report templates subcollection */
export const getReportTemplatesCollection = (userId: string) =>
  getDb().collection('customers').doc(userId).collection('reportTemplates')

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
