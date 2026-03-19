import { useEffect, useState } from 'react'
import { getBatchCurrentWeather, type LocationWeather } from '../services/weather'
import type { SavedLocation, Units } from '../types/weather'

interface UseSavedLocationsWeatherResult {
  weatherMap: Map<string, LocationWeather>
  loading: boolean
}

export function useSavedLocationsWeather(
  locations: SavedLocation[],
  units: Units
): UseSavedLocationsWeatherResult {
  const [weatherMap, setWeatherMap] = useState<Map<string, LocationWeather>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (locations.length === 0) {
      setWeatherMap(new Map())
      return
    }

    let cancelled = false
    setLoading(true)

    getBatchCurrentWeather(locations, units)
      .then((map) => {
        if (!cancelled) setWeatherMap(map)
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
  }, [locations, units])

  return { weatherMap, loading }
}
