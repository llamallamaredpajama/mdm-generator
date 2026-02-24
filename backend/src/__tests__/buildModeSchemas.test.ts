import { describe, it, expect } from 'vitest'
import {
  Section1RequestSchema,
  Section2RequestSchema,
  FinalizeRequestSchema,
  DifferentialItemSchema,
  Section1ResponseSchema,
  MdmPreviewSchema,
  SectionStatusSchema,
  EncounterStatusSchema,
  SECTION1_MAX_CHARS,
  SECTION2_MAX_CHARS,
  SECTION3_MAX_CHARS,
} from '../buildModeSchemas'

// ============================================================================
// Character limit constants
// ============================================================================
describe('character limit constants', () => {
  it('has correct max char limits', () => {
    expect(SECTION1_MAX_CHARS).toBe(2000)
    expect(SECTION2_MAX_CHARS).toBe(2000)
    expect(SECTION3_MAX_CHARS).toBe(2000)
  })
})

// ============================================================================
// Section1RequestSchema
// ============================================================================
describe('Section1RequestSchema', () => {
  const validToken = 'abcdefghij' // exactly 10 chars

  const validRequest = {
    encounterId: 'enc-001',
    content: 'Middle-aged patient presenting with acute chest pain radiating to left arm',
    userIdToken: validToken,
  }

  it('accepts valid request', () => {
    const result = Section1RequestSchema.parse(validRequest)
    expect(result.encounterId).toBe('enc-001')
    expect(result.content).toBe(validRequest.content)
  })

  // --- content boundary tests ---
  it('accepts content at exactly max length (4000 chars)', () => {
    const content = 'x'.repeat(SECTION1_MAX_CHARS)
    const result = Section1RequestSchema.parse({ ...validRequest, content })
    expect(result.content.length).toBe(SECTION1_MAX_CHARS)
  })

  it('rejects content at max+1 length (4001 chars)', () => {
    const content = 'x'.repeat(SECTION1_MAX_CHARS + 1)
    expect(() => Section1RequestSchema.parse({ ...validRequest, content })).toThrow()
  })

  it('rejects empty content string', () => {
    expect(() => Section1RequestSchema.parse({ ...validRequest, content: '' })).toThrow()
  })

  // --- encounterId boundary tests ---
  it('rejects empty encounterId', () => {
    expect(() => Section1RequestSchema.parse({ ...validRequest, encounterId: '' })).toThrow()
  })

  it('accepts encounterId with 1 character', () => {
    const result = Section1RequestSchema.parse({ ...validRequest, encounterId: 'x' })
    expect(result.encounterId).toBe('x')
  })

  // --- userIdToken boundary tests ---
  it('accepts userIdToken at exactly 10 chars', () => {
    const result = Section1RequestSchema.parse({ ...validRequest, userIdToken: 'a'.repeat(10) })
    expect(result.userIdToken.length).toBe(10)
  })

  it('rejects userIdToken at 9 chars', () => {
    expect(() =>
      Section1RequestSchema.parse({ ...validRequest, userIdToken: 'a'.repeat(9) })
    ).toThrow()
  })

  it('accepts long userIdToken', () => {
    const longToken = 'a'.repeat(5000)
    const result = Section1RequestSchema.parse({ ...validRequest, userIdToken: longToken })
    expect(result.userIdToken.length).toBe(5000)
  })

  // --- missing fields ---
  it('rejects missing encounterId', () => {
    const { encounterId, ...rest } = validRequest
    expect(() => Section1RequestSchema.parse(rest)).toThrow()
  })

  it('rejects missing content', () => {
    const { content, ...rest } = validRequest
    expect(() => Section1RequestSchema.parse(rest)).toThrow()
  })

  it('rejects missing userIdToken', () => {
    const { userIdToken, ...rest } = validRequest
    expect(() => Section1RequestSchema.parse(rest)).toThrow()
  })

  // --- unicode content ---
  it('accepts unicode and emoji in content', () => {
    const content = 'Patient presents with \u2192 chest pain, temp 38.5\u00b0C \ud83c\udfe5'
    const result = Section1RequestSchema.parse({ ...validRequest, content })
    expect(result.content).toContain('\u2192')
    expect(result.content).toContain('\u00b0C')
  })
})

