import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GeocodingError, searchCity } from '../services/geocode'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockClear()
  vi.stubGlobal('fetch', mockFetch)
  vi.stubGlobal('navigator', { language: 'en' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Generic HTTP response mock
function makeResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    json: () => Promise.resolve(body),
  } as unknown as Response
}

// Photon GeoJSON response mock
function makePhotonResponse(
  places: Array<{ name: string; lat: number; lon: number; country: string; state?: string }>
): Response {
  return makeResponse({
    features: places.map((p) => ({
      geometry: { coordinates: [p.lon, p.lat] },
      properties: { name: p.name, country: p.country, ...(p.state ? { state: p.state } : {}) },
    })),
  })
}

// Open-Meteo response mock
function makeMeteoResponse(
  places: Array<{ name: string; lat: number; lon: number; country: string; admin1?: string }>
): Response {
  return makeResponse({
    results: places.map((p, i) => ({
      id: i + 1,
      name: p.name,
      latitude: p.lat,
      longitude: p.lon,
      country: p.country,
      ...(p.admin1 ? { admin1: p.admin1 } : {}),
    })),
  })
}

describe('searchCity', () => {
  it('returns empty array for empty query', async () => {
    const result = await searchCity('')
    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns empty array when both Photon and Open-Meteo return no results', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon: empty
    mockFetch.mockResolvedValueOnce(makeResponse({})) // Open-Meteo: empty
    const result = await searchCity('xyznonexistent')
    expect(result).toEqual([])
  })

  it('maps Photon results to Location objects', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([
        { name: 'London', lat: 51.5074, lon: -0.1278, country: 'United Kingdom', state: 'England' },
        { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France' },
      ])
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
    expect(result[1]).toEqual({ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France' })
  })

  it('omits admin1 when state not present in Photon response', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Monaco', lat: 43.73, lon: 7.42, country: 'Monaco' }])
    )
    const result = await searchCity('monaco')
    expect(result[0]).not.toHaveProperty('admin1')
  })

  it('throws GeocodingError when Open-Meteo fallback returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon: empty → falls through
    mockFetch.mockResolvedValueOnce(makeResponse({}, false, 500)) // Open-Meteo: error
    await expect(searchCity('london')).rejects.toBeInstanceOf(GeocodingError)
  })

  it('throws GeocodingError when Open-Meteo fallback has network failure', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon: empty → falls through
    mockFetch.mockRejectedValueOnce(new Error('Network down')) // Open-Meteo: network error
    await expect(searchCity('london')).rejects.toBeInstanceOf(GeocodingError)
  })
})

describe('searchCity — Photon/Open-Meteo fallback', () => {
  it('uses Photon results and does not call Open-Meteo when Photon succeeds', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'London', lat: 51.5, lon: -0.12, country: 'United Kingdom' }])
    )
    const result = await searchCity('London')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0]).toContain('photon.komoot.io')
    expect(result[0].name).toBe('London')
  })

  it('falls back to Open-Meteo when Photon returns empty', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon: empty
    mockFetch.mockResolvedValueOnce(
      makeMeteoResponse([{ name: 'London', lat: 51.5, lon: -0.12, country: 'United Kingdom' }])
    )
    const result = await searchCity('London')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[1][0]).toContain('geocoding-api.open-meteo.com')
    expect(result[0].name).toBe('London')
  })

  it('falls back to Open-Meteo when Photon has a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Photon down')) // Photon: network error → []
    mockFetch.mockResolvedValueOnce(
      makeMeteoResponse([{ name: 'London', lat: 51.5, lon: -0.12, country: 'United Kingdom' }])
    )
    const result = await searchCity('London')
    expect(result[0].name).toBe('London')
  })

  it('falls back to Open-Meteo when Photon returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, false, 503)) // Photon: non-ok → []
    mockFetch.mockResolvedValueOnce(
      makeMeteoResponse([{ name: 'London', lat: 51.5, lon: -0.12, country: 'United Kingdom' }])
    )
    const result = await searchCity('London')
    expect(result[0].name).toBe('London')
  })
})

