import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { userService } from '../../services/userService'
import { getDb } from '../../shared/db'
import { buildAnalyticsInsightsPrompt } from '../../promptBuilderAnalytics'
import { callGemini } from '../../vertex'

export async function getInsights(req: Request, res: Response) {
  try {
    // 1. AUTHENTICATE
    const idToken = req.headers.authorization?.split('Bearer ')[1]
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' })
    let uid: string
    try {
      const decoded = await admin.auth().verifyIdToken(idToken)
      uid = decoded.uid
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. VALIDATE — no request body needed

    // 3. AUTHORIZE — require Pro, Enterprise, or Admin plan
    const user = await userService.getUser(uid)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const allowedPlans = ['pro', 'enterprise', 'admin']
    if (!allowedPlans.includes(user.plan)) {
      return res.status(403).json({ error: 'Pro plan or higher required' })
    }

    // 3b. FETCH gap data from customers collection (gap tallies live here, not in users)
    const customerDoc = await getDb().collection('customers').doc(uid).get()
    const customerData = customerDoc.exists ? customerDoc.data()! : null

    // 4. RATE-LIMIT — max once per hour per user
    const lastInsightsTs = customerData?.lastInsightsGeneratedAt
    if (lastInsightsTs) {
      const lastGenMs = lastInsightsTs.toMillis()
      const oneHourMs = 60 * 60 * 1000
      const elapsed = Date.now() - lastGenMs
      if (elapsed < oneHourMs) {
        return res.status(429).json({
          error: 'Insights can only be generated once per hour',
          retryAfterMs: oneHourMs - elapsed,
        })
      }
    }

    // 5. EXECUTE — build prompt from gap data and call Gemini
    const tallies = customerData?.gapTallies?.identified ?? {}
    const meta = customerData?.gapMeta ?? {}

    if (Object.keys(tallies).length === 0) {
      return res.json({ ok: true, insights: 'No documentation gap data available yet. Complete a few encounters to start seeing insights.' })
    }

    const prompt = buildAnalyticsInsightsPrompt(tallies, meta)
    const result = await callGemini(prompt)

    // 6. UPDATE — record generation timestamp
    await getDb().collection('customers').doc(uid).set(
      { lastInsightsGeneratedAt: admin.firestore.Timestamp.now() },
      { merge: true },
    )

    // 7. AUDIT — log action (no PHI)
    console.log({
      action: 'analytics-insights',
      uid,
      gapCount: Object.keys(tallies).length,
      timestamp: new Date().toISOString(),
    })

    // 8. RESPOND
    return res.json({ ok: true, insights: result.text })
  } catch (error) {
    console.error('analytics/insights error:', error instanceof Error ? error.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
}
