import { motion } from 'framer-motion'
import type { EncounterDocument } from '../../types/encounter'
import { formatRoomDisplay, formatPatientIdentifier, getEncounterMode } from '../../types/encounter'
import { getEncounterPhoto } from '../../lib/photoMapper'
import { usePhotoUrls } from '../../contexts/PhotoLibraryContext'
import './BoardCard.css'

interface BoardCardProps {
  encounter: EncounterDocument
  isActive: boolean
  onClick: () => void
}

function getSectionComplete(encounter: EncounterDocument, section: 1 | 2 | 3): boolean {
  const sectionKey = `section${section}` as 'section1' | 'section2' | 'section3'
  return !!encounter[sectionKey].llmResponse
}

export default function BoardCard({ encounter, isActive, onClick }: BoardCardProps) {
  const mode = getEncounterMode(encounter)
  const photoUrls = usePhotoUrls()
  const photo = getEncounterPhoto(encounter.chiefComplaint, encounter.encounterPhoto, photoUrls)
  const roomDisplay = formatRoomDisplay(encounter.roomNumber)

  const isQuickDraft =
    mode === 'quick' &&
    (!encounter.quickModeData?.status || encounter.quickModeData.status === 'draft')
  const isQuickComplete = mode === 'quick' && encounter.quickModeData?.status === 'completed'

  return (
    <motion.div
      layoutId={`board-card-${encounter.id}`}
      className={`board-card${isActive ? ' board-card--active' : ''}${isQuickDraft ? ' board-card--draft' : ''}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className={`board-card__photo${isQuickDraft ? ' board-card__photo--dimmed' : ''}`}>
        <img
          className="board-card__photo-img"
          src={photo}
          alt={encounter.chiefComplaint || 'Encounter'}
          loading="lazy"
        />
        {roomDisplay && <span className="board-card__room">{roomDisplay}</span>}
      </div>

      <div className="board-card__footer">
        {mode === 'build' ? (
          <>
            <span className="board-card__complaint">{encounter.chiefComplaint || '\u2014'}</span>
            <div className="board-card__sections">
              {([1, 2, 3] as const).map((s) => (
                <span
                  key={s}
                  className={`board-card__section-dot${getSectionComplete(encounter, s) ? ' board-card__section-dot--complete' : ''}`}
                />
              ))}
            </div>
          </>
        ) : isQuickComplete ? (
          <span className="board-card__identifier">
            {formatPatientIdentifier(encounter.quickModeData?.patientIdentifier) || 'Complete'}
          </span>
        ) : (
          <span className="board-card__draft-label">Draft</span>
        )}
      </div>
    </motion.div>
  )
}
