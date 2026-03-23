import { useState, useEffect, useRef, useCallback } from 'react'
import L, { type Map as LeafletMap } from 'leaflet'
import { MapContainer, TileLayer, WMSTileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './RadarMap.css'
import { useRadar } from '../hooks/useRadar'
import { NOAA_WMS_URL, NOAA_WMS_PARAMS } from '../services/noaaRadar'

type MapSource = 'rainviewer' | 'noaa'

interface RadarMapProps {
  lat: number
  lon: number
  country: string
}

const RAINVIEWER_LEGEND = [
  { color: '#96d2fa', label: 'Light' },
  { color: '#04e604', label: 'Moderate' },
  { color: '#f0f050', label: 'Heavy' },
  { color: '#e89632', label: 'Very Heavy' },
  { color: '#e83200', label: 'Intense' },
  { color: '#9600b4', label: 'Extreme' },
]

const NOAA_RAIN_LEGEND = [
  { color: '#00ffff', label: 'Very Light (5+ dBZ)' },
  { color: '#00ff00', label: 'Light (20+ dBZ)' },
  { color: '#ffff00', label: 'Moderate (30+ dBZ)' },
  { color: '#ff9000', label: 'Heavy (40+ dBZ)' },
  { color: '#ff0000', label: 'Intense (50+ dBZ)' },
  { color: '#be0000', label: 'Severe (60+ dBZ)' },
  { color: '#ff00ff', label: 'Extreme (65+ dBZ)' },
]

const NOAA_WINTER_LEGEND = [
  { color: '#add8e6', label: 'Flurries' },
  { color: '#00ffff', label: 'Light Snow' },
  { color: '#00ff00', label: 'Moderate Snow' },
  { color: '#ffff00', label: 'Heavy Snow / Squall' },
  { color: '#ff69b4', label: 'Freezing Rain / Sleet' },
  { color: '#ff9000', label: 'Dangerous Accumulation' },
]

interface RadarLegendProps {
  mapSource: MapSource
  expanded: boolean
  onToggle: () => void
}

function RadarLegend({ mapSource, expanded, onToggle }: RadarLegendProps) {
  if (!expanded) {
    return (
      <button className="radar-map-legend-btn" onClick={onToggle}>
        Legend ▾
      </button>
    )
  }

  const rainItems = mapSource === 'noaa' ? NOAA_RAIN_LEGEND : RAINVIEWER_LEGEND
  const sectionTitle = mapSource === 'noaa' ? 'Rain & Storms' : 'Precipitation'

  return (
    <div className="radar-map-legend">
      <div className="radar-map-legend-header" onClick={onToggle}>
        <span>{sectionTitle}</span>
        <span>▴</span>
      </div>
      {rainItems.map(({ color, label }) => (
        <div key={label} className="radar-map-legend-item">
          <span className="radar-map-legend-swatch" style={{ background: color }} />
          <span>{label}</span>
        </div>
      ))}
      {mapSource === 'noaa' && (
        <>
          <div className="radar-map-legend-divider" />
          <div className="radar-map-legend-section">Winter Weather</div>
          {NOAA_WINTER_LEGEND.map(({ color, label }) => (
            <div key={label} className="radar-map-legend-item">
              <span className="radar-map-legend-swatch" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function MapController({
  lat,
  lon,
  expanded,
  mapRef,
  onViewChange,
}: {
  lat: number
  lon: number
  expanded: boolean
  mapRef: React.RefObject<LeafletMap | null>
  onViewChange: (center: [number, number], zoom: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    mapRef.current = map
    return () => {
      mapRef.current = null
    }
  }, [map, mapRef])

  useEffect(() => {
    function update() {
      const c = map.getCenter()
      onViewChange([c.lat, c.lng], map.getZoom())
    }
    map.on('moveend', update)
    map.on('zoomend', update)
    return () => {
      map.off('moveend', update)
      map.off('zoomend', update)
    }
  }, [map, onViewChange])

  const prevLocationRef = useRef<{ lat: number; lon: number } | null>(null)
  useEffect(() => {
    const prev = prevLocationRef.current
    prevLocationRef.current = { lat, lon }
    // Only re-center when the selected location actually changes, not on every remount
    if (prev && (prev.lat !== lat || prev.lon !== lon)) {
      map.setView([lat, lon], map.getZoom())
    }
  }, [map, lat, lon])

  useEffect(() => {
    // Allow DOM to update before recalculating map size
    const id = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(id)
  }, [map, expanded])

  useEffect(() => {
    if (expanded) {
      map.scrollWheelZoom.enable()
    } else {
      map.scrollWheelZoom.disable()
    }
  }, [map, expanded])

  return null
}

function RecenterControl({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  const latRef = useRef(lat)
  const lonRef = useRef(lon)

  useEffect(() => { latRef.current = lat }, [lat])
  useEffect(() => { lonRef.current = lon }, [lon])

  useEffect(() => {
    const control = new L.Control({ position: 'topleft' })
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
      const btn = L.DomUtil.create('a', 'radar-map-recenter-btn', container)
      btn.innerHTML = '⌖'
      btn.title = 'Re-center on location'
      btn.setAttribute('aria-label', 'Re-center map on location')
      btn.setAttribute('role', 'button')
      btn.href = '#'
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        L.DomEvent.stopPropagation(e)
        map.setView([latRef.current, lonRef.current], 8)
      })
      return container
    }
    control.addTo(map)
    return () => { control.remove() }
  }, [map])

  return null
}

function formatTimeAgo(unixSeconds: number): string {
  const diffMin = Math.round((Date.now() / 1000 - unixSeconds) / 60)
  if (diffMin < 1) return 'just now'
  if (diffMin === 1) return '1 min ago'
  return `${diffMin} min ago`
}

export function RadarMap({ lat, lon, country }: RadarMapProps) {
  const { frames, error } = useRadar()
  const [expanded, setExpanded] = useState(false)
  const [mapSource, setMapSource] = useState<MapSource>(() => (country === 'United States' ? 'noaa' : 'rainviewer'))
  const [legendExpanded, setLegendExpanded] = useState(false)

  const [lastView, setLastView] = useState<{ center: [number, number]; zoom: number }>({ center: [lat, lon], zoom: 8 })
  const mapRef = useRef<LeafletMap | null>(null)

  const handleViewChange = useCallback((center: [number, number], zoom: number) => {
    setLastView({ center, zoom })
  }, [])

  const latestFrame = frames.length > 0 ? frames[frames.length - 1] : null

  // Close fullscreen on Escape
  useEffect(() => {
    if (!expanded) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [expanded])

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [expanded])

  const mapContent = (
    <MapContainer
      center={lastView.center}
      zoom={lastView.zoom}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <MapController lat={lat} lon={lon} expanded={expanded} mapRef={mapRef} onViewChange={handleViewChange} />
      <RecenterControl lat={lat} lon={lon} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapSource === 'rainviewer' && latestFrame && (
        <TileLayer
          url={latestFrame.tileUrl}
          opacity={0.6}
          maxNativeZoom={6}
          attribution='Radar by <a href="https://www.rainviewer.com/">RainViewer</a>'
        />
      )}
      {mapSource === 'noaa' && (
        <WMSTileLayer
          url={NOAA_WMS_URL}
          params={NOAA_WMS_PARAMS}
          opacity={0.6}
          attribution='Radar by <a href="https://www.weather.gov/">NOAA/NWS</a>'
        />
      )}
    </MapContainer>
  )

  const sourceToggle = (
    <div className="btn-group btn-group-sm me-2" role="group" aria-label="Radar source">
      <button
        type="button"
        className={`btn btn-sm ${mapSource === 'rainviewer' ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => setMapSource('rainviewer')}
      >
        RainViewer
      </button>
      <button
        type="button"
        className={`btn btn-sm ${mapSource === 'noaa' ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => setMapSource('noaa')}
        title="US coverage only"
      >
        NOAA
      </button>
    </div>
  )

  if (expanded) {
    return (
      <div className="radar-map-fullscreen">
        <button
          type="button"
          className="btn btn-light btn-sm shadow radar-map-close-btn"
          onClick={() => setExpanded(false)}
          aria-label="Close fullscreen map"
        >
          ✕
        </button>
        <div style={{ position: 'relative', flex: 1 }}>
          {mapContent}
          {mapSource === 'rainviewer' && latestFrame && (
            <div className="radar-map-timestamp">
              Radar: {formatTimeAgo(latestFrame.time)}
            </div>
          )}
          {mapSource === 'rainviewer' && error && (
            <div className="radar-map-timestamp text-danger">Radar unavailable</div>
          )}
          <RadarLegend
            mapSource={mapSource}
            expanded={legendExpanded}
            onToggle={() => setLegendExpanded((e) => !e)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="card shadow-sm radar-map-card">
      <div className="d-flex justify-content-between align-items-center px-3 py-2 flex-shrink-0">
        <h3 className="fs-6 fw-semibold mb-0">Radar Map</h3>
        <div className="d-flex align-items-center">
          {sourceToggle}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setExpanded(true)}
            aria-label="Expand map to fullscreen"
          >
            ⛶
          </button>
        </div>
      </div>
      <div className="radar-map-body">
        <div className="radar-map-inner">
          {mapContent}
          {mapSource === 'rainviewer' && latestFrame && (
            <div className="radar-map-timestamp">
              Radar: {formatTimeAgo(latestFrame.time)}
            </div>
          )}
          {mapSource === 'rainviewer' && error && (
            <div className="radar-map-timestamp text-danger">Radar unavailable</div>
          )}
          <RadarLegend
            mapSource={mapSource}
            expanded={legendExpanded}
            onToggle={() => setLegendExpanded((e) => !e)}
          />
        </div>
      </div>
    </div>
  )
}
