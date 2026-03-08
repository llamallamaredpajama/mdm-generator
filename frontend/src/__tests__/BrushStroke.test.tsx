import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { useMotionValue } from 'framer-motion'
import BrushStroke from '../components/onboarding/BrushStroke'

/** Wrapper provides a real MotionValue so the component can render */
function TestHarness({ step = 0 }) {
  const progress = useMotionValue(1) // fully revealed for static tests
  return <BrushStroke step={step} progress={progress} />
}

describe('BrushStroke', () => {
  it('renders an SVG element with ob-stroke class', () => {
    render(<TestHarness />)
    const svg = document.querySelector('.ob-stroke')
    expect(svg).not.toBeNull()
    expect(svg!.tagName.toLowerCase()).toBe('svg')
  })

  it('applies step-specific class name', () => {
    render(<TestHarness step={2} />)
    expect(document.querySelector('.ob-stroke--2')).not.toBeNull()
  })

  it('has aria-hidden for accessibility', () => {
    render(<TestHarness />)
    const svg = document.querySelector('.ob-stroke')
    expect(svg!.getAttribute('aria-hidden')).toBe('true')
  })

  it('includes SVG filter and clipPath in defs', () => {
    render(<TestHarness />)
    expect(document.querySelector('filter')).not.toBeNull()
    expect(document.querySelector('clipPath')).not.toBeNull()
  })

  it('renders edge and inner path elements', () => {
    render(<TestHarness />)
    const allPaths = document.querySelectorAll('svg path')
    expect(allPaths.length).toBe(2)
  })

  it('generates paths with enough Q segments for organic edges', () => {
    render(<TestHarness />)
    const paths = document.querySelectorAll('svg path')
    const edgeD = paths[0].getAttribute('d')!
    const innerD = paths[1].getAttribute('d')!
    // Each path has top + bottom + left + right edges with Q curves
    // Left/right edges add 12 Q segments each (24 total), plus top/bottom edges
    const edgeQCount = (edgeD.match(/Q /g) || []).length
    const innerQCount = (innerD.match(/Q /g) || []).length
    // Edge path: ~20 top + ~20 bottom + 12 right + 12 left = ~64
    expect(edgeQCount).toBeGreaterThanOrEqual(42)
    // Inner path: ~14 top + ~14 bottom + 12 right + 12 left = ~52
    expect(innerQCount).toBeGreaterThanOrEqual(30)
  })

  it('generates different paths for different steps', () => {
    const { unmount } = render(<TestHarness step={0} />)
    const path0 = document.querySelector('svg path')!.getAttribute('d')
    unmount()

    render(<TestHarness step={1} />)
    const path1 = document.querySelector('svg path')!.getAttribute('d')
    expect(path0).not.toBe(path1)
  })
})
