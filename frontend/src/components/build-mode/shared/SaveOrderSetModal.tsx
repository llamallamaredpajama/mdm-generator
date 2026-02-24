/**
 * SaveOrderSetModal Component
 *
 * Modal dialog for saving the current test selection as a named order set.
 * Displays the tests to be saved, accepts a name and optional tags.
 */

import { useState } from 'react'
import type { TestDefinition } from '../../../types/libraries'
import './SaveOrderSetModal.css'

interface SaveOrderSetModalProps {
  selectedTestIds: string[]
  tests: TestDefinition[]
  onSave: (name: string, testIds: string[], tags: string[]) => void
  onClose: () => void
}

export default function SaveOrderSetModal({
  selectedTestIds,
  tests,
  onSave,
  onClose,
}: SaveOrderSetModalProps) {
  const [name, setName] = useState('')
  const [tagsText, setTagsText] = useState('')

  const selectedTests = tests.filter((t) => selectedTestIds.includes(t.id))

  function handleSave() {
    if (!name.trim() || selectedTestIds.length === 0) return
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    onSave(name.trim(), selectedTestIds, tags)
  }

  return (
    <div className="save-orderset-modal__overlay" onClick={onClose}>
      <div
        className="save-orderset-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="save-orderset-modal"
      >
        <h3 className="save-orderset-modal__title">Save Order Set</h3>

        <div className="save-orderset-modal__field">
          <label className="save-orderset-modal__label" htmlFor="os-name">
            Name
          </label>
          <input
            id="os-name"
            className="save-orderset-modal__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Chest Pain Workup"
            data-testid="orderset-name-input"
            autoFocus
          />
        </div>

        <div className="save-orderset-modal__field">
          <label className="save-orderset-modal__label" htmlFor="os-tags">
            Tags (comma-separated, optional)
          </label>
          <input
            id="os-tags"
            className="save-orderset-modal__input"
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="e.g., chest pain, acs, cardiac"
            data-testid="orderset-tags-input"
          />
        </div>

        <div className="save-orderset-modal__tests">
          <span className="save-orderset-modal__test-label">
            Tests ({selectedTests.length})
          </span>
          <div className="save-orderset-modal__test-list">
            {selectedTests.map((t) => (
              <span key={t.id} className="save-orderset-modal__test-chip">
                {t.name}
              </span>
            ))}
          </div>
        </div>

        <div className="save-orderset-modal__actions">
          <button
            className="save-orderset-modal__btn save-orderset-modal__btn--cancel"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="save-orderset-modal__btn save-orderset-modal__btn--save"
            onClick={handleSave}
            disabled={!name.trim() || selectedTestIds.length === 0}
            data-testid="confirm-save-orderset"
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
