import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GeocodingError, searchCity } from '../services/geocode'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('searchCity', () => {
  it('returns empty array for empty query', async () => {
    const result = await searchCity('')
    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns empty array when API returns no results', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}))
    const result = await searchCity('xyznonexistent')
    expect(result).toEqual([])
  })

  it('maps API results to Location objects', async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        results: [
          {
            id: 1,
            name: 'London',
            latitude: 51.5074,
            longitude: -0.1278,
            country: 'United Kingdom',
            admin1: 'England',
          },
          {
            id: 2,
            name: 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            country: 'France',
          },
        ],
      })
    )

    const result = await searchCity('lon')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      name: 'London',
      lat: 51.5074,
      lon: -0.1278,
      country: 'United Kingdom',
      admin1: 'England',
    })
    expect(result[1]).toEqual({
      name: 'Paris',
      lat: 48.8566,
      lon: 2.3522,
      country: 'France',
    })
  })

  it('omits admin1 when not present in API response', async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        results: [{ id: 1, name: 'Monaco', latitude: 43.73, longitude: 7.42, country: 'Monaco' }],
      })
    )

    const result = await searchCity('monaco')
    expect(result[0]).not.toHaveProperty('admin1')
  })

  it('throws GeocodingError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, false, 500))
    await expect(searchCity('london')).rejects.toBeInstanceOf(GeocodingError)
  })

  it('throws GeocodingError on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'))
    await expect(searchCity('london')).rejects.toBeInstanceOf(GeocodingError)
  })
})
