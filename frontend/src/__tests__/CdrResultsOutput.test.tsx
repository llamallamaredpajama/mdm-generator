/**
 * CdrResultsOutput Component Tests (BM-5.3)
 *
 * Tests the brief S2 CDR output: working diagnosis display, test result
 * summary counts, CDR score cards with expandable components, and pending CDRs.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CdrResultsOutput from '../components/build-mode/shared/CdrResultsOutput'
import type { EncounterDocument } from '../types/encounter'
import type { Timestamp } from 'firebase/firestore'

const fakeTimestamp = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 } as unknown as Timestamp

// Mock useTestLibrary
vi.mock('../hooks/useTestLibrary', () => ({
  useTestLibrary: () => ({
    tests: [
      { id: 'cbc', name: 'CBC', category: 'labs', subcategory: 'hematology', commonIndications: [], unit: null, normalRange: null, quickFindings: [], feedsCdrs: [] },
      { id: 'troponin', name: 'Troponin', category: 'labs', subcategory: 'cardiac', commonIndications: [], unit: 'ng/mL', normalRange: '<0.04', quickFindings: [], feedsCdrs: [] },
      { id: 'ct_head', name: 'CT Head', category: 'imaging', subcategory: 'head', commonIndications: [], unit: null, normalRange: null, quickFindings: [], feedsCdrs: [] },
    ],
    loading: false,
    error: null,
  }),
}))

function createEncounter(overrides: Partial<EncounterDocument> = {}): EncounterDocument {
  return {
    id: 'enc-123',
    userId: 'user-1',
    roomNumber: 'R5',
    chiefComplaint: 'Chest pain',
    status: 'active',
    mode: 'build',
    section1: {
      content: 'Chief complaint: chest pain',
      status: 'completed',
      submissionCount: 1,
      isLocked: false,
      llmResponse: { differential: [] },
    },
    section2: {
      content: '',
      status: 'completed',
      submissionCount: 1,
      isLocked: false,
      llmResponse: null,
      workingDiagnosis: { selected: 'Acute Coronary Syndrome', custom: null, suggestedOptions: ['ACS', 'PE'] },
      selectedTests: ['cbc', 'troponin', 'ct_head'],
      testResults: {
        cbc: { status: 'unremarkable', quickFindings: [], notes: null, value: '8500', unit: 'cells/mcL' },
        troponin: { status: 'abnormal', quickFindings: ['Elevated'], notes: 'Elevated troponin', value: '0.15', unit: 'ng/mL' },
        ct_head: { status: 'unremarkable', quickFindings: [], notes: null, value: null, unit: null },
      },
    },
    section3: {
      content: '',
      status: 'not_started',
      submissionCount: 0,
      isLocked: false,
      llmResponse: null,
    },
    cdrTracking: {
      heart: {
        name: 'HEART Score',
        status: 'completed',
        identifiedInSection: 1,
        completedInSection: 2,
        dismissed: false,
        components: {
          history: { value: 2, answered: true, source: 'section1' },
          ecg: { value: 0, answered: true, source: 'section2' },
          age: { value: 1, answered: true, source: 'user_input' },
          risk_factors: { value: 1, answered: true, source: 'user_input' },
          troponin: { value: 2, answered: true, source: 'section2' },
        },
        score: 6,
        interpretation: 'Moderate risk: Consider admission',
      },
      wells_pe: {
        name: 'Wells PE',
        status: 'partial',
        identifiedInSection: 1,
        completedInSection: null,
        dismissed: false,
        components: {
          dvt_signs: { value: 0, answered: true, source: 'section1' },
          pe_likely: { answered: false },
          hr_over_100: { answered: false },
        },
        score: null,
        interpretation: null,
      },
    },
    quotaCounted: false,
    createdAt: fakeTimestamp,
    updatedAt: fakeTimestamp,
    shiftStartedAt: fakeTimestamp,
    ...overrides,
  } as EncounterDocument
}

describe('CdrResultsOutput', () => {
  it('renders the working diagnosis', () => {
    const encounter = createEncounter()
    render(<CdrResultsOutput encounter={encounter} />)
    expect(screen.getByTestId('cdr-results-dx').textContent).toBe('Acute Coronary Syndrome')
  })

  it('renders test result summary with counts', () => {
    const encounter = createEncounter()
    render(<CdrResultsOutput encounter={encounter} />)
    const summary = screen.getByTestId('cdr-results-summary')
    expect(summary.textContent).toContain('3 of 3 tests resulted')
    expect(summary.textContent).toContain('1 abnormal')
  })

  it('lists abnormal test names', () => {
    const encounter = createEncounter()
    const { container } = render(<CdrResultsOutput encounter={encounter} />)
    const abnormals = container.querySelector('[data-testid="cdr-results-abnormals"]')
    expect(abnormals).not.toBeNull()
    expect(abnormals!.textContent).toContain('Troponin')
  })

  it('renders completed CDR score card', () => {
    const encounter = createEncounter()
    const { container } = render(<CdrResultsOutput encounter={encounter} />)
    const heartCard = container.querySelector('[data-testid="cdr-score-heart"]')
    expect(heartCard).not.toBeNull()
    expect(heartCard!.textContent).toContain('HEART Score')
    expect(heartCard!.textContent).toContain('Score: 6')
    expect(heartCard!.textContent).toContain('Moderate risk: Consider admission')
  })

  it('expands CDR to show component breakdown on click', () => {
    const encounter = createEncounter()
    const { container } = render(<CdrResultsOutput encounter={encounter} />)

    // Components not shown initially
    expect(container.querySelector('[data-testid="cdr-components-heart"]')).toBeNull()

    // Click to expand
    const heartHeader = container.querySelector('[data-testid="cdr-score-heart"] button')
    if (heartHeader) fireEvent.click(heartHeader)

    // Components now shown
    const components = container.querySelector('[data-testid="cdr-components-heart"]')
    expect(components).not.toBeNull()
    expect(components!.textContent).toContain('history')
    expect(components!.textContent).toContain('troponin')
  })

  it('collapses CDR on second click', () => {
    const encounter = createEncounter()
    const { container } = render(<CdrResultsOutput encounter={encounter} />)

    const heartHeader = container.querySelector('[data-testid="cdr-score-heart"] button')
    if (heartHeader) {
      fireEvent.click(heartHeader) // expand
      fireEvent.click(heartHeader) // collapse
    }

    expect(container.querySelector('[data-testid="cdr-components-heart"]')).toBeNull()
  })

  it('renders pending CDRs with progress', () => {
    const encounter = createEncounter()
    const { container } = render(<CdrResultsOutput encounter={encounter} />)
    const pending = container.querySelector('[data-testid="cdr-pending-wells_pe"]')
    expect(pending).not.toBeNull()
    expect(pending!.textContent).toContain('Wells PE')
    expect(pending!.textContent).toContain('1/3')
  })

  it('hides working diagnosis when not set', () => {
    const base = createEncounter()
    const encounter: EncounterDocument = {
      ...base,
      section2: { ...base.section2, workingDiagnosis: undefined },
    }
    const { container } = render(<CdrResultsOutput encounter={encounter} />)
    expect(container.querySelector('[data-testid="cdr-results-dx"]')).toBeNull()
  })

  it('handles legacy string working diagnosis', () => {
    const base = createEncounter()
    const encounter: EncounterDocument = {
      ...base,
      section2: { ...base.section2, workingDiagnosis: 'Pneumonia' },
    }
    render(<CdrResultsOutput encounter={encounter} />)
    expect(screen.getByTestId('cdr-results-dx').textContent).toBe('Pneumonia')
  })

  it('shows footer note about Section 3', () => {
    const encounter = createEncounter()
    render(<CdrResultsOutput encounter={encounter} />)
    expect(screen.getByText('Complete Section 3 to generate your final MDM documentation')).not.toBeNull()
  })

  it('handles encounter with no CDR tracking', () => {
    const encounter = createEncounter({ cdrTracking: {} })
    const { container } = render(<CdrResultsOutput encounter={encounter} />)
    // Should still render without errors
    expect(container.querySelector('[data-testid="cdr-results-output"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="cdr-results-summary"]')).not.toBeNull()
  })
})
