/**
 * Firestore factory.
 *
 * Centralizes Firestore instance access. Will be the composition root
 * for repository construction.
 */

import admin from 'firebase-admin'

let _db: FirebaseFirestore.Firestore | null = null

/**
 * Get the Firestore instance (lazily cached after first call).
 * @deprecated Use DI-injected db instance from the composition root instead.
 */
export function getFirestore(): FirebaseFirestore.Firestore {
  if (!_db) {
    _db = admin.firestore()
  }
  return _db
}
