import { useCallback } from 'react'
import type { ReactNode } from 'react'
import AccordionSection from './AccordionSection'
import { ListInput } from './ListInput'
import { EnhancedTextarea } from './ui/EnhancedTextarea'
import type {
  BuildModeFormState,
  SectionValidationState,
} from '../types/buildMode'
import { sectionMetadata } from '../types/buildMode'
import './BuildMode.css'

interface BuildModeAccordionProps {
  formState: BuildModeFormState
  onChange: <K extends keyof BuildModeFormState>(
    section: K,
    field: keyof BuildModeFormState[K],
    value: BuildModeFormState[K][keyof BuildModeFormState[K]]
  ) => void
  expandedSections: string[]
  onToggleSection: (sectionId: string) => void
  validationState: SectionValidationState
}

// Icons for each section
const SectionIcon = ({ name }: { name: string }) => {
  const icons: Record<string, ReactNode> = {
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    list: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    clipboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    'alert-triangle': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    brain: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
        <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
        <path d="M6 18a4 4 0 0 1-1.967-.516" />
        <path d="M19.967 17.484A4 4 0 0 1 18 18" />
      </svg>
    ),
    activity: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    'log-out': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  }
  return icons[name] || icons.list
}

export default function BuildModeAccordion({
  formState,
  onChange,
  expandedSections,
  onToggleSection,
  validationState,
}: BuildModeAccordionProps) {
  // Helper to update a field
  const handleChange = useCallback(
    <K extends keyof BuildModeFormState>(
      section: K,
      field: keyof BuildModeFormState[K],
      value: BuildModeFormState[K][keyof BuildModeFormState[K]]
    ) => {
      onChange(section, field, value)
    },
    [onChange]
  )

  return (
    <div className="build-mode-container">
      <div className="build-mode-sections">
        {/* 1. Chief Complaint & Context */}
        <AccordionSection
          id="chiefComplaint"
          title={sectionMetadata[0].title}
          icon={<SectionIcon name={sectionMetadata[0].icon} />}
          isExpanded={expandedSections.includes('chiefComplaint')}
          onToggle={() => onToggleSection('chiefComplaint')}
          validationStatus={validationState.chiefComplaint}
        >
          <div className="build-mode-row">
            <div className="build-mode-field build-mode-field--narrow">
              <label className="build-mode-label">Age</label>
              <input
                type="text"
                className="build-mode-input"
                placeholder="e.g., 45"
                value={formState.chiefComplaint.age}
                onChange={(e) => handleChange('chiefComplaint', 'age', e.target.value)}
              />
            </div>
            <div className="build-mode-field build-mode-field--narrow">
              <label className="build-mode-label">Sex</label>
              <select
                className="build-mode-select"
                value={formState.chiefComplaint.sex}
                onChange={(e) => handleChange('chiefComplaint', 'sex', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="build-mode-field">
            <label className="build-mode-label">Chief Complaint</label>
            <input
              type="text"
              className="build-mode-input"
              placeholder="e.g., chest pain, shortness of breath"
              value={formState.chiefComplaint.complaint}
              onChange={(e) => handleChange('chiefComplaint', 'complaint', e.target.value)}
            />
          </div>
          <div className="build-mode-field">
            <EnhancedTextarea
              id="chiefComplaint-context"
              label="Context / HPI"
              helperText="History of present illness, onset, duration, associated symptoms"
              value={formState.chiefComplaint.context}
              onChange={(value) => handleChange('chiefComplaint', 'context', value)}
              minHeight={80}
              maxHeight={200}
              maxLength={2000}
              showCharCount
              autoGrow
            />
          </div>
        </AccordionSection>

        {/* 2. Problems Considered (Differential) */}
        <AccordionSection
          id="problemsConsidered"
          title={sectionMetadata[1].title}
          icon={<SectionIcon name={sectionMetadata[1].icon} />}
          isExpanded={expandedSections.includes('problemsConsidered')}
          onToggle={() => onToggleSection('problemsConsidered')}
          validationStatus={validationState.problemsConsidered}
        >
          <div className="build-mode-field">
            <label className="build-mode-label">
              Emergent Conditions (worst-first)
              <span className="build-mode-help">3-5 life-threatening diagnoses to consider</span>
            </label>
            <ListInput
              items={formState.problemsConsidered.emergent}
              onChange={(items: string[]) => handleChange('problemsConsidered', 'emergent', items)}
              placeholder="e.g., Acute MI, Pulmonary Embolism..."
              label="Emergent condition"
              maxItems={7}
            />
          </div>
          <div className="build-mode-divider" />
          <div className="build-mode-field">
            <label className="build-mode-label">
              Non-Emergent Conditions
              <span className="build-mode-help">3-5 less critical but relevant diagnoses</span>
            </label>
            <ListInput
              items={formState.problemsConsidered.nonEmergent}
              onChange={(items: string[]) => handleChange('problemsConsidered', 'nonEmergent', items)}
              placeholder="e.g., GERD, Musculoskeletal pain..."
              label="Non-emergent condition"
              maxItems={7}
            />
          </div>
        </AccordionSection>

        {/* 3. Data Reviewed/Ordered */}
        <AccordionSection
          id="dataReviewed"
          title={sectionMetadata[2].title}
          icon={<SectionIcon name={sectionMetadata[2].icon} />}
          isExpanded={expandedSections.includes('dataReviewed')}
          onToggle={() => onToggleSection('dataReviewed')}
          validationStatus={validationState.dataReviewed}
        >
          <div className="build-mode-field">
            <EnhancedTextarea
              id="dataReviewed-labs"
              label="Laboratory Tests"
              helperText="CBC, BMP, Troponin, BNP, D-dimer, etc."
              value={formState.dataReviewed.labs}
              onChange={(value) => handleChange('dataReviewed', 'labs', value)}
              minHeight={60}
              maxHeight={150}
              maxLength={1000}
              showCharCount
              autoGrow
            />
          </div>
          <div className="build-mode-field">
            <EnhancedTextarea
              id="dataReviewed-imaging"
              label="Imaging Studies"
              helperText="Chest X-ray, CT chest, Ultrasound, etc."
              value={formState.dataReviewed.imaging}
              onChange={(value) => handleChange('dataReviewed', 'imaging', value)}
              minHeight={60}
              maxHeight={150}
              maxLength={1000}
              showCharCount
              autoGrow
            />
          </div>
          <div className="build-mode-field">
            <label className="build-mode-label">EKG / Rhythm Strips</label>
            <input
              type="text"
              className="build-mode-input"
              placeholder="Interpretation or 'Not performed'"
              value={formState.dataReviewed.ekg}
              onChange={(e) => handleChange('dataReviewed', 'ekg', e.target.value)}
            />
          </div>
          <div className="build-mode-row">
            <div className="build-mode-field">
              <label className="build-mode-label">External Records</label>
              <input
                type="text"
                className="build-mode-input"
                placeholder="Prior records reviewed, source..."
                value={formState.dataReviewed.externalRecords}
                onChange={(e) => handleChange('dataReviewed', 'externalRecords', e.target.value)}
              />
            </div>
            <div className="build-mode-field">
              <label className="build-mode-label">Independent Historian</label>
              <input
                type="text"
                className="build-mode-input"
                placeholder="EMS, family, facility staff..."
                value={formState.dataReviewed.independentHistorian}
                onChange={(e) => handleChange('dataReviewed', 'independentHistorian', e.target.value)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* 4. Risk Assessment */}
        <AccordionSection
          id="riskAssessment"
          title={sectionMetadata[3].title}
          icon={<SectionIcon name={sectionMetadata[3].icon} />}
          isExpanded={expandedSections.includes('riskAssessment')}
          onToggle={() => onToggleSection('riskAssessment')}
          validationStatus={validationState.riskAssessment}
        >
          <div className="build-mode-field">
            <label className="build-mode-label">Highest Risk Element</label>
            <input
              type="text"
              className="build-mode-input"
              placeholder="Specific intervention/decision conferring highest risk"
              value={formState.riskAssessment.highestRiskElement}
              onChange={(e) => handleChange('riskAssessment', 'highestRiskElement', e.target.value)}
            />
          </div>
          <div className="build-mode-row">
            <div className="build-mode-field">
              <EnhancedTextarea
                id="riskAssessment-patientFactors"
                label="Patient Factors"
                helperText="Age, comorbidities, social determinants"
                value={formState.riskAssessment.patientFactors}
                onChange={(value) => handleChange('riskAssessment', 'patientFactors', value)}
                minHeight={60}
                maxHeight={120}
                maxLength={500}
                autoGrow
              />
            </div>
            <div className="build-mode-field">
              <EnhancedTextarea
                id="riskAssessment-diagnosticRisks"
                label="Diagnostic Risks"
                helperText="Radiation, contrast, procedures"
                value={formState.riskAssessment.diagnosticRisks}
                onChange={(value) => handleChange('riskAssessment', 'diagnosticRisks', value)}
                minHeight={60}
                maxHeight={120}
                maxLength={500}
                autoGrow
              />
            </div>
          </div>
          <div className="build-mode-row">
            <div className="build-mode-field">
              <EnhancedTextarea
                id="riskAssessment-treatmentRisks"
                label="Treatment Risks"
                helperText="Medications, interventions"
                value={formState.riskAssessment.treatmentRisks}
                onChange={(value) => handleChange('riskAssessment', 'treatmentRisks', value)}
                minHeight={60}
                maxHeight={120}
                maxLength={500}
                autoGrow
              />
            </div>
            <div className="build-mode-field">
              <EnhancedTextarea
                id="riskAssessment-dispositionRisks"
                label="Disposition Risks"
                helperText="Risks if discharged with uncertainty"
                value={formState.riskAssessment.dispositionRisks}
                onChange={(value) => handleChange('riskAssessment', 'dispositionRisks', value)}
                minHeight={60}
                maxHeight={120}
                maxLength={500}
                autoGrow
              />
            </div>
          </div>
        </AccordionSection>

        {/* 5. Clinical Reasoning */}
        <AccordionSection
          id="clinicalReasoning"
          title={sectionMetadata[4].title}
          icon={<SectionIcon name={sectionMetadata[4].icon} />}
          isExpanded={expandedSections.includes('clinicalReasoning')}
          onToggle={() => onToggleSection('clinicalReasoning')}
          validationStatus={validationState.clinicalReasoning}
        >
          <div className="build-mode-field">
            <EnhancedTextarea
              id="clinicalReasoning-evaluationApproach"
              label="Evaluation Approach"
              helperText="Systematic evaluation strategy, clinical decision rules used (HEART, NEXUS, Wells, etc.)"
              value={formState.clinicalReasoning.evaluationApproach}
              onChange={(value) => handleChange('clinicalReasoning', 'evaluationApproach', value)}
              minHeight={80}
              maxHeight={200}
              maxLength={1500}
              showCharCount
              autoGrow
            />
          </div>
          <div className="build-mode-field">
            <EnhancedTextarea
              id="clinicalReasoning-keyDecisionPoints"
              label="Key Decision Points"
              helperText="Critical thinking demonstrated, why certain diagnoses were ruled out"
              value={formState.clinicalReasoning.keyDecisionPoints}
              onChange={(value) => handleChange('clinicalReasoning', 'keyDecisionPoints', value)}
              minHeight={80}
              maxHeight={200}
              maxLength={1500}
              showCharCount
              autoGrow
            />
          </div>
          <div className="build-mode-field">
            <label className="build-mode-label">Working Diagnosis</label>
            <input
              type="text"
              className="build-mode-input"
              placeholder="Most likely diagnosis based on ED evaluation"
              value={formState.clinicalReasoning.workingDiagnosis}
              onChange={(e) => handleChange('clinicalReasoning', 'workingDiagnosis', e.target.value)}
            />
          </div>
        </AccordionSection>

        {/* 6. Treatment & Procedures */}
        <AccordionSection
          id="treatmentProcedures"
          title={sectionMetadata[5].title}
          icon={<SectionIcon name={sectionMetadata[5].icon} />}
          isExpanded={expandedSections.includes('treatmentProcedures')}
          onToggle={() => onToggleSection('treatmentProcedures')}
          validationStatus={validationState.treatmentProcedures}
        >
          <div className="build-mode-field">
            <EnhancedTextarea
              id="treatmentProcedures-medications"
              label="Medications Administered"
              helperText="Drug, dose, route, indication (or 'see MAR')"
              value={formState.treatmentProcedures.medications}
              onChange={(value) => handleChange('treatmentProcedures', 'medications', value)}
              minHeight={80}
              maxHeight={150}
              maxLength={1000}
              autoGrow
            />
          </div>
          <div className="build-mode-field">
            <EnhancedTextarea
              id="treatmentProcedures-procedures"
              label="Procedures Performed"
              helperText="Type, indication, outcome (leave empty if none)"
              value={formState.treatmentProcedures.procedures}
              onChange={(value) => handleChange('treatmentProcedures', 'procedures', value)}
              minHeight={80}
              maxHeight={150}
              maxLength={1000}
              autoGrow
            />
          </div>
          <div className="build-mode-field">
            <EnhancedTextarea
              id="treatmentProcedures-rationale"
              label="Treatment Rationale"
              helperText="Why these interventions were chosen, patient consent"
              value={formState.treatmentProcedures.rationale}
              onChange={(value) => handleChange('treatmentProcedures', 'rationale', value)}
              minHeight={60}
              maxHeight={120}
              maxLength={500}
              autoGrow
            />
          </div>
        </AccordionSection>

        {/* 7. Disposition */}
        <AccordionSection
          id="disposition"
          title={sectionMetadata[6].title}
          icon={<SectionIcon name={sectionMetadata[6].icon} />}
          isExpanded={expandedSections.includes('disposition')}
          onToggle={() => onToggleSection('disposition')}
          validationStatus={validationState.disposition}
        >
          <div className="build-mode-row">
            <div className="build-mode-field build-mode-field--medium">
              <label className="build-mode-label">Disposition Decision</label>
              <select
                className="build-mode-select"
                value={formState.disposition.decision}
                onChange={(e) => handleChange('disposition', 'decision', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="discharge">Discharge Home</option>
                <option value="admit">Admit</option>
                <option value="observation">Observation</option>
                <option value="transfer">Transfer</option>
                <option value="ama">AMA</option>
              </select>
            </div>
            <div className="build-mode-field build-mode-field--medium">
              <label className="build-mode-label">Level of Care</label>
              <select
                className="build-mode-select"
                value={formState.disposition.levelOfCare}
                onChange={(e) => handleChange('disposition', 'levelOfCare', e.target.value)}
              >
                <option value="">Select if admitted...</option>
                <option value="floor">Floor</option>
                <option value="stepdown">Stepdown</option>
                <option value="icu">ICU</option>
                <option value="telemetry">Telemetry</option>
              </select>
            </div>
          </div>
          <div className="build-mode-field">
            <EnhancedTextarea
              id="disposition-rationale"
              label="Disposition Rationale"
              helperText="Clinical reasoning for disposition choice"
              value={formState.disposition.rationale}
              onChange={(value) => handleChange('disposition', 'rationale', value)}
              minHeight={60}
              maxHeight={120}
              maxLength={500}
              autoGrow
            />
          </div>
          <div className="build-mode-divider" />
          <div className="build-mode-field">
            <EnhancedTextarea
              id="disposition-dischargeInstructions"
              label="Discharge Instructions (if applicable)"
              helperText="Diagnoses explained, medications prescribed, incidental findings"
              value={formState.disposition.dischargeInstructions}
              onChange={(value) => handleChange('disposition', 'dischargeInstructions', value)}
              minHeight={80}
              maxHeight={200}
              maxLength={1500}
              showCharCount
              autoGrow
            />
          </div>
          <div className="build-mode-row">
            <div className="build-mode-field">
              <label className="build-mode-label">Follow-up</label>
              <input
                type="text"
                className="build-mode-input"
                placeholder="Who and when to follow up..."
                value={formState.disposition.followUp}
                onChange={(e) => handleChange('disposition', 'followUp', e.target.value)}
              />
            </div>
            <div className="build-mode-field">
              <label className="build-mode-label">Return Precautions</label>
              <input
                type="text"
                className="build-mode-input"
                placeholder="Worsening symptoms, specific warnings..."
                value={formState.disposition.returnPrecautions}
                onChange={(e) => handleChange('disposition', 'returnPrecautions', e.target.value)}
              />
            </div>
          </div>
        </AccordionSection>
      </div>
    </div>
  )
}