describe('searchCity — state abbreviation parsing', () => {
  it('expands "PA" to "Pennsylvania" in Photon query for "Erie PA"', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Erie', lat: 42.12, lon: -80.08, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Erie PA')
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('photon.komoot.io')
    expect(decodeURIComponent(url)).toContain('q=Erie Pennsylvania')
  })

  it('expands ", pa" to "Pennsylvania" in Photon query for "Corry, pa"', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Corry', lat: 41.93, lon: -79.64, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Corry, pa')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('q=Corry Pennsylvania')
  })

  it('expands multi-word city "Union City PA" to "Union City Pennsylvania"', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Union City', lat: 41.9, lon: -79.84, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Union City PA')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('q=Union City Pennsylvania')
  })

  it('returns results on first Photon request when expanded query succeeds', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Erie', lat: 42.12, lon: -80.08, country: 'United States', state: 'Pennsylvania' }])
    )
    const result = await searchCity('Erie PA')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Erie')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('Open-Meteo fallback uses bare city name (not expanded) for "Erie PA"', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon: empty
    mockFetch.mockResolvedValueOnce(
      makeMeteoResponse([{ name: 'Erie', lat: 42.12, lon: -80.08, country: 'United States', admin1: 'Pennsylvania' }])
    )
    await searchCity('Erie PA')
    const meteoUrl: string = mockFetch.mock.calls[1][0]
    expect(meteoUrl).toContain('name=Erie')
    expect(decodeURIComponent(meteoUrl)).not.toContain('Pennsylvania')
    expect(meteoUrl).toContain('countryCode=US')
  })

  it('does not send countrycode for queries without a state abbreviation', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'London', lat: 51.5, lon: -0.12, country: 'United Kingdom' }])
    )
    await searchCity('London')
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).not.toContain('countrycode')
  })
})

describe('searchCity — locale country detection', () => {
  it('Photon call never includes countrycode (unsupported param)', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Erie', lat: 42.12, lon: -80.08, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Erie')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('photon.komoot.io')
    expect(url).not.toContain('countrycode')
  })

  it('Open-Meteo fallback uses countryCode=US when navigator.language is "en-US"', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon: empty
    mockFetch.mockResolvedValueOnce(
      makeMeteoResponse([{ name: 'Erie', lat: 42.12, lon: -80.08, country: 'United States', admin1: 'Pennsylvania' }])
    )
    await searchCity('Erie')
    const meteoUrl: string = mockFetch.mock.calls[1][0]
    expect(meteoUrl).toContain('geocoding-api.open-meteo.com')
    expect(meteoUrl).toContain('countryCode=US')
  })

  it('does not add countryCode to Open-Meteo when navigator.language has no region subtag', async () => {
    vi.stubGlobal('navigator', { language: 'en' })
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon: empty
    mockFetch.mockResolvedValueOnce(makeResponse({})) // Open-Meteo: empty
    await searchCity('Erie')
    const meteoUrl: string = mockFetch.mock.calls[1][0]
    expect(meteoUrl).not.toContain('countryCode')
  })
})

describe('searchCity — municipal abbreviation expansion', () => {
  it('expands "Twp" to "Township" before sending to Photon', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Cranberry Township', lat: 40.68, lon: -80.1, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Cranberry Twp PA')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('q=Cranberry Township Pennsylvania')
  })

  it('expands "Twsp" to "Township"', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Cranberry Township', lat: 40.68, lon: -80.1, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Cranberry Twsp PA')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('Cranberry Township')
  })

  it('expands "Cty" to "County"', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Erie County', lat: 42.12, lon: -80.08, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Erie Cty PA')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('Erie County')
  })

  it('expands "Mt" to "Mount" in city name without breaking state detection', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Mount Pleasant', lat: 43.6, lon: -84.77, country: 'United States', state: 'Michigan' }])
    )
    await searchCity('Mt Pleasant MI')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('q=Mount Pleasant Michigan')
  })

  it('does not expand MT state abbreviation (Montana) to Mount', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Helena', lat: 46.59, lon: -112.02, country: 'United States', state: 'Montana' }])
    )
    await searchCity('Helena MT')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('q=Helena Montana')
    expect(decodeURIComponent(url)).not.toContain('Mount')
  })

  it('expands "Ft" to "Fort"', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Fort Wayne', lat: 41.13, lon: -85.12, country: 'United States', state: 'Indiana' }])
    )
    await searchCity('Ft Wayne IN')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('Fort Wayne Indiana')
  })

  it('does not alter queries with no abbreviations', async () => {
    mockFetch.mockResolvedValueOnce(
      makePhotonResponse([{ name: 'Erie', lat: 42.12, lon: -80.08, country: 'United States', state: 'Pennsylvania' }])
    )
    await searchCity('Erie PA')
    const url: string = mockFetch.mock.calls[0][0]
    expect(decodeURIComponent(url)).toContain('q=Erie Pennsylvania')
  })
})

describe('searchCity — full fallback chain with country code', () => {
  it('retries Open-Meteo without countryCode when all country-filtered searches return empty', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    mockFetch.mockResolvedValueOnce(makeResponse({ features: [] })) // Photon (countrycode=us): empty
    mockFetch.mockResolvedValueOnce(makeResponse({})) // Open-Meteo (countryCode=US): empty
    mockFetch.mockResolvedValueOnce(
      makeMeteoResponse([{ name: 'London', lat: 51.5, lon: -0.12, country: 'United Kingdom' }])
    )
    const result = await searchCity('London')
    expect(mockFetch).toHaveBeenCalledTimes(3)
    const lastUrl: string = mockFetch.mock.calls[2][0]
    expect(lastUrl).toContain('geocoding-api.open-meteo.com')
    expect(lastUrl).not.toContain('countryCode')
    expect(result[0].name).toBe('London')
  })
})
