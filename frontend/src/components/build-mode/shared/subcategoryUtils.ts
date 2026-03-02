import type { TestCategory, TestDefinition } from '../../../types/libraries'

export const CATEGORY_ORDER: TestCategory[] = ['labs', 'imaging', 'procedures_poc']

export const CATEGORY_LABELS: Record<TestCategory, string> = {
  labs: 'Labs',
  imaging: 'Imaging',
  procedures_poc: 'Bedside Tests & Procedures',
}

/** Display order for imaging modality subcategories */
export const IMAGING_SUBCATEGORY_ORDER = [
  'xray',
  'ct',
  'ultrasound',
  'mri',
  'fluoroscopy',
  'nuclear_medicine',
] as const

/** MRI sub-section display order (these are subcategory values for MRI tests) */
export const MRI_SUBSECTION_ORDER = [
  'mri_brain_head',
  'mri_neck_vascular',
  'mri_spine',
  'mri_chest',
  'mri_cardiac',
  'mri_abdomen_pelvis',
  'mri_extremity_msk',
  'mri_pediatric',
  'mri_special_protocols',
] as const

const SUBCATEGORY_DISPLAY: Record<string, string> = {
  // Labs (unchanged)
  hematology: 'Hematology',
  chemistry: 'Chemistry',
  cardiac: 'Cardiac',
  genitourinary: 'Genitourinary',
  infectious: 'Infectious',
  inflammatory: 'Inflammatory',
  endocrine: 'Endocrine',
  hepatic: 'Hepatic',
  toxicology: 'Toxicology',
  neurologic: 'Neurologic',
  gastrointestinal: 'Gastrointestinal',
  rheumatologic: 'Rheumatologic',
  obstetric: 'Obstetric',
  pulmonary: 'Pulmonary',
  // Imaging — modality-based
  xray: 'X-ray',
  ct: 'CT',
  ultrasound: 'Ultrasound',
  mri: 'MRI',
  fluoroscopy: 'Fluoroscopy',
  nuclear_medicine: 'Nuclear Medicine',
  // MRI sub-sections
  mri_brain_head: 'Brain / Head',
  mri_neck_vascular: 'Neck / Vascular',
  mri_spine: 'Spine',
  mri_chest: 'Chest',
  mri_cardiac: 'Cardiac',
  mri_abdomen_pelvis: 'Abdomen / Pelvis',
  mri_extremity_msk: 'Extremity / MSK',
  mri_pediatric: 'Pediatric',
  mri_special_protocols: 'Special Protocols',
  // Procedures (unchanged)
  abdominal: 'Abdominal',
  wound: 'Wound',
  point_of_care: 'Point of Care',
  orthopedic: 'Orthopedic',
  airway: 'Airway',
}

export function formatSubcategory(subcategory: string): string {
  return (
    SUBCATEGORY_DISPLAY[subcategory] ??
    subcategory.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

export function groupBySubcategory(tests: TestDefinition[]): Map<string, TestDefinition[]> {
  const map = new Map<string, TestDefinition[]>()
  for (const test of tests) {
    const key = test.subcategory
    const list = map.get(key)
    if (list) list.push(test)
    else map.set(key, [test])
  }
  return map
}

/** Check if a subcategory is an MRI sub-section */
export function isMriSubsection(subcategory: string): boolean {
  return subcategory.startsWith('mri_')
}

/** Group tests by subcategory with explicit ordering */
export function groupBySubcategoryOrdered(
  tests: TestDefinition[],
  order?: readonly string[],
): Map<string, TestDefinition[]> {
  const map = groupBySubcategory(tests)
  if (!order) return map
  const ordered = new Map<string, TestDefinition[]>()
  for (const key of order) {
    const group = map.get(key)
    if (group) ordered.set(key, group)
  }
  // Append any remaining keys not in the order
  for (const [key, group] of map) {
    if (!ordered.has(key)) ordered.set(key, group)
  }
  return ordered
}
