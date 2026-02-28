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
  it('renders identified CDRs with name and indicator', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    expect(screen.getByText('HEART Score')).toBeDefined()
    expect(screen.getByText('Wells PE')).toBeDefined()
  })

  it('shows count badge in header', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    expect(screen.getByText('2 identified')).toBeDefined()
  })

  it('shows readiness status labels', () => {
    const { container } = render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    // "needs_results" CDR shows "needs data" status
    const needsDataStatus = container.querySelector('.cdr-card__status--needs_data')
    expect(needsDataStatus).not.toBeNull()
    expect(needsDataStatus!.textContent).toBe('needs data')

    // "completable" CDR shows "completable" status
    const completableStatus = container.querySelector('.cdr-card__status--completable')
    expect(completableStatus).not.toBeNull()
    expect(completableStatus!.textContent).toBe('completable')
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

  it('shows "1 identified" for single CDR', () => {
    render(<CdrCard identifiedCdrs={[mockIdentifiedCdrs[0]]} loading={false} />)

    expect(screen.getByText('1 identified')).toBeDefined()
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
    // Should NOT show the empty state message
    expect(screen.queryByText('No CDRs identified for this differential')).toBeNull()
  })

  // --- LLM cdrAnalysis prop tests ---

  it('renders LLM cdrAnalysis with score and interpretation in pill', () => {
    const cdrAnalysis: CdrAnalysisItem[] = [
      {
        name: 'HEART Score',
        applicable: true,
        score: 4,
        interpretation: 'Moderate risk',
        reasoning: 'Calculated from available data',
      },
    ]
    const { container } = render(<CdrCard identifiedCdrs={[]} cdrAnalysis={cdrAnalysis} loading={false} />)

    // Score is shown inside the pill: "HEART Score: 4 — Moderate risk"
    const pill = container.querySelector('.cdr-card__pill')
    expect(pill).not.toBeNull()
    expect(pill!.textContent).toContain('HEART Score')
    expect(pill!.textContent).toContain('4')
    expect(pill!.textContent).toContain('Moderate risk')
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
    const { container } = render(<CdrCard identifiedCdrs={[]} cdrAnalysis={cdrAnalysis} loading={false} />)

    expect(screen.getByText('Wells PE')).toBeDefined()
    // Missing data CDRs show "needs data" status label
    const status = container.querySelector('.cdr-card__status--needs_data')
    expect(status).not.toBeNull()
    expect(status!.textContent).toBe('needs data')
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
    // Client-side has Wells PE which is NOT in LLM analysis — should be added
    const clientCdrs: IdentifiedCdr[] = [{ cdr: wellsCdr, readiness: 'completable' }]

    const { container } = render(<CdrCard identifiedCdrs={clientCdrs} cdrAnalysis={cdrAnalysis} loading={false} />)

    // Both should appear — HEART Score pill includes score text
    const pills = container.querySelectorAll('.cdr-card__pill')
    const pillTexts = Array.from(pills).map((p) => p.textContent)
    expect(pillTexts.some((t) => t?.includes('HEART Score'))).toBe(true)
    expect(pillTexts.some((t) => t?.includes('Wells PE'))).toBe(true)
    // Total count should be 2
    expect(screen.getByText('2 identified')).toBeDefined()
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
    // Client-side also has HEART — LLM version should take priority (shows score)
    const clientCdrs: IdentifiedCdr[] = [{ cdr: heartCdr, readiness: 'needs_results' }]

    render(<CdrCard identifiedCdrs={clientCdrs} cdrAnalysis={cdrAnalysis} loading={false} />)

    // Should show LLM score in pill, not client-side "needs data" status
    const pill = screen.getByText(/HEART Score.*5/)
    expect(pill.textContent).toContain('High risk')
    expect(screen.queryByText('Requires workup results')).toBeNull()
    // Count should be 1 (no duplicate)
    expect(screen.getByText('1 identified')).toBeDefined()
  })
})
