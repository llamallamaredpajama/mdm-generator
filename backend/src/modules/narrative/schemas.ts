import { z } from 'zod'

export const ParseNarrativeSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})
