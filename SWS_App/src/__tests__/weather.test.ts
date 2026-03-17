import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WeatherError, clearWeatherCache, getCurrentWeather, getDailyForecast, getHourlyForecast } from '../services/weather'

const mockFetch = vi.fn()

beforeEach(() => {
  clearWeatherCache()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

function makeResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Server Error',
    json: () => Promise.resolve(body),
  } as unknown as Response
}

const mockCurrentResponse = {
  current: {
    temperature_2m: 22.5,
    apparent_temperature: 20.1,
    relative_humidity_2m: 65,
    wind_speed_10m: 15.3,
    wind_direction_10m: 270,
    weather_code: 1,
    is_day: 1,
  },
}

const mockDailyResponse = {
  daily: {
    time: ['2026-03-11', '2026-03-12'],
    temperature_2m_max: [24, 22],
    temperature_2m_min: [14, 12],
    apparent_temperature_max: [22, 20],
    apparent_temperature_min: [12, 10],
    precipitation_probability_max: [10, 30],
    precipitation_sum: [0, 2.4],
    snowfall_sum: [0, 0.5],
    weather_code: [1, 61],
    wind_speed_10m_max: [18, 25],
    wind_direction_10m_dominant: [270, 315],
    uv_index_max: [4, 2],
    relative_humidity_2m_mean: [65, 72],
    sunrise: ['2026-03-11T06:30', '2026-03-12T06:31'],
    sunset: ['2026-03-11T18:30', '2026-03-12T18:31'],
  },
}

const pad = (n: number) => String(n).padStart(2, '0')
const hourlyTimes = Array.from({ length: 48 }, (_, i) => {
  const day = i < 24 ? '2026-03-11' : '2026-03-12'
  return `${day}T${pad(i % 24)}:00`
})

const mockHourlyResponse = {
  utc_offset_seconds: 0,
  hourly: {
    time: hourlyTimes,
    temperature_2m: Array.from({ length: 48 }, (_, i) => 20 + i * 0.1),
    precipitation_probability: Array.from({ length: 48 }, () => 5),
    wind_speed_10m: Array.from({ length: 48 }, () => 10),
    wind_direction_10m: Array.from({ length: 48 }, () => 180),
    weather_code: Array.from({ length: 48 }, () => 0),
    uv_index: Array.from({ length: 48 }, () => 3),
  },
}

describe('getCurrentWeather', () => {
  it('maps API response to CurrentWeather DTO', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(mockCurrentResponse))

    const result = await getCurrentWeather(51.5, -0.1, 'metric')

    expect(result).toEqual({
      temperature: 22.5,
      feelsLike: 20.1,
      humidity: 65,
      windSpeed: 15.3,
      windDirection: 270,
      weatherCode: 1,
      isDay: true,
      units: 'metric',
    })
  })

  it('uses celsius params for metric units', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(mockCurrentResponse))
    await getCurrentWeather(51.5, -0.1, 'metric')
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('temperature_unit=celsius')
  })

  it('uses fahrenheit and mph params for imperial units', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(mockCurrentResponse))
    await getCurrentWeather(51.5, -0.1, 'imperial')
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('temperature_unit=fahrenheit')
    expect(url).toContain('wind_speed_unit=mph')
  })

  it('throws WeatherError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, false, 503))
    await expect(getCurrentWeather(51.5, -0.1, 'metric')).rejects.toBeInstanceOf(WeatherError)
  })

  it('returns cached result on second call within TTL', async () => {
    // Use a unique lat/lon pair to avoid cross-test cache collision
    mockFetch.mockResolvedValue(makeResponse(mockCurrentResponse))
    await getCurrentWeather(10.0, 20.0, 'metric')
    await getCurrentWeather(10.0, 20.0, 'metric')
    // fetch should only have been called once (second call uses cache)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('getDailyForecast', () => {
  it('maps API response to DailyForecast array', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(mockDailyResponse))

    const result = await getDailyForecast(51.5, -0.1, 'metric')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      date: '2026-03-11',
      tempMax: 24,
      tempMin: 14,
      feelsLikeMax: 22,
      feelsLikeMin: 12,
      precipProbability: 10,
      precipitationSum: 0,
      snowfallSum: 0,
      weatherCode: 1,
      windSpeedMax: 18,
      windDirectionDominant: 270,
      uvIndexMax: 4,
      humidityMean: 65,
      sunrise: '2026-03-11T06:30',
      sunset: '2026-03-11T18:30',
    })
  })
})

describe('getHourlyForecast', () => {
  it('returns 24 entries', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(mockHourlyResponse))
    const result = await getHourlyForecast(51.5, -0.1, 'metric')
    expect(result).toHaveLength(24)
  })

  it('maps each entry to HourlyForecast shape', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(mockHourlyResponse))
    const result = await getHourlyForecast(51.5, -0.1, 'metric')
    expect(result[0]).toHaveProperty('time')
    expect(result[0]).toHaveProperty('temperature')
    expect(result[0]).toHaveProperty('precipProbability')
    expect(result[0]).toHaveProperty('windSpeed')
    expect(result[0]).toHaveProperty('weatherCode')
    expect(result[0]).toHaveProperty('uvIndex')
  })

  it('starts from location local time, not UTC, when utc_offset_seconds is negative', async () => {
    // UTC 03:00 with UTC-5 offset → local time is 22:00 (10 PM) on the previous day
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T03:00:00Z'))

    const offsetResponse = {
      utc_offset_seconds: -18000, // UTC-5
      hourly: {
        time: Array.from({ length: 48 }, (_, i) => {
          const day = i < 24 ? '2026-03-11' : '2026-03-12'
          return `${day}T${pad(i % 24)}:00`
        }),
        temperature_2m: Array.from({ length: 48 }, () => 20),
        precipitation_probability: Array.from({ length: 48 }, () => 0),
        wind_speed_10m: Array.from({ length: 48 }, () => 10),
        wind_direction_10m: Array.from({ length: 48 }, () => 0),
        weather_code: Array.from({ length: 48 }, () => 0),
        uv_index: Array.from({ length: 48 }, () => 0),
      },
    }

    mockFetch.mockResolvedValueOnce(makeResponse(offsetResponse))
    const result = await getHourlyForecast(51.5, -0.1, 'metric')

    // Local 10 PM (hour 22), not UTC 3 AM (which would be "2026-03-12T03:00")
    expect(result[0].time).toBe('2026-03-11T22:00')

    vi.useRealTimers()
  })
})
