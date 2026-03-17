export const NOAA_WMS_URL = 'https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows'

export const NOAA_WMS_PARAMS = {
  layers: 'conus_bref_qcd',
  format: 'image/png',
  transparent: true,
  version: '1.1.1',
} as const

export function isInUS(lat: number, lon: number): boolean {
  return lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66
}
