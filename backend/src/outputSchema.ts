import { z } from 'zod'
import { PHYSICIAN_ATTESTATION } from './constants.js'

// Accept both old 'disclaimers' and new 'attestation' from LLM output
const RawMdmSchema = z.object({
  differential: z.union([z.string(), z.array(z.string())]),
  data_reviewed_ordered: z.union([z.string(), z.array(z.string())]),
  decision_making: z.string(),
  risk: z.union([z.string(), z.array(z.string())]),
  disposition: z.string().optional().default(''),
  attestation: z.union([z.string(), z.array(z.string())]).optional(),
  disclaimers: z.union([z.string(), z.array(z.string())]).optional(),
})

export const MdmSchema = RawMdmSchema.transform((data) => {
  const { disclaimers, attestation, ...rest } = data
  return {
    ...rest,
    attestation: attestation ?? disclaimers ?? PHYSICIAN_ATTESTATION,
  }
})

export type Mdm = z.infer<typeof MdmSchema>

export function renderMdmText(mdm: Mdm): string {
  const lines: string[] = []
  const asBullet = (val: string | string[], title: string) => {
    if (!val || (Array.isArray(val) && val.length === 0)) return
    lines.push(`${title}:`)
    if (Array.isArray(val)) {
      for (const v of val) lines.push(`- ${v}`)
    } else {
      lines.push(val)
    }
    lines.push('')
  }

  asBullet(mdm.differential, 'Differential')
  asBullet(mdm.data_reviewed_ordered, 'Data reviewed/ordered')
  if (mdm.decision_making) {
    lines.push('Decision making:')
    lines.push(mdm.decision_making)
    lines.push('')
  }
  asBullet(mdm.risk, 'Risk')
  if (mdm.disposition) {
    lines.push('Disposition:')
    lines.push(mdm.disposition)
    lines.push('')
  }
  if (mdm.attestation) {
    lines.push('Attestation:')
    if (Array.isArray(mdm.attestation)) {
      for (const d of mdm.attestation) lines.push(`- ${d}`)
    } else {
      lines.push(mdm.attestation)
    }
  }
  return lines.join('\n')
}