// ============================================================================
// Section2RequestSchema
// ============================================================================
describe('Section2RequestSchema', () => {
  const validToken = 'abcdefghij'

  const validRequest = {
    encounterId: 'enc-002',
    content: 'Troponin negative x2, EKG shows normal sinus rhythm, CXR unremarkable',
    userIdToken: validToken,
  }

  it('accepts valid request with optional workingDiagnosis', () => {
    const result = Section2RequestSchema.parse({
      ...validRequest,
      workingDiagnosis: 'Non-cardiac chest pain',
    })
    expect(result.workingDiagnosis).toBe('Non-cardiac chest pain')
  })

  it('accepts valid request without workingDiagnosis', () => {
    const result = Section2RequestSchema.parse(validRequest)
    expect(result.workingDiagnosis).toBeUndefined()
  })

  it('accepts content at exactly max length (3000 chars)', () => {
    const content = 'y'.repeat(SECTION2_MAX_CHARS)
    const result = Section2RequestSchema.parse({ ...validRequest, content })
    expect(result.content.length).toBe(SECTION2_MAX_CHARS)
  })

  it('rejects content at max+1 length (3001 chars)', () => {
    const content = 'y'.repeat(SECTION2_MAX_CHARS + 1)
    expect(() => Section2RequestSchema.parse({ ...validRequest, content })).toThrow()
  })

  it('rejects empty content string', () => {
    expect(() => Section2RequestSchema.parse({ ...validRequest, content: '' })).toThrow()
  })
})

// ============================================================================
// FinalizeRequestSchema
// ============================================================================
describe('FinalizeRequestSchema', () => {
  const validToken = 'abcdefghij'

  const validRequest = {
    encounterId: 'enc-003',
    content: 'Patient improved with treatment, vitals stable, discharge home',
    userIdToken: validToken,
  }

  it('accepts valid request', () => {
    const result = FinalizeRequestSchema.parse(validRequest)
    expect(result.encounterId).toBe('enc-003')
  })

  it('accepts content at exactly max length (2500 chars)', () => {
    const content = 'z'.repeat(SECTION3_MAX_CHARS)
    const result = FinalizeRequestSchema.parse({ ...validRequest, content })
    expect(result.content.length).toBe(SECTION3_MAX_CHARS)
  })

  it('rejects content at max+1 length (2501 chars)', () => {
    const content = 'z'.repeat(SECTION3_MAX_CHARS + 1)
    expect(() => FinalizeRequestSchema.parse({ ...validRequest, content })).toThrow()
  })

  it('rejects empty content string', () => {
    expect(() => FinalizeRequestSchema.parse({ ...validRequest, content: '' })).toThrow()
  })

  it('rejects userIdToken shorter than 10 chars', () => {
    expect(() =>
      FinalizeRequestSchema.parse({ ...validRequest, userIdToken: 'short' })
    ).toThrow()
  })
})

// ============================================================================
// DifferentialItemSchema
// ============================================================================
describe('DifferentialItemSchema', () => {
  it('accepts valid item with emergent urgency', () => {
    const item = {
      diagnosis: 'Acute myocardial infarction',
      urgency: 'emergent' as const,
      reasoning: 'Chest pain with diaphoresis, cardiac history',
    }
    const result = DifferentialItemSchema.parse(item)
    expect(result.urgency).toBe('emergent')
  })

  it('accepts urgent and routine urgency values', () => {
    expect(DifferentialItemSchema.parse({
      diagnosis: 'Costochondritis',
      urgency: 'routine',
      reasoning: 'Reproducible chest wall tenderness',
    }).urgency).toBe('routine')

    expect(DifferentialItemSchema.parse({
      diagnosis: 'Unstable angina',
      urgency: 'urgent',
      reasoning: 'Rest pain, new onset',
    }).urgency).toBe('urgent')
  })

  it('rejects invalid urgency enum value', () => {
    expect(() =>
      DifferentialItemSchema.parse({
        diagnosis: 'Test',
        urgency: 'critical',
        reasoning: 'Test',
      })
    ).toThrow()
  })

  it('rejects missing diagnosis', () => {
    expect(() =>
      DifferentialItemSchema.parse({
        urgency: 'emergent',
        reasoning: 'Test',
      })
    ).toThrow()
  })
})

