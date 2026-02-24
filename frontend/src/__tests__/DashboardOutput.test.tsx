/**
 * DashboardOutput Component Tests
 *
 * Tests rendering, data shape handling, conditional trends, and scroll behavior.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardOutput from '../components/build-mode/shared/DashboardOutput'
import type { DifferentialItem } from '../types/encounter'
import type { TrendAnalysisResult } from '../types/surveillance'

// Mock useIsMobile hook with controllable return value
const { mockIsMobile } = vi.hoisted(() => ({
  mockIsMobile: vi.fn().mockReturnValue(false),
}))

vi.mock('../hooks/useMediaQuery', () => ({
  useIsMobile: mockIsMobile,
}))

const mockDifferential: DifferentialItem[] = [
  {
    diagnosis: 'Acute Coronary Syndrome',
    urgency: 'emergent',
    reasoning: 'Chest pain with cardiac risk factors',
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
  })

  it('renders dashboard with differential data (wrapped shape)', () => {
    render(
      <DashboardOutput
        llmResponse={{ differential: mockDifferential, processedAt: {} }}
        trendAnalysis={null}
      />
    )

    expect(screen.getByText('Differential Diagnosis')).toBeDefined()
    expect(screen.getByText('Acute Coronary Syndrome')).toBeDefined()
    expect(screen.getByText('Costochondritis')).toBeDefined()
  })

  it('renders dashboard with differential data (flat array shape)', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
      />
    )

    expect(screen.getByText('Acute Coronary Syndrome')).toBeDefined()
  })

  it('returns null when no differential data', () => {
    const { container } = render(
      <DashboardOutput
        llmResponse={{ differential: [] }}
        trendAnalysis={null}
      />
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows CDR and Workup stub cards', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
      />
    )

    expect(screen.getByText('Clinical Decision Rules')).toBeDefined()
    expect(screen.getByText('Recommended Workup')).toBeDefined()
  })

  it('shows trends card when analysis data is present', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={mockTrendAnalysis}
      />
    )

    expect(screen.getByText('Regional Trends')).toBeDefined()
    expect(screen.getByText('RSV')).toBeDefined()
  })

  it('hides trends card when no analysis data', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
      />
    )

    expect(screen.queryByText('Regional Trends')).toBeNull()
  })

  it('shows loading state for trends', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
        trendLoading={true}
      />
    )

    expect(screen.getByText('Regional Trends')).toBeDefined()
    expect(screen.getByText('Analyzing regional surveillance data...')).toBeDefined()
  })

  it('renders "Accept Workup & Continue" button', () => {
    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
      />
    )

    const btn = screen.getByText('Accept Workup & Continue')
    expect(btn).toBeDefined()
    expect(btn.tagName).toBe('BUTTON')
  })

  it('scrolls to section-panel-2 on button click', () => {
    const scrollIntoView = vi.fn()
    const mockElement = { scrollIntoView }
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)

    render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
      />
    )

    fireEvent.click(screen.getByText('Accept Workup & Continue'))
    expect(document.getElementById).toHaveBeenCalledWith('section-panel-2')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })

    vi.restoreAllMocks()
  })

  it('applies desktop layout class', () => {
    const { container } = render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
      />
    )

    const dashboard = container.firstElementChild as HTMLElement
    expect(dashboard.classList.contains('dashboard-output--desktop')).toBe(true)
  })

  it('applies mobile layout class when viewport is mobile', () => {
    mockIsMobile.mockReturnValue(true)

    const { container } = render(
      <DashboardOutput
        llmResponse={mockDifferential}
        trendAnalysis={null}
      />
    )

    const dashboard = container.firstElementChild as HTMLElement
    expect(dashboard.classList.contains('dashboard-output--mobile')).toBe(true)
    expect(dashboard.classList.contains('dashboard-output--desktop')).toBe(false)
  })
})
