'use client'

import { useState, useMemo } from 'react'
import type { PlainLocation } from '@/lib/db.server'
import { LocationCard } from './LocationCard'

interface Props {
  locations: PlainLocation[]
}

export function LocationBrowser({ locations }: Props) {
  const [search, setSearch] = useState('')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    locations.forEach((loc) => (loc.categories as string[]).forEach((c) => cats.add(c)))
    return Array.from(cats).sort()
  }, [locations])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return locations.filter((loc) => {
      const matchesSearch =
        !q ||
        (loc.title as string).toLowerCase().includes(q) ||
        (loc.description as string).toLowerCase().includes(q)

      const matchesCategory =
        activeCategories.size === 0 ||
        (loc.categories as string[]).some((c) => activeCategories.has(c))

      return matchesSearch && matchesCategory
    })
  }, [locations, search, activeCategories])

  function toggleCategory(cat: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return (
    <div>
      {/* ── Search + filters ── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
            aria-label="Search locations"
          />
        </div>
      </div>

      {/* ── Category filter pills ── */}
      {allCategories.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-8"
          role="group"
          aria-label="Filter by category"
        >
          <span className="text-sm text-gray-500 self-center mr-1">Filter:</span>
          {allCategories.map((cat) => {
            const active = activeCategories.has(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors focus-brand ${
                  active
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
                style={
                  active
                    ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }
                    : undefined
                }
              >
                {cat}
              </button>
            )
          })}
          {activeCategories.size > 0 && (
            <button
              onClick={() => setActiveCategories(new Set())}
              className="px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-gray-600 underline focus-brand"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg
            className="mx-auto mb-4 w-12 h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium">No locations found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">
            Showing {filtered.length} of {locations.length} location
            {locations.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
