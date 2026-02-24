import { z } from 'zod'

// ── Order Set ──────────────────────────────────────────────────────────

export const OrderSetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  tests: z.array(z.string().min(1)).min(1).max(50),
  tags: z.array(z.string().min(1)).max(20).default([]),
})
export type OrderSetCreate = z.infer<typeof OrderSetCreateSchema>

export interface OrderSet {
  id: string
  name: string
  tests: string[]
  tags: string[]
  createdAt: FirebaseFirestore.Timestamp
  usageCount: number
}

// ── Disposition Flow ───────────────────────────────────────────────────

export const DispositionFlowCreateSchema = z.object({
  name: z.string().min(1).max(100),
  disposition: z.string().min(1),
  followUp: z.array(z.string().min(1)).max(20).default([]),
})
export type DispositionFlowCreate = z.infer<typeof DispositionFlowCreateSchema>

export interface DispositionFlow {
  id: string
  name: string
  disposition: string
  followUp: string[]
  createdAt: FirebaseFirestore.Timestamp
  usageCount: number
}

// ── Report Template ────────────────────────────────────────────────────

export const ReportTemplateCreateSchema = z.object({
  testId: z.string().min(1),
  name: z.string().min(1).max(100),
  text: z.string().min(1).max(2000),
  defaultStatus: z.enum(['unremarkable', 'abnormal']),
})
export type ReportTemplateCreate = z.infer<typeof ReportTemplateCreateSchema>

export interface ReportTemplate {
  id: string
  testId: string
  name: string
  text: string
  defaultStatus: 'unremarkable' | 'abnormal'
  createdAt: FirebaseFirestore.Timestamp
  usageCount: number
}

// ── Customizable Options ───────────────────────────────────────────────

export const CustomizableOptionsSchema = z.object({
  dispositionOptions: z.array(z.string().min(1)).max(30).default([]),
  followUpOptions: z.array(z.string().min(1)).max(30).default([]),
})
export type CustomizableOptions = z.infer<typeof CustomizableOptionsSchema>
