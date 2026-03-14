/**
 * Shared E2E test configuration and Firebase Admin initialization.
 * Used by e2e-setup.ts and e2e-cleanup.ts.
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

export const E2E_UID = 'e2e-test-DO-NOT-REUSE'
export const ALLOWED_PROJECTS = ['mdm-generator']
export const TOKEN_PATH = '/tmp/e2e-token.txt'

/**
 * Initialize Firebase Admin SDK using the same credential priority chain
 * as backend/src/index.ts: JSON env → file path → default credentials.
 * Aborts if the resolved project ID is not in the allowlist.
 *
 * Returns the project ID for logging.
 */
export function initFirebaseAdmin(): string {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

    if (serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        projectId: process.env.PROJECT_ID || 'mdm-generator',
      })
    } else if (serviceAccountPath && serviceAccountPath.includes('.json')) {
      const content = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(content)),
        projectId: process.env.PROJECT_ID || 'mdm-generator',
      })
    } else {
      admin.initializeApp()
    }
  }

  const projectId = admin.app().options.projectId ?? process.env.PROJECT_ID
  if (!projectId || !ALLOWED_PROJECTS.includes(projectId)) {
    console.error(`Aborting: project "${projectId}" not in allowed list: ${ALLOWED_PROJECTS.join(', ')}`)
    process.exit(1)
  }

  return projectId
}
