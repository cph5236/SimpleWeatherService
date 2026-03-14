import { useState } from 'react'
import { getWeatherEmoji } from '../types/weather'
import type { HourlyForecast, Units } from '../types/weather'

interface Hourly24Props {
  hours: HourlyForecast[]
  units: Units
}

function formatHour(isoTime: string): string {
  const date = new Date(isoTime)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

function uvColor(uv: number): string {
  if (uv <= 2) return '#16a34a'
  if (uv <= 5) return '#d97706'
  if (uv <= 7) return '#ea580c'
  if (uv <= 10) return '#dc2626'
  return '#7c3aed'
}

function uvLabel(uv: number): string {
  if (uv <= 2) return 'Low'
  if (uv <= 5) return 'Moderate'
  if (uv <= 7) return 'High'
  if (uv <= 10) return 'Very High'
  return 'Extreme'
}

const UV_LEGEND = [
  { label: 'Low', color: '#16a34a' },
  { label: 'Moderate', color: '#d97706' },
  { label: 'High', color: '#ea580c' },
  { label: 'Very High', color: '#dc2626' },
  { label: 'Extreme', color: '#7c3aed' },
]

const BAR_MAX_HEIGHT = 60

export function Hourly24({ hours, units }: Hourly24Props) {
  const [expanded, setExpanded] = useState(false)
  const tempUnit = units === 'metric' ? '°C' : '°F'
  const maxUV = Math.max(...hours.map((h) => h.uvIndex), 1)

  return (
    <div
      style={{
        borderRadius: 12,
        padding: '1rem',
        background: 'linear-gradient(160deg, #dbeafe 0%, #e0f2fe 100%)',
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="fs-6 text-primary text-uppercase fw-semibold mb-0">24-Hour Forecast</h3>
        <button
          className="btn btn-link btn-sm p-0 text-primary"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide UV index chart' : 'Show UV index chart'}
          style={{ textDecoration: 'none', fontSize: '0.75rem' }}
        >
          UV Index {expanded ? '▲' : '▼'}
        </button>
      </div>

      <div
        className="d-flex flex-nowrap gap-2 pb-2"
        style={{ overflowX: 'auto' }}
        role="region"
        aria-label="24-hour forecast"
      >
        {hours.map((hour) => (
          <div
            key={hour.time}
            className="rounded p-2 text-center flex-shrink-0"
            style={{
              minWidth: 72,
              background: 'rgba(255,255,255,0.75)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <div className="small text-muted">{formatHour(hour.time)}</div>
            <div style={{ fontSize: '1.4rem' }} aria-hidden="true">
              {getWeatherEmoji(hour.weatherCode)}
            </div>
            <div className="fw-semibold small">
              {Math.round(hour.temperature)}{tempUnit}
            </div>
            {hour.precipProbability > 0 && (
              <div className="text-primary small" aria-label={`${hour.precipProbability}% precipitation`}>
                {hour.precipProbability}%
              </div>
            )}
          </div>
        ))}
      </div>

      {expanded && (
        <div className="mt-2">
          <div
            className="small text-uppercase fw-semibold mb-2"
            style={{ letterSpacing: '0.05em', color: '#1e40af' }}
          >
            UV Index
          </div>
          <div
            className="d-flex flex-nowrap gap-2 pb-2"
            style={{ overflowX: 'auto' }}
            role="region"
            aria-label="UV index chart"
          >
            {hours.map((hour) => {
              const uv = Math.round(hour.uvIndex)
              const barHeight = Math.max(4, Math.round((uv / maxUV) * BAR_MAX_HEIGHT))
              const color = uvColor(uv)
              return (
                <div
                  key={hour.time}
                  className="d-flex flex-column align-items-center flex-shrink-0"
                  style={{ minWidth: 72 }}
                  title={`${formatHour(hour.time)}: UV ${uv} (${uvLabel(uv)})`}
                >
                  <div
                    style={{
                      height: BAR_MAX_HEIGHT,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div className="fw-semibold" style={{ color, fontSize: '0.7rem', marginBottom: 2 }}>
                      {uv}
                    </div>
                    <div
                      style={{
                        width: 28,
                        height: barHeight,
                        backgroundColor: color,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.2s ease',
                      }}
                      aria-label={`UV ${uv} at ${formatHour(hour.time)}`}
                    />
                  </div>
                  <div style={{ width: 28, height: 2, backgroundColor: 'rgba(0,0,0,0.12)' }} />
                  <div className="mt-1 text-muted" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {formatHour(hour.time)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="d-flex gap-3 flex-wrap mt-1">
            {UV_LEGEND.map(({ label, color }) => (
              <div key={label} className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                <div style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2 }} />
                <span className="text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
