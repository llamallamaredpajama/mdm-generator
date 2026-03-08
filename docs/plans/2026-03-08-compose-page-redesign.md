# Compose Page UI/UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mode toggle + NewEncounterCard creation flow with a FAB + bottom sheet, make room number optional at creation, add inline room editing in editors, and restyle the entire compose page to match the dark landing page aesthetic.

**Architecture:** The compose page (`/compose`) renders a carousel of encounter cards with two layouts (mobile wallet stack / desktop kanban). Currently, encounter creation lives inside the carousel as a `NewEncounterCard` form with a glass-morphism mode toggle above it. This redesign extracts creation to a floating action button (FAB) with a bottom sheet modal, removes the mode toggle entirely, makes `roomNumber` optional at creation time, and adds an inline room input to both editors. The entire compose page gets dark-themed to match the cinematic landing page.

**Tech Stack:** React 19, TypeScript, CSS (BEM), Firestore, Vite 7, Vitest + React Testing Library

---

## Design Decisions

1. **FAB + bottom sheet** replaces NewEncounterCard for encounter creation
2. **Room number skipped** at creation — entered later inline in editor
3. **Blue for Build, red for Quick** card accent colors retained
4. **Dark theme** from landing page: `#000` bg, `#fff`/`#999` text, `#e00` accent (from `LandingPage.css`)
5. **Navigation is state-based** — `selectedEncounterId` picks the editor, not React Router
6. **No `updateEncounter` in hook** — InlineRoomInput will write to Firestore directly via `updateDoc`
7. **`formatRoomDisplay("")`** returns `"Unassigned"` for empty/whitespace-only input
8. **Empty state UI** — when zero encounters exist, show a centered prompt above the FAB

---

## Task 1: Data Layer — Optional Room Number

**Dependencies:** none

**Files:**
- Modify: `frontend/src/types/encounter.ts` (formatRoomDisplay)
- Modify: `frontend/src/hooks/useEncounterList.ts` (createEncounter, compareRooms)
- Test: `frontend/src/__tests__/encounterDataLayer.test.ts`

**Step 1: Write failing tests**

```typescript
// frontend/src/__tests__/encounterDataLayer.test.ts
import { describe, it, expect } from 'vitest'
import { formatRoomDisplay } from '../types/encounter'

describe('formatRoomDisplay', () => {
  it('returns "Unassigned" for empty string', () => {
    expect(formatRoomDisplay('')).toBe('Unassigned')
  })

  it('returns "Unassigned" for whitespace-only string', () => {
    expect(formatRoomDisplay('   ')).toBe('Unassigned')
  })

  it('returns "Room 12" for numeric input', () => {
    expect(formatRoomDisplay('12')).toBe('Room 12')
  })

  it('returns "Bed 2A" for alphanumeric input', () => {
    expect(formatRoomDisplay('Bed 2A')).toBe('Bed 2A')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend && pnpm vitest run src/__tests__/encounterDataLayer.test.ts
```

Expected: FAIL — `formatRoomDisplay('')` returns `''` not `'Unassigned'`

**Step 3: Update `formatRoomDisplay` in `encounter.ts`**

In `frontend/src/types/encounter.ts`, change `formatRoomDisplay`:

```typescript
export const formatRoomDisplay = (roomNumber: string): string => {
  const trimmed = roomNumber.trim()
  if (!trimmed) return 'Unassigned'
  if (/^\d+$/.test(trimmed)) {
    return `Room ${trimmed}`
  }
  return trimmed
}
```

**Step 4: Run tests to verify they pass**

```bash
cd frontend && pnpm vitest run src/__tests__/encounterDataLayer.test.ts
```

Expected: PASS

**Step 5: Update `compareRooms` to sort empty rooms last**

In `frontend/src/hooks/useEncounterList.ts`, update `compareRooms` function (line 109):

```typescript
function compareRooms(a: string, b: string): number {
  const trimA = a.trim()
  const trimB = b.trim()
  // Empty rooms sort last
  if (!trimA && !trimB) return 0
  if (!trimA) return 1
  if (!trimB) return -1

  const parsedA = parseRoomNumber(a)
  const parsedB = parseRoomNumber(b)
  // ... rest unchanged
```

**Step 6: Update `createEncounter` to make roomNumber and chiefComplaint optional**

In `frontend/src/hooks/useEncounterList.ts`:

1. Change the `UseEncounterListReturn` interface (line 132):
```typescript
createEncounter: (mode: EncounterMode, roomNumber?: string, chiefComplaint?: string) => Promise<string>
```

