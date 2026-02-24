/**
 * ResultEntry Component Tests
 *
 * Tests result entry card rendering, status selection, CDR badges,
 * expanded detail view, quick findings, and value input.
 */

/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ResultEntry from '../components/build-mode/shared/ResultEntry'
import type { TestDefinition } from '../types/libraries'

// --- Test fixtures ---

const troponinTest: TestDefinition = {
  id: 'troponin',
  name: 'Troponin',
  category: 'labs',
  subcategory: 'cardiac',
  commonIndications: ['chest pain'],
  unit: 'ng/mL',
  normalRange: '<0.04',
  quickFindings: ['Elevated', 'Trending up', 'Trending down'],
  feedsCdrs: ['heart'],
}

const ctHeadTest: TestDefinition = {
  id: 'ct_head',
  name: 'CT Head',
  category: 'imaging',
  subcategory: 'neuro',
  commonIndications: ['headache', 'head injury'],
  unit: null,
  normalRange: null,
  quickFindings: ['No acute intracranial abnormality', 'SDH', 'SAH', 'Fracture'],
  feedsCdrs: [],
}

const cbcTest: TestDefinition = {
  id: 'cbc',
  name: 'CBC',
  category: 'labs',
  subcategory: 'hematology',
  commonIndications: ['infection', 'anemia'],
  unit: null,
  normalRange: null,
  quickFindings: ['Elevated WBC', 'Low Hgb', 'Low Platelets', 'Bandemia'],
  feedsCdrs: [],
}

const ecgTest: TestDefinition = {
  id: 'ecg',
  name: 'ECG',
  category: 'procedures_poc',
  subcategory: 'cardiac',
  commonIndications: ['chest pain'],
  unit: null,
  normalRange: null,
  quickFindings: null,
  feedsCdrs: ['heart'],
}

