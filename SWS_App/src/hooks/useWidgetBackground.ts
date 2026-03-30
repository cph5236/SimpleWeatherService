import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { WidgetConfigPlugin } from '../plugins/WidgetConfigPlugin'

const STORAGE_KEY_COLOR = 'sws-widget-bg-color'
const STORAGE_KEY_ALPHA = 'sws-widget-bg-alpha'

export const DEFAULT_BG_COLOR = '#000000'
export const DEFAULT_BG_ALPHA = 65

export function useWidgetBackground() {
  const [bgColor, setBgColorState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_COLOR) ?? DEFAULT_BG_COLOR
    } catch {
      return DEFAULT_BG_COLOR
    }
  })

  const [bgAlpha, setBgAlphaState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ALPHA)
      return stored !== null ? parseInt(stored, 10) : DEFAULT_BG_ALPHA
    } catch {
      return DEFAULT_BG_ALPHA
    }
  })

  // On mount on a native platform, sync from native SharedPreferences → web state.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    WidgetConfigPlugin.getWidgetBackground().then((result) => {
      if (result.color) {
        setBgColorState(result.color)
        setBgAlphaState(result.alpha ?? DEFAULT_BG_ALPHA)
      }
    })
  }, [])

  const setWidgetBackground = useCallback(async (color: string, alpha: number) => {
    setBgColorState(color)
    setBgAlphaState(alpha)
    try {
      localStorage.setItem(STORAGE_KEY_COLOR, color)
      localStorage.setItem(STORAGE_KEY_ALPHA, String(alpha))
    } catch {
      // ignore
    }
    if (Capacitor.isNativePlatform()) {
      await WidgetConfigPlugin.setWidgetBackground({ color, alpha })
    }
  }, [])

  return { bgColor, bgAlpha, setWidgetBackground }
}