2. Update `createEncounter` implementation (line 216-283):
```typescript
const createEncounter = useCallback(
  async (encounterMode: EncounterMode, roomNumber?: string, chiefComplaint?: string): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated to create encounters')
    }

    const encountersRef = collection(db, 'customers', user.uid, 'encounters')

    const defaultSectionData = {
      status: 'pending' as SectionStatus,
      content: '',
      submissionCount: 0,
      isLocked: false,
    }

    const baseEncounter = {
      userId: user.uid,
      roomNumber: (roomNumber ?? '').trim(),
      chiefComplaint: (chiefComplaint ?? '').trim(),
      status: 'draft' as EncounterStatus,
      mode: encounterMode,
      quotaCounted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      shiftStartedAt: serverTimestamp(),
    }

    const modeSpecificData =
      encounterMode === 'quick'
        ? {
            quickModeData: {
              narrative: '',
              status: 'draft' as QuickModeStatus,
            },
            currentSection: 1,
            section1: { ...defaultSectionData },
            section2: { ...defaultSectionData },
            section3: { ...defaultSectionData },
          }
        : {
            currentSection: 1,
            section1: { ...defaultSectionData },
            section2: { ...defaultSectionData },
            section3: { ...defaultSectionData },
          }

    const newEncounter = {
      ...baseEncounter,
      ...modeSpecificData,
    }

    const docRef = await addDoc(encountersRef, newEncounter)
    return docRef.id
  },
  [user]
)
```

Key changes:
- Signature is now `(encounterMode: EncounterMode, roomNumber?: string, chiefComplaint?: string)`
- Removed roomNumber validation (`!roomNumber.trim()` check)
- Removed chiefComplaint validation for build mode
- `mode` is now passed as first argument (not from hook param)
- Removed `mode` from `useCallback` deps (no longer uses the hook-level mode)

3. Remove the `mode` parameter from the hook signature. Change line 152:
```typescript
export function useEncounterList(): UseEncounterListReturn {
```

4. Remove `mode` from the `useEffect` dependency (already gone — it uses `[user]`).

5. Update `clearAllEncounters` — currently deletes all visible encounters regardless of mode, which is already correct since the filter only excludes archived.

**Step 7: Run full test suite to verify nothing broke**

```bash
cd frontend && pnpm vitest run src/__tests__/encounterDataLayer.test.ts
```

Expected: PASS

---

## Task 2: FAB + Bottom Sheet Components

**Dependencies:** none (can run parallel with Task 1)

**Files:**
- Create: `frontend/src/components/compose/FloatingActionButton.tsx`
- Create: `frontend/src/components/compose/FloatingActionButton.css`
- Create: `frontend/src/components/compose/NewEncounterSheet.tsx`
- Create: `frontend/src/components/compose/NewEncounterSheet.css`
- Test: `frontend/src/__tests__/NewEncounterSheet.test.tsx`

**Step 1: Write failing tests for NewEncounterSheet**

```typescript
// frontend/src/__tests__/NewEncounterSheet.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NewEncounterSheet from '../components/compose/NewEncounterSheet'

describe('NewEncounterSheet', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onCreateEncounter: vi.fn(),
    isCreating: false,
  }

  it('renders Quick and Build options when open', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    expect(screen.getByText('Quick')).toBeInTheDocument()
    expect(screen.getByText('Build')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<NewEncounterSheet {...defaultProps} open={false} />)
    expect(screen.queryByText('Quick')).not.toBeInTheDocument()
  })

  it('calls onCreateEncounter with "quick" when Quick option is clicked', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.click(screen.getByText('Quick'))
    expect(defaultProps.onCreateEncounter).toHaveBeenCalledWith('quick')
  })

  it('calls onCreateEncounter with "build" when Build option is clicked', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.click(screen.getByText('Build'))
    expect(defaultProps.onCreateEncounter).toHaveBeenCalledWith('build')
  })

  it('calls onClose when backdrop is clicked', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.click(screen.getByTestId('sheet-backdrop'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    render(<NewEncounterSheet {...defaultProps} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('disables buttons and shows loading when isCreating', () => {
    render(<NewEncounterSheet {...defaultProps} isCreating={true} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend && pnpm vitest run src/__tests__/NewEncounterSheet.test.tsx
```

Expected: FAIL — module not found

**Step 3: Create FloatingActionButton component**

```typescript
// frontend/src/components/compose/FloatingActionButton.tsx
import type { EncounterMode } from '../../types/encounter'
import './FloatingActionButton.css'

interface FloatingActionButtonProps {
  open: boolean
  onClick: () => void
}

export default function FloatingActionButton({ open, onClick }: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      className={`compose-fab ${open ? 'compose-fab--open' : ''}`}
      onClick={onClick}
      aria-label={open ? 'Close new encounter menu' : 'Create new encounter'}
      aria-expanded={open}
    >
      <svg
        className="compose-fab__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )
}
```

```css
/* frontend/src/components/compose/FloatingActionButton.css */

.compose-fab {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: #fff;
  cursor: pointer;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 16px rgba(220, 53, 69, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s ease;
}

.compose-fab:hover {
  transform: scale(1.05);
  box-shadow:
    0 6px 24px rgba(220, 53, 69, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.4);
}

.compose-fab:active {
  transform: scale(0.95);
}

.compose-fab__icon {
  width: 24px;
  height: 24px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.compose-fab--open .compose-fab__icon {
  transform: rotate(45deg);
}

/* Larger on desktop */
@media (min-width: 768px) {
  .compose-fab {
    width: 64px;
    height: 64px;
    bottom: 32px;
    right: 32px;
  }

  .compose-fab__icon {
    width: 28px;
    height: 28px;
  }
}
```

