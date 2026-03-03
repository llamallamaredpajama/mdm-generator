import { describe, it, expect } from 'vitest'
import { batch21RescueCardioCdrs } from '../batch-21-rescue-cardio'
import type { CdrSeed } from '../types'

describe('Batch 21 — Cardiovascular Rescue CDRs', () => {
  it('exports exactly 2 CDR definitions', () => {
    expect(batch21RescueCardioCdrs).toHaveLength(2)
  })

  it('all entries conform to CdrSeed type (required fields present)', () => {
    const requiredKeys: (keyof CdrSeed)[] = [
      'id', 'name', 'fullName', 'category', 'application',
      'applicableChiefComplaints', 'keywords', 'components', 'scoring',
    ]
    for (const cdr of batch21RescueCardioCdrs) {
      for (const key of requiredKeys) {
        expect(cdr, `CDR "${cdr.id}" missing required field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('all IDs are unique', () => {
    const ids = batch21RescueCardioCdrs.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all IDs are snake_case', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/
    for (const cdr of batch21RescueCardioCdrs) {
      expect(snakeCaseRegex.test(cdr.id), `CDR ID "${cdr.id}" is not snake_case`).toBe(true)
    }
  })

  it('every CDR has >= 3 user-answerable interactive components', () => {
    for (const cdr of batch21RescueCardioCdrs) {
      const userAnswerable = cdr.components.filter(
        (c) => (c.type === 'boolean' || c.type === 'select') &&
          (c.source === 'section1' || c.source === 'user_input'),
      )
      expect(
        userAnswerable.length,
        `CDR "${cdr.id}" has only ${userAnswerable.length} user-answerable`,
      ).toBeGreaterThanOrEqual(3)
    }
  })

  describe('component validation', () => {
    it('boolean components have a numeric "value" field', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        const booleans = cdr.components.filter((c) => c.type === 'boolean')
        for (const comp of booleans) {
          expect(typeof comp.value, `CDR "${cdr.id}", component "${comp.id}": boolean must have numeric value`).toBe('number')
        }
      }
    })

    it('select components have a non-empty options array', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        const selects = cdr.components.filter((c) => c.type === 'select')
        for (const comp of selects) {
          expect(Array.isArray(comp.options) && comp.options.length > 0, `CDR "${cdr.id}", component "${comp.id}": select must have non-empty options`).toBe(true)
        }
      }
    })

    it('select option values are numbers', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        const selects = cdr.components.filter((c) => c.type === 'select')
        for (const comp of selects) {
          for (const opt of comp.options ?? []) {
            expect(typeof opt.value, `CDR "${cdr.id}", component "${comp.id}", option "${opt.label}": value must be number`).toBe('number')
          }
        }
      }
    })

    it('every component has a valid source', () => {
      const validSources = ['section1', 'section2', 'user_input']
      for (const cdr of batch21RescueCardioCdrs) {
        for (const comp of cdr.components) {
          expect(validSources.includes(comp.source), `CDR "${cdr.id}", component "${comp.id}": invalid source "${comp.source}"`).toBe(true)
        }
      }
    })

    it('component IDs are unique within each CDR', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        const ids = cdr.components.map((c) => c.id)
        expect(new Set(ids).size, `CDR "${cdr.id}" has duplicate component IDs`).toBe(ids.length)
      }
    })
  })

  describe('scoring range validation', () => {
    it('scoring method is one of sum | threshold | algorithm', () => {
      const validMethods = ['sum', 'threshold', 'algorithm']
      for (const cdr of batch21RescueCardioCdrs) {
        expect(validMethods.includes(cdr.scoring.method), `CDR "${cdr.id}": invalid scoring method`).toBe(true)
      }
    })

    it('scoring ranges have no gaps between consecutive ranges', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          expect(ranges[i].min, `CDR "${cdr.id}": gap between ranges`).toBe(ranges[i - 1].max + 1)
        }
      }
    })

    it('scoring ranges have no overlaps', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        for (let i = 1; i < ranges.length; i++) {
          expect(ranges[i].min, `CDR "${cdr.id}": overlap between ranges`).toBeGreaterThan(ranges[i - 1].max)
        }
      }
    })

    it('scoring ranges cover the full achievable score range for sum-method CDRs', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        if (cdr.scoring.method !== 'sum') continue
        let minScore = 0, maxScore = 0
        for (const comp of cdr.components) {
          if (comp.type === 'boolean') {
            const v = comp.value ?? 0
            if (v >= 0) maxScore += v; else minScore += v
          } else if (comp.type === 'select' && comp.options) {
            const values = comp.options.map((o) => o.value)
            minScore += Math.min(...values)
            maxScore += Math.max(...values)
          }
        }
        const ranges = [...cdr.scoring.ranges].sort((a, b) => a.min - b.min)
        expect(ranges[0].min, `CDR "${cdr.id}": first range min should be <= min achievable`).toBeLessThanOrEqual(minScore)
        expect(ranges[ranges.length - 1].max, `CDR "${cdr.id}": last range max should be >= max achievable`).toBeGreaterThanOrEqual(maxScore)
      }
    })

    it('each range has non-empty risk and interpretation strings', () => {
      for (const cdr of batch21RescueCardioCdrs) {
        for (const range of cdr.scoring.ranges) {
          expect(range.risk.length, `CDR "${cdr.id}": empty risk`).toBeGreaterThan(0)
          expect(range.interpretation.length, `CDR "${cdr.id}": empty interpretation`).toBeGreaterThan(0)
        }
      }
    })
  })
})
