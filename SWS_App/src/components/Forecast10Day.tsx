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

function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function formatTime(isoStr: string): string {
  const date = new Date(isoStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

interface StatTileProps {
  icon: string
  label: string
  value: string
}

function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <div
      style={{
        background: 'var(--sws-stat-tile-bg)',
        borderRadius: 10,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--sws-text-muted)' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--sws-text-primary)' }}>{value}</span>
    </div>
  )
}

export function Forecast10Day({ days, units }: Forecast10DayProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const tempUnit = units === 'metric' ? '°C' : '°F'
  const windUnit = units === 'metric' ? 'km/h' : 'mph'
  const precipUnit = units === 'metric' ? 'mm' : 'in'
  const snowUnit = units === 'metric' ? 'cm' : 'in'

  const globalMin = Math.min(...days.map((d) => d.tempMin))
  const globalMax = Math.max(...days.map((d) => d.tempMax))
  const globalRange = globalMax - globalMin || 1

  function toggleExpand(date: string) {
    setExpandedDate((prev) => (prev === date ? null : date))
  }

  return (
    <div>
      <h3
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 700,
          color: 'var(--sws-accent)',
          marginBottom: '0.6rem',
        }}
      >
        10-Day Forecast
      </h3>

      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--sws-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          background: 'var(--sws-surface-primary)',
        }}
      >
        {days.map((day, i) => {
          const isExpanded = expandedDate === day.date
          const isHovered = hoveredDate === day.date
          const barLeft = ((day.tempMin - globalMin) / globalRange) * 100
          const barWidth = ((day.tempMax - day.tempMin) / globalRange) * 100

          return (
            <div
              key={day.date}
              style={{
                borderBottom: i < days.length - 1 ? '1px solid var(--sws-border-subtle)' : 'none',
              }}
            >
              {/* Row */}
              <div
                role="button"
                aria-expanded={isExpanded}
                onClick={() => toggleExpand(day.date)}
                onMouseEnter={() => setHoveredDate(day.date)}
                onMouseLeave={() => setHoveredDate(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: isHovered && !isExpanded ? 'var(--sws-surface-hover)' : isExpanded ? 'var(--sws-surface-expanded)' : 'transparent',
                  transition: 'background 150ms ease',
                  userSelect: 'none',
                }}
              >
                {/* Day label */}
                <span
                  style={{
                    minWidth: 100,
                    fontSize: '0.9rem',
                    fontWeight: i === 0 ? 700 : 500,
                    color: i === 0 ? 'var(--sws-accent-muted)' : 'var(--sws-text-primary)',
                  }}
                >
                  {formatDay(day.date, i)}
                </span>

                {/* Emoji */}
                <span style={{ fontSize: '1.4rem', lineHeight: 1, minWidth: 28 }} aria-hidden="true">
                  {getWeatherEmoji(day.weatherCode)}
                </span>

                {/* Temp range — mobile: compact text; sm+: visual bar */}
                {/* Mobile text fallback */}
                <div
                  className="d-sm-none"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--sws-text-secondary)', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 500 }}>{Math.round(day.tempMin)}</span>
                    <span style={{ color: 'var(--sws-border)' }}>–</span>
                    <span style={{ fontWeight: 700, color: 'var(--sws-text-primary)' }}>{Math.round(day.tempMax)}{tempUnit}</span>
                  </span>
                  <div
                    style={{
                      width: '100%',
                      minWidth: 48,
                      height: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(90deg, #60a5fa, #fb923c)',
                    }}
                  />
                </div>

                {/* Desktop bar */}
                <div className="d-none d-sm-block flex-grow-1" style={{ position: 'relative', height: 28, overflow: 'visible' }}>
                  {/* Min label — above bar, centered on fill start */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${Math.max(1, Math.min(barLeft, 90))}%`,
                      transform: 'translateX(-50%)',
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      color: 'var(--sws-text-secondary)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {Math.round(day.tempMin)}{tempUnit}
                  </span>
                  {/* Max label — above bar, centered on fill end */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${Math.max(10, Math.min(barLeft + barWidth, 99))}%`,
                      transform: 'translateX(-50%)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--sws-text-primary)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {Math.round(day.tempMax)}{tempUnit}
                  </span>
                  {/* Bar track */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--sws-bar-track)',
                    }}
                  >
                    {/* Colored fill */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${barLeft}%`,
                        width: `${Math.max(barWidth, 4)}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: 'linear-gradient(90deg, #60a5fa, #fb923c)',
                      }}
                    />
                  </div>
                </div>

                {/* Precip badge */}
                {day.precipProbability > 0 ? (
                  <span
                    aria-label={`${day.precipProbability}% precipitation chance`}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--sws-accent)',
                      background: 'var(--sws-precip-badge-bg)',
                      borderRadius: 20,
                      padding: '2px 8px',
                      minWidth: 52,
                      textAlign: 'center',
                    }}
                  >
                    💧 {day.precipProbability}%
                  </span>
                ) : (
                  <span style={{ minWidth: 52 }} />
                )}

                {/* Chevron */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                  style={{
                    color: 'var(--sws-text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <div
                  style={{
                    background: 'var(--sws-surface-secondary)',
                    borderTop: '1px solid var(--sws-border)',
                    borderLeft: '4px solid var(--sws-accent)',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: 8,
                  }}
                >
                  <StatTile icon="🌤" label="Condition" value={getWeatherDescription(day.weatherCode)} />
                  <StatTile
                    icon="🌡️"
                    label="Feels like"
                    value={`High ${Math.round(day.feelsLikeMax)}${tempUnit} / Low ${Math.round(day.feelsLikeMin)}${tempUnit}`}
                  />
                  <StatTile icon="💨" label="Wind max" value={`${Math.round(day.windSpeedMax)} ${windUnit} ${degreesToCompass(day.windDirectionDominant)}`} />
                  <StatTile icon="💧" label="Humidity" value={`${Math.round(day.humidityMean)}%`} />
                  <StatTile icon="☔" label="Precipitation" value={`${day.precipitationSum.toFixed(1)} ${precipUnit}`} />
                  {day.snowfallSum > 0 && (
                    <StatTile icon="❄️" label="Snowfall" value={`${day.snowfallSum.toFixed(1)} ${snowUnit}`} />
                  )}
                  <StatTile icon="🔆" label="UV Index" value={String(Math.round(day.uvIndexMax))} />
                  <StatTile icon="🌅" label="Sunrise" value={formatTime(day.sunrise)} />
                  <StatTile icon="🌇" label="Sunset" value={formatTime(day.sunset)} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
