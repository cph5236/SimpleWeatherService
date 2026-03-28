import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { WidgetConfigPlugin } from '../plugins/WidgetConfigPlugin'
import type { Location, SavedLocation, Units } from '../types/weather'

const STORAGE_KEY = 'sws-widget-location-id'
const MODE_KEY = 'sws-widget-mode'

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function readStoredMode(): 'auto' | 'manual' {
  try {
    return localStorage.getItem(MODE_KEY) === 'manual' ? 'manual' : 'auto'
  } catch {
    return 'auto'
  }
}

export function useWidgetLocation(units: Units) {
  const [widgetLocationId, setWidgetLocationId] = useState<string | null>(readStoredId)
  const [widgetMode, setWidgetMode] = useState<'auto' | 'manual'>(readStoredMode)
  const [widgetLocation, setWidgetLocationState] = useState<SavedLocation | null>(null)
  // Tracks the last location synced in auto mode so units changes can re-write SharedPrefs.
  const lastAutoLocRef = useRef<Location | null>(null)

  // On mount on a native platform, sync from native SharedPreferences → web state.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    WidgetConfigPlugin.getWidgetLocation().then((result) => {
      if (!result.configured) {
        setWidgetLocationId(null)
        setWidgetLocationState(null)
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      }
    })
  }, [])

  // When units change in manual mode, re-write SharedPrefs so the widget fetches with new units.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !widgetLocation) return
    WidgetConfigPlugin.setWidgetLocation({
      name: widgetLocation.name,
      lat: widgetLocation.lat,
      lon: widgetLocation.lon,
      country: widgetLocation.country,
      admin1: widgetLocation.admin1,
      units,
    })
  }, [units, widgetLocation])

  // When units change in auto mode, re-write with the last known auto location.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || widgetMode !== 'auto') return
    const loc = lastAutoLocRef.current
    if (!loc) return
    WidgetConfigPlugin.setWidgetLocation({
      name: loc.name,
      lat: loc.lat,
      lon: loc.lon,
      country: loc.country,
      admin1: loc.admin1,
      units,
    })
  }, [units, widgetMode])

  // Called by HomePage whenever activeLocation changes.
  // Only updates the widget if in auto mode — manual overrides are left alone.
  const syncAutoLocation = useCallback(
    async (loc: Location | null) => {
      if (widgetMode !== 'auto' || !loc) return
      lastAutoLocRef.current = loc
      if (!Capacitor.isNativePlatform()) return
      await WidgetConfigPlugin.setWidgetLocation({
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        country: loc.country,
        admin1: loc.admin1,
        units,
      })
    },
    [widgetMode, units],
  )

  // Called by SettingsModal. Pass null to revert to auto mode.
  const setWidgetLocation = useCallback(
    async (loc: SavedLocation | null) => {
      if (loc === null) {
        setWidgetMode('auto')
        setWidgetLocationId(null)
        setWidgetLocationState(null)
        try {
          localStorage.removeItem(STORAGE_KEY)
          localStorage.setItem(MODE_KEY, 'auto')
        } catch {
          // ignore
        }
        return
      }

      setWidgetMode('manual')
      const id = `${loc.lat},${loc.lon}`
      setWidgetLocationId(id)
      setWidgetLocationState(loc)
      try {
        localStorage.setItem(STORAGE_KEY, id)
        localStorage.setItem(MODE_KEY, 'manual')
      } catch {
        // ignore
      }

      if (Capacitor.isNativePlatform()) {
        await WidgetConfigPlugin.setWidgetLocation({
          name: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          country: loc.country,
          admin1: loc.admin1,
          units,
        })
      }
    },
    [units],
  )

  return { widgetLocationId, widgetMode, setWidgetLocation, syncAutoLocation }
}
