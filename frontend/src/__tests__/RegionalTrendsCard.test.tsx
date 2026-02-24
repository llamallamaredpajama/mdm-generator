/**
 * RegionalTrendsCard Component Tests
 *
 * Tests rendering, loading state, empty state, concise/expanded views,
 * trend arrows, alerts, and toggle behavior.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RegionalTrendsCard from '../components/build-mode/shared/RegionalTrendsCard'
import type { TrendAnalysisResult } from '../types/surveillance'

const mockAnalysis: TrendAnalysisResult = {
  analysisId: 'test-456',
  regionLabel: 'US-Central',
  analyzedAt: '2026-02-24T12:00:00Z',
  summary: 'Elevated respiratory activity in the region',
  alerts: [],
  rankedFindings: [
    {
      condition: 'RSV',
      trendDirection: 'rising',
      tier: 'high',
      summary: 'RSV hospitalizations up 15%',
      overallScore: 0.9,
    },
    {
      condition: 'Influenza A',
      trendDirection: 'stable',
      tier: 'moderate',
      summary: 'Influenza A levels steady',
      overallScore: 0.6,
    },
    {
      condition: 'COVID-19',
      trendDirection: 'falling',
      tier: 'low',
      summary: 'COVID-19 wastewater signal declining',
      overallScore: 0.3,
    },
  ],
  dataSourcesQueried: ['resp_hosp', 'nwss', 'nndss'],
}

const mockAnalysisWithAlerts: TrendAnalysisResult = {
  ...mockAnalysis,
  alerts: [
    {
      level: 'critical',
      title: 'RSV Surge',
      description: 'Critical RSV surge detected in region',
    },
    {
      level: 'warning',
      title: 'Influenza Watch',
      description: 'Influenza approaching threshold levels',
    },
  ],
  rankedFindings: [
    ...mockAnalysis.rankedFindings,
    {
      condition: 'Norovirus',
      trendDirection: 'rising',
      tier: 'moderate',
      summary: 'Norovirus outbreaks increasing in region',
      overallScore: 0.5,
    },
  ],
}

describe('RegionalTrendsCard', () => {
  it('returns null when analysis is null and not loading', () => {
    const { container } = render(
      <RegionalTrendsCard analysis={null} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows loading state with loading message', () => {
    render(
      <RegionalTrendsCard analysis={null} isLoading={true} />
    )
    expect(screen.getByText('Regional Trends')).toBeDefined()
    expect(screen.getByText('Analyzing regional surveillance data...')).toBeDefined()
  })

  it('shows empty state when rankedFindings is empty', () => {
    const emptyAnalysis: TrendAnalysisResult = {
      ...mockAnalysis,
      rankedFindings: [],
    }
    render(
      <RegionalTrendsCard analysis={emptyAnalysis} />
    )
    expect(screen.getByText('Regional Trends')).toBeDefined()
    expect(screen.getByText('No significant regional trends detected')).toBeDefined()
  })

  it('shows concise view with findings', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysis} />
    )
    expect(screen.getByText('Regional Trends')).toBeDefined()
    expect(screen.getByText('RSV')).toBeDefined()
    expect(screen.getByText('Influenza A')).toBeDefined()
    expect(screen.getByText('COVID-19')).toBeDefined()
  })

  it('shows region label in header', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysis} />
    )
    expect(screen.getByText('US-Central')).toBeDefined()
  })

  it('renders correct trend direction arrows', () => {
    const { container } = render(
      <RegionalTrendsCard analysis={mockAnalysis} />
    )

    const arrows = container.querySelectorAll('.regional-trends-card__arrow')
    expect(arrows.length).toBe(3)

    // Rising arrow
    const risingArrow = container.querySelector('.regional-trends-card__arrow--rising')
    expect(risingArrow).toBeDefined()
    expect(risingArrow?.textContent).toBe('\u2191')

    // Stable arrow
    const stableArrow = container.querySelector('.regional-trends-card__arrow--stable')
    expect(stableArrow).toBeDefined()
    expect(stableArrow?.textContent).toBe('\u2192')

    // Falling arrow
    const fallingArrow = container.querySelector('.regional-trends-card__arrow--falling')
    expect(fallingArrow).toBeDefined()
    expect(fallingArrow?.textContent).toBe('\u2193')
  })

  it('shows summary text in concise view', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysis} />
    )
    // Summary text should appear in concise view (parity with old TrendsCard)
    expect(screen.getByText(/RSV hospitalizations up 15%/)).toBeDefined()
    expect(screen.getByText(/Influenza A levels steady/)).toBeDefined()
    expect(screen.getByText(/COVID-19 wastewater signal declining/)).toBeDefined()
  })

  it('hides findings beyond top 3 in concise view', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysisWithAlerts} />
    )
    // 4th finding should not be visible in concise view
    expect(screen.queryByText('Norovirus')).toBeNull()
  })

  it('expands to full view when "Show Details" is clicked', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysisWithAlerts} />
    )

    fireEvent.click(screen.getByText('Show Details'))

    // Should show 4th finding (was hidden in concise)
    expect(screen.getByText('Norovirus')).toBeDefined()
    expect(screen.getByText(/Norovirus outbreaks increasing in region/)).toBeDefined()
  })

  it('shows alerts in expanded view', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysisWithAlerts} />
    )

    fireEvent.click(screen.getByText('Show Details'))

    expect(screen.getByText('RSV Surge')).toBeDefined()
    expect(screen.getByText('Critical RSV surge detected in region')).toBeDefined()
    expect(screen.getByText('Influenza Watch')).toBeDefined()
    expect(screen.getByText('Influenza approaching threshold levels')).toBeDefined()
  })

  it('shows data attribution in expanded view', () => {
    // Need >3 findings to get the toggle button (3 findings + no alerts = no button)
    const analysisWith4: TrendAnalysisResult = {
      ...mockAnalysis,
      rankedFindings: [
        ...mockAnalysis.rankedFindings,
        {
          condition: 'MRSA',
          trendDirection: 'stable',
          tier: 'low',
          summary: 'MRSA steady',
          overallScore: 0.2,
        },
      ],
    }

    render(
      <RegionalTrendsCard analysis={analysisWith4} />
    )

    fireEvent.click(screen.getByText('Show Details'))

    expect(screen.getByText(/resp_hosp, nwss, nndss/)).toBeDefined()
    expect(screen.getByText('Surveillance data is supplementary. Clinical judgment must guide all decisions.')).toBeDefined()
  })

  it('collapses back to concise view when "Hide Details" is clicked', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysisWithAlerts} />
    )

    // Expand
    fireEvent.click(screen.getByText('Show Details'))
    expect(screen.getByText('RSV Surge')).toBeDefined()
    expect(screen.getByText('Norovirus')).toBeDefined()

    // Collapse
    fireEvent.click(screen.getByText('Hide Details'))
    // Alerts should be hidden
    expect(screen.queryByText('RSV Surge')).toBeNull()
    // 4th finding should be hidden (back to top 3)
    expect(screen.queryByText('Norovirus')).toBeNull()
    // Top 3 findings + summaries still visible in concise view
    expect(screen.getByText('RSV')).toBeDefined()
    expect(screen.getByText(/RSV hospitalizations up 15%/)).toBeDefined()
  })

  it('does not show toggle button when 3 or fewer findings and no alerts', () => {
    render(
      <RegionalTrendsCard analysis={mockAnalysis} />
    )
    // 3 findings, 0 alerts — no button needed
    expect(screen.queryByText('Show Details')).toBeNull()
    expect(screen.queryByText('Hide Details')).toBeNull()
  })

  it('shows toggle button when alerts are present even with few findings', () => {
    const analysisWithAlert: TrendAnalysisResult = {
      ...mockAnalysis,
      alerts: [
        { level: 'info', title: 'Note', description: 'Test alert' },
      ],
    }

    render(
      <RegionalTrendsCard analysis={analysisWithAlert} />
    )

    expect(screen.getByText('Show Details')).toBeDefined()
  })
})
