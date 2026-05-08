'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/context/AdminContext'
import { getClientBrandConfig } from '@/lib/db.client'
import { BrandEditor } from '@/components/BrandEditor'

export default function BrandSettingsPage() {
  const { clientId } = useAdmin()
  const [brand, setBrand] = useState({ logo: '', primaryColor: '#4F46E5', secondaryColor: '#818CF8' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    getClientBrandConfig(clientId)
      .then(setBrand)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Brand settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customise your logo and colours. Changes appear on the public site immediately after saving.
        </p>
      </div>
      <BrandEditor
        initialLogo={brand.logo}
        initialPrimaryColor={brand.primaryColor}
        initialSecondaryColor={brand.secondaryColor}
      />
    </div>
  )
}
