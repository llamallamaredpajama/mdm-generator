import { useEffect, useRef, useState } from 'react'
import { useMotionValue, animate as fmAnimate, type MotionValue } from 'framer-motion'

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface BrushAnimationConfig {
  step: number
  isEntered: boolean
  prefersReducedMotion: boolean
}

interface BrushAnimationResult {
  progress: MotionValue<number>
  sweepComplete: boolean
}

export function useBrushAnimation({
  step,
  isEntered,
  prefersReducedMotion,
}: BrushAnimationConfig): BrushAnimationResult {
  const progress = useMotionValue(0)
  const [sweepComplete, setSweepComplete] = useState(false)
  const isEnteredRef = useRef(isEntered)

  // Sync ref without triggering the animation effect
  useEffect(() => {
    isEnteredRef.current = isEntered
  }, [isEntered])

  useEffect(() => {
    setSweepComplete(false)
    progress.set(0)

    if (prefersReducedMotion) {
      progress.set(1)
      setSweepComplete(true)
      return
    }

    const duration = isEnteredRef.current ? 2 : 3
    const delay = isEnteredRef.current ? 0.1 : 0.6

    const controls = fmAnimate(progress, 1, {
      duration,
      delay,
      ease: EASE_EXPO,
    })

    controls.then(() => setSweepComplete(true))
    return () => controls.stop()
  }, [step, prefersReducedMotion, progress])

  return { progress, sweepComplete }
}
