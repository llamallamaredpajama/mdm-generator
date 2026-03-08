import { useState, useRef, useCallback, useEffect } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getAppDb, useAuth } from '../../lib/firebase'
import { formatRoomDisplay } from '../../types/encounter'
import './InlineRoomInput.css'

interface InlineRoomInputProps {
  value: string
  encounterId: string
  className?: string
}

export default function InlineRoomInput({ value, encounterId, className }: InlineRoomInputProps) {
  const { user } = useAuth()
  const db = getAppDb()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const save = useCallback(async () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed === value.trim()) return // No change
    if (!user) return

    try {
      const encounterRef = doc(db, 'customers', user.uid, 'encounters', encounterId)
      await updateDoc(encounterRef, {
        roomNumber: trimmed,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to update room number:', err)
      setDraft(value) // Revert on error
    }
  }, [draft, value, user, db, encounterId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={`inline-room-input inline-room-input--editing ${className ?? ''}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        placeholder="Room number"
        autoComplete="off"
      />
    )
  }

  return (
    <button
      type="button"
      className={`inline-room-input inline-room-input--display ${className ?? ''}`}
      onClick={() => setEditing(true)}
      title="Click to edit room number"
    >
      {formatRoomDisplay(value)}
    </button>
  )
}
