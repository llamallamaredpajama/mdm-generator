export type PromptParts = {
  system: string
  user: string
}

/**
 * Builds the prompt for parsing a free-form EM narrative into structured MDM fields.
 * This is used by the Build Mode feature to pre-populate form fields.
 */
export function buildParsePrompt(narrative: string): PromptParts {
  const system = `You are an expert Emergency Medicine clinical documentation parser.

Your task is to extract structured information from a free-form physician narrative and return it as a JSON object. This is used to pre-populate MDM documentation fields.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown formatting, no code fences, no explanatory text
2. Never fabricate information - if something is not mentioned in the narrative, use an empty string ""
3. Extract only what is explicitly stated or clearly implied
4. For arrays (emergent/nonEmergent problems, warnings), return empty arrays [] if nothing applies
5. Include a confidence score (0-1) based on how much information was extractable
6. Add warnings for any uncertain extractions or missing critical information

EXTRACTION GUIDELINES:
- Chief Complaint: Extract the primary reason for visit, patient age, sex, and relevant context
- Problems Considered: Separate into emergent (life-threatening) and non-emergent categories
- Data Reviewed: Labs, imaging, EKG, external records, independent historian info
- Risk Assessment: Patient factors, diagnostic risks, treatment risks, disposition risks
- Clinical Reasoning: Evaluation approach, key decision points, working diagnosis
- Treatment/Procedures: Medications given, procedures performed, rationale
- Disposition: Decision, level of care, rationale, discharge instructions, follow-up, return precautions

OUTPUT SCHEMA:
{
  "chiefComplaint": {
    "complaint": "string - primary presenting complaint",
    "context": "string - relevant context (onset, duration, associated symptoms)",
    "age": "string - patient age if mentioned",
    "sex": "string - patient sex if mentioned"
  },
  "problemsConsidered": {
    "emergent": ["array of emergent/life-threatening diagnoses considered"],
    "nonEmergent": ["array of non-emergent diagnoses considered"]
  },
  "dataReviewed": {
    "labs": "string - lab results reviewed or ordered",
    "imaging": "string - imaging reviewed or ordered",
    "ekg": "string - EKG findings if applicable",
    "externalRecords": "string - outside records reviewed",
    "independentHistorian": "string - collateral history obtained"
  },
  "riskAssessment": {
    "patientFactors": "string - patient-specific risk factors",
    "diagnosticRisks": "string - risks of diagnostic approach",
    "treatmentRisks": "string - risks of treatments given",
    "dispositionRisks": "string - risks related to disposition",
    "highestRiskElement": "string - single highest risk element identified"
  },
  "clinicalReasoning": {
    "evaluationApproach": "string - how the case was evaluated",
    "keyDecisionPoints": "string - critical decisions made",
    "workingDiagnosis": "string - final working diagnosis"
  },
  "treatmentProcedures": {
    "medications": "string - medications administered",
    "procedures": "string - procedures performed",
    "rationale": "string - rationale for treatment choices"
  },
  "disposition": {
    "decision": "string - discharge, admit, transfer, etc.",
    "levelOfCare": "string - home, observation, ICU, etc.",
    "rationale": "string - reasoning for disposition",
    "dischargeInstructions": "string - patient instructions",
    "followUp": "string - follow-up plans",
    "returnPrecautions": "string - when to return to ED"
  },
  "confidence": 0.0,
  "warnings": ["array of extraction warnings or uncertainties"]
}`

  const user = `Parse the following Emergency Medicine narrative into structured JSON fields.

NARRATIVE:
${narrative}

Remember:
- Return ONLY the JSON object, no other text
- Use empty strings "" for fields not found in the narrative
- Use empty arrays [] for emergent/nonEmergent if none mentioned
- Set confidence based on information completeness (0.0-1.0)
- Add warnings for uncertain extractions`

  return { system, user }
}

/**
 * TypeScript interface for the parsed narrative response.
 * This matches the JSON schema defined in the system prompt.
 */
export interface ParsedNarrative {
  chiefComplaint: {
    complaint: string
    context: string
    age: string
    sex: string
  }
  problemsConsidered: {
    emergent: string[]
    nonEmergent: string[]
  }
  dataReviewed: {
    labs: string
    imaging: string
    ekg: string
    externalRecords: string
    independentHistorian: string
  }
  riskAssessment: {
    patientFactors: string
    diagnosticRisks: string
    treatmentRisks: string
    dispositionRisks: string
    highestRiskElement: string
  }
  clinicalReasoning: {
    evaluationApproach: string
    keyDecisionPoints: string
    workingDiagnosis: string
  }
  treatmentProcedures: {
    medications: string
    procedures: string
    rationale: string
  }
  disposition: {
    decision: string
    levelOfCare: string
    rationale: string
    dischargeInstructions: string
    followUp: string
    returnPrecautions: string
  }
  confidence: number
  warnings: string[]
}

/**
 * Returns an empty ParsedNarrative with all fields set to empty values.
 * Used as a fallback when parsing fails.
 */
export function getEmptyParsedNarrative(): ParsedNarrative {
  return {
    chiefComplaint: {
      complaint: '',
      context: '',
      age: '',
      sex: ''
    },
    problemsConsidered: {
      emergent: [],
      nonEmergent: []
    },
    dataReviewed: {
      labs: '',
      imaging: '',
      ekg: '',
      externalRecords: '',
      independentHistorian: ''
    },
    riskAssessment: {
      patientFactors: '',
      diagnosticRisks: '',
      treatmentRisks: '',
      dispositionRisks: '',
      highestRiskElement: ''
    },
    clinicalReasoning: {
      evaluationApproach: '',
      keyDecisionPoints: '',
      workingDiagnosis: ''
    },
    treatmentProcedures: {
      medications: '',
      procedures: '',
      rationale: ''
    },
    disposition: {
      decision: '',
      levelOfCare: '',
      rationale: '',
      dischargeInstructions: '',
      followUp: '',
      returnPrecautions: ''
    },
    confidence: 0,
    warnings: ['Failed to parse narrative - please fill in fields manually']
  }
}
