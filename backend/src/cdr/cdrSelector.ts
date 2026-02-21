import { loadCdrRules, type CdrRule } from './cdrLoader'

/**
 * Category-level trigger keywords. When any keyword matches the narrative,
 * that category becomes "active" and its rules are evaluated individually.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'TRAUMA': ['trauma', 'fall', 'fell', 'mvc', 'motor vehicle', 'accident', 'injury', 'hit', 'struck', 'collision', 'laceration', 'fracture', 'head injury', 'blunt', 'penetrating', 'assault', 'gcs', 'concussion', 'cervical', 'c-spine', 'neck pain', 'spine'],
  'CARDIOVASCULAR': ['chest pain', 'cardiac', 'heart', 'stemi', 'nstemi', 'mi', 'myocardial', 'troponin', 'ekg', 'ecg', 'palpitations', 'arrhythmia', 'afib', 'atrial fibrillation', 'dvt', 'deep vein', 'aortic', 'hypertensive', 'blood pressure', 'bp', 'syncope', 'angina', 'acs', 'acute coronary'],
  'PULMONARY': ['shortness of breath', 'sob', 'dyspnea', 'pe', 'pulmonary embolism', 'pneumonia', 'cough', 'wheezing', 'asthma', 'copd', 'respiratory', 'oxygen', 'hypoxia', 'pleuritic', 'pneumothorax', 'hemoptysis', 'lung'],
  'NEUROLOGY': ['headache', 'stroke', 'tia', 'seizure', 'weakness', 'numbness', 'altered mental status', 'ams', 'confusion', 'dizziness', 'vertigo', 'subarachnoid', 'sah', 'hemorrhage', 'meningitis', 'facial droop', 'slurred speech', 'aphasia', 'neurological', 'neuro'],
  'GASTROINTESTINAL': ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'gi bleed', 'melena', 'hematemesis', 'appendicitis', 'cholecystitis', 'pancreatitis', 'bowel', 'rectal', 'liver', 'hepatic', 'gallbladder', 'biliary', 'gastric', 'esophageal', 'varices'],
  'GENITOURINARY': ['flank pain', 'hematuria', 'dysuria', 'urinary', 'renal', 'kidney', 'stone', 'nephrolithiasis', 'uti', 'urinalysis', 'testicular', 'scrotal', 'torsion', 'ovarian', 'pelvic', 'vaginal bleeding', 'ectopic', 'pregnancy'],
  'INFECTIOUS DISEASE': ['fever', 'sepsis', 'infection', 'abscess', 'cellulitis', 'meningitis', 'pneumonia', 'uti', 'bacteremia', 'endocarditis', 'osteomyelitis', 'sirs', 'qsofa', 'immunocompromised', 'hiv', 'wound infection'],
  'TOXICOLOGY': ['overdose', 'ingestion', 'poisoning', 'toxic', 'substance', 'alcohol', 'intoxication', 'withdrawal', 'acetaminophen', 'tylenol', 'aspirin', 'salicylate', 'opioid', 'benzodiazepine', 'drug', 'suicide attempt', 'intentional ingestion'],
  'ENDOCRINE': ['diabetes', 'diabetic', 'dka', 'hyperglycemia', 'hypoglycemia', 'glucose', 'blood sugar', 'thyroid', 'thyrotoxicosis', 'myxedema', 'adrenal', 'addison', 'cushing', 'insulin', 'a1c', 'ketoacidosis'],
  'HEMATOLOGY / COAGULATION': ['bleeding', 'coagulopathy', 'anticoagulant', 'warfarin', 'inr', 'platelet', 'thrombocytopenia', 'anemia', 'hemoglobin', 'hematocrit', 'transfusion', 'blood loss', 'hit', 'heparin', 'coumadin', 'bruising', 'petechiae', 'dvt', 'pe', 'clot', 'embolism', 'sickle cell'],
  'PEDIATRIC — Additional': ['pediatric', 'child', 'infant', 'neonate', 'newborn', 'toddler', 'adolescent', 'year old', 'yo', 'month old', 'mo', 'baby', 'kawasaki', 'intussusception', 'pyloric', 'croup', 'bronchiolitis', 'rsv', 'neonatal'],
  'PROCEDURAL / AIRWAY': ['intubation', 'airway', 'rapid sequence', 'rsi', 'sedation', 'procedural sedation', 'ventilator', 'difficult airway', 'cricothyrotomy', 'tracheostomy', 'mallampati', 'lemon', 'tube', 'ett'],
  'ENVIRONMENTAL': ['heat', 'cold', 'hypothermia', 'hyperthermia', 'heat stroke', 'frostbite', 'drowning', 'submersion', 'altitude', 'burn', 'lightning', 'envenomation', 'bite', 'sting', 'snake', 'exposure', 'environmental'],
  'DISPOSITION / RISK STRATIFICATION': ['discharge', 'admit', 'observation', 'transfer', 'icu', 'risk', 'ama', 'against medical advice', 'low risk', 'high risk', 'chest pain unit', 'disposition', 'safe discharge'],
}

/** Short keywords (<=2 chars) that need word-boundary matching to avoid false positives */
const SHORT_KEYWORD_REGEX_CACHE = new Map<string, RegExp>()

function getWordBoundaryRegex(keyword: string): RegExp {
  let regex = SHORT_KEYWORD_REGEX_CACHE.get(keyword)
  if (!regex) {
    regex = new RegExp(`\\b${keyword}\\b`, 'i')
    SHORT_KEYWORD_REGEX_CACHE.set(keyword, regex)
  }
  return regex
}

function textContainsKeyword(text: string, keyword: string): boolean {
  if (keyword.length <= 2) {
    return getWordBoundaryRegex(keyword).test(text)
  }
  return text.includes(keyword)
}

function countRuleKeywordMatches(text: string, rule: CdrRule): number {
  let count = 0
  for (const kw of rule.keywords) {
    if (textContainsKeyword(text, kw.toLowerCase())) {
      count++
    }
  }
  return count
}

/**
 * Select CDR rules relevant to the given narrative text.
 *
 * Two-level matching:
 *   Level 1 — identify active categories via CATEGORY_KEYWORDS
 *   Level 2 — within active categories, score individual rules by keyword hits
 *
 * Returns matched rules sorted by relevance (most keyword matches first).
 */
export function selectRelevantRules(text: string): CdrRule[] {
  const lower = text.toLowerCase()
  const categories = loadCdrRules()

  // Level 1: find active categories
  const activeCategories = new Set<string>()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (textContainsKeyword(lower, kw)) {
        activeCategories.add(category)
        break
      }
    }
  }

  // Level 2: score rules within active categories
  const scored: { rule: CdrRule; matches: number }[] = []

  for (const cat of categories) {
    if (!activeCategories.has(cat.name)) continue

    for (const rule of cat.rules) {
      const matches = countRuleKeywordMatches(lower, rule)
      if (matches > 0) {
        scored.push({ rule, matches })
      }
    }
  }

  // Sort by match count descending (most relevant first)
  scored.sort((a, b) => b.matches - a.matches)

  return scored.map((s) => s.rule)
}
