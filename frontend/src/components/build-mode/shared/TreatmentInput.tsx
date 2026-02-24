/**
 * TreatmentInput Component
 *
 * CDR-suggested treatment checkboxes above a free-text treatment area
 * for Section 3 of Build Mode. Shows working diagnosis for context
 * and derives treatment suggestions from completed CDR scores.
 */

import { useState, useCallback, useMemo } from 'react'
import type { EncounterDocument, WorkingDiagnosis } from '../../../types/encounter'
import { isStructuredDiagnosis } from '../../../types/encounter'
import type { CdrDefinition } from '../../../types/libraries'
import './TreatmentInput.css'

/** Convert snake_case treatment ID to human-readable label */
function formatTreatmentLabel(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bIcu\b/g, 'ICU')
    .replace(/\bIv\b/g, 'IV')
    .replace(/\bCtpa\b/g, 'CTPA')
    .replace(/\bCt\b/g, 'CT')
    .replace(/\bDoac\b/g, 'DOAC')
    .replace(/\bMl\b/g, 'mL')
    .replace(/\bKg\b/g, 'kg')
    .replace(/\bIf\b/g, 'if')
    .replace(/\bOr\b/g, 'or')
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bWith\b/g, 'with')
    .replace(/\bFor\b/g, 'for')
}

/** Extract risk level from CDR interpretation string (e.g., "Moderate: 12-16.6% risk...") */
function extractRiskLevel(interpretation: string | null | undefined): string | null {
  if (!interpretation) return null
  const colonIndex = interpretation.indexOf(':')
  if (colonIndex > 0) {
    return interpretation.substring(0, colonIndex).trim()
  }
  return null
}

/** Get display text for working diagnosis */
function getWorkingDiagnosisDisplay(wd: string | WorkingDiagnosis | undefined): string | null {
  if (!wd) return null
  if (typeof wd === 'string') return wd
  if (isStructuredDiagnosis(wd)) {
    return wd.selected || wd.custom || null
  }
  return null
}

/** A group of suggested treatments from a single CDR */
interface TreatmentGroup {
  cdrId: string
  cdrName: string
  riskLevel: string
  score: number
  treatments: Array<{ id: string; label: string }>
}

interface TreatmentInputProps {
  /** Current encounter document */
  encounter: EncounterDocument
  /** CDR library definitions (for looking up suggestedTreatments) */
  cdrLibrary: CdrDefinition[]
  /** Currently selected CDR treatment IDs */
  selectedTreatments: string[]
  /** Free-text treatment content */
  treatmentText: string
  /** Callback when treatment selections or text change */
  onUpdate: (treatments: string, cdrSuggestions: string[]) => void
  /** Whether input is disabled */
  disabled?: boolean
}

export default function TreatmentInput({
  encounter,
  cdrLibrary,
  selectedTreatments,
  treatmentText,
  onUpdate,
  disabled = false,
}: TreatmentInputProps) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selectedTreatments))

  // Derive working diagnosis display
  const diagnosisDisplay = useMemo(
    () => getWorkingDiagnosisDisplay(encounter.section2?.workingDiagnosis),
    [encounter.section2?.workingDiagnosis]
  )

  // Derive treatment suggestion groups from completed CDRs
  const treatmentGroups: TreatmentGroup[] = useMemo(() => {
    const groups: TreatmentGroup[] = []
    const tracking = encounter.cdrTracking ?? {}

    for (const [cdrId, entry] of Object.entries(tracking)) {
      if (entry.status !== 'completed' || entry.dismissed) continue
      if (entry.score == null || !entry.interpretation) continue

      const cdrDef = cdrLibrary.find((c) => c.id === cdrId)
      if (!cdrDef?.suggestedTreatments) continue

      const riskLevel = extractRiskLevel(entry.interpretation)
      if (!riskLevel) continue

      const treatmentIds = cdrDef.suggestedTreatments[riskLevel]
      if (!treatmentIds || treatmentIds.length === 0) continue

      groups.push({
        cdrId,
        cdrName: entry.name,
        riskLevel,
        score: entry.score,
        treatments: treatmentIds.map((id) => ({
          id: `${cdrId}:${id}`,
          label: formatTreatmentLabel(id),
        })),
      })
    }

    return groups
  }, [encounter.cdrTracking, cdrLibrary])

  // Handle checkbox toggle
  const handleCheckboxToggle = useCallback(
    (treatmentId: string, label: string) => {
      setLocalSelected((prev) => {
        const next = new Set(prev)
        let newText = treatmentText

        if (next.has(treatmentId)) {
          next.delete(treatmentId)
          // Remove the treatment text line
          const lines = newText.split('\n').filter((line) => line.trim() !== `- ${label}`)
          newText = lines.join('\n')
        } else {
          next.add(treatmentId)
          // Append the treatment text
          const trimmed = newText.trimEnd()
          newText = trimmed ? `${trimmed}\n- ${label}` : `- ${label}`
        }

        onUpdate(newText, Array.from(next))
        return next
      })
    },
    [treatmentText, onUpdate]
  )

  // Handle free-text change
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(e.target.value, Array.from(localSelected))
    },
    [localSelected, onUpdate]
  )

  const hasSuggestions = treatmentGroups.length > 0

  return (
    <div className="treatment-input" data-testid="treatment-input">
      {/* Working Diagnosis Context */}
      {diagnosisDisplay && (
        <div className="treatment-input__diagnosis" data-testid="treatment-diagnosis">
          <span className="treatment-input__diagnosis-label">Working Diagnosis:</span>
          <span className="treatment-input__diagnosis-value">{diagnosisDisplay}</span>
        </div>
      )}

      {/* CDR-Suggested Treatments */}
      {hasSuggestions && (
        <div className="treatment-input__suggestions" data-testid="treatment-suggestions">
          <div className="treatment-input__suggestions-header">
            <span className="treatment-input__suggestions-title">CDR-Suggested Treatments</span>
          </div>

          {treatmentGroups.map((group) => (
            <div key={group.cdrId} className="treatment-input__group" data-testid={`treatment-group-${group.cdrId}`}>
              <div className="treatment-input__group-header">
                <span className="treatment-input__group-name">{group.cdrName}</span>
                <span className={`treatment-input__group-badge treatment-input__group-badge--${group.riskLevel.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                  {group.score} - {group.riskLevel}
                </span>
              </div>
              <div className="treatment-input__checkboxes">
                {group.treatments.map((treatment) => (
                  <label
                    key={treatment.id}
                    className={`treatment-input__checkbox-label${localSelected.has(treatment.id) ? ' treatment-input__checkbox-label--checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="treatment-input__checkbox"
                      checked={localSelected.has(treatment.id)}
                      onChange={() => handleCheckboxToggle(treatment.id, treatment.label)}
                      disabled={disabled}
                    />
                    <span className="treatment-input__checkbox-text">{treatment.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free-text Treatment Area */}
      <textarea
        className="treatment-input__textarea"
        value={treatmentText}
        onChange={handleTextChange}
        placeholder={hasSuggestions
          ? 'Additional treatments, medications, and response to treatment...'
          : 'Describe treatments, medications administered, procedures performed, and patient response...'}
        disabled={disabled}
        data-testid="treatment-textarea"
        rows={hasSuggestions ? 4 : 6}
      />
    </div>
  )
}
