/**
 * getIdentifiedCdrs Matching Logic Tests
 */

/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'
import { getIdentifiedCdrs } from '../components/build-mode/shared/getIdentifiedCdrs'
import type { DifferentialItem } from '../types/encounter'
import type { CdrDefinition } from '../types/libraries'

const heartCdr: CdrDefinition = {
  id: 'heart',
  name: 'HEART Score',
  fullName: 'HEART Score for Major Cardiac Events',
  applicableChiefComplaints: ['chest pain', 'acute coronary syndrome'],
  components: [
    { id: 'history', label: 'History', type: 'select', source: 'section1' },
    { id: 'ekg', label: 'EKG', type: 'select', source: 'section1' },
    { id: 'age', label: 'Age', type: 'select', source: 'section1' },
    { id: 'risk_factors', label: 'Risk Factors', type: 'select', source: 'user_input' },
    { id: 'troponin', label: 'Troponin', type: 'select', source: 'section2' },
  ],
  scoring: { method: 'sum', ranges: [{ min: 0, max: 3, risk: 'low', interpretation: 'Low risk' }] },
}

const wellsPeCdr: CdrDefinition = {
  id: 'wells_pe',
  name: 'Wells PE',
  fullName: 'Wells Criteria for Pulmonary Embolism',
  applicableChiefComplaints: ['shortness of breath', 'pleuritic chest pain'],
  components: [
    { id: 'dvt_signs', label: 'DVT Signs', type: 'boolean', source: 'section1', value: 3 },
    { id: 'pe_likely', label: 'PE Most Likely', type: 'boolean', source: 'user_input', value: 3 },
  ],
  scoring: { method: 'sum', ranges: [{ min: 0, max: 1, risk: 'low', interpretation: 'PE unlikely' }] },
}

const pecarnCdr: CdrDefinition = {
  id: 'pecarn',
  name: 'PECARN',
  fullName: 'PECARN Head Injury Rule',
  applicableChiefComplaints: ['head injury', 'head trauma'],
  components: [
    { id: 'gcs', label: 'GCS', type: 'select', source: 'section1' },
    { id: 'ct_result', label: 'CT Result', type: 'select', source: 'section2' },
  ],
  scoring: { method: 'algorithm', ranges: [] },
}

const cdrLibrary = [heartCdr, wellsPeCdr, pecarnCdr]

describe('getIdentifiedCdrs', () => {
  it('matches CDRs from cdrContext strings (name match)', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Acute Coronary Syndrome',
        urgency: 'emergent',
        reasoning: 'Chest pain with cardiac risk factors',
        cdrContext: 'HEART score applicable for ACS risk stratification',
      },
    ]

    const result = getIdentifiedCdrs(differential, cdrLibrary)

    expect(result).toHaveLength(1)
    expect(result[0].cdr.id).toBe('heart')
  })

  it('matches CDRs from cdrContext using fullName', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Pulmonary Embolism',
        urgency: 'emergent',
        reasoning: 'Dyspnea and pleuritic pain',
        cdrContext: 'Consider Wells Criteria for Pulmonary Embolism',
      },
    ]

    const result = getIdentifiedCdrs(differential, cdrLibrary)

    expect(result.some((r) => r.cdr.id === 'wells_pe')).toBe(true)
  })

  it('matches CDRs from applicableChiefComplaints against diagnoses', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Chest pain, unspecified',
        urgency: 'urgent',
        reasoning: 'Atypical presentation',
      },
    ]

    const result = getIdentifiedCdrs(differential, cdrLibrary)

    // 'chest pain' is in HEART's applicableChiefComplaints
    expect(result.some((r) => r.cdr.id === 'heart')).toBe(true)
  })

  it('returns empty array when no CDRs match', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Cellulitis',
        urgency: 'routine',
        reasoning: 'Skin infection, no systemic signs',
      },
    ]

    const result = getIdentifiedCdrs(differential, cdrLibrary)

    expect(result).toHaveLength(0)
  })

  it('deduplicates CDRs matched by both strategies', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Chest pain',
        urgency: 'emergent',
        reasoning: 'Cardiac workup needed',
        cdrContext: 'HEART score applicable',
      },
    ]

    // HEART matches via both cdrContext ("HEART score") AND applicableChiefComplaints ("chest pain")
    const result = getIdentifiedCdrs(differential, cdrLibrary)

    const heartMatches = result.filter((r) => r.cdr.id === 'heart')
    expect(heartMatches).toHaveLength(1)
  })

  it('correctly computes completable readiness (all section1/user_input)', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Pulmonary Embolism',
        urgency: 'emergent',
        reasoning: 'Dyspnea',
        cdrContext: 'Wells PE criteria applicable',
      },
    ]

    const result = getIdentifiedCdrs(differential, cdrLibrary)

    const wells = result.find((r) => r.cdr.id === 'wells_pe')
    expect(wells).toBeDefined()
    // Wells PE: all components are section1 or user_input
    expect(wells!.readiness).toBe('completable')
  })

  it('correctly computes needs_results readiness (has section2 component)', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'ACS',
        urgency: 'emergent',
        reasoning: 'Chest pain',
        cdrContext: 'HEART score applicable',
      },
    ]

    const result = getIdentifiedCdrs(differential, cdrLibrary)

    const heart = result.find((r) => r.cdr.id === 'heart')
    expect(heart).toBeDefined()
    // HEART: troponin component has source 'section2'
    expect(heart!.readiness).toBe('needs_results')
  })

  it('handles empty differential', () => {
    const result = getIdentifiedCdrs([], cdrLibrary)
    expect(result).toHaveLength(0)
  })

  it('handles empty CDR library', () => {
    const differential: DifferentialItem[] = [
      {
        diagnosis: 'Chest pain',
        urgency: 'emergent',
        reasoning: 'Cardiac workup',
        cdrContext: 'HEART score',
      },
    ]

    const result = getIdentifiedCdrs(differential, [])
    expect(result).toHaveLength(0)
  })
})