**Step 4: Create NewEncounterSheet component**

```typescript
// frontend/src/components/compose/NewEncounterSheet.tsx
import { useEffect } from 'react'
import type { EncounterMode } from '../../types/encounter'
import './NewEncounterSheet.css'

interface NewEncounterSheetProps {
  open: boolean
  onClose: () => void
  onCreateEncounter: (mode: EncounterMode) => void
  isCreating: boolean
}

export default function NewEncounterSheet({
  open,
  onClose,
  onCreateEncounter,
  isCreating,
}: NewEncounterSheetProps) {
  // Escape key to close
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, isCreating])

  if (!open) return null

  return (
    <div
      className="encounter-sheet__backdrop"
      data-testid="sheet-backdrop"
      onClick={() => !isCreating && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Create new encounter"
    >
      <div
        className="encounter-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="encounter-sheet__title">New Encounter</h3>
        <div className="encounter-sheet__options">
          <button
            type="button"
            className="encounter-sheet__option encounter-sheet__option--quick"
            onClick={() => onCreateEncounter('quick')}
            disabled={isCreating}
          >
            <svg className="encounter-sheet__option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="encounter-sheet__option-label">Quick</span>
            <span className="encounter-sheet__option-desc">One-shot MDM generation</span>
          </button>
          <button
            type="button"
            className="encounter-sheet__option encounter-sheet__option--build"
            onClick={() => onCreateEncounter('build')}
            disabled={isCreating}
          >
            <svg className="encounter-sheet__option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="encounter-sheet__option-label">Build</span>
            <span className="encounter-sheet__option-desc">3-section guided workflow</span>
          </button>
        </div>
      </div>
    </div>
  )
}
```

```css
/* frontend/src/components/compose/NewEncounterSheet.css */

.encounter-sheet__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 801;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: sheet-backdrop-in 0.2s ease-out;
}

@keyframes sheet-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.encounter-sheet {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px 20px 0 0;
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  width: 100%;
  max-width: 480px;
  animation: sheet-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes sheet-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.encounter-sheet__title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px;
  text-align: center;
}

.encounter-sheet__options {
  display: flex;
  gap: 12px;
}

.encounter-sheet__option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}

.encounter-sheet__option:hover:not(:disabled) {
  transform: translateY(-2px);
}

.encounter-sheet__option:active:not(:disabled) {
  transform: scale(0.97);
}

.encounter-sheet__option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.encounter-sheet__option--quick {
  border-color: rgba(220, 53, 69, 0.3);
}

.encounter-sheet__option--quick:hover:not(:disabled) {
  background: rgba(220, 53, 69, 0.08);
  border-color: rgba(220, 53, 69, 0.5);
}

.encounter-sheet__option--build {
  border-color: rgba(59, 130, 246, 0.3);
}

.encounter-sheet__option--build:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.5);
}

.encounter-sheet__option-icon {
  width: 28px;
  height: 28px;
  opacity: 0.9;
}

.encounter-sheet__option--quick .encounter-sheet__option-icon {
  color: #dc3545;
}

.encounter-sheet__option--build .encounter-sheet__option-icon {
  color: #3b82f6;
}

.encounter-sheet__option-label {
  font-size: 16px;
  font-weight: 600;
}

.encounter-sheet__option-desc {
  font-size: 12px;
  color: #999;
  text-align: center;
}

/* Desktop: center the sheet vertically instead of bottom-anchored */
@media (min-width: 768px) {
  .encounter-sheet__backdrop {
    align-items: center;
  }

  .encounter-sheet {
    border-radius: 20px;
    padding: 24px 20px;
  }
}
```

**Step 5: Run tests to verify they pass**

```bash
cd frontend && pnpm vitest run src/__tests__/NewEncounterSheet.test.tsx
```

Expected: PASS

---

## Task 3: Compose Page Restructure — Remove Toggle, Wire FAB/Sheet

**Dependencies:** Task 1, Task 2

**Files:**
- Modify: `frontend/src/routes/Compose.tsx` (major rewrite)
- Modify: `frontend/src/routes/Compose.css` (delete toggle styles)
- Modify: `frontend/src/components/build-mode/EncounterCarousel.tsx` (remove creation props)
- Modify: `frontend/src/components/build-mode/desktop/DesktopKanban.tsx` (remove NewEncounterCard)
- Modify: `frontend/src/components/build-mode/mobile/MobileWalletStack.tsx` (remove NewEncounterCard)
- Test: `frontend/src/__tests__/ComposePageRestructure.test.tsx`

**Step 1: Write failing test for restructured Compose page**

