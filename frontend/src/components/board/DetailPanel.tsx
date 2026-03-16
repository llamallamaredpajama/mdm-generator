import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useEncounter } from '../../hooks/useEncounter'
import { useQuickEncounter } from '../../hooks/useQuickEncounter'
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { getEncounterMode, formatRoomDisplay } from '../../types/encounter'
import { getEncounterPhoto } from '../../lib/photoMapper'
import {
  getDifferential,
  getMdmPreview,
  getFinalMdm,
  getCdrAnalysis,
  getSocietyGuidelines,
} from '../../lib/encounterUtils'
import { matchCdrs } from '../../lib/api'
import { useAuthToken } from '../../lib/firebase'
import { usePhotoUrls } from '../../contexts/PhotoLibraryContext'
import { useToast } from '../../contexts/ToastContext'
import type {
  EncounterDocument,
  EncounterStatus,
  SectionNumber,
  EncounterMode,
} from '../../types/encounter'
import NarrativeToolbar from './NarrativeToolbar'
import RulesPanel from './RulesPanel'
import GuidesPanel from './GuidesPanel'
import SurveillancePanel from './SurveillancePanel'
import './DetailPanel.css'

interface DetailPanelProps {
  encounter: EncounterDocument
  onClose: () => void
  onSwitchMode: (encounterId: string, newMode: EncounterMode) => Promise<void>
}

const STATUS_LABELS: Partial<Record<EncounterStatus, string>> = {
  finalized: 'COMPLETE',
  section2_done: 'S2 DONE',
  section1_done: 'S1 DONE',
}

const SECTION_LABELS: Record<SectionNumber, string> = {
  1: 'HISTORY, PHYSICAL & FIRST IMPRESSION',
  2: 'WORKUP & RESULTS',
  3: 'TREATMENT & DISPOSITION',
}

export default function DetailPanel({ encounter, onClose, onSwitchMode }: DetailPanelProps) {
  const isMobile = useIsMobile()
  const mode = getEncounterMode(encounter)

  if (mode === 'quick') {
    return (
      <QuickDetailContent
        encounter={encounter}
        onClose={onClose}
        isMobile={isMobile}
        onSwitchMode={onSwitchMode}
      />
    )
  }

  return (
    <BuildDetailContent
      encounter={encounter}
      onClose={onClose}
      isMobile={isMobile}
      onSwitchMode={onSwitchMode}
    />
  )
}

// ============================================================================
// Build Mode Detail Content
// ============================================================================

interface DetailContentProps {
  encounter: EncounterDocument
  onClose: () => void
  isMobile: boolean
  onSwitchMode: (encounterId: string, newMode: EncounterMode) => Promise<void>
}

