/**
 * Unified Compose Route
 *
 * Provides two modes for MDM generation:
 * 1. Quick Compose - "F1 Speed" single-input workflow (auto-creates encounter)
 * 2. Build Mode - 3-section guided workflow for complex cases
 *
 * Quick Mode skips the carousel: navigate → textarea ready → type → generate.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useEncounterList } from '../hooks/useEncounterList'
import EncounterCarousel from '../components/build-mode/EncounterCarousel'
import EncounterEditor from '../components/build-mode/EncounterEditor'
import QuickEncounterEditor from '../components/build-mode/QuickEncounterEditor'
import type { EncounterMode } from '../types/encounter'
import './Compose.css'

/**
 * Compact mode toggle — icon + label segmented control
 */
function ModeToggle({
  mode,
  onModeChange,
  disabled,
}: {
  mode: EncounterMode
  onModeChange: (mode: EncounterMode) => void
  disabled?: boolean
}) {
  return (
    <div className="compose-mode-toggle" role="tablist" aria-label="Compose mode" data-mode={mode}>
      <button
        type="button"
        role="tab"
        className={`compose-mode-toggle__btn ${mode === 'quick' ? 'compose-mode-toggle__btn--active' : ''}`}
        onClick={() => onModeChange('quick')}
        disabled={disabled}
        aria-selected={mode === 'quick'}
        aria-controls="compose-content"
      >
        <svg
          className="compose-mode-toggle__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Quick
      </button>
      <button
        type="button"
        role="tab"
        className={`compose-mode-toggle__btn ${mode === 'build' ? 'compose-mode-toggle__btn--active compose-mode-toggle__btn--active-build' : ''}`}
        onClick={() => onModeChange('build')}
        disabled={disabled}
        aria-selected={mode === 'build'}
        aria-controls="compose-content"
      >
        <svg
          className="compose-mode-toggle__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        Build
      </button>
    </div>
  )
}

/**
 * Compose Route Component
 */
export default function Compose() {
  const location = useLocation()

  // Mode state - persisted during session
  const [mode, setMode] = useState<EncounterMode>('quick')

  // View state: null = carousel (build) / auto-create (quick), string = editor
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null)

  // PHI attestation — session state, resets on refresh (compliance)
  const [phiAttested, setPhiAttested] = useState(false)

  // Track whether auto-create is in progress to prevent double-create
  const autoCreateInProgress = useRef(false)

  // Quick mode encounter counter for auto-generating room numbers
  const quickCounterRef = useRef(0)

  // Reset to Quick Compose when header Compose button is clicked
  useEffect(() => {
    if (location.state?.resetToQuick) {
      setMode('quick')
      setSelectedEncounterId(null)
    }
  }, [location.state?.resetToQuick])

  // Fetch encounters from Firestore, filtered by mode
  const { encounters, loading, error, createEncounter, deleteEncounter, clearAllEncounters } = useEncounterList(mode)

  // Update quick counter based on existing quick encounters
  useEffect(() => {
    const quickEncounters = encounters.filter(e => e.mode === 'quick')
    const maxNum = quickEncounters.reduce((max, e) => {
      const match = e.roomNumber.match(/^Q-(\d+)$/)
      return match ? Math.max(max, parseInt(match[1], 10)) : max
    }, 0)
    quickCounterRef.current = maxNum
  }, [encounters])

  /**
   * Auto-create encounter for Quick Mode when no encounter is selected
   */
  useEffect(() => {
    if (mode !== 'quick' || selectedEncounterId || loading || autoCreateInProgress.current) {
      return
    }

    autoCreateInProgress.current = true
    const roomNumber = `Q-${quickCounterRef.current + 1}`

    createEncounter(roomNumber, '')
      .then((id) => {
        setSelectedEncounterId(id)
        window.history.pushState({ encounterEditor: true }, '')
      })
      .catch((err) => {
        console.error('Failed to auto-create quick encounter:', err)
      })
      .finally(() => {
        autoCreateInProgress.current = false
      })
  }, [mode, selectedEncounterId, loading, createEncounter])

  /**
   * Handle encounter selection from carousel.
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
   * Handle mode change — clear selected encounter when switching
   */
  const handleModeChange = useCallback((newMode: EncounterMode) => {
    setMode(newMode)
    setSelectedEncounterId(null)
  }, [])

  /**
   * Handle "Next Patient" — clear selection to trigger auto-create
   */
  const handleNewEncounter = useCallback(() => {
    setSelectedEncounterId(null)
    setPhiAttested(false)
  }, [])

  // Quick mode: auto-creating encounter — show brief loading
  if (mode === 'quick' && !selectedEncounterId) {
    return (
      <div className="compose-page compose-page--editor">
        <div className="quick-editor">
          <div className="quick-editor__loading">
            <div className="quick-editor__spinner" />
            <span>Preparing encounter...</span>
          </div>
        </div>
      </div>
    )
  }

  // Render editor view when an encounter is selected
  if (selectedEncounterId) {
    const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId)
    const selectedMode = selectedEncounter?.mode || mode

    if (selectedMode === 'quick') {
      return (
        <div className="compose-page compose-page--editor">
          <QuickEncounterEditor
            encounterId={selectedEncounterId}
            onBack={handleBack}
            phiAttested={phiAttested}
            onPhiAttestedChange={setPhiAttested}
            onNewEncounter={handleNewEncounter}
          />
        </div>
      )
    }

    return (
      <div className="compose-page compose-page--editor">
        <EncounterEditor encounterId={selectedEncounterId} onBack={handleBack} />
      </div>
    )
  }

  // Loading state (Build Mode only — Quick Mode handled above)
  if (loading) {
    return (
      <div className="compose-page compose-page--carousel">
        <header className="compose-header">
          <ModeToggle mode={mode} onModeChange={handleModeChange} disabled />
        </header>
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
        <header className="compose-header">
          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </header>
        <main className="compose-main compose-main--carousel">
          <div className="compose-error">
            <span className="compose-error-icon" aria-hidden="true">!</span>
            <p className="compose-error-message">
              {error.message || 'Failed to load encounters'}
            </p>
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

  // Render carousel view (Build Mode default — Quick Mode auto-creates above)
  return (
    <div className="compose-page compose-page--carousel">
      <header className="compose-header">
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
      </header>

      <main className="compose-main compose-main--carousel" id="compose-content" role="tabpanel">
        <EncounterCarousel
          encounters={encounters}
          onSelectEncounter={handleSelectEncounter}
          onCreateEncounter={createEncounter}
          onDeleteEncounter={deleteEncounter}
          onClearAllEncounters={clearAllEncounters}
          mode={mode}
        />
      </main>

      <footer className="compose-footer">
        <p className="compose-disclaimer">
          Educational only — physician review required
        </p>
      </footer>
    </div>
  )
}
