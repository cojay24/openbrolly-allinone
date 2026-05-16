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
      {/* ── Hero heading ── */}
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight">
          Discover Extraordinary Locations
        </h1>
        <p className="mt-3 text-base text-gray-500">
          {locations.length} curated space{locations.length !== 1 ? 's' : ''} for film, photography and events.
        </p>
      </div>

      {/* ── Search + filters ── */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative max-w-lg">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-stone-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm"
            style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
          />
        </div>

        {/* Category pills */}
        {allCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest mr-1">Filter</span>
            {allCategories.map((cat) => {
              const active = activeCategories.has(cat)
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={active}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 focus-brand ${
                    active
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-600 border-stone-200 hover:border-gray-400 hover:text-gray-900'
                  }`}
                  style={active ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}}
                >
                  {cat}
                </button>
              )
            })}
            {activeCategories.size > 0 && (
              <button
                onClick={() => setActiveCategories(new Set())}
                className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <svg className="mx-auto mb-4 w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-display text-lg font-medium text-gray-500">No locations found</p>
          <p className="text-sm mt-1 text-gray-400">Try adjusting your search or clearing filters</p>
        </div>
      ) : (
        <>
          {(search || activeCategories.size > 0) && (
            <p className="text-sm text-gray-400 mb-6">
              Showing <span className="text-gray-700 font-medium">{filtered.length}</span> of {locations.length} locations
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {filtered.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
