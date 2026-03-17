import { useState, useEffect, useCallback } from 'react'
import type { HourlyAQI } from '../types/weather'
import { getHourlyAQI } from '../services/aqi'

interface AQIState {
  data: HourlyAQI[]
  loading: boolean
  error: string | null
  fetched: boolean
}

const INITIAL_STATE: AQIState = {
  data: [],
  loading: false,
  error: null,
  fetched: false,
}

export function useAQI(lat: number | null, lon: number | null): AQIState & { fetch: () => void } {
  const [state, setState] = useState<AQIState>(INITIAL_STATE)

  // Reset when location changes — never auto-fetch
  useEffect(() => {
    setState(INITIAL_STATE)
  }, [lat, lon])

  const fetch = useCallback(() => {
    if (lat == null || lon == null) return

    setState((s) => ({ ...s, loading: true, error: null }))

    getHourlyAQI(lat, lon)
      .then((data) => setState({ data, loading: false, error: null, fetched: true }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load air quality data'
        setState({ data: [], loading: false, error: message, fetched: true })
      })
  }, [lat, lon])

  return { ...state, fetch }
}
