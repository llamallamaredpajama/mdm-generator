/**
 * Quick Mode Prompt Builder
 *
 * Generates prompts for one-shot MDM generation with patient identifier extraction.
 * Unlike Build Mode's 3-section approach, Quick Mode processes the entire narrative
 * in a single AI call, extracting both the MDM and patient demographics.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Patient identifier extracted from narrative
 */
export interface PatientIdentifier {
  age?: string
  sex?: string
  chiefComplaint?: string
}

/**
 * Quick mode generation response structure
 */
export interface QuickModeGenerationResult {
  /** Formatted MDM text for EHR paste */
  text: string
  /** Structured MDM JSON */
  json: Record<string, unknown>
  /** Extracted patient identifier for card display */
  patientIdentifier: PatientIdentifier
}

/**
 * Load the MDM generation guide for system context
 */
async function loadMdmGuide(): Promise<string> {
  try {
    const guidePath = path.join(__dirname, '../../docs/mdm-gen-guide-v2.md')
    return await fs.readFile(guidePath, 'utf8')
  } catch {
    // Return minimal guidance if file not found
    return `
      You are an Emergency Medicine documentation assistant.
      Generate Medical Decision Making (MDM) documentation following worst-first approach.
      Always consider life-threatening diagnoses first.
    `
  }
}

/**
 * Prompt structure matching vertex.ts callGemini expectations
 */
export interface PromptParts {
  system: string
  user: string
}

/**
 * Build the complete prompt for quick mode generation
 *
 * This prompt instructs the model to:
 * 1. Extract patient demographics (age, sex, chief complaint)
 * 2. Generate a complete MDM following EM worst-first approach
 * 3. Return both as structured JSON
 */
export async function buildQuickModePrompt(
  narrative: string,
  surveillanceContext?: string,
  cdrContext?: string
): Promise<PromptParts> {
  const mdmGuide = await loadMdmGuide()

  let systemPrompt = `${mdmGuide}

---

# Quick Mode MDM Generation

You are processing a single narrative input to generate a complete Medical Decision Making (MDM) document.

## Your Task

1. **Extract Patient Identifier**: From the narrative, extract:
   - Age (e.g., "45", "elderly", "pediatric")
   - Sex (e.g., "male", "female", "M", "F")
   - Chief Complaint (brief, e.g., "chest pain", "abdominal pain", "shortness of breath")

2. **Generate Complete MDM**: Following the worst-first Emergency Medicine approach:
   - Identify life-threatening diagnoses first
   - Document data reviewed and ordered
   - Provide clinical reasoning
   - Assess risk level
   - Include disposition

## Response Format

Return ONLY valid JSON in this exact structure (no markdown, no code fences):

{
  "patientIdentifier": {
    "age": "extracted age or null",
    "sex": "extracted sex or null",
    "chiefComplaint": "brief chief complaint or null"
  },
  "mdm": {
    "text": "Complete formatted MDM text ready for EHR paste",
    "json": {
      "problems": ["List of problems addressed"],
      "differential": [
        {
          "diagnosis": "Diagnosis name",
          "urgency": "emergent|urgent|routine",
          "reasoning": "Why considered"
        }
      ],
      "dataReviewed": ["Labs", "Imaging", "EKG", "etc."],
      "dataOrdered": ["Tests ordered"],
      "reasoning": "Clinical decision-making rationale",
      "risk": ["Risk factors and mitigations"],
      "disposition": "Discharge plan or admission",
      "complexityLevel": "straightforward|low|moderate|high"
    }
  }
}

## Important Notes

- If demographics cannot be determined, set those fields to null
- The "text" field should be copy-paste ready for an EHR
- Always use worst-first approach for differential diagnosis
- Include appropriate disclaimers about physician review
- This is educational use only - no real patient data`

  const userPrompt = `## Narrative Input

${narrative}

---

Generate the complete JSON response now:`

  // Append surveillance context with explicit integration instructions
  if (surveillanceContext) {
    systemPrompt += `\n\n---\n\n# Regional Epidemiologic Context\n\n${surveillanceContext}\n\n## Surveillance Integration Instructions\n\n1. Include "Regional Surveillance Data" in the "dataReviewed" array (e.g., "Regional Surveillance Data: CDC Respiratory, NWSS Wastewater — [key findings]")\n2. In differential reasoning, explicitly note how regional surveillance data affects pre-test probability:\n   - For conditions with RISING regional activity: note increased pre-test probability\n   - For conditions with LOW/ABSENT regional activity: note reduced pre-test probability\n3. In the MDM "text" field, include a brief "Regional Epidemiologic Context" paragraph summarizing:\n   - Data sources consulted\n   - Regionally active conditions relevant to the differential\n   - Conditions on the differential that are NOT active in this region\n4. Weight epidemiologically active conditions appropriately in urgency classification`
  }

  // Append CDR context with one-shot integration instructions
  if (cdrContext) {
    systemPrompt += `\n\n---\n\n# Clinical Decision Rules Context\n\n${cdrContext}\n\n## CDR Quick Mode Instructions\n\n1. Identify all applicable clinical decision rules from the reference above based on the narrative\n2. Calculate scores where sufficient data exists — note missing data points for incomplete calculations\n3. Include CDR results in the "dataReviewed" array (e.g., "HEART Score: 4 (moderate risk) — Age >45 (+1), HTN (+1), troponin normal (0), EKG non-specific (+1), moderate clinical suspicion (+1)")\n4. Reference CDR results in differential reasoning to support probability assessments\n5. Use CDR scores to inform risk assessment and disposition recommendations\n6. In the MDM "text" field, include CDR calculations in the Data Reviewed and Risk Assessment sections`
  }

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}

/**
 * Parse the model response into structured result
 */
export function parseQuickModeResponse(rawResponse: string): QuickModeGenerationResult {
  // Strip any markdown code fences
  let cleanedText = rawResponse
    .replace(/^```json\s*/gm, '')
    .replace(/^```\s*$/gm, '')
    .trim()

  try {
    const parsed = JSON.parse(cleanedText)

    return {
      text: parsed.mdm?.text || '',
      json: parsed.mdm?.json || {},
      patientIdentifier: {
        age: parsed.patientIdentifier?.age || undefined,
        sex: parsed.patientIdentifier?.sex || undefined,
        chiefComplaint: parsed.patientIdentifier?.chiefComplaint || undefined,
      },
    }
  } catch (parseError) {
    // Try to extract JSON from the response
    const jsonStart = cleanedText.indexOf('{')
    const jsonEnd = cleanedText.lastIndexOf('}')

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonStr = cleanedText.slice(jsonStart, jsonEnd + 1)
      const parsed = JSON.parse(jsonStr)

      return {
        text: parsed.mdm?.text || parsed.text || '',
        json: parsed.mdm?.json || parsed.json || {},
        patientIdentifier: {
          age: parsed.patientIdentifier?.age || undefined,
          sex: parsed.patientIdentifier?.sex || undefined,
          chiefComplaint: parsed.patientIdentifier?.chiefComplaint || undefined,
        },
      }
    }

    throw new Error('Invalid model output - no valid JSON found')
  }
}

/**
 * Fallback result when model fails
 */
export function getQuickModeFallback(): QuickModeGenerationResult {
  return {
    text: 'Unable to generate MDM. Please review input and try again.\n\nEducational draft only. Physician must review.',
    json: {
      problems: [],
      differential: [],
      dataReviewed: [],
      reasoning: 'Generation failed - manual review required',
      risk: [],
      disposition: '',
      complexityLevel: 'moderate',
    },
    patientIdentifier: {},
  }
}
