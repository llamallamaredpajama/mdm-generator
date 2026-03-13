import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { getCachedCdrLibrary, getCachedTestLibraryResponse } from '../../shared/libraryCache'

export async function getTests(req: Request, res: Response) {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1]
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' })
    try {
      await admin.auth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. EXECUTE — use shared cache
    const response = await getCachedTestLibraryResponse()

    // 3. AUDIT
    console.log({ action: 'get-test-library', testCount: response.tests.length, timestamp: new Date().toISOString() })

    // 4. RESPOND
    return res.json(response)
  } catch (e: unknown) {
    console.error('get-test-library error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function getCdrs(req: Request, res: Response) {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1]
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' })
    try {
      await admin.auth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. EXECUTE — use shared cache helper
    const cdrs = await getCachedCdrLibrary()

    // 3. AUDIT
    console.log({ action: 'list-cdrs', cdrCount: cdrs.length, timestamp: new Date().toISOString() })

    // 4. RESPOND
    return res.json({ ok: true, cdrs })
  } catch (error) {
    console.error('list-cdrs error:', error)
    return res.status(500).json({ error: 'Internal error' })
  }
}
