'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getAuthInstance, getDb } from '@openbrolly/firebase'

interface AdminContextValue {
  user: User | null
  clientId: string | null
  loading: boolean
}

const AdminContext = createContext<AdminContextValue>({ user: null, clientId: null, loading: true })

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(getDb(), 'users', u.uid))
          setClientId((snap.data()?.clientId as string) ?? null)
        } catch {
          setClientId(null)
        }
      } else {
        setClientId(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AdminContext.Provider value={{ user, clientId, loading }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
