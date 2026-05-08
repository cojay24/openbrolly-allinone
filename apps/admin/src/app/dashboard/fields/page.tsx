'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/context/AdminContext'
import { getFieldSchema } from '@/lib/db.client'
import { FieldsManager } from '@/components/FieldsManager'
import type { FieldSchema } from '@openbrolly/firebase/types'

export default function FieldsPage() {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom fields</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define extra fields shown on location pages. Up to 20 custom fields.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <FieldsManager clientId={clientId!} initialSchema={fieldSchema} />
      )}
    </div>
  )
}
