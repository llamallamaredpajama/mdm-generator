/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Compose from '../routes/Compose'

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
  useAuthToken: () => 'mock-token',
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  getAppDb: vi.fn(() => ({})),
}))

// Mock useEncounterList
const mockCreateEncounter = vi.fn().mockResolvedValue('new-encounter-id')
vi.mock('../hooks/useEncounterList', () => ({
  useEncounterList: () => ({
    encounters: [],
    loading: false,
    error: null,
    createEncounter: mockCreateEncounter,
    deleteEncounter: vi.fn(),
    clearAllEncounters: vi.fn(),
  }),
}))

// Mock editors
vi.mock('../components/build-mode/EncounterEditor', () => ({
  default: () => <div data-testid="build-editor">Build Editor</div>,
}))
vi.mock('../components/build-mode/QuickEncounterEditor', () => ({
  default: () => <div data-testid="quick-editor">Quick Editor</div>,
}))

// Mock ComposeDiptych
vi.mock('../components/compose/ComposeDiptych', () => ({
  default: ({ onCreateEncounter }: { onCreateEncounter: (mode: string) => void }) => (
    <div data-testid="compose-diptych">
      <button onClick={() => onCreateEncounter('build')}>Build Mode</button>
      <button onClick={() => onCreateEncounter('quick')}>Quick Mode</button>
    </div>
  ),
}))

describe('Compose page restructure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render a mode toggle', () => {
    render(
      <MemoryRouter>
        <Compose />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('renders a FAB button', () => {
    render(
      <MemoryRouter>
        <Compose />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Create new encounter')).toBeTruthy()
  })

  it('opens sheet when FAB is clicked', () => {
    render(
      <MemoryRouter>
        <Compose />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByLabelText('Create new encounter'))
    expect(screen.getByText('Quick')).toBeTruthy()
    expect(screen.getByText('Build')).toBeTruthy()
  })

  it('shows diptych mode selection when no encounters', () => {
    render(
      <MemoryRouter>
        <Compose />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('compose-diptych')).toBeTruthy()
    expect(screen.queryByText(/Tap/i)).toBeNull()
  })
})
