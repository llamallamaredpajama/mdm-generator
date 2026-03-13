import { z } from 'zod'

export const QuickModeGenerateSchema = z.object({
  encounterId: z.string().min(1),
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
  location: z.object({
    zipCode: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
})
