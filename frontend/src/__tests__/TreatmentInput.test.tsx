/**
 * TreatmentInput Component Tests
 *
 * Tests CDR-suggested treatment checkboxes, working diagnosis display,
 * checkbox toggle behavior, and free-text treatment area.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TreatmentInput from '../components/build-mode/shared/TreatmentInput'
import type { EncounterDocument, CdrTracking } from '../types/encounter'
import type { CdrDefinition } from '../types/libraries'
import type { Timestamp } from 'firebase/firestore'

// --- Mock Timestamp ---
const mockTimestamp = { seconds: 1700000000, nanoseconds: 0 } as Timestamp

// --- CDR Library Fixtures ---
const heartCdr: CdrDefinition = {
  id: 'heart',
  name: 'HEART Score',
  fullName: 'History, ECG, Age, Risk Factors, Troponin',
  applicableChiefComplaints: ['chest pain'],
  components: [],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 0, max: 3, risk: 'Low', interpretation: '1.7% risk of MACE at 6 weeks.' },
      { min: 4, max: 6, risk: 'Moderate', interpretation: '12-16.6% risk of MACE at 6 weeks.' },
      { min: 7, max: 10, risk: 'High', interpretation: '50-65% risk of MACE at 6 weeks.' },
    ],
  },
  suggestedTreatments: {
    High: ['aspirin_325', 'heparin_drip', 'cardiology_consult', 'admit_telemetry'],
    Moderate: ['aspirin_325', 'serial_troponins', 'observation', 'cardiology_consult'],
    Low: ['discharge_with_follow_up', 'outpatient_stress_test'],
  },
}

const wellsCdr: CdrDefinition = {
  id: 'wells_pe',
  name: 'Wells PE',
  fullName: 'Wells Criteria for Pulmonary Embolism',
  applicableChiefComplaints: ['shortness of breath'],
  components: [],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 0, max: 1, risk: 'Low', interpretation: 'Low probability PE.' },
      { min: 2, max: 6, risk: 'Moderate', interpretation: 'Moderate probability PE.' },
    ],
  },
  // No suggestedTreatments
}

const cdrLibraryFixture: CdrDefinition[] = [heartCdr, wellsCdr]

// --- Encounter Fixtures ---
function makeEncounter(overrides: {
  cdrTracking?: CdrTracking
  workingDiagnosis?: string | { selected: string | null; custom?: string | null; suggestedOptions?: string[] }
} = {}): EncounterDocument {
  return {
    id: 'enc-1',
    userId: 'user-1',
    roomNumber: '5',
    chiefComplaint: 'Chest pain',
    status: 'section2_done',
    currentSection: 3,
    mode: 'build',
    section1: { status: 'completed', content: 'test', submissionCount: 1, isLocked: false },
    section2: {
      status: 'completed',
      content: 'test',
      submissionCount: 1,
      isLocked: false,
      workingDiagnosis: overrides.workingDiagnosis ?? { selected: 'Acute Coronary Syndrome', custom: null },
    },
    section3: { status: 'pending', content: '', submissionCount: 0, isLocked: false },
    cdrTracking: overrides.cdrTracking ?? {},
    quotaCounted: false,
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    shiftStartedAt: mockTimestamp,
  }
}

describe('TreatmentInput', () => {
  it('renders working diagnosis when present', () => {
    const encounter = makeEncounter()
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.getByTestId('treatment-diagnosis')).toBeDefined()
    expect(screen.getByText('Acute Coronary Syndrome')).toBeDefined()
  })

  it('renders working diagnosis from legacy string', () => {
    const encounter = makeEncounter({ workingDiagnosis: 'STEMI' })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.getByText('STEMI')).toBeDefined()
  })

  it('does not render diagnosis section when no diagnosis set', () => {
    const encounter = makeEncounter()
    // Override section2 to have no working diagnosis
    encounter.section2.workingDiagnosis = undefined
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.queryByTestId('treatment-diagnosis')).toBeNull()
  })

  it('renders CDR-suggested treatments when completed CDR has suggestions', () => {
    const cdrTracking: CdrTracking = {
      heart: {
        name: 'HEART Score',
        status: 'completed',
        dismissed: false,
        components: {},
        score: 7,
        interpretation: 'High: 50-65% risk of MACE at 6 weeks.',
      },
    }
    const encounter = makeEncounter({ cdrTracking })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.getByTestId('treatment-suggestions')).toBeDefined()
    expect(screen.getByTestId('treatment-group-heart')).toBeDefined()
    expect(screen.getByText('HEART Score')).toBeDefined()
    expect(screen.getByText('Aspirin 325')).toBeDefined()
    expect(screen.getByText('Heparin Drip')).toBeDefined()
    expect(screen.getByText('Cardiology Consult')).toBeDefined()
    expect(screen.getByText('Admit Telemetry')).toBeDefined()
  })

  it('does not show suggestions when no CDRs are completed', () => {
    const encounter = makeEncounter({ cdrTracking: {} })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.queryByTestId('treatment-suggestions')).toBeNull()
  })

  it('does not show suggestions for CDRs without suggestedTreatments', () => {
    const cdrTracking: CdrTracking = {
      wells_pe: {
        name: 'Wells PE',
        status: 'completed',
        dismissed: false,
        components: {},
        score: 3,
        interpretation: 'Moderate: Moderate probability PE.',
      },
    }
    const encounter = makeEncounter({ cdrTracking })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.queryByTestId('treatment-suggestions')).toBeNull()
  })

  it('does not show suggestions for dismissed CDRs', () => {
    const cdrTracking: CdrTracking = {
      heart: {
        name: 'HEART Score',
        status: 'completed',
        dismissed: true,
        components: {},
        score: 7,
        interpretation: 'High: 50-65% risk of MACE at 6 weeks.',
      },
    }
    const encounter = makeEncounter({ cdrTracking })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.queryByTestId('treatment-suggestions')).toBeNull()
  })

  it('selecting a checkbox calls onUpdate with appended treatment text', () => {
    const onUpdate = vi.fn()
    const cdrTracking: CdrTracking = {
      heart: {
        name: 'HEART Score',
        status: 'completed',
        dismissed: false,
        components: {},
        score: 7,
        interpretation: 'High: 50-65% risk of MACE at 6 weeks.',
      },
    }
    const encounter = makeEncounter({ cdrTracking })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={onUpdate}
      />
    )

    fireEvent.click(screen.getByText('Aspirin 325'))
    expect(onUpdate).toHaveBeenCalledWith(
      '- Aspirin 325',
      ['heart:aspirin_325']
    )
  })

  it('deselecting a checkbox calls onUpdate with removed treatment text', () => {
    const onUpdate = vi.fn()
    const cdrTracking: CdrTracking = {
      heart: {
        name: 'HEART Score',
        status: 'completed',
        dismissed: false,
        components: {},
        score: 7,
        interpretation: 'High: 50-65% risk of MACE at 6 weeks.',
      },
    }
    const encounter = makeEncounter({ cdrTracking })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={['heart:aspirin_325']}
        treatmentText="- Aspirin 325"
        onUpdate={onUpdate}
      />
    )

    fireEvent.click(screen.getByText('Aspirin 325'))
    expect(onUpdate).toHaveBeenCalledWith(
      '',
      []
    )
  })

  it('free-text change calls onUpdate', () => {
    const onUpdate = vi.fn()
    const encounter = makeEncounter()
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={onUpdate}
      />
    )

    const textarea = screen.getByTestId('treatment-textarea')
    fireEvent.change(textarea, { target: { value: 'IV fluids 1L NS bolus' } })
    expect(onUpdate).toHaveBeenCalledWith('IV fluids 1L NS bolus', [])
  })

  it('disabled state prevents checkbox interaction', () => {
    const onUpdate = vi.fn()
    const cdrTracking: CdrTracking = {
      heart: {
        name: 'HEART Score',
        status: 'completed',
        dismissed: false,
        components: {},
        score: 7,
        interpretation: 'High: 50-65% risk of MACE at 6 weeks.',
      },
    }
    const encounter = makeEncounter({ cdrTracking })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={onUpdate}
        disabled
      />
    )

    const checkbox = screen.getAllByRole('checkbox')[0]
    expect(checkbox).toHaveProperty('disabled', true)
  })

  it('shows risk level badge with score', () => {
    const cdrTracking: CdrTracking = {
      heart: {
        name: 'HEART Score',
        status: 'completed',
        dismissed: false,
        components: {},
        score: 5,
        interpretation: 'Moderate: 12-16.6% risk of MACE at 6 weeks.',
      },
    }
    const encounter = makeEncounter({ cdrTracking })
    render(
      <TreatmentInput
        encounter={encounter}
        cdrLibrary={cdrLibraryFixture}
        selectedTreatments={[]}
        treatmentText=""
        onUpdate={vi.fn()}
      />
    )

    expect(screen.getByText('5 - Moderate')).toBeDefined()
    // Moderate HEART score shows moderate treatments
    expect(screen.getByText('Aspirin 325')).toBeDefined()
    expect(screen.getByText('Serial Troponins')).toBeDefined()
    expect(screen.getByText('Observation')).toBeDefined()
  })
})