function BuildDetailContent({
  encounter: initialEncounter,
  onClose,
  isMobile,
  onSwitchMode,
}: DetailContentProps) {
  const { encounter, updateSectionContent, submitSection, isSubmitting } = useEncounter(
    initialEncounter.id,
  )

  const token = useAuthToken()
  const [isDictating, setIsDictating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentEncounter = encounter || initialEncounter
  const currentSection = currentEncounter.currentSection as SectionNumber
  const sectionKey = `section${currentSection}` as 'section1' | 'section2' | 'section3'
  const sectionData = currentEncounter[sectionKey]
  const hasOutput = !!sectionData.llmResponse

  // Extract CDR analysis and society guidelines from S1 for display
  const cdrAnalysis = currentEncounter.section1.llmResponse
    ? getCdrAnalysis(currentEncounter.section1.llmResponse)
    : []
  const societyGuidelines = currentEncounter.section1.llmResponse
    ? getSocietyGuidelines(currentEncounter.section1.llmResponse)
    : []

  // Trigger CDR matching when S1 is complete but cdrTracking is empty
  const hasCdrTracking = Object.keys(currentEncounter.cdrTracking).length > 0
  const matchFiredRef = useRef(false)

  useEffect(() => {
    matchFiredRef.current = false
  }, [currentEncounter.id])

  useEffect(() => {
    if (
      currentEncounter.section1.llmResponse &&
      !hasCdrTracking &&
      !matchFiredRef.current &&
      token &&
      cdrAnalysis.length > 0
    ) {
      matchFiredRef.current = true
      matchCdrs(currentEncounter.id, token).catch(() => {
        // Silently fail — cdrAnalysis fallback is already showing
      })
    }
  }, [
    currentEncounter.id,
    currentEncounter.section1.llmResponse,
    hasCdrTracking,
    token,
    cdrAnalysis.length,
  ])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateSectionContent(currentSection, e.target.value)
    },
    [currentSection, updateSectionContent],
  )

  const handleSubmit = useCallback(() => {
    submitSection(currentSection).catch(() => {
      // Error handled by hook
    })
  }, [currentSection, submitSection])

  const handleDictate = useCallback(() => {
    setIsDictating((prev) => !prev)
  }, [])

  const handleType = useCallback(() => {
    textareaRef.current?.focus()
  }, [])

  const canSubmit = !isSubmitting && !sectionData.isLocked && sectionData.content.trim().length > 0

  const statusLabel = STATUS_LABELS[currentEncounter.status] || 'DRAFT'

  return (
    <DetailPanelShell
      encounter={currentEncounter}
      onClose={onClose}
      isMobile={isMobile}
      statusLabel={statusLabel}
      onSwitchMode={onSwitchMode}
    >
      {/* Section label */}
      <div className="detail-panel__section-label">
        S{currentSection} {SECTION_LABELS[currentSection]}
      </div>

      {/* Narrative textarea */}
      <div
        className={`detail-panel__narrative-wrap${isDictating ? ' detail-panel__narrative-wrap--dictating' : ''}${isSubmitting ? ' detail-panel__narrative-wrap--submitting' : ''}`}
      >
        {isDictating && <div className="detail-panel__dictation-badge">● RECORDING</div>}

        <textarea
          ref={textareaRef}
          className="detail-panel__textarea"
          value={sectionData.content}
          onChange={handleContentChange}
          placeholder="Describe the encounter..."
          disabled={sectionData.isLocked}
        />

        <NarrativeToolbar
          onDictate={handleDictate}
          onType={handleType}
          onSubmit={handleSubmit}
          isDictating={isDictating}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel="PROCESS \u2192"
        />
      </div>

      {/* Section output */}
      {hasOutput &&
        currentSection === 1 &&
        sectionData.llmResponse &&
        (() => {
          const differential = getDifferential(sectionData.llmResponse)
          return differential.length > 0 ? (
            <div className="detail-panel__output">
              <div className="detail-panel__output-label">Differential Diagnosis</div>
              <div className="detail-panel__differential">
                {differential.map((item, idx) => (
                  <div key={idx} className="detail-panel__diff-item">
                    <div className="detail-panel__diff-diagnosis">
                      <span
                        className={`detail-panel__diff-urgency detail-panel__diff-urgency--${item.urgency}`}
                      >
                        {item.urgency}
                      </span>
                      {item.diagnosis}
                    </div>
                    <div className="detail-panel__diff-reasoning">{item.reasoning}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        })()}

      {hasOutput &&
        currentSection === 2 &&
        sectionData.llmResponse &&
        (() => {
          const preview = getMdmPreview(sectionData.llmResponse)
          return preview ? (
            <div className="detail-panel__output">
              <div className="detail-panel__output-label">MDM Preview</div>
              <div className="detail-panel__mdm-output">{String(preview.reasoning)}</div>
            </div>
          ) : null
        })()}

      {hasOutput &&
        currentSection === 3 &&
        sectionData.llmResponse &&
        (() => {
          const finalMdm = getFinalMdm(sectionData.llmResponse)
          return finalMdm ? (
            <div className="detail-panel__output">
              <div className="detail-panel__output-label">Final MDM</div>
              <div className="detail-panel__mdm-output">{String(finalMdm.text)}</div>
              <CopyMdmButton text={finalMdm.text} />
            </div>
          ) : null
        })()}

      {/* Intelligence panels */}
      {hasOutput && (
        <div className="detail-panel__intel-section">
          <RulesPanel
            cdrTracking={currentEncounter.cdrTracking}
            cdrAnalysis={cdrAnalysis}
            delay={0.1}
          />
          <div className="detail-panel__intel-grid">
            <GuidesPanel guidelines={societyGuidelines} delay={0.2} />
            <SurveillancePanel trendAnalysis={currentEncounter.trendAnalysis} delay={0.3} />
          </div>
        </div>
      )}
    </DetailPanelShell>
  )
}

// ============================================================================
// Quick Mode Detail Content
// ============================================================================

function QuickDetailContent({
  encounter: initialEncounter,
  onClose,
  isMobile,
  onSwitchMode,
}: DetailContentProps) {
  const { narrative, setNarrative, submitNarrative, isSubmitting, mdmOutput, quickStatus } =
    useQuickEncounter(initialEncounter.id)

  const [isDictating, setIsDictating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNarrative(e.target.value)
    },
    [setNarrative],
  )

  const handleSubmit = useCallback(() => {
    submitNarrative().catch(() => {
      // Error handled by hook
    })
  }, [submitNarrative])

  const handleDictate = useCallback(() => {
    setIsDictating((prev) => !prev)
  }, [])

  const handleType = useCallback(() => {
    textareaRef.current?.focus()
  }, [])

  const canSubmit = !isSubmitting && narrative.trim().length > 0 && quickStatus !== 'completed'
  const isComplete = quickStatus === 'completed'

  const statusLabel = quickStatus ? quickStatus.toUpperCase() : 'DRAFT'

  return (
    <DetailPanelShell
      encounter={initialEncounter}
      onClose={onClose}
      isMobile={isMobile}
      statusLabel={statusLabel}
      onSwitchMode={onSwitchMode}
    >
      {/* Narrative textarea */}
      <div
        className={`detail-panel__narrative-wrap${isDictating ? ' detail-panel__narrative-wrap--dictating' : ''}${isSubmitting ? ' detail-panel__narrative-wrap--submitting' : ''}`}
      >
        {isDictating && <div className="detail-panel__dictation-badge">● RECORDING</div>}

        <textarea
          ref={textareaRef}
          className="detail-panel__textarea"
          value={narrative}
          onChange={handleContentChange}
          placeholder="Describe the encounter..."
          disabled={isComplete}
        />

        <NarrativeToolbar
          onDictate={handleDictate}
          onType={handleType}
          onSubmit={handleSubmit}
          isDictating={isDictating}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel="SUBMIT"
        />
      </div>

      {/* MDM output */}
      {mdmOutput && (
        <div className="detail-panel__output">
          <div className="detail-panel__output-label">MDM Output</div>
          <div className="detail-panel__mdm-output">{mdmOutput.text}</div>
          <CopyMdmButton text={mdmOutput.text} />
        </div>
      )}

      {isComplete && !mdmOutput && <span className="detail-panel__complete-badge">✓ COMPLETE</span>}

      {/* Intelligence panels */}
      {mdmOutput && (
        <div className="detail-panel__intel-section">
          <RulesPanel
            cdrTracking={initialEncounter.cdrTracking}
            cdrAnalysis={initialEncounter.quickModeData?.cdrAnalysis}
            delay={0.1}
          />
          <div className="detail-panel__intel-grid">
            <GuidesPanel delay={0.2} />
            <SurveillancePanel trendAnalysis={initialEncounter.trendAnalysis} delay={0.3} />
          </div>
        </div>
      )}
    </DetailPanelShell>
  )
}

// ============================================================================
// Copy MDM Button
// ============================================================================

function CopyMdmButton({ text }: { text: string }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('MDM copied to clipboard')
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy — try selecting the text manually')
    }
  }, [text, toast])

  return (
    <div className="detail-panel__copy-wrap">
      <button
        type="button"
        className={`detail-panel__copy-btn${copied ? ' detail-panel__copy-btn--copied' : ''}`}
        onClick={handleCopy}
      >
        {copied ? 'COPIED' : 'COPY MDM'}
      </button>
    </div>
  )
}

