/**
 * LLM Response Parser
 *
 * Centralizes all LLM response parsing logic with a consistent ParseResult<T> type.
 * Each parse method encapsulates: clean → parse JSON → normalize → validate → fallback stub.
 *
 * Safety-critical: this is the bridge between unpredictable LLM output and
 * validated medical decision-making data structures.
 */

import { z } from 'zod'
import {
  cleanLlmJsonResponse,
  extractJsonFromText,
  coerceAndValidateDifferential,
  extractFinalMdm,
} from './normalizers.js'
import {
  CdrAnalysisItemSchema,
  WorkupRecommendationSchema,
  FinalMdmSchema,
  safeParseGaps,
  type DifferentialItem,
  type CdrAnalysisItem,
  type WorkupRecommendation,
  type FinalMdm,
  type GapItem,
  type ParsedResultItem,
} from '../buildModeSchemas.js'
import { renderMdmText } from '../outputSchema.js'
import { validatePhoto } from '../photoCatalog.js'
import { getEmptyParsedNarrative, type ParsedNarrative } from '../parsePromptBuilder.js'
import type { QuickModeGenerationResult } from '../promptBuilderQuickMode.js'
import type { AutoPopulatedValues } from '../services/cdrTrackingBuilder.js'
import { PHYSICIAN_ATTESTATION } from '../constants.js'
import { logger } from '../logger.js'

// ============================================================================
// ParseResult type
// ============================================================================

export type ParseResult<T> =
  | { success: true; data: T; fallback: false }
  | { success: true; data: T; fallback: true; reason: string }
  | { success: false; data: T; reason: string }

// ============================================================================
// Section 1 types
// ============================================================================

export interface Section1ParsedData {
  differential: DifferentialItem[]
  cdrAnalysis: CdrAnalysisItem[]
  workupRecommendations: WorkupRecommendation[]
  encounterPhoto?: { category: string; subcategory: string }
}

// ============================================================================
// Finalize types
// ============================================================================

export interface FinalizeParsedData {
  finalMdm: FinalMdm
  gaps: GapItem[]
  encounterPhoto?: { category: string; subcategory: string }
  generationFailed: boolean
}

// ============================================================================
// LlmResponseParser
// ============================================================================

