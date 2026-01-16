import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DictationGuide from '../components/DictationGuide'
import ConfirmationModal from '../components/ConfirmationModal'
import BuildModeToggle from '../components/BuildModeToggle'
import BuildModeAccordion from '../components/BuildModeAccordion'
import GuideSlideOver from '../components/GuideSlideOver'
import { whoAmI, parseNarrative } from '../lib/api'
import { useAuthToken } from '../lib/firebase'
import { useToast } from '../contexts/ToastContext'
import type {
  BuildModeFormState,
  SectionValidationState,
} from '../types/buildMode'
import { initialBuildModeFormState } from '../types/buildMode'
import './Compose.css'

// Simple placeholder ghost text for Simple Mode
const SIMPLE_MODE_PLACEHOLDER = `Dictate or type your description of the patient encounter here. Use your natural narrative style (e.g., HPI, ROS, PE, Differential, Workup, Interpretation of results, Impression, and Plan). Best for rapid compositions and simple cases.

Example: 45-year-old male presents with chest pain x 2 hours. Pain is substernal, radiating to left arm, associated with diaphoresis. History of HTN, DM. Currently taking metformin and lisinopril...`

// Aggregate Build Mode form into narrative text
function aggregateFormToNarrative(form: BuildModeFormState): string {
  const parts: string[] = []

  // Chief Complaint
  if (form.chiefComplaint.complaint || form.chiefComplaint.context) {
    const demo = [form.chiefComplaint.age, form.chiefComplaint.sex].filter(Boolean).join(' ')
    const prefix = demo ? `${demo} presents with ` : ''
    parts.push(`${prefix}${form.chiefComplaint.complaint}. ${form.chiefComplaint.context}`.trim())
  }

  // Problems Considered
  const emergent = form.problemsConsidered.emergent.filter((s) => s.trim())
  const nonEmergent = form.problemsConsidered.nonEmergent.filter((s) => s.trim())
  if (emergent.length > 0) {
    parts.push(`Emergent conditions considered: ${emergent.join(', ')}.`)
  }
  if (nonEmergent.length > 0) {
    parts.push(`Non-emergent conditions considered: ${nonEmergent.join(', ')}.`)
  }

  // Data Reviewed
  const dataItems: string[] = []
  if (form.dataReviewed.labs) dataItems.push(`Labs: ${form.dataReviewed.labs}`)
  if (form.dataReviewed.imaging) dataItems.push(`Imaging: ${form.dataReviewed.imaging}`)
  if (form.dataReviewed.ekg) dataItems.push(`EKG: ${form.dataReviewed.ekg}`)
  if (form.dataReviewed.externalRecords) dataItems.push(`External records: ${form.dataReviewed.externalRecords}`)
  if (form.dataReviewed.independentHistorian) dataItems.push(`Independent historian: ${form.dataReviewed.independentHistorian}`)
  if (dataItems.length > 0) {
    parts.push(`Data reviewed: ${dataItems.join('. ')}.`)
  }

  // Risk Assessment
  const riskItems: string[] = []
  if (form.riskAssessment.highestRiskElement) riskItems.push(`Highest risk element: ${form.riskAssessment.highestRiskElement}`)
  if (form.riskAssessment.patientFactors) riskItems.push(`Patient factors: ${form.riskAssessment.patientFactors}`)
  if (form.riskAssessment.diagnosticRisks) riskItems.push(`Diagnostic risks: ${form.riskAssessment.diagnosticRisks}`)
  if (form.riskAssessment.treatmentRisks) riskItems.push(`Treatment risks: ${form.riskAssessment.treatmentRisks}`)
  if (form.riskAssessment.dispositionRisks) riskItems.push(`Disposition risks: ${form.riskAssessment.dispositionRisks}`)
  if (riskItems.length > 0) {
    parts.push(`Risk assessment: ${riskItems.join('. ')}.`)
  }

  // Clinical Reasoning
  const reasoningItems: string[] = []
  if (form.clinicalReasoning.evaluationApproach) reasoningItems.push(form.clinicalReasoning.evaluationApproach)
  if (form.clinicalReasoning.keyDecisionPoints) reasoningItems.push(form.clinicalReasoning.keyDecisionPoints)
  if (form.clinicalReasoning.workingDiagnosis) reasoningItems.push(`Working diagnosis: ${form.clinicalReasoning.workingDiagnosis}`)
  if (reasoningItems.length > 0) {
    parts.push(`Clinical reasoning: ${reasoningItems.join('. ')}.`)
  }

  // Treatment & Procedures
  const treatmentItems: string[] = []
  if (form.treatmentProcedures.medications) treatmentItems.push(`Medications: ${form.treatmentProcedures.medications}`)
  if (form.treatmentProcedures.procedures) treatmentItems.push(`Procedures: ${form.treatmentProcedures.procedures}`)
  if (form.treatmentProcedures.rationale) treatmentItems.push(`Rationale: ${form.treatmentProcedures.rationale}`)
  if (treatmentItems.length > 0) {
    parts.push(`Treatment: ${treatmentItems.join('. ')}.`)
  }

  // Disposition
  const dispItems: string[] = []
  if (form.disposition.decision) dispItems.push(`Disposition: ${form.disposition.decision}`)
  if (form.disposition.levelOfCare) dispItems.push(`Level of care: ${form.disposition.levelOfCare}`)
  if (form.disposition.rationale) dispItems.push(`Rationale: ${form.disposition.rationale}`)
  if (form.disposition.dischargeInstructions) dispItems.push(`Discharge instructions: ${form.disposition.dischargeInstructions}`)
  if (form.disposition.followUp) dispItems.push(`Follow-up: ${form.disposition.followUp}`)
  if (form.disposition.returnPrecautions) dispItems.push(`Return precautions: ${form.disposition.returnPrecautions}`)
  if (dispItems.length > 0) {
    parts.push(dispItems.join('. ') + '.')
  }

  return parts.join('\n\n')
}

