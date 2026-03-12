import type { Units } from '../types/weather'

interface UnitToggleProps {
  units: Units
  onToggle: () => void
  variant?: string
}

export function UnitToggle({ units, onToggle, variant = 'outline-secondary' }: UnitToggleProps) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-sm`}
      onClick={onToggle}
      aria-pressed={units === 'imperial'}
      aria-label={`Switch to ${units === 'metric' ? 'imperial' : 'metric'} units`}
    >
      {units === 'metric' ? '°C' : '°F'}
    </button>
  )
}