export class LlmResponseParser {
  /**
   * Parse Section 1 LLM response into differential + CDR analysis + workup recommendations.
   */
  parseSection1(rawText: string): ParseResult<Section1ParsedData> {
    const cleanedText = cleanLlmJsonResponse(rawText)

    let differential: DifferentialItem[] = []
    let cdrAnalysis: CdrAnalysisItem[] = []
    let workupRecommendations: WorkupRecommendation[] = []
    let encounterPhoto: { category: string; subcategory: string } | undefined

    try {
      const rawParsed = JSON.parse(cleanedText)

      // Handle both legacy (array) and new (object) response formats
      if (Array.isArray(rawParsed)) {
        differential = coerceAndValidateDifferential(rawParsed)
      } else if (rawParsed && typeof rawParsed === 'object') {
        if (Array.isArray(rawParsed.differential)) {
          differential = coerceAndValidateDifferential(rawParsed.differential)
        }

        // CDR analysis (non-blocking)
        if (Array.isArray(rawParsed.cdrAnalysis)) {
          const cdrValidated = z.array(CdrAnalysisItemSchema).safeParse(rawParsed.cdrAnalysis)
          if (cdrValidated.success) {
            const applicableCdrs = cdrValidated.data.filter((item) => item.applicable)
            const seenCdrNames = new Set<string>()
            cdrAnalysis = applicableCdrs.filter((item) => {
              const key = item.name.toLowerCase().trim()
              if (seenCdrNames.has(key)) return false
              seenCdrNames.add(key)
              return true
            })
          } else {
            logger.warn('Section 1 cdrAnalysis validation failed (non-blocking)')
          }
        }

        // Workup recommendations (non-blocking)
        if (Array.isArray(rawParsed.workupRecommendations)) {
          const workupValidated = z.array(WorkupRecommendationSchema).safeParse(rawParsed.workupRecommendations)
          if (workupValidated.success) {
            workupRecommendations = workupValidated.data
          } else {
            logger.warn('Section 1 workupRecommendations validation failed (non-blocking)')
          }
        }

        encounterPhoto = validatePhoto(rawParsed.encounterPhoto)
      }

      // Fallback: try extracting JSON from text
      if (differential.length === 0) {
        const extracted = extractJsonFromText(cleanedText)
        if (extracted) {
          try {
            const fallbackParsed = JSON.parse(extracted)
            if (Array.isArray(fallbackParsed)) {
              differential = coerceAndValidateDifferential(fallbackParsed)
            } else if (fallbackParsed?.differential && Array.isArray(fallbackParsed.differential)) {
              differential = coerceAndValidateDifferential(fallbackParsed.differential)
            }
          } catch {
            // extraction attempt failed
          }
        }
      }

      if (differential.length > 0) {
        return {
          success: true,
          data: { differential, cdrAnalysis, workupRecommendations, encounterPhoto },
          fallback: false,
        }
      }

      // No differential parsed — return fallback stub
      logger.warn({ responseLength: rawText.length, cleanedLength: cleanedText.length }, 'Section 1: no valid differential parsed from model output')
      return {
        success: true,
        data: {
          differential: [{
            diagnosis: 'Unable to validate differential',
            urgency: 'urgent' as const,
            reasoning: 'Model output did not match expected schema. Please review and resubmit.',
          }],
          cdrAnalysis,
          workupRecommendations,
        },
        fallback: true,
        reason: 'No valid differential items parsed from model output',
      }
    } catch (parseError) {
      logger.error({ err: parseError }, 'Section 1 JSON parse error')
      return {
        success: true,
        data: {
          differential: [{
            diagnosis: 'Unable to parse differential',
            urgency: 'urgent' as const,
            reasoning: 'Please review input and resubmit',
          }],
          cdrAnalysis,
          workupRecommendations,
        },
        fallback: true,
        reason: 'JSON parse failed',
      }
    }
  }

  /**
   * Parse finalize LLM response into final MDM + gaps.
   */
  parseFinalize(rawText: string): ParseResult<FinalizeParsedData> {
    const fallbackMdm: FinalMdm = {
      text: 'Unable to generate final MDM. Please review and try again.',
      json: {
        problems: [],
        differential: [],
        dataReviewed: [],
        reasoning: 'Generation failed',
        risk: [],
        disposition: '',
        complexityLevel: 'moderate',
      },
    }

    const cleanedText = cleanLlmJsonResponse(rawText)

    try {
      let rawParsed = JSON.parse(cleanedText)

      // Defensive unwrap: if LLM wraps in { finalMdm: {...} }
      if (rawParsed.finalMdm && typeof rawParsed.finalMdm === 'object') {
        rawParsed = rawParsed.finalMdm
      }

      const candidate = extractFinalMdm(rawParsed)
      const gaps = safeParseGaps(rawParsed.gaps)
      const encounterPhoto = validatePhoto(rawParsed.encounterPhoto)

      const validated = FinalMdmSchema.safeParse(candidate)
      if (validated.success) {
        return {
          success: true,
          data: { finalMdm: validated.data, gaps, encounterPhoto, generationFailed: false },
          fallback: false,
        }
      }

      logger.warn({ zodError: validated.error.message, candidateKeys: Object.keys(candidate) }, 'Finalize Zod validation failed')
      return {
        success: false,
        data: { finalMdm: fallbackMdm, gaps, encounterPhoto, generationFailed: true },
        reason: 'Zod validation failed: ' + validated.error.message,
      }
    } catch (parseError) {
      logger.error({ error: parseError instanceof Error ? parseError.message : String(parseError), responseLength: cleanedText.length }, 'Finalize JSON parse error')

      // Fallback: try to extract JSON
      const jsonStart = cleanedText.indexOf('{')
      const jsonEnd = cleanedText.lastIndexOf('}')
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          let jsonObj = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
          if (jsonObj.finalMdm && typeof jsonObj.finalMdm === 'object') {
            jsonObj = jsonObj.finalMdm
          }
          const candidate: FinalMdm = {
            ...extractFinalMdm(jsonObj),
            text: jsonObj.text || renderMdmText(jsonObj),
          }
          const gaps = safeParseGaps(jsonObj.gaps)
          const encounterPhoto = validatePhoto(jsonObj.encounterPhoto)
          const validated = FinalMdmSchema.safeParse(candidate)
          if (validated.success) {
            return {
              success: true,
              data: { finalMdm: validated.data, gaps, encounterPhoto, generationFailed: false },
              fallback: true,
              reason: 'Primary JSON parse failed, extracted via brace matching',
            }
          }
          return {
            success: false,
            data: { finalMdm: fallbackMdm, gaps: [], generationFailed: true },
            reason: 'Extracted JSON failed Zod validation',
          }
        } catch {
          return {
            success: false,
            data: { finalMdm: fallbackMdm, gaps: [], generationFailed: true },
            reason: 'Brace extraction also failed to parse',
          }
        }
      }

