import type { CurrentWeather, DailyForecast, HourlyForecast, Units } from '../types/weather'

export class WeatherError extends Error {
  code: number
  constructor(
    message: string,
    code: number
  ) {
    super(message)
    this.name = 'WeatherError'
    this.code = code
  }
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export const CURRENT_TTL_MS = 60 * 1000
export const HOURLY_TTL_MS = 60 * 60 * 1000
export const DAILY_TTL_MS = 4 * 60 * 60 * 1000

export function clearWeatherCache(): void {
  cache.clear()
}

export function clearCurrentWeatherCache(lat: number, lon: number, units: Units): void {
  cache.delete(`current,${lat},${lon},${units}`)
}

export function clearHourlyWeatherCache(lat: number, lon: number, units: Units): void {
  cache.delete(`hourly,${lat},${lon},${units}`)
}

export function clearDailyWeatherCache(lat: number, lon: number, units: Units): void {
  cache.delete(`daily,${lat},${lon},${units}`)
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCached<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl })
}

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

function unitParams(units: Units): string {
  if (units === 'imperial') {
    return '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch'
  }
  return '&temperature_unit=celsius'
}

async function fetchWeather(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new WeatherError(`Weather API error: ${res.statusText}`, res.status)
  }
  return res.json()
}

export interface LocationWeather {
  temperature: number
  weatherCode: number
  isDay: boolean
}

export async function getBatchCurrentWeather(
  locations: Array<{ lat: number; lon: number; id: string }>,
  units: Units
): Promise<Map<string, LocationWeather>> {
  if (locations.length === 0) return new Map()

  const result = new Map<string, LocationWeather>()
  const uncached: Array<{ lat: number; lon: number; id: string }> = []

  for (const loc of locations) {
    const key = `saved-batch,${loc.lat},${loc.lon},${units}`
    const cached = getCached<LocationWeather>(key)
    if (cached) {
      result.set(loc.id, cached)
    } else {
      uncached.push(loc)
    }
  }

  if (uncached.length > 0) {
    const lats = uncached.map((l) => l.lat).join(',')
    const lons = uncached.map((l) => l.lon).join(',')
    const url =
      `${BASE_URL}?latitude=${lats}&longitude=${lons}` +
      `&current=temperature_2m,weather_code,is_day` +
      unitParams(units) +
      '&forecast_days=1&timezone=auto'

    const json = await fetchWeather(url)

    // Open-Meteo returns a plain object for N=1, array for N>1
    const responses = Array.isArray(json)
      ? (json as Array<{ current: { temperature_2m: number; weather_code: number; is_day: number } }>)
      : [json as { current: { temperature_2m: number; weather_code: number; is_day: number } }]

    responses.forEach((item, i) => {
      const loc = uncached[i]
      const weather: LocationWeather = {
        temperature: item.current.temperature_2m,
        weatherCode: item.current.weather_code,
        isDay: item.current.is_day === 1,
      }
      setCached(`saved-batch,${loc.lat},${loc.lon},${units}`, weather, CURRENT_TTL_MS)
      result.set(loc.id, weather)
    })
  }

  return result
}

export async function getCurrentWeather(lat: number, lon: number, units: Units): Promise<CurrentWeather> {
  const key = `current,${lat},${lon},${units}`
  const cached = getCached<CurrentWeather>(key)
  if (cached) return cached

  const url =
    `${BASE_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day` +
    unitParams(units) + '&timezone=auto'

  const json = await fetchWeather(url)
  const data = json as {
    current: {
      temperature_2m: number
      apparent_temperature: number
      relative_humidity_2m: number
      wind_speed_10m: number
      wind_direction_10m: number
      weather_code: number
      is_day: number
    }
  }

  const result: CurrentWeather = {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    units,
  }

  setCached(key, result, CURRENT_TTL_MS)
  return result
}

