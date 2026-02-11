import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildParsePrompt,
  getEmptyParsedNarrative,
  type ParsedNarrative,
  type PromptParts,
} from '../parsePromptBuilder'
import {
  parseQuickModeResponse,
  getQuickModeFallback,
  type QuickModeGenerationResult,
} from '../promptBuilderQuickMode'

// ============================================================================
// buildParsePrompt (parsePromptBuilder.ts)
// ============================================================================
describe('buildParsePrompt', () => {
  it('returns system and user prompt parts', () => {
    const result = buildParsePrompt('Middle-aged patient with chest pain')
    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
    expect(typeof result.system).toBe('string')
    expect(typeof result.user).toBe('string')
  })

  it('embeds narrative in user prompt', () => {
    const narrative = 'Elderly female presents with acute onset shortness of breath and bilateral leg swelling'
    const result = buildParsePrompt(narrative)
    expect(result.user).toContain(narrative)
  })

  it('does not embed narrative in system prompt', () => {
    const narrative = 'Unique-test-narrative-12345'
    const result = buildParsePrompt(narrative)
    expect(result.system).not.toContain(narrative)
  })

  it('system prompt contains JSON schema instructions', () => {
    const result = buildParsePrompt('test')
    expect(result.system).toContain('chiefComplaint')
    expect(result.system).toContain('problemsConsidered')
    expect(result.system).toContain('dataReviewed')
    expect(result.system).toContain('riskAssessment')
    expect(result.system).toContain('clinicalReasoning')
    expect(result.system).toContain('treatmentProcedures')
    expect(result.system).toContain('disposition')
    expect(result.system).toContain('confidence')
    expect(result.system).toContain('warnings')
  })

  it('system prompt instructs JSON-only output', () => {
    const result = buildParsePrompt('test')
    expect(result.system).toContain('Return ONLY valid JSON')
  })

  it('handles empty narrative string', () => {
    const result = buildParsePrompt('')
    expect(result.user).toContain('NARRATIVE:')
    expect(typeof result.system).toBe('string')
  })

  it('handles very long narrative', () => {
    const longNarrative = 'word '.repeat(5000)
    const result = buildParsePrompt(longNarrative)
    expect(result.user).toContain(longNarrative)
  })

  it('handles unicode and special characters', () => {
    const narrative = 'Temp 38.5\u00b0C, HR \u2192 120 bpm, SpO2 92%'
    const result = buildParsePrompt(narrative)
    expect(result.user).toContain('\u00b0C')
    expect(result.user).toContain('\u2192')
  })
})

// ============================================================================
// getEmptyParsedNarrative (parsePromptBuilder.ts)
// ============================================================================
describe('getEmptyParsedNarrative', () => {
  let empty: ParsedNarrative

  beforeEach(() => {
    empty = getEmptyParsedNarrative()
  })

  it('returns all string fields as empty strings', () => {
    expect(empty.chiefComplaint.complaint).toBe('')
    expect(empty.chiefComplaint.context).toBe('')
    expect(empty.chiefComplaint.age).toBe('')
    expect(empty.chiefComplaint.sex).toBe('')
    expect(empty.dataReviewed.labs).toBe('')
    expect(empty.dataReviewed.imaging).toBe('')
    expect(empty.dataReviewed.ekg).toBe('')
    expect(empty.dataReviewed.externalRecords).toBe('')
    expect(empty.dataReviewed.independentHistorian).toBe('')
    expect(empty.riskAssessment.patientFactors).toBe('')
    expect(empty.riskAssessment.diagnosticRisks).toBe('')
    expect(empty.riskAssessment.treatmentRisks).toBe('')
    expect(empty.riskAssessment.dispositionRisks).toBe('')
    expect(empty.riskAssessment.highestRiskElement).toBe('')
    expect(empty.clinicalReasoning.evaluationApproach).toBe('')
    expect(empty.clinicalReasoning.keyDecisionPoints).toBe('')
    expect(empty.clinicalReasoning.workingDiagnosis).toBe('')
    expect(empty.treatmentProcedures.medications).toBe('')
    expect(empty.treatmentProcedures.procedures).toBe('')
    expect(empty.treatmentProcedures.rationale).toBe('')
    expect(empty.disposition.decision).toBe('')
    expect(empty.disposition.levelOfCare).toBe('')
    expect(empty.disposition.rationale).toBe('')
    expect(empty.disposition.dischargeInstructions).toBe('')
    expect(empty.disposition.followUp).toBe('')
    expect(empty.disposition.returnPrecautions).toBe('')
  })

  it('returns empty arrays for emergent and nonEmergent', () => {
    expect(empty.problemsConsidered.emergent).toEqual([])
    expect(empty.problemsConsidered.nonEmergent).toEqual([])
  })

  it('returns confidence of 0', () => {
    expect(empty.confidence).toBe(0)
  })

  it('returns warnings array with fallback message', () => {
    expect(empty.warnings).toHaveLength(1)
    expect(empty.warnings[0]).toContain('Failed to parse')
  })

  it('returns a new object each call (no shared references)', () => {
    const a = getEmptyParsedNarrative()
    const b = getEmptyParsedNarrative()
    expect(a).not.toBe(b)
    expect(a.problemsConsidered.emergent).not.toBe(b.problemsConsidered.emergent)
    a.chiefComplaint.complaint = 'modified'
    expect(b.chiefComplaint.complaint).toBe('')
  })
})

