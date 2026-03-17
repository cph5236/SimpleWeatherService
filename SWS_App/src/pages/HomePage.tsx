import { useState } from 'react'
import { CurrentWeatherCard } from '../components/CurrentWeatherCard'
import { Forecast10Day } from '../components/Forecast10Day'
import { Hourly24 } from '../components/Hourly24'
import { MapPlaceholder } from '../components/MapPlaceholder'
import { SavedLocationsList } from '../components/SavedLocationsList'
import { SearchBar } from '../components/SearchBar'
import { UnitToggle } from '../components/UnitToggle'
import { useSavedLocations } from '../hooks/useSavedLocations'
import { useUnits } from '../hooks/useUnits'
import { useWeather } from '../hooks/useWeather'
import type { Location, SavedLocation } from '../types/weather'

const LAST_LOCATION_KEY = 'sws-last-location'

function loadLastLocation(): Location | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY)
    return raw ? (JSON.parse(raw) as Location) : null
  } catch {
    return null
  }
}

export function HomePage() {
  const { units, toggleUnits } = useUnits()
  const { savedLocations, addLocation, removeLocation, hasLocation } = useSavedLocations()
  const [activeLocation, setActiveLocation] = useState<Location | null>(loadLastLocation)
  const { current, daily, hourly, loading, error, refetch, refetchCurrent, lastCurrentFetch } =
    useWeather(activeLocation, units)

  const activeId = activeLocation ? `${activeLocation.lat},${activeLocation.lon}` : null

  function handleSelectLocation(loc: Location) {
    setActiveLocation(loc)
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(loc))
  }

  function handleSelectSaved(loc: SavedLocation) {
    handleSelectLocation(loc)
  }

  function handleSaveToggle() {
    if (!activeLocation) return
    if (hasLocation(activeId!)) {
      removeLocation(activeId!)
    } else {
      addLocation(activeLocation)
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="text-white shadow-sm pb-3 pt-safe-area" style={{ backgroundColor: '#1d4ed8' }}>
        <div className="container-lg">
          <h1 className="fs-5 fw-bold mb-2 me-auto text-white">
            <span aria-hidden="true">🌤</span> Simple Weather Service
          </h1>
          <div className="d-flex align-items-center gap-1">
            <SearchBar onSelect={handleSelectLocation} />
            <UnitToggle units={units} onToggle={toggleUnits} variant="outline-light" />
          </div>
        </div>
      </header>

      {/* Saved locations strip */}
      {savedLocations.length > 0 && (
        <div className="border-bottom py-2" style={{ backgroundColor: '#1e40af' }}>
          <div className="container-lg">
            <SavedLocationsList
              locations={savedLocations}
              activeId={activeId}
              onSelect={handleSelectSaved}
              onRemove={removeLocation}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow-1 pt-4 pb-safe-area">
        <div className="container-lg">
          {/* Empty state */}
          {!activeLocation && !loading && (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: '4rem' }} aria-hidden="true">🌍</div>
              <p className="fs-5 mt-3">Search for a city to get started</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading weather data…</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
              <span>⚠️ {error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger ms-auto" onClick={refetch}>
                Retry
              </button>
            </div>
          )}

          {/* Weather data */}
          {!loading && !error && current && activeLocation && (
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <div className="d-flex flex-column gap-4">
                  <CurrentWeatherCard
                    location={activeLocation}
                    weather={current}
                    isSaved={hasLocation(activeId!)}
                    onSaveToggle={handleSaveToggle}
                    onRefresh={refetchCurrent}
                    lastRefreshed={lastCurrentFetch}
                  />
                  {hourly.length > 0 && <Hourly24 hours={hourly} units={units} lat={activeLocation.lat} lon={activeLocation.lon} />}
                  {daily.length > 0 && <Forecast10Day days={daily} units={units} />}
                </div>
              </div>
              <div className="col-12 col-lg-4 d-none d-lg-block">
                <MapPlaceholder />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 mt-auto border-top text-muted" style={{ fontSize: '0.75rem' }}>
        <span>© {new Date().getFullYear()} HanlinSoftware</span>
        <span className="mx-2">·</span>
        <span>
          Powered by{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-muted">
            Open-Meteo
          </a>
        </span>
      </footer>
    </div>
  )
}
