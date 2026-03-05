import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/firebase'
import { completeOnboarding } from '../lib/api'
import { useTrendAnalysisContext } from '../contexts/TrendAnalysisContext'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import StepProgress from '../components/onboarding/StepProgress'
import StepLimitations from '../components/onboarding/StepLimitations'
import StepCredentials from '../components/onboarding/StepCredentials'
import StepSurveillanceLocation from '../components/onboarding/StepSurveillanceLocation'
import StepPlanSelection from '../components/onboarding/StepPlanSelection'
import StepOrientation from '../components/onboarding/StepOrientation'
import './Onboarding.css'

const STEP_LABELS = ['Limitations', 'Credentials', 'Location', 'Plans', 'Get Started']

/** Per-step brushstroke strip configs: [image, top%, height%, flip?] */
const STEP_STROKES: [string, number, number, boolean?][][] = [
  // Step 0 — Limitations: title+subtitle, 4 bullets, checkbox+nav
  [
    ['/bg/stroke-1.png', -8, 36], // title + subtitle
    ['/bg/stroke-2.png', 16, 50], // bullet list (overlaps strip 1)
    ['/bg/stroke-4.png', 52, 56, true], // checkbox + nav (generous)
  ],
  // Step 1 — Credentials: title+subtitle, name input, pills+nav
  [
    ['/bg/stroke-4.png', -8, 38], // title + subtitle
    ['/bg/stroke-1.png', 18, 38, true], // name field
    ['/bg/stroke-2.png', 42, 66], // credential pills + nav
  ],
  // Step 2 — Surveillance: title+subtitle, dropdowns, helper+nav
  [
    ['/bg/stroke-1.png', -8, 38], // title + subtitle
    ['/bg/stroke-3.png', 20, 40, true], // fields
    ['/bg/stroke-4.png', 46, 62], // helper + nav
  ],
  // Step 3 — Plans: title+subtitle, plan cards, badges+nav
  [
    ['/bg/stroke-2.png', -8, 30, true], // title + subtitle
    ['/bg/stroke-3.png', 14, 52], // plan cards
    ['/bg/stroke-1.png', 52, 56], // badges + nav
  ],
  // Step 4 — Orientation: title+subtitle, mode cards, demo+nav
  [
    ['/bg/stroke-4.png', -8, 30], // title + subtitle
    ['/bg/stroke-1.png', 12, 40, true], // mode cards
    ['/bg/stroke-2.png', 40, 68], // demo + nav
  ],
]

export interface WizardData {
  acknowledged: boolean
  displayName: string
  credentialType: 'MD' | 'DO' | 'NP' | 'PA' | null
  surveillanceLocation: { state?: string; zipCode?: string } | null
}

