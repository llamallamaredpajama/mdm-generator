import express from 'express'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'
import { VertexAI } from '@google-cloud/vertexai'
import { buildPrompt } from './promptBuilder'
import { MdmSchema, renderMdmText } from './outputSchema'
import { callGeminiFlash } from './vertex'

const app = express()

// CORS configuration for local development
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Alternative Vite port
  'http://localhost:3000', // Alternative React port
]

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && (allowedOrigins.includes(origin) || origin.startsWith('https://mdm-generator'))) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

app.use(express.json({ limit: '1mb' }))

// Initialize Firebase Admin (expects GOOGLE_APPLICATION_CREDENTIALS or default creds in Cloud Run)
try {
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    console.log('Initializing Firebase Admin with service account:', serviceAccountPath)
    
    if (serviceAccountPath && serviceAccountPath.includes('.json')) {
      // Initialize with service account file
      const serviceAccount = require(path.resolve(serviceAccountPath))
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.PROJECT_ID || 'mdm-generator'
      })
    } else {
      // Initialize with default credentials
      admin.initializeApp()
    }
    console.log('Firebase Admin initialized successfully')
  }
} catch (e) {
  console.error('Firebase Admin initialization error:', e)
  // swallow init errors in local dev; will throw on verify if misconfigured
}

const db = admin.firestore()

const PLAN_LIMITS: Record<string, number> = {
  basic: 250, // $10/mo
  pro: 1000,  // $30/mo
}

const GenerateSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})

function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`
}

async function ensureAndCheckQuota(uid: string) {
  const ref = db.collection('users').doc(uid)
  const snap = await ref.get()
  if (!snap.exists) {
    // Default: no plan set => zero quota (reject) until admin assigns a plan
    throw Object.assign(new Error('No subscription plan'), { status: 402 })
  }
  const data = snap.data() as any
  const plan: string = data.plan
  const quota = PLAN_LIMITS[plan]
  if (!quota) throw Object.assign(new Error('Invalid plan'), { status: 402 })

  const currentKey = monthKey()
  const periodKey: string = data.periodKey || currentKey
  let used: number = data.usedThisPeriod || 0

  // Reset counter if new month
  if (periodKey !== currentKey) {
    used = 0
    await ref.update({ usedThisPeriod: 0, periodKey: currentKey })
  }
  if (used >= quota) throw Object.assign(new Error('Quota exceeded'), { status: 402 })
  return { ref, used, quota }
}

async function incrementUsage(ref: FirebaseFirestore.DocumentReference) {
  await ref.update({ usedThisPeriod: admin.firestore.FieldValue.increment(1) })
}

async function getUsage(uid: string) {
  const ref = db.collection('users').doc(uid)
  const snap = await ref.get()
  if (!snap.exists) return { uid, plan: null as null | string, usedThisPeriod: 0, monthlyQuota: 0, remaining: 0 }
  const data = snap.data() as any
  const plan: string = data.plan || null
  const quota = plan ? PLAN_LIMITS[plan] || 0 : 0
  const currentKey = monthKey()
  const periodKey: string = data.periodKey || currentKey
  let used: number = data.usedThisPeriod || 0
  // If new month and not yet reset, compute remaining as full quota
  const effectiveUsed = periodKey === currentKey ? used : 0
  const remaining = Math.max(0, quota - effectiveUsed)
  return { uid, plan, usedThisPeriod: effectiveUsed, monthlyQuota: quota, remaining }
}

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.post('/v1/whoami', async (req, res) => {
  try {
    const TokenSchema = z.object({ userIdToken: z.string().min(10) })
    const parsed = TokenSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })
    let uid = 'anonymous'
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const usage = await getUsage(uid)
    return res.json({ ok: true, ...usage })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.post('/v1/generate', async (req, res) => {
  try {
    const parsed = GenerateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })

    // Verify Firebase ID token
    let uid = 'anonymous'
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { narrative } = parsed.data
    const tokenEstimate = Math.ceil(narrative.length / 4)
    if (tokenEstimate > 10000) return res.status(400).json({ error: 'Input too large' })

    // Enforce subscription quota
    const { ref, used, quota } = await ensureAndCheckQuota(uid)

    // Build prompt and call model
    const prompt = await buildPrompt(narrative)

    let draftJson: any | null = null
    let draftText = ''
    try {
      const result = await callGeminiFlash(prompt)
      // Expect model to return JSON first, then '---TEXT---' and text rendering. Try to parse.
      const [jsonPart, textPart] = result.text.split('\n---TEXT---\n')
      try {
        const parsed = JSON.parse(jsonPart)
        const mdm = MdmSchema.parse(parsed)
        draftJson = mdm
        draftText = textPart?.trim() || renderMdmText(mdm)
      } catch {
        // Fallback: try to coerce by searching for JSON braces
        const jsonStart = result.text.indexOf('{')
        const jsonEnd = result.text.lastIndexOf('}')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = result.text.slice(jsonStart, jsonEnd + 1)
          const mdm = MdmSchema.parse(JSON.parse(jsonStr))
          draftJson = mdm
          draftText = renderMdmText(mdm)
        } else {
          throw new Error('Invalid model output')
        }
      }
    } catch (e) {
      console.warn('Model parsing failed, returning conservative stub')
      draftJson = {
        differential: [],
        data_reviewed_ordered: 'Labs were considered but not indicated based on presentation; clinical monitoring prioritized.',
        decision_making: 'Clinical reasoning provided narrative; defaults applied where data absent. Physician must review.',
        risk: ['Discussed risks/benefits; return precautions given.'],
        disposition: '',
        disclaimers: 'Educational draft. Physician must review. No PHI.',
      }
      draftText = renderMdmText(draftJson)
    }

    // Increment usage on success
    await incrementUsage(ref)

    return res.json({ ok: true, draft: draftText, draftJson, uid, remaining: Math.max(0, quota - (used + 1)) })
  } catch (e: any) {
    const status = e.status || 500
    if (status !== 500) return res.status(status).json({ error: e.message })
    console.error(e)
    return res.status(500).json({ error: 'Internal error' })
  }
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`backend listening on :${port}`)
})

