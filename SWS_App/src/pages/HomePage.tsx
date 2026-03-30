import { lazy, Suspense, useEffect, useState } from 'react'
import { CurrentWeatherCard } from '../components/CurrentWeatherCard'
import { Forecast10Day } from '../components/Forecast10Day'
import { Hourly24 } from '../components/Hourly24'
import { SavedLocationsList } from '../components/SavedLocationsList'
import { SearchBar } from '../components/SearchBar'
import { SettingsModal } from '../components/SettingsModal'

const RadarMap = lazy(() =>
  import('../components/RadarMap').then((m) => ({ default: m.RadarMap }))
)
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useSavedLocations } from '../hooks/useSavedLocations'
import { useSavedLocationsWeather } from '../hooks/useSavedLocationsWeather'
import { useUnits } from '../hooks/useUnits'
import { useWeather } from '../hooks/useWeather'
import { useWidgetBackground } from '../hooks/useWidgetBackground'
import { useWidgetLocation } from '../hooks/useWidgetLocation'
import type { Theme } from '../hooks/useTheme'
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

interface HomePageProps {
  theme: Theme
  onToggleTheme: () => void
}

export function HomePage({ theme, onToggleTheme }: HomePageProps) {
  const { units, toggleUnits } = useUnits()
  const { savedLocations, addLocation, removeLocation, reorderLocations, hasLocation } = useSavedLocations()
  const [activeLocation, setActiveLocation] = useState<Location | null>(loadLastLocation)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { weatherMap: savedWeatherMap, activeCurrent, loading: savedWeatherLoading } =
    useSavedLocationsWeather(savedLocations, activeLocation, units)
  const { current, daily, hourly, loading, error, refetch, refetchCurrent, lastCurrentFetch } =
    useWeather(activeLocation, units, activeCurrent)

  const { pullDistance, isPulling } = usePullToRefresh(refetchCurrent, lastCurrentFetch)
  const { widgetLocationId, widgetMode, setWidgetLocation, syncAutoLocation } = useWidgetLocation(units)
  const { bgColor, bgAlpha, setWidgetBackground } = useWidgetBackground()

  useEffect(() => {
    syncAutoLocation(activeLocation)
  }, [activeLocation, syncAutoLocation])

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
      {/* Pull-to-refresh indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1050,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8,
          opacity: pullDistance > 0 ? Math.min(pullDistance / 40, 1) : 0,
          transform: `translateY(${pullDistance > 0 ? Math.min(pullDistance - 40, 48) : -48}px)`,
          transition: isPulling ? 'none' : 'transform 250ms ease, opacity 250ms ease',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'var(--sws-surface-primary)',
            borderRadius: 20,
            padding: '6px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            fontSize: '0.8rem',
            color: 'var(--sws-text-secondary)',
            border: '1px solid var(--sws-border)',
          }}
        >
          {pullDistance >= 80 ? '↑ Release to refresh' : '↓ Pull to refresh'}
        </div>
      </div>

      {/* Header */}
      <header
        className="text-white shadow-sm pb-3 pt-safe-area"
        style={{ backgroundColor: 'var(--sws-header-bg)' }}
      >
        <div className="container-lg">
          <h1 className="fs-5 fw-bold mb-2 me-auto text-white">
            <span aria-hidden="true">🌤</span> Simple Weather Service
          </h1>
          <div className="d-flex align-items-center gap-1">
            <SearchBar onSelect={handleSelectLocation} />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Saved locations strip */}
      {savedLocations.length > 0 && (
        <div className="border-bottom py-2" style={{ backgroundColor: 'var(--sws-saved-strip-bg)' }}>
          <div className="container-lg">
            <SavedLocationsList
              locations={savedLocations}
              activeId={activeId}
              onSelect={handleSelectSaved}
              onRemove={removeLocation}
              onReorder={reorderLocations}
              weatherMap={savedWeatherMap}
              weatherLoading={savedWeatherLoading}
              units={units}
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
            <div className="d-flex flex-column gap-4">
              <CurrentWeatherCard
                location={activeLocation}
                weather={current}
                isSaved={hasLocation(activeId!)}
                onSaveToggle={handleSaveToggle}
                onRefresh={refetchCurrent}
                lastRefreshed={lastCurrentFetch}
              />
              <div className="row g-4">
                {hourly.length > 0 && (
                  <div className="col-12 col-lg-6">
                    <Hourly24 hours={hourly} units={units} lat={activeLocation.lat} lon={activeLocation.lon} />
                  </div>
                )}
                <div className={`col-12${hourly.length > 0 ? ' col-lg-6' : ''}`}>
                  <Suspense
                    fallback={
                      <div className="card shadow-sm" style={{ minHeight: 340 }}>
                        <div className="card-body d-flex align-items-center justify-content-center">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading map…</span>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <RadarMap lat={activeLocation.lat} lon={activeLocation.lon} country={activeLocation.country} />
                  </Suspense>
                </div>
              </div>
              {daily.length > 0 && <Forecast10Day days={daily} units={units} />}
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

      <SettingsModal
        show={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={onToggleTheme}
        units={units}
        onToggleUnits={toggleUnits}
        savedLocations={savedLocations}
        widgetLocationId={widgetLocationId}
        widgetMode={widgetMode}
        onSetWidgetLocation={setWidgetLocation}
        bgColor={bgColor}
        bgAlpha={bgAlpha}
        onSetWidgetBackground={setWidgetBackground}
      />
    </div>
  )
}
