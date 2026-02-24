/**
 * CdrCard Component Tests
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CdrCard from '../components/build-mode/shared/CdrCard'
import type { IdentifiedCdr } from '../components/build-mode/shared/getIdentifiedCdrs'
import type { CdrDefinition } from '../types/libraries'

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
  scoring: { method: 'sum', ranges: [{ min: 0, max: 1, risk: 'low', interpretation: 'PE unlikely' }] },
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

  it('shows readiness labels', () => {
    render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    expect(screen.getByText('(needs results)')).toBeDefined()
    expect(screen.getByText('(completable)')).toBeDefined()
  })

  it('shows legend', () => {
    const { container } = render(<CdrCard identifiedCdrs={mockIdentifiedCdrs} loading={false} />)

    const legend = container.querySelector('.cdr-card__legend')
    expect(legend).not.toBeNull()
    expect(legend!.textContent).toContain('completable now')
    expect(legend!.textContent).toContain('needs results')
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
    expect(btn.getAttribute('title')).toBe('Available in next update')
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
})
