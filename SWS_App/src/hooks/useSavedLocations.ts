import { useState } from 'react'
import type { Location, SavedLocation } from '../types/weather'

const STORAGE_KEY = 'sws-saved-locations'
const MAX_LOCATIONS = 10

function readLocations(): SavedLocation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as SavedLocation[]
  } catch {
    // localStorage unavailable or invalid JSON
  }
  return []
}

function writeLocations(locations: SavedLocation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
  } catch {
    // localStorage unavailable
  }
}

function makeId(loc: Location): string {
  return `${loc.lat},${loc.lon}`
}

export function useSavedLocations(): {
  savedLocations: SavedLocation[]
  addLocation: (loc: Location) => void
  removeLocation: (id: string) => void
  hasLocation: (id: string) => boolean
} {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(readLocations)

  function addLocation(loc: Location) {
    setSavedLocations((prev) => {
      const id = makeId(loc)
      if (prev.some((l) => l.id === id)) return prev
      const next = [{ ...loc, id }, ...prev].slice(0, MAX_LOCATIONS)
      writeLocations(next)
      return next
    })
  }

  function removeLocation(id: string) {
    setSavedLocations((prev) => {
      const next = prev.filter((l) => l.id !== id)
      writeLocations(next)
      return next
    })
  }

  function hasLocation(id: string): boolean {
    return savedLocations.some((l) => l.id === id)
  }

  return { savedLocations, addLocation, removeLocation, hasLocation }
}
