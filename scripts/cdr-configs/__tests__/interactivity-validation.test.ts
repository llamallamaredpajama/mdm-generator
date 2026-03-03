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
import { batch21RescueCardioCdrs } from '../batch-21-rescue-cardio'
import { batch22RescueHepaticCdrs } from '../batch-22-rescue-hepatic'
import { batch23RescuePedsCdrs } from '../batch-23-rescue-peds'
import { batch24RescueHemeCdrs } from '../batch-24-rescue-heme'
import { batch25RescuePulmCdrs } from '../batch-25-rescue-pulm'
import { batch26RescueId1Cdrs } from '../batch-26-rescue-id1'
import { batch27RescueId2Cdrs } from '../batch-27-rescue-id2'
import { batch28RescueObCdrs } from '../batch-28-rescue-ob'
import { batch29RescueGiCdrs } from '../batch-29-rescue-gi'
import { batch30RescueEndoCdrs } from '../batch-30-rescue-endo'

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
  // Rescue batches (quarantined CDRs with lab components converted to user_input)
  ...batch21RescueCardioCdrs,
  ...batch22RescueHepaticCdrs,
  ...batch23RescuePedsCdrs,
  ...batch24RescueHemeCdrs,
  ...batch25RescuePulmCdrs,
  ...batch26RescueId1Cdrs,
  ...batch27RescueId2Cdrs,
  ...batch28RescueObCdrs,
  ...batch29RescueGiCdrs,
  ...batch30RescueEndoCdrs,
]

function isUserAnswerable(c: CdrComponent): boolean {
  return (
    (c.type === 'boolean' || c.type === 'select') &&
    (c.source === 'section1' || c.source === 'user_input')
  )
}

const VALID_CATEGORIES = [
  'BURNS & WOUND MANAGEMENT',
  'CARDIOVASCULAR',
  'CRITICAL CARE & ICU',
  'DERMATOLOGY',
  'DISPOSITION / RISK STRATIFICATION',
  'ENDOCRINE',
  'ENT / OTOLARYNGOLOGY',
  'ENVIRONMENTAL',
  'GASTROINTESTINAL',
  'GENITOURINARY',
  'GERIATRICS & DELIRIUM',
  'HEMATOLOGY / COAGULATION',
  'INFECTIOUS DISEASE',
  'NEUROLOGY',
  'OB/GYN & OBSTETRIC EMERGENCY',
  'ONCOLOGIC EMERGENCY',
  'ORTHOPEDIC & MUSCULOSKELETAL',
  'PALLIATIVE CARE & PROGNOSIS',
  'PEDIATRIC',
  'PROCEDURAL / AIRWAY',
  'PSYCHIATRY & BEHAVIORAL HEALTH',
  'PULMONARY',
  'RHEUMATOLOGY',
  'TOXICOLOGY',
  'TRAUMA',
] as const

const VALID_AUTO_POPULATE = [
  'narrative_analysis',
  'physical_exam',
  'vital_signs',
  'vitals',
  'test_result',
] as const

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

  describe('Content quality and data integrity', () => {
    describe.each(ALL_CDRS.map((cdr) => [cdr.id, cdr] as const))(
      '%s',
      (_id, cdr) => {
        it('has a valid category', () => {
          expect(
            VALID_CATEGORIES as readonly string[],
            `${cdr.id} has unknown category "${cdr.category}"`,
          ).toContain(cdr.category)
        })

        it('has at least one applicableChiefComplaint', () => {
          expect(
            cdr.applicableChiefComplaints.length,
            `${cdr.id} has no applicableChiefComplaints`,
          ).toBeGreaterThan(0)
        })

        it('has at least one keyword', () => {
          expect(
            cdr.keywords.length,
            `${cdr.id} has no keywords`,
          ).toBeGreaterThan(0)
        })

        it('all component labels are non-empty', () => {
          for (const c of cdr.components) {
            expect(
              c.label.trim().length,
              `${cdr.id}.${c.id} has empty label`,
            ).toBeGreaterThan(0)
          }
        })

        it('autoPopulateFrom values are from known set', () => {
          for (const c of cdr.components) {
            if (c.autoPopulateFrom) {
              expect(
                VALID_AUTO_POPULATE as readonly string[],
                `${cdr.id}.${c.id} has unknown autoPopulateFrom "${c.autoPopulateFrom}"`,
              ).toContain(c.autoPopulateFrom)
            }
          }
        })

        it('scoring range min <= max for every range', () => {
          for (const range of cdr.scoring.ranges) {
            expect(
              range.min,
              `${cdr.id} range "${range.risk}" has min (${range.min}) > max (${range.max})`,
            ).toBeLessThanOrEqual(range.max)
          }
        })
      },
    )
  })

  describe('suggestedTreatments compliance', () => {
    describe.each(ALL_CDRS.map((cdr) => [cdr.id, cdr] as const))(
      '%s',
      (_id, cdr) => {
        const uniqueRisks = [...new Set(cdr.scoring.ranges.map((r) => r.risk))].sort()

        it('has suggestedTreatments', () => {
          expect(
            cdr.suggestedTreatments,
            `${cdr.id} is missing suggestedTreatments`,
          ).toBeDefined()
        })

        it('suggestedTreatments keys match scoring risk levels', () => {
          if (!cdr.suggestedTreatments) return
          const treatmentKeys = Object.keys(cdr.suggestedTreatments).sort()
          expect(
            treatmentKeys,
            `${cdr.id} treatment keys ${JSON.stringify(treatmentKeys)} don't match risks ${JSON.stringify(uniqueRisks)}`,
          ).toEqual(uniqueRisks)
        })

        it('suggestedTreatments values are non-empty string arrays', () => {
          if (!cdr.suggestedTreatments) return
          for (const [risk, treatments] of Object.entries(cdr.suggestedTreatments)) {
            expect(
              treatments.length,
              `${cdr.id} suggestedTreatments["${risk}"] is empty`,
            ).toBeGreaterThan(0)
          }
        })
      },
    )
  })
})
