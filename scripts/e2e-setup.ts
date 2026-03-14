/**
 * E2E Setup Script
 * Mints a Firebase ID token for the E2E test user and creates test encounter documents.
 *
 * Usage:
 *   cd backend && NODE_PATH=./node_modules npx tsx ../scripts/e2e-setup.ts
 *
 * Prerequisites:
 * - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON env var
 * - Backend running on localhost:8080 (for /v1/whoami call)
 * - frontend/.env with VITE_FIREBASE_API_KEY
 */

import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'
import { E2E_UID, TOKEN_PATH, initFirebaseAdmin } from './lib/e2e-config.js'

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFirebaseApiKey(): string {
  // Script runs from backend/ dir, so ../frontend/.env
  const envPath = path.resolve(process.cwd(), '../frontend/.env')
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^VITE_FIREBASE_API_KEY=(.+)$/)
    if (match) return match[1].trim()
  }
  throw new Error(`VITE_FIREBASE_API_KEY not found in ${envPath}`)
}

// ---------------------------------------------------------------------------
// Step 1: Mint token
// ---------------------------------------------------------------------------

async function mintToken(): Promise<string> {
  console.log('[setup] Step 1: Minting ID token...')

  const customToken = await admin.auth().createCustomToken(E2E_UID)
  const apiKey = getFirebaseApiKey()

  // Exchange custom token for ID token via Firebase Auth REST API
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${body}`)
  }

  const data = await res.json() as { idToken: string }
  const idToken = data.idToken

  // Write token to temp file with 0600 perms
  fs.writeFileSync(TOKEN_PATH, idToken, { mode: 0o600 })
  console.log(`[setup] Token minted (${idToken.substring(0, 10)}...)`)
  console.log(`[setup] Written to ${TOKEN_PATH}`)

  return idToken
}

// ---------------------------------------------------------------------------
// Step 2: Ensure user exists
// ---------------------------------------------------------------------------

async function ensureUser(token: string): Promise<void> {
  console.log('[setup] Step 2: Ensuring user exists via /v1/whoami...')

  const res = await fetch(`${BASE_URL}/v1/whoami`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`/v1/whoami failed (${res.status}): ${body}`)
  }

  const data = await res.json() as { uid: string; plan: string }
  console.log(`[setup] User confirmed: uid=${data.uid}, plan=${data.plan}`)
}

// ---------------------------------------------------------------------------
// Step 3: Create test encounters
// ---------------------------------------------------------------------------

async function createTestEncounters(): Promise<void> {
  console.log('[setup] Step 3: Creating test encounters...')

  const db = admin.firestore()
  const now = admin.firestore.FieldValue.serverTimestamp()

  const defaultSection = {
    status: 'pending',
    content: '',
    submissionCount: 0,
    isLocked: false,
  }

  // Create both encounters in parallel (independent Firestore writes)
  await Promise.all([
    db.doc(`customers/${E2E_UID}/encounters/e2e-build-test`).set({
      userId: E2E_UID,
      roomNumber: 'E2E-1',
      chiefComplaint: 'chest pain',
      status: 'draft',
      mode: 'build',
      quotaCounted: false,
      createdAt: now,
      updatedAt: now,
      shiftStartedAt: now,
      currentSection: 1,
      section1: { ...defaultSection },
      section2: { ...defaultSection },
      section3: { ...defaultSection },
    }),
    db.doc(`customers/${E2E_UID}/encounters/e2e-quick-test`).set({
      userId: E2E_UID,
      roomNumber: 'E2E-2',
      chiefComplaint: 'chest pain',
      status: 'draft',
      mode: 'quick',
      quotaCounted: false,
      createdAt: now,
      updatedAt: now,
      shiftStartedAt: now,
      currentSection: 1,
      quickModeData: { narrative: '', status: 'draft' },
      section1: { ...defaultSection },
      section2: { ...defaultSection },
      section3: { ...defaultSection },
    }),
  ])
  console.log('[setup] Created encounters: e2e-build-test, e2e-quick-test')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const projectId = initFirebaseAdmin()
  console.log(`[setup] Project: ${projectId}`)

  const token = await mintToken()
  await ensureUser(token)
  await createTestEncounters()

  console.log('[setup] Done — ready for E2E tests')
}

main().catch((err) => {
  console.error('[setup] Fatal:', err)
  process.exit(1)
})
