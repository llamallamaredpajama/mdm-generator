import type { Request, Response } from 'express'
import type { AdminDeps } from '../../dependencies.js'

export function createAdminController({ userService }: AdminDeps) {
  return {
    setPlan: async (req: Request, res: Response) => {
      const { targetUid, plan } = req.body

      await userService.adminSetPlan(targetUid, plan)

      req.log!.info({ action: 'admin-set-plan', targetUid, plan })

      return res.json({
        ok: true,
        message: `User ${targetUid} updated to ${plan} plan`,
      })
    },
  }
}
