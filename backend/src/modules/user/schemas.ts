import { z } from 'zod'

export const CompleteOnboardingSchema = z.object({
  displayName: z.string().min(1).max(100),
  credentialType: z.enum(['MD', 'DO', 'NP', 'PA']),
  surveillanceLocation: z.object({
    state: z.string().length(2).optional(),
    zipCode: z.string().regex(/^\d{5}$/).optional(),
  }).optional(),
  acknowledgedLimitations: z.literal(true),
})