// ============================================================================
// Section1ResponseSchema
// ============================================================================
describe('Section1ResponseSchema', () => {
  it('accepts valid response', () => {
    const response = {
      differential: [
        { diagnosis: 'AMI', urgency: 'emergent' as const, reasoning: 'Classic presentation' },
      ],
      submissionCount: 0,
      isLocked: false,
      quotaRemaining: 9,
    }
    const result = Section1ResponseSchema.parse(response)
    expect(result.differential).toHaveLength(1)
    expect(result.quotaRemaining).toBe(9)
  })

  it('rejects submissionCount above 2', () => {
    expect(() =>
      Section1ResponseSchema.parse({
        differential: [],
        submissionCount: 3,
        isLocked: false,
        quotaRemaining: 0,
      })
    ).toThrow()
  })

  it('rejects negative submissionCount', () => {
    expect(() =>
      Section1ResponseSchema.parse({
        differential: [],
        submissionCount: -1,
        isLocked: false,
        quotaRemaining: 0,
      })
    ).toThrow()
  })

  it('rejects negative quotaRemaining', () => {
    expect(() =>
      Section1ResponseSchema.parse({
        differential: [],
        submissionCount: 0,
        isLocked: false,
        quotaRemaining: -1,
      })
    ).toThrow()
  })
})

// ============================================================================
// MdmPreviewSchema
// ============================================================================
describe('MdmPreviewSchema', () => {
  it('accepts string values for union fields', () => {
    const result = MdmPreviewSchema.parse({
      problems: 'Chest pain',
      differential: 'ACS vs PE',
      dataReviewed: 'Labs, imaging',
      reasoning: 'High acuity presentation',
    })
    expect(result.problems).toBe('Chest pain')
  })

  it('accepts array values for union fields', () => {
    const result = MdmPreviewSchema.parse({
      problems: ['Chest pain', 'Dyspnea'],
      differential: ['ACS', 'PE', 'Pneumothorax'],
      dataReviewed: ['CBC', 'BMP', 'Troponin', 'CXR'],
      reasoning: 'Multiple acute concerns',
    })
    expect(result.problems).toEqual(['Chest pain', 'Dyspnea'])
    expect(result.differential).toHaveLength(3)
  })

  it('rejects missing reasoning (required string)', () => {
    expect(() =>
      MdmPreviewSchema.parse({
        problems: 'Test',
        differential: 'Test',
        dataReviewed: 'Test',
      })
    ).toThrow()
  })
})

// ============================================================================
// Enum Schemas
// ============================================================================
describe('SectionStatusSchema', () => {
  it('accepts all valid statuses', () => {
    expect(SectionStatusSchema.parse('pending')).toBe('pending')
    expect(SectionStatusSchema.parse('in_progress')).toBe('in_progress')
    expect(SectionStatusSchema.parse('completed')).toBe('completed')
  })

  it('rejects invalid status', () => {
    expect(() => SectionStatusSchema.parse('cancelled')).toThrow()
    expect(() => SectionStatusSchema.parse('')).toThrow()
  })
})

describe('EncounterStatusSchema', () => {
  it('accepts all valid encounter statuses', () => {
    const validStatuses = ['draft', 'section1_done', 'section2_done', 'finalized', 'archived']
    for (const status of validStatuses) {
      expect(EncounterStatusSchema.parse(status)).toBe(status)
    }
  })

  it('rejects invalid encounter status', () => {
    expect(() => EncounterStatusSchema.parse('deleted')).toThrow()
    expect(() => EncounterStatusSchema.parse('')).toThrow()
  })
})
