import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'sws-icon-animation'

function readAnimated(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'on') return true
    if (stored === 'off') return false
  } catch {
    // localStorage unavailable
  }
  return true // animations on by default
}

export function useIconAnimationPref(): { animated: boolean; toggleAnimated: () => void } {
  const [animated, setAnimated] = useState<boolean>(readAnimated)

  function toggleAnimated() {
    setAnimated((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }

  return { animated, toggleAnimated }
}

// Lets the leaf WeatherIcon read the preference without prop-drilling through
// every component that renders an icon. Defaults to animated when no provider
// is present.
export const IconAnimationContext = createContext<boolean>(true)

export function useIconAnimation(): boolean {
  return useContext(IconAnimationContext)
}
