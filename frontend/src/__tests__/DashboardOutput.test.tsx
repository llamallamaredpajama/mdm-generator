/**
 * DashboardOutput Component Tests
 *
 * Tests rendering, data shape handling, conditional trends, scroll behavior,
 * and WorkupCard/OrderSelector integration.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardOutput from '../components/build-mode/shared/DashboardOutput'
import type { DifferentialItem } from '../types/encounter'
import type { TrendAnalysisResult } from '../types/surveillance'

// Mock Firebase (needed by CdrDetailView → useCdrTracking)
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

// Mock useIsMobile hook with controllable return value
const { mockIsMobile } = vi.hoisted(() => ({
  mockIsMobile: vi.fn().mockReturnValue(false),
}))

vi.mock('../hooks/useMediaQuery', () => ({
  useIsMobile: mockIsMobile,
}))

// Mock useTestLibrary — WorkupCard uses it internally
const { mockUseTestLibrary } = vi.hoisted(() => ({
  mockUseTestLibrary: vi.fn().mockReturnValue({
    tests: [
      {
        id: 'troponin',
        name: 'Troponin',
        category: 'labs',
        subcategory: 'cardiac',
        commonIndications: ['chest pain'],
        unit: null,
        normalRange: null,
        quickFindings: null,
        feedsCdrs: ['heart'],
      },
    ],
    categories: ['labs'],
    loading: false,
    error: null,
  }),
}))

vi.mock('../hooks/useTestLibrary', () => ({
  useTestLibrary: mockUseTestLibrary,
}))

// Mock useCdrLibrary — DashboardOutput uses it for CDR identification
const { mockUseCdrLibrary } = vi.hoisted(() => ({
  mockUseCdrLibrary: vi.fn().mockReturnValue({
    cdrs: [
      {
        id: 'heart',
        name: 'HEART Score',
        fullName: 'HEART Score for Major Cardiac Events',
        applicableChiefComplaints: ['chest pain', 'acute coronary syndrome'],
        components: [
          { id: 'history', label: 'History', type: 'select', source: 'section1' },
          { id: 'troponin', label: 'Troponin', type: 'select', source: 'section2' },
        ],
        scoring: {
          method: 'sum',
          ranges: [{ min: 0, max: 3, risk: 'low', interpretation: 'Low risk' }],
        },
      },
    ],
    loading: false,
    error: null,
  }),
}))

vi.mock('../hooks/useCdrLibrary', () => ({
  useCdrLibrary: mockUseCdrLibrary,
}))

const mockDifferential: DifferentialItem[] = [
  {
    diagnosis: 'Acute Coronary Syndrome',
    urgency: 'emergent',
    reasoning: 'Chest pain with cardiac risk factors. Recommend troponin.',
  },
  {
    diagnosis: 'Costochondritis',
    urgency: 'routine',
    reasoning: 'Reproducible chest wall tenderness',
  },
]

const mockTrendAnalysis: TrendAnalysisResult = {
  analysisId: 'test-123',
  regionLabel: 'US-Central',
  analyzedAt: '2026-02-23T00:00:00Z',
  summary: 'Elevated respiratory activity',
  alerts: [],
  rankedFindings: [
    {
      condition: 'RSV',
      trendDirection: 'rising',
      tier: 'high',
      summary: 'RSV hospitalizations up 15%',
      overallScore: 0.9,
    },
  ],
  dataSourcesQueried: ['resp_hosp', 'nwss'],
}

describe('DashboardOutput', () => {
  beforeEach(() => {
    mockIsMobile.mockReturnValue(false)
    mockUseCdrLibrary.mockReturnValue({
      cdrs: [
        {
          id: 'heart',
          name: 'HEART Score',
          fullName: 'HEART Score for Major Cardiac Events',
          applicableChiefComplaints: ['chest pain', 'acute coronary syndrome'],
          components: [
            { id: 'history', label: 'History', type: 'select', source: 'section1' },
            { id: 'troponin', label: 'Troponin', type: 'select', source: 'section2' },
          ],
          scoring: {
            method: 'sum',
            ranges: [{ min: 0, max: 3, risk: 'low', interpretation: 'Low risk' }],
          },
        },
      ],
      loading: false,
      error: null,
    })
  })

  it('renders dashboard with differential data (wrapped shape)', () => {
    render(
      <DashboardOutput
        llmResponse={{ differential: mockDifferential, processedAt: {} }}
        trendAnalysis={null}
      />,
    )

    expect(screen.getByText('Differential Diagnosis')).toBeDefined()
    expect(screen.getByText('Acute Coronary Syndrome')).toBeDefined()
    expect(screen.getByText('Costochondritis')).toBeDefined()
  })

  it('renders dashboard with differential data (flat array shape)', () => {
    render(<DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />)

    expect(screen.getByText('Acute Coronary Syndrome')).toBeDefined()
  })

  it('returns null when no differential data', () => {
    const { container } = render(
      <DashboardOutput llmResponse={{ differential: [] }} trendAnalysis={null} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('returns null when llmResponse is null', () => {
    const { container } = render(<DashboardOutput llmResponse={null} trendAnalysis={null} />)

    expect(container.innerHTML).toBe('')
  })

  it('returns null when llmResponse is undefined', () => {
    const { container } = render(<DashboardOutput llmResponse={undefined} trendAnalysis={null} />)

    expect(container.innerHTML).toBe('')
  })

  it('shows CdrCard with identified CDRs', () => {
    render(<DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />)

    // CdrCard renders with title and matched CDR
    expect(screen.getByText('Clinical Decision Rules')).toBeDefined()
    // HEART Score matches via applicableChiefComplaints containing 'acute coronary syndrome'
    // which is a substring of diagnosis 'Acute Coronary Syndrome'
    expect(screen.getByText('HEART Score')).toBeDefined()
    expect(screen.getByText('1 identified')).toBeDefined()
  })

  it('shows CdrCard error state when CDR library fails to load', () => {
    mockUseCdrLibrary.mockReturnValue({ cdrs: [], loading: false, error: 'Server error' })

    render(<DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />)

    expect(screen.getByText('Unable to load CDR library')).toBeDefined()
    expect(screen.queryByText('No CDRs identified for this differential')).toBeNull()
  })

  it('shows CdrCard empty state when no CDRs match', () => {
    mockUseCdrLibrary.mockReturnValue({ cdrs: [], loading: false, error: null })

    render(<DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />)

    expect(screen.getByText('No CDRs identified for this differential')).toBeDefined()
  })

  it('shows WorkupCard when onSelectedTestsChange is provided', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        selectedTests={[]}
        onSelectedTestsChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Recommended Workup')).toBeDefined()
    // B2: "Accept All" standalone header button replaced by "Accept All / Continue" at card bottom
    expect(screen.getByText('Accept All / Continue')).toBeDefined()
  })

  it('shows Workup stub card when onSelectedTestsChange is not provided', () => {
    render(<DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />)

    expect(screen.getByText('Recommended Workup')).toBeDefined()
    // No Accept All button when using stub card
    expect(screen.queryByText('Accept All')).toBeNull()
  })

  it('opens OrderSelector as overlay when Edit is clicked (B1 fix)', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        selectedTests={[]}
        onSelectedTestsChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Edit'))

    // OrderSelector should be shown as overlay
    expect(screen.getByText('Order Selection')).toBeDefined()
    expect(screen.getByText('\u2190 Back to Dashboard')).toBeDefined()
    // B1 fix: Dashboard content should STILL be visible (overlay, not replacement)
    expect(screen.getByText('Differential Diagnosis')).toBeDefined()
  })

  it('returns to dashboard from OrderSelector when Back is clicked', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        selectedTests={[]}
        onSelectedTestsChange={vi.fn()}
      />,
    )

    // Open order selector
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('Order Selection')).toBeDefined()

    // Go back
    fireEvent.click(screen.getByText('← Back to Dashboard'))
    expect(screen.getByText('Differential Diagnosis')).toBeDefined()
  })

  it('shows trends card when analysis data is present', () => {
    render(<DashboardOutput llmResponse={mockDifferential} trendAnalysis={mockTrendAnalysis} />)

    expect(screen.getByText('Regional Trends')).toBeDefined()
    expect(screen.getByText('RSV')).toBeDefined()
  })

  it('hides trends card when no analysis data', () => {
    render(<DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />)

    expect(screen.queryByText('Regional Trends')).toBeNull()
  })

  it('shows loading state for trends', () => {
    render(
      <DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} trendLoading={true} />,
    )

    expect(screen.getByText('Regional Trends')).toBeDefined()
    expect(screen.getByText('Analyzing regional surveillance data...')).toBeDefined()
  })

  it('renders "Accept All / Continue" button in WorkupCard (B2)', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        selectedTests={[]}
        onSelectedTestsChange={vi.fn()}
      />,
    )

    const btn = screen.getByText('Accept All / Continue')
    expect(btn).toBeDefined()
    expect(btn.tagName).toBe('BUTTON')
  })

  it('calls onAcceptContinue when Accept All / Continue is clicked', () => {
    const onAcceptContinue = vi.fn()

    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        selectedTests={[]}
        onSelectedTestsChange={vi.fn()}
        onAcceptContinue={onAcceptContinue}
      />,
    )

    fireEvent.click(screen.getByText('Accept All / Continue'))
    expect(onAcceptContinue).toHaveBeenCalledOnce()
  })

  it('applies desktop layout class', () => {
    const { container } = render(
      <DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />,
    )

    const dashboard = container.firstElementChild as HTMLElement
    expect(dashboard.classList.contains('dashboard-output--desktop')).toBe(true)
  })

  it('applies mobile layout class when viewport is mobile', () => {
    mockIsMobile.mockReturnValue(true)

    const { container } = render(
      <DashboardOutput llmResponse={mockDifferential} trendAnalysis={null} />,
    )

    const dashboard = container.firstElementChild as HTMLElement
    expect(dashboard.classList.contains('dashboard-output--mobile')).toBe(true)
    expect(dashboard.classList.contains('dashboard-output--desktop')).toBe(false)
  })

  it('auto-populates recommended tests as pre-checked on fresh encounters', () => {
    const onSelectedTestsChange = vi.fn()
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        selectedTests={[]}
        onSelectedTestsChange={onSelectedTestsChange}
      />,
    )

    // Should auto-populate with recommended test IDs (troponin matches reasoning)
    expect(onSelectedTestsChange).toHaveBeenCalledWith(['troponin'])
  })

  it('does not auto-populate when selectedTests is already non-empty', () => {
    const onSelectedTestsChange = vi.fn()
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        selectedTests={['troponin']}
        onSelectedTestsChange={onSelectedTestsChange}
      />,
    )

    // Should NOT auto-populate since selections already exist
    expect(onSelectedTestsChange).not.toHaveBeenCalled()
  })
})
