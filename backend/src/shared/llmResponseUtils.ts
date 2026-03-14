/**
 * Shared LLM response parsing utilities.
 *
 * Extracted from index.ts — used by encounter, quick-mode, and narrative modules
 * for cleaning, parsing, and validating LLM JSON output.
 */

import { z } from 'zod'
import { logger } from '../logger'
import {
  DifferentialItemSchema,
  FinalMdmSchema,
  safeParseGaps,
  type DifferentialItem,
  type FinalMdm,
  type GapItem,
} from '../buildModeSchemas'
import { renderMdmText } from '../outputSchema'

/**
 * Map of common LLM urgency variations to valid DifferentialItemSchema values.
 * LLMs sometimes return non-standard urgency strings; this coerces them.
 */
export const URGENCY_COERCION: Record<string, 'emergent' | 'urgent' | 'routine'> = {
  // Standard values (pass-through)
  emergent: 'emergent',
  urgent: 'urgent',
  routine: 'routine',
  // Common LLM variations
  emergency: 'emergent',
  critical: 'emergent',
  high: 'emergent',
  'life-threatening': 'emergent',
  moderate: 'urgent',
  medium: 'urgent',
  low: 'routine',
  standard: 'routine',
  normal: 'routine',
  'non-urgent': 'routine',
}

/**
 * Clean raw LLM text output into parseable JSON.
 * Handles: code fences (single/double, case-insensitive), preamble/postamble text,
 * trailing commas, and other common LLM formatting artifacts.
 */
export function cleanLlmJsonResponse(raw: string): string {
  let text = raw

  // Strip markdown code fences (case-insensitive, handles double fences like ````json)
  text = text.replace(/^`{2,4}(?:json|JSON)?\s*\n?/gm, '')
  text = text.replace(/^`{2,4}\s*$/gm, '')

  text = text.trim()

  // If the text has non-JSON preamble, extract the JSON portion
  // Find the first { or [ which starts a JSON structure
  if (text.length > 0 && text[0] !== '{' && text[0] !== '[') {
    const objStart = text.indexOf('{')
    const arrStart = text.indexOf('[')
    let start = -1
    if (objStart >= 0 && arrStart >= 0) {
      start = Math.min(objStart, arrStart)
    } else if (objStart >= 0) {
      start = objStart
    } else if (arrStart >= 0) {
      start = arrStart
    }
    if (start >= 0) {
      text = text.slice(start)
    }
  }

  // If there's postamble text after the JSON, trim it
  // Find the matching closing bracket
  if (text.length > 0) {
    const openChar = text[0]
    const closeChar = openChar === '{' ? '}' : openChar === '[' ? ']' : null
    if (closeChar) {
      let depth = 0
      let inString = false
      let escape = false
      let lastClose = -1
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (escape) {
          escape = false
          continue
        }
        if (ch === '\\' && inString) {
          escape = true
          continue
        }
        if (ch === '"') {
          inString = !inString
          continue
        }
        if (inString) continue
        if (ch === openChar) depth++
        if (ch === closeChar) {
          depth--
          if (depth === 0) {
            lastClose = i
            break
          }
        }
      }
      if (lastClose >= 0 && lastClose < text.length - 1) {
        text = text.slice(0, lastClose + 1)
      }
    }
  }

  // Strip trailing commas before } or ] (common LLM artifact, invalid JSON)
  text = text.replace(/,\s*([\]}])/g, '$1')

  return text.trim()
}

/**
 * Try to extract a JSON object or array from arbitrary text.
 * Finds the outermost balanced { } or [ ] and returns it.
 */
export function extractJsonFromText(text: string): string | null {
  // Try object first, then array
  for (const [open, close] of [['{', '}'], ['[', ']']] as const) {
    const start = text.indexOf(open)
    if (start < 0) continue

    let depth = 0
    let inString = false
    let escape = false
    for (let i = start; i < text.length; i++) {
      const ch = text[i]
      if (escape) { escape = false; continue }
      if (ch === '\\' && inString) { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === open) depth++
      if (ch === close) {
        depth--
        if (depth === 0) {
          return text.slice(start, i + 1)
        }
      }
    }
  }
  return null
}

/**
 * Coerce LLM urgency values to valid schema values, then validate with Zod.
 * Uses item-level validation so one bad item doesn't reject the entire array.
 * Returns validated differential items or empty array when ALL items fail.
 */
