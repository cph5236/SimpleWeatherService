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

export function useUnits(): { units: Units; toggleUnits: () => void } {
  const [units, setUnits] = useState<Units>(readUnits)

  function toggleUnits() {
    setUnits((prev) => {
      const next: Units = prev === 'metric' ? 'imperial' : 'metric'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }

  return { units, toggleUnits }
}
