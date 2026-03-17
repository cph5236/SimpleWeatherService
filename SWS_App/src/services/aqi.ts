import type { HourlyAQI } from '../types/weather'

const AQI_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
export const AQI_TTL_MS = 60 * 60 * 1000

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

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

export function clearAQICache(lat: number, lon: number): void {
  cache.delete(`aqi,${lat},${lon}`)
}

export async function getHourlyAQI(lat: number, lon: number): Promise<HourlyAQI[]> {
  const key = `aqi,${lat},${lon}`

  const cached = getCached<HourlyAQI[]>(key)
  if (cached) return cached

  const url =
    `${AQI_BASE_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=us_aqi,pm10,pm2_5&timezone=auto&forecast_days=2`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`AQI fetch failed: ${res.status}`)

  const json = await res.json() as {
    utc_offset_seconds: number
    hourly: {
      time: string[]
      us_aqi: number[]
      pm10: number[]
      pm2_5: number[]
    }
  }

  // Slice to the next 24 hours from the current local time (mirrors getHourlyForecast)
  const currentHour = new Date(Date.now() + json.utc_offset_seconds * 1000).toISOString().slice(0, 13)
  const startIndex = json.hourly.time.findIndex((t) => t >= currentHour)
  const sliceStart = startIndex === -1 ? 0 : startIndex

  const data = json.hourly.time.slice(sliceStart, sliceStart + 24).map((time, i) => ({
    time,
    usAqi: json.hourly.us_aqi[sliceStart + i] ?? 0,
    pm10: json.hourly.pm10[sliceStart + i] ?? 0,
    pm25: json.hourly.pm2_5[sliceStart + i] ?? 0,
  }))

  setCached(key, data, AQI_TTL_MS)
  return data
}
