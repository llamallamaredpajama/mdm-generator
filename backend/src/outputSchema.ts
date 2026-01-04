import { z } from 'zod'

export const MdmSchema = z.object({
  differential: z.union([z.string(), z.array(z.string())]),
  data_reviewed_ordered: z.union([z.string(), z.array(z.string())]),
  decision_making: z.string(),
  risk: z.union([z.string(), z.array(z.string())]),
  disposition: z.string().optional().default(''),
  disclaimers: z.union([z.string(), z.array(z.string())]).optional().default('Educational draft. Physician must review. No PHI.'),
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
  if (mdm.disclaimers) {
    lines.push('Notes:')
    if (Array.isArray(mdm.disclaimers)) {
      for (const d of mdm.disclaimers) lines.push(`- ${d}`)
    } else {
      lines.push(mdm.disclaimers)
    }
  }
  return lines.join('\n')
}
