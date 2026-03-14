import { render, screen } from '@testing-library/react'
import App from '../App'
import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock Firebase to avoid auth errors in test environment
vi.mock('../lib/firebase', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: null, loading: false }),
  useAuthToken: () => null,
  getAppDb: vi.fn(() => ({})),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  checkRedirectResult: vi.fn(),
  db: {},
}))

// Mock IntersectionObserver for LandingPage slide activation
beforeAll(() => {
  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof IntersectionObserver
  }
  // Mock canvas getContext for film grain
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as never
})

describe('App', () => {
  it('renders MDM landing page', () => {
    render(<App />)
    const elements = screen.getAllByText(/MDM/)
    expect(elements.length).toBeGreaterThan(0)
  })
})
