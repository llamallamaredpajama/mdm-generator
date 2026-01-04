import * as React from 'react'
import './EnhancedTextarea.css'

export interface EnhancedTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  /** Unique identifier for the textarea */
  id: string
  /** Label text displayed above the textarea */
  label: string
  /** Current value (controlled) */
  value: string
  /** Change handler receiving the new value */
  onChange: (value: string) => void
  /** Helper text displayed below the textarea (persistent, not placeholder) */
  helperText?: string
  /** Maximum character limit */
  maxLength?: number
  /** Minimum height in pixels */
  minHeight?: number
  /** Maximum height in pixels (for autogrow) */
  maxHeight?: number
  /** Whether the field is required */
  required?: boolean
  /** Whether to show character count */
  showCharCount?: boolean
  /** Whether to auto-grow based on content */
  autoGrow?: boolean
  /** Additional CSS class */
  className?: string
}

export const EnhancedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  EnhancedTextareaProps
>(
  (
    {
      id,
      label,
      value,
      onChange,
      helperText,
      maxLength,
      minHeight = 80,
      maxHeight = 300,
      required = false,
      showCharCount = false,
      autoGrow = true,
      className = '',
      placeholder,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Forward ref
    React.useImperativeHandle(ref, () => textareaRef.current!, [])

    // Auto-resize logic
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea || !autoGrow) return

      // Reset height to measure scroll height
      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight)
      )
      textarea.style.height = `${newHeight}px`
    }, [minHeight, maxHeight, autoGrow])

    // Adjust height when value changes
    React.useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    // Handle window resize
    React.useEffect(() => {
      if (!autoGrow) return
      const handleResize = () => adjustHeight()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [adjustHeight, autoGrow])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value

      // Enforce max length if specified
      if (maxLength && newValue.length > maxLength) {
        return
      }

      onChange(newValue)
    }

    const characterCount = value.length
    const isNearLimit = maxLength && characterCount >= maxLength * 0.9
    const isAtLimit = maxLength && characterCount >= maxLength

    const countId = `${id}-count`

    return (
      <div className={`enhanced-textarea ${className}`}>
        <label
          htmlFor={id}
          className={`enhanced-textarea__label ${required ? 'enhanced-textarea__label--required' : ''}`}
        >
          {label}
        </label>

        <div className="enhanced-textarea__wrapper">
          <textarea
            ref={textareaRef}
            id={id}
            className="enhanced-textarea__input"
            style={{
              minHeight: `${minHeight}px`,
              maxHeight: autoGrow ? `${maxHeight}px` : undefined,
              resize: autoGrow ? 'none' : 'vertical',
            }}
            value={value}
            onChange={handleChange}
            placeholder={placeholder || helperText}
            required={required}
            aria-required={required}
            aria-describedby={showCharCount && maxLength ? countId : undefined}
            aria-invalid={isAtLimit || undefined}
            {...props}
          />

          {showCharCount && maxLength && (
            <div
              id={countId}
              className={`enhanced-textarea__count ${
                isAtLimit
                  ? 'enhanced-textarea__count--error'
                  : isNearLimit
                    ? 'enhanced-textarea__count--warning'
                    : ''
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {characterCount} / {maxLength}
            </div>
          )}
        </div>
      </div>
    )
  }
)

EnhancedTextarea.displayName = 'EnhancedTextarea'

export default EnhancedTextarea
