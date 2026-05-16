'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'
import { useAuth } from '@/context/AuthContext'
import { AuthModal } from './AuthModal'

type AccountStatus = 'active' | 'pending' | 'rejected'

/**
 * Wraps the public site's page content.
 * - Loading:   spinner while Firebase resolves auth state
 * - Signed out: blurs page + shows AuthModal (non-dismissable)
 * - Rejected:  shows account-blocked message
 * - Signed in + active: renders children normally
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    if (!user) { setAccountStatus(null); return }
    setStatusLoading(true)
    getDoc(doc(getDb(), 'users', user.uid))
      .then((snap) => {
        setAccountStatus((snap.data()?.accountStatus as AccountStatus) ?? 'active')
      })
      .catch(() => setAccountStatus('active')) // fail open — don't block on Firestore error
      .finally(() => setStatusLoading(false))
  }, [user])

  const isLoading = loading || (user !== null && statusLoading)

  if (isLoading) {
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
        <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden>
          {children}
        </div>
        <AuthModal />
      </>
    )
  }

  if (accountStatus === 'rejected') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Account deactivated</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your account has been deactivated. Please contact support if you believe this is an error.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
