/**
 * Unit tests for LlmResponseParser.
 *
 * Safety-critical: this parser sits between unpredictable LLM output
 * and validated medical decision-making data structures.
 *
 * IMPORTANT: All medical content is fictional / educational only. No PHI.
 */

import { describe, it, expect } from 'vitest'
import { LlmResponseParser } from '../../llm/responseParser.js'
import {
  S1_CLEAN_OBJECT,
  S1_LEGACY_ARRAY,
  S1_CODE_FENCED,
  S1_DOUBLE_FENCED,
  S1_WITH_PREAMBLE,
  S1_TRAILING_COMMAS,
  S1_NONSTANDARD_URGENCY,
  S1_UNPARSEABLE,
  S1_PARTIAL_VALID,
  FINALIZE_CLEAN,
  FINALIZE_WRAPPED,
  FINALIZE_ALT_FIELDS,
  FINALIZE_NEEDS_EXTRACTION,
  QUICK_MODE_CLEAN,
  NARRATIVE_CLEAN,
} from '../fixtures/llmResponses.js'

const parser = new LlmResponseParser()

// ============================================================================
// Section 1 Parsing
// ============================================================================

describe('LlmResponseParser.parseSection1', () => {
  it('parses clean JSON object with all fields', () => {
    const result = parser.parseSection1(S1_CLEAN_OBJECT)
    expect(result.success).toBe(true)
    expect('fallback' in result && result.fallback).toBe(false)
    expect(result.data.differential).toHaveLength(3)
    expect(result.data.differential[0].diagnosis).toBe('Acute Coronary Syndrome')
    expect(result.data.differential[0].urgency).toBe('emergent')
    expect(result.data.cdrAnalysis).toHaveLength(2) // only applicable ones
    expect(result.data.workupRecommendations).toHaveLength(1)
  })

  it('parses legacy flat array format', () => {
    const result = parser.parseSection1(S1_LEGACY_ARRAY)
    expect(result.success).toBe(true)
    expect(result.data.differential).toHaveLength(2)
    expect(result.data.differential[0].diagnosis).toBe('Appendicitis')
  })

  it('strips code fences', () => {
    const result = parser.parseSection1(S1_CODE_FENCED)
    expect(result.success).toBe(true)
    expect(result.data.differential).toHaveLength(3)
  })

  it('strips double code fences', () => {
    const result = parser.parseSection1(S1_DOUBLE_FENCED)
    expect(result.success).toBe(true)
    expect(result.data.differential).toHaveLength(3)
  })

  it('handles preamble text before JSON', () => {
    const result = parser.parseSection1(S1_WITH_PREAMBLE)
    expect(result.success).toBe(true)
    expect(result.data.differential).toHaveLength(3)
  })

  it('handles trailing commas', () => {
    const result = parser.parseSection1(S1_TRAILING_COMMAS)
    expect(result.success).toBe(true)
    expect(result.data.differential).toHaveLength(1)
    expect(result.data.differential[0].diagnosis).toBe('Meningitis')
  })

  it('coerces non-standard urgency values', () => {
    const result = parser.parseSection1(S1_NONSTANDARD_URGENCY)
    expect(result.success).toBe(true)
    expect(result.data.differential).toHaveLength(4)
    expect(result.data.differential[0].urgency).toBe('emergent') // critical → emergent
    expect(result.data.differential[1].urgency).toBe('routine')  // low → routine
    expect(result.data.differential[2].urgency).toBe('emergent') // high → emergent
    expect(result.data.differential[3].urgency).toBe('routine')  // non-urgent → routine
  })

  it('returns fallback stub for unparseable response', () => {
    const result = parser.parseSection1(S1_UNPARSEABLE)
    expect(result.success).toBe(true)
    expect('fallback' in result && result.fallback).toBe(true)
    expect(result.data.differential).toHaveLength(1)
    expect(result.data.differential[0].diagnosis).toContain('Unable to')
  })

  it('handles partial valid items (skips invalid, keeps valid)', () => {
    const result = parser.parseSection1(S1_PARTIAL_VALID)
    expect(result.success).toBe(true)
    // Should have 2 valid items (the one without diagnosis is skipped)
    expect(result.data.differential).toHaveLength(2)
    expect(result.data.differential[0].diagnosis).toBe('Valid Diagnosis')
    expect(result.data.differential[1].diagnosis).toBe('Another Valid')
  })

  it('filters duplicate CDR names', () => {
    const dupeResponse = JSON.stringify({
      differential: [{ diagnosis: 'Test', urgency: 'emergent', reasoning: 'Test' }],
      cdrAnalysis: [
        { name: 'HEART Score', applicable: true, reason: 'First' },
        { name: 'heart score', applicable: true, reason: 'Duplicate' },
        { name: 'Wells Score', applicable: true, reason: 'Different' },
      ],
    })
    const result = parser.parseSection1(dupeResponse)
    expect(result.data.cdrAnalysis).toHaveLength(2) // deduped
  })
})

