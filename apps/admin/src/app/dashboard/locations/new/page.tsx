'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/context/AdminContext'
import { getFieldSchema } from '@/lib/db.client'
import { LocationEditor } from '@/components/LocationEditor'
import type { FieldSchema } from '@openbrolly/firebase/types'

export default function NewLocationPage() {
  const { clientId } = useAdmin()
  const [fieldSchema, setFieldSchema] = useState<FieldSchema>({ fields: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    getFieldSchema(clientId)
      .then(setFieldSchema)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
        <h1 className="text-2xl font-bold text-gray-900">New location</h1>
      </div>
      {clientId && (
        <LocationEditor
          clientId={clientId}
          location={null}
          fieldSchema={fieldSchema}
          isNew={true}
        />
      )}
    </div>
  )
}
