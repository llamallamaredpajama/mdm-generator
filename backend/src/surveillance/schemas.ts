/**
 * Zod validation schemas for surveillance API endpoints.
 */

import { z } from 'zod'

/** Schema for POST /v1/surveillance/analyze */
export const TrendAnalysisRequestSchema = z.object({
  userIdToken: z.string().min(10),
  chiefComplaint: z.string().min(1).max(500),
  differential: z.array(z.string()).min(1).max(20),
  location: z.object({
    zipCode: z.string().regex(/^\d{5}$/).optional(),
    state: z.string().length(2).optional(),
  }).refine(
    (loc) => loc.zipCode || loc.state,
    { message: 'Either zipCode or state must be provided' }
  ),
})

export type TrendAnalysisRequest = z.infer<typeof TrendAnalysisRequestSchema>

/** Schema for POST /v1/surveillance/report */
export const TrendReportRequestSchema = z.object({
  userIdToken: z.string().min(10),
  analysisId: z.string().uuid(),
})

export type TrendReportRequest = z.infer<typeof TrendReportRequestSchema>
