import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import type { Theme } from '../hooks/useTheme'
import type { SavedLocation, Units } from '../types/weather'

interface SettingsModalProps {
  show: boolean
  onClose: () => void
  theme: Theme
  onToggleTheme: () => void
  units: Units
  onToggleUnits: () => void
  savedLocations: SavedLocation[]
  widgetLocationId: string | null
  widgetMode: 'auto' | 'manual'
  onSetWidgetLocation: (loc: SavedLocation | null) => void
  bgColor: string
  bgAlpha: number
  onSetWidgetBackground: (color: string, alpha: number) => void
}

export function SettingsModal({
  show,
  onClose,
  theme,
  onToggleTheme,
  units,
  onToggleUnits,
  savedLocations,
  widgetLocationId,
  widgetMode,
  onSetWidgetLocation,
  bgColor,
  bgAlpha,
  onSetWidgetBackground,
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

              {Capacitor.isNativePlatform() && (
                <>
                  <hr />
                  <div>
                    <label className="form-label fw-medium mb-2">Widget Location</label>
                    <div className="d-flex flex-column gap-1">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="widget-location"
                          id="widget-loc-auto"
                          checked={widgetMode === 'auto'}
                          onChange={() => onSetWidgetLocation(null)}
                        />
                        <label className="form-check-label" htmlFor="widget-loc-auto">
                          Auto <span className="text-muted">(follows current location in app)</span>
                        </label>
                      </div>
                      {savedLocations.map((loc) => (
                        <div className="form-check" key={loc.id}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name="widget-location"
                            id={`widget-loc-${loc.id}`}
                            checked={widgetMode === 'manual' && widgetLocationId === loc.id}
                            onChange={() => onSetWidgetLocation(loc)}
                          />
                          <label className="form-check-label" htmlFor={`widget-loc-${loc.id}`}>
                            {loc.name}
                            {loc.admin1 ? `, ${loc.admin1}` : ''} — {loc.country}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <hr />
                  <div>
                    <label className="form-label fw-medium mb-2">Widget Appearance</label>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label htmlFor="widget-bg-color" className="form-label mb-0 text-muted small">
                        Background Color
                      </label>
                      <input
                        type="color"
                        id="widget-bg-color"
                        value={bgColor}
                        onChange={(e) => onSetWidgetBackground(e.target.value, bgAlpha)}
                        style={{
                          width: 40,
                          height: 32,
                          padding: 2,
                          border: '1px solid #ccc',
                          borderRadius: 4,
                          cursor: 'pointer',
                          background: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <div className="d-flex justify-content-between">
                        <label
                          htmlFor="widget-bg-alpha"
                          className="form-label mb-1 text-muted small"
                        >
                          Opacity
                        </label>
                        <span className="text-muted small">{bgAlpha}%</span>
                      </div>
                      <input
                        type="range"
                        className="form-range"
                        id="widget-bg-alpha"
                        min={0}
                        max={100}
                        value={bgAlpha}
                        onChange={(e) =>
                          onSetWidgetBackground(bgColor, parseInt(e.target.value, 10))
                        }
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        style={{ touchAction: 'none' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
