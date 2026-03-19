import { useEffect, useState } from 'react'
import { getBatchCurrentWeather } from '../services/weather'
import type { CurrentWeather, Location, SavedLocation, Units } from '../types/weather'

interface UseSavedLocationsWeatherResult {
  weatherMap: Map<string, CurrentWeather>
  activeCurrent: CurrentWeather | null
  loading: boolean
}

export function useSavedLocationsWeather(
  savedLocations: SavedLocation[],
  activeLocation: Location | null,
  units: Units
): UseSavedLocationsWeatherResult {
  const [weatherMap, setWeatherMap] = useState<Map<string, CurrentWeather>>(new Map())
  const [activeCurrent, setActiveCurrent] = useState<CurrentWeather | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Build deduplicated list: saved locations + active location (if not already saved)
    const activeId = activeLocation ? `${activeLocation.lat},${activeLocation.lon}` : null
    const savedIds = new Set(savedLocations.map((l) => l.id))

    const allLocations: Array<{ lat: number; lon: number; id: string }> = [
      ...savedLocations,
      ...(activeLocation && activeId && !savedIds.has(activeId)
        ? [{ lat: activeLocation.lat, lon: activeLocation.lon, id: activeId }]
        : []),
    ]

    if (allLocations.length === 0) {
      setWeatherMap(new Map())
      setActiveCurrent(null)
      return
    }

    let cancelled = false
    setLoading(true)

    getBatchCurrentWeather(allLocations, units)
      .then((map) => {
        if (cancelled) return
        setWeatherMap(map)
        setActiveCurrent(activeId ? (map.get(activeId) ?? null) : null)
      })
      .catch((err) => {
        console.warn('useSavedLocationsWeather: failed to fetch batch weather', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [savedLocations, activeLocation, units])

  return { weatherMap, activeCurrent, loading }
}
