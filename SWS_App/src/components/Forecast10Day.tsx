import { getWeatherEmoji } from '../types/weather'
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

export function Forecast10Day({ days, units }: Forecast10DayProps) {
  const tempUnit = units === 'metric' ? '°C' : '°F'

  return (
    <div>
      <h3 className="fs-6 text-primary text-uppercase fw-semibold mb-2">10-Day Forecast</h3>
      <ul className="list-group list-group-flush border rounded">
        {days.map((day, i) => (
          <li key={day.date} className="list-group-item px-3 py-2">
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
