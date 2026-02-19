/**
 * Syndrome Mapper
 * Maps clinical chief complaints and differentials to CDC syndrome categories.
 * Uses keyword matching — no LLM calls.
 */

import type { SyndromeCategory } from './types'

/** Keyword tables for syndrome categories */
const SYNDROME_KEYWORDS: Record<SyndromeCategory, string[]> = {
  respiratory_upper: [
    'cough', 'sore throat', 'pharyngitis', 'rhinorrhea', 'congestion',
    'nasal', 'sinusitis', 'uri', 'cold', 'influenza', 'flu', 'strep',
    'tonsillitis', 'laryngitis', 'croup', 'sneezing',
  ],
  respiratory_lower: [
    'pneumonia', 'bronchitis', 'bronchiolitis', 'dyspnea', 'shortness of breath',
    'sob', 'wheezing', 'rsv', 'respiratory syncytial', 'pleurisy',
    'lung', 'pulmonary', 'covid', 'sars', 'ards', 'hypoxia', 'oxygen',
    'chest tightness', 'respiratory failure', 'respiratory distress',
  ],
  gastrointestinal: [
    'nausea', 'vomiting', 'diarrhea', 'abdominal pain', 'gastroenteritis',
    'norovirus', 'rotavirus', 'food poisoning', 'dehydration', 'gi',
    'bloody stool', 'dysentery', 'salmonella', 'e. coli', 'campylobacter',
    'c. diff', 'clostridium',
  ],
  neurological: [
    'headache', 'meningitis', 'encephalitis', 'seizure', 'altered mental status',
    'confusion', 'ams', 'west nile', 'guillain-barre', 'paralysis',
    'paresthesia', 'neck stiffness', 'photophobia', 'eee', 'eastern equine',
  ],
  febrile_rash: [
    'rash', 'fever rash', 'measles', 'rubella', 'varicella', 'chickenpox',
    'mpox', 'monkeypox', 'vesicular', 'maculopapular', 'petechial',
    'exanthem', 'hand foot mouth', 'hfmd',
  ],
  hemorrhagic: [
    'hemorrhagic', 'bleeding', 'ebola', 'marburg', 'hantavirus',
    'dengue hemorrhagic', 'dic', 'disseminated intravascular',
  ],
  sepsis_shock: [
    'sepsis', 'septic shock', 'bacteremia', 'sirs', 'fever', 'febrile',
    'chills', 'rigors', 'hypotension', 'tachycardia', 'lactic acidosis',
    'organ failure',
  ],
  cardiovascular: [
    'myocarditis', 'pericarditis', 'kawasaki', 'endocarditis',
    'rheumatic fever', 'cardiomyopathy',
  ],
  vector_borne: [
    'tick', 'mosquito', 'lyme', 'rocky mountain spotted fever', 'rmsf',
    'ehrlichiosis', 'anaplasmosis', 'babesiosis', 'zika', 'dengue',
    'malaria', 'chikungunya', 'west nile', 'powassan',
  ],
  bioterrorism_sentinel: [
    'anthrax', 'smallpox', 'botulism', 'tularemia', 'plague',
    'viral hemorrhagic', 'ricin', 'q fever',
  ],
}

interface SyndromeMatch {
  category: SyndromeCategory
  score: number
}

/**
 * Map a chief complaint and differential to relevant syndrome categories.
 * Chief complaint keywords are weighted 2x vs differential keywords.
 * Returns categories sorted by match strength.
 */
export function mapToSyndromes(
  chiefComplaint: string,
  differential: string[]
): SyndromeCategory[] {
  const matches: SyndromeMatch[] = []
  const ccLower = chiefComplaint.toLowerCase()
  const diffLower = differential.map((d) => d.toLowerCase())

  for (const [category, keywords] of Object.entries(SYNDROME_KEYWORDS) as [SyndromeCategory, string[]][]) {
    let score = 0

    for (const keyword of keywords) {
      // Chief complaint match = 2 points
      if (ccLower.includes(keyword)) {
        score += 2
      }
      // Differential match = 1 point each
      for (const diff of diffLower) {
        if (diff.includes(keyword)) {
          score += 1
        }
      }
    }

    if (score > 0) {
      matches.push({ category, score })
    }
  }

  // Sort by score descending, return categories only
  return matches
    .sort((a, b) => b.score - a.score)
    .map((m) => m.category)
}
