import { useState, useCallback } from 'react'
import './SaveDraftPopup.css'

interface SaveDraftPopupProps {
  onSkip: () => void
  onSave: (data: { roomNumber: string; chiefComplaint: string }) => void
}

export default function SaveDraftPopup({ onSkip, onSave }: SaveDraftPopupProps) {
  const [roomNumber, setRoomNumber] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')

  const handleSave = useCallback(() => {
    onSave({ roomNumber: roomNumber.trim(), chiefComplaint: chiefComplaint.trim() })
  }, [roomNumber, chiefComplaint, onSave])

  return (
    <div className="save-draft-popup__backdrop" onClick={onSkip}>
      <div className="save-draft-popup" onClick={(e) => e.stopPropagation()}>
        <div className="save-draft-popup__title">Save Draft</div>
        <p className="save-draft-popup__desc">Add optional details for this encounter.</p>

        <div className="save-draft-popup__field">
          <label className="save-draft-popup__label">Room #</label>
          <input
            className="save-draft-popup__input"
            type="text"
            placeholder="e.g., 5, Bed 2A"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            autoFocus
          />
        </div>

        <div className="save-draft-popup__field">
          <label className="save-draft-popup__label">Chief Complaint</label>
          <input
            className="save-draft-popup__input"
            type="text"
            placeholder="e.g., Chest pain"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
        </div>

        <div className="save-draft-popup__actions">
          <button
            type="button"
            className="save-draft-popup__btn save-draft-popup__btn--skip"
            onClick={onSkip}
          >
            Skip
          </button>
          <button
            type="button"
            className="save-draft-popup__btn save-draft-popup__btn--save"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
