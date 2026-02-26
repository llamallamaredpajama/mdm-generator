/**
 * Accessibility Pass Tests (Story 8.3)
 *
 * Tests ARIA attributes, focus management, keyboard navigation,
 * and screen reader support across Build Mode components.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProgressIndicator from '../components/build-mode/shared/ProgressIndicator'
import DifferentialList from '../components/build-mode/shared/DifferentialList'
import ResultEntry from '../components/build-mode/shared/ResultEntry'
import CdrCard from '../components/build-mode/shared/CdrCard'
import ConfirmationModal from '../components/ConfirmationModal'
import type { DifferentialItem } from '../types/encounter'
import type { TestDefinition } from '../types/libraries'
import type { IdentifiedCdr } from '../components/build-mode/shared/getIdentifiedCdrs'

// Mock Firebase (needed by CdrCard -> CdrDetailView -> useCdrTracking)
vi.mock('../lib/firebase', () => ({
  db: {},
  getAppDb: vi.fn(() => ({})),
  useAuth: () => ({ user: { uid: 'test-uid' } }),
  useAuthToken: () => 'test-token',
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
}))

// Mock useTestLibrary
vi.mock('../hooks/useTestLibrary', () => ({
  useTestLibrary: () => ({
    tests: [],
    loading: false,
    error: null,
  }),
}))

// Mock useCdrLibrary
vi.mock('../hooks/useCdrLibrary', () => ({
  useCdrLibrary: () => ({
    cdrs: [],
    loading: false,
    error: null,
  }),
}))

// ─────────────────────────────────────────────────
// ProgressIndicator
// ─────────────────────────────────────────────────

describe('ProgressIndicator - Accessibility', () => {
  it('has role="status" for live region announcements', () => {
    const { container } = render(
      <ProgressIndicator
        total={5}
        responded={3}
        abnormalCount={1}
        statuses={['unremarkable', 'abnormal', 'unremarkable', 'pending', 'pending']}
      />
    )

    const indicator = container.querySelector('[role="status"]')
    expect(indicator).not.toBeNull()
  })

  it('has descriptive aria-label including progress and abnormal count', () => {
    const { container } = render(
      <ProgressIndicator
        total={5}
        responded={3}
        abnormalCount={1}
        statuses={['unremarkable', 'abnormal', 'unremarkable', 'pending', 'pending']}
      />
    )

    const indicator = container.querySelector('.progress-indicator')
    expect(indicator?.getAttribute('aria-label')).toBe(
      'Test progress: 3 of 5 resulted, 1 abnormal'
    )
  })

  it('omits abnormal from aria-label when count is 0', () => {
    const { container } = render(
      <ProgressIndicator
        total={3}
        responded={2}
        abnormalCount={0}
        statuses={['unremarkable', 'unremarkable', 'pending']}
      />
    )

    const indicator = container.querySelector('.progress-indicator')
    expect(indicator?.getAttribute('aria-label')).toBe(
      'Test progress: 2 of 3 resulted'
    )
  })

  it('hides decorative dots from screen readers', () => {
    const { container } = render(
      <ProgressIndicator
        total={2}
        responded={1}
        abnormalCount={0}
        statuses={['unremarkable', 'pending']}
      />
    )

    const dotsContainer = container.querySelector('.progress-indicator__dots')
    expect(dotsContainer?.getAttribute('aria-hidden')).toBe('true')
  })
})

// ─────────────────────────────────────────────────
// CdrCard
// ─────────────────────────────────────────────────

describe('CdrCard - Accessibility', () => {
  const mockCdrs: IdentifiedCdr[] = [
    {
      cdr: {
        id: 'heart', name: 'HEART Score', fullName: 'HEART Score for Chest Pain',
        applicableChiefComplaints: ['chest pain'], components: [],
        scoring: { method: 'sum', ranges: [] },
      },
      readiness: 'completable',
    },
    {
      cdr: {
        id: 'perc', name: 'PERC Rule', fullName: 'PERC Rule for PE',
        applicableChiefComplaints: ['shortness of breath'], components: [],
        scoring: { method: 'threshold', ranges: [] },
      },
      readiness: 'needs_results',
    },
  ]

  it('has role="region" with descriptive aria-label', () => {
    const { container } = render(
      <CdrCard identifiedCdrs={mockCdrs} loading={false} />
    )

    const region = container.querySelector('[role="region"]')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('aria-label')).toBe('Clinical Decision Rules')
  })

  it('has role="status" on loading message', () => {
    const { container } = render(
      <CdrCard identifiedCdrs={[]} loading={true} />
    )

    const status = container.querySelector('[role="status"]')
    expect(status).not.toBeNull()
    expect(status?.textContent).toContain('Loading')
  })

  it('has role="alert" on error message', () => {
    const { container } = render(
      <CdrCard identifiedCdrs={[]} loading={false} error="Failed to load" />
    )

    const alert = container.querySelector('[role="alert"]')
    expect(alert).not.toBeNull()
  })

  it('has accessible label on CDR count badge', () => {
    const { container } = render(
      <CdrCard identifiedCdrs={mockCdrs} loading={false} />
    )

    const badge = container.querySelector('.cdr-card__badge')
    expect(badge?.getAttribute('aria-label')).toBe('2 clinical decision rules identified')
  })

  it('hides decorative dots from screen readers', () => {
    const { container } = render(
      <CdrCard identifiedCdrs={mockCdrs} loading={false} />
    )

    // List row dots have aria-hidden directly
    const rowDots = container.querySelectorAll('.cdr-card__row .cdr-card__dot')
    expect(rowDots.length).toBeGreaterThan(0)
    rowDots.forEach((dot) => {
      expect(dot.getAttribute('aria-hidden')).toBe('true')
    })

    // Legend is hidden as a whole via aria-hidden on parent
    const legend = container.querySelector('.cdr-card__legend')
    expect(legend?.getAttribute('aria-hidden')).toBe('true')
  })

  it('has accessible label on CDR list', () => {
    const { container } = render(
      <CdrCard identifiedCdrs={mockCdrs} loading={false} />
    )

    const list = container.querySelector('.cdr-card__list')
    expect(list?.getAttribute('aria-label')).toBe('Identified clinical decision rules')
  })
})

// ─────────────────────────────────────────────────
// DifferentialList
// ─────────────────────────────────────────────────

const mockDifferential: DifferentialItem[] = [
  {
    diagnosis: 'Acute Coronary Syndrome',
    urgency: 'emergent',
    reasoning: 'Chest pain with cardiac risk factors',
  },
  {
    diagnosis: 'Pulmonary Embolism',
    urgency: 'urgent',
    reasoning: 'Dyspnea and tachycardia',
  },
]

describe('DifferentialList - Accessibility', () => {
  it('has role="region" with aria-label on wrapper', () => {
    const { container } = render(
      <DifferentialList differential={mockDifferential} />
    )

    const region = container.querySelector('[role="region"]')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('aria-label')).toBe('Differential Diagnosis')
  })

  it('has descriptive aria-label on toggle-all button', () => {
    render(<DifferentialList differential={mockDifferential} />)

    const btn = screen.getByRole('button', { name: /expand all diagnoses/i })
    expect(btn).toBeDefined()

    // Click to expand, label should change
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: /collapse all diagnoses/i })).toBeDefined()
  })

  it('has role="status" on urgency summary', () => {
    const { container } = render(
      <DifferentialList differential={mockDifferential} />
    )

    const summary = container.querySelector('[role="status"]')
    expect(summary).not.toBeNull()
    expect(summary?.getAttribute('aria-label')).toBe('Diagnosis urgency summary')
  })

  it('has accessible labels on urgency badges', () => {
    const { container } = render(
      <DifferentialList differential={mockDifferential} />
    )

    const emergentBadge = container.querySelector('.diff-list__badge--emergent')
    expect(emergentBadge?.getAttribute('aria-label')).toBe('1 emergent diagnoses')

    const urgentBadge = container.querySelector('.diff-list__badge--urgent')
    expect(urgentBadge?.getAttribute('aria-label')).toBe('1 urgent diagnoses')
  })

  it('has aria-expanded and aria-controls on row headers', () => {
    render(<DifferentialList differential={mockDifferential} />)

    const buttons = screen.getAllByRole('button')
    const diagButton = buttons.find(b => b.textContent?.includes('Acute Coronary Syndrome'))
    expect(diagButton?.getAttribute('aria-expanded')).toBe('false')
    expect(diagButton?.getAttribute('aria-controls')).toBe('diff-details-0')
  })

  it('hides decorative dots from screen readers', () => {
    const { container } = render(
      <DifferentialList differential={mockDifferential} />
    )

    const dots = container.querySelectorAll('.diff-row__dot')
    dots.forEach((dot) => {
      expect(dot.getAttribute('aria-hidden')).toBe('true')
    })
  })
})

// ─────────────────────────────────────────────────
// ResultEntry
// ─────────────────────────────────────────────────

describe('ResultEntry - Accessibility', () => {
  const mockTestDef: TestDefinition = {
    id: 'troponin',
    name: 'Troponin I',
    category: 'labs',
    subcategory: 'cardiac',
    commonIndications: ['chest pain'],
    unit: 'ng/mL',
    normalRange: '<0.04',
    quickFindings: ['elevated', 'normal'],
    feedsCdrs: ['heart'],
  }

  it('has radiogroup with accessible label', () => {
    render(
      <ResultEntry
        testDef={mockTestDef}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    const radiogroup = screen.getByRole('radiogroup')
    expect(radiogroup.getAttribute('aria-label')).toBe('Status for Troponin I')
  })

  it('has radio buttons with aria-checked', () => {
    render(
      <ResultEntry
        testDef={mockTestDef}
        result={{ status: 'unremarkable', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    const radios = screen.getAllByRole('radio')
    const unremarkableRadio = radios.find(r => r.textContent === 'Unremarkable')
    const abnormalRadio = radios.find(r => r.textContent === 'Abnormal')

    expect(unremarkableRadio?.getAttribute('aria-checked')).toBe('true')
    expect(abnormalRadio?.getAttribute('aria-checked')).toBe('false')
  })

  it('CDR warning has role="alert" and accessible label', () => {
    const { container } = render(
      <ResultEntry
        testDef={mockTestDef}
        result={undefined}
        activeCdrNames={['HEART Score', 'Wells']}
        onResultChange={vi.fn()}
      />
    )

    const warning = container.querySelector('[role="alert"]')
    expect(warning).not.toBeNull()
    expect(warning?.getAttribute('aria-label')).toBe(
      'Result needed: value required for HEART Score, Wells'
    )
  })

  it('does not show CDR warning when no active CDRs', () => {
    const { container } = render(
      <ResultEntry
        testDef={mockTestDef}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    const warning = container.querySelector('.result-entry__cdr-warning')
    expect(warning).toBeNull()
  })
})

// ─────────────────────────────────────────────────
// ConfirmationModal
// ─────────────────────────────────────────────────

describe('ConfirmationModal - Accessibility', () => {
  it('has role="dialog" and aria-modal', () => {
    const { container } = render(
      <ConfirmationModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />
    )

    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
  })

  it('has aria-labelledby pointing to title', () => {
    const { container } = render(
      <ConfirmationModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />
    )

    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-labelledby')).toBe('confirmation-modal-title')

    const title = container.querySelector('#confirmation-modal-title')
    expect(title).not.toBeNull()
    expect(title?.textContent).toBe('Confirm Submission')
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    const { container } = render(
      <ConfirmationModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />
    )

    const dialog = container.querySelector('[role="dialog"]')
    fireEvent.keyDown(dialog!, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has warning with role="alert"', () => {
    const { container } = render(
      <ConfirmationModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />
    )

    const alert = container.querySelector('.modal-warning[role="alert"]')
    expect(alert).not.toBeNull()
  })

  it('hides warning SVG from screen readers', () => {
    const { container } = render(
      <ConfirmationModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} />
    )

    const svg = container.querySelector('.warning-icon')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  it('returns null when not open', () => {
    const { container } = render(
      <ConfirmationModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    )

    expect(container.innerHTML).toBe('')
  })

  it('closes on overlay click', () => {
    const onClose = vi.fn()
    const { container } = render(
      <ConfirmationModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />
    )

    const overlay = container.querySelector('.modal-overlay')
    fireEvent.click(overlay!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside modal content', () => {
    const onClose = vi.fn()
    const { container } = render(
      <ConfirmationModal isOpen={true} onClose={onClose} onConfirm={vi.fn()} />
    )

    const content = container.querySelector('.modal-content')
    fireEvent.click(content!)
    expect(onClose).not.toHaveBeenCalled()
  })
})
