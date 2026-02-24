/**
 * Dictation Mode Tests (BM-5.2)
 *
 * Tests the PasteLabModal "external preview" mode used by dictation,
 * verifying that initialParsedResults skip the idle state and show
 * preview directly, and that the Cancel/Back button behavior adapts.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PasteLabModal from '../components/build-mode/shared/PasteLabModal'
import type { TestDefinition } from '../types/libraries'
import type { ParsedResultItem } from '../lib/api'

// Mock useAuthToken
vi.mock('../lib/firebase', () => ({
  useAuthToken: () => 'mock-token-123',
}))

// Mock parseResults API (not used in external preview mode, but imported by module)
vi.mock('../lib/api', () => ({
  parseResults: vi.fn(),
}))

const testLibrary: TestDefinition[] = [
  { id: 'cbc', name: 'CBC', category: 'labs', subcategory: 'hematology', commonIndications: ['anemia'], unit: 'cells/mcL', normalRange: '4500-11000', quickFindings: [], feedsCdrs: [] },
  { id: 'troponin', name: 'Troponin', category: 'labs', subcategory: 'cardiac', commonIndications: ['chest pain'], unit: 'ng/mL', normalRange: '<0.04', quickFindings: [], feedsCdrs: [] },
]

const parsedResults: ParsedResultItem[] = [
  { testId: 'cbc', testName: 'CBC', status: 'unremarkable', value: '8500', unit: 'cells/mcL' },
  { testId: 'troponin', testName: 'Troponin', status: 'abnormal', value: '0.15', unit: 'ng/mL', notes: 'Elevated' },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  encounterId: 'enc-123',
  orderedTestIds: ['cbc', 'troponin'],
  testLibrary,
  onApply: vi.fn(),
}

describe('PasteLabModal — External Preview Mode (Dictation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows preview directly when initialParsedResults provided', () => {
    const { container } = render(
      <PasteLabModal
        {...defaultProps}
        initialParsedResults={parsedResults}
        initialUnmatchedText={['Lipase: 45']}
        title="Dictation Results"
      />
    )

    // Should be in preview state, not idle
    expect(container.querySelector('[data-testid="paste-preview"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="paste-textarea"]')).toBeNull()

    // Custom title
    expect(screen.getByText('Dictation Results')).not.toBeNull()

    // Parsed rows
    expect(container.querySelector('[data-testid="parsed-row-cbc"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="parsed-row-troponin"]')).not.toBeNull()

    // Unmatched text
    expect(screen.getByText('Lipase: 45')).not.toBeNull()
  })

  it('shows Cancel instead of Back in external preview mode', () => {
    render(
      <PasteLabModal
        {...defaultProps}
        initialParsedResults={parsedResults}
      />
    )

    // Should show "Cancel" not "Back"
    expect(screen.getByText('Cancel')).not.toBeNull()
  })

  it('Cancel button calls onClose in external preview mode', () => {
    const onClose = vi.fn()
    render(
      <PasteLabModal
        {...defaultProps}
        onClose={onClose}
        initialParsedResults={parsedResults}
      />
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Apply button calls onApply with mapped results', () => {
    const onApply = vi.fn()
    const onClose = vi.fn()
    render(
      <PasteLabModal
        {...defaultProps}
        onApply={onApply}
        onClose={onClose}
        initialParsedResults={parsedResults}
      />
    )

    fireEvent.click(screen.getByTestId('apply-btn'))

    expect(onApply).toHaveBeenCalledTimes(1)
    const applied = onApply.mock.calls[0][0]

    // CBC mapped correctly
    expect(applied.cbc).toBeDefined()
    expect(applied.cbc.status).toBe('unremarkable')
    expect(applied.cbc.value).toBe('8500')

    // Troponin mapped correctly with notes
    expect(applied.troponin).toBeDefined()
    expect(applied.troponin.status).toBe('abnormal')
    expect(applied.troponin.value).toBe('0.15')
    expect(applied.troponin.notes).toBe('Elevated')
    expect(applied.troponin.quickFindings).toContain('Elevated')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows correct Apply button text with result count', () => {
    render(
      <PasteLabModal
        {...defaultProps}
        initialParsedResults={parsedResults}
      />
    )

    expect(screen.getByTestId('apply-btn').textContent).toContain('Apply 2 Results')
  })

  it('renders nothing when isOpen is false even with initialParsedResults', () => {
    const { container } = render(
      <PasteLabModal
        {...defaultProps}
        isOpen={false}
        initialParsedResults={parsedResults}
      />
    )

    expect(container.querySelector('.paste-lab-overlay')).toBeNull()
  })

  it('uses default title when title prop not provided', () => {
    render(
      <PasteLabModal
        {...defaultProps}
        initialParsedResults={parsedResults}
      />
    )

    expect(screen.getByText('Paste Lab Results')).not.toBeNull()
  })
})
