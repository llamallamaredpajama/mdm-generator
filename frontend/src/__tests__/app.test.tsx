import { render, screen } from '@testing-library/react'
import App from '../App'
import { describe, it, expect, vi } from 'vitest'

// Mock Firebase to avoid auth errors in test environment
vi.mock('../lib/firebase', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: null, loading: false }),
  useAuthToken: () => null,
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  checkRedirectResult: vi.fn(),
  db: {},
}))

// Mock window.alert for jsdom
vi.stubGlobal('alert', vi.fn())

describe('App', () => {
  it('renders MDM Generator app', () => {
    render(<App />)
    const elements = screen.getAllByText(/MDM Generator/)
    expect(elements.length).toBeGreaterThan(0)
  })
})

