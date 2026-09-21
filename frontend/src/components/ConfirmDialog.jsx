import { AlertTriangle } from 'lucide-react'
import './ConfirmDialog.css'

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
  confirmDisabled = false,
}) {
  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className={`confirm-dialog${danger ? ' confirm-dialog-danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="confirm-dialog-actions">
          <button className="secondary-button" onClick={onCancel} disabled={confirmDisabled}>
            {cancelLabel}
          </button>
          <button className="confirm-dialog-button" onClick={onConfirm} autoFocus disabled={confirmDisabled}>
            {confirmDisabled ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}