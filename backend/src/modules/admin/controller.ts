import type { Request, Response } from 'express'
import admin from 'firebase-admin'
import { userService } from '../../services/userService'
import { AdminPlanSchema } from './schemas'

export async function setPlan(req: Request, res: Response) {
  try {
    const parsed = AdminPlanSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request' })

    // Verify admin token
    try {
      const decoded = await admin.auth().verifyIdToken(parsed.data.adminToken)
      if (!decoded.admin) {
        return res.status(403).json({ error: 'Admin access required' })
      }
    } catch (e) {
      return res.status(401).json({ error: 'Invalid admin token' })
    }

    await userService.adminSetPlan(parsed.data.targetUid, parsed.data.plan)

    return res.json({
      ok: true,
      message: `User ${parsed.data.targetUid} updated to ${parsed.data.plan} plan`,
    })
  } catch (e: unknown) {
    console.error('admin/set-plan error:', e instanceof Error ? e.message : 'unknown error')
    return res.status(500).json({ error: 'Internal error' })
  }
}