// Validate section completeness
function validateSections(form: BuildModeFormState): SectionValidationState {
  const hasContent = (s: string) => s.trim().length > 0
  const hasListContent = (arr: string[]) => arr.some((s) => s.trim().length > 0)

  return {
    chiefComplaint: !hasContent(form.chiefComplaint.complaint)
      ? 'empty'
      : !hasContent(form.chiefComplaint.context) || !hasContent(form.chiefComplaint.age)
        ? 'sparse'
        : 'complete',
    problemsConsidered: !hasListContent(form.problemsConsidered.emergent) && !hasListContent(form.problemsConsidered.nonEmergent)
      ? 'empty'
      : form.problemsConsidered.emergent.filter((s) => s.trim()).length < 3
        ? 'sparse'
        : 'complete',
    dataReviewed: !hasContent(form.dataReviewed.labs) && !hasContent(form.dataReviewed.imaging)
      ? 'empty'
      : !hasContent(form.dataReviewed.labs) || !hasContent(form.dataReviewed.imaging)
        ? 'sparse'
        : 'complete',
    riskAssessment: !hasContent(form.riskAssessment.highestRiskElement)
      ? 'empty'
      : !hasContent(form.riskAssessment.patientFactors)
        ? 'sparse'
        : 'complete',
    clinicalReasoning: !hasContent(form.clinicalReasoning.evaluationApproach)
      ? 'empty'
      : !hasContent(form.clinicalReasoning.workingDiagnosis)
        ? 'sparse'
        : 'complete',
    treatmentProcedures: !hasContent(form.treatmentProcedures.medications) && !hasContent(form.treatmentProcedures.procedures)
      ? 'empty'
      : 'complete',
    disposition: !hasContent(form.disposition.decision)
      ? 'empty'
      : !hasContent(form.disposition.rationale)
        ? 'sparse'
        : 'complete',
  }
}

