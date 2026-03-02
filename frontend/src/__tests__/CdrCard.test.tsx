/**
 * CdrCard Component Tests
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CdrCard from '../components/build-mode/shared/CdrCard'
import type { IdentifiedCdr } from '../components/build-mode/shared/getIdentifiedCdrs'
import type { CdrDefinition } from '../types/libraries'
import type { CdrAnalysisItem } from '../types/encounter'

const heartCdr: CdrDefinition = {
  id: 'heart',
  name: 'HEART Score',
  fullName: 'HEART Score for Major Cardiac Events',
  applicableChiefComplaints: ['chest pain'],
  components: [
    { id: 'history', label: 'History', type: 'select', source: 'section1' },
    { id: 'troponin', label: 'Troponin', type: 'select', source: 'section2' },
  ],
  scoring: { method: 'sum', ranges: [{ min: 0, max: 3, risk: 'low', interpretation: 'Low risk' }] },
}

const wellsCdr: CdrDefinition = {
  id: 'wells_pe',
  name: 'Wells PE',
  fullName: 'Wells Criteria for Pulmonary Embolism',
  applicableChiefComplaints: ['shortness of breath'],
  components: [
    { id: 'dvt_signs', label: 'DVT Signs', type: 'boolean', source: 'section1', value: 3 },
    { id: 'pe_likely', label: 'PE Most Likely', type: 'boolean', source: 'user_input', value: 3 },
  ],
  scoring: {
    method: 'sum',
    ranges: [{ min: 0, max: 1, risk: 'low', interpretation: 'PE unlikely' }],
  },
}

const mockIdentifiedCdrs: IdentifiedCdr[] = [
  { cdr: heartCdr, readiness: 'needs_results' },
  { cdr: wellsCdr, readiness: 'completable' },
]

describe('CdrCard', () => {
  it('renders identified CDRs with name', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    expect(screen.getByText('HEART Score')).toBeDefined()
    expect(screen.getByText('Wells PE')).toBeDefined()
  })

  it('shows Expand All button in header instead of count badge', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    expect(screen.getByText('Expand All')).toBeDefined()
    // Should NOT have the old "X identified" badge
    expect(screen.queryByText('2 identified')).toBeNull()
  })

  it('shows three status badges with correct counts', () => {
    render(
      <CdrCard
        identifiedCdrs={mockIdentifiedCdrs}
        cdrLibrary={[heartCdr, wellsCdr]}
        loading={false}
      />,
    )

    // HEART has section2 component (troponin) so needs_data
    // Wells PE has all section1/user_input components so needs_history
    expect(screen.getByText(/1 Needs Data/)).toBeDefined()
    expect(screen.getByText(/1 Needs History/)).toBeDefined()
    expect(screen.getByText(/0 Complete/)).toBeDefined()
  })

  it('shows loading state', () => {
    render(<CdrCard identifiedCdrs={[]} loading={true} />)

    expect(screen.getByText('Clinical Decision Rules')).toBeDefined()
    expect(screen.getByText('Loading CDR library...')).toBeDefined()
  })

  it('shows empty state when no CDRs identified', () => {
    render(<CdrCard identifiedCdrs={[]} loading={false} />)

    expect(screen.getByText('No CDRs identified for this differential')).toBeDefined()
  })

  it('"View CDRs" button is present', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    const btn = screen.getByText('View CDRs')
    expect(btn).toBeDefined()
    expect(btn.tagName).toBe('BUTTON')
  })

  it('"View CDRs" button shows fallback text when no handler provided', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    const btn = screen.getByText('View CDRs')
    expect(btn.getAttribute('title')).toBe('Available after CDR matching completes')
  })

  it('calls onViewCdrs callback when button is clicked', () => {
    const onViewCdrs = vi.fn()
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} onViewCdrs={onViewCdrs} />)

    fireEvent.click(screen.getByText('View CDRs'))
    expect(onViewCdrs).toHaveBeenCalledTimes(1)
  })

  it('"View CDRs" button is disabled when no handler provided', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    const btn = screen.getByText('View CDRs') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('shows error state when error is provided', () => {
    render(<CdrCard identifiedCdrs={[]} loading={false} error="Server error" />)

    expect(screen.getByText('Unable to load CDR library')).toBeDefined()
    expect(screen.queryByText('No CDRs identified for this differential')).toBeNull()
  })

  it('toggles expand/collapse all', () => {
    const { container } = render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    // Initially collapsed
    expect(container.querySelectorAll('.cdr-row__details').length).toBe(0)

    // Click Expand All
    fireEvent.click(screen.getByText('Expand All'))
    expect(container.querySelectorAll('.cdr-row__details').length).toBe(2)
    expect(screen.getByText('Collapse All')).toBeDefined()

    // Click Collapse All
    fireEvent.click(screen.getByText('Collapse All'))
    expect(container.querySelectorAll('.cdr-row__details').length).toBe(0)
    expect(screen.getByText('Expand All')).toBeDefined()
  })

  it('uses down/up arrow chevrons', () => {
    const { container } = render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    // Collapsed state: down arrows
    const chevrons = container.querySelectorAll('.cdr-row__chevron')
    expect(chevrons.length).toBeGreaterThan(0)
    chevrons.forEach((chevron) => {
      expect(chevron.textContent).toBe('\u25BC') // down arrow
    })

    // Expand first CDR
    const firstRow = container.querySelector('.cdr-row__header')
    fireEvent.click(firstRow!)

    // First chevron should now be up arrow
    const firstChevron = container.querySelector('.cdr-row__chevron')
    expect(firstChevron!.textContent).toBe('\u25B2') // up arrow
  })

  // --- LLM cdrAnalysis prop tests ---

  it('renders LLM cdrAnalysis with score and interpretation in name', () => {
    const cdrAnalysis: CdrAnalysisItem[] = [
      {
        name: 'HEART Score',
        applicable: true,
        score: 4,
        interpretation: 'Moderate risk',
        reasoning: 'Calculated from available data',
      },
    ]
    render(<CdrCard identifiedCdrs={[]} cdrAnalysis={cdrAnalysis} loading={false} />)

    // Score should be in the CDR row name area
    const nameEl = screen.getByText(/HEART Score.*4/)
    expect(nameEl.textContent).toContain('Moderate risk')
  })

  it('renders LLM cdrAnalysis with missing data as needs_data status', () => {
    const cdrAnalysis: CdrAnalysisItem[] = [
      {
        name: 'Wells PE',
        applicable: true,
        missingData: ['D-dimer', 'CT angiography'],
        reasoning: 'Need lab results',
      },
    ]
    const { container } = render(
      <CdrCard identifiedCdrs={[]} cdrAnalysis={cdrAnalysis} loading={false} />,
    )

    expect(screen.getByText('Wells PE')).toBeDefined()
    // Should have needs_data status in the badge
    expect(screen.getByText(/1 Needs Data/)).toBeDefined()
    // Row should have needs_data border
    const row = container.querySelector('.cdr-row--needs_data')
    expect(row).not.toBeNull()
  })

  it('merges LLM cdrAnalysis with client-side identifiedCdrs', () => {
    const cdrAnalysis: CdrAnalysisItem[] = [
      {
        name: 'HEART Score',
        applicable: true,
        score: 3,
        interpretation: 'Low risk',
      },
    ]
    const clientCdrs: IdentifiedCdr[] = [{ cdr: wellsCdr, readiness: 'completable' }]

    render(<CdrCard identifiedCdrs={clientCdrs} cdrAnalysis={cdrAnalysis} loading={false} />)

    // Both should appear
    expect(screen.getByText(/HEART Score/)).toBeDefined()
    expect(screen.getByText('Wells PE')).toBeDefined()
  })

  it('LLM cdrAnalysis takes priority over client-side match', () => {
    const cdrAnalysis: CdrAnalysisItem[] = [
      {
        name: 'HEART Score',
        applicable: true,
        score: 5,
        interpretation: 'High risk',
      },
    ]
    const clientCdrs: IdentifiedCdr[] = [{ cdr: heartCdr, readiness: 'needs_results' }]

    render(<CdrCard identifiedCdrs={clientCdrs} cdrAnalysis={cdrAnalysis} loading={false} />)

    // Should show LLM score
    const nameEl = screen.getByText(/HEART Score.*5/)
    expect(nameEl.textContent).toContain('High risk')
    expect(screen.queryByText('Requires workup results')).toBeNull()
  })
})