// ============================================================================
// Mode Toggle Pill
// ============================================================================

function ModeToggle({
  mode,
  encounterId,
  enabled,
  onSwitchMode,
}: {
  mode: EncounterMode
  encounterId: string
  enabled: boolean
  onSwitchMode: (encounterId: string, newMode: EncounterMode) => Promise<void>
}) {
  const toast = useToast()

  const handleSwitch = useCallback(
    async (newMode: EncounterMode) => {
      if (!enabled || newMode === mode) return
      try {
        await onSwitchMode(encounterId, newMode)
      } catch {
        toast.error('Failed to switch mode. Please try again.')
      }
    },
    [enabled, mode, encounterId, onSwitchMode, toast],
  )

  return (
    <div
      className={`detail-panel__mode-toggle${!enabled ? ' detail-panel__mode-toggle--disabled' : ''}`}
    >
      <button
        type="button"
        className={`detail-panel__mode-btn${mode === 'quick' ? ' detail-panel__mode-btn--active' : ''}`}
        onClick={() => handleSwitch('quick')}
        disabled={!enabled}
      >
        Quick
      </button>
      <button
        type="button"
        className={`detail-panel__mode-btn${mode === 'build' ? ' detail-panel__mode-btn--active' : ''}`}
        onClick={() => handleSwitch('build')}
        disabled={!enabled}
      >
        Build
      </button>
    </div>
  )
}

