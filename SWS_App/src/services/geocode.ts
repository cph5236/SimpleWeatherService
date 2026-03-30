import type { Location } from '../types/weather'

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeocodingError'
  }
}

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
}

const ABBREVIATION_MAP: [RegExp, string][] = [
  [/\btwsp\b/gi, 'Township'],
  [/\btwp\b/gi, 'Township'],
  [/\bcty\b/gi, 'County'],
  [/\bmt\b/gi, 'Mount'],
  [/\bft\b/gi, 'Fort'],
  [/\bpt\b/gi, 'Point'],
  [/\bhts\b/gi, 'Heights'],
  [/\bvlg\b/gi, 'Village'],
  [/\bjct\b/gi, 'Junction'],
]

function expandAbbreviations(name: string): string {
  return ABBREVIATION_MAP.reduce((n, [pattern, expansion]) => n.replace(pattern, expansion), name)
}

function parseQuery(raw: string): { cityName: string; stateName: string | null; countryCode: string | null } {
  const match = raw.trim().match(/^(.+?)[\s,]+([a-zA-Z]{2})$/)
  if (match) {
    const abbrev = match[2].toUpperCase()
    const stateName = US_STATE_ABBREVIATIONS[abbrev]
    if (stateName) {
      return { cityName: match[1].trim(), stateName, countryCode: 'US' }
    }
  }
  return { cityName: raw.trim(), stateName: null, countryCode: null }
}

function getLocaleCountryCode(): string | null {
  try {
    const parts = navigator.language.split('-')
    if (parts.length >= 2 && parts[parts.length - 1].length === 2) {
      return parts[parts.length - 1].toUpperCase()
    }
  } catch {
    // navigator not available
  }
  return null
}

// Photon (primary forward geocoding — OSM-backed, autocomplete-friendly)
const PHOTON_URL = 'https://photon.komoot.io/api'

interface PhotonProperties {
  name: string
  country?: string
  state?: string
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: PhotonProperties
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

async function fetchPhoton(cityName: string): Promise<Location[]> {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(cityName)}&limit=5&lang=en`
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    return []
  }
  if (!res.ok) return []
  const data: PhotonResponse = await res.json()
  if (!data.features?.length) return []
  return data.features.map((f) => ({
    name: f.properties.name,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    country: f.properties.country ?? '',
    ...(f.properties.state ? { admin1: f.properties.state } : {}),
  }))
}

// Open-Meteo (fallback forward geocoding — GeoNames-backed)
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

async function fetchOpenMeteo(cityName: string, countryCode: string | null): Promise<Location[]> {
  const countryParam = countryCode ? `&countryCode=${countryCode}` : ''
  const url = `${BASE_URL}?name=${encodeURIComponent(cityName)}&count=5&language=en&format=json${countryParam}`

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

export async function searchCity(query: string): Promise<Location[]> {
  if (!query.trim()) return []

  const { cityName: rawCityName, stateName, countryCode: parsedCountryCode } = parseQuery(query)
  const cityName = expandAbbreviations(rawCityName)
  const countryCode = parsedCountryCode ?? getLocaleCountryCode()

  const photonQuery = stateName ? `${cityName} ${stateName}` : cityName
  const photonResults = await fetchPhoton(photonQuery)
  if (photonResults.length > 0) return photonResults

  // Photon empty or unavailable — fall back to Open-Meteo
  if (countryCode) {
    const meteoResults = await fetchOpenMeteo(cityName, countryCode)
    if (meteoResults.length > 0) return meteoResults
  }

  return fetchOpenMeteo(cityName, null)
}
