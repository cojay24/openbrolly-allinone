'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/context/AdminContext'
import { getLocations } from '@/lib/db.client'
import { LocationsTable } from '@/components/LocationsTable'
import type { PlainLocation } from '@/lib/db.client'

export default function LocationsPage() {
  const { clientId } = useAdmin()
  const [locations, setLocations] = useState<PlainLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    getLocations(clientId)
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your film locations.</p>
        </div>
        <Link
          href="/dashboard/locations/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add location
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <LocationsTable locations={locations} />
      )}
    </div>
  )
}
