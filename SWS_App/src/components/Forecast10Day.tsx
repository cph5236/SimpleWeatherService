import { useState } from 'react'
import { getWeatherDescription, getWeatherEmoji } from '../types/weather'
import type { DailyForecast, Units } from '../types/weather'

interface Forecast10DayProps {
  days: DailyForecast[]
  units: Units
}

function formatDay(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(isoStr: string): string {
  const date = new Date(isoStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export function Forecast10Day({ days, units }: Forecast10DayProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const tempUnit = units === 'metric' ? '°C' : '°F'
  const windUnit = units === 'metric' ? 'km/h' : 'mph'
  const precipUnit = units === 'metric' ? 'mm' : 'in'

  function toggleExpand(date: string) {
    setExpandedDate((prev) => (prev === date ? null : date))
  }

  return (
    <div>
      <h3 className="fs-6 text-primary text-uppercase fw-semibold mb-2">10-Day Forecast</h3>
      <ul className="list-group list-group-flush border rounded">
        {days.map((day, i) => {
          const isExpanded = expandedDate === day.date
          return (
            <li
              key={day.date}
              className="list-group-item px-3 py-2"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleExpand(day.date)}
            >
              <div className="d-flex align-items-center gap-2">
                <div style={{ minWidth: 110 }} className="small fw-semibold">
                  {formatDay(day.date, i)}
                </div>
                <div style={{ fontSize: '1.2rem', minWidth: 28 }} aria-hidden="true">
                  {getWeatherEmoji(day.weatherCode)}
                </div>
                <div className="flex-grow-1" />
                {day.precipProbability > 0 && (
                  <span
                    className="small text-primary me-1"
                    aria-label={`${day.precipProbability}% precipitation chance`}
                  >
                    💧{day.precipProbability}%
                  </span>
                )}
                <div className="small text-nowrap">
                  <span className="fw-semibold">{Math.round(day.tempMax)}{tempUnit}</span>
                  <span className="text-muted"> / {Math.round(day.tempMin)}{tempUnit}</span>
                </div>
                <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>
                  {isExpanded ? '▾' : '▸'}
                </span>
              </div>

              {isExpanded && (
                <div className="d-flex flex-wrap gap-3 pt-2 mt-1 border-top">
                  <div>
                    <div className="text-muted" style={statLabelStyle}>Condition</div>
                    <div className="small">{getWeatherDescription(day.weatherCode)}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={statLabelStyle}>Feels like</div>
                    <div className="small">{Math.round(day.feelsLikeMax)}{tempUnit} / {Math.round(day.feelsLikeMin)}{tempUnit}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={statLabelStyle}>Wind max</div>
                    <div className="small">{Math.round(day.windSpeedMax)} {windUnit}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={statLabelStyle}>Precipitation</div>
                    <div className="small">{day.precipitationSum.toFixed(1)} {precipUnit}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={statLabelStyle}>UV Index</div>
                    <div className="small">{Math.round(day.uvIndexMax)}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={statLabelStyle}>Sunrise</div>
                    <div className="small">{formatTime(day.sunrise)}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={statLabelStyle}>Sunset</div>
                    <div className="small">{formatTime(day.sunset)}</div>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