// ============================================================================
// Shared Panel Shell
// ============================================================================

interface PanelShellProps {
  encounter: EncounterDocument
  onClose: () => void
  isMobile: boolean
  statusLabel: string
  onSwitchMode: (encounterId: string, newMode: EncounterMode) => Promise<void>
  children: React.ReactNode
}

function DetailPanelShell({
  encounter,
  onClose,
  isMobile,
  statusLabel,
  onSwitchMode,
  children,
}: PanelShellProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const photoUrls = usePhotoUrls()
  const photo = getEncounterPhoto(encounter.chiefComplaint, encounter.encounterPhoto, photoUrls)
  const roomDisplay = formatRoomDisplay(encounter.roomNumber)
  const mode = getEncounterMode(encounter)

  // Mode toggle is enabled only for unsubmitted drafts
  const canToggleMode =
    encounter.status === 'draft' &&
    encounter.section1.submissionCount === 0 &&
    (!encounter.quickModeData || encounter.quickModeData.status === 'draft')

  const content = (
    <>
      {/* Photo banner */}
      <div className="detail-panel__photo">
        <img
          className="detail-panel__photo-img"
          src={photo}
          alt={encounter.chiefComplaint || 'Encounter'}
        />
        <button className="detail-panel__close" onClick={onClose} type="button">
          ✕
        </button>
      </div>

      {/* Header */}
      <div className="detail-panel__header">
        <div className="detail-panel__header-top">
          <div className="detail-panel__header-left">
            {roomDisplay && <span className="detail-panel__room">{roomDisplay}</span>}
            <span className="detail-panel__status">{statusLabel}</span>
          </div>
          <ModeToggle
            mode={mode}
            encounterId={encounter.id}
            enabled={canToggleMode}
            onSwitchMode={onSwitchMode}
          />
        </div>
        {encounter.chiefComplaint && (
          <div className="detail-panel__complaint">{encounter.chiefComplaint}</div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="detail-panel__content">{children}</div>
    </>
  )

  // Mobile: fixed overlay with slide animation
  if (isMobile) {
    const slideTransition = prefersReducedMotion
      ? { duration: 0 }
      : { type: 'spring' as const, damping: 25, stiffness: 200 }

    return (
      <motion.div
        className="detail-panel detail-panel--mobile"
        initial={prefersReducedMotion ? undefined : { x: '100%' }}
        animate={prefersReducedMotion ? undefined : { x: 0 }}
        exit={prefersReducedMotion ? undefined : { x: '100%' }}
        transition={slideTransition}
      >
        {content}
      </motion.div>
    )
  }

  // Desktop: plain div, parent container handles width animation
  return <div className="detail-panel">{content}</div>
}