```typescript
// frontend/src/__tests__/ComposePageRestructure.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('Compose page restructure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render a mode toggle', () => {
    render(<MemoryRouter><Compose /></MemoryRouter>)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByText('Quick Compose')).not.toBeInTheDocument()
    expect(screen.queryByText('Build Mode')).not.toBeInTheDocument()
  })

  it('renders a FAB button', () => {
    render(<MemoryRouter><Compose /></MemoryRouter>)
    expect(screen.getByLabelText('Create new encounter')).toBeInTheDocument()
  })

  it('opens sheet when FAB is clicked', () => {
    render(<MemoryRouter><Compose /></MemoryRouter>)
    fireEvent.click(screen.getByLabelText('Create new encounter'))
    expect(screen.getByText('Quick')).toBeInTheDocument()
    expect(screen.getByText('Build')).toBeInTheDocument()
  })

  it('shows empty state message when no encounters', () => {
    render(<MemoryRouter><Compose /></MemoryRouter>)
    expect(screen.getByText(/Tap/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm vitest run src/__tests__/ComposePageRestructure.test.tsx
```

Expected: FAIL — mode toggle still exists, FAB doesn't exist

**Step 3: Rewrite `Compose.tsx`**

Replace the entire `Compose.tsx` with:

```typescript
// frontend/src/routes/Compose.tsx
/**
 * Unified Compose Route
 *
 * Shows a carousel of encounter cards (all modes mixed).
 * New encounters are created via FAB + bottom sheet.
 * Selecting an encounter opens the appropriate editor.
 */

import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useEncounterList } from '../hooks/useEncounterList'
import EncounterCarousel from '../components/build-mode/EncounterCarousel'
import EncounterEditor from '../components/build-mode/EncounterEditor'
import QuickEncounterEditor from '../components/build-mode/QuickEncounterEditor'
import FloatingActionButton from '../components/compose/FloatingActionButton'
import NewEncounterSheet from '../components/compose/NewEncounterSheet'
import type { EncounterMode } from '../types/encounter'
import './Compose.css'

export default function Compose() {
  const location = useLocation()

  // View state: null = carousel, string = editor for that encounter
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null)

  // FAB + Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isCreatingEncounter, setIsCreatingEncounter] = useState(false)

  // Reset to carousel when header Compose button is clicked
  useEffect(() => {
    if (location.state?.resetToQuick) {
      setSelectedEncounterId(null)
    }
  }, [location.state?.resetToQuick])

  // Fetch encounters from Firestore (all modes)
  const { encounters, loading, error, createEncounter, deleteEncounter, clearAllEncounters } =
    useEncounterList()

  /**
   * Handle encounter selection from carousel.
   * Pushes a history entry so the browser back button returns to the carousel.
   */
  const handleSelectEncounter = useCallback((id: string) => {
    setSelectedEncounterId(id)
    window.history.pushState({ encounterEditor: true }, '')
  }, [])

  /**
   * Handle back navigation from editor to carousel
   */
  const handleBack = useCallback(() => {
    setSelectedEncounterId(null)
  }, [])

  /**
   * Listen for browser back button (popstate) to return to carousel
   */
  useEffect(() => {
    const handlePopState = () => {
      if (selectedEncounterId) {
        setSelectedEncounterId(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [selectedEncounterId])

  /**
   * Create encounter from bottom sheet.
   * Guard against double-tap with isCreatingEncounter.
   */
  const handleCreateFromSheet = useCallback(async (mode: EncounterMode) => {
    if (isCreatingEncounter) return
    setIsCreatingEncounter(true)
    try {
      const encounterId = await createEncounter(mode)
      setSheetOpen(false)
      handleSelectEncounter(encounterId)
    } catch (err) {
      console.error('Failed to create encounter:', err)
    } finally {
      setIsCreatingEncounter(false)
    }
  }, [isCreatingEncounter, createEncounter, handleSelectEncounter])

  // Render editor view when an encounter is selected
  if (selectedEncounterId) {
    const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId)
    const selectedMode = selectedEncounter?.mode || 'build'

    if (selectedMode === 'quick') {
      return (
        <div className="compose-page compose-page--editor">
          <QuickEncounterEditor encounterId={selectedEncounterId} onBack={handleBack} />
        </div>
      )
    }

    return (
      <div className="compose-page compose-page--editor">
        <EncounterEditor encounterId={selectedEncounterId} onBack={handleBack} />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="compose-page compose-page--carousel">
        <main className="compose-main compose-main--carousel">
          <div className="compose-loading">
            <div className="compose-loading-spinner" aria-hidden="true" />
            <p>Loading encounters...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="compose-page compose-page--carousel">
        <main className="compose-main compose-main--carousel">
          <div className="compose-error">
            <span className="compose-error-icon" aria-hidden="true">!</span>
            <p className="compose-error-message">{error.message || 'Failed to load encounters'}</p>
            <button
              type="button"
              className="compose-retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Render carousel view (default)
  return (
    <div className="compose-page compose-page--carousel">
      <main className="compose-main compose-main--carousel" id="compose-content">
        {encounters.length === 0 ? (
          <div className="compose-empty">
            <p className="compose-empty__text">
              No encounters yet
            </p>
            <p className="compose-empty__hint">
              Tap <span className="compose-empty__plus">+</span> to create one
            </p>
          </div>
        ) : (
          <EncounterCarousel
            encounters={encounters}
            onSelectEncounter={handleSelectEncounter}
            onDeleteEncounter={deleteEncounter}
            onClearAllEncounters={clearAllEncounters}
          />
        )}
      </main>

      {/* Footer Attestation */}
      <footer className="compose-footer">
        <p className="compose-attestation">
          Educational tool only. All generated documentation reflects physician input and requires
          physician review for accuracy and completeness.
        </p>
      </footer>

      {/* FAB + Sheet */}
      <FloatingActionButton open={sheetOpen} onClick={() => setSheetOpen(!sheetOpen)} />
      <NewEncounterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreateEncounter={handleCreateFromSheet}
        isCreating={isCreatingEncounter}
      />
    </div>
  )
}
```

