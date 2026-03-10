import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useEncounter } from '../../hooks/useEncounter'
import { useQuickEncounter } from '../../hooks/useQuickEncounter'
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { getEncounterMode, formatRoomDisplay } from '../../types/encounter'
import { getEncounterPhoto } from '../../lib/photoMapper'
import type { EncounterDocument, SectionNumber } from '../../types/encounter'
import NarrativeToolbar from './NarrativeToolbar'
import './DetailPanel.css'

interface DetailPanelProps {
  encounter: EncounterDocument
  onClose: () => void
}

const SECTION_LABELS: Record<SectionNumber, string> = {
  1: 'HISTORY, PHYSICAL & FIRST IMPRESSION',
  2: 'WORKUP & RESULTS',
  3: 'TREATMENT & DISPOSITION',
}

export default function DetailPanel({ encounter, onClose }: DetailPanelProps) {
  const isMobile = useIsMobile()
  const prefersReducedMotion = usePrefersReducedMotion()
  const mode = getEncounterMode(encounter)

  if (mode === 'quick') {
    return (
      <QuickDetailContent
        encounter={encounter}
        onClose={onClose}
        isMobile={isMobile}
        prefersReducedMotion={prefersReducedMotion}
      />
    )
  }

  return (
    <BuildDetailContent
      encounter={encounter}
      onClose={onClose}
      isMobile={isMobile}
      prefersReducedMotion={prefersReducedMotion}
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
  prefersReducedMotion: boolean
}

function BuildDetailContent({
  encounter: initialEncounter,
  onClose,
  isMobile,
  prefersReducedMotion,
}: DetailContentProps) {
  const { encounter, updateSectionContent, submitSection, isSubmitting } = useEncounter(
    initialEncounter.id,
  )

  const [isDictating, setIsDictating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentEncounter = encounter || initialEncounter
  const currentSection = currentEncounter.currentSection as SectionNumber
  const sectionKey = `section${currentSection}` as 'section1' | 'section2' | 'section3'
  const sectionData = currentEncounter[sectionKey]
  const hasOutput = !!sectionData.llmResponse

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

  // Get status label
  const statusLabel =
    currentEncounter.status === 'finalized'
      ? 'COMPLETE'
      : currentEncounter.status === 'section2_done'
        ? 'S2 DONE'
        : currentEncounter.status === 'section1_done'
          ? 'S1 DONE'
          : 'DRAFT'

  return (
    <DetailPanelShell
      encounter={currentEncounter}
      onClose={onClose}
      isMobile={isMobile}
      prefersReducedMotion={prefersReducedMotion}
      statusLabel={statusLabel}
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
      {hasOutput && currentSection === 1 && sectionData.llmResponse && (
        <div className="detail-panel__output">
          <div className="detail-panel__output-label">Differential Diagnosis</div>
          <div className="detail-panel__differential">
            {'differential' in sectionData.llmResponse &&
              Array.isArray(sectionData.llmResponse.differential) &&
              sectionData.llmResponse.differential.map(
                (item: { diagnosis: string; urgency: string; reasoning: string }, idx: number) => (
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
                ),
              )}
          </div>
        </div>
      )}

      {hasOutput && currentSection === 2 && sectionData.llmResponse && (
        <div className="detail-panel__output">
          <div className="detail-panel__output-label">MDM Preview</div>
          <div className="detail-panel__mdm-output">
            {'mdmPreview' in sectionData.llmResponse &&
              sectionData.llmResponse.mdmPreview &&
              typeof sectionData.llmResponse.mdmPreview === 'object' &&
              'reasoning' in sectionData.llmResponse.mdmPreview &&
              String(sectionData.llmResponse.mdmPreview.reasoning)}
          </div>
        </div>
      )}

      {hasOutput && currentSection === 3 && sectionData.llmResponse && (
        <div className="detail-panel__output">
          <div className="detail-panel__output-label">Final MDM</div>
          <div className="detail-panel__mdm-output">
            {'finalMdm' in sectionData.llmResponse &&
              sectionData.llmResponse.finalMdm &&
              typeof sectionData.llmResponse.finalMdm === 'object' &&
              'text' in sectionData.llmResponse.finalMdm &&
              String(sectionData.llmResponse.finalMdm.text)}
          </div>
        </div>
      )}

      {/* Wave 2 Agent 6 panels go here */}
      <div className="detail-panel__intel-placeholder" />
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
  prefersReducedMotion,
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

  // Status label
  const statusLabel = quickStatus ? quickStatus.toUpperCase() : 'DRAFT'

  return (
    <DetailPanelShell
      encounter={initialEncounter}
      onClose={onClose}
      isMobile={isMobile}
      prefersReducedMotion={prefersReducedMotion}
      statusLabel={statusLabel}
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
        </div>
      )}

      {isComplete && !mdmOutput && <span className="detail-panel__complete-badge">✓ COMPLETE</span>}

      {/* Wave 2 Agent 6 panels go here */}
      <div className="detail-panel__intel-placeholder" />
    </DetailPanelShell>
  )
}

// ============================================================================
// Shared Panel Shell (backdrop, photo, header, animation)
// ============================================================================

interface PanelShellProps {
  encounter: EncounterDocument
  onClose: () => void
  isMobile: boolean
  prefersReducedMotion: boolean
  statusLabel: string
  children: React.ReactNode
}

function DetailPanelShell({
  encounter,
  onClose,
  isMobile,
  prefersReducedMotion,
  statusLabel,
  children,
}: PanelShellProps) {
  const photo = getEncounterPhoto(encounter.chiefComplaint)
  const roomDisplay = formatRoomDisplay(encounter.roomNumber)

  const panelWidth = isMobile ? '100%' : 600

  const slideTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 25, stiffness: 200 }

  const fadeTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }

  return (
    <>
      {/* Backdrop */}
      {!isMobile && (
        <motion.div
          className="detail-panel__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
          onClick={onClose}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Slide-out panel */}
      <motion.div
        className={`detail-panel${isMobile ? ' detail-panel--mobile' : ''}`}
        initial={prefersReducedMotion ? undefined : { x: panelWidth }}
        animate={prefersReducedMotion ? undefined : { x: 0 }}
        exit={prefersReducedMotion ? undefined : { x: panelWidth }}
        transition={slideTransition}
        style={isMobile ? { width: '100%' } : { width: 600 }}
      >
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
              <span className="detail-panel__room">{roomDisplay}</span>
            </div>
            <span className="detail-panel__status">{statusLabel}</span>
          </div>
          {encounter.chiefComplaint && (
            <div className="detail-panel__complaint">{encounter.chiefComplaint}</div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="detail-panel__content">{children}</div>
      </motion.div>
    </>
  )
}
