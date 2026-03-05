interface StepProgressProps {
  currentStep: number
  totalSteps: number
  label: string
}

export default function StepProgress({ currentStep, totalSteps, label }: StepProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="ob-progress">
      <div
        className="ob-progress__bar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="ob-progress__fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="ob-progress__label">
        {label} &mdash; Step {currentStep + 1} of {totalSteps}
      </div>
    </div>
  )
}
