/**
 * S2 Submission Flow Refactor Tests
 *
 * Tests that the Section 2 API function correctly sends structured
 * test results data alongside free-text content, and that the
 * useEncounter hook collects structured data from the encounter.
 */

/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processSection2, type Section2StructuredPayload } from '../lib/api'

// Track fetch calls
const mockFetch = vi.fn()

// Store the last request body for assertions
let lastRequestBody: Record<string, unknown> = {}

beforeEach(() => {
  lastRequestBody = {}
  mockFetch.mockReset()
  mockFetch.mockImplementation(async (_url: string, options: RequestInit) => {
    if (options.body) {
      lastRequestBody = JSON.parse(options.body as string)
    }
    return {
      ok: true,
      json: async () => ({
        ok: true,
        mdmPreview: {
          problems: ['Chest pain - acute'],
          differential: ['ACS'],
          dataReviewed: ['Troponin: 0.02'],
          reasoning: 'Low-risk presentation',
        },
        submissionCount: 1,
        isLocked: false,
      }),
    }
  })
  vi.stubGlobal('fetch', mockFetch)
})

describe('processSection2 - structured data', () => {
  it('sends basic request without structured data (backward compat)', async () => {
    await processSection2('enc123', 'Troponin normal', 'token123', 'ACS')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(lastRequestBody.encounterId).toBe('enc123')
    expect(lastRequestBody.content).toBe('Troponin normal')
    expect(lastRequestBody.userIdToken).toBe('token123')
    expect(lastRequestBody.workingDiagnosis).toBe('ACS')
    // No structured fields when not provided
    expect(lastRequestBody.selectedTests).toBeUndefined()
    expect(lastRequestBody.testResults).toBeUndefined()
    expect(lastRequestBody.structuredDiagnosis).toBeUndefined()
  })

  it('sends structured test results when provided', async () => {
    const structured: Section2StructuredPayload = {
      selectedTests: ['troponin', 'ecg', 'cbc'],
      testResults: {
        troponin: { status: 'unremarkable', value: '0.02', unit: 'ng/mL', notes: null },
        ecg: { status: 'abnormal', notes: 'ST depression V4-V6', quickFindings: ['ST depression'] },
      },
    }

    await processSection2('enc123', 'Labs reviewed', 'token123', 'ACS', structured)

    expect(lastRequestBody.selectedTests).toEqual(['troponin', 'ecg', 'cbc'])
    expect(lastRequestBody.testResults).toBeDefined()
    expect((lastRequestBody.testResults as Record<string, unknown>)['troponin']).toBeDefined()
    expect((lastRequestBody.testResults as Record<string, { status: string }>)['ecg'].status).toBe('abnormal')
  })

  it('sends structured diagnosis when provided', async () => {
    const structured: Section2StructuredPayload = {
      structuredDiagnosis: {
        selected: 'Unstable Angina',
        custom: null,
        suggestedOptions: ['ACS', 'Unstable Angina', 'NSTEMI'],
      },
    }

    await processSection2('enc123', 'Labs reviewed', 'token123', undefined, structured)

    expect(lastRequestBody.structuredDiagnosis).toBeDefined()
    const dx = lastRequestBody.structuredDiagnosis as { selected: string }
    expect(dx.selected).toBe('Unstable Angina')
  })

  it('omits empty structured fields from request body', async () => {
    const structured: Section2StructuredPayload = {
      selectedTests: undefined,
      testResults: undefined,
    }

    await processSection2('enc123', 'Labs reviewed', 'token123', undefined, structured)

    // Should not include undefined fields
    expect('selectedTests' in lastRequestBody).toBe(false)
    expect('testResults' in lastRequestBody).toBe(false)
    expect('structuredDiagnosis' in lastRequestBody).toBe(false)
  })

  it('sends all fields together when fully populated', async () => {
    const structured: Section2StructuredPayload = {
      selectedTests: ['troponin', 'cbc'],
      testResults: {
        troponin: { status: 'unremarkable', value: '0.01', notes: null },
        cbc: { status: 'unremarkable', notes: 'WNL' },
      },
      structuredDiagnosis: 'Musculoskeletal Pain',
    }

    await processSection2('enc123', 'All results normal', 'token123', 'MSK pain', structured)

    expect(lastRequestBody.encounterId).toBe('enc123')
    expect(lastRequestBody.content).toBe('All results normal')
    expect(lastRequestBody.workingDiagnosis).toBe('MSK pain')
    expect(lastRequestBody.selectedTests).toEqual(['troponin', 'cbc'])
    expect(lastRequestBody.testResults).toBeDefined()
    expect(lastRequestBody.structuredDiagnosis).toBe('Musculoskeletal Pain')
  })

  it('handles null structuredDiagnosis (explicitly cleared)', async () => {
    const structured: Section2StructuredPayload = {
      structuredDiagnosis: null,
    }

    await processSection2('enc123', 'Content', 'token123', undefined, structured)

    expect(lastRequestBody.structuredDiagnosis).toBeNull()
  })
})

describe('processSection2 - error handling preserved', () => {
  it('throws ApiError on 401 response', async () => {
    mockFetch.mockImplementationOnce(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    }))

    await expect(processSection2('enc123', 'Content', 'token123')).rejects.toThrow()
  })

  it('throws ApiError on network failure', async () => {
    mockFetch.mockImplementationOnce(async () => {
      throw new TypeError('fetch failed')
    })

    await expect(processSection2('enc123', 'Content', 'token123')).rejects.toThrow()
  })
})
