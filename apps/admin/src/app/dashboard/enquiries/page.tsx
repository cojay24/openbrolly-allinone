'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/context/AdminContext'
import { getAllEnquiries } from '@/lib/db.client'
import { EnquiriesPanel } from '@/components/EnquiriesPanel'
import type { PlainEnquiry } from '@/lib/db.client'

export default function EnquiriesPage() {
  const { clientId } = useAdmin()
  const [enquiries, setEnquiries] = useState<PlainEnquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    getAllEnquiries(clientId)
      .then(setEnquiries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
        <p className="text-sm text-gray-500 mt-1">Contact and permit enquiries from your public site.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <EnquiriesPanel enquiries={enquiries} clientId={clientId!} />
      )}
    </div>
  )
}
