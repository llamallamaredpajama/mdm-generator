import { motion } from 'framer-motion'
import type { EncounterDocument } from '../../types/encounter'
import { formatRoomDisplay, formatPatientIdentifier, getEncounterMode } from '../../types/encounter'
import { getEncounterPhoto } from '../../lib/photoMapper'
import './BoardCard.css'

interface BoardCardProps {
  encounter: EncounterDocument
  isActive: boolean
  onClick: () => void
}

export default function BoardCard({ encounter, isActive, onClick }: BoardCardProps) {
  const mode = getEncounterMode(encounter)
  const photo = getEncounterPhoto(encounter.chiefComplaint)
  const roomDisplay = formatRoomDisplay(encounter.roomNumber)

  // Build the meta line and complaint based on mode
  let metaText: string
  let complaintText: string

  if (mode === 'quick') {
    const identifier = formatPatientIdentifier(encounter.quickModeData?.patientIdentifier)
    metaText = identifier || 'Draft'
    complaintText = encounter.chiefComplaint || ''
  } else {
    metaText = roomDisplay
    complaintText = encounter.chiefComplaint || ''
  }

  return (
    <motion.div
      layoutId={`board-card-${encounter.id}`}
      className={`board-card${isActive ? ' board-card--active' : ''}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="board-card__photo">
        <img
          className="board-card__photo-img"
          src={photo}
          alt={encounter.chiefComplaint || 'Encounter'}
          loading="lazy"
        />
        <span className="board-card__room">{roomDisplay}</span>
      </div>
      <div className="board-card__info">
        <div className="board-card__meta">{metaText}</div>
        {complaintText && <div className="board-card__complaint">{complaintText}</div>}
      </div>
    </motion.div>
  )
}