export default function Onboarding() {
  const { user, authLoading, onboardingCompleted, refreshOnboardingStatus } = useAuth()
  const { setLocation, setEnabled } = useTrendAnalysisContext()
  const navigate = useNavigate()
  const prefersReducedMotion = usePrefersReducedMotion()

  const [step, setStep] = useState(0)
  const [displayStep, setDisplayStep] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [dissolveComplete, setDissolveComplete] = useState(false)
  const [entered, setEntered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WizardData>({
    acknowledged: false,
    displayName: user?.displayName ?? '',
    credentialType: null,
    surveillanceLocation: null,
  })
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const changeStep = useCallback(
    (newStep: number) => {
      if (prefersReducedMotion) {
        setStep(newStep)
        setDisplayStep(newStep)
        return
      }
      setStep(newStep)
      setTransitioning(true)
      setDissolveComplete(false)
      transitionTimer.current = setTimeout(() => {
        setDisplayStep(newStep)
        setTransitioning(false)
      }, 400)
    },
    [prefersReducedMotion],
  )

  useEffect(() => {
    // Mark entrance animation complete so subsequent steps skip the intro delay
    const t = setTimeout(() => setEntered(true), 3500)
    return () => {
      clearTimeout(t)
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
    }
  }, [])

  const goNext = useCallback(() => {
    changeStep(Math.min(step + 1, STEP_LABELS.length - 1))
  }, [step, changeStep])

  const goBack = useCallback(() => {
    changeStep(Math.max(step - 1, 0))
  }, [step, changeStep])

  const handleComplete = useCallback(async () => {
    if (!user || !data.credentialType || !data.displayName.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const token = await user.getIdToken()
      await completeOnboarding(token, {
        displayName: data.displayName.trim(),
        credentialType: data.credentialType,
        surveillanceLocation: data.surveillanceLocation ?? undefined,
        acknowledgedLimitations: true,
      })

      if (data.surveillanceLocation) {
        setLocation(data.surveillanceLocation)
        setEnabled(true)
      }

      refreshOnboardingStatus()
      navigate('/compose', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [data, user, navigate, refreshOnboardingStatus, setLocation, setEnabled])

  const handleDissolveEnd = useCallback(() => {
    setDissolveComplete(true)
  }, [])

  // Wait for Firebase to restore session
  if (authLoading) {
    return null
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Already onboarded
  if (onboardingCompleted === true) {
    return <Navigate to="/compose" replace />
  }

  const canContinue = (() => {
    switch (step) {
      case 0:
        return data.acknowledged
      case 1:
        return data.displayName.trim().length > 0 && data.credentialType !== null
      case 2:
        return true // surveillance location is optional
      case 3:
        return true // informational only
      case 4:
        return true
      default:
        return false
    }
  })()

  const renderStep = () => {
    switch (displayStep) {
      case 0:
        return <StepLimitations data={data} updateData={updateData} />
      case 1:
        return <StepCredentials data={data} updateData={updateData} />
      case 2:
        return <StepSurveillanceLocation data={data} updateData={updateData} />
      case 3:
        return <StepPlanSelection />
      case 4:
        return <StepOrientation />
      default:
        return null
    }
  }

  const isLastStep = step === STEP_LABELS.length - 1
  const dissolveClass = transitioning
    ? 'ob-dissolve-out'
    : dissolveComplete
      ? 'ob-dissolve-done'
      : 'ob-dissolve-in'

  return (
    <div className={`onboarding${entered ? ' onboarding--entered' : ''}`}>
      {/* Blurred ER photo background (static) */}
      <div className="onboarding__photo-bg">
        <img src="/bg/Gemini_Generated_Image_vl9d8lvl9d8lvl9d.jpg" alt="" loading="eager" />
      </div>
      <div className="onboarding__photo-overlay" />

      {/* CRT scanlines */}
      <div className="onboarding__scanlines" />

      {/* Brand in corner */}
      <div className="onboarding__brand">
        <span className="onboarding__brand-ai">ai</span>MDM
        <span className="onboarding__brand-dot">.</span>
      </div>

      {/* Content — centered, no card wrapper */}
      <div className="onboarding__content">
        <div className="onboarding__inner">
          {/* Per-step brushstroke strips — positioned behind text */}
          <div className="ob-strokes" key={`strokes-${displayStep}`} aria-hidden="true">
            {(STEP_STROKES[displayStep] ?? []).map(([src, top, height, flip], i) => (
              <img
                key={`${displayStep}-${i}`}
                className={`ob-strokes__strip${entered ? ' ob-strokes__strip--instant' : ''}`}
                src={src}
                alt=""
                loading="eager"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  animationDelay: entered ? `${i * 0.15}s` : `${0.3 + i * 0.4}s`,
                  transform: flip ? 'scaleX(-1)' : undefined,
                }}
              />
            ))}
          </div>

          <div
            className={`onboarding__step-content ${dissolveClass}`}
            key={displayStep}
            onAnimationEnd={handleDissolveEnd}
          >
            {renderStep()}
          </div>

          {error && (
            <div className="onboarding__error" role="alert">
              {error}
            </div>
          )}

          <div className={`onboarding__nav${transitioning ? ' onboarding__nav--faded' : ''}`}>
            {step > 0 ? (
              <button
                className="onboarding__btn onboarding__btn--back"
                onClick={goBack}
                disabled={transitioning}
                type="button"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {isLastStep ? (
              <button
                className="onboarding__btn onboarding__btn--primary"
                onClick={handleComplete}
                disabled={submitting || transitioning}
                type="button"
              >
                {submitting ? 'Setting up...' : 'Get Started'}
              </button>
            ) : (
              <button
                className="onboarding__btn onboarding__btn--primary"
                onClick={goNext}
                disabled={!canContinue || transitioning}
                type="button"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar — fixed bottom, full width */}
      <StepProgress currentStep={step} totalSteps={STEP_LABELS.length} />
    </div>
  )
}
