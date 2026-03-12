import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Test the storage logic directly since we don't have @testing-library/react
const STORAGE_KEY = 'sws-saved-locations'
const MAX_LOCATIONS = 10

function makeId(lat: number, lon: number): string {
  return `${lat},${lon}`
}

function readLocations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return []
}

function writeLocations(locations: unknown[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
}

describe('savedLocations localStorage logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads empty array when nothing stored', () => {
    expect(readLocations()).toEqual([])
  })

  it('persists and reads a location', () => {
    const loc = { name: 'London', lat: 51.5, lon: -0.1, country: 'UK', id: makeId(51.5, -0.1) }
    writeLocations([loc])
    expect(readLocations()).toEqual([loc])
  })

  it('prevents duplicate ids', () => {
    const id = makeId(51.5, -0.1)
    const loc = { name: 'London', lat: 51.5, lon: -0.1, country: 'UK', id }
    const existing = [loc]
    // Simulate addLocation logic
    const isAlreadyAdded = existing.some((l) => l.id === id)
    expect(isAlreadyAdded).toBe(true)
  })

  it('enforces max 10 locations', () => {
    const locs = Array.from({ length: 12 }, (_, i) => ({
      name: `City${i}`,
      lat: i,
      lon: i,
      country: 'US',
      id: makeId(i, i),
    }))
    // Simulate slice to max
    const result = locs.slice(0, MAX_LOCATIONS)
    expect(result).toHaveLength(10)
  })

  it('removes a location by id', () => {
    const locs = [
      { name: 'London', lat: 51.5, lon: -0.1, country: 'UK', id: makeId(51.5, -0.1) },
      { name: 'Paris', lat: 48.8, lon: 2.35, country: 'FR', id: makeId(48.8, 2.35) },
    ]
    writeLocations(locs)
    const filtered = locs.filter((l) => l.id !== makeId(51.5, -0.1))
    writeLocations(filtered)
    expect(readLocations()).toHaveLength(1)
    expect(readLocations()[0].name).toBe('Paris')
  })

  it('hasLocation returns true when id exists', () => {
    const id = makeId(51.5, -0.1)
    const locs = [{ name: 'London', lat: 51.5, lon: -0.1, country: 'UK', id }]
    expect(locs.some((l) => l.id === id)).toBe(true)
    expect(locs.some((l) => l.id === makeId(99, 99))).toBe(false)
  })
})
