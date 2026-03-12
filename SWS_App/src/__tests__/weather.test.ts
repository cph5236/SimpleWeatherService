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
    precipitation_probability_max: [10, 30],
    weather_code: [1, 61],
    sunrise: ['2026-03-11T06:30', '2026-03-12T06:31'],
    sunset: ['2026-03-11T18:30', '2026-03-12T18:31'],
  },
}

const mockHourlyResponse = {
  hourly: {
    time: Array.from({ length: 48 }, (_, i) => {
      const d = new Date('2026-03-11T00:00:00')
      d.setHours(i)
      return d.toISOString().slice(0, 16)
    }),
    temperature_2m: Array.from({ length: 48 }, (_, i) => 20 + i * 0.1),
    precipitation_probability: Array.from({ length: 48 }, () => 5),
    wind_speed_10m: Array.from({ length: 48 }, () => 10),
    weather_code: Array.from({ length: 48 }, () => 0),
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
      precipProbability: 10,
      weatherCode: 1,
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
  })
})
