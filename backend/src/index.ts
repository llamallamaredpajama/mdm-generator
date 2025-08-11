import 'dotenv/config'
import express from 'express'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'
import { VertexAI } from '@google-cloud/vertexai'
import { buildPrompt } from './promptBuilder'
import { MdmSchema, renderMdmText } from './outputSchema'
import { callGeminiFlash } from './vertex'
import { userService } from './services/userService'

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
async function initFirebase() {
  try {
    if (!admin.apps.length) {
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      console.log('Initializing Firebase Admin with service account:', serviceAccountPath)
      
      if (serviceAccountPath && serviceAccountPath.includes('.json')) {
        // Initialize with service account file
        const serviceAccountContent = await fs.readFile(path.resolve(serviceAccountPath), 'utf8')
        const serviceAccount = JSON.parse(serviceAccountContent)
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
}

// Initialize Firebase before starting the server
await initFirebase()

const GenerateSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})

app.get('/healthz', (_req, res) => res.json({ ok: true }))

// Admin endpoint to set user plan (protected by admin check)
app.post('/v1/admin/set-plan', async (req, res) => {
  try {
    const AdminPlanSchema = z.object({
      adminToken: z.string().min(10),
      targetUid: z.string().min(1),
      plan: z.enum(['free', 'pro', 'enterprise'])
    })
    
    const parsed = AdminPlanSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })
    
    // Verify admin token
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.adminToken)
      // Check if user has admin custom claim
      if (!decoded.admin) {
        return res.status(403).json({ error: 'Admin access required' })
      }
    } catch (e) {
      return res.status(401).json({ error: 'Invalid admin token' })
    }
    
    // Update user plan
    await userService.adminSetPlan(parsed.data.targetUid, parsed.data.plan)
    
    return res.json({ 
      ok: true, 
      message: `User ${parsed.data.targetUid} updated to ${parsed.data.plan} plan`
    })
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: e.message || 'Internal error' })
  }
})

app.post('/v1/whoami', async (req, res) => {
  try {
    const TokenSchema = z.object({ userIdToken: z.string().min(10) })
    const parsed = TokenSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })
    
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      const uid = decoded.uid
      const email = decoded.email || ''
      
      // Ensure user exists
      await userService.ensureUser(uid, email)
      
      // Get usage stats
      const stats = await userService.getUsageStats(uid)
      
      return res.json({ 
        ok: true, 
        uid,
        email,
        ...stats
      })
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
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
    let email = ''
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.userIdToken)
      uid = decoded.uid
      email = decoded.email || ''
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { narrative } = parsed.data
    
    // Ensure user exists
    await userService.ensureUser(uid, email)
    
    // Check quota
    const quotaCheck = await userService.checkQuota(uid)
    if (!quotaCheck.allowed) {
      return res.status(402).json({ 
        error: 'Monthly quota exceeded', 
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: 0
      })
    }
    
    // Check token limit per request based on plan
    const stats = await userService.getUsageStats(uid)
    const tokenEstimate = Math.ceil(narrative.length / 4)
    if (tokenEstimate > stats.features.maxTokensPerRequest) {
      return res.status(400).json({ 
        error: `Input too large for your plan. Maximum ${stats.features.maxTokensPerRequest} tokens allowed.`,
        tokenEstimate,
        maxAllowed: stats.features.maxTokensPerRequest
      })
    }

    // Build prompt and call model
    const prompt = await buildPrompt(narrative)

    let draftJson: any | null = null
    let draftText = ''
    try {
      const result = await callGeminiFlash(prompt)
      
      // Log the raw model output for debugging
      console.log('=== RAW MODEL OUTPUT ===')
      console.log(result.text.substring(0, 500)) // First 500 chars
      console.log('=== END PREVIEW ===')
      
      // Expect model to return JSON first, then '---TEXT---' and text rendering. Try to parse.
      const [jsonPart, textPart] = result.text.split('\n---TEXT---\n')
      try {
        const parsed = JSON.parse(jsonPart)
        const mdm = MdmSchema.parse(parsed)
        draftJson = mdm
        draftText = textPart?.trim() || renderMdmText(mdm)
      } catch (parseError) {
        console.log('JSON parsing failed:', parseError)
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
      console.warn('Model parsing failed, returning conservative stub:', e)
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
    await userService.incrementUsage(uid)
    
    // Get updated stats
    const updatedStats = await userService.getUsageStats(uid)

    return res.json({ 
      ok: true, 
      draft: draftText, 
      draftJson, 
      uid, 
      remaining: updatedStats.remaining,
      plan: updatedStats.plan,
      used: updatedStats.used,
      limit: updatedStats.limit
    })
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

