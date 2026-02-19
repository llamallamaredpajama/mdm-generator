import { describe, it, expect } from 'vitest'
import { mapToSyndromes } from '../../surveillance/syndromeMapper'

describe('syndromeMapper', () => {
  describe('mapToSyndromes', () => {
    it('maps respiratory chief complaint to respiratory categories', () => {
      const result = mapToSyndromes('cough and shortness of breath', ['pneumonia', 'bronchitis'])
      expect(result).toContain('respiratory_upper')
      expect(result).toContain('respiratory_lower')
    })

    it('maps GI symptoms correctly', () => {
      const result = mapToSyndromes('nausea and vomiting with diarrhea', ['gastroenteritis'])
      expect(result).toContain('gastrointestinal')
    })

    it('weights chief complaint 2x over differential', () => {
      // CC has "cough" (respiratory_upper keyword) = 2 points
      // Differential has "pneumonia" (respiratory_lower keyword) = 1 point
      const result = mapToSyndromes('cough', ['pneumonia'])
      // respiratory_upper should be first (higher score from CC match)
      expect(result[0]).toBe('respiratory_upper')
    })

    it('returns empty array when no syndromes match', () => {
      const result = mapToSyndromes('ankle sprain', ['fracture', 'ligament tear'])
      expect(result).toEqual([])
    })

    it('is case insensitive', () => {
      const result = mapToSyndromes('COUGH AND FEVER', ['PNEUMONIA'])
      expect(result).toContain('respiratory_upper')
      expect(result).toContain('respiratory_lower')
    })

    it('matches differential-only keywords', () => {
      const result = mapToSyndromes('joint pain', ['lyme disease', 'ehrlichiosis'])
      expect(result).toContain('vector_borne')
    })

    it('detects bioterrorism sentinel keywords', () => {
      const result = mapToSyndromes('respiratory distress', ['anthrax', 'pneumonia'])
      expect(result).toContain('bioterrorism_sentinel')
      expect(result).toContain('respiratory_lower')
    })

    it('returns multiple syndromes sorted by match strength', () => {
      const result = mapToSyndromes('fever with cough and rash', ['measles', 'sepsis'])
      expect(result.length).toBeGreaterThanOrEqual(3)
      // All should be present
      expect(result).toContain('febrile_rash')
      expect(result).toContain('sepsis_shock')
    })
  })
})