**Step 4: Update `Compose.css` — delete toggle styles, add empty state + dark prep**

Delete all `.compose-mode-toggle*`, `.compose-mode-description`, and `.compose-header` styles. Add empty state styles. Keep existing loading/error/footer styles. Update to:

```css
/* Compose.css — delete these class blocks entirely:
   - .compose-header
   - .compose-mode-toggle (and ::before, [data-mode] variant)
   - .compose-mode-toggle__btn (and all variants)
   - .compose-mode-toggle__icon
   - .compose-mode-description
   - All @media blocks referencing these classes
*/

/* ADD these new styles: */

.compose-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 80px 24px;
  text-align: center;
}

.compose-empty__text {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}

.compose-empty__hint {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.compose-empty__plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  vertical-align: middle;
}
```

**Step 5: Update `EncounterCarousel.tsx` — remove creation props**

Remove `onCreateEncounter`, `mode`, and all `newEncounterForm` state from `EncounterCarousel`.

Updated props interface:
```typescript
interface EncounterCarouselProps {
  encounters: EncounterDocument[]
  onSelectEncounter: (id: string) => void
  onDeleteEncounter: (id: string) => Promise<void>
  onClearAllEncounters: () => Promise<void>
}
```

Remove from the component body:
- `newRoomNumber`, `newChiefComplaint`, `isCreating` state (lines 47-49)
- `handleCreateEncounter` callback (lines 59-82)
- `newEncounterForm` object (lines 134-141)

Update child renders — remove `mode` and `newEncounterForm` props:
```typescript
{isMobile ? (
  <MobileWalletStack
    encounters={encounters}
    expansion={expansion}
    onSelectEncounter={onSelectEncounter}
    onDeleteEncounter={handleDeleteEncounter}
  />
) : (
  <DesktopKanban
    encounters={encounters}
    expansion={expansion}
    onSelectEncounter={onSelectEncounter}
    onDeleteEncounter={handleDeleteEncounter}
  />
)}
```

Remove `EncounterMode` from imports. Remove `mode` from the destructured props and function parameter defaults.

**Step 6: Update `DesktopKanban.tsx` — remove NewEncounterCard, add per-card mode class**

Updated props:
```typescript
export interface DesktopKanbanProps {
  encounters: EncounterDocument[]
  expansion: UseCardExpansionReturn
  onSelectEncounter: (id: string) => void
  onDeleteEncounter: (id: string) => Promise<void>
}
```

Remove: `NewEncounterCard` import, `NewEncounterFormData` import, `mode` prop, `newEncounterForm` prop.

Remove from render: `<NewEncounterCard form={newEncounterForm} mode={mode} />` (line 115).

Add per-card mode class to encounter buttons:
```typescript
className={[
  'flippable-card',
  `flippable-card--mode-${getEncounterMode(encounter)}`,
  isFlipped && 'flippable-card--flipped',
  isExpanded && 'flippable-card--expanded',
  isOtherExpanding && 'flippable-card--dimmed',
]
  .filter(Boolean)
  .join(' ')}
```

Update `FullscreenOverlay` render — remove `mode` prop, use encounter's own mode:
```typescript
<FullscreenOverlay
  encounter={expandedEncounter}
  animationPhase={expansion.animationPhase}
  onClose={handleOverlayClose}
  onEdit={handleEditEncounter}
  onDelete={handleDeleteFromOverlay}
/>
```

Note: Check `FullscreenOverlay` props — if it uses `mode`, update it to use `getEncounterMode(encounter)` internally instead.

**Step 7: Update `MobileWalletStack.tsx` — remove NewEncounterCard, fix positions**

Updated props:
```typescript
export interface MobileWalletStackProps {
  encounters: EncounterDocument[]
  expansion: UseCardExpansionReturn
  onSelectEncounter: (id: string) => void
  onDeleteEncounter: (id: string) => Promise<void>
}
```

