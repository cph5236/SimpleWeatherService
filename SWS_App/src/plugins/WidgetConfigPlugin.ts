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

export interface WidgetBackgroundPayload {
  color: string // "#RRGGBB"
  alpha: number // 0–100 percent
}

export interface WidgetBackgroundResult {
  color?: string
  alpha?: number
}

export interface WidgetConfigPluginInterface {
  setWidgetLocation(payload: WidgetLocationPayload): Promise<void>
  getWidgetLocation(): Promise<WidgetLocationResult>
  setWidgetBackground(payload: WidgetBackgroundPayload): Promise<void>
  getWidgetBackground(): Promise<WidgetBackgroundResult>
}

// Web fallback: no-ops so the app doesn't throw when running in a browser.
const WebFallback: WidgetConfigPluginInterface = {
  setWidgetLocation: async () => {},
  getWidgetLocation: async () => ({ configured: false }),
  setWidgetBackground: async () => {},
  getWidgetBackground: async () => ({}),
}

export const WidgetConfigPlugin = registerPlugin<WidgetConfigPluginInterface>(
  'WidgetConfig',
  { web: WebFallback },
)
