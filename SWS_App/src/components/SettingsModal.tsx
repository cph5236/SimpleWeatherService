import { useEffect } from 'react'
import type { Theme } from '../hooks/useTheme'
import type { Units } from '../types/weather'

interface SettingsModalProps {
  show: boolean
  onClose: () => void
  theme: Theme
  onToggleTheme: () => void
  units: Units
  onToggleUnits: () => void
}

export function SettingsModal({
  show,
  onClose,
  theme,
  onToggleTheme,
  units,
  onToggleUnits,
}: SettingsModalProps) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  useEffect(() => {
    if (!show) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [show, onClose])

  if (!show) return null

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} aria-hidden="true" />
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="settings-modal-title">
                Settings
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close settings"
              />
            </div>
            <div className="modal-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label htmlFor="dark-mode-toggle" className="form-label mb-0">
                  Dark Mode
                </label>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="dark-mode-toggle"
                    checked={theme === 'dark'}
                    onChange={onToggleTheme}
                  />
                </div>
              </div>

              <hr />

              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label mb-0">Temperature Units</label>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onToggleUnits}
                  aria-pressed={units === 'imperial'}
                  aria-label={`Switch to ${units === 'metric' ? 'imperial' : 'metric'} units`}
                >
                  {units === 'metric' ? '°C — Metric' : '°F — Imperial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
