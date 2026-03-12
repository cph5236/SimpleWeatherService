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
  weatherCode: number
}

export interface DailyForecast {
  date: string
  tempMax: number
  tempMin: number
  precipProbability: number
  weatherCode: number
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

export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️'
  if (code >= 61 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code === 85 || code === 86) return '🌨️'
  if (code === 95) return '⛈️'
  if (code === 96 || code === 99) return '⛈️'
  return '🌡️'
}
