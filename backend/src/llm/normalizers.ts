/**
 * LLM output normalizers.
 *
 * Re-exports from shared/llmResponseUtils for backward compatibility.
 * These will eventually be the canonical home once shared/ is dissolved.
 */

export {
  URGENCY_COERCION,
  cleanLlmJsonResponse,
  extractJsonFromText,
  coerceAndValidateDifferential,
  flattenToStrings,
  flattenNestedObj,
  stringifyDisposition,
  normalizeComplexity,
  asStringOrArr,
  extractFinalMdm,
} from '../shared/llmResponseUtils.js'
