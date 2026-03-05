import { useState, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/firebase'
import { completeOnboarding } from '../lib/api'
import { useTrendAnalysisContext } from '../contexts/TrendAnalysisContext'
import StepProgress from '../components/onboarding/StepProgress'
import StepLimitations from '../components/onboarding/StepLimitations'
import StepCredentials from '../components/onboarding/StepCredentials'
import StepSurveillanceLocation from '../components/onboarding/StepSurveillanceLocation'
import StepPlanSelection from '../components/onboarding/StepPlanSelection'
import StepOrientation from '../components/onboarding/StepOrientation'
import './Onboarding.css'

const STEP_LABELS = ['Limitations', 'Credentials', 'Location', 'Plans', 'Get Started']

export interface WizardData {
  acknowledged: boolean
  displayName: string
  credentialType: 'MD' | 'DO' | 'NP' | 'PA' | null
  surveillanceLocation: { state?: string; zipCode?: string } | null
}

export default function Onboarding() {
  const { user, onboardingCompleted, refreshOnboardingStatus } = useAuth()
  const { setLocation, setEnabled } = useTrendAnalysisContext()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WizardData>({
    acknowledged: false,
    displayName: user?.displayName ?? '',
    credentialType: null,
    surveillanceLocation: null,
  })

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const goNext = useCallback(() => {
    setDirection('forward')
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
  }, [])

  const goBack = useCallback(() => {
    setDirection('back')
    setStep((s) => Math.max(s - 1, 0))
  }, [])

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

      // Sync surveillance location to TrendAnalysisContext
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
    switch (step) {
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

  return (
    <div className="onboarding">
      {/* Background with Ken Burns */}
      <div className="onboarding__bg" />
      <div className="onboarding__bg-overlay" />

      {/* CRT scanlines */}
      <div className="onboarding__scanlines" />

      {/* Brand in corner */}
      <div className="onboarding__brand">
        <span className="onboarding__brand-ai">ai</span>MDM
        <span className="onboarding__brand-dot">.</span>
      </div>

      {/* Wizard card */}
      <div className="onboarding__card">
        <StepProgress
          currentStep={step}
          totalSteps={STEP_LABELS.length}
          label={STEP_LABELS[step]}
        />

        <div
          className={`onboarding__step-content onboarding__step-content--${direction}`}
          key={step}
        >
          {renderStep()}
        </div>

        {error && (
          <div className="onboarding__error" role="alert">
            {error}
          </div>
        )}

        <div className="onboarding__nav">
          {step > 0 ? (
            <button
              className="onboarding__btn onboarding__btn--back"
              onClick={goBack}
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
              disabled={submitting}
              type="button"
            >
              {submitting ? 'Setting up...' : 'Get Started'}
            </button>
          ) : (
            <button
              className="onboarding__btn onboarding__btn--primary"
              onClick={goNext}
              disabled={!canContinue}
              type="button"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
