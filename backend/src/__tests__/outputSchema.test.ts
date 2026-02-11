import { describe, it, expect } from 'vitest'
import { MdmSchema, renderMdmText, type Mdm } from '../outputSchema'

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

  it('defaults disclaimers when omitted', () => {
    const result = MdmSchema.parse(validMdm)
    expect(result.disclaimers).toBe('Educational draft. Physician must review. No PHI.')
  })

  it('accepts explicit disposition and disclaimers', () => {
    const result = MdmSchema.parse({
      ...validMdm,
      disposition: 'Admit to telemetry',
      disclaimers: ['Draft only', 'Physician review required'],
    })
    expect(result.disposition).toBe('Admit to telemetry')
    expect(result.disclaimers).toEqual(['Draft only', 'Physician review required'])
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
      disclaimers: 'Educational draft. Physician must review. No PHI.',
    }
    const text = renderMdmText(mdm)
    expect(text).toContain('Differential:\nAcute coronary syndrome')
    expect(text).toContain('Data reviewed/ordered:\nTroponin elevated, EKG shows ST changes')
    expect(text).toContain('Decision making:\nHigh concern for ACS given presentation and labs')
    expect(text).toContain('Risk:\nHigh risk encounter')
    expect(text).toContain('Disposition:\nAdmit to cardiac care unit')
    expect(text).toContain('Notes:\nEducational draft. Physician must review. No PHI.')
  })

  it('renders array fields as bullet lists', () => {
    const mdm: Mdm = {
      differential: ['Acute coronary syndrome', 'Pulmonary embolism'],
      data_reviewed_ordered: ['Troponin', 'EKG', 'CXR'],
      decision_making: 'Clinical reasoning here',
      risk: ['High risk - ACS', 'Moderate risk - PE'],
      disposition: '',
      disclaimers: ['Draft only', 'Physician review required'],
    }
    const text = renderMdmText(mdm)
    expect(text).toContain('- Acute coronary syndrome')
    expect(text).toContain('- Pulmonary embolism')
    expect(text).toContain('- Troponin')
    expect(text).toContain('- EKG')
    expect(text).toContain('- CXR')
    expect(text).toContain('- High risk - ACS')
    expect(text).toContain('- Draft only')
    expect(text).toContain('- Physician review required')
  })

  it('skips sections with empty arrays', () => {
    const mdm: Mdm = {
      differential: [],
      data_reviewed_ordered: [],
      decision_making: 'Some reasoning',
      risk: [],
      disposition: '',
      disclaimers: 'Educational draft. Physician must review. No PHI.',
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
      disclaimers: 'Educational draft. Physician must review. No PHI.',
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
      disclaimers: 'Educational draft. Physician must review. No PHI.',
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
      disclaimers: 'Educational draft. Physician must review. No PHI.',
    }
    const text = renderMdmText(mdm)
    // Only disclaimers should remain
    expect(text).toContain('Notes:')
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
      disclaimers: 'Educational draft. Physician must review. No PHI.',
    }
    const text = renderMdmText(mdm)
    expect(text).toContain('\u2014 urgent')
    expect(text).toContain('\u2705')
    expect(text).toContain('\u00b0F')
    expect(text).toContain('\u2013 surgical')
  })

  it('handles mixed string/array for disclaimers', () => {
    const stringVersion: Mdm = {
      differential: 'Test',
      data_reviewed_ordered: 'Test',
      decision_making: 'Test',
      risk: 'Test',
      disposition: '',
      disclaimers: 'Single disclaimer',
    }
    const arrayVersion: Mdm = {
      ...stringVersion,
      disclaimers: ['Disclaimer 1', 'Disclaimer 2'],
    }
    expect(renderMdmText(stringVersion)).toContain('Notes:\nSingle disclaimer')
    const arrayText = renderMdmText(arrayVersion)
    expect(arrayText).toContain('- Disclaimer 1')
    expect(arrayText).toContain('- Disclaimer 2')
  })
})
