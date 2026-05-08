'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { getAuthInstance } from '@openbrolly/firebase'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), (user) => {
      if (user) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    })
    return unsub
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
