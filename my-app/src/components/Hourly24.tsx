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

export function Hourly24({ hours, units }: Hourly24Props) {
  const tempUnit = units === 'metric' ? '°C' : '°F'

  return (
    <div>
      <h3 className="fs-6 text-primary text-uppercase fw-semibold mb-2">24-Hour Forecast</h3>
      <div
        className="d-flex flex-nowrap gap-2 pb-2"
        style={{ overflowX: 'auto' }}
        role="region"
        aria-label="24-hour forecast"
      >
        {hours.map((hour) => (
          <div
            key={hour.time}
            className="border rounded p-2 text-center flex-shrink-0"
            style={{ minWidth: 72 }}
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
    </div>
  )
}