Remove: `NewEncounterCard` import, `NewEncounterFormData` import, `mode` prop, `newEncounterForm` prop.

Remove state: `newEncounterRef`, `newEncounterHeight` (lines 108-109).

Update `totalItems`:
```typescript
const totalItems = encounters.length
```

Update `calculatePositions` — remove NewEncounterCard offset. All indices are now direct encounter indices (no +1 offset):

```typescript
const calculatePositions = useCallback(() => {
  const positions: Array<{ top: number; zIndex: number }> = []

  if (!expandedCardId) {
    // Idle: stack encounters top-down
    for (let i = 0; i < totalItems; i++) {
      positions.push({
        top: i * STACK_SPACING,
        zIndex: i + 1,
      })
    }
    return positions
  }

  const expandedIndex = encounters.findIndex((e) => e.id === expandedCardId)
  const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT

  const remainingCards = totalItems - 1
  const stackHeight = remainingCards > 0
    ? (remainingCards - 1) * STACK_SPACING + HEADER_HEIGHT
    : 0

  const minContainerHeight = Math.max(
    expandedHeight + 120 + stackHeight + CLEAR_DECK_RESERVE,
    520
  )

  const stackStartTop = minContainerHeight - stackHeight - CLEAR_DECK_RESERVE

  let belowCounter = 0
  for (let i = 0; i < totalItems; i++) {
    if (i === expandedIndex) {
      positions.push({ top: EXPANDED_TOP, zIndex: totalItems + 1 })
    } else {
      positions.push({
        top: stackStartTop + belowCounter * STACK_SPACING,
        zIndex: belowCounter + 1,
      })
      belowCounter++
    }
  }

  return positions
}, [expandedCardId, encounters, totalItems, measuredExpandedHeight])
```

Update `containerHeight`:
```typescript
const containerHeight = (() => {
  if (!expandedCardId) {
    if (totalItems === 0) return 100
    const stackHeight = (totalItems - 1) * STACK_SPACING + HEADER_HEIGHT
    return Math.max(stackHeight + CLEAR_DECK_RESERVE, 520)
  }
  const expandedHeight = measuredExpandedHeight || HEADER_HEIGHT + EXPANDED_BODY_HEIGHT
  const remainingCards = totalItems - 1
  const stackHeight = remainingCards > 0
    ? (remainingCards - 1) * STACK_SPACING + HEADER_HEIGHT
    : 0
  return Math.max(expandedHeight + 120 + stackHeight + CLEAR_DECK_RESERVE, 520)
})()
```

Remove the entire NewEncounterCard JSX block (lines 268-299).

Update encounter card render — remove `posIndex` offset:
```typescript
{encounters.map((encounter, index) => {
  const cardExpanded = isExpanded(encounter.id)
  const pos = positions[index]
  // ... rest of card render, add per-card mode class:
  className={[
    'mobile-card',
    `mobile-card--mode-${getEncounterMode(encounter)}`,
    cardExpanded && 'mobile-card--expanded',
    cardExpanded && 'mobile-card--active-glow',
    !cardExpanded && 'mobile-card--collapsed',
  ].filter(Boolean).join(' ')}
```

Remove: `handleNewEncounterPeekTap`, `newEncounterCollapsed` variable, `mobile-wallet-stack--${mode}` class from container.

**Step 8: Run tests**

```bash
cd frontend && pnpm vitest run src/__tests__/ComposePageRestructure.test.tsx
```

Expected: PASS

**Step 9: Typecheck to verify all changes compile**

```bash
cd frontend && pnpm tsc --noEmit
```

Expected: No errors. If there are errors from FullscreenOverlay or other components that received `mode` as a prop, fix those by removing the prop or using `getEncounterMode(encounter)` internally.

---

## Task 4: Inline Room Input Component

**Dependencies:** Task 1 (optional roomNumber must be in place)

**Files:**
- Create: `frontend/src/components/compose/InlineRoomInput.tsx`
- Create: `frontend/src/components/compose/InlineRoomInput.css`
- Modify: `frontend/src/components/build-mode/EncounterEditor.tsx` (line 969)
- Modify: `frontend/src/components/build-mode/QuickEncounterEditor.tsx` (line 133)
- Test: `frontend/src/__tests__/InlineRoomInput.test.tsx`

**Step 1: Write failing test**

```typescript
// frontend/src/__tests__/InlineRoomInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import InlineRoomInput from '../components/compose/InlineRoomInput'

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => 'mock-ts'),
}))

vi.mock('../lib/firebase', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } }),
  getAppDb: vi.fn(() => ({})),
}))

describe('InlineRoomInput', () => {
  it('shows "Unassigned" placeholder when value is empty', () => {
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('shows formatted room when value is set', () => {
    render(<InlineRoomInput value="12" encounterId="enc-1" />)
    expect(screen.getByText('Room 12')).toBeInTheDocument()
  })

  it('enters edit mode on click', () => {
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    fireEvent.click(screen.getByText('Unassigned'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('saves on blur', async () => {
    const { updateDoc } = await import('firebase/firestore')
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    fireEvent.click(screen.getByText('Unassigned'))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.blur(input)
    expect(updateDoc).toHaveBeenCalled()
  })

  it('saves on Enter key', async () => {
    const { updateDoc } = await import('firebase/firestore')
    render(<InlineRoomInput value="" encounterId="enc-1" />)
    fireEvent.click(screen.getByText('Unassigned'))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(updateDoc).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm vitest run src/__tests__/InlineRoomInput.test.tsx
```