export async function getDailyForecast(lat: number, lon: number, units: Units): Promise<DailyForecast[]> {
  const key = `daily,${lat},${lon},${units}`
  const cached = getCached<DailyForecast[]>(key)
  if (cached) return cached

  const url =
    `${BASE_URL}?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,` +
    `precipitation_probability_max,precipitation_sum,snowfall_sum,weather_code,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,relative_humidity_2m_mean,sunrise,sunset&forecast_days=10` +
    unitParams(units) + '&timezone=auto'

  const json = await fetchWeather(url)
  const data = json as {
    daily: {
      time: string[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      apparent_temperature_max: number[]
      apparent_temperature_min: number[]
      precipitation_probability_max: number[]
      precipitation_sum: number[]
      snowfall_sum: number[]
      weather_code: number[]
      wind_speed_10m_max: number[]
      wind_direction_10m_dominant: number[]
      uv_index_max: number[]
      relative_humidity_2m_mean: number[]
      sunrise: string[]
      sunset: string[]
    }
  }

  const result: DailyForecast[] = data.daily.time.map((date, i) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    feelsLikeMax: data.daily.apparent_temperature_max[i],
    feelsLikeMin: data.daily.apparent_temperature_min[i],
    precipProbability: data.daily.precipitation_probability_max[i] ?? 0,
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    snowfallSum: data.daily.snowfall_sum[i] ?? 0,
    weatherCode: data.daily.weather_code[i],
    windSpeedMax: data.daily.wind_speed_10m_max[i],
    windDirectionDominant: data.daily.wind_direction_10m_dominant[i] ?? 0,
    uvIndexMax: data.daily.uv_index_max[i],
    humidityMean: data.daily.relative_humidity_2m_mean[i] ?? 0,
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
  }))

  setCached(key, result, DAILY_TTL_MS)
  return result
}

// Raw 48-hour data stored in cache; slice is recomputed on every call so past
// hours are automatically trimmed without an extra API request.
interface HourlyRawData {
  utcOffsetSeconds: number
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  wind_speed_10m: number[]
  wind_direction_10m: number[]
  weather_code: number[]
  uv_index: number[]
}

export async function getHourlyForecast(lat: number, lon: number, units: Units): Promise<HourlyForecast[]> {
  const key = `hourly,${lat},${lon},${units}`

  let raw = getCached<HourlyRawData>(key)

  // Invalidate cache entries that predate the wind_direction_10m field addition.
  if (raw && !raw.wind_direction_10m) raw = null

  if (!raw) {
    const url =
      `${BASE_URL}?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code,uv_index&forecast_days=2` +
      unitParams(units) + '&timezone=auto'

    const json = await fetchWeather(url)
    const data = json as {
      utc_offset_seconds: number
      hourly: {
        time: string[]
        temperature_2m: number[]
        precipitation_probability: number[]
        wind_speed_10m: number[]
        wind_direction_10m: number[]
        weather_code: number[]
        uv_index: number[]
      }
    }

    raw = {
      utcOffsetSeconds: data.utc_offset_seconds,
      time: data.hourly.time,
      temperature_2m: data.hourly.temperature_2m,
      precipitation_probability: data.hourly.precipitation_probability,
      wind_speed_10m: data.hourly.wind_speed_10m,
      wind_direction_10m: data.hourly.wind_direction_10m,
      weather_code: data.hourly.weather_code,
      uv_index: data.hourly.uv_index,
    }

    setCached(key, raw, HOURLY_TTL_MS)
  }

  // Always recompute the slice from current local time so past hours are trimmed.
  const resolved = raw!
  const currentHour = new Date(Date.now() + resolved.utcOffsetSeconds * 1000).toISOString().slice(0, 13)
  const startIndex = resolved.time.findIndex((t) => t >= currentHour)
  const sliceStart = startIndex === -1 ? 0 : startIndex

  return resolved.time.slice(sliceStart, sliceStart + 24).map((time, i) => ({
    time,
    temperature: resolved.temperature_2m[sliceStart + i],
    precipProbability: resolved.precipitation_probability[sliceStart + i] ?? 0,
    windSpeed: resolved.wind_speed_10m[sliceStart + i],
    windDirection: resolved.wind_direction_10m[sliceStart + i] ?? 0,
    weatherCode: resolved.weather_code[sliceStart + i],
    uvIndex: resolved.uv_index[sliceStart + i] ?? 0,
  }))
}
