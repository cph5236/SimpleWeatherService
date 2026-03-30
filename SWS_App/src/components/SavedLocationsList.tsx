import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CurrentWeather, SavedLocation, Units } from '../types/weather'
import { getWeatherEmoji } from '../types/weather'

const US_STATE_ABBREV: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
}

function formatAdmin1(admin1: string, country: string): string {
  if (country === 'United States' && US_STATE_ABBREV[admin1]) {
    return US_STATE_ABBREV[admin1]
  }
  return admin1
}

interface SortableLocationCardProps {
  loc: SavedLocation
  isActive: boolean
  weather: CurrentWeather | undefined
  weatherLoading: boolean
  unitLabel: string
  onSelect: (loc: SavedLocation) => void
  onRemove: (id: string) => void
}

function SortableLocationCard({
  loc,
  isActive,
  weather,
  weatherLoading,
  unitLabel,
  onSelect,
  onRemove,
}: SortableLocationCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: loc.id,
  })

  const admin1Display = loc.admin1 ? formatAdmin1(loc.admin1, loc.country) : null

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 rounded-3 border position-relative m-1"
      style={{
        width: 128,
        cursor: isDragging ? 'grabbing' : 'grab',
        borderColor: isActive ? 'var(--sws-accent)' : 'var(--sws-border)',
        backgroundColor: isActive ? 'var(--sws-saved-card-active-bg)' : 'var(--sws-surface-primary)',
        boxShadow: isActive ? '0 0 0 2px var(--sws-accent)' : '0 1px 3px rgba(0,0,0,0.07)',
        transition: transition ?? 'box-shadow 0.15s ease, border-color 0.15s ease',
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
      }}
      onClick={() => onSelect(loc)}
      {...attributes}
      {...listeners}
    >
      {/* Remove button */}
      <button
        type="button"
        className="btn-close position-absolute"
        style={{ top: 5, right: 5, fontSize: '0.45rem' }}
        onClick={(e) => {
          e.stopPropagation()
          onRemove(loc.id)
        }}
        aria-label={`Remove ${loc.name} from saved locations`}
      />

      <div className="p-2 pe-4 d-flex flex-column gap-1">
        {/* Weather row */}
        <div className="d-flex align-items-center gap-1">
          {weatherLoading && !weather ? (
            <span
              className="placeholder rounded"
              style={{ width: 60, height: '1.1em', display: 'inline-block' }}
              aria-hidden="true"
            />
          ) : weather ? (
            <>
              <span aria-hidden="true" style={{ fontSize: '1.05rem', lineHeight: 1 }}>
                {getWeatherEmoji(weather.weatherCode)}
              </span>
              <span
                className="fw-semibold"
                style={{ fontSize: '0.9rem', color: 'var(--sws-text-primary)' }}
              >
                {Math.round(weather.temperature)}{unitLabel}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--sws-text-muted)' }}>—</span>
          )}
        </div>

        {/* Location name */}
        <div>
          <div
            className="fw-medium text-truncate"
            style={{
              fontSize: '0.8rem',
              maxWidth: 90,
              color: 'var(--sws-text-primary)',
              lineHeight: 1.2,
            }}
            title={loc.name}
          >
            {loc.name}
          </div>
          {admin1Display && (
            <div style={{ fontSize: '0.7rem', color: 'var(--sws-text-muted)', lineHeight: 1.2 }}>
              {admin1Display}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface SavedLocationsListProps {
  locations: SavedLocation[]
  activeId: string | null
  onSelect: (loc: SavedLocation) => void
  onRemove: (id: string) => void
  onReorder: (from: number, to: number) => void
  weatherMap: Map<string, CurrentWeather>
  weatherLoading: boolean
  units: Units
}

export function SavedLocationsList({
  locations,
  activeId,
  onSelect,
  onRemove,
  onReorder,
  weatherMap,
  weatherLoading,
  units,
}: SavedLocationsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  )

  if (locations.length === 0) return null

  const unitLabel = units === 'imperial' ? '°F' : '°C'

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const from = locations.findIndex((l) => l.id === active.id)
      const to = locations.findIndex((l) => l.id === over.id)
      onReorder(from, to)
    }
  }

  return (
    <nav aria-label="Saved locations">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={locations.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          <div className="d-flex flex-nowrap gap-2 pb-1 sws-scroll-hide" style={{ overflowX: 'auto' }}>
            {locations.map((loc) => (
              <SortableLocationCard
                key={loc.id}
                loc={loc}
                isActive={loc.id === activeId}
                weather={weatherMap.get(loc.id)}
                weatherLoading={weatherLoading}
                unitLabel={unitLabel}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </nav>
  )
}
