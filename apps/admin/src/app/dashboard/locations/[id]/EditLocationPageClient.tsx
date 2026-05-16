'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdmin } from '@/context/AdminContext'
import { getLocation, getFieldSchema } from '@/lib/db.client'
import { LocationEditor } from '@/components/LocationEditor'
import type { PlainLocation } from '@/lib/db.client'
import type { FieldSchema } from '@openbrolly/firebase/types'

interface Props {
  id: string
}

export function EditLocationPageClient({ id: paramId }: Props) {
  const pathname = usePathname()
  // When served via the catch-all rewrite, paramId is '_'.
  // Read the real location ID from the browser URL instead.
  const id = pathname.split('/').filter(Boolean).pop() ?? paramId
  const { clientId } = useAdmin()
  const [location, setLocation] = useState<PlainLocation | null>(null)
  const [fieldSchema, setFieldSchema] = useState<FieldSchema>({ fields: [] })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!clientId || !id) return
    Promise.all([
      getLocation(clientId, id),
      getFieldSchema(clientId),
    ])
      .then(([loc, schema]) => {
        if (!loc) {
          setNotFound(true)
        } else {
          setLocation(loc)
          setFieldSchema(schema)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId, id])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Location not found.</p>
        <Link href="/dashboard/locations" className="mt-4 inline-block text-indigo-600 hover:underline">
          Back to locations
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/dashboard/locations" className="text-sm text-gray-500 hover:text-gray-700">
          Locations
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{location?.title ?? 'Edit location'}</h1>
      </div>
      {location && clientId && (
        <LocationEditor
          clientId={clientId}
          location={location}
          fieldSchema={fieldSchema}
          isNew={false}
        />
      )}
    </div>
  )
}
