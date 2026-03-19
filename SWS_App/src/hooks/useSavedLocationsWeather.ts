import { useEffect, useReducer } from 'react'
import { getBatchCurrentWeather } from '../services/weather'
import type { CurrentWeather, Location, SavedLocation, Units } from '../types/weather'

interface UseSavedLocationsWeatherResult {
  weatherMap: Map<string, CurrentWeather>
  activeCurrent: CurrentWeather | null
  loading: boolean
}

type State = {
  weatherMap: Map<string, CurrentWeather>
  activeCurrent: CurrentWeather | null
  loading: boolean
}

type Action =
  | { type: 'start' }
  | { type: 'success'; map: Map<string, CurrentWeather>; activeCurrent: CurrentWeather | null }
  | { type: 'done' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true }
    case 'success':
      return { weatherMap: action.map, activeCurrent: action.activeCurrent, loading: false }
    case 'done':
      return { ...state, loading: false }
  }
}

const initialState: State = { weatherMap: new Map(), activeCurrent: null, loading: false }

export function useSavedLocationsWeather(
  savedLocations: SavedLocation[],
  activeLocation: Location | null,
  units: Units
): UseSavedLocationsWeatherResult {
  const [state, dispatch] = useReducer(reducer, initialState)

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

    let cancelled = false

    const fetchPromise =
      allLocations.length === 0
        ? Promise.resolve(new Map<string, CurrentWeather>())
        : getBatchCurrentWeather(allLocations, units)

    fetchPromise
      .then((map) => {
        if (cancelled) return
        dispatch({ type: 'success', map, activeCurrent: activeId ? (map.get(activeId) ?? null) : null })
      })
      .catch((err) => {
        console.warn('useSavedLocationsWeather: failed to fetch batch weather', err)
      })
      .finally(() => {
        if (!cancelled) dispatch({ type: 'done' })
      })

    dispatch({ type: 'start' })

    return () => {
      cancelled = true
    }
  }, [savedLocations, activeLocation, units])

  return state
}
