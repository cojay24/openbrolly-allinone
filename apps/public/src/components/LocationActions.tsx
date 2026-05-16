'use client'

import { useState } from 'react'
import { EnquiryModal } from './EnquiryModal'
import { PermitModal } from './PermitModal'

interface Props {
  locationId: string
  locationTitle: string
}

type ActiveModal = 'enquiry' | 'permit' | null

export function LocationActions({ locationId, locationTitle }: Props) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setActiveModal('enquiry')}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-brand"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Send an enquiry
        </button>

        <button
          onClick={() => setActiveModal('permit')}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50 focus-brand"
          style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Apply for a permit
        </button>
      </div>

      {activeModal === 'enquiry' && (
        <EnquiryModal
          locationId={locationId}
          locationTitle={locationTitle}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'permit' && (
        <PermitModal
          locationId={locationId}
          locationTitle={locationTitle}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  )
}