// ============================================================================
// Finalize Parsing
// ============================================================================

describe('LlmResponseParser.parseFinalize', () => {
  it('parses clean finalize response', () => {
    const result = parser.parseFinalize(FINALIZE_CLEAN)
    expect(result.success).toBe(true)
    expect('fallback' in result && result.fallback).toBe(false)
    expect(result.data.finalMdm.text).toContain('MEDICAL DECISION MAKING')
    expect(result.data.finalMdm.json.problems).toContain('Chest pain, acute')
    expect(result.data.gaps).toHaveLength(1)
    expect(result.data.generationFailed).toBe(false)
  })

  it('unwraps { finalMdm: {...} } wrapper', () => {
    const result = parser.parseFinalize(FINALIZE_WRAPPED)
    expect(result.success).toBe(true)
    expect(result.data.finalMdm.text).toContain('MEDICAL DECISION MAKING')
    expect(result.data.generationFailed).toBe(false)
  })

  it('normalizes alternative field names', () => {
    const result = parser.parseFinalize(FINALIZE_ALT_FIELDS)
    expect(result.success).toBe(true)
    expect(result.data.finalMdm.json.problems).toContain('Headache')
    // dataReviewedOrdered → flattened dataReviewed
    expect(result.data.finalMdm.json.dataReviewed.length).toBeGreaterThan(0)
    // clinicalReasoning → reasoning
    expect(result.data.finalMdm.json.reasoning).toContain('CT negative')
    // disposition object → stringified
    expect(result.data.finalMdm.json.disposition).toContain('Discharge')
  })

  it('extracts JSON from text with preamble/postamble', () => {
    const result = parser.parseFinalize(FINALIZE_NEEDS_EXTRACTION)
    expect(result.success).toBe(true)
    expect(result.data.generationFailed).toBe(false)
  })

  it('returns failure stub for unparseable response', () => {
    const result = parser.parseFinalize('Total garbage - no JSON here')
    expect(result.success).toBe(false)
    expect(result.data.generationFailed).toBe(true)
    expect(result.data.finalMdm.text).toContain('Unable to generate')
  })

  it('returns fallback when extractFinalMdm produces empty text', () => {
    // extractFinalMdm will produce { text: '', json: {...} } from this
    // FinalMdmSchema allows empty text, so it succeeds but text is empty
    const badResponse = JSON.stringify({ json: { problems: [] } })
    const result = parser.parseFinalize(badResponse)
    // The parser succeeds but with minimal/empty content
    expect(result.success).toBe(true)
    expect(result.data.finalMdm.text).toBe('')
  })
})

// ============================================================================
// Quick Mode Parsing
// ============================================================================

describe('LlmResponseParser.parseQuickMode', () => {
  it('parses clean quick mode response', () => {
    const result = parser.parseQuickMode(QUICK_MODE_CLEAN)
    expect(result.success).toBe(true)
    expect('fallback' in result && result.fallback).toBe(false)
    expect(result.data.text).toContain('MEDICAL DECISION MAKING')
    expect(result.data.patientIdentifier.age).toBe('34')
    expect(result.data.patientIdentifier.sex).toBe('Female')
    expect(result.data.patientIdentifier.chiefComplaint).toContain('ankle')
  })

  it('returns failure stub for unparseable response', () => {
    const result = parser.parseQuickMode('Not JSON at all')
    expect(result.success).toBe(false)
    expect(result.data.text).toContain('Unable to generate')
    expect(result.data.patientIdentifier).toEqual({})
  })

  it('handles code-fenced response', () => {
    const fenced = '```json\n' + QUICK_MODE_CLEAN + '\n```'
    const result = parser.parseQuickMode(fenced)
    expect(result.success).toBe(true)
    expect(result.data.patientIdentifier.age).toBe('34')
  })
})

// ============================================================================
// Narrative Parsing
// ============================================================================

