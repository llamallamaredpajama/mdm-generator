import { z } from 'zod'

export const AdminPlanSchema = z.object({
  adminToken: z.string().min(10),
  targetUid: z.string().min(1),
  plan: z.enum(['free', 'pro', 'enterprise']),
})
