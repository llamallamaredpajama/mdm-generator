import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import './SettingsModal.css'

interface SettingsModalProps {
  onClose: () => void
}

interface BoardSettings {
  decisionRules: boolean
  guidelines: boolean
  surveillance: boolean
  autoSort: boolean
  dictation: boolean
}

const STORAGE_KEY = 'board-settings'

const DEFAULT_SETTINGS: BoardSettings = {
  decisionRules: true,
  guidelines: true,
  surveillance: true,
  autoSort: true,
  dictation: true,
}

const TOGGLES: { key: keyof BoardSettings; label: string; desc: string }[] = [
  { key: 'decisionRules', label: 'CLINICAL DECISION RULES', desc: 'HEART, Wells, PERC, Ottawa' },
  { key: 'guidelines', label: 'SOCIETY GUIDELINES', desc: 'AHA, ACEP, specialty societies' },
  {
    key: 'surveillance',
    label: 'REGIONAL SURVEILLANCE',
    desc: 'Syndromic data, bioterrorism alerts',
  },
  { key: 'autoSort', label: 'AUTO-SORT ENCOUNTERS', desc: 'Organize by status automatically' },
  { key: 'dictation', label: 'VOICE DICTATION', desc: 'Microphone input for narratives' },
]

function loadSettings(): BoardSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: BoardSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage full or unavailable — silent fail
  }
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [settings, setSettings] = useState<BoardSettings>(loadSettings)

  const handleToggle = useCallback((key: keyof BoardSettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      saveSettings(next)
      return next
    })
  }, [])

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
      }

  return (
    <motion.div className="settings-modal" {...motionProps}>
      <div className="settings-modal__content">
        {/* Header */}
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">SETTINGS</h2>
          <motion.button
            className="settings-modal__done"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
          >
            DONE
          </motion.button>
        </div>

        {/* Toggle list */}
        <div className="settings-modal__toggles">
          {TOGGLES.map((t) => (
            <div key={t.key} className="settings-modal__toggle">
              <div className="settings-modal__toggle-info">
                <div className="settings-modal__toggle-label">{t.label}</div>
                <div className="settings-modal__toggle-desc">{t.desc}</div>
              </div>
              <div
                className={`settings-modal__switch${settings[t.key] ? ' settings-modal__switch--on' : ''}`}
                onClick={() => handleToggle(t.key)}
                role="switch"
                aria-checked={settings[t.key]}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleToggle(t.key)
                  }
                }}
              >
                <motion.div
                  className="settings-modal__switch-thumb"
                  layout
                  initial={false}
                  animate={{
                    x: settings[t.key] ? 22 : 2,
                    backgroundColor: settings[t.key] ? '#ffffff' : '#999999',
                  }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
