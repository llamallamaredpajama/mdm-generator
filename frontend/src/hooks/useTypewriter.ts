import { useEffect, useRef, useState } from 'react'
import { useMotionValue, animate as fmAnimate } from 'framer-motion'

type Phase = 'idle' | 'room' | 'pause' | 'patient' | 'done'

interface UseTypewriterConfig {
  roomText: string
  patientText: string
  isActive: boolean
  prefersReducedMotion: boolean
  initialDelay?: number
  charSpeed?: number
  pauseBetween?: number
}

interface UseTypewriterResult {
  displayedRoom: string
  displayedPatient: string
  phase: Phase
}

export function useTypewriter({
  roomText,
  patientText,
  isActive,
  prefersReducedMotion,
  initialDelay = 300,
  charSpeed = 65,
  pauseBetween = 400,
}: UseTypewriterConfig): UseTypewriterResult {
  const [displayedRoom, setDisplayedRoom] = useState('')
  const [displayedPatient, setDisplayedPatient] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')

  const roomProgress = useMotionValue(0)
  const patientProgress = useMotionValue(0)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const controlsRef = useRef<ReturnType<typeof fmAnimate> | undefined>(undefined)

  useEffect(() => {
    // Reset state
    roomProgress.set(0)
    patientProgress.set(0)
    setDisplayedRoom('')
    setDisplayedPatient('')
    setPhase('idle')

    if (prefersReducedMotion || !isActive) {
      if (isActive) {
        setDisplayedRoom(roomText)
        setDisplayedPatient(patientText)
        setPhase('done')
      }
      return
    }

    // Subscribe to motion value changes
    const unsubRoom = roomProgress.on('change', (v) => {
      setDisplayedRoom(roomText.slice(0, Math.floor(v)))
    })
    const unsubPatient = patientProgress.on('change', (v) => {
      setDisplayedPatient(patientText.slice(0, Math.floor(v)))
    })

    // Start room typewriter after initial delay
    delayTimerRef.current = setTimeout(() => {
      setPhase('room')
      const roomDuration = (roomText.length * charSpeed * 2) / 1000
      const roomControls = fmAnimate(roomProgress, roomText.length, {
        duration: roomDuration,
        ease: 'linear',
      })
      controlsRef.current = roomControls

      roomControls.then(() => {
        setPhase('pause')
        // Pause between room and patient
        pauseTimerRef.current = setTimeout(() => {
          setPhase('patient')
          const patientDuration = (patientText.length * charSpeed) / 1000
          const patientControls = fmAnimate(patientProgress, patientText.length, {
            duration: patientDuration,
            ease: 'linear',
          })
          controlsRef.current = patientControls
          patientControls.then(() => setPhase('done'))
        }, pauseBetween)
      })
    }, initialDelay)

    return () => {
      unsubRoom()
      unsubPatient()
      controlsRef.current?.stop()
      clearTimeout(pauseTimerRef.current)
      clearTimeout(delayTimerRef.current)
    }
  }, [
    roomText,
    patientText,
    isActive,
    prefersReducedMotion,
    charSpeed,
    initialDelay,
    pauseBetween,
    roomProgress,
    patientProgress,
  ])

  return { displayedRoom, displayedPatient, phase }
}
