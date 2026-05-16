'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { EditLocationPageClient } from '../[id]/EditLocationPageClient'

function EditContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  return <EditLocationPageClient id={id} />
}

export default function EditLocationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EditContent />
    </Suspense>
  )
}
