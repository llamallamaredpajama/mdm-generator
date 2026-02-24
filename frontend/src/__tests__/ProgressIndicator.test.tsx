/**
 * ProgressIndicator Component Tests
 *
 * Tests visual progress dots, summary text, and abnormal count display.
 */

/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressIndicator from '../components/build-mode/shared/ProgressIndicator'

describe('ProgressIndicator', () => {
  it('returns null when total is 0', () => {
    const { container } = render(
      <ProgressIndicator
        total={0}
        responded={0}
        abnormalCount={0}
        statuses={[]}
      />
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows correct dot count matching total', () => {
    const { container } = render(
      <ProgressIndicator
        total={5}
        responded={2}
        abnormalCount={1}
        statuses={['unremarkable', 'abnormal', 'pending', 'pending', 'pending']}
      />
    )

    const dots = container.querySelectorAll('.progress-indicator__dot')
    expect(dots.length).toBe(5)
  })

  it('shows green dot for unremarkable', () => {
    const { container } = render(
      <ProgressIndicator
        total={1}
        responded={1}
        abnormalCount={0}
        statuses={['unremarkable']}
      />
    )

    const dot = container.querySelector('.progress-indicator__dot--unremarkable')
    expect(dot).not.toBeNull()
  })

  it('shows red dot for abnormal', () => {
    const { container } = render(
      <ProgressIndicator
        total={1}
        responded={1}
        abnormalCount={1}
        statuses={['abnormal']}
      />
    )

    const dot = container.querySelector('.progress-indicator__dot--abnormal')
    expect(dot).not.toBeNull()
  })

  it('shows gray dot for pending', () => {
    const { container } = render(
      <ProgressIndicator
        total={1}
        responded={0}
        abnormalCount={0}
        statuses={['pending']}
      />
    )

    const dot = container.querySelector('.progress-indicator__dot--pending')
    expect(dot).not.toBeNull()
  })

  it('shows summary text "X/Y resulted"', () => {
    render(
      <ProgressIndicator
        total={7}
        responded={3}
        abnormalCount={0}
        statuses={['unremarkable', 'unremarkable', 'unremarkable', 'pending', 'pending', 'pending', 'pending']}
      />
    )

    expect(screen.getByText('3/7 resulted')).toBeDefined()
  })

  it('shows abnormal count when > 0', () => {
    render(
      <ProgressIndicator
        total={5}
        responded={3}
        abnormalCount={2}
        statuses={['unremarkable', 'abnormal', 'abnormal', 'pending', 'pending']}
      />
    )

    expect(screen.getByText('2 abnormal')).toBeDefined()
  })

  it('shows no abnormal count when 0', () => {
    render(
      <ProgressIndicator
        total={3}
        responded={2}
        abnormalCount={0}
        statuses={['unremarkable', 'unremarkable', 'pending']}
      />
    )

    expect(screen.queryByText(/abnormal/)).toBeNull()
  })

  it('renders with correct data-testid', () => {
    render(
      <ProgressIndicator
        total={3}
        responded={1}
        abnormalCount={0}
        statuses={['unremarkable', 'pending', 'pending']}
      />
    )

    expect(screen.getByTestId('progress-indicator')).toBeDefined()
  })

  it('applies correct dot classes for mixed statuses', () => {
    const { container } = render(
      <ProgressIndicator
        total={4}
        responded={3}
        abnormalCount={1}
        statuses={['unremarkable', 'abnormal', 'unremarkable', 'pending']}
      />
    )

    const dots = container.querySelectorAll('.progress-indicator__dot')
    expect(dots[0]?.classList.contains('progress-indicator__dot--unremarkable')).toBe(true)
    expect(dots[1]?.classList.contains('progress-indicator__dot--abnormal')).toBe(true)
    expect(dots[2]?.classList.contains('progress-indicator__dot--unremarkable')).toBe(true)
    expect(dots[3]?.classList.contains('progress-indicator__dot--pending')).toBe(true)
  })
})
