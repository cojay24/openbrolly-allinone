'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/context/AdminContext'

export function DashboardGuard({ children }: { children: ReactNode }) {
  const { user, clientId, loading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
    // Logged in but no clientId means the account isn't an admin — send back to login
    if (!loading && user && !clientId) {
      router.replace('/login?error=unauthorized')
    }
  }, [user, clientId, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !clientId) return null

  return <>{children}</>
}
