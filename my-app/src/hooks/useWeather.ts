import { useEffect, useRef, useState } from 'react'
import { getCurrentWeather, getDailyForecast, getHourlyForecast } from '../services/weather'
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
  units: Units
): WeatherState & { refetch: () => void } {
  const [state, setState] = useState<WeatherState>({
    current: null,
    daily: [],
    hourly: [],
    loading: false,
    error: null,
  })

  const fetchCountRef = useRef(0)

  function fetch_() {
    if (!location) return

    const fetchId = ++fetchCountRef.current
    setState((prev) => ({ ...prev, loading: true, error: null }))

    Promise.all([
      getCurrentWeather(location.lat, location.lon, units),
      getDailyForecast(location.lat, location.lon, units),
      getHourlyForecast(location.lat, location.lon, units),
    ])
      .then(([current, daily, hourly]) => {
        if (fetchId !== fetchCountRef.current) return
        setState({ current, daily, hourly, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (fetchId !== fetchCountRef.current) return
        const message = err instanceof Error ? err.message : 'Failed to fetch weather data'
        setState((prev) => ({ ...prev, loading: false, error: message }))
      })
  }

  useEffect(() => {
    fetch_()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon, units])

  return { ...state, refetch: fetch_ }
}
