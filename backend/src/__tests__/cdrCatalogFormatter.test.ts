import { describe, it, expect } from 'vitest'
import { formatCdrContext } from '../services/cdrCatalogFormatter'
import type { CdrSearchResult } from '../services/cdrCatalogSearch'

const makeCdr = (id: string, name: string, category: string): CdrSearchResult => ({
  cdr: {
    id, name, fullName: name, category,
    application: `Application for ${name}`,
    applicableChiefComplaints: ['chest pain'],
    components: [{ id: 'c1', label: 'Component 1', type: 'select', source: 'section1',
      options: [{ label: 'Low', value: 0 }, { label: 'High', value: 2 }] }],
    scoring: { method: 'sum', ranges: [{ min: 0, max: 1, risk: 'Low', interpretation: 'Low risk' }] },
  },
  distance: 0.1,
})

describe('cdrCatalogFormatter', () => {
  it('returns empty string for no results', () => {
    expect(formatCdrContext([])).toBe('')
  })

  it('produces compact index + structured definitions', () => {
    const results = [makeCdr('heart', 'HEART Score', 'CARDIOVASCULAR')]
    const output = formatCdrContext(results)
    expect(output).toContain('heart|HEART Score|CARDIOVASCULAR')
    expect(output).toContain('Application for HEART Score')
    expect(output).toContain('Component 1')
  })

  it('stays under 12000 chars', () => {
    const results = Array.from({ length: 15 }, (_, i) => makeCdr(`cdr_${i}`, `Rule ${i}`, 'TRAUMA'))
    const output = formatCdrContext(results)
    expect(output.length).toBeLessThanOrEqual(12000)
  })
})
