import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchRadarFrames, RAINVIEWER_TTL_MS } from '../services/rainviewer'
import type { RadarFrame } from '../services/rainviewer'

interface RadarState {
  frames: RadarFrame[]
  loading: boolean
  error: string | null
}

const INITIAL: RadarState = { frames: [], loading: true, error: null }

export function useRadar() {
  const [state, setState] = useState<RadarState>(INITIAL)
  const mountedRef = useRef(true)

  const load = useCallback(() => {
    fetchRadarFrames()
      .then((frames) => {
        if (mountedRef.current) setState({ frames, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return
        const message = err instanceof Error ? err.message : 'Failed to load radar data'
        setState((s) => ({ ...s, loading: false, error: message }))
      })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()
    const id = setInterval(load, RAINVIEWER_TTL_MS)
    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [load])

  return { ...state, refetch: load }
}
