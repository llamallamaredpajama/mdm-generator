/**
 * E2E Cleanup Script
 * Removes all E2E test data from Firestore and deletes the token file.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   cd backend && NODE_PATH=./node_modules npx tsx ../scripts/e2e-cleanup.ts
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import { E2E_UID, TOKEN_PATH, initFirebaseAdmin } from './lib/e2e-config.js'

async function main() {
  const projectId = initFirebaseAdmin()
  console.log(`[cleanup] Project: ${projectId}`)
  console.log(`[cleanup] Removing E2E data for uid: ${E2E_UID}`)

  const db = admin.firestore()

  // Delete independent subcollections in parallel
  await Promise.all([
    db.recursiveDelete(db.collection(`customers/${E2E_UID}/encounters`)),
    db.recursiveDelete(db.collection(`customers/${E2E_UID}/usage`)),
  ])
  console.log('[cleanup] Deleted encounters + usage subcollections')

  // Delete root docs (safe after subcollections are gone)
  await Promise.all([
    db.doc(`customers/${E2E_UID}`).delete(),
    db.doc(`users/${E2E_UID}`).delete(),
  ])
  console.log('[cleanup] Deleted customer + user docs')

  // Delete token file (no pre-check — handle error directly)
  try {
    fs.unlinkSync(TOKEN_PATH)
    console.log(`[cleanup] Deleted ${TOKEN_PATH}`)
  } catch {
    console.log(`[cleanup] No token file at ${TOKEN_PATH} (already clean)`)
  }

  console.log('[cleanup] Done')
}

main().catch((err) => {
  console.error('[cleanup] Fatal:', err)
  process.exit(1)
})
