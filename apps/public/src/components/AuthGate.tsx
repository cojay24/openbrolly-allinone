'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AuthModal } from './AuthModal'

/**
 * Wraps the public site's page content.
 * - Loading: shows a spinner while Firebase resolves auth state
 * - Signed out: blurs + dims the page content and renders the AuthModal on top
 * - Signed in: renders children normally
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <svg
          className="w-7 h-7 animate-spin"
          style={{ color: 'var(--brand-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {/* Page content visible but inaccessible behind the modal */}
        <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden>
          {children}
        </div>
        <AuthModal />
      </>
    )
  }

  return <>{children}</>
}
