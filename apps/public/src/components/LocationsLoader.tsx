'use client'

import { useState, useEffect } from 'react'
import { getPublishedLocations } from '@/lib/locations.client'
import { LocationBrowser } from './LocationBrowser'
import type { PlainLocation } from '@/lib/types'

export function LocationsLoader() {
  const [locations, setLocations] = useState<PlainLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublishedLocations()
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <svg
          className="w-7 h-7 animate-spin"
          style={{ color: 'var(--brand-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  return (
    <>
      <p className="text-gray-500 mb-8">
        {locations.length} location{locations.length !== 1 ? 's' : ''} available
      </p>
      <LocationBrowser locations={locations} />
    </>
  )
}
