import { motion, AnimatePresence } from 'framer-motion'
import type { EncounterDocument } from '../../types/encounter'
import type { DisplayColumn } from '../../lib/statusMapper'
import BoardCard from './BoardCard'
import './StatusColumn.css'

interface StatusColumnProps {
  status: DisplayColumn
  encounters: EncounterDocument[]
  activeId: string | null
  onCardClick: (id: string) => void
}

const columnVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

export default function StatusColumn({
  status,
  encounters,
  activeId,
  onCardClick,
}: StatusColumnProps) {
  const count = encounters.length

  return (
    <div className="status-column">
      <div className="status-column__header">
        <span className="status-column__label">{status}</span>
        <span
          className="status-column__count"
          style={{
            color:
              count > 0 ? 'var(--color-text-primary, #fff)' : 'var(--color-text-secondary, #999)',
          }}
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div className="status-column__empty">EMPTY</div>
      ) : (
        <motion.div
          className="status-column__cards"
          variants={columnVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {encounters.map((encounter) => (
              <motion.div
                key={encounter.id}
                variants={cardVariants}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
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