describe('ResultEntry', () => {
  it('renders test name and category badge', () => {
    render(
      <ResultEntry
        testDef={troponinTest}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByText('Troponin')).toBeDefined()
    expect(screen.getByText('Lab')).toBeDefined()
  })

  it('shows CDR badge when test feeds active CDR', () => {
    render(
      <ResultEntry
        testDef={troponinTest}
        result={undefined}
        activeCdrNames={['HEART Score']}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByText('HEART Score')).toBeDefined()
  })

  it('does not show CDR badge when no active CDRs matched', () => {
    render(
      <ResultEntry
        testDef={ctHeadTest}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    const badges = screen.queryAllByText(/HEART|Wells/)
    expect(badges.length).toBe(0)
  })

  it('shows CDR warning when test is pending and feeds CDR', () => {
    render(
      <ResultEntry
        testDef={troponinTest}
        result={undefined}
        activeCdrNames={['HEART Score']}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByText('Value needed for HEART Score')).toBeDefined()
  })

  it('clicking Unremarkable calls onResultChange with status unremarkable', () => {
    const onResultChange = vi.fn()
    render(
      <ResultEntry
        testDef={cbcTest}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={onResultChange}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: /Unremarkable/ }))
    expect(onResultChange).toHaveBeenCalledTimes(1)
    expect(onResultChange).toHaveBeenCalledWith('cbc', expect.objectContaining({
      status: 'unremarkable',
    }))
  })

  it('clicking Abnormal expands detail area', () => {
    const onResultChange = vi.fn()
    render(
      <ResultEntry
        testDef={cbcTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={onResultChange}
      />
    )

    // Detail area should be present when status is abnormal
    expect(screen.getByTestId('result-detail-cbc')).toBeDefined()
  })

  it('does not show detail area for unremarkable results', () => {
    render(
      <ResultEntry
        testDef={cbcTest}
        result={{ status: 'unremarkable', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.queryByTestId('result-detail-cbc')).toBeNull()
  })

  it('shows quick findings checkboxes for tests with quickFindings', () => {
    render(
      <ResultEntry
        testDef={cbcTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByText('Elevated WBC')).toBeDefined()
    expect(screen.getByText('Low Hgb')).toBeDefined()
    expect(screen.getByText('Low Platelets')).toBeDefined()
    expect(screen.getByText('Bandemia')).toBeDefined()
  })

  it('toggling a quick finding calls onResultChange with updated quickFindings', () => {
    const onResultChange = vi.fn()
    render(
      <ResultEntry
        testDef={cbcTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={onResultChange}
      />
    )

    // Click the "Elevated WBC" checkbox label
    fireEvent.click(screen.getByText('Elevated WBC'))
    expect(onResultChange).toHaveBeenCalledWith('cbc', expect.objectContaining({
      quickFindings: ['Elevated WBC'],
    }))
  })

  it('free-text notes field works in expanded view', () => {
    const onResultChange = vi.fn()
    render(
      <ResultEntry
        testDef={cbcTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={onResultChange}
      />
    )

    const notesInput = screen.getByLabelText(`Notes for ${cbcTest.name}`)
    fireEvent.change(notesInput, { target: { value: 'WBC 18.5' } })
    expect(onResultChange).toHaveBeenCalledWith('cbc', expect.objectContaining({
      notes: 'WBC 18.5',
    }))
  })

  it('pending state renders correctly with no radio selected', () => {
    render(
      <ResultEntry
        testDef={cbcTest}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    const unremarkableRadio = screen.getByRole('radio', { name: /Unremarkable/ })
    const abnormalRadio = screen.getByRole('radio', { name: /Abnormal/ })
    expect(unremarkableRadio.getAttribute('aria-checked')).toBe('false')
    expect(abnormalRadio.getAttribute('aria-checked')).toBe('false')
  })

  it('shows value input for tests with unit', () => {
    render(
      <ResultEntry
        testDef={troponinTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: 'ng/mL' }}
        activeCdrNames={['HEART Score']}
        onResultChange={vi.fn()}
      />
    )

    const valueInput = screen.getByLabelText(`Value for ${troponinTest.name}`)
    expect(valueInput).toBeDefined()
    expect(screen.getByText('ng/mL')).toBeDefined()
  })

  it('value input calls onResultChange with updated value', () => {
    const onResultChange = vi.fn()
    render(
      <ResultEntry
        testDef={troponinTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: 'ng/mL' }}
        activeCdrNames={['HEART Score']}
        onResultChange={onResultChange}
      />
    )

    const valueInput = screen.getByLabelText(`Value for ${troponinTest.name}`)
    fireEvent.change(valueInput, { target: { value: '0.15' } })
    expect(onResultChange).toHaveBeenCalledWith('troponin', expect.objectContaining({
      value: '0.15',
    }))
  })

  it('does not show quick findings for tests without them', () => {
    render(
      <ResultEntry
        testDef={ecgTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={['HEART Score']}
        onResultChange={vi.fn()}
      />
    )

    // ECG has null quickFindings, so no findings section
    expect(screen.queryByText('Findings')).toBeNull()
  })

  it('shows Procedure category for procedures_poc tests', () => {
    render(
      <ResultEntry
        testDef={ecgTest}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    expect(screen.getByText('Procedure')).toBeDefined()
  })

  it('applies correct status class modifiers', () => {
    const { container, rerender } = render(
      <ResultEntry
        testDef={cbcTest}
        result={undefined}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )

    // Pending state
    expect(container.querySelector('.result-entry--pending')).not.toBeNull()

    // Unremarkable state
    rerender(
      <ResultEntry
        testDef={cbcTest}
        result={{ status: 'unremarkable', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )
    expect(container.querySelector('.result-entry--unremarkable')).not.toBeNull()

    // Abnormal state
    rerender(
      <ResultEntry
        testDef={cbcTest}
        result={{ status: 'abnormal', quickFindings: [], notes: null, value: null, unit: null }}
        activeCdrNames={[]}
        onResultChange={vi.fn()}
      />
    )
    expect(container.querySelector('.result-entry--abnormal')).not.toBeNull()
  })
})
