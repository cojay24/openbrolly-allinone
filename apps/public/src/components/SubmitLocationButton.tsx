'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

/**
 * Renders a "Submit a Location" button only for signed-in, approved
 * Location Owners. Invisible to all other users.
 */
export function SubmitLocationButton() {
  const { userProfile } = useAuth()

  if (
    userProfile?.accountType !== 'location-owner' ||
    userProfile?.accountStatus !== 'active'
  ) {
    return null
  }

  return (
    <Link
      href="/submit-location"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-85"
      style={{ backgroundColor: 'var(--brand-secondary)' }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span className="hidden sm:inline">Submit a Location</span>
      <span className="sm:hidden">Submit</span>
    </Link>
  )
}
