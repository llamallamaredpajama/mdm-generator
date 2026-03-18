import './ConfirmPopup.css'

interface ConfirmPopupProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmPopup({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmPopupProps) {
  return (
    <div className="confirm-popup__backdrop" onClick={onCancel}>
      <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-popup__title">{title}</div>
        <p className="confirm-popup__message">{message}</p>
        <div className="confirm-popup__actions">
          <button
            type="button"
            className="confirm-popup__btn confirm-popup__btn--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-popup__btn confirm-popup__btn--confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
