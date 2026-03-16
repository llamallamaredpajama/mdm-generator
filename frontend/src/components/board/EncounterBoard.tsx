import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEncounterList } from '../../hooks/useEncounterList'
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { getDisplayColumn, type DisplayColumn } from '../../lib/statusMapper'
import type { EncounterDocument } from '../../types/encounter'
import { useSubscription } from '../../hooks/useSubscription'
import { useToast } from '../../contexts/ToastContext'
import SwimLaneRow from './SwimLaneRow'
import DetailPanel from './DetailPanel'
import SaveDraftPopup from './SaveDraftPopup'
import './EncounterBoard.css'

const ACTIVE_ID_KEY = 'encounter-board-active-id'
const ROWS: DisplayColumn[] = ['COMPLETE', 'COMPOSING']

export default function EncounterBoard() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = usePrefersReducedMotion()
  const location = useLocation() as { state?: { openNew?: boolean } }

  const navigate = useNavigate()
  const { canGenerate, tier } = useSubscription()
  const toast = useToast()

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ACTIVE_ID_KEY)
    } catch {
      return null
    }
  })
  const [showSaveDraft, setShowSaveDraft] = useState(false)
  useEffect(() => {
    try {
      if (activeId) {
        sessionStorage.setItem(ACTIVE_ID_KEY, activeId)
      } else {
        sessionStorage.removeItem(ACTIVE_ID_KEY)
      }
    } catch {
      // sessionStorage unavailable (private browsing edge case)
    }
  }, [activeId])

  const creatingRef = useRef(false)

  const { encounters, loading, createEncounter, updateEncounterMeta, switchEncounterMode } =
    useEncounterList('build')

  // Handle + button: create empty encounter and open panel
  const handleNewEncounter = useCallback(async () => {
    if (creatingRef.current) return
    if (!canGenerate) {
      toast.warning(`Monthly generation limit reached (${tier} plan). Upgrade for more.`)
      return
    }
    creatingRef.current = true
    try {
      const newId = await createEncounter('', '')
      setActiveId(newId)
    } catch {
      // Error handled by hook
    } finally {
      creatingRef.current = false
    }
  }, [createEncounter, canGenerate, tier, toast])

  // Auto-trigger when navigated with openNew state
  useEffect(() => {
    if (location.state?.openNew) {
      navigate('/compose', { replace: true, state: {} })
      void handleNewEncounter()
    }
  }, [location.state?.openNew, handleNewEncounter, navigate])

  // Group encounters into 2 rows
  const grouped = useMemo(() => {
    const rows: Record<DisplayColumn, EncounterDocument[]> = {
      COMPOSING: [],
      COMPLETE: [],
    }
    encounters.forEach((e) => rows[getDisplayColumn(e)].push(e))
    // Newest encounters first (left) in each row
    const byNewest = (a: EncounterDocument, b: EncounterDocument) =>
      (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
    rows.COMPOSING.sort(byNewest)
    rows.COMPLETE.sort(byNewest)
    return rows
  }, [encounters])

  // Clear stale ID if encounter no longer exists (e.g. deleted while on another tab)
  useEffect(() => {
    if (!loading && activeId && !encounters.some((e) => e.id === activeId)) {
      setActiveId(null)
    }
  }, [loading, activeId, encounters])

  const composingEmpty = grouped.COMPOSING.length === 0
  const completeEmpty = grouped.COMPLETE.length === 0

  // Toggle card selection
  const handleCardClick = useCallback((id: string) => {
    setActiveId((prev) => (prev === id ? null : id))
  }, [])

  // Close panel — show save draft popup if encounter has no room/CC
  const activeEncounter = activeId ? encounters.find((e) => e.id === activeId) : null

  const handleClosePanel = useCallback(() => {
    if (
      activeEncounter &&
      !activeEncounter.roomNumber &&
      !activeEncounter.chiefComplaint &&
      activeEncounter.status === 'draft'
    ) {
      setShowSaveDraft(true)
    } else {
      setActiveId(null)
    }
  }, [activeEncounter])

  const handleSaveDraftSkip = useCallback(() => {
    setShowSaveDraft(false)
    setActiveId(null)
  }, [])

  const handleSaveDraftConfirm = useCallback(
    async (data: { roomNumber: string; chiefComplaint: string }) => {
      if (activeEncounter) {
        const updates: { roomNumber?: string; chiefComplaint?: string } = {}
        if (data.roomNumber) updates.roomNumber = data.roomNumber
        if (data.chiefComplaint) updates.chiefComplaint = data.chiefComplaint
        if (Object.keys(updates).length > 0) {
          try {
            await updateEncounterMeta(activeEncounter.id, updates)
          } catch {
            // Error handled silently
          }
        }
      }
      setShowSaveDraft(false)
      setActiveId(null)
    },
    [activeEncounter, updateEncounterMeta],
  )

  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 25, stiffness: 200 }

  if (loading) {
    return (
      <div className="encounter-board">
        <div className="encounter-board__loading">Loading encounters...</div>
      </div>
    )
  }

  return (
    <div className={`encounter-board${isMobile ? ' encounter-board--mobile' : ''}`}>
      <div className="encounter-board__split">
        {/* Desktop: push-split panel */}
        {!isMobile && (
          <AnimatePresence>
            {activeEncounter && (
              <motion.div
                key="panel"
                className="encounter-board__panel-wrap"
                initial={{ width: 0 }}
                animate={{ width: '50%' }}
                exit={{ width: 0 }}
                transition={panelTransition}
              >
                <DetailPanel
                  encounter={activeEncounter}
                  onClose={handleClosePanel}
                  onSwitchMode={switchEncounterMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Board area with swim lane rows */}
        <div className="encounter-board__board-area">
          {ROWS.map((row) => (
            <SwimLaneRow
              key={row}
              status={row}
              encounters={grouped[row]}
              activeId={activeId}
              onCardClick={handleCardClick}
              isMobile={isMobile}
              fill={
                (row === 'COMPLETE' && composingEmpty) || (row === 'COMPOSING' && completeEmpty)
              }
            />
          ))}
        </div>
      </div>

      {/* Mobile: full-screen panel overlay */}
      {isMobile && (
        <AnimatePresence>
          {activeEncounter && (
            <DetailPanel
              key={activeEncounter.id}
              encounter={activeEncounter}
              onClose={handleClosePanel}
              onSwitchMode={switchEncounterMode}
            />
          )}
        </AnimatePresence>
      )}

      {/* Save draft popup */}
      {showSaveDraft && (
        <SaveDraftPopup onSkip={handleSaveDraftSkip} onSave={handleSaveDraftConfirm} />
      )}
    </div>
  )
}
