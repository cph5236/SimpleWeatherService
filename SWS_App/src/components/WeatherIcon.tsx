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
import fogNight from '@bybas/weather-icons/production/fill/all/fog-night.svg?raw'
import drizzle from '@bybas/weather-icons/production/fill/all/drizzle.svg?raw'
import rain from '@bybas/weather-icons/production/fill/all/rain.svg?raw'
import snow from '@bybas/weather-icons/production/fill/all/snow.svg?raw'
import thunderstorms from '@bybas/weather-icons/production/fill/all/thunderstorms.svg?raw'
import thunderstormsRain from '@bybas/weather-icons/production/fill/all/thunderstorms-rain.svg?raw'
import notAvailable from '@bybas/weather-icons/production/fill/all/not-available.svg?raw'

// All Meteocons SVGs use short generic gradient IDs (a, b, c…). When multiple
// icons are inlined on the same page those IDs collide and the wrong gradients
// are applied. We prefix every id and every reference to it with the icon name
// so each icon has a private namespace.
//
// IMPORTANT: xlink:href must be handled before the bare href rule, and the
// bare href rule uses a negative lookbehind to avoid double-prefixing the
// "href" fragment that already appears inside "xlink:href".
function prefixIds(svg: string, prefix: string): string {
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`)
    .replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${prefix}-${id}"`)
    .replace(/(?<!xlink:)href="#([^"]+)"/g, (_, id) => `href="#${prefix}-${id}"`)
}

// Meteocons colours the moon in night icons with an icy blue (#86c3db / #5eafcf).
// We remap those to a neutral white/silver so the crescent reads as a moon
// rather than an ice crystal. Applied only to icons that have a moon element,
// not to fog-night which intentionally keeps the icy palette.
function neutralMoon(svg: string): string {
  return svg
    .replace(/#86c3db/gi, '#f0ecd8')
    .replace(/#5eafcf/gi, '#d4c98e')
    .replace(/#72b9d5/gi, '#c2b87a')
}

// Let the SVG scale to the wrapper instead of its intrinsic size. Strip any
// existing width/height first so we never emit duplicate attributes if the
// icon set ever ships intrinsic dimensions.
function sized(svg: string): string {
  return svg
    .replace(/(<svg\b[^>]*?)\s+width="[^"]*"/, '$1')
    .replace(/(<svg\b[^>]*?)\s+height="[^"]*"/, '$1')
    .replace(/<svg\b/, '<svg width="100%" height="100%"')
}

function toStatic(svg: string): string {
  return sized(
    svg
      // Drop self-closing and paired SMIL animation elements.
      .replace(/<animate[A-Za-z]*\b[^>]*\/>/g, '')
      .replace(/<animate[A-Za-z]*\b[\s\S]*?<\/animate[A-Za-z]*>/g, '')
      .replace(/<set\b[^>]*\/>/g, '')
      .replace(/<set\b[\s\S]*?<\/set>/g, '')
  )
}

const SOURCES: Record<string, string> = {
  'clear-day': clearDay,
  'clear-night': clearNight,
  'partly-cloudy-day': partlyCloudyDay,
  'partly-cloudy-night': partlyCloudyNight,
  fog,
  'fog-night': fogNight,
  drizzle,
  rain,
  snow,
  thunderstorms,
  'thunderstorms-rain': thunderstormsRain,
  'not-available': notAvailable,
}

const MOON_ICONS = new Set(['clear-night', 'partly-cloudy-night'])

const ANIMATED_ICONS: Record<string, string> = {}
const STATIC_ICONS: Record<string, string> = {}
for (const [name, svg] of Object.entries(SOURCES)) {
  const adjusted = MOON_ICONS.has(name) ? neutralMoon(svg) : svg
  const prefixed = prefixIds(adjusted, name)
  ANIMATED_ICONS[name] = sized(prefixed)
  STATIC_ICONS[name] = toStatic(prefixed)
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
