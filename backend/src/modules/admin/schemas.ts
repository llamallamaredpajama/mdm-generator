import { z } from 'zod'

export const AdminPlanSchema = z.object({
  adminToken: z.string().min(10),
  targetUid: z.string().min(1),
  plan: z.enum(['free', 'pro', 'enterprise']),
})

/** Body-only variant for use with auth middleware (adminToken handled by Bearer header) */
export const AdminPlanBodySchema = z.object({
  targetUid: z.string().min(1),
  plan: z.enum(['free', 'pro', 'enterprise']),
})
