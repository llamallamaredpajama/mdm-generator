/**
 * Cross-batch CDR Interactivity Validation
 *
 * TDD anchor test: validates that EVERY CDR in the library has sufficient
 * user-answerable interactive components for the frontend to render.
 *
 * A component is "user-answerable" IFF:
 *   (type === 'boolean' || type === 'select') && (source === 'section1' || source === 'user_input')
 *
 * Minimum requirement: 3 user-answerable components per CDR.
 */
import { describe, it, expect } from 'vitest'
import type { CdrComponent, CdrSeed } from '../types'

import { batch1CardioCdrs } from '../batch-1-cardio'
import { batch2TraumaCdrs } from '../batch-2-trauma'
import { batch3PulmGiCdrs } from '../batch-3-pulm-gi'
import { batch4NeuroCdrs } from '../batch-4-neuro'
import { batch5IdToxCdrs } from '../batch-5-id-tox'
import { batch6CritPedsCdrs } from '../batch-6-crit-peds'
import { batch7MiscCdrs } from '../batch-7-misc'
import { batch8CardioIiCdrs } from '../batch-8-cardio-ii'
import { batch9CardioIiiCdrs } from '../batch-9-cardio-iii'
import { batch10PulmNeuroCdrs } from '../batch-10-pulm-neuro'
import { batch11NeuroTraumaCdrs } from '../batch-11-neuro-trauma'
import { batch12GiIdCdrs } from '../batch-12-gi-id'
import { batch13IdToxCdrs } from '../batch-13-id-tox'
import { batch14PedsHemeCdrs } from '../batch-14-peds-heme'
import { batch15DispositionProcCdrs } from '../batch-15-disposition-proc'
import { batch16EnviroObPsychCdrs } from '../batch-16-enviro-ob-psych'
import { batch17PsychBurnsNephroCdrs } from '../batch-17-psych-burns-nephro'
import { batch18NephroOncCdrs } from '../batch-18-nephro-onc'
import { batch19OncDermEntCdrs } from '../batch-19-onc-derm-ent'
import { batch20OrthoGeriPallCdrs } from '../batch-20-ortho-geri-pall'

const ALL_CDRS: CdrSeed[] = [
  ...batch1CardioCdrs,
  ...batch2TraumaCdrs,
  ...batch3PulmGiCdrs,
  ...batch4NeuroCdrs,
  ...batch5IdToxCdrs,
  ...batch6CritPedsCdrs,
  ...batch7MiscCdrs,
  ...batch8CardioIiCdrs,
  ...batch9CardioIiiCdrs,
  ...batch10PulmNeuroCdrs,
  ...batch11NeuroTraumaCdrs,
  ...batch12GiIdCdrs,
  ...batch13IdToxCdrs,
  ...batch14PedsHemeCdrs,
  ...batch15DispositionProcCdrs,
  ...batch16EnviroObPsychCdrs,
  ...batch17PsychBurnsNephroCdrs,
  ...batch18NephroOncCdrs,
  ...batch19OncDermEntCdrs,
  ...batch20OrthoGeriPallCdrs,
]

function isUserAnswerable(c: CdrComponent): boolean {
  return (
    (c.type === 'boolean' || c.type === 'select') &&
    (c.source === 'section1' || c.source === 'user_input')
  )
}

describe('CDR Interactivity Validation (all batches)', () => {
  it('has at least one CDR loaded', () => {
    expect(ALL_CDRS.length).toBeGreaterThan(0)
  })

  it('all CDR IDs are globally unique', () => {
    const ids = ALL_CDRS.map((c) => c.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes).toEqual([])
  })

  describe.each(ALL_CDRS.map((cdr) => [cdr.id, cdr] as const))(
    '%s',
    (_id, cdr) => {
      it('has at least 3 components', () => {
        expect(cdr.components.length).toBeGreaterThanOrEqual(3)
      })

      it('has at least 3 user-answerable components (boolean/select + section1/user_input)', () => {
        const answerable = cdr.components.filter(isUserAnswerable)
        expect(
          answerable.length,
          `${cdr.id} has only ${answerable.length} user-answerable components: ${answerable.map((c) => c.id).join(', ') || '(none)'}. ` +
            `All components: ${cdr.components.map((c) => `${c.id}(${c.type}/${c.source})`).join(', ')}`
        ).toBeGreaterThanOrEqual(3)
      })

      it('every boolean component has a numeric value', () => {
        const booleans = cdr.components.filter((c) => c.type === 'boolean')
        for (const b of booleans) {
          expect(
            typeof b.value,
            `${cdr.id}.${b.id} is boolean but has no numeric value`
          ).toBe('number')
        }
      })

      it('every select component has non-empty options with numeric values', () => {
        const selects = cdr.components.filter((c) => c.type === 'select')
        for (const s of selects) {
          expect(
            s.options?.length,
            `${cdr.id}.${s.id} is select but has no options`
          ).toBeGreaterThan(0)
          for (const opt of s.options ?? []) {
            expect(
              typeof opt.value,
              `${cdr.id}.${s.id} option "${opt.label}" has non-numeric value`
            ).toBe('number')
          }
        }
      })

      it('has no unsupported component types', () => {
        const supportedTypes = ['boolean', 'select', 'number_range', 'algorithm']
        for (const c of cdr.components) {
          expect(
            supportedTypes,
            `${cdr.id}.${c.id} has unsupported type "${c.type}"`
          ).toContain(c.type)
        }
      })

      if (cdr.scoring.method === 'sum') {
        it('scoring ranges cover the achievable score range', () => {
          let minPossible = 0
          let maxPossible = 0
          for (const c of cdr.components) {
            if (c.type === 'boolean') {
              // boolean contributes 0 or value
              const v = c.value ?? 0
              if (v >= 0) {
                maxPossible += v
              } else {
                minPossible += v
              }
            } else if (c.type === 'select' && c.options?.length) {
              const vals = c.options.map((o) => o.value)
              minPossible += Math.min(...vals)
              maxPossible += Math.max(...vals)
            }
          }

          const rangeMin = Math.min(...cdr.scoring.ranges.map((r) => r.min))
          const rangeMax = Math.max(...cdr.scoring.ranges.map((r) => r.max))

          expect(
            rangeMin,
            `${cdr.id} scoring range starts at ${rangeMin} but min achievable is ${minPossible}`
          ).toBeLessThanOrEqual(minPossible)
          expect(
            rangeMax,
            `${cdr.id} scoring range ends at ${rangeMax} but max achievable is ${maxPossible}`
          ).toBeGreaterThanOrEqual(maxPossible)
        })
      }
    }
  )
})
