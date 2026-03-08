import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/firebase', () => ({
  useAuth: () => ({
    user: { uid: 'test', displayName: 'Test', getIdToken: vi.fn() },
    authLoading: false,
    onboardingCompleted: false,
    refreshOnboardingStatus: vi.fn(),
  }),
}))

vi.mock('../contexts/TrendAnalysisContext', () => ({
  useTrendAnalysisContext: () => ({
    setLocation: vi.fn(),
    setEnabled: vi.fn(),
  }),
}))

vi.mock('../hooks/useMediaQuery', () => ({
  usePrefersReducedMotion: () => false,
}))

import Onboarding from '../routes/Onboarding'

function renderOnboarding() {
  return render(
    <MemoryRouter>
      <Onboarding />
    </MemoryRouter>,
  )
}

describe('Onboarding stroke', () => {
  it('renders stroke as an img with step-specific src for step 0', () => {
    renderOnboarding()
    const strokeEl = document.querySelector('.ob-stroke')
    expect(strokeEl).not.toBeNull()
    expect(strokeEl!.tagName).toBe('IMG')
    expect(strokeEl!.className).toContain('ob-stroke--0')
    expect((strokeEl as HTMLImageElement).src).toContain('stroke-1.png')
  })
})

describe('Onboarding step content', () => {
  it('renders step content container', () => {
    renderOnboarding()
    const content = document.querySelector('.onboarding__step-content')
    expect(content).not.toBeNull()
  })
})

describe('Onboarding conditional button', () => {
  it('hides Continue button when canContinue is false', () => {
    renderOnboarding()
    // Step 0: acknowledged = false → canContinue = false
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
  })
})
