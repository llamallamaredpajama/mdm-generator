import { motion, AnimatePresence } from 'framer-motion'
import type { EncounterDocument } from '../../types/encounter'
import type { DisplayColumn } from '../../lib/statusMapper'
import BoardCard from './BoardCard'
import './SwimLaneRow.css'

interface SwimLaneRowProps {
  status: DisplayColumn
  encounters: EncounterDocument[]
  activeId: string | null
  onCardClick: (id: string) => void
  fill?: boolean
  isMobile: boolean
  onClearSection?: () => void
  onCardDelete?: (encounter: EncounterDocument) => void
}

const COLS = 5
const MAX_ROWS = 2

const rowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

export default function SwimLaneRow({
  status,
  encounters,
  activeId,
  onCardClick,
  fill = false,
  isMobile,
  onClearSection,
  onCardDelete,
}: SwimLaneRowProps) {
  const count = encounters.length
  const showOverflow = !isMobile && count > COLS * MAX_ROWS

  const cls = [
    'swim-lane-row',
    fill && 'swim-lane-row--fill',
    showOverflow && 'swim-lane-row--overflow',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls}>
      <div className="swim-lane-row__header">
        <span className="swim-lane-row__label">{status}</span>
        {onClearSection && count > 0 && (
          <button
            type="button"
            className="swim-lane-row__clear-btn"
            onClick={onClearSection}
            title={`Clear all ${status.toLowerCase()} encounters`}
          >
            {'\u{1F5D1}'}
          </button>
        )}
      </div>

      {count === 0 ? (
        <div className="swim-lane-row__empty">EMPTY</div>
      ) : (
        <motion.div
          className="swim-lane-row__cards"
          variants={rowVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {encounters.map((encounter) => (
              <motion.div
                key={encounter.id}
                className="swim-lane-row__card-slot"
                variants={cardVariants}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <BoardCard
                  encounter={encounter}
                  isActive={encounter.id === activeId}
                  onClick={() => onCardClick(encounter.id)}
                  onDelete={
                    onCardDelete
                      ? (e) => {
                          e.stopPropagation()
                          onCardDelete(encounter)
                        }
                      : undefined
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
