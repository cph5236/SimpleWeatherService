import type { Location } from '../types/weather'

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeocodingError'
  }
}

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
}

interface GeocodingResponse {
  results?: GeocodingResult[]
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

interface NominatimResponse {
  address: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country: string
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<Location> {
  const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json`
  let res: Response
  try {
    res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  } catch (err) {
    throw new GeocodingError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
  if (!res.ok) throw new GeocodingError(`Geocoding API error: ${res.statusText}`)

  const data: NominatimResponse = await res.json()
  const name =
    data.address.city ??
    data.address.town ??
    data.address.village ??
    data.address.county ??
    'Current Location'
  return {
    name,
    lat,
    lon,
    country: data.address.country ?? '',
    ...(data.address.state ? { admin1: data.address.state } : {}),
  }
}

export async function searchCity(query: string): Promise<Location[]> {
  if (!query.trim()) return []

  const url = `${BASE_URL}?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`

  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    throw new GeocodingError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  if (!res.ok) {
    throw new GeocodingError(`Geocoding API error: ${res.statusText}`)
  }

  const data: GeocodingResponse = await res.json()

  if (!data.results || data.results.length === 0) return []

  return data.results.map((r) => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
    ...(r.admin1 ? { admin1: r.admin1 } : {}),
  }))
}