Expected: FAIL — module not found

**Step 3: Create InlineRoomInput component**

```typescript
// frontend/src/components/compose/InlineRoomInput.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getAppDb, useAuth } from '../../lib/firebase'
import { formatRoomDisplay } from '../../types/encounter'
import './InlineRoomInput.css'

interface InlineRoomInputProps {
  value: string
  encounterId: string
  className?: string
}

export default function InlineRoomInput({ value, encounterId, className }: InlineRoomInputProps) {
  const { user } = useAuth()
  const db = getAppDb()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const save = useCallback(async () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed === value.trim()) return // No change
    if (!user) return

    try {
      const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
      await updateDoc(encounterRef, {
        roomNumber: trimmed,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to update room number:', err)
      setDraft(value) // Revert on error
    }
  }, [draft, value, user, db, encounterId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={`inline-room-input inline-room-input--editing ${className ?? ''}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        placeholder="Room number"
        autoComplete="off"
      />
    )
  }

  return (
    <button
      type="button"
      className={`inline-room-input inline-room-input--display ${className ?? ''}`}
      onClick={() => setEditing(true)}
      title="Click to edit room number"
    >
      {formatRoomDisplay(value)}
    </button>
  )
}
```

```css
/* frontend/src/components/compose/InlineRoomInput.css */

.inline-room-input {
  font-family: inherit;
  margin: 0;
  padding: 0;
}

.inline-room-input--display {
  background: none;
  border: none;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.inline-room-input--display:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.4);
}

.inline-room-input--editing {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-bottom: 2px solid #e00;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  padding: 2px 4px;
  border-radius: 4px 4px 0 0;
  outline: none;
  min-width: 80px;
  max-width: 200px;
}
```

**Step 4: Integrate into EncounterEditor**

In `frontend/src/components/build-mode/EncounterEditor.tsx`, line 969:

Replace:
```tsx
<h1 className="encounter-editor__room">{formatRoomDisplay(encounter.roomNumber)}</h1>
```

With:
```tsx
<InlineRoomInput
  value={encounter.roomNumber}
  encounterId={encounterId}
  className="encounter-editor__room"
/>
```

Add import at top:
```typescript
import InlineRoomInput from '../compose/InlineRoomInput'
```

Remove `formatRoomDisplay` from the `encounter.ts` import (line 31) if it's no longer used directly. Check if it's used elsewhere in the file first — it may be used in other places. If so, keep the import.

**Step 5: Integrate into QuickEncounterEditor**

In `frontend/src/components/build-mode/QuickEncounterEditor.tsx`, line 133:

Replace:
```tsx
<h2 className="quick-editor__room">{formatRoomDisplay(encounter.roomNumber)}</h2>
```

With:
```tsx
<InlineRoomInput
  value={encounter.roomNumber}
  encounterId={encounterId}
  className="quick-editor__room"
/>
```

Add import:
```typescript
import InlineRoomInput from '../compose/InlineRoomInput'
```

Remove `formatRoomDisplay` from the import if no longer used.

**Step 6: Run tests**

```bash
cd frontend && pnpm vitest run src/__tests__/InlineRoomInput.test.tsx
```

Expected: PASS

---

## Task 5: Dark Theme Restyling

**Dependencies:** Task 3 (toggle styles removed, empty state added)

**Files:**
- Modify: `frontend/src/routes/Compose.css` (dark theme)
- Modify: `frontend/src/components/build-mode/desktop/DesktopKanban.css` (dark cards)
- Modify: `frontend/src/components/build-mode/mobile/MobileWalletStack.css` (dark + mode glow)
- Modify: `frontend/src/components/build-mode/shared/CardContent.css` (white text)
- Modify: `frontend/src/components/build-mode/EncounterCarousel.css` (dark consistency)

No tests for this task — it's purely visual CSS changes. Verify via `pnpm dev` visual inspection.

**Step 1: Dark theme `Compose.css`**

Update the page background and states:

```css
.compose-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #000;
}

/* Subtle red radial gradient at top */
.compose-page--carousel {
  padding: var(--space-lg) var(--space-xl);
  background:
    radial-gradient(circle at 50% 0%, rgba(220, 53, 69, 0.06) 0%, transparent 60%),
    #000;
}

/* Loading state dark */
.compose-loading {
  color: #999;
}

.compose-loading-spinner {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #e00;
}

/* Error state dark */
.compose-error-message {
  color: #dc3545;
}