export function coerceAndValidateDifferential(items: unknown[]): DifferentialItem[] {
  // Fast path: try validating the whole array at once (no coercion needed)
  const directResult = z.array(DifferentialItemSchema).safeParse(items)
  if (directResult.success) return directResult.data

  // Item-level fallback: coerce and validate each item independently
  const validated: DifferentialItem[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item || typeof item !== 'object') {
      logger.warn({ action: 'differential-item-invalid', index: i }, 'Section 1 differential item: not an object, skipping')
      continue
    }

    const obj = { ...(item as Record<string, unknown>) }

    // Coerce urgency: map known variations, default unmapped/missing to 'urgent'
    const rawUrgency = String(obj.urgency ?? '').toLowerCase().trim()
    if (rawUrgency && URGENCY_COERCION[rawUrgency]) {
      obj.urgency = URGENCY_COERCION[rawUrgency]
    } else {
      // Unknown or missing urgency — default to 'urgent' (safe clinical middle tier)
      obj.urgency = 'urgent'
    }

    const result = DifferentialItemSchema.safeParse(obj)
    if (result.success) {
      validated.push(result.data)
    } else {
      const diagName = typeof obj.diagnosis === 'string' ? obj.diagnosis.slice(0, 40) : '(no diagnosis)'
      const paths = result.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join('; ')
      logger.warn({ action: 'differential-item-validation-failed', index: i }, `Section 1 differential item "${diagName}" failed validation: ${paths}`)
    }
  }

  return validated
}

/**
 * Extract differential items from S1 llmResponse, handling dual shape.
 * Old format: flat DifferentialItem[], new format: { differential: DifferentialItem[] }
 */
export function getDifferential(s1Response: unknown): DifferentialItem[] {
  if (Array.isArray(s1Response)) return s1Response as DifferentialItem[]
  if (s1Response && typeof s1Response === 'object') {
    const obj = s1Response as Record<string, unknown>
    if (Array.isArray(obj.differential)) return obj.differential as DifferentialItem[]
  }
  return []
}

/** Coerce an array of mixed types to string[] */
export const flattenToStrings = (val: unknown): string[] | undefined => {
  if (!val) return undefined
  if (Array.isArray(val)) return val.map((v) => typeof v === 'object' ? JSON.stringify(v) : String(v))
  return undefined
}

/** Flatten a nested object like { labs: [...], imaging: [...] } into a flat string[] */
export const flattenNestedObj = (val: unknown): string[] | undefined => {
  if (!val || typeof val !== 'object') return undefined
  if (Array.isArray(val)) return val.map(String)
  const entries: string[] = []
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    if (Array.isArray(v)) entries.push(...v.map((item) => `${k}: ${item}`))
    else if (v) entries.push(`${k}: ${v}`)
  }
  return entries.length ? entries : undefined
}

/** Stringify a disposition value that may be string or structured object */
export const stringifyDisposition = (val: unknown): string => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    const d = val as Record<string, unknown>
    const parts = [d.decision, d.levelOfCare, d.rationale].filter(Boolean)
    return parts.join(' — ') || JSON.stringify(val)
  }
  return String(val)
}

/** Normalize a complexity value to 'low' | 'moderate' | 'high' */
export const normalizeComplexity = (val: unknown): 'low' | 'moderate' | 'high' => {
  const s = String(val || 'moderate').toLowerCase()
  if (s === 'low' || s === 'moderate' || s === 'high') return s
  return 'moderate'
}

/** Coerce a value to string or string[] */
export const asStringOrArr = (val: unknown): string | string[] | undefined => {
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.map(String)
  return undefined
}

/**
 * Extract a FinalMdm object from a raw LLM response object.
 * Handles various field naming conventions the LLM may use.
 */
export const extractFinalMdm = (raw: Record<string, unknown>): FinalMdm => {
  const j = (raw.json && typeof raw.json === 'object' ? raw.json : {}) as Record<string, unknown>
  return {
    text: (raw.text as string) || '',
    json: {
      problems: asStringOrArr(j.problems) || asStringOrArr(raw.problems)
        || flattenToStrings(j.problemsAddressed) || flattenToStrings(raw.problemsAddressed) || [],
      differential: asStringOrArr(j.differential) || asStringOrArr(raw.differential) || [],
      dataReviewed: asStringOrArr(j.dataReviewed) || asStringOrArr(raw.dataReviewed)
        || flattenNestedObj(j.dataReviewedOrdered) || flattenNestedObj(raw.dataReviewedOrdered) || [],
      reasoning: (j.reasoning || raw.reasoning
        || j.clinicalReasoning || raw.clinicalReasoning || '') as string,
      risk: asStringOrArr(j.risk) || asStringOrArr(raw.risk)
        || flattenNestedObj(j.riskAssessment) || flattenNestedObj(raw.riskAssessment) || [],
      disposition: stringifyDisposition(j.disposition || raw.disposition),
      complexityLevel: normalizeComplexity(j.complexityLevel || raw.complexityLevel),
    },
  }
}
