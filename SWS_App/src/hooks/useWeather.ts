import { useEffect, useRef, useState } from 'react'
import {
  DAILY_TTL_MS,
  HOURLY_TTL_MS,
  clearCurrentWeatherCache,
  clearDailyWeatherCache,
  clearHourlyWeatherCache,
  getCurrentWeather,
  getDailyForecast,
  getHourlyForecast,
} from '../services/weather'
import type { CurrentWeather, DailyForecast, HourlyForecast, Location, Units } from '../types/weather'

interface WeatherState {
  current: CurrentWeather | null
  daily: DailyForecast[]
  hourly: HourlyForecast[]
  loading: boolean
  error: string | null
}

export function useWeather(
  location: Location | null,
  units: Units,
  prefetchedCurrent: CurrentWeather | null = null
): WeatherState & { refetch: () => void; refetchCurrent: () => void; lastCurrentFetch: number } {
  const [state, setState] = useState<WeatherState>({
    current: null,
    daily: [],
    hourly: [],
    loading: false,
    error: null,
  })
  const [lastCurrentFetch, setLastCurrentFetch] = useState(0)
  const [lastHourlyFetch, setLastHourlyFetch] = useState(0)
  const [lastDailyFetch, setLastDailyFetch] = useState(0)

  const fetchCountRef = useRef(0)
  const prefetchedRef = useRef(prefetchedCurrent)
  prefetchedRef.current = prefetchedCurrent

  function fetch_() {
    if (!location) return

    const fetchId = ++fetchCountRef.current
    setState((prev) => ({ ...prev, loading: true, error: null }))

    // Use pre-fetched current weather from the batch call if available;
    // fall back to an individual getCurrentWeather request otherwise.
    const currentPromise = prefetchedRef.current
      ? Promise.resolve(prefetchedRef.current)
      : getCurrentWeather(location.lat, location.lon, units)

    Promise.all([
      currentPromise,
      getDailyForecast(location.lat, location.lon, units),
      getHourlyForecast(location.lat, location.lon, units),
    ])
      .then(([current, daily, hourly]) => {
        if (fetchId !== fetchCountRef.current) return
        const ts = Date.now()
        setLastCurrentFetch(ts)
        setLastHourlyFetch(ts)
        setLastDailyFetch(ts)
        setState({ current, daily, hourly, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (fetchId !== fetchCountRef.current) return
        const message = err instanceof Error ? err.message : 'Failed to fetch weather data'
        setState((prev) => ({ ...prev, loading: false, error: message }))
      })
  }

  function refetchCurrent() {
    if (!location) return

    clearCurrentWeatherCache(location.lat, location.lon, units)

    const now = Date.now()
    const hourlyStale = now - lastHourlyFetch > HOURLY_TTL_MS
    const dailyStale = now - lastDailyFetch > DAILY_TTL_MS

    // Clear forecast caches only when TTL has expired; otherwise the service
    // recomputes the hourly slice from cached raw data (free, no API call).
    if (hourlyStale) clearHourlyWeatherCache(location.lat, location.lon, units)
    if (dailyStale) clearDailyWeatherCache(location.lat, location.lon, units)

    Promise.all([
      getCurrentWeather(location.lat, location.lon, units),
      getHourlyForecast(location.lat, location.lon, units),
      getDailyForecast(location.lat, location.lon, units),
    ])
      .then(([current, hourly, daily]) => {
        const ts = Date.now()
        setLastCurrentFetch(ts)
        if (hourlyStale) setLastHourlyFetch(ts)
        if (dailyStale) setLastDailyFetch(ts)
        setState((prev) => ({ ...prev, current, hourly, daily }))
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to fetch weather data'
        setState((prev) => ({ ...prev, error: message }))
      })
  }

  useEffect(() => {
    fetch_()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon, units])

  // When prefetchedCurrent arrives (batch resolves) and useWeather is still loading,
  // update the current weather immediately without waiting for daily/hourly.
  useEffect(() => {
    if (prefetchedCurrent && state.loading) {
      setState((prev) => ({ ...prev, current: prefetchedCurrent }))
      setLastCurrentFetch(Date.now())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchedCurrent])

  return { ...state, refetch: fetch_, refetchCurrent, lastCurrentFetch }
}
