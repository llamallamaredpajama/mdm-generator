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
  wrapping?: boolean
}

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
  wrapping = false,
}: SwimLaneRowProps) {
  const count = encounters.length

  return (
    <div className={`swim-lane-row${wrapping ? ' swim-lane-row--wrapping' : ''}`}>
      <div className="swim-lane-row__header">
        <span className="swim-lane-row__label">{status}</span>
        <span
          className={`swim-lane-row__count ${count > 0 ? 'swim-lane-row__count--active' : 'swim-lane-row__count--empty'}`}
        >
          {count}
        </span>
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
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
