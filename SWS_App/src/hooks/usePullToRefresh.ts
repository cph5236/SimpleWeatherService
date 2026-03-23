import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 80
const MAX_PULL = 120
const COOLDOWN_MS = 60 * 1000

export function usePullToRefresh(onRefresh: () => void, lastRefreshed: number) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const startYRef = useRef(0)
  const activeRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  const lastRefreshedRef = useRef(lastRefreshed)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    lastRefreshedRef.current = lastRefreshed
  }, [lastRefreshed])

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY !== 0) return
      startYRef.current = e.touches[0].clientY
      activeRef.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!activeRef.current) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) {
        activeRef.current = false
        setIsPulling(false)
        setPullDistance(0)
        return
      }
      e.preventDefault()
      setIsPulling(true)
      setPullDistance(Math.min(delta, MAX_PULL))
    }

    function onTouchEnd() {
      if (!activeRef.current) return
      activeRef.current = false
      setIsPulling(false)
      setPullDistance((prev) => {
        if (prev >= THRESHOLD && Date.now() - lastRefreshedRef.current >= COOLDOWN_MS) {
          onRefreshRef.current()
        }
        return 0
      })
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return { pullDistance, isPulling }
}
