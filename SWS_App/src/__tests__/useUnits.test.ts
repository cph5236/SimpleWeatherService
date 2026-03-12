import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Test localStorage persistence logic for useUnits
const STORAGE_KEY = 'sws-units'

function readUnits(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'metric' || stored === 'imperial') return stored
  } catch {
    // ignore
  }
  return 'metric'
}

function writeUnits(units: string) {
  localStorage.setItem(STORAGE_KEY, units)
}

describe('useUnits localStorage logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('defaults to metric when nothing is stored', () => {
    expect(readUnits()).toBe('metric')
  })

  it('reads metric when stored', () => {
    writeUnits('metric')
    expect(readUnits()).toBe('metric')
  })

  it('reads imperial when stored', () => {
    writeUnits('imperial')
    expect(readUnits()).toBe('imperial')
  })

  it('falls back to metric for invalid stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'banana')
    expect(readUnits()).toBe('metric')
  })

  it('toggleUnits logic switches between metric and imperial', () => {
    let units = readUnits()
    expect(units).toBe('metric')

    units = units === 'metric' ? 'imperial' : 'metric'
    writeUnits(units)
    expect(readUnits()).toBe('imperial')

    units = units === 'metric' ? 'imperial' : 'metric'
    writeUnits(units)
    expect(readUnits()).toBe('metric')
  })
})
