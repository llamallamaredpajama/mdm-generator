import type { Request, Response } from 'express'
import { userService } from '../../services/userService'

export async function setPlan(req: Request, res: Response) {
  const { targetUid, plan } = req.body

  await userService.adminSetPlan(targetUid, plan)

  req.log!.info({ action: 'admin-set-plan', targetUid, plan })

  return res.json({
    ok: true,
    message: `User ${targetUid} updated to ${plan} plan`,
  })
}
