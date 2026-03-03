/**
 * Validation tests for Batch 4 — Neurology CDRs
 *
 * Validates structural integrity, scoring coverage, component correctness,
 * and naming conventions for all 10 neurology CDR definitions.
 */

import { describe, it, expect } from 'vitest'
import { batch4NeuroCdrs } from '../batch-4-neuro'
import type { CdrSeed, CdrComponent } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate the minimum possible score from a set of components (sum method). */
function calcMinScore(components: CdrComponent[]): number {
  let total = 0
  for (const c of components) {
    if (c.type === 'select' && c.options) {
      total += Math.min(...c.options.map((o) => o.value))
    } else if (c.type === 'boolean') {
      // Boolean contributes `value` when true, 0 when false.
      // Minimum contribution is the lesser of 0 and the value.
      total += Math.min(0, c.value ?? 0)
    } else if (c.type === 'number_range') {
      total += c.min ?? 0
    }
  }
  return total
}

/** Calculate the maximum possible score from a set of components (sum method). */
function calcMaxScore(components: CdrComponent[]): number {
  let total = 0
  for (const c of components) {
    if (c.type === 'select' && c.options) {
      total += Math.max(...c.options.map((o) => o.value))
    } else if (c.type === 'boolean') {
      total += Math.max(0, c.value ?? 0)
    } else if (c.type === 'number_range') {
      total += c.max ?? 0
    }
  }
  return total
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('batch-4-neuro CDR definitions', () => {
  it('exports exactly 9 CDR definitions', () => {
    // Modified Fisher quarantined (purely CT-based, 0 user-answerable components)
    expect(batch4NeuroCdrs).toHaveLength(9)
  })

  // -------------------------------------------------------------------------
  // Required fields
  // -------------------------------------------------------------------------
  describe('required CdrSeed fields', () => {
    const requiredFields: (keyof CdrSeed)[] = [
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

    for (const cdr of batch4NeuroCdrs) {
      it(`${cdr.id} — has all required fields`, () => {
        for (const field of requiredFields) {
          expect(cdr, `missing field "${field}" on ${cdr.id}`).toHaveProperty(field)
        }
      })
    }
  })

  // -------------------------------------------------------------------------
  // ID uniqueness & naming
  // -------------------------------------------------------------------------
  describe('ID conventions', () => {
    it('all IDs are unique within the batch', () => {
      const ids = batch4NeuroCdrs.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    for (const cdr of batch4NeuroCdrs) {
      it(`${cdr.id} — ID is snake_case`, () => {
        expect(cdr.id).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/)
      })
    }
  })

  // -------------------------------------------------------------------------
  // Component validation
  // -------------------------------------------------------------------------
  describe('component type validation', () => {
    for (const cdr of batch4NeuroCdrs) {
      describe(cdr.id, () => {
        for (const comp of cdr.components) {
          if (comp.type === 'boolean') {
            it(`boolean "${comp.id}" has a numeric "value" field`, () => {
              expect(typeof comp.value).toBe('number')
            })
          }

          if (comp.type === 'select') {
            it(`select "${comp.id}" has a non-empty options array`, () => {
              expect(Array.isArray(comp.options)).toBe(true)
              expect(comp.options!.length).toBeGreaterThan(0)
            })

            it(`select "${comp.id}" options have label and numeric value`, () => {
              for (const opt of comp.options!) {
                expect(typeof opt.label).toBe('string')
                expect(opt.label.length).toBeGreaterThan(0)
                expect(typeof opt.value).toBe('number')
              }
            })
          }

          if (comp.type === 'number_range') {
            it(`number_range "${comp.id}" has min and max`, () => {
              expect(typeof comp.min).toBe('number')
              expect(typeof comp.max).toBe('number')
              expect(comp.max!).toBeGreaterThanOrEqual(comp.min!)
            })
          }
        }

        it('all components have a valid source', () => {
          const validSources = ['section1', 'section2', 'user_input']
          for (const comp of cdr.components) {
            expect(validSources).toContain(comp.source)
          }
        })

        it('component IDs are unique within the CDR', () => {
          const ids = cdr.components.map((c) => c.id)
          expect(new Set(ids).size).toBe(ids.length)
        })
      })
    }
  })

  // -------------------------------------------------------------------------
  // Scoring range coverage
  // -------------------------------------------------------------------------
  describe('scoring range coverage', () => {
    for (const cdr of batch4NeuroCdrs) {
      describe(cdr.id, () => {
        it('scoring method is valid', () => {
          expect(['sum', 'threshold', 'algorithm']).toContain(cdr.scoring.method)
        })

        it('has at least one scoring range', () => {
          expect(cdr.scoring.ranges.length).toBeGreaterThan(0)
        })

        it('scoring ranges have no gaps between consecutive ranges', () => {
          const sorted = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
          for (let i = 1; i < sorted.length; i++) {
            const prevMax = sorted[i - 1].max
            const currMin = sorted[i].min
            expect(
              currMin,
              `gap between range ${i - 1} (max=${prevMax}) and range ${i} (min=${currMin}) in ${cdr.id}`,
            ).toBe(prevMax + 1)
          }
        })

        it('scoring ranges have no overlaps', () => {
          const sorted = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
          for (let i = 1; i < sorted.length; i++) {
            expect(
              sorted[i].min,
              `overlap at range ${i} in ${cdr.id}`,
            ).toBeGreaterThan(sorted[i - 1].max)
          }
        })

        it('each range has required fields', () => {
          for (const range of cdr.scoring.ranges) {
            expect(typeof range.min).toBe('number')
            expect(typeof range.max).toBe('number')
            expect(range.max).toBeGreaterThanOrEqual(range.min)
            expect(typeof range.risk).toBe('string')
            expect(range.risk.length).toBeGreaterThan(0)
            expect(typeof range.interpretation).toBe('string')
            expect(range.interpretation.length).toBeGreaterThan(0)
          }
        })

        if (cdr.scoring.method === 'sum' || cdr.scoring.method === 'threshold') {
          it('scoring ranges cover the full achievable score range', () => {
            const minPossible = calcMinScore(cdr.components)
            const maxPossible = calcMaxScore(cdr.components)
            const sorted = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
            const rangeMin = sorted[0].min
            const rangeMax = sorted[sorted.length - 1].max

            expect(
              rangeMin,
              `first range min (${rangeMin}) should be <= achievable min (${minPossible}) for ${cdr.id}`,
            ).toBeLessThanOrEqual(minPossible)

            expect(
              rangeMax,
              `last range max (${rangeMax}) should be >= achievable max (${maxPossible}) for ${cdr.id}`,
            ).toBeGreaterThanOrEqual(maxPossible)
          })
        }
      })
    }
  })

  // -------------------------------------------------------------------------
  // Specific CDR spot checks (clinical sanity)
  // -------------------------------------------------------------------------
  describe('clinical spot checks', () => {
    it('NIHSS has 15 components (the standard 15-item scale)', () => {
      const nihss = batch4NeuroCdrs.find((c) => c.id === 'nihss')!
      // Note: NIHSS published has 11 items (1a,1b,1c,2,3,4,5a,5b,6a,6b,7,8,9,10,11)
      // which is 15 individually scored items
      expect(nihss.components).toHaveLength(15)
    })

    it('Ottawa SAH Rule uses threshold scoring', () => {
      const ottawa = batch4NeuroCdrs.find((c) => c.id === 'ottawa_sah')!
      expect(ottawa.scoring.method).toBe('threshold')
    })

    it('HINTS Exam uses algorithm scoring', () => {
      const hints = batch4NeuroCdrs.find((c) => c.id === 'hints_exam')!
      expect(hints.scoring.method).toBe('algorithm')
    })

    it('Hunt and Hess has 4 clinical assessment components and grades range from 1 to 5', () => {
      const hh = batch4NeuroCdrs.find((c) => c.id === 'hunt_hess')!
      expect(hh.components).toHaveLength(4)
      expect(hh.scoring.method).toBe('algorithm')
      const sorted = [...hh.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(sorted[0].min).toBe(1)
      expect(sorted[sorted.length - 1].max).toBe(5)
      // All components should be section1 (clinical assessment)
      for (const comp of hh.components) {
        expect(comp.source).toBe('section1')
        expect(comp.type).toBe('select')
      }
    })

    it('ICH Score has 7 components (3 GCS sub-components + age + 3 imaging) and scoring ranges 0-6', () => {
      const ich = batch4NeuroCdrs.find((c) => c.id === 'ich_score')!
      expect(ich.components).toHaveLength(7)
      expect(ich.scoring.method).toBe('algorithm')
      // GCS sub-components are section1
      const gcsComps = ich.components.filter((c) => c.id.startsWith('gcs_'))
      expect(gcsComps).toHaveLength(3)
      for (const comp of gcsComps) {
        expect(comp.source).toBe('section1')
        expect(comp.type).toBe('select')
      }
      // Scoring ranges cover 0-6 (published ICH Score range)
      const sorted = [...ich.scoring.ranges].sort((a, b) => a.min - b.min)
      expect(sorted[0].min).toBe(0)
      expect(sorted[sorted.length - 1].max).toBe(6)
    })

    it('FOUR Score max achievable is 16', () => {
      const four = batch4NeuroCdrs.find((c) => c.id === 'four_score')!
      expect(calcMaxScore(four.components)).toBe(16)
    })

    it('ABCD2 max achievable is 7', () => {
      const abcd2 = batch4NeuroCdrs.find((c) => c.id === 'abcd2')!
      expect(calcMaxScore(abcd2.components)).toBe(7)
    })

    it('RACE Scale max achievable is 9', () => {
      const race = batch4NeuroCdrs.find((c) => c.id === 'race_scale')!
      expect(calcMaxScore(race.components)).toBe(9)
    })

    it('all CDRs are in NEUROLOGY category', () => {
      for (const cdr of batch4NeuroCdrs) {
        expect(cdr.category).toBe('NEUROLOGY')
      }
    })
  })
})
