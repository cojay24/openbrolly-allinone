'use client'

import { useState } from 'react'
import { AddToListModal } from './AddToListModal'

interface Props {
  locationId: string
  locationTitle: string
}

/**
 * Thin client wrapper — holds modal open/close state so it can be
 * dropped into the server-rendered location detail page.
 */
export function AddToListButton({ locationId, locationTitle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50 focus-brand"
        style={{ borderColor: 'var(--brand-secondary)', color: 'var(--brand-secondary)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-5-7 5V5z" />
        </svg>
        Save to list
      </button>

      {open && (
        <AddToListModal
          locationId={locationId}
          locationTitle={locationTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
