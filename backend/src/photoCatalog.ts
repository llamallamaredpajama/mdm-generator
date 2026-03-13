/**
 * Photo catalog for LLM-driven encounter photo assignment.
 * Maps 16 categories to editorial photos
 * in frontend/public/encounter-photos/.
 */

export const PHOTO_CATALOG: Record<string, string[]> = {
  cardiac: ['aortic-dissection', 'arrhythmia', 'cardiac-arrest', 'chest-pain', 'hypertension', 'palpitations', 'syncope'],
  dermatology: ['abscess', 'burn', 'laceration', 'rash', 'wound'],
  ent: ['congestion', 'ear-pain', 'epistaxis', 'hoarseness', 'sore-throat'],
  environmental: ['animal-bite', 'drowning', 'hyperthermia', 'hypothermia', 'insect-bite', 'snake-bite'],
  eye: ['eye-pain', 'red-eye', 'vision-changes'],
  'foreign-body': ['fb-ear', 'fb-esophagus', 'fb-eye', 'fb-nose', 'fb-rectal', 'fb-skin', 'fb-throat', 'fb-vaginal'],
  general: ['allergic-reaction', 'dehydration', 'fatigue', 'fever', 'sepsis', 'unspecified'],
  genitourinary: ['dysuria', 'flank-pain', 'hematuria', 'testicular-pain', 'urinary-retention'],
  gi: ['abdominal-pain', 'appendicitis', 'constipation', 'diarrhea', 'gi-bleed', 'nausea-vomiting', 'pancreatitis'],
  musculoskeletal: ['ankle-pain', 'back-pain-cervical', 'back-pain-thoracolumbar', 'elbow-pain', 'foot-toe-injury', 'hand-finger-injury', 'hip-pain', 'knee-pain', 'ribs', 'shoulder-pain', 'thigh', 'tib-fib', 'upper-arm', 'wrist-pain'],
  neuro: ['altered-mental-status', 'dizziness', 'headache', 'numbness', 'seizure', 'stroke', 'weakness'],
  obgyn: ['pelvic-pain', 'postpartum-emergency', 'pregnancy-concerns', 'vaginal-bleeding'],
  psych: ['agitation', 'alcohol-withdrawal', 'anxiety', 'depression', 'drug-withdrawal', 'psychosis', 'suicidal-ideation'],
  respiratory: ['apnea', 'asthma-exacerbation', 'copd-exacerbation', 'cough', 'hemoptysis', 'pneumonia', 'pulmonary-embolism', 'shortness-of-breath', 'wheezing'],
  toxicology: ['intoxication', 'overdose', 'toxic-exposure'],
  trauma: ['assault', 'fall', 'head-injury', 'mva', 'penetrating-injury'],
}

export const DEFAULT_PHOTO = { category: 'general', subcategory: 'unspecified' }

/**
 * Build compact photo catalog text for LLM prompt injection (~800 tokens).
 */
export function buildPhotoCatalogPrompt(): string {
  const lines = ['ENCOUNTER PHOTO CATALOG — select ONE category/subcategory:']
  for (const [category, subcategories] of Object.entries(PHOTO_CATALOG)) {
    lines.push(`${category}: ${subcategories.join(', ')}`)
  }
  return lines.join('\n')
}

/**
 * Validate LLM photo output against catalog. Returns DEFAULT_PHOTO on invalid.
 */
export function validatePhoto(photo: unknown): { category: string; subcategory: string } {
  if (!photo || typeof photo !== 'object') return DEFAULT_PHOTO
  const { category, subcategory } = photo as { category?: string; subcategory?: string }
  if (!category || !subcategory) return DEFAULT_PHOTO
  const subs = PHOTO_CATALOG[category]
  if (!subs || !subs.includes(subcategory)) return DEFAULT_PHOTO
  return { category, subcategory }
}
