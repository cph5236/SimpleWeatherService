import { useEffect, useId, useRef, useState } from 'react'
import { reverseGeocode, searchCity } from '../services/geocode'
import type { Location } from '../types/weather'

interface SearchBarProps {
  onSelect: (location: Location) => void
  placeholder?: string
}

export function SearchBar({ onSelect, placeholder = 'Search for a city…' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const inputId = useId()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  // totalItems = GPS option (1) + search results
  const totalItems = 1 + results.length
  const open = focused

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const locs = await searchCity(query)
        setResults(locs)
        setActiveIndex(-1)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(loc: Location) {
    onSelect(loc)
    setQuery('')
    setResults([])
    setFocused(false)
    setActiveIndex(-1)
  }

  function handleGpsSelect() {
    if (!navigator.geolocation) return
    setLocating(true)
    setFocused(false)
    setActiveIndex(-1)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          onSelect(loc)
        } catch {
          // silent fail — user stays on current location
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setLocationError(err.code === err.PERMISSION_DENIED ? 'Location access denied' : 'Could not get location')
      },
      { timeout: 10000 }
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex === 0) {
        handleGpsSelect()
      } else if (activeIndex > 0 && results[activeIndex - 1]) {
        handleSelect(results[activeIndex - 1])
      } else if (activeIndex === -1 && results.length === 1) {
        handleSelect(results[0])
      }
    } else if (e.key === 'Escape') {
      setFocused(false)
      setActiveIndex(-1)
    }
  }

  const activeOptionId = activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined

  return (
    <div className="position-relative" style={{ maxWidth: 360, width: '100%' }}>
      <div className="input-group">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLocationError(null) }}
          onKeyDown={handleKeyDown}
          onFocus={() => { setFocused(true); setLocationError(null) }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          role="combobox"
          aria-label="Search for a city"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
        />
        {(loading || locating) && (
          <span className="input-group-text">
            <span className="spinner-border spinner-border-sm" role="status" aria-label="Searching" />
          </span>
        )}
      </div>

      {locationError && <div className="text-danger small mt-1 ps-1">{locationError}</div>}

      {open && (
        <ul
          id={listId}
          className="list-group position-absolute w-100 shadow-sm z-3"
          role="listbox"
          aria-label="City suggestions"
          style={{ top: '100%', marginTop: 2 }}
        >
          <li
            id={`${listId}-option-0`}
            className={`list-group-item list-group-item-action d-flex align-items-center gap-2${activeIndex === 0 ? ' active' : ''}`}
            role="option"
            aria-selected={activeIndex === 0}
            onMouseDown={handleGpsSelect}
          >
            <span aria-hidden="true">&#x1F4CD;</span>
            <span>Use current location</span>
          </li>
          {results.map((loc, i) => (
            <li
              key={`${loc.lat},${loc.lon}`}
              id={`${listId}-option-${i + 1}`}
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center${i + 1 === activeIndex ? ' active' : ''}`}
              role="option"
              aria-selected={i + 1 === activeIndex}
              onMouseDown={() => handleSelect(loc)}
            >
              <span>
                {loc.name}
                {loc.admin1 ? `, ${loc.admin1}` : ''}
              </span>
              <small className={i + 1 === activeIndex ? 'text-white-50' : 'text-muted'}>{loc.country}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
