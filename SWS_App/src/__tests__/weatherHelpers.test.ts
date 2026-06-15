import { describe, expect, it } from 'vitest'
import { getWeatherDescription, getWeatherIconName } from '../types/weather'

describe('getWeatherDescription', () => {
  it('returns Clear sky for code 0', () => {
    expect(getWeatherDescription(0)).toBe('Clear sky')
  })

  it('returns Partly cloudy for codes 1-3', () => {
    expect(getWeatherDescription(1)).toBe('Partly cloudy')
    expect(getWeatherDescription(2)).toBe('Partly cloudy')
    expect(getWeatherDescription(3)).toBe('Partly cloudy')
  })

  it('returns Fog for codes 45 and 48', () => {
    expect(getWeatherDescription(45)).toBe('Fog')
    expect(getWeatherDescription(48)).toBe('Fog')
  })

  it('returns Drizzle for codes 51-57', () => {
    expect(getWeatherDescription(51)).toBe('Drizzle')
    expect(getWeatherDescription(55)).toBe('Drizzle')
  })

  it('returns Rain for codes 61-67', () => {
    expect(getWeatherDescription(61)).toBe('Rain')
    expect(getWeatherDescription(65)).toBe('Rain')
  })

  it('returns Snow for codes 71-77', () => {
    expect(getWeatherDescription(71)).toBe('Snow')
  })

  it('returns Showers for codes 80-82', () => {
    expect(getWeatherDescription(80)).toBe('Showers')
    expect(getWeatherDescription(82)).toBe('Showers')
  })

  it('returns Snow showers for codes 85-86', () => {
    expect(getWeatherDescription(85)).toBe('Snow showers')
    expect(getWeatherDescription(86)).toBe('Snow showers')
  })

  it('returns Thunderstorm for code 95', () => {
    expect(getWeatherDescription(95)).toBe('Thunderstorm')
  })

  it('returns Thunderstorm with hail for codes 96 and 99', () => {
    expect(getWeatherDescription(96)).toBe('Thunderstorm with hail')
    expect(getWeatherDescription(99)).toBe('Thunderstorm with hail')
  })

  it('returns Unknown for unrecognized codes', () => {
    expect(getWeatherDescription(999)).toBe('Unknown')
  })
})

describe('getWeatherIconName', () => {
  it('returns clear-day for code 0 during the day, clear-night at night', () => {
    expect(getWeatherIconName(0, true)).toBe('clear-day')
    expect(getWeatherIconName(0, false)).toBe('clear-night')
  })

  it('returns partly-cloudy day/night variants for codes 1-3', () => {
    expect(getWeatherIconName(1, true)).toBe('partly-cloudy-day')
    expect(getWeatherIconName(2, false)).toBe('partly-cloudy-night')
    expect(getWeatherIconName(3, false)).toBe('partly-cloudy-night')
  })

  it('returns fog for code 45 and the icy fog-night variant for code 48', () => {
    expect(getWeatherIconName(45, true)).toBe('fog')
    expect(getWeatherIconName(45, false)).toBe('fog')
    expect(getWeatherIconName(48, true)).toBe('fog-night')
    expect(getWeatherIconName(48, false)).toBe('fog-night')
  })

  it('returns rain for codes 61-67 regardless of day/night', () => {
    expect(getWeatherIconName(61, true)).toBe('rain')
    expect(getWeatherIconName(65, false)).toBe('rain')
  })

  it('returns thunderstorms-rain for codes 96 and 99', () => {
    expect(getWeatherIconName(96, true)).toBe('thunderstorms-rain')
    expect(getWeatherIconName(99, false)).toBe('thunderstorms-rain')
  })

  it('returns not-available for unrecognized codes', () => {
    expect(getWeatherIconName(999, true)).toBe('not-available')
  })
})
