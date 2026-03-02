import { describe, it, expect } from 'vitest'
import { MdmSchema, renderMdmText, type Mdm } from '../outputSchema'
import { PHYSICIAN_ATTESTATION } from '../constants'

// ============================================================================
// MdmSchema Zod validation
// ============================================================================
describe('MdmSchema', () => {
  const validMdm = {
    differential: 'Acute coronary syndrome',
    data_reviewed_ordered: 'Troponin, EKG, CXR',
    decision_making: 'High concern for ACS given risk factors',
    risk: 'High risk - potential STEMI',
  }

  it('accepts string values for union fields', () => {
    const result = MdmSchema.parse(validMdm)
    expect(result.differential).toBe('Acute coronary syndrome')
    expect(result.data_reviewed_ordered).toBe('Troponin, EKG, CXR')
    expect(result.risk).toBe('High risk - potential STEMI')
  })

  it('accepts array values for union fields', () => {
    const result = MdmSchema.parse({
      ...validMdm,
      differential: ['Acute coronary syndrome', 'Pulmonary embolism', 'Aortic dissection'],
      data_reviewed_ordered: ['Troponin', 'EKG', 'CXR'],
      risk: ['High risk - potential STEMI', 'Missed PE risk'],
    })
    expect(result.differential).toEqual(['Acute coronary syndrome', 'Pulmonary embolism', 'Aortic dissection'])
    expect(result.data_reviewed_ordered).toEqual(['Troponin', 'EKG', 'CXR'])
    expect(result.risk).toEqual(['High risk - potential STEMI', 'Missed PE risk'])
  })

  it('defaults disposition to empty string when omitted', () => {
    const result = MdmSchema.parse(validMdm)
    expect(result.disposition).toBe('')
  })

  it('defaults attestation to PHYSICIAN_ATTESTATION when omitted', () => {
    const result = MdmSchema.parse(validMdm)
    expect(result.attestation).toBe(PHYSICIAN_ATTESTATION)
  })

  it('accepts explicit disposition and attestation', () => {
    const result = MdmSchema.parse({
      ...validMdm,
      disposition: 'Admit to telemetry',
      attestation: ['Reviewed by physician', 'Content verified'],
    })
    expect(result.disposition).toBe('Admit to telemetry')
    expect(result.attestation).toEqual(['Reviewed by physician', 'Content verified'])
  })

  it('bridges old disclaimers field to attestation', () => {
    const result = MdmSchema.parse({
      ...validMdm,
      disclaimers: 'Old disclaimer text',
    })
    expect(result.attestation).toBe('Old disclaimer text')
    expect((result as Record<string, unknown>).disclaimers).toBeUndefined()
  })

  it('prefers attestation over disclaimers when both provided', () => {
    const result = MdmSchema.parse({
      ...validMdm,
      attestation: 'New attestation',
      disclaimers: 'Old disclaimer',
    })
    expect(result.attestation).toBe('New attestation')
  })

  it('rejects missing required field: differential', () => {
    const { differential, ...rest } = validMdm
    expect(() => MdmSchema.parse(rest)).toThrow()
  })

  it('rejects missing required field: decision_making', () => {
    const { decision_making, ...rest } = validMdm
    expect(() => MdmSchema.parse(rest)).toThrow()
  })

  it('rejects number where string expected', () => {
    expect(() => MdmSchema.parse({ ...validMdm, decision_making: 123 })).toThrow()
  })
})

