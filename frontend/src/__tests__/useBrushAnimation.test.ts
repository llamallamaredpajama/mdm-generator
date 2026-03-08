import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBrushAnimation } from '../hooks/useBrushAnimation'

describe('useBrushAnimation', () => {
  it('returns progress MotionValue and sweepComplete boolean', () => {
    const { result } = renderHook(() =>
      useBrushAnimation({ step: 0, isEntered: false, prefersReducedMotion: false }),
    )
    expect(result.current.progress).toBeDefined()
    expect(result.current.progress.get).toBeTypeOf('function')
    expect(typeof result.current.sweepComplete).toBe('boolean')
  })

  it('starts with progress at 0 and sweepComplete false', () => {
    const { result } = renderHook(() =>
      useBrushAnimation({ step: 0, isEntered: false, prefersReducedMotion: false }),
    )
    expect(result.current.progress.get()).toBe(0)
    expect(result.current.sweepComplete).toBe(false)
  })

  it('with reduced motion: progress is 1 and sweepComplete is true immediately', () => {
    const { result } = renderHook(() =>
      useBrushAnimation({ step: 0, isEntered: false, prefersReducedMotion: true }),
    )
    expect(result.current.progress.get()).toBe(1)
    expect(result.current.sweepComplete).toBe(true)
  })

  it('resets sweepComplete when step changes', async () => {
    const { result, rerender } = renderHook(
      ({ step }) => useBrushAnimation({ step, isEntered: true, prefersReducedMotion: true }),
      { initialProps: { step: 0 } },
    )
    expect(result.current.sweepComplete).toBe(true)

    rerender({ step: 1 })
    // After rerender with new step, reduced motion still sets it true immediately
    expect(result.current.sweepComplete).toBe(true)
    expect(result.current.progress.get()).toBe(1)
  })
})