export default function Compose() {
  // Simple mode state
  const [text, setText] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Build mode state
  const [buildModeEnabled, setBuildModeEnabled] = useState(false)
  const [formState, setFormState] = useState<BuildModeFormState>(initialBuildModeFormState)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [guideOpen, setGuideOpen] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [dictationGuideVisible, setDictationGuideVisible] = useState(false)

  const navigate = useNavigate()
  const idToken = useAuthToken()
  const { error: showError, warning: showWarning } = useToast()

  // Fetch remaining quota
  useEffect(() => {
    const run = async () => {
      if (!idToken) return
      try {
        const res = await whoAmI(idToken)
        setRemaining(res.remaining)
      } catch {
        setRemaining(null)
      }
    }
    run()
  }, [idToken])

  // Handle form field changes
  const handleFormChange = useCallback(
    <K extends keyof BuildModeFormState>(
      section: K,
      field: keyof BuildModeFormState[K],
      value: BuildModeFormState[K][keyof BuildModeFormState[K]]
    ) => {
      setFormState((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }))
    },
    []
  )

  // Toggle accordion sections
  const handleToggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }, [])

  // Handle mode toggle with migration
  const handleModeToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled && text.trim().length > 0 && idToken) {
        // Switching to Build Mode with existing text - trigger migration
        setIsMigrating(true)
        try {
          const result = await parseNarrative(text, idToken)
          if (result.ok && result.parsed) {
            // Merge parsed data into form state
            setFormState((prev) => {
              const merged = { ...prev }

              if (result.parsed.chiefComplaint) {
                merged.chiefComplaint = { ...prev.chiefComplaint, ...result.parsed.chiefComplaint }
              }
              if (result.parsed.problemsConsidered) {
                merged.problemsConsidered = {
                  emergent: result.parsed.problemsConsidered.emergent?.length
                    ? result.parsed.problemsConsidered.emergent
                    : prev.problemsConsidered.emergent,
                  nonEmergent: result.parsed.problemsConsidered.nonEmergent?.length
                    ? result.parsed.problemsConsidered.nonEmergent
                    : prev.problemsConsidered.nonEmergent,
                }
              }
              if (result.parsed.dataReviewed) {
                merged.dataReviewed = { ...prev.dataReviewed, ...result.parsed.dataReviewed }
              }
              if (result.parsed.riskAssessment) {
                merged.riskAssessment = { ...prev.riskAssessment, ...result.parsed.riskAssessment }
              }
              if (result.parsed.clinicalReasoning) {
                merged.clinicalReasoning = { ...prev.clinicalReasoning, ...result.parsed.clinicalReasoning }
              }
              if (result.parsed.treatmentProcedures) {
                merged.treatmentProcedures = { ...prev.treatmentProcedures, ...result.parsed.treatmentProcedures }
              }
              if (result.parsed.disposition) {
                merged.disposition = { ...prev.disposition, ...result.parsed.disposition }
              }

              return merged
            })

            // Show confidence warning if low
            if (result.confidence < 0.7) {
              showWarning('Some fields may need review - parsing confidence was low')
            }

            // Expand all sections that have content
            setExpandedSections([
              'chiefComplaint',
              'problemsConsidered',
              'dataReviewed',
              'riskAssessment',
              'clinicalReasoning',
              'treatmentProcedures',
              'disposition',
            ])
          }
        } catch (err) {
          showError('Failed to parse narrative. Please fill in fields manually.')
          console.error('Parse error:', err)
        } finally {
          setIsMigrating(false)
        }
      } else if (!enabled) {
        // Switching to Simple Mode - aggregate form to text
        const aggregated = aggregateFormToNarrative(formState)
        if (aggregated.trim()) {
          setText(aggregated)
        }
      }

      setBuildModeEnabled(enabled)
    },
    [text, idToken, formState, showError, showWarning]
  )

  // Calculate validation state
  const validationState = validateSections(formState)

  // Get current text for submission
  const getCurrentText = useCallback(() => {
    if (buildModeEnabled) {
      return aggregateFormToNarrative(formState)
    }
    return text
  }, [buildModeEnabled, formState, text])

  // Check if can submit
  const currentText = getCurrentText()
  const canSubmit = currentText.trim().length > 0 && (remaining ?? 1) > 0

  const handleSubmitClick = () => {
    if (canSubmit) {
      setShowModal(true)
    }
  }

  const handleConfirmSubmit = () => {
    setShowModal(false)
    navigate('/preflight', { state: { text: currentText, skipConfirmation: true } })
  }

  const getQuotaStatus = () => {
    if (remaining === null) return null
    if (remaining === 0) return 'danger'
    if (remaining <= 3) return 'warning'
    return null
  }

  const quotaStatus = getQuotaStatus()

  return (
    <>
      <div className="compose-page">
        <header className="compose-header">
          <h1 className="compose-title">Encounter Narrative</h1>
          <BuildModeToggle
            enabled={buildModeEnabled}
            onChange={handleModeToggle}
            onInfoClick={() => setGuideOpen(true)}
            disabled={isMigrating}
          />
        </header>

        {/* Shift-Based Build Mode Entry Point */}
        <Link to="/build" className="build-mode-entry">
          <div className="build-mode-entry__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div className="build-mode-entry__content">
            <span className="build-mode-entry__title">Shift Mode</span>
            <span className="build-mode-entry__description">Track multiple encounters through your shift</span>
          </div>
          <svg className="build-mode-entry__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {/* Simple Mode - Narrative panel with slide-from-behind guide */}
        {!buildModeEnabled && (
          <div className="narrative-panel">
            {/* Tab - appears attached to guide, hangs off left edge of narrative box */}
            <button
              type="button"
              className={`narrative-panel__tab ${dictationGuideVisible ? 'narrative-panel__tab--open' : ''}`}
              onClick={() => setDictationGuideVisible(!dictationGuideVisible)}
              aria-expanded={dictationGuideVisible}
              aria-label={dictationGuideVisible ? 'Close guide' : 'Open guide'}
            >
              <svg className="narrative-panel__tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </button>

            {/* Guide panel - slides out from behind textarea */}
            <aside className={`narrative-panel__guide ${dictationGuideVisible ? 'narrative-panel__guide--open' : ''}`}>
              <DictationGuide />
            </aside>

            {/* Textarea - positioned IN FRONT */}
            <textarea
              className="narrative-panel__textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SIMPLE_MODE_PLACEHOLDER}
              disabled={isMigrating}
            />

            {/* Migration loading overlay */}
            {isMigrating && (
              <div className="compose-migration-overlay">
                <div className="compose-migration-spinner" />
                <span>Parsing narrative...</span>
              </div>
            )}
          </div>
        )}

        {/* Build Mode */}
        {buildModeEnabled && (
          <div className="compose-editor">
            {/* Migration loading overlay */}
            {isMigrating && (
              <div className="compose-migration-overlay">
                <div className="compose-migration-spinner" />
                <span>Parsing narrative...</span>
              </div>
            )}

            <BuildModeAccordion
              formState={formState}
              onChange={handleFormChange}
              expandedSections={expandedSections}
              onToggleSection={handleToggleSection}
              validationState={validationState}
            />
          </div>
        )}

        {/* Actions bar - shared between modes */}
        <div className="compose-actions">
          <button
            className="compose-submit"
            disabled={!canSubmit || isMigrating}
            title={remaining === 0 ? 'No remaining quota this month' : ''}
            onClick={handleSubmitClick}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Generate MDM
          </button>

          {remaining !== null && (
            <span className={`compose-quota ${quotaStatus ? `compose-quota--${quotaStatus}` : ''}`}>
              <svg className="compose-quota-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {remaining} generations remaining
            </span>
          )}

          <span className="compose-char-count">
            {currentText.length.toLocaleString()} characters
          </span>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmSubmit}
        text={currentText}
      />

      <GuideSlideOver
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  )
}
