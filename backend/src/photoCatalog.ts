/**
 * Photo catalog for LLM-driven encounter photo assignment.
 * Maps 16 categories to editorial photos
 * in frontend/public/encounter-photos/.
 *
 * At startup, initPhotoCatalog() loads the authoritative catalog
 * from the Firestore `photoLibrary` collection.  The hardcoded
 * PHOTO_CATALOG below serves as a synchronous fallback so that
 * buildPhotoCatalogPrompt() and validatePhoto() never need to await.
 */

import admin from 'firebase-admin'
import { logger } from './logger.js'

/** Module-level cache populated by initPhotoCatalog(). */
let cachedCatalog: Record<string, string[]> | null = null

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
 * Load the photo catalog from the Firestore `photoLibrary` collection
 * into the module-level cache.  Call once at startup.
 *
 * On failure the hardcoded PHOTO_CATALOG is used as a fallback — this
 * function intentionally does NOT throw.
 */
export async function initPhotoCatalog(db: admin.firestore.Firestore): Promise<void> {
  try {
    const snapshot = await db.collection('photoLibrary').get()
    if (snapshot.empty) {
      logger.warn('photoLibrary collection is empty — using hardcoded fallback')
      return
    }

    const catalog: Record<string, string[]> = {}
    for (const doc of snapshot.docs) {
      const data = doc.data()
      const category = data.category as string | undefined
      const subcategory = data.subcategory as string | undefined
      if (!category || !subcategory) continue
      if (!catalog[category]) catalog[category] = []
      if (!catalog[category].includes(subcategory)) {
        catalog[category].push(subcategory)
      }
    }

    cachedCatalog = catalog
    logger.info({ photoCount: snapshot.size, categoryCount: Object.keys(catalog).length }, 'Photo catalog loaded')
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err : undefined, message: err instanceof Error ? err.message : 'unknown error' }, 'Failed to load photo catalog from Firestore — using hardcoded fallback')
  }
}

/** Return the Firestore-backed catalog when available, otherwise the hardcoded fallback. */
function getCatalog(): Record<string, string[]> {
  return cachedCatalog ?? PHOTO_CATALOG
}

/**
 * Build compact photo catalog text for LLM prompt injection (~800 tokens).
 */
export function buildPhotoCatalogPrompt(): string {
  const lines = ['ENCOUNTER PHOTO CATALOG — select ONE category/subcategory:']
  for (const [category, subcategories] of Object.entries(getCatalog())) {
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
  const catalog = getCatalog()
  const subs = catalog[category]
  if (!subs || !subs.includes(subcategory)) return DEFAULT_PHOTO
  return { category, subcategory }
}
