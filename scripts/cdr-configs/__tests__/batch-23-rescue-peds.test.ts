import { describe, it, expect } from 'vitest'
import { batch23RescuePedsCdrs } from '../batch-23-rescue-peds'
import type { CdrSeed, CdrComponent } from '../types'

const EXPECTED_CDR_COUNT = 2

const REQUIRED_CDR_FIELDS: (keyof CdrSeed)[] = [
  'id',
  'name',
  'fullName',
  'category',
  'application',
  'applicableChiefComplaints',
  'keywords',
  'components',
  'scoring',
]

const SNAKE_CASE_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

describe('batch-23-rescue-peds CDR definitions', () => {
  it(`exports exactly ${EXPECTED_CDR_COUNT} CDRs`, () => {
    expect(batch23RescuePedsCdrs).toHaveLength(EXPECTED_CDR_COUNT)
  })

  it('has unique IDs across all CDRs', () => {
    const ids = batch23RescuePedsCdrs.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    for (const cdr of batch23RescuePedsCdrs) {
      expect(cdr.id).toMatch(SNAKE_CASE_RE)
    }
  })

  it('every CDR has >= 3 user-answerable interactive components', () => {
    for (const cdr of batch23RescuePedsCdrs) {
      const userAnswerable = cdr.components.filter(
        (c) => (c.type === 'boolean' || c.type === 'select') &&
          (c.source === 'section1' || c.source === 'user_input'),
      )
      expect(userAnswerable.length, `CDR "${cdr.id}" has only ${userAnswerable.length} user-answerable`).toBeGreaterThanOrEqual(3)
    }
  })

  describe.each(batch23RescuePedsCdrs.map((c) => [c.id, c]))('%s', (_id, cdr) => {
    it('has all required CdrSeed fields', () => {
      for (const field of REQUIRED_CDR_FIELDS) {
        expect(cdr).toHaveProperty(field)
        const val = cdr[field]
        if (typeof val === 'string') {
          expect(val.length).toBeGreaterThan(0)
        }
      }
    })

    it('has non-empty applicableChiefComplaints', () => {
      expect(cdr.applicableChiefComplaints.length).toBeGreaterThan(0)
    })

    it('has non-empty keywords', () => {
      expect(cdr.keywords.length).toBeGreaterThan(0)
    })

    it('has at least one component', () => {
      expect(cdr.components.length).toBeGreaterThan(0)
    })

    it('has valid scoring method', () => {
      expect(['sum', 'threshold', 'algorithm']).toContain(cdr.scoring.method)
    })

    it('has at least one scoring range', () => {
      expect(cdr.scoring.ranges.length).toBeGreaterThan(0)
    })

    it('scoring ranges cover the full possible score range with no gaps', () => {
      const { ranges } = cdr.scoring
      const sorted = [...ranges].sort((a, b) => a.min - b.min)

      const minPossible = computeMinScore(cdr.components)
      expect(sorted[0].min).toBe(minPossible)

      for (let i = 1; i < sorted.length; i++) {
        const prevMax = sorted[i - 1].max
        const currMin = sorted[i].min
        expect(currMin).toBe(prevMax + 1)
      }

      if (cdr.scoring.method !== 'algorithm') {
        const maxPossible = computeMaxScore(cdr.components)
        const lastRangeMax = sorted[sorted.length - 1].max
        const largestComponentMax = Math.max(
          ...cdr.components.map((c) => {
            if (c.type === 'boolean') return c.value ?? 0
            if (c.type === 'select' && c.options) return Math.max(...c.options.map((o) => o.value))
            if (c.type === 'number_range' && c.max !== undefined) return c.max
            return 0
          })
        )
        expect(lastRangeMax).toBeGreaterThanOrEqual(maxPossible - largestComponentMax)
        expect(lastRangeMax).toBeLessThanOrEqual(maxPossible + 10)
      }
    })

    it('scoring ranges have no overlaps', () => {
      const { ranges } = cdr.scoring
      const sorted = [...ranges].sort((a, b) => a.min - b.min)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].min).toBeGreaterThan(sorted[i - 1].max)
      }
    })

    it('scoring ranges have valid risk and interpretation strings', () => {
      for (const range of cdr.scoring.ranges) {
        expect(range.risk.length).toBeGreaterThan(0)
        expect(range.interpretation.length).toBeGreaterThan(0)
      }
    })

    describe('component validation', () => {
      it.each(cdr.components.map((c) => [c.id, c]))(
        'component %s has valid structure',
        (_compId, comp) => {
          expect(comp.id).toBeTruthy()
          expect(comp.label).toBeTruthy()
          expect(['select', 'boolean', 'number_range', 'algorithm']).toContain(comp.type)
          expect(['section1', 'section2', 'user_input']).toContain(comp.source)

          if (comp.type === 'boolean') {
            expect(comp.value).toBeDefined()
            expect(typeof comp.value).toBe('number')
          }

          if (comp.type === 'select') {
            expect(comp.options).toBeDefined()
            expect(Array.isArray(comp.options)).toBe(true)
            expect(comp.options!.length).toBeGreaterThan(0)

            for (const opt of comp.options!) {
              expect(opt.label).toBeTruthy()
              expect(typeof opt.value).toBe('number')
            }

            const values = comp.options!.map((o) => o.value)
            for (const v of values) {
              expect(v).toBeGreaterThanOrEqual(0)
              expect(Number.isInteger(v)).toBe(true)
            }
          }

          if (comp.type === 'number_range') {
            expect(comp.min).toBeDefined()
            expect(comp.max).toBeDefined()
            expect(typeof comp.min).toBe('number')
            expect(typeof comp.max).toBe('number')
            expect(comp.max!).toBeGreaterThan(comp.min!)
          }
        }
      )

      it('all component IDs are unique within this CDR', () => {
        const compIds = cdr.components.map((c) => c.id)
        const unique = new Set(compIds)
        expect(unique.size).toBe(compIds.length)
      })
    })
  })
})

function computeMinScore(components: CdrComponent[]): number {
  let min = 0
  for (const comp of components) {
    if (comp.type === 'boolean') {
      min += 0
    } else if (comp.type === 'select' && comp.options) {
      min += Math.min(...comp.options.map((o) => o.value))
    } else if (comp.type === 'number_range' && comp.min !== undefined) {
      min += comp.min
    }
  }
  return min
}

function computeMaxScore(components: CdrComponent[]): number {
  let max = 0
  for (const comp of components) {
    if (comp.type === 'boolean') {
      max += comp.value ?? 0
    } else if (comp.type === 'select' && comp.options) {
      max += Math.max(...comp.options.map((o) => o.value))
    } else if (comp.type === 'number_range' && comp.max !== undefined) {
      max += comp.max
    }
  }
  return max
}
