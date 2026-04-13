import { useState } from 'react'
import type { Units } from '../types/weather'

const STORAGE_KEY = 'sws-units'

function readUnits(): Units {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'metric' || stored === 'imperial') return stored
  } catch {
    // localStorage unavailable
  }
  return 'metric'
}

function hasStoredPreference(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'metric' || stored === 'imperial'
  } catch {
    return false
  }
}

function writeUnits(units: Units): void {
  try {
    localStorage.setItem(STORAGE_KEY, units)
  } catch {
    // localStorage unavailable
  }
}

export function useUnits(): {
  units: Units
  toggleUnits: () => void
  hasExplicitPreference: boolean
  setUnits: (units: Units) => void
} {
  const [units, setUnitsState] = useState<Units>(readUnits)
  const [hasExplicitPreference, setHasExplicitPreference] = useState(hasStoredPreference)

  function toggleUnits() {
    setUnitsState((prev) => {
      const next: Units = prev === 'metric' ? 'imperial' : 'metric'
      writeUnits(next)
      return next
    })
    setHasExplicitPreference(true)
  }

  function setUnits(next: Units) {
    writeUnits(next)
    setUnitsState(next)
    setHasExplicitPreference(true)
  }

  return { units, toggleUnits, hasExplicitPreference, setUnits }
}
