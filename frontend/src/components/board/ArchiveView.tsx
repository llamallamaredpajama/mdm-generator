import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useArchivedEncounters } from '../../hooks/useArchivedEncounters'
import { getEncounterMode, formatRoomDisplay, formatPatientIdentifier } from '../../types/encounter'
import type { EncounterDocument } from '../../types/encounter'
import './ArchiveView.css'

/** Group key formatter: e.g. "Mar 10, 2026" */
function formatDateGroup(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Get a display label for the encounter's mode */
function modeBadge(encounter: EncounterDocument): string {
  return getEncounterMode(encounter) === 'quick' ? 'QUICK' : 'BUILD'
}

/** Derive display complaint text */
function getComplaintDisplay(encounter: EncounterDocument): string {
  const mode = getEncounterMode(encounter)
  if (mode === 'quick') {
    const id = formatPatientIdentifier(encounter.quickModeData?.patientIdentifier)
    return id || encounter.chiefComplaint || 'Completed'
  }
  return encounter.chiefComplaint || ''
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

export default function ArchiveView() {
  const { archivedEncounters, loading } = useArchivedEncounters()

  /** Group by date using archivedAt (or createdAt fallback) */
  const grouped = useMemo(() => {
    const groups: Record<string, EncounterDocument[]> = {}

    for (const enc of archivedEncounters) {
      const ts = enc.archivedAt ?? enc.createdAt
      const date = ts?.toDate ? ts.toDate() : new Date()
      const key = formatDateGroup(date)
      if (!groups[key]) groups[key] = []
      groups[key].push(enc)
    }

    // Sort groups newest-first
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      return new Date(b).getTime() - new Date(a).getTime()
    })

    return sorted
  }, [archivedEncounters])

  if (loading) {
    return (
      <div className="archive-view">
        <div className="archive-view__header">ARCHIVE</div>
        <div className="archive-view__empty">Loading...</div>
      </div>
    )
  }

  return (
    <div className="archive-view">
      <div className="archive-view__header">ARCHIVE</div>

      {grouped.length === 0 ? (
        <div className="archive-view__empty">No archived encounters</div>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible">
          {grouped.map(([dateKey, encs]) => (
            <div key={dateKey} className="archive-view__group">
              <div className="archive-view__group-header">{dateKey}</div>
              {encs.map((enc) => (
                <motion.div key={enc.id} variants={itemVariants} className="archive-view__item">
                  <span className="archive-view__room">{formatRoomDisplay(enc.roomNumber)}</span>
                  <span className="archive-view__complaint">{getComplaintDisplay(enc)}</span>
                  <span className="archive-view__badge">{modeBadge(enc)}</span>
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
