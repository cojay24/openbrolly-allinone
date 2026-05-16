'use client'

import { useState, useEffect } from 'react'
import { getPublishedLocations } from '@/lib/locations.client'
import { LocationBrowser } from './LocationBrowser'
import type { PlainLocation } from '@/lib/types'

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-stone-200 rounded-sm" style={{ aspectRatio: '4/3' }} />
      <div className="pt-4 space-y-2">
        <div className="h-5 bg-stone-200 rounded w-3/4" />
        <div className="h-4 bg-stone-100 rounded w-full" />
        <div className="h-4 bg-stone-100 rounded w-2/3" />
      </div>
    </div>
  )
}

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
      <div>
        {/* Skeleton heading */}
        <div className="mb-10 space-y-3 animate-pulse">
          <div className="h-10 bg-stone-200 rounded w-2/3" />
          <div className="h-5 bg-stone-100 rounded w-1/3" />
        </div>
        {/* Skeleton search */}
        <div className="mb-8 h-11 bg-stone-100 rounded-lg w-full max-w-lg animate-pulse" />
        {/* Skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return <LocationBrowser locations={locations} />
}
