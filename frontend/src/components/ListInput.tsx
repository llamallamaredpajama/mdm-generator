import { useCallback, useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import './ListInput.css'

interface ListInputProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  maxItems?: number
  label: string
}

export function ListInput({
  items,
  onChange,
  placeholder,
  maxItems = 10,
  label,
}: ListInputProps) {
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)

  const handleItemChange = useCallback(
    (index: number, value: string) => {
      const newItems = [...items]
      newItems[index] = value
      onChange(newItems)
    },
    [items, onChange]
  )

  const handleRemoveItem = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index)
      onChange(newItems.length > 0 ? newItems : [''])
    },
    [items, onChange]
  )

  const handleAddItem = useCallback(() => {
    if (items.length < maxItems) {
      onChange([...items, ''])
      // Focus the new input after render
      requestAnimationFrame(() => {
        const inputs = listRef.current?.querySelectorAll('input')
        if (inputs && inputs.length > 0) {
          inputs[inputs.length - 1].focus()
        }
      })
    }
  }, [items, maxItems, onChange])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (items.length < maxItems) {
          handleAddItem()
        }
      } else if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
        e.preventDefault()
        handleRemoveItem(index)
        // Focus previous input
        requestAnimationFrame(() => {
          const inputs = listRef.current?.querySelectorAll('input')
          if (inputs && index > 0) {
            inputs[index - 1].focus()
          }
        })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const inputs = listRef.current?.querySelectorAll('input')
        if (inputs && index < inputs.length - 1) {
          inputs[index + 1].focus()
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const inputs = listRef.current?.querySelectorAll('input')
        if (inputs && index > 0) {
          inputs[index - 1].focus()
        }
      }
    },
    [items, maxItems, handleAddItem, handleRemoveItem]
  )

  const canAddMore = items.length < maxItems
  const labelId = `${baseId}-label`

  return (
    <div className="list-input" ref={listRef}>
      <span id={labelId} className="list-input__label">
        {label}
      </span>
      <ul
        className="list-input__items"
        role="list"
        aria-labelledby={labelId}
      >
        {items.map((item, index) => {
          const inputId = `${baseId}-item-${index}`
          return (
            <li key={index} className="list-input__item">
              <input
                id={inputId}
                type="text"
                className="list-input__field"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                placeholder={placeholder}
                aria-label={`${label} item ${index + 1}`}
              />
              <button
                type="button"
                className="list-input__remove"
                onClick={() => handleRemoveItem(index)}
                aria-label={`Remove ${label} item ${index + 1}`}
                tabIndex={-1}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </li>
          )
        })}
      </ul>
      {canAddMore && (
        <button
          type="button"
          className="list-input__add"
          onClick={handleAddItem}
          aria-label={`Add ${label} item`}
        >
          <span aria-hidden="true">+</span>
          <span className="list-input__add-text">Add item</span>
        </button>
      )}
      {!canAddMore && (
        <p className="list-input__limit" role="status">
          Maximum of {maxItems} items reached
        </p>
      )}
    </div>
  )
}
