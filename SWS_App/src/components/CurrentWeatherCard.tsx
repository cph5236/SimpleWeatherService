import { getWeatherDescription, getWeatherEmoji } from '../types/weather'
import type { CurrentWeather, Location, Units } from '../types/weather'

interface CurrentWeatherCardProps {
  location: Location
  weather: CurrentWeather
  isSaved: boolean
  onSaveToggle: () => void
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

export function CurrentWeatherCard({ location, weather, isSaved, onSaveToggle }: CurrentWeatherCardProps) {
  const tempUnit = unitLabel(weather.units)
  const windUnit = windUnitLabel(weather.units)

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
