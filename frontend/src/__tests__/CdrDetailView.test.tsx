/**
 * CdrDetailView Component Tests
 *
 * Tests CDR detail view rendering, component inputs, scoring, dismissal,
 * AI indicators, and navigation.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CdrDetailView from '../components/build-mode/shared/CdrDetailView'
import type { EncounterDocument, CdrTracking } from '../types/encounter'
import type { CdrDefinition } from '../types/libraries'

// Mock Firebase (useCdrTracking needs it)
vi.mock('../lib/firebase', () => ({
  db: {},
  useAuth: () => ({ user: { uid: 'test-uid' } }),
  useAuthToken: () => 'test-token',
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
}))

// --- Test fixtures ---

const heartCdr: CdrDefinition = {
  id: 'heart',
  name: 'HEART Score',
  fullName: 'HEART Score for Major Cardiac Events',
  applicableChiefComplaints: ['chest pain'],
  components: [
    {
      id: 'history',
      label: 'History',
      type: 'select',
      source: 'section1',
      options: [
        { label: 'Slightly suspicious', value: 0 },
        { label: 'Moderately suspicious', value: 1 },
        { label: 'Highly suspicious', value: 2 },
      ],
    },
    { id: 'age', label: 'Age', type: 'select', source: 'section1', options: [
      { label: '<45', value: 0 },
      { label: '45-64', value: 1 },
      { label: '>=65', value: 2 },
    ] },
    { id: 'troponin', label: 'Troponin', type: 'select', source: 'section2', options: [
      { label: 'Normal', value: 0 },
      { label: '1-3x', value: 1 },
      { label: '>3x', value: 2 },
    ] },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 0, max: 3, risk: 'Low', interpretation: 'Safe for discharge' },
      { min: 4, max: 6, risk: 'Moderate', interpretation: 'Observation recommended' },
    ],
  },
}

const wellsCdr: CdrDefinition = {
  id: 'wells_pe',
  name: 'Wells PE',
  fullName: 'Wells Criteria for Pulmonary Embolism',
  applicableChiefComplaints: ['shortness of breath'],
  components: [
    { id: 'dvt_signs', label: 'DVT Signs', type: 'boolean', source: 'section1', value: 3 },
    { id: 'pe_likely', label: 'PE Most Likely Diagnosis', type: 'boolean', source: 'user_input', value: 3 },
  ],
  scoring: {
    method: 'sum',
    ranges: [
      { min: 0, max: 1, risk: 'Low', interpretation: 'PE unlikely' },
      { min: 2, max: 6, risk: 'Moderate', interpretation: 'Consider D-dimer' },
    ],
  },
}

const cdrLibrary: CdrDefinition[] = [heartCdr, wellsCdr]

function makeTracking(overrides?: Partial<CdrTracking>): CdrTracking {
  return {
    heart: {
      name: 'HEART Score',
      status: 'partial',
      identifiedInSection: 1,
      completedInSection: null,
      dismissed: false,
      components: {
        history: { value: 1, source: 'section1', answered: true },
        age: { value: null, source: 'section1', answered: false },
        troponin: { value: null, source: 'section2', answered: false },
      },
      score: null,
      interpretation: null,
    },
    wells_pe: {
      name: 'Wells PE',
      status: 'pending',
      identifiedInSection: 1,
      completedInSection: null,
      dismissed: false,
      components: {
        dvt_signs: { value: null, source: 'section1', answered: false },
        pe_likely: { value: null, source: 'user_input', answered: false },
      },
      score: null,
      interpretation: null,
    },
    ...overrides,
  }
}

function makeEncounter(trackingOverrides?: Partial<CdrTracking>): EncounterDocument {
  const ts = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp
  return {
    id: 'enc-001',
    userId: 'test-uid',
    roomNumber: '5',
    chiefComplaint: 'chest pain',
    status: 'section1_done',
    currentSection: 1,
    mode: 'build',
    section1: { status: 'completed', content: 'test', submissionCount: 1, isLocked: false },
    section2: { status: 'pending', content: '', submissionCount: 0, isLocked: false },
    section3: { status: 'pending', content: '', submissionCount: 0, isLocked: false },
    cdrTracking: makeTracking(trackingOverrides),
    quotaCounted: false,
    createdAt: ts,
    updatedAt: ts,
    shiftStartedAt: ts,
  }
}

describe('CdrDetailView', () => {
  it('renders CDR list from cdrTracking + cdrLibrary', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    expect(screen.getByText('HEART Score')).toBeDefined()
    expect(screen.getByText('Wells PE')).toBeDefined()
    expect(screen.getByText('2 active')).toBeDefined()
  })

  it('shows "(AI)" badge on auto-populated section1 components', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // HEART History was auto-populated (answered: true, source: section1)
    const aiBadges = screen.getAllByText('(AI)')
    expect(aiBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('selects the AI-populated option for HEART History', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // The "Moderately suspicious" option should have aria-pressed="true" (value: 1 matches auto-populated value)
    const moderateBtn = screen.getByRole('button', { name: /Moderately suspicious/ })
    expect(moderateBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('shows "Pending results" for section2-sourced components', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    expect(screen.getByText('Pending results')).toBeDefined()
  })

  it('calls onAnswer when clicking a component option', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Click the "<45" age option for HEART Score
    const ageBtn = screen.getByRole('button', { name: /<45/ })
    fireEvent.click(ageBtn)

    // After clicking, the button should become selected
    expect(ageBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('removes "(AI)" badge after user overrides an AI-populated value', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Initially, HEART History has AI badge (auto-populated, source: section1)
    const initialBadges = screen.getAllByText('(AI)')
    const initialCount = initialBadges.length

    // Click "Highly suspicious" to override AI value for History
    const highBtn = screen.getByRole('button', { name: /Highly suspicious/ })
    fireEvent.click(highBtn)

    // After user override, source changes to user_input so AI badge should disappear
    const remainingBadges = screen.queryAllByText('(AI)')
    expect(remainingBadges.length).toBe(initialCount - 1)
  })

  it('shows score and interpretation for completed CDRs', () => {
    const encounter = makeEncounter({
      heart: {
        name: 'HEART Score',
        status: 'completed',
        identifiedInSection: 1,
        completedInSection: 1,
        dismissed: false,
        components: {
          history: { value: 1, source: 'section1', answered: true },
          age: { value: 0, source: 'section1', answered: true },
          troponin: { value: 0, source: 'section2', answered: true },
        },
        score: 1,
        interpretation: 'Low: Safe for discharge',
      },
    })

    render(<CdrDetailView encounter={encounter} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    expect(screen.getByText(/Score: 1/)).toBeDefined()
    expect(screen.getByText(/Low: Safe for discharge/)).toBeDefined()
  })

  it('dismiss button shows confirmation warning', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Click the first "Dismiss CDR" button
    const dismissBtns = screen.getAllByText('Dismiss CDR')
    fireEvent.click(dismissBtns[0])

    // Should show warning text
    expect(screen.getByText(/Dismissing a CDR excludes it from your final MDM/)).toBeDefined()
  })

  it('confirming dismiss sets CDR to dismissed state', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Click dismiss, then confirm
    const dismissBtns = screen.getAllByText('Dismiss CDR')
    fireEvent.click(dismissBtns[0])
    fireEvent.click(screen.getByText('Dismiss'))

    // Now should show "Dismissed" badge and "Restore CDR" button
    expect(screen.getByText('Dismissed')).toBeDefined()
    expect(screen.getByText('Restore CDR')).toBeDefined()
  })

  it('dismissed CDR shows strikethrough name', () => {
    const encounter = makeEncounter({
      heart: {
        ...makeTracking().heart,
        status: 'dismissed',
        dismissed: true,
      },
    })

    render(<CdrDetailView encounter={encounter} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Find the HEART Score name element with dismissed class
    const heartName = screen.getByText('HEART Score')
    expect(heartName.className).toContain('dismissed')
  })

  it('back button calls onBack', () => {
    const onBack = vi.fn()
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={onBack} />)

    fireEvent.click(screen.getByText(/Back/))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no CDRs in tracking', () => {
    const encounter = makeEncounter()
    encounter.cdrTracking = {}

    render(<CdrDetailView encounter={encounter} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    expect(screen.getByText('No CDRs matched for this encounter')).toBeDefined()
  })

  it('shows progress indicator for partial CDRs', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // HEART has 1/3 answered
    expect(screen.getByText('1/3 answered')).toBeDefined()
  })

  it('renders boolean toggle buttons for boolean components', () => {
    render(<CdrDetailView encounter={makeEncounter()} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Wells PE has boolean components — find Present/Absent buttons
    expect(screen.getAllByText(/Present/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Absent/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows completed CDR after S2 auto-population fills remaining components', () => {
    // Simulate a HEART Score where all components are now answered (S2 troponin was auto-populated)
    const encounter = makeEncounter({
      heart: {
        name: 'HEART Score',
        status: 'completed',
        identifiedInSection: 1,
        completedInSection: 2,
        dismissed: false,
        components: {
          history: { value: 1, source: 'section1', answered: true },
          age: { value: 1, source: 'user_input', answered: true },
          troponin: { value: 0, source: 'section2', answered: true },
        },
        score: 2,
        interpretation: 'Low: Safe for discharge',
      },
    })

    render(<CdrDetailView encounter={encounter} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Completed CDR should show score and interpretation
    expect(screen.getByText(/Score: 2/)).toBeDefined()
    expect(screen.getByText(/Low: Safe for discharge/)).toBeDefined()
  })

  it('does not show (AI) badge for section2-auto-populated components', () => {
    // S2-sourced component that was auto-populated: source is 'section2', not 'section1'
    const encounter = makeEncounter({
      heart: {
        name: 'HEART Score',
        status: 'completed',
        identifiedInSection: 1,
        completedInSection: 2,
        dismissed: false,
        components: {
          history: { value: 1, source: 'section1', answered: true },
          age: { value: 1, source: 'user_input', answered: true },
          troponin: { value: 0, source: 'section2', answered: true },
        },
        score: 2,
        interpretation: 'Low: Safe for discharge',
      },
    })

    render(<CdrDetailView encounter={encounter} cdrLibrary={cdrLibrary} onBack={vi.fn()} />)

    // Only the section1-sourced component should have (AI) badge
    const aiBadges = screen.getAllByText('(AI)')
    // history has source: section1 → AI badge. Age has user_input → no badge. Troponin has section2 → no badge.
    expect(aiBadges.length).toBe(1)
  })
})
