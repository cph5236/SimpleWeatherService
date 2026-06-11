export type Units = 'metric' | 'imperial'

export interface Location {
  name: string
  lat: number
  lon: number
  country: string
  admin1?: string
}

export interface CurrentWeather {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  isDay: boolean
  units: Units
}

export interface HourlyForecast {
  time: string
  temperature: number
  precipProbability: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  uvIndex: number
  isDay: boolean
}

export interface HourlyAQI {
  time: string
  usAqi: number
  pm10: number
  pm25: number
}

export interface DailyForecast {
  date: string
  tempMax: number
  tempMin: number
  feelsLikeMax: number
  feelsLikeMin: number
  precipProbability: number
  precipitationSum: number
  snowfallSum: number
  weatherCode: number
  windSpeedMax: number
  windDirectionDominant: number
  uvIndexMax: number
  humidityMean: number
  sunrise: string
  sunset: string
}

export interface SavedLocation extends Location {
  id: string
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code === 85 || code === 86) return 'Snow showers'
  if (code === 95) return 'Thunderstorm'
  if (code === 96 || code === 99) return 'Thunderstorm with hail'
  return 'Unknown'
}

// Maps a WMO weather code (plus day/night) to a Meteocons icon name. Only the
// clear and partly-cloudy conditions have a sun/moon, so only those vary by
// day/night; the rest use day-agnostic icons.
export function getWeatherIconName(code: number, isDay: boolean): string {
  const dayNight = isDay ? 'day' : 'night'
  if (code === 0) return `clear-${dayNight}`
  if (code <= 3) return `partly-cloudy-${dayNight}`
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code === 85 || code === 86) return 'snow'
  if (code === 95) return 'thunderstorms'
  if (code === 96 || code === 99) return 'thunderstorms-rain'
  return 'not-available'
}
