import type { SavedLocation } from '../types/weather'

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

interface SavedLocationsListProps {
  locations: SavedLocation[]
  activeId: string | null
  onSelect: (loc: SavedLocation) => void
  onRemove: (id: string) => void
}

export function SavedLocationsList({ locations, activeId, onSelect, onRemove }: SavedLocationsListProps) {
  if (locations.length === 0) return null

  return (
    <nav aria-label="Saved locations">
      <div className="d-flex flex-nowrap gap-2 pb-1" style={{ overflowX: 'auto' }}>
        {locations.map((loc) => {
          const isActive = loc.id === activeId
          const admin1Display = loc.admin1 ? formatAdmin1(loc.admin1, loc.country) : null
          const label = `${loc.name}${admin1Display ? `, ${admin1Display}` : ''}`
          return (
            <div
              key={loc.id}
              className={`d-inline-flex align-items-center flex-shrink-0 rounded-pill ${isActive ? 'bg-light text-dark' : 'border border-light text-white'}`}
              style={{ overflow: 'hidden' }}
            >
              <button
                type="button"
                className={`btn btn-sm border-0 rounded-0 ${isActive ? 'bg-light text-dark' : 'bg-transparent text-white'}`}
                style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onClick={() => onSelect(loc)}
                aria-current={isActive ? 'location' : undefined}
                title={label}
              >
                {label}
              </button>
              <button
                type="button"
                className={`btn btn-sm border-0 border-start rounded-0 px-2 ${isActive ? 'bg-light text-secondary border-secondary' : 'bg-transparent text-white-50 border-white-50'}`}
                style={{ opacity: 0.7 }}
                onClick={() => onRemove(loc.id)}
                aria-label={`Remove ${loc.name} from saved locations`}
                title="Remove"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
