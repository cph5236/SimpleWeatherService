import { useEffect, useId, useRef, useState } from 'react'
import { searchCity } from '../services/geocode'
import type { Location } from '../types/weather'

interface SearchBarProps {
  onSelect: (location: Location) => void
  placeholder?: string
}

export function SearchBar({ onSelect, placeholder = 'Search for a city…' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputId = useId()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const locs = await searchCity(query)
        setResults(locs)
        setOpen(locs.length > 0)
        setActiveIndex(-1)
      } catch {
        setResults([])
        setOpen(false)
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
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex])
      } else if (results.length === 1) {
        handleSelect(results[0])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
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
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          role="combobox"
          aria-label="Search for a city"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
        />
        {loading && (
          <span className="input-group-text">
            <span className="spinner-border spinner-border-sm" role="status" aria-label="Searching" />
          </span>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          className="list-group position-absolute w-100 shadow-sm z-3"
          role="listbox"
          aria-label="City suggestions"
          style={{ top: '100%', marginTop: 2 }}
        >
          {results.map((loc, i) => (
            <li
              key={`${loc.lat},${loc.lon}`}
              id={`${listId}-option-${i}`}
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center${i === activeIndex ? ' active' : ''}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(loc)}
            >
              <span>
                {loc.name}
                {loc.admin1 ? `, ${loc.admin1}` : ''}
              </span>
              <small className={i === activeIndex ? 'text-white-50' : 'text-muted'}>{loc.country}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
