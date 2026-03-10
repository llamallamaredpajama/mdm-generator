import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useEncounterList } from '../../hooks/useEncounterList'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { getDisplayColumn, type DisplayColumn } from '../../lib/statusMapper'
import type { EncounterDocument, EncounterMode } from '../../types/encounter'
import StatusColumn from './StatusColumn'
import DetailPanel from './DetailPanel'
import './EncounterBoard.css'

const COLUMNS: DisplayColumn[] = ['COMPOSING', 'BUILDING', 'COMPLETE']

export default function EncounterBoard() {
  const isMobile = useIsMobile()
  const location = useLocation() as { state?: { openNew?: boolean } }

  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newRoom, setNewRoom] = useState('')
  const [newComplaint, setNewComplaint] = useState('')
  const [newMode, setNewMode] = useState<EncounterMode>('build')

  const { encounters, loading, createEncounter } = useEncounterList(newMode)

  // Auto-show form if navigated from sidebar "New" button
  useEffect(() => {
    if (location.state?.openNew) {
      setShowNewForm(true)
    }
  }, [location.state?.openNew])

  // Group encounters into 3 columns
  const grouped = useMemo(() => {
    const cols: Record<DisplayColumn, EncounterDocument[]> = {
      COMPOSING: [],
      BUILDING: [],
      COMPLETE: [],
    }
    encounters.forEach((e) => cols[getDisplayColumn(e)].push(e))
    return cols
  }, [encounters])

  // Toggle card selection
  const handleCardClick = useCallback((id: string) => {
    setActiveId((prev) => (prev === id ? null : id))
  }, [])

  // Create encounter
  const handleCreate = useCallback(async () => {
    if (!newRoom.trim()) return
    try {
      const newId = await createEncounter(newRoom.trim(), newComplaint.trim())
      setShowNewForm(false)
      setNewRoom('')
      setNewComplaint('')
      setActiveId(newId)
    } catch {
      // Error handled by hook
    }
  }, [newRoom, newComplaint, createEncounter])

  const handleCancel = useCallback(() => {
    setShowNewForm(false)
    setNewRoom('')
    setNewComplaint('')
  }, [])

  // Find the active encounter for the detail panel
  const activeEncounter = activeId ? encounters.find((e) => e.id === activeId) : null

  return (
    <div className={`encounter-board${isMobile ? ' encounter-board--mobile' : ''}`}>
      {/* Top bar */}
      <div className="encounter-board__top-bar">
        <h1 className="encounter-board__title">BOARD</h1>
        <span className="encounter-board__count">{encounters.length} TOTAL</span>
      </div>

      {/* Board content */}
      {loading ? (
        <div className="encounter-board__loading">Loading encounters...</div>
      ) : (
        <div className="encounter-board__columns">
          {COLUMNS.map((col) => (
            <div key={col} className="encounter-board__column-wrapper">
              {/* Inline new encounter form at top of COMPOSING column */}
              {col === 'COMPOSING' && showNewForm && (
                <div className="encounter-board__new-form">
                  <div className="encounter-board__new-form-row">
                    <input
                      className="encounter-board__new-input"
                      type="text"
                      placeholder="Room #"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      autoFocus
                    />
                    <input
                      className="encounter-board__new-input"
                      type="text"
                      placeholder="Chief complaint"
                      value={newComplaint}
                      onChange={(e) => setNewComplaint(e.target.value)}
                    />
                  </div>
                  <div className="encounter-board__mode-toggle">
                    <button
                      className={`encounter-board__mode-btn${newMode === 'quick' ? ' encounter-board__mode-btn--active' : ''}`}
                      onClick={() => setNewMode('quick')}
                      type="button"
                    >
                      Quick
                    </button>
                    <button
                      className={`encounter-board__mode-btn${newMode === 'build' ? ' encounter-board__mode-btn--active' : ''}`}
                      onClick={() => setNewMode('build')}
                      type="button"
                    >
                      Build
                    </button>
                  </div>
                  <div className="encounter-board__new-actions">
                    <button
                      className="encounter-board__cancel-btn"
                      onClick={handleCancel}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="encounter-board__create-btn"
                      onClick={handleCreate}
                      disabled={!newRoom.trim()}
                      type="button"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
              <StatusColumn
                status={col}
                encounters={grouped[col]}
                activeId={activeId}
                onCardClick={handleCardClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {activeEncounter && (
          <DetailPanel
            key={activeEncounter.id}
            encounter={activeEncounter}
            onClose={() => setActiveId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