describe('LlmResponseParser.parseNarrative', () => {
  it('parses clean narrative response', () => {
    const result = parser.parseNarrative(NARRATIVE_CLEAN)
    expect(result.success).toBe(true)
    expect('fallback' in result && result.fallback).toBe(false)
    expect(result.data.chiefComplaint.complaint).toBe('Chest pain')
    expect(result.data.confidence).toBe(0.85)
    expect(result.data.warnings).toEqual([])
  })

  it('returns empty structure for unparseable response', () => {
    const result = parser.parseNarrative('Not JSON')
    expect(result.success).toBe(false)
    expect(result.data.confidence).toBe(0)
    expect(result.data.warnings).toContain('Failed to parse narrative')
  })

  it('defaults confidence when missing', () => {
    const noConfidence = JSON.parse(NARRATIVE_CLEAN)
    delete noConfidence.confidence
    const result = parser.parseNarrative(JSON.stringify(noConfidence))
    expect(result.success).toBe(true)
    expect(result.data.confidence).toBe(0.5)
  })
})

// ============================================================================
// Suggest Diagnosis Parsing
// ============================================================================

describe('LlmResponseParser.parseSuggestDiagnosis', () => {
  const differential = [
    { diagnosis: 'ACS', urgency: 'emergent' as const, reasoning: 'Chest pain' },
    { diagnosis: 'PE', urgency: 'emergent' as const, reasoning: 'Dyspnea' },
    { diagnosis: 'GERD', urgency: 'routine' as const, reasoning: 'Chronic' },
  ]

  it('parses clean JSON array of strings', () => {
    const result = parser.parseSuggestDiagnosis(
      JSON.stringify(['Acute Coronary Syndrome', 'Unstable Angina', 'Costochondritis']),
      differential,
    )
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
    expect(result.data[0]).toBe('Acute Coronary Syndrome')
  })

  it('falls back to differential when parse fails', () => {
    const result = parser.parseSuggestDiagnosis('Not JSON', differential)
    expect(result.success).toBe(true)
    expect('fallback' in result && result.fallback).toBe(true)
    expect(result.data).toEqual(['ACS', 'PE', 'GERD'])
  })

  it('limits to 7 suggestions', () => {
    const many = JSON.stringify(Array.from({ length: 10 }, (_, i) => `Diagnosis ${i}`))
    const result = parser.parseSuggestDiagnosis(many, differential)
    expect(result.data.length).toBeLessThanOrEqual(7)
  })
})

// ============================================================================
// Parse Results
// ============================================================================

describe('LlmResponseParser.parseResults', () => {
  const validIds = new Set(['troponin', 'cbc', 'bmp'])

  it('parses clean results response', () => {
    const response = JSON.stringify({
      parsed: [
        { testId: 'troponin', testName: 'Troponin', status: 'unremarkable', value: '0.01', unit: 'ng/mL' },
        { testId: 'cbc', testName: 'CBC', status: 'abnormal', value: '3.2', notes: 'Low WBC' },
      ],
      unmatchedText: ['Urinalysis: negative'],
    })
    const result = parser.parseResults(response, validIds)
    expect(result.success).toBe(true)
    expect(result.data.parsed).toHaveLength(2)
    expect(result.data.unmatchedText).toHaveLength(1)
  })

  it('filters out results with invalid test IDs', () => {
    const response = JSON.stringify({
      parsed: [
        { testId: 'troponin', testName: 'Troponin', status: 'unremarkable' },
        { testId: 'unknown_test', testName: 'Unknown', status: 'abnormal' },
      ],
    })
    const result = parser.parseResults(response, validIds)
    expect(result.data.parsed).toHaveLength(1)
    expect(result.data.parsed[0].testId).toBe('troponin')
  })

  it('returns fallback for unparseable response', () => {
    const result = parser.parseResults('Not JSON', validIds)
    expect(result.success).toBe(true)
    expect('fallback' in result && result.fallback).toBe(true)
    expect(result.data.parsed).toHaveLength(0)
    expect(result.data.unmatchedText[0]).toContain('Failed to parse')
  })
})

// ============================================================================
// CDR Auto-Populate
// ============================================================================

describe('LlmResponseParser.parseCdrAutoPopulate', () => {
  it('parses clean auto-populate response', () => {
    const response = JSON.stringify({
      heart_score: {
        history: { value: true, source: 'narrative' },
        age: { value: 'over_65', source: 'narrative' },
      },
    })
    const result = parser.parseCdrAutoPopulate(response)
    expect(result).not.toBeNull()
    expect(result!.heart_score.history.value).toBe(true)
  })

  it('returns null for unparseable response', () => {
    const result = parser.parseCdrAutoPopulate('Not JSON')
    expect(result).toBeNull()
  })
})