// ============================================================================
// parseQuickModeResponse (promptBuilderQuickMode.ts)
// ============================================================================
describe('parseQuickModeResponse', () => {
  const validResponse = JSON.stringify({
    patientIdentifier: {
      age: '55',
      sex: 'male',
      chiefComplaint: 'chest pain',
    },
    mdm: {
      text: 'MDM text for EHR',
      json: {
        problems: ['Chest pain'],
        differential: [{ diagnosis: 'ACS', urgency: 'emergent', reasoning: 'Classic' }],
      },
    },
  })

  it('parses well-formed JSON response', () => {
    const result = parseQuickModeResponse(validResponse)
    expect(result.text).toBe('MDM text for EHR')
    expect(result.patientIdentifier.age).toBe('55')
    expect(result.patientIdentifier.sex).toBe('male')
    expect(result.patientIdentifier.chiefComplaint).toBe('chest pain')
    expect(result.json).toHaveProperty('problems')
  })

  it('strips markdown code fences from response', () => {
    const fencedResponse = '```json\n' + validResponse + '\n```'
    const result = parseQuickModeResponse(fencedResponse)
    expect(result.text).toBe('MDM text for EHR')
    expect(result.patientIdentifier.age).toBe('55')
  })

  it('extracts JSON from response with surrounding text', () => {
    const messyResponse = 'Here is the result:\n' + validResponse + '\n\nDone!'
    const result = parseQuickModeResponse(messyResponse)
    expect(result.text).toBe('MDM text for EHR')
  })

  it('handles null/missing patientIdentifier fields gracefully', () => {
    const response = JSON.stringify({
      patientIdentifier: { age: null, sex: null, chiefComplaint: null },
      mdm: { text: 'Some text', json: {} },
    })
    const result = parseQuickModeResponse(response)
    // null is falsy, so || undefined produces undefined
    expect(result.patientIdentifier.age).toBeUndefined()
    expect(result.patientIdentifier.sex).toBeUndefined()
    expect(result.patientIdentifier.chiefComplaint).toBeUndefined()
  })

  it('handles missing mdm field', () => {
    const response = JSON.stringify({
      patientIdentifier: { age: '30' },
    })
    const result = parseQuickModeResponse(response)
    expect(result.text).toBe('')
    expect(result.json).toEqual({})
  })

  it('handles missing patientIdentifier entirely', () => {
    const response = JSON.stringify({
      mdm: { text: 'Some text', json: { problems: [] } },
    })
    const result = parseQuickModeResponse(response)
    expect(result.patientIdentifier.age).toBeUndefined()
    expect(result.patientIdentifier.sex).toBeUndefined()
    expect(result.text).toBe('Some text')
  })

  it('falls back to top-level text/json when mdm wrapper missing', () => {
    // The fallback path: parsed.mdm?.text is falsy, tries parsed.text
    const response = 'Some preamble ' + JSON.stringify({
      text: 'Top level text',
      json: { problems: ['Headache'] },
    }) + ' some trailing text'
    const result = parseQuickModeResponse(response)
    expect(result.text).toBe('Top level text')
    expect(result.json).toEqual({ problems: ['Headache'] })
  })

  it('throws on completely invalid input', () => {
    expect(() => parseQuickModeResponse('not json at all')).toThrow(
      'Invalid model output - no valid JSON found'
    )
  })

  it('throws on empty input', () => {
    expect(() => parseQuickModeResponse('')).toThrow()
  })

  it('throws on malformed JSON', () => {
    expect(() => parseQuickModeResponse('{broken: json}')).toThrow()
  })
})

// ============================================================================
// getQuickModeFallback (promptBuilderQuickMode.ts)
// ============================================================================
describe('getQuickModeFallback', () => {
  let fallback: QuickModeGenerationResult

  beforeEach(() => {
    fallback = getQuickModeFallback()
  })

  it('returns non-empty text with review message', () => {
    expect(fallback.text).toContain('Unable to generate MDM')
    expect(fallback.text).toContain('Physician must review')
  })

  it('returns structured json with empty arrays', () => {
    expect(fallback.json).toHaveProperty('problems')
    expect(fallback.json).toHaveProperty('differential')
    expect(fallback.json).toHaveProperty('dataReviewed')
    expect(fallback.json).toHaveProperty('reasoning')
    expect(fallback.json).toHaveProperty('risk')
    expect(fallback.json).toHaveProperty('disposition')
    expect(fallback.json).toHaveProperty('complexityLevel')
    expect((fallback.json as Record<string, unknown>).problems).toEqual([])
    expect((fallback.json as Record<string, unknown>).complexityLevel).toBe('moderate')
  })

  it('returns empty patientIdentifier', () => {
    expect(fallback.patientIdentifier).toEqual({})
  })

  it('returns a new object each call', () => {
    const a = getQuickModeFallback()
    const b = getQuickModeFallback()
    expect(a).not.toBe(b)
    expect(a.json).not.toBe(b.json)
  })
})
