import type { TestDefinition } from '../../../types/libraries'

const SUBCATEGORY_DISPLAY: Record<string, string> = {
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
  head_neck: 'Head & Neck',
  spine: 'Spine',
  chest: 'Chest',
  abdomen: 'Abdomen',
  soft_tissue: 'Soft Tissue',
  extremity: 'Extremity',
  vascular: 'Vascular',
  miscellaneous: 'Miscellaneous',
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
