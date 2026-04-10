import { useState, useRef } from 'react'
import { getWeatherEmoji } from '../types/weather'
import type { HourlyForecast, Units } from '../types/weather'
import { useAQI } from '../hooks/useAQI'

interface Hourly24Props {
  hours: HourlyForecast[]
  units: Units
  lat: number
  lon: number
}

type ForecastTab = 'uv' | 'aqi' | 'wind'

const TABS: { id: ForecastTab; label: string }[] = [
  { id: 'uv', label: 'UV Index' },
  { id: 'aqi', label: 'Air Quality' },
  { id: 'wind', label: 'Wind' },
]

function formatHour(isoTime: string): string {
  const date = new Date(isoTime)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

function uvColor(uv: number): string {
  if (uv <= 2) return '#16a34a'
  if (uv <= 5) return '#eab308'
  if (uv <= 7) return '#d97706'
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

function windColor(speed: number, units: Units): string {
  const thresholds = units === 'metric' ? [20, 40, 60] : [12, 25, 37]
  if (speed < thresholds[0]) return '#64748b'
  if (speed < thresholds[1]) return '#3b82f6'
  if (speed < thresholds[2]) return '#f59e0b'
  return '#dc2626'
}

function degreesToCardinal(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#16a34a'
  if (aqi <= 100) return '#d97706'
  if (aqi <= 150) return '#ea580c'
  if (aqi <= 200) return '#dc2626'
  return '#7c3aed'
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Sensitive'
  if (aqi <= 200) return 'Unhealthy'
  return 'Very Unhealthy'
}

const UV_LEGEND = [
  { label: 'Low', color: '#16a34a' },
  { label: 'Moderate', color: '#eab308' },
  { label: 'High', color: '#d97706' },
  { label: 'Very High', color: '#dc2626' },
  { label: 'Extreme', color: '#7c3aed' },
]

const BAR_MAX_HEIGHT = 60

export function Hourly24({ hours, units, lat, lon }: Hourly24Props) {
  const [activeTab, setActiveTab] = useState<ForecastTab>('uv')
  const { data: aqiData, loading: aqiLoading, error: aqiError, fetch: fetchAQI } = useAQI(lat, lon)

  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  const tempUnit = units === 'metric' ? '°C' : '°F'
  const windUnit = units === 'metric' ? 'km/h' : 'mph'
  const maxUV = Math.max(...hours.map((h) => h.uvIndex), 1)

  function handleTopScroll() {
    if (isSyncing.current) return
    isSyncing.current = true
    if (bottomRef.current && topRef.current) {
      bottomRef.current.scrollLeft = topRef.current.scrollLeft
    }
    isSyncing.current = false
  }

  function handleBottomScroll() {
    if (isSyncing.current) return
    isSyncing.current = true
    if (topRef.current && bottomRef.current) {
      topRef.current.scrollLeft = bottomRef.current.scrollLeft
    }
    isSyncing.current = false
  }

  function handleTabClick(tab: ForecastTab) {
    setActiveTab(tab)
    if (tab === 'aqi') fetchAQI()
    requestAnimationFrame(() => {
      if (bottomRef.current && topRef.current) {
        bottomRef.current.scrollLeft = topRef.current.scrollLeft
      }
    })
  }

  return (
    <div
      style={{
        borderRadius: 12,
        padding: '1rem',
        background: 'var(--sws-hourly-bg)',
      }}
    >
      <h3 className="fs-6 text-primary text-uppercase fw-semibold mb-2">24-Hour Forecast</h3>

      {/* Main cards row */}
      <div
        ref={topRef}
        className="d-flex flex-nowrap gap-2 pb-2"
        style={{ overflowX: 'auto' }}
        role="region"
        aria-label="24-hour forecast"
        onScroll={handleTopScroll}
      >
        {hours.map((hour) => (
          <div
            key={hour.time}
            className="rounded p-2 text-center flex-shrink-0"
            style={{
              minWidth: 72,
              background: 'var(--sws-hourly-card-bg)',
              boxShadow: 'var(--sws-hourly-card-shadow)',
            }}
          >
            <div className="small text-muted">{formatHour(hour.time)}</div>
            <div style={{ fontSize: '1.4rem' }} aria-hidden="true">
              {getWeatherEmoji(hour.weatherCode)}
            </div>
            <div className="fw-semibold small">
              {Math.round(hour.temperature)}{tempUnit}
            </div>
            {hour.precipProbability >= 0 && (
              <div className="text-primary small" aria-label={`${hour.precipProbability}% precipitation`}>
                {hour.precipProbability}%
              </div>
            )}
          </div>
        ))}
      </div>

      <hr style={{ borderColor: 'var(--sws-hr-color)', margin: '0.5rem 0' }} />

      {/* Tab strip */}
      <div className="d-flex gap-1 mb-2" role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--sws-accent)' : '2px solid transparent',
                color: isActive ? 'var(--sws-accent)' : 'var(--sws-text-muted)',
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 500,
                padding: '4px 10px',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Detail row */}
      <div
        ref={bottomRef}
        className="d-flex flex-nowrap gap-2 pb-1"
        style={{ overflowX: 'auto' }}
        role="tabpanel"
        onScroll={handleBottomScroll}
      >
        {activeTab === 'uv' && (
          <>
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
                  <div style={{ width: 28, height: 2, backgroundColor: 'var(--sws-border-subtle)' }} />
                  <div className="mt-1 text-muted" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {formatHour(hour.time)}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {activeTab === 'aqi' && (
          <>
            {aqiLoading && (
              <div className="d-flex align-items-center justify-content-center py-3 w-100">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading air quality data…</span>
                </div>
              </div>
            )}
            {aqiError && (
              <div className="text-danger small py-2 px-1">{aqiError}</div>
            )}
            {!aqiLoading && !aqiError && aqiData.length > 0 && hours.map((hour, i) => {
              const entry = aqiData[i]
              const aqi = entry?.usAqi ?? 0
              const color = aqiColor(aqi)
              return (
                <div
                  key={hour.time}
                  className="d-flex flex-column align-items-center flex-shrink-0"
                  style={{ minWidth: 72 }}
                  title={`${formatHour(hour.time)}: AQI ${aqi} (${aqiLabel(aqi)})`}
                >
                  <div className="fw-bold" style={{ color, fontSize: '0.85rem' }}>{aqi}</div>
                  <div
                    style={{
                      width: 36,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: color,
                      margin: '4px 0',
                    }}
                  />
                  <div style={{ fontSize: '0.6rem', color, whiteSpace: 'nowrap' }}>
                    {aqiLabel(aqi)}
                  </div>
                  <div className="mt-1 text-muted" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {formatHour(hour.time)}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {activeTab === 'wind' && (
          <>
            {hours.map((hour) => {
              const color = windColor(hour.windSpeed, units)
              const cardinal = degreesToCardinal(hour.windDirection)
              return (
                <div
                  key={hour.time}
                  className="d-flex flex-column align-items-center flex-shrink-0"
                  style={{ minWidth: 72 }}
                  title={`${formatHour(hour.time)}: ${Math.round(hour.windSpeed)} ${windUnit} ${cardinal}`}
                >
                  <svg
                    viewBox="0 0 24 40"
                    width="28"
                    height="44"
                    style={{ transform: `rotate(${hour.windDirection}deg)` }}
                    aria-label={`Wind from ${cardinal}`}
                  >
                    <polygon points="12,1 15,13 12,10 9,13" fill="var(--sws-wind-arrow)" />
                    <rect x="11" y="10" width="2" height="28" rx="1" fill="var(--sws-wind-arrow)" opacity="0.65" />
                  </svg>
                  <div className="fw-semibold mt-1" style={{ fontSize: '0.75rem', color: 'var(--sws-wind-cardinal)' }}>
                    {cardinal}
                  </div>
                  <div className="d-flex align-items-baseline gap-1">
                    <span className="fw-bold" style={{ color, fontSize: '1rem' }}>
                      {Math.round(hour.windSpeed)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--sws-wind-unit)' }}>{windUnit}</span>
                  </div>
                  <div className="mt-1 text-muted" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {formatHour(hour.time)}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Wind intensity legend */}
      {activeTab === 'wind' && (
        <div className="d-flex gap-3 flex-wrap mt-1">
          {[
            { label: units === 'metric' ? 'Calm <20 km/h' : 'Calm <12 mph', color: '#64748b' },
            { label: 'Moderate', color: '#3b82f6' },
            { label: 'Strong', color: '#f59e0b' },
            { label: 'Gale', color: '#dc2626' },
          ].map(({ label, color }) => (
            <div key={label} className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
              <div style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2 }} />
              <span className="text-muted">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* UV legend shown when on UV tab */}
      {activeTab === 'uv' && (
        <div className="d-flex gap-2 flex-wrap mt-1">
          {UV_LEGEND.map(({ label, color }) => (
            <div key={label} className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
              <div style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2 }} />
              <span className="text-muted">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
