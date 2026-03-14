import { z } from 'zod'

export const ParseNarrativeSchema = z.object({
  narrative: z.string().min(1).max(16000),
  userIdToken: z.string().min(10),
})

/** Body-only variant for use with auth middleware */
export const ParseNarrativeBodySchema = ParseNarrativeSchema.omit({ userIdToken: true })
