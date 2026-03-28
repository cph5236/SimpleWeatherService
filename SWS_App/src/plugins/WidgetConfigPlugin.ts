import { registerPlugin } from '@capacitor/core'
import type { Units } from '../types/weather'

export interface WidgetLocationPayload {
  name: string
  lat: number
  lon: number
  country: string
  admin1?: string
  units: Units
}

export interface WidgetLocationResult {
  configured: boolean
  name?: string
  lat?: number
  lon?: number
  country?: string
  admin1?: string
  units?: Units
}

export interface WidgetConfigPluginInterface {
  setWidgetLocation(payload: WidgetLocationPayload): Promise<void>
  getWidgetLocation(): Promise<WidgetLocationResult>
}

// Web fallback: no-ops so the app doesn't throw when running in a browser.
const WebFallback: WidgetConfigPluginInterface = {
  setWidgetLocation: async () => {},
  getWidgetLocation: async () => ({ configured: false }),
}

export const WidgetConfigPlugin = registerPlugin<WidgetConfigPluginInterface>(
  'WidgetConfig',
  { web: WebFallback },
)
