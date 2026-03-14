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
const CURRENT_TTL_MS = 60 * 1000
const FORECAST_TTL_MS = 30 * 60 * 1000

export function clearWeatherCache(): void {
  cache.clear()
}

export function clearCurrentWeatherCache(lat: number, lon: number, units: Units): void {
  cache.delete(`current,${lat},${lon},${units}`)
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
    `precipitation_probability_max,precipitation_sum,weather_code,wind_speed_10m_max,uv_index_max,sunrise,sunset&forecast_days=10` +
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
      weather_code: number[]
      wind_speed_10m_max: number[]
      uv_index_max: number[]
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
    weatherCode: data.daily.weather_code[i],
    windSpeedMax: data.daily.wind_speed_10m_max[i],
    uvIndexMax: data.daily.uv_index_max[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
  }))

  setCached(key, result, FORECAST_TTL_MS)
  return result
}

export async function getHourlyForecast(lat: number, lon: number, units: Units): Promise<HourlyForecast[]> {
  const key = `hourly,${lat},${lon},${units}`
  const cached = getCached<HourlyForecast[]>(key)
  if (cached) return cached

  const url =
    `${BASE_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&forecast_days=2` +
    unitParams(units) + '&timezone=auto'

  const json = await fetchWeather(url)
  const data = json as {
    utc_offset_seconds: number
    hourly: {
      time: string[]
      temperature_2m: number[]
      precipitation_probability: number[]
      wind_speed_10m: number[]
      weather_code: number[]
    }
  }

  const currentHour = new Date(Date.now() + data.utc_offset_seconds * 1000).toISOString().slice(0, 13)

  const startIndex = data.hourly.time.findIndex((t) => t >= currentHour)
  const sliceStart = startIndex === -1 ? 0 : startIndex

  const result: HourlyForecast[] = data.hourly.time.slice(sliceStart, sliceStart + 24).map((time, i) => ({
    time,
    temperature: data.hourly.temperature_2m[sliceStart + i],
    precipProbability: data.hourly.precipitation_probability[sliceStart + i] ?? 0,
    windSpeed: data.hourly.wind_speed_10m[sliceStart + i],
    weatherCode: data.hourly.weather_code[sliceStart + i],
  }))

  setCached(key, result, FORECAST_TTL_MS)
  return result
}
