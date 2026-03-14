import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { userService } from '../../services/userService'
import { getDb } from '../../shared/db'
import { buildAnalyticsInsightsPrompt } from '../../promptBuilderAnalytics'
import { callGemini } from '../../vertex'

export async function getInsights(req: Request, res: Response) {
  const uid = req.user!.uid

  // AUTHORIZE — require Pro, Enterprise, or Admin plan
  const user = await userService.getUser(uid)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const allowedPlans = ['pro', 'enterprise', 'admin']
  if (!allowedPlans.includes(user.plan)) {
    return res.status(403).json({ error: 'Pro plan or higher required' })
  }

  // FETCH gap data from customers collection
  const customerDoc = await getDb().collection('customers').doc(uid).get()
  const customerData = customerDoc.exists ? customerDoc.data()! : null

  // RATE-LIMIT — max once per hour per user
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

  // EXECUTE — build prompt from gap data and call Gemini
  const tallies = customerData?.gapTallies?.identified ?? {}
  const meta = customerData?.gapMeta ?? {}

  if (Object.keys(tallies).length === 0) {
    return res.json({ ok: true, insights: 'No documentation gap data available yet. Complete a few encounters to start seeing insights.' })
  }

  const prompt = buildAnalyticsInsightsPrompt(tallies, meta)
  const result = await callGemini(prompt)

  // UPDATE — record generation timestamp
  await getDb().collection('customers').doc(uid).set(
    { lastInsightsGeneratedAt: admin.firestore.Timestamp.now() },
    { merge: true },
  )

  req.log!.info({
    action: 'analytics-insights',
    uid,
    gapCount: Object.keys(tallies).length,
  })

  return res.json({ ok: true, insights: result.text })
}
