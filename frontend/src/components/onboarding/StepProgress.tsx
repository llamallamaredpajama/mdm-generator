interface StepProgressProps {
  currentStep: number
  totalSteps: number
}

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div
      className="ob-progress-scratch"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="ob-progress-scratch__track" />
      <div className="ob-progress-scratch__fill" style={{ width: `${progress}%` }} />
    </div>
  )
}
