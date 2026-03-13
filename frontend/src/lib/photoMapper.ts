/**
 * Encounter photo resolver.
 * Priority: LLM-assigned photo > keyword fallback > default.
 * Photos served from /encounter-photos/{category}/{subcategory}.png
 */

const KEYWORD_MAP: Record<string, { category: string; subcategory: string }> = {
  // Cardiac
  chest: { category: 'cardiac', subcategory: 'chest-pain' },
  palpitation: { category: 'cardiac', subcategory: 'palpitations' },
  syncope: { category: 'cardiac', subcategory: 'syncope' },
  faint: { category: 'cardiac', subcategory: 'syncope' },
  hypertension: { category: 'cardiac', subcategory: 'hypertension' },
  'blood pressure': { category: 'cardiac', subcategory: 'hypertension' },
  cardiac: { category: 'cardiac', subcategory: 'chest-pain' },
  // Dermatology
  laceration: { category: 'dermatology', subcategory: 'laceration' },
  wound: { category: 'dermatology', subcategory: 'wound' },
  cut: { category: 'dermatology', subcategory: 'laceration' },
  rash: { category: 'dermatology', subcategory: 'rash' },
  abscess: { category: 'dermatology', subcategory: 'abscess' },
  burn: { category: 'dermatology', subcategory: 'burn' },
  // ENT
  'sore throat': { category: 'ent', subcategory: 'sore-throat' },
  'ear pain': { category: 'ent', subcategory: 'ear-pain' },
  earache: { category: 'ent', subcategory: 'ear-pain' },
  nosebleed: { category: 'ent', subcategory: 'epistaxis' },
  epistaxis: { category: 'ent', subcategory: 'epistaxis' },
  congestion: { category: 'ent', subcategory: 'congestion' },
  hoarse: { category: 'ent', subcategory: 'hoarseness' },
  // Eye
  'eye pain': { category: 'eye', subcategory: 'eye-pain' },
  'red eye': { category: 'eye', subcategory: 'red-eye' },
  vision: { category: 'eye', subcategory: 'vision-changes' },
  // GI
  abdominal: { category: 'gi', subcategory: 'abdominal-pain' },
  abdomen: { category: 'gi', subcategory: 'abdominal-pain' },
  stomach: { category: 'gi', subcategory: 'abdominal-pain' },
  nausea: { category: 'gi', subcategory: 'nausea-vomiting' },
  vomit: { category: 'gi', subcategory: 'nausea-vomiting' },
  diarrhea: { category: 'gi', subcategory: 'diarrhea' },
  constipat: { category: 'gi', subcategory: 'constipation' },
  'gi bleed': { category: 'gi', subcategory: 'gi-bleed' },
  'rectal bleed': { category: 'gi', subcategory: 'gi-bleed' },
  // Genitourinary
  flank: { category: 'genitourinary', subcategory: 'flank-pain' },
  kidney: { category: 'genitourinary', subcategory: 'flank-pain' },
  renal: { category: 'genitourinary', subcategory: 'flank-pain' },
  hematuria: { category: 'genitourinary', subcategory: 'hematuria' },
  dysuria: { category: 'genitourinary', subcategory: 'dysuria' },
  'urinary retention': { category: 'genitourinary', subcategory: 'urinary-retention' },
  testicular: { category: 'genitourinary', subcategory: 'testicular-pain' },
  // General
  allergic: { category: 'general', subcategory: 'allergic-reaction' },
  allergy: { category: 'general', subcategory: 'allergic-reaction' },
  anaphyl: { category: 'general', subcategory: 'allergic-reaction' },
  fever: { category: 'general', subcategory: 'fever' },
  dehydrat: { category: 'general', subcategory: 'dehydration' },
  fatigue: { category: 'general', subcategory: 'fatigue' },
  sepsis: { category: 'general', subcategory: 'sepsis' },
  // Musculoskeletal
  ankle: { category: 'musculoskeletal', subcategory: 'ankle-pain' },
  knee: { category: 'musculoskeletal', subcategory: 'knee-pain' },
  shoulder: { category: 'musculoskeletal', subcategory: 'shoulder-pain' },
  hip: { category: 'musculoskeletal', subcategory: 'hip-pain' },
  wrist: { category: 'musculoskeletal', subcategory: 'wrist-pain' },
  elbow: { category: 'musculoskeletal', subcategory: 'elbow-pain' },
  'back pain': { category: 'musculoskeletal', subcategory: 'back-pain-thoracolumbar' },
  lumbar: { category: 'musculoskeletal', subcategory: 'back-pain-thoracolumbar' },
  'neck pain': { category: 'musculoskeletal', subcategory: 'back-pain-cervical' },
  cervical: { category: 'musculoskeletal', subcategory: 'back-pain-cervical' },
  foot: { category: 'musculoskeletal', subcategory: 'foot-toe-injury' },
  toe: { category: 'musculoskeletal', subcategory: 'foot-toe-injury' },
  hand: { category: 'musculoskeletal', subcategory: 'hand-finger-injury' },
  finger: { category: 'musculoskeletal', subcategory: 'hand-finger-injury' },
  rib: { category: 'musculoskeletal', subcategory: 'ribs' },
  // Neuro
  headache: { category: 'neuro', subcategory: 'headache' },
  migraine: { category: 'neuro', subcategory: 'headache' },
  dizz: { category: 'neuro', subcategory: 'dizziness' },
  vertigo: { category: 'neuro', subcategory: 'dizziness' },
  seizure: { category: 'neuro', subcategory: 'seizure' },
  stroke: { category: 'neuro', subcategory: 'stroke' },
  weakness: { category: 'neuro', subcategory: 'weakness' },
  numb: { category: 'neuro', subcategory: 'numbness' },
  altered: { category: 'neuro', subcategory: 'altered-mental-status' },
  confused: { category: 'neuro', subcategory: 'altered-mental-status' },
  // OB/GYN
  pelvic: { category: 'obgyn', subcategory: 'pelvic-pain' },
  'vaginal bleed': { category: 'obgyn', subcategory: 'vaginal-bleeding' },
  pregnan: { category: 'obgyn', subcategory: 'pregnancy-concerns' },
  // Psych
  suicid: { category: 'psych', subcategory: 'suicidal-ideation' },
  anxiety: { category: 'psych', subcategory: 'anxiety' },
  depression: { category: 'psych', subcategory: 'depression' },
  agitat: { category: 'psych', subcategory: 'agitation' },
  psychosis: { category: 'psych', subcategory: 'psychosis' },
  'alcohol withdrawal': { category: 'psych', subcategory: 'alcohol-withdrawal' },
  // Respiratory
  shortness: { category: 'respiratory', subcategory: 'shortness-of-breath' },
  dyspnea: { category: 'respiratory', subcategory: 'shortness-of-breath' },
  breathing: { category: 'respiratory', subcategory: 'shortness-of-breath' },
  cough: { category: 'respiratory', subcategory: 'cough' },
  wheez: { category: 'respiratory', subcategory: 'wheezing' },
  asthma: { category: 'respiratory', subcategory: 'asthma-exacerbation' },
  copd: { category: 'respiratory', subcategory: 'copd-exacerbation' },
  pneumonia: { category: 'respiratory', subcategory: 'pneumonia' },
  // Toxicology
  overdose: { category: 'toxicology', subcategory: 'overdose' },
  intoxicat: { category: 'toxicology', subcategory: 'intoxication' },
  ingestion: { category: 'toxicology', subcategory: 'toxic-exposure' },
  // Trauma
  fall: { category: 'trauma', subcategory: 'fall' },
  mva: { category: 'trauma', subcategory: 'mva' },
  'motor vehicle': { category: 'trauma', subcategory: 'mva' },
  assault: { category: 'trauma', subcategory: 'assault' },
  stab: { category: 'trauma', subcategory: 'penetrating-injury' },
  gunshot: { category: 'trauma', subcategory: 'penetrating-injury' },
  'head injury': { category: 'trauma', subcategory: 'head-injury' },
  concussion: { category: 'trauma', subcategory: 'head-injury' },
  // Environmental
  bite: { category: 'environmental', subcategory: 'animal-bite' },
  snake: { category: 'environmental', subcategory: 'snake-bite' },
  sting: { category: 'environmental', subcategory: 'insect-bite' },
  drown: { category: 'environmental', subcategory: 'drowning' },
  hypotherm: { category: 'environmental', subcategory: 'hypothermia' },
  hypertherm: { category: 'environmental', subcategory: 'hyperthermia' },
  'heat stroke': { category: 'environmental', subcategory: 'hyperthermia' },
  // Foreign body
  'foreign body': { category: 'foreign-body', subcategory: 'fb-skin' },
  'swallowed object': { category: 'foreign-body', subcategory: 'fb-esophagus' },
}

const DEFAULT_PHOTO = '/encounter-photos/general/unspecified.png'

/**
 * Returns the editorial photo path for an encounter card.
 * Priority: LLM-assigned photo > keyword fallback > default.
 */
export function getEncounterPhoto(
  chiefComplaint: string,
  encounterPhoto?: { category: string; subcategory: string },
): string {
  // 1. LLM-assigned photo (highest priority)
  if (encounterPhoto) {
    return `/encounter-photos/${encounterPhoto.category}/${encounterPhoto.subcategory}.png`
  }

  // 2. Keyword fallback
  if (chiefComplaint) {
    const lower = chiefComplaint.toLowerCase()
    for (const [keyword, photo] of Object.entries(KEYWORD_MAP)) {
      if (lower.includes(keyword)) {
        return `/encounter-photos/${photo.category}/${photo.subcategory}.png`
      }
    }
  }

  // 3. Default
  return DEFAULT_PHOTO
}