      return {
        success: false,
        data: { finalMdm: fallbackMdm, gaps: [], generationFailed: true },
        reason: 'No JSON structure found in response',
      }
    }
  }

  /**
   * Parse quick mode LLM response.
   * Wraps existing parseQuickModeResponse with ParseResult type.
   */
  parseQuickMode(rawText: string): ParseResult<QuickModeGenerationResult> {
    const cleanedText = cleanLlmJsonResponse(rawText)

    try {
      const parsed = JSON.parse(cleanedText)
      return {
        success: true,
        data: {
          text: parsed.mdm?.text || '',
          json: parsed.mdm?.json || {},
          patientIdentifier: {
            age: parsed.patientIdentifier?.age || undefined,
            sex: parsed.patientIdentifier?.sex || undefined,
            chiefComplaint: parsed.patientIdentifier?.chiefComplaint || undefined,
          },
          gaps: safeParseGaps(parsed.gaps),
          encounterPhoto: parsed.encounterPhoto || undefined,
        },
        fallback: false,
      }
    } catch {
      // Try brace extraction
      const jsonStart = cleanedText.indexOf('{')
      const jsonEnd = cleanedText.lastIndexOf('}')

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          const parsed = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1))
          return {
            success: true,
            data: {
              text: parsed.mdm?.text || parsed.text || '',
              json: parsed.mdm?.json || parsed.json || {},
              patientIdentifier: {
                age: parsed.patientIdentifier?.age || undefined,
                sex: parsed.patientIdentifier?.sex || undefined,
                chiefComplaint: parsed.patientIdentifier?.chiefComplaint || undefined,
              },
              gaps: safeParseGaps(parsed.gaps),
              encounterPhoto: parsed.encounterPhoto || undefined,
            },
            fallback: true,
            reason: 'Primary parse failed, extracted via brace matching',
          }
        } catch {
          // fall through to failure
        }
      }

      return {
        success: false,
        data: {
          text: 'Unable to generate MDM. Please review input and try again.\n\n' + PHYSICIAN_ATTESTATION,
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
          gaps: [],
          encounterPhoto: undefined,
        },
        reason: 'No valid JSON found in response',
      }
    }
  }

  /**
   * Parse narrative LLM response into structured fields.
   */
  parseNarrative(rawText: string): ParseResult<ParsedNarrative> {
    const cleanedText = cleanLlmJsonResponse(rawText)

    try {
      const parsed = JSON.parse(cleanedText) as ParsedNarrative
      if (typeof parsed.confidence !== 'number') parsed.confidence = 0.5
      if (!Array.isArray(parsed.warnings)) parsed.warnings = []
      return { success: true, data: parsed, fallback: false }
    } catch {
      // Fallback: brace extraction
      const jsonStart = cleanedText.indexOf('{')
      const jsonEnd = cleanedText.lastIndexOf('}')
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          const parsed = JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1)) as ParsedNarrative
          if (typeof parsed.confidence !== 'number') parsed.confidence = 0.5
          if (!Array.isArray(parsed.warnings)) parsed.warnings = []
          return {
            success: true,
            data: parsed,
            fallback: true,
            reason: 'Primary parse failed, extracted via brace matching',
          }
        } catch {
          // fall through
        }
      }

      const empty = getEmptyParsedNarrative()
      empty.confidence = 0
      empty.warnings = ['Failed to parse narrative']
      return {
        success: false,
        data: empty,
        reason: 'No valid JSON found in narrative parse response',
      }
    }
  }

  /**
   * Parse suggest-diagnosis LLM response into a string array.
   */
  parseSuggestDiagnosis(rawText: string, fallbackDifferential: DifferentialItem[]): ParseResult<string[]> {
    const cleanedText = cleanLlmJsonResponse(rawText)

    try {
      const parsed = JSON.parse(cleanedText)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Expected non-empty array')
      }
      const suggestions = parsed
        .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 7)

      if (suggestions.length === 0) {
        return {
          success: true,
          data: fallbackDifferential.slice(0, 3).map((d) => d.diagnosis),
          fallback: true,
          reason: 'Parsed array was empty after filtering',
        }
      }

      return { success: true, data: suggestions, fallback: false }
    } catch {
      return {
        success: true,
        data: fallbackDifferential.slice(0, 3).map((d) => d.diagnosis),
        fallback: true,
        reason: 'JSON parse failed, using top differential diagnoses',
      }
    }
  }

  /**
   * Parse lab/EHR results text into structured results.
   */
  parseResults(rawText: string, validTestIds: Set<string>): ParseResult<{ parsed: ParsedResultItem[]; unmatchedText: string[] }> {
    const cleanedText = cleanLlmJsonResponse(rawText)

    try {
      const jsonResponse = JSON.parse(cleanedText)
      let parsedResults: ParsedResultItem[] = []
      let unmatchedText: string[] = []

      if (Array.isArray(jsonResponse.parsed)) {
        parsedResults = jsonResponse.parsed
          .filter((item: any) => item.testId && validTestIds.has(item.testId))
          .map((item: any) => ({
            testId: String(item.testId),
            testName: String(item.testName || ''),
            status: item.status === 'abnormal' ? 'abnormal' as const : 'unremarkable' as const,
            ...(item.value ? { value: String(item.value) } : {}),
            ...(item.unit ? { unit: String(item.unit) } : {}),
            ...(item.notes ? { notes: String(item.notes) } : {}),
          }))
      }

      if (Array.isArray(jsonResponse.unmatchedText)) {
        unmatchedText = jsonResponse.unmatchedText.map(String)
      }

      return {
        success: true,
        data: { parsed: parsedResults, unmatchedText },
        fallback: false,
      }
    } catch {
      return {
        success: true,
        data: {
          parsed: [],
          unmatchedText: ['Failed to parse results from the pasted text. Please try again.'],
        },
        fallback: true,
        reason: 'LLM response parse failed',
      }
    }
  }

  /**
   * Parse CDR auto-populate response.
   */
  parseCdrAutoPopulate(rawText: string): AutoPopulatedValues | null {
    const cleanedText = cleanLlmJsonResponse(rawText)

    try {
      return JSON.parse(cleanedText) as AutoPopulatedValues
    } catch {
      logger.warn('CDR auto-populate JSON parse failed (non-blocking)')
      return null
    }
  }
}

/** Singleton instance for convenience */
export const responseParser = new LlmResponseParser()