// ============================================================================
// renderMdmText
// ============================================================================
describe('renderMdmText', () => {
  it('renders string fields as plain text blocks', () => {
    const mdm: Mdm = {
      differential: 'Acute coronary syndrome',
      data_reviewed_ordered: 'Troponin elevated, EKG shows ST changes',
      decision_making: 'High concern for ACS given presentation and labs',
      risk: 'High risk encounter',
      disposition: 'Admit to cardiac care unit',
      attestation: PHYSICIAN_ATTESTATION,
    }
    const text = renderMdmText(mdm)
    expect(text).toContain('Differential:\nAcute coronary syndrome')
    expect(text).toContain('Data reviewed/ordered:\nTroponin elevated, EKG shows ST changes')
    expect(text).toContain('Decision making:\nHigh concern for ACS given presentation and labs')
    expect(text).toContain('Risk:\nHigh risk encounter')
    expect(text).toContain('Disposition:\nAdmit to cardiac care unit')
    expect(text).toContain('Attestation:\n' + PHYSICIAN_ATTESTATION)
  })

  it('renders array fields as bullet lists', () => {
    const mdm: Mdm = {
      differential: ['Acute coronary syndrome', 'Pulmonary embolism'],
      data_reviewed_ordered: ['Troponin', 'EKG', 'CXR'],
      decision_making: 'Clinical reasoning here',
      risk: ['High risk - ACS', 'Moderate risk - PE'],
      disposition: '',
      attestation: ['Reviewed by physician', 'Content verified'],
    }
    const text = renderMdmText(mdm)
    expect(text).toContain('- Acute coronary syndrome')
    expect(text).toContain('- Pulmonary embolism')
    expect(text).toContain('- Troponin')
    expect(text).toContain('- EKG')
    expect(text).toContain('- CXR')
    expect(text).toContain('- High risk - ACS')
    expect(text).toContain('- Reviewed by physician')
    expect(text).toContain('- Content verified')
  })

  it('skips sections with empty arrays', () => {
    const mdm: Mdm = {
      differential: [],
      data_reviewed_ordered: [],
      decision_making: 'Some reasoning',
      risk: [],
      disposition: '',
      attestation: PHYSICIAN_ATTESTATION,
    }
    const text = renderMdmText(mdm)
    expect(text).not.toContain('Differential:')
    expect(text).not.toContain('Data reviewed/ordered:')
    expect(text).not.toContain('Risk:')
    expect(text).toContain('Decision making:')
  })

  it('skips empty string differential via asBullet falsy check', () => {
    const mdm: Mdm = {
      differential: '',
      data_reviewed_ordered: 'Some data',
      decision_making: 'Reasoning',
      risk: 'Some risk',
      disposition: '',
      attestation: PHYSICIAN_ATTESTATION,
    }
    const text = renderMdmText(mdm)
    expect(text).not.toContain('Differential:')
  })

  it('skips disposition when empty', () => {
    const mdm: Mdm = {
      differential: 'Test',
      data_reviewed_ordered: 'Test',
      decision_making: 'Test',
      risk: 'Test',
      disposition: '',
      attestation: PHYSICIAN_ATTESTATION,
    }
    const text = renderMdmText(mdm)
    expect(text).not.toContain('Disposition:')
  })

  it('renders with all-empty fields producing minimal output', () => {
    const mdm: Mdm = {
      differential: [],
      data_reviewed_ordered: [],
      decision_making: '',
      risk: [],
      disposition: '',
      attestation: PHYSICIAN_ATTESTATION,
    }
    const text = renderMdmText(mdm)
    // Only attestation should remain
    expect(text).toContain('Attestation:')
    expect(text).not.toContain('Differential:')
    expect(text).not.toContain('Decision making:')
    expect(text).not.toContain('Risk:')
    expect(text).not.toContain('Disposition:')
  })

  it('handles unicode and emoji in content', () => {
    const mdm: Mdm = {
      differential: 'Abdominal pain - r/o appendicitis \u2014 urgent',
      data_reviewed_ordered: 'CT abd/pelvis \u2705',
      decision_making: 'Clinical assessment with \u00b0F temp noted',
      risk: 'Moderate \u2013 surgical risk',
      disposition: '',
      attestation: PHYSICIAN_ATTESTATION,
    }
    const text = renderMdmText(mdm)
    expect(text).toContain('\u2014 urgent')
    expect(text).toContain('\u2705')
    expect(text).toContain('\u00b0F')
    expect(text).toContain('\u2013 surgical')
  })

  it('handles mixed string/array for attestation', () => {
    const stringVersion: Mdm = {
      differential: 'Test',
      data_reviewed_ordered: 'Test',
      decision_making: 'Test',
      risk: 'Test',
      disposition: '',
      attestation: 'Single attestation',
    }
    const arrayVersion: Mdm = {
      ...stringVersion,
      attestation: ['Attestation 1', 'Attestation 2'],
    }
    expect(renderMdmText(stringVersion)).toContain('Attestation:\nSingle attestation')
    const arrayText = renderMdmText(arrayVersion)
    expect(arrayText).toContain('- Attestation 1')
    expect(arrayText).toContain('- Attestation 2')
  })
})
