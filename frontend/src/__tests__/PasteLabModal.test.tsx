/**
 * PasteLabModal Component Tests
 *
 * Tests the paste-lab-results modal lifecycle: idle → loading → preview → apply,
 * error handling, Escape-to-close, and reset-on-close behavior.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PasteLabModal from '../components/build-mode/shared/PasteLabModal'
import type { TestDefinition } from '../types/libraries'

// Mock useAuthToken
vi.mock('../lib/firebase', () => ({
  useAuthToken: () => 'mock-token-123',
}))

// Mock parseResults API
const mockParseResults = vi.fn()
vi.mock('../lib/api', () => ({
  parseResults: (...args: unknown[]) => mockParseResults(...args),
}))

const testLibrary: TestDefinition[] = [
  { id: 'cbc', name: 'CBC', category: 'labs', subcategory: 'hematology', commonIndications: ['anemia'], unit: 'cells/mcL', normalRange: '4500-11000', quickFindings: [], feedsCdrs: [] },
  { id: 'bmp', name: 'BMP', category: 'labs', subcategory: 'chemistry', commonIndications: ['electrolytes'], unit: 'mg/dL', normalRange: '70-100', quickFindings: [], feedsCdrs: [] },
  { id: 'troponin', name: 'Troponin', category: 'labs', subcategory: 'cardiac', commonIndications: ['chest pain'], unit: 'ng/mL', normalRange: '<0.04', quickFindings: [], feedsCdrs: [] },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  encounterId: 'enc-123',
  orderedTestIds: ['cbc', 'bmp', 'troponin'],
  testLibrary,
  onApply: vi.fn(),
}

describe('PasteLabModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<PasteLabModal {...defaultProps} isOpen={false} />)
    expect(container.querySelector('.paste-lab-overlay')).toBeNull()
  })

  it('renders the modal with textarea and parse button when open', () => {
    const { container } = render(<PasteLabModal {...defaultProps} />)
    expect(container.querySelector('.paste-lab-overlay')).not.toBeNull()
    expect(screen.getByText('Paste Lab Results')).not.toBeNull()
    expect(container.querySelector('[data-testid="paste-textarea"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="parse-btn"]')).not.toBeNull()
  })

  it('disables parse button when textarea is empty', () => {
    render(<PasteLabModal {...defaultProps} />)
    const btn = screen.getByTestId('parse-btn') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('enables parse button when text is entered', () => {
    render(<PasteLabModal {...defaultProps} />)
    const textarea = screen.getByTestId('paste-textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'CBC: 8500 WBC' } })
    const btn = screen.getByTestId('parse-btn') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('shows loading state while parsing', async () => {
    // Make parseResults hang (never resolve during this test)
    mockParseResults.mockReturnValue(new Promise(() => {}))

    const { container } = render(<PasteLabModal {...defaultProps} />)
    const textarea = screen.getByTestId('paste-textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'CBC: 8500 WBC' } })
    fireEvent.click(screen.getByTestId('parse-btn'))

    await waitFor(() => {
      expect(container.querySelector('[data-testid="paste-loading"]')).not.toBeNull()
    })
  })

  it('shows preview table after successful parse', async () => {
    mockParseResults.mockResolvedValue({
      ok: true,
      parsed: [
        { testId: 'cbc', testName: 'CBC', status: 'unremarkable', value: '8500', unit: 'cells/mcL' },
        { testId: 'troponin', testName: 'Troponin', status: 'abnormal', value: '0.15', unit: 'ng/mL' },
      ],
      unmatchedText: ['Lipase: 45'],
    })

    const { container } = render(<PasteLabModal {...defaultProps} />)
    const textarea = screen.getByTestId('paste-textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'CBC: 8500\nTroponin: 0.15\nLipase: 45' } })
    fireEvent.click(screen.getByTestId('parse-btn'))

    await waitFor(() => {
      expect(container.querySelector('[data-testid="paste-preview"]')).not.toBeNull()
    })

    // Check matched count text
    expect(screen.getByText('Matched 2 tests from pasted text')).not.toBeNull()

    // Check parsed rows exist
    expect(container.querySelector('[data-testid="parsed-row-cbc"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="parsed-row-troponin"]')).not.toBeNull()

    // Check unmatched text section
    expect(container.querySelector('[data-testid="unmatched-text"]')).not.toBeNull()
    expect(screen.getByText('Lipase: 45')).not.toBeNull()

    // Check apply button text
    expect(screen.getByTestId('apply-btn').textContent).toContain('Apply 2 Results')
  })

  it('calls onApply with structured results and closes on apply', async () => {
    const onApply = vi.fn()
    const onClose = vi.fn()

    mockParseResults.mockResolvedValue({
      ok: true,
      parsed: [
        { testId: 'cbc', testName: 'CBC', status: 'unremarkable', value: '8500', unit: 'cells/mcL', notes: null },
      ],
      unmatchedText: [],
    })

    render(<PasteLabModal {...defaultProps} onApply={onApply} onClose={onClose} />)
    const textarea = screen.getByTestId('paste-textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'CBC: 8500' } })
    fireEvent.click(screen.getByTestId('parse-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('apply-btn')).not.toBeNull()
    })

    fireEvent.click(screen.getByTestId('apply-btn'))

    expect(onApply).toHaveBeenCalledTimes(1)
    const appliedResults = onApply.mock.calls[0][0]
    expect(appliedResults.cbc).toBeDefined()
    expect(appliedResults.cbc.status).toBe('unremarkable')
    expect(appliedResults.cbc.value).toBe('8500')
    expect(appliedResults.cbc.unit).toBe('cells/mcL')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows error state when no results are matched', async () => {
    mockParseResults.mockResolvedValue({
      ok: true,
      parsed: [],
      unmatchedText: ['Lipase: 45'],
    })

    const { container } = render(<PasteLabModal {...defaultProps} />)
    const textarea = screen.getByTestId('paste-textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Lipase: 45' } })
    fireEvent.click(screen.getByTestId('parse-btn'))

    await waitFor(() => {
      expect(container.querySelector('[data-testid="paste-error"]')).not.toBeNull()
    })
  })

  it('shows error state when API call fails', async () => {
    mockParseResults.mockRejectedValue(new Error('Network error'))

    const { container } = render(<PasteLabModal {...defaultProps} />)
    const textarea = screen.getByTestId('paste-textarea') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'CBC: 8500' } })
    fireEvent.click(screen.getByTestId('parse-btn'))

    await waitFor(() => {
      expect(container.querySelector('[data-testid="paste-error"]')).not.toBeNull()
    })
    expect(screen.getByText('Network error')).not.toBeNull()
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    render(<PasteLabModal {...defaultProps} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when clicking overlay backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(<PasteLabModal {...defaultProps} onClose={onClose} />)
    const overlay = container.querySelector('.paste-lab-overlay')
    if (overlay) fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside the modal card', () => {
    const onClose = vi.fn()
    const { container } = render(<PasteLabModal {...defaultProps} onClose={onClose} />)
    const modal = container.querySelector('.paste-lab-modal')
    if (modal) fireEvent.click(modal)
    expect(onClose).not.toHaveBeenCalled()
  })
})
