const MANIFEST_URL = 'https://api.rainviewer.com/public/weather-maps.json'
export const RAINVIEWER_TTL_MS = 10 * 60 * 1000

interface RainViewerFrame {
  time: number
  path: string
}

interface RainViewerManifest {
  version: string
  generated: number
  host: string
  radar: {
    past: RainViewerFrame[]
    nowcast: RainViewerFrame[]
  }
}

export interface RadarFrame {
  time: number
  path: string
  tileUrl: string
}

interface CacheEntry {
  data: RadarFrame[]
  expiresAt: number
}

let cached: CacheEntry | null = null

function buildTileUrl(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`
}

export async function fetchRadarFrames(): Promise<RadarFrame[]> {
  if (cached && Date.now() < cached.expiresAt) return cached.data

  const res = await fetch(MANIFEST_URL)
  if (!res.ok) throw new Error(`RainViewer fetch failed: ${res.status}`)

  const manifest = (await res.json()) as RainViewerManifest

  const frames: RadarFrame[] = [
    ...manifest.radar.past,
    ...manifest.radar.nowcast,
  ].map((f) => ({
    time: f.time,
    path: f.path,
    tileUrl: buildTileUrl(manifest.host, f.path),
  }))

  cached = { data: frames, expiresAt: Date.now() + RAINVIEWER_TTL_MS }
  return frames
}