.compose-retry-button {
  background: #e00;
}

.compose-retry-button:hover {
  background: #c00;
}

/* Footer dark */
.compose-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.compose-attestation {
  color: #666;
}
```

**Step 2: Dark theme `DesktopKanban.css`**

Key changes — update card surfaces, borders, and hover states:

- Card background: `rgba(255, 255, 255, 0.02)`
- Card border: `rgba(255, 255, 255, 0.06)`
- Card hover: brighter border
- Per-card mode borders:
  ```css
  .flippable-card--mode-quick {
    border-color: rgba(220, 53, 69, 0.2);
  }
  .flippable-card--mode-quick:hover {
    border-color: rgba(220, 53, 69, 0.4);
    background: rgba(220, 53, 69, 0.03);
  }
  .flippable-card--mode-build {
    border-color: rgba(59, 130, 246, 0.2);
  }
  .flippable-card--mode-build:hover {
    border-color: rgba(59, 130, 246, 0.4);
    background: rgba(59, 130, 246, 0.03);
  }
  ```
- Fullscreen overlay: dark bg `rgba(0, 0, 0, 0.95)`
- Text: `color: #fff` where needed

**Step 3: Dark theme `MobileWalletStack.css`**

Add per-card mode glow:
```css
.mobile-card--mode-quick.mobile-card--active-glow {
  box-shadow: 0 0 24px rgba(220, 53, 69, 0.15);
  border-color: rgba(220, 53, 69, 0.3);
}

.mobile-card--mode-build.mobile-card--active-glow {
  box-shadow: 0 0 24px rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}
```

Remove the `mobile-wallet-stack--quick-mode` / `mobile-wallet-stack--build-mode` container classes (no longer needed since we removed mode from props).

**Step 4: Dark theme `CardContent.css`**

Update text colors for dark backgrounds:
```css
.card-content__room { color: #fff; }
.card-content__complaint { color: #ccc; }
.card-content__section-label { color: #999; }
```

**Step 5: Verify `EncounterCarousel.css` dark consistency**

Check that modal overlay, clear deck button, and other elements use dark colors. Update any light-themed values:
- Modal overlay: already uses dark bg — verify
- Clear deck button: update to dark theme if needed
- Modal confirmation: dark surface + white text

**Step 6: Visual verification**

```bash
cd frontend && pnpm dev
```

Open `http://localhost:5173/compose?dev-auth=1` and verify:
- Black background with subtle red radial gradient
- FAB visible bottom-right (red gradient)
- Empty state centered text
- Open sheet → dark bottom sheet with two option cards
- Create encounters → cards show with per-mode accent borders
- Mobile responsive (resize browser to <768px)

---

## Task 6: FullscreenOverlay Cleanup

**Dependencies:** Task 3 (mode prop removed from DesktopKanban)

**Files:**
- Modify: `frontend/src/components/build-mode/desktop/FullscreenOverlay.tsx`

**Step 1: Check FullscreenOverlay for `mode` prop usage**

Read the file and determine if `mode` is in the props interface. If so, remove it and replace any usage with `getEncounterMode(encounter)`.

**Step 2: Update props**

Remove `mode` from the interface if present. Use `getEncounterMode(encounter)` where the mode is needed internally.

**Step 3: Typecheck**

```bash
cd frontend && pnpm tsc --noEmit
```

Expected: No errors

---

## Task 7: Final Verification

**Dependencies:** All previous tasks

**Step 1: Typecheck + lint + tests**

```bash
cd frontend && pnpm check
```

Expected: All pass

**Step 2: Backend compilation**

```bash
cd backend && pnpm build
```

Expected: Clean compilation (no changes to backend, but verify it still compiles)

**Step 3: Visual verification checklist**

```bash
cd frontend && pnpm dev
```

Open `http://localhost:5173/compose?dev-auth=1`:

- [ ] No mode toggle visible
- [ ] FAB (red, bottom-right) visible on carousel view
- [ ] FAB hidden when in editor view
- [ ] Tapping FAB opens bottom sheet with Quick/Build options
- [ ] Tapping "Quick" creates encounter and opens QuickEncounterEditor
- [ ] Tapping "Build" creates encounter and opens EncounterEditor
- [ ] New encounters have empty room number (shows "Unassigned" in cards)
- [ ] InlineRoomInput in editor: click → edit → blur saves → room updates on card
- [ ] Empty state shows "No encounters yet / Tap + to create one"
- [ ] Dark theme: black bg, red gradient accent, white text
- [ ] Per-card mode colors: red border for quick, blue for build
- [ ] Mobile (< 768px): wallet stack works without NewEncounterCard
- [ ] Desktop: kanban works without NewEncounterCard
- [ ] Back button returns from editor to carousel
- [ ] Clear Deck still works

---

### Post-Implementation: Simplify & Commit
1. Run `/simplify` to review all changed code for reuse, quality, and efficiency
2. Re-run full test suite to confirm simplification preserved correctness
3. Commit all changes together
