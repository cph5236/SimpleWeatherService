import { useEffect, useState } from 'react'
import { getWeatherDescription, getWeatherEmoji } from '../types/weather'
import type { CurrentWeather, Location, Units } from '../types/weather'

const REFRESH_COOLDOWN_MS = 60 * 1000

interface CurrentWeatherCardProps {
  location: Location
  weather: CurrentWeather
  units: Units
  isSaved: boolean
  onSaveToggle: () => void
  onRefresh: () => void
  lastRefreshed: number
}

function windDirectionLabel(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}

function unitLabel(units: Units): string {
  return units === 'metric' ? '°C' : '°F'
}

function windUnitLabel(units: Units): string {
  return units === 'metric' ? 'km/h' : 'mph'
}

export function CurrentWeatherCard({
  location,
  weather,
  units,
  isSaved,
  onSaveToggle,
  onRefresh,
  lastRefreshed,
}: CurrentWeatherCardProps) {
  const tempUnit = unitLabel(units)
  const windUnit = windUnitLabel(units)

  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    const computeSeconds = () =>
      Math.max(0, Math.ceil((lastRefreshed + REFRESH_COOLDOWN_MS - Date.now()) / 1000))

    const initial = setTimeout(() => setSecondsLeft(computeSeconds()), 0)
    const id = setInterval(() => setSecondsLeft(computeSeconds()), 1000)
    return () => {
      clearTimeout(initial)
      clearInterval(id)
    }
  }, [lastRefreshed])

  const canRefresh = secondsLeft === 0

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h2 className="card-title mb-0 fs-4">
              {location.name}
              {location.admin1 ? `, ${location.admin1}` : ''}
            </h2>
            <span className="text-muted small">{location.country}</span>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onRefresh}
              disabled={!canRefresh}
              aria-label="Refresh current weather"
              title={canRefresh ? 'Refresh current weather' : `Refresh available in ${secondsLeft}s`}
            >
              {canRefresh ? '↻' : `↻ ${secondsLeft}s`}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${isSaved ? 'btn-warning' : 'btn-outline-secondary'}`}
              onClick={onSaveToggle}
              aria-label={isSaved ? 'Remove from saved locations' : 'Save this location'}
              title={isSaved ? 'Saved' : 'Save location'}
            >
              {isSaved ? '★' : '☆'}
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 mb-3">
          <span style={{ fontSize: '3.5rem' }} aria-hidden="true">
            {getWeatherEmoji(weather.weatherCode)}
          </span>
          <div>
            <div className="display-5 fw-bold">
              {Math.round(weather.temperature)}{tempUnit}
            </div>
            <div className="text-muted">{getWeatherDescription(weather.weatherCode)}</div>
          </div>
        </div>

        <div className="d-flex justify-content-around border-top pt-2 mt-1 text-center">
          <div>
            <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feels like</div>
            <div className="fw-semibold small">{Math.round(weather.feelsLike)}{tempUnit}</div>
          </div>
          <div className="vr" />
          <div>
            <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Humidity</div>
            <div className="fw-semibold small">{weather.humidity}%</div>
          </div>
          <div className="vr" />
          <div>
            <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wind</div>
            <div className="fw-semibold small">
              {Math.round(weather.windSpeed)} {windUnit}{' '}
              <span aria-label={`from the ${windDirectionLabel(weather.windDirection)}`}>
                {windDirectionLabel(weather.windDirection)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
