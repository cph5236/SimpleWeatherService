import { getWeatherIconName } from '../types/weather'
import { useIconAnimation } from '../hooks/useIconAnimation'

// Meteocons (https://github.com/basmilius/weather-icons, MIT) ships animated
// SVGs. We import the raw markup and keep two variants per icon: the animated
// original and a static one with the SMIL animation tags stripped. Which is
// used is driven by the user's icon-animation preference.
import clearDay from '@bybas/weather-icons/production/fill/all/clear-day.svg?raw'
import clearNight from '@bybas/weather-icons/production/fill/all/clear-night.svg?raw'
import partlyCloudyDay from '@bybas/weather-icons/production/fill/all/partly-cloudy-day.svg?raw'
import partlyCloudyNight from '@bybas/weather-icons/production/fill/all/partly-cloudy-night.svg?raw'
import fog from '@bybas/weather-icons/production/fill/all/fog.svg?raw'
import drizzle from '@bybas/weather-icons/production/fill/all/drizzle.svg?raw'
import rain from '@bybas/weather-icons/production/fill/all/rain.svg?raw'
import snow from '@bybas/weather-icons/production/fill/all/snow.svg?raw'
import thunderstorms from '@bybas/weather-icons/production/fill/all/thunderstorms.svg?raw'
import thunderstormsRain from '@bybas/weather-icons/production/fill/all/thunderstorms-rain.svg?raw'
import notAvailable from '@bybas/weather-icons/production/fill/all/not-available.svg?raw'

// Let the SVG scale to the wrapper instead of its intrinsic size.
function sized(svg: string): string {
  return svg.replace(/<svg\b/, '<svg width="100%" height="100%"')
}

function toStatic(svg: string): string {
  return sized(
    svg
      // Drop self-closing and paired SMIL animation elements.
      .replace(/<animate[A-Za-z]*\b[^>]*\/>/g, '')
      .replace(/<animate[A-Za-z]*\b[\s\S]*?<\/animate[A-Za-z]*>/g, '')
      .replace(/<set\b[^>]*\/>/g, '')
  )
}

const SOURCES: Record<string, string> = {
  'clear-day': clearDay,
  'clear-night': clearNight,
  'partly-cloudy-day': partlyCloudyDay,
  'partly-cloudy-night': partlyCloudyNight,
  fog,
  drizzle,
  rain,
  snow,
  thunderstorms,
  'thunderstorms-rain': thunderstormsRain,
  'not-available': notAvailable,
}

const ANIMATED_ICONS: Record<string, string> = {}
const STATIC_ICONS: Record<string, string> = {}
for (const [name, svg] of Object.entries(SOURCES)) {
  ANIMATED_ICONS[name] = sized(svg)
  STATIC_ICONS[name] = toStatic(svg)
}

interface WeatherIconProps {
  code: number
  /** Whether it's daytime; controls the sun-vs-moon variant. Defaults to day. */
  isDay?: boolean
  /** Rendered width/height in pixels. */
  size?: number
  className?: string
}

export function WeatherIcon({ code, isDay = true, size = 32, className }: WeatherIconProps) {
  const animated = useIconAnimation()
  const name = getWeatherIconName(code, isDay)
  const icons = animated ? ANIMATED_ICONS : STATIC_ICONS
  const svg = icons[name] ?? icons['not-available']
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
