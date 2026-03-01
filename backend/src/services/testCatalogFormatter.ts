/**
 * Test Catalog Formatter
 *
 * Builds a compact, token-efficient catalog string for injection into LLM prompts.
 * Groups tests by category with pipe-delimited id|Name pairs (~3 tokens per test).
 */

import type { TestDefinition, TestCategory } from '../types/libraries'

const CATEGORY_HEADERS: Record<TestCategory, string> = {
  labs: 'LABS',
  imaging: 'IMAGING',
  procedures_poc: 'PROCEDURES/POC',
}

const CATEGORY_ORDER: TestCategory[] = ['labs', 'imaging', 'procedures_poc']

/**
 * Build a compact catalog string from the test library.
 *
 * Output format:
 * ```
 * LABS: cbc|CBC, bmp|BMP, troponin|Troponin, ...
 * IMAGING: ct_head|CT Head, cta_chest|CTA Chest, ...
 * PROCEDURES/POC: ecg_12lead|ECG (12-lead), ...
 * ```
 */
export function buildCompactCatalog(tests: TestDefinition[]): string {
  const grouped: Record<TestCategory, TestDefinition[]> = {
    labs: [],
    imaging: [],
    procedures_poc: [],
  }

  for (const test of tests) {
    grouped[test.category].push(test)
  }

  const lines: string[] = []
  for (const category of CATEGORY_ORDER) {
    const items = grouped[category]
    if (items.length === 0) continue
    const entries = items.map((t) => `${t.id}|${t.name}`).join(', ')
    lines.push(`${CATEGORY_HEADERS[category]}: ${entries}`)
  }

  return lines.join('\n')
}
