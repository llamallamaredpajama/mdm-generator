/**
 * Unit tests for CDR Matching Service.
 *
 * Tests the matchCdrsFromDifferential function: matching via
 * applicableChiefComplaints, cdrContext, deduplication, and edge cases.
 *
 * IMPORTANT: All medical content is fictional / educational only. No PHI.
 */

import { describe, it, expect } from 'vitest'
import { matchCdrsFromDifferential } from '../../services/cdrMatcher.js'
import type { DifferentialItem } from '../../buildModeSchemas.js'
import type { CdrDefinition } from '../../types/libraries.js'

// ============================================================================
// Helpers
// ============================================================================

/** Creates a minimal CdrDefinition with sensible defaults. */
function makeCdr(overrides: Partial<CdrDefinition> & { id: string; name: string }): CdrDefinition {
  return {
    fullName: overrides.name,
    applicableChiefComplaints: [],
    components: [],
    scoring: { method: 'sum', ranges: [] },
    ...overrides,
  } as CdrDefinition
}

/** Creates a minimal DifferentialItem. */
function makeDiff(overrides: Partial<DifferentialItem> & { diagnosis: string }): DifferentialItem {
  return {
    urgency: 'emergent',
    reasoning: 'Test reasoning',
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('matchCdrsFromDifferential', () => {
  // --------------------------------------------------------------------------
  // Strategy 1: applicableChiefComplaints matching
  // --------------------------------------------------------------------------

  describe('applicableChiefComplaints matching', () => {
    it('matches when complaint substring is found in diagnosis', () => {
      const diff = [makeDiff({ diagnosis: 'Acute Chest Pain' })]
      const cdrs = [
        makeCdr({
          id: 'heart-score',
          name: 'HEART Score',
          applicableChiefComplaints: ['chest pain'],
        }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('heart-score')
    })

    it('matches when diagnosis substring is found in complaint (reverse)', () => {
      const diff = [makeDiff({ diagnosis: 'PE' })]
      const cdrs = [
        makeCdr({
          id: 'wells-pe',
          name: 'Wells PE',
          applicableChiefComplaints: ['pulmonary embolism (pe)'],
        }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('wells-pe')
    })

    it('matching is case-insensitive', () => {
      const diff = [makeDiff({ diagnosis: 'ACUTE CORONARY SYNDROME' })]
      const cdrs = [
        makeCdr({
          id: 'heart',
          name: 'HEART',
          applicableChiefComplaints: ['acute coronary syndrome'],
        }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
    })

    it('matches across multiple diagnoses', () => {
      const diff = [
        makeDiff({ diagnosis: 'Chest Pain' }),
        makeDiff({ diagnosis: 'Head Injury' }),
      ]
      const cdrs = [
        makeCdr({ id: 'heart', name: 'HEART', applicableChiefComplaints: ['chest pain'] }),
        makeCdr({ id: 'pecarn', name: 'PECARN', applicableChiefComplaints: ['head injury'] }),
        makeCdr({ id: 'wells', name: 'Wells DVT', applicableChiefComplaints: ['dvt'] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toContain('heart')
      expect(result.map((r) => r.id)).toContain('pecarn')
    })
  })

  // --------------------------------------------------------------------------
  // Strategy 2: cdrContext matching
  // --------------------------------------------------------------------------

  describe('cdrContext matching', () => {
    it('matches CDR name against cdrContext string', () => {
      const diff = [
        makeDiff({
          diagnosis: 'Suspected DVT',
          cdrContext: 'Consider Wells DVT Criteria for risk stratification',
        }),
      ]
      const cdrs = [
        makeCdr({ id: 'wells-dvt', name: 'Wells DVT', fullName: 'Wells Criteria for DVT', applicableChiefComplaints: [] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('wells-dvt')
    })

    it('matches CDR fullName against cdrContext string', () => {
      const diff = [
        makeDiff({
          diagnosis: 'Chest Pain',
          cdrContext: 'Apply HEART Score for Major Adverse Cardiac Events',
        }),
      ]
      const cdrs = [
        makeCdr({
          id: 'heart',
          name: 'HEART',
          fullName: 'HEART Score for Major Adverse Cardiac Events',
          applicableChiefComplaints: [],
        }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('heart')
    })

    it('cdrContext matching is case-insensitive', () => {
      const diff = [
        makeDiff({
          diagnosis: 'Ankle Sprain',
          cdrContext: 'OTTAWA ANKLE RULES may apply',
        }),
      ]
      const cdrs = [
        makeCdr({ id: 'ottawa-ankle', name: 'Ottawa Ankle Rules', fullName: 'Ottawa Ankle Rules', applicableChiefComplaints: [] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
    })

    it('does not use cdrContext strategy when no differential items have cdrContext', () => {
      const diff = [makeDiff({ diagnosis: 'Ankle Sprain' })] // no cdrContext
      const cdrs = [
        makeCdr({ id: 'ottawa-ankle', name: 'Ottawa Ankle Rules', fullName: 'Ottawa Ankle Rules', applicableChiefComplaints: [] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(0)
    })
  })

  // --------------------------------------------------------------------------
  // Deduplication
  // --------------------------------------------------------------------------

  describe('deduplication', () => {
    it('deduplicates CDRs matched by both strategies', () => {
      const diff = [
        makeDiff({
          diagnosis: 'Chest Pain',
          cdrContext: 'Apply HEART Score',
        }),
      ]
      const cdrs = [
        makeCdr({
          id: 'heart',
          name: 'HEART Score',
          fullName: 'HEART Score',
          applicableChiefComplaints: ['chest pain'],
        }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      // Should appear only once despite matching via both strategies
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('heart')
    })

    it('does not duplicate when same CDR matches multiple diagnoses', () => {
      const diff = [
        makeDiff({ diagnosis: 'Chest Pain' }),
        makeDiff({ diagnosis: 'Acute Chest Pain' }),
      ]
      const cdrs = [
        makeCdr({ id: 'heart', name: 'HEART', applicableChiefComplaints: ['chest pain'] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
    })
  })

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('returns empty array when no matches found', () => {
      const diff = [makeDiff({ diagnosis: 'Headache' })]
      const cdrs = [
        makeCdr({ id: 'wells-pe', name: 'Wells PE', applicableChiefComplaints: ['shortness of breath'] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toEqual([])
    })

    it('returns empty array for empty differential', () => {
      const cdrs = [
        makeCdr({ id: 'heart', name: 'HEART', applicableChiefComplaints: ['chest pain'] }),
      ]

      const result = matchCdrsFromDifferential([], cdrs)

      expect(result).toEqual([])
    })

    it('returns empty array for empty CDR library', () => {
      const diff = [makeDiff({ diagnosis: 'Chest Pain' })]

      const result = matchCdrsFromDifferential(diff, [])

      expect(result).toEqual([])
    })

    it('returns empty array when both inputs are empty', () => {
      const result = matchCdrsFromDifferential([], [])

      expect(result).toEqual([])
    })

    it('handles cdrContext that is null/undefined without errors', () => {
      const diff = [
        makeDiff({ diagnosis: 'Chest Pain', cdrContext: null }),
        makeDiff({ diagnosis: 'Headache', cdrContext: undefined }),
      ]
      const cdrs = [
        makeCdr({ id: 'heart', name: 'HEART', applicableChiefComplaints: ['chest pain'] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('heart')
    })

    it('preserves order from CDR library iteration', () => {
      const diff = [
        makeDiff({ diagnosis: 'Chest Pain with SOB' }),
      ]
      const cdrs = [
        makeCdr({ id: 'heart', name: 'HEART', applicableChiefComplaints: ['chest pain'] }),
        makeCdr({ id: 'perc', name: 'PERC', applicableChiefComplaints: ['sob'] }),
        makeCdr({ id: 'wells', name: 'Wells PE', applicableChiefComplaints: ['unrelated'] }),
      ]

      const result = matchCdrsFromDifferential(diff, cdrs)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('heart')
      expect(result[1].id).toBe('perc')
    })
  })
})
