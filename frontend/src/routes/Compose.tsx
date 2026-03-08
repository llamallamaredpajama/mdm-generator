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
  const handleCreateFromSheet = useCallback(
    async (mode: EncounterMode) => {
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
    },
    [isCreatingEncounter, createEncounter, handleSelectEncounter],
  )

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
            <span className="compose-error-icon" aria-hidden="true">
              !
            </span>
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
            <p className="compose-empty__text">No encounters yet</p>
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
