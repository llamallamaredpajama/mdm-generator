/**
 * Keyword-to-photo mapping for encounter cards.
 * Keys are lowercased substrings matched against the chief complaint.
 * Photos are served from /encounter-photos/ (public directory).
 */
const PHOTO_MAP: Record<string, string> = {
  chest: '/encounter-photos/chest-pain.png',
  abdominal: '/encounter-photos/abdominal-pain.png',
  abdomen: '/encounter-photos/abdominal-pain.png',
  stomach: '/encounter-photos/abdominal-pain.png',
  shortness: '/encounter-photos/shortness-breath.png',
  dyspnea: '/encounter-photos/shortness-breath.png',
  breathing: '/encounter-photos/shortness-breath.png',
  head: '/encounter-photos/head-injury.png',
  concussion: '/encounter-photos/head-injury.png',
  back: '/encounter-photos/back-pain.png',
  lumbar: '/encounter-photos/back-pain.png',
  spine: '/encounter-photos/back-pain.png',
  syncope: '/encounter-photos/syncope.png',
  faint: '/encounter-photos/syncope.png',
  dizz: '/encounter-photos/syncope.png',
  fever: '/encounter-photos/fever-cough.png',
  cough: '/encounter-photos/fever-cough.png',
  flu: '/encounter-photos/fever-cough.png',
  laceration: '/encounter-photos/laceration-hand.png',
  wound: '/encounter-photos/laceration-hand.png',
  cut: '/encounter-photos/laceration-hand.png',
  flank: '/encounter-photos/flank-pain.png',
  kidney: '/encounter-photos/flank-pain.png',
  renal: '/encounter-photos/flank-pain.png',
  ankle: '/encounter-photos/ankle-injury.png',
  foot: '/encounter-photos/ankle-injury.png',
  altered: '/encounter-photos/altered-mental.png',
  confused: '/encounter-photos/altered-mental.png',
  mental: '/encounter-photos/altered-mental.png',
  allergic: '/encounter-photos/allergic-reaction.png',
  allergy: '/encounter-photos/allergic-reaction.png',
  anaphyl: '/encounter-photos/allergic-reaction.png',
}

const DEFAULT_PHOTO = '/encounter-photos/default.png'

/**
 * Returns the editorial photo path for a chief complaint.
 * Matches keywords in the complaint string (case-insensitive).
 * Falls back to default.png if no keyword matches.
 */
export function getEncounterPhoto(chiefComplaint: string): string {
  if (!chiefComplaint) return DEFAULT_PHOTO
  const lower = chiefComplaint.toLowerCase()
  for (const [keyword, photo] of Object.entries(PHOTO_MAP)) {
    if (lower.includes(keyword)) return photo
  }
  return DEFAULT_PHOTO
}
