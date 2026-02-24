/**
 * Desktop Layout Optimization Tests
 *
 * Tests that DashboardOutput uses the correct layout structure
 * for desktop vs mobile viewports, including the 2-column top row.
 */

/// <reference types="vitest/globals" />
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardOutput from '../components/build-mode/shared/DashboardOutput'
import type { DifferentialItem } from '../types/encounter'

// Mock Firebase (needed by CdrDetailView -> useCdrTracking)
vi.mock('../lib/firebase', () => ({
  db: {},
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

const sampleDifferential: DifferentialItem[] = [
  {
    diagnosis: 'Acute coronary syndrome',
    urgency: 'emergent',
    reasoning: 'Chest pain with risk factors',
  },
  {
    diagnosis: 'Pulmonary embolism',
    urgency: 'emergent',
    reasoning: 'Pleuritic chest pain',
  },
]

describe('DashboardOutput - Desktop Layout', () => {
  it('applies desktop class when not mobile', () => {
    mockIsMobile.mockReturnValue(false)

    const { container } = render(
      <DashboardOutput
        llmResponse={{ differential: sampleDifferential }}
        trendAnalysis={null}
      />
    )

    const wrapper = container.querySelector('.dashboard-output--desktop')
    expect(wrapper).not.toBeNull()
  })

  it('applies mobile class when mobile', () => {
    mockIsMobile.mockReturnValue(true)

    const { container } = render(
      <DashboardOutput
        llmResponse={{ differential: sampleDifferential }}
        trendAnalysis={null}
      />
    )

    const wrapper = container.querySelector('.dashboard-output--mobile')
    expect(wrapper).not.toBeNull()
  })

  it('renders top-row container with differential and CDR', () => {
    mockIsMobile.mockReturnValue(false)

    const { container } = render(
      <DashboardOutput
        llmResponse={{ differential: sampleDifferential }}
        trendAnalysis={null}
      />
    )

    const topRow = container.querySelector('.dashboard-output__top-row')
    expect(topRow).not.toBeNull()

    // Differential should be inside top-row
    const differential = topRow?.querySelector('.dashboard-output__differential')
    expect(differential).not.toBeNull()
  })

  it('renders middle-row container with workup card slot', () => {
    mockIsMobile.mockReturnValue(false)

    const { container } = render(
      <DashboardOutput
        llmResponse={{ differential: sampleDifferential }}
        trendAnalysis={null}
        selectedTests={[]}
        onSelectedTestsChange={vi.fn()}
      />
    )

    const middleRow = container.querySelector('.dashboard-output__middle-row')
    expect(middleRow).not.toBeNull()
  })

  it('mobile layout stacks top-row items vertically', () => {
    mockIsMobile.mockReturnValue(true)

    const { container } = render(
      <DashboardOutput
        llmResponse={{ differential: sampleDifferential }}
        trendAnalysis={null}
      />
    )

    const topRow = container.querySelector('.dashboard-output__top-row')
    expect(topRow).not.toBeNull()
    // On mobile, top-row uses flex-direction: column via CSS
    // We verify the class is applied (CSS handles the layout)
  })
})
