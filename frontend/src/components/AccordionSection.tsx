import { useRef, useEffect, useState } from 'react'
import './AccordionSection.css'

type ValidationStatus = 'empty' | 'sparse' | 'complete'

interface AccordionSectionProps {
  id: string
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  validationStatus: ValidationStatus
  children: React.ReactNode
}

export default function AccordionSection({
  id,
  title,
  icon,
  isExpanded,
  onToggle,
  validationStatus,
  children,
}: AccordionSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [children, isExpanded])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  const headerId = `${id}-header`
  const panelId = `${id}-panel`

  return (
    <div
      className={`accordion-section ${isExpanded ? 'accordion-section--expanded' : ''}`}
      data-validation={validationStatus}
    >
      <div
        id={headerId}
        className="accordion-section__header"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
      >
        <span className="accordion-section__icon" aria-hidden="true">
          {icon}
        </span>

        <span className="accordion-section__title">{title}</span>

        <span
          className={`accordion-section__status accordion-section__status--${validationStatus}`}
          aria-label={`Status: ${validationStatus}`}
        />

        <span className="accordion-section__chevron" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      <div
        id={panelId}
        className="accordion-section__panel"
        role="region"
        aria-labelledby={headerId}
        style={{
          height: isExpanded ? contentHeight : 0,
        }}
      >
        <div ref={contentRef} className="accordion-section__content">
          {children}
        </div>
      </div>
    </div>
  )
}
