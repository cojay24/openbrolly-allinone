'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getAuthInstance, getDb } from '@openbrolly/firebase'
import { signOut as firebaseSignOut } from '@/lib/auth.client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountType   = 'viewer' | 'location-owner'
export type AccountStatus = 'active' | 'pending' | 'rejected'

export interface UserProfile {
  firstName: string
  surname: string
  email: string
  phone: string
  company: string
  accountType: AccountType
  accountStatus: AccountStatus
}

interface AuthContextValue {
  user: User | null
  userProfile: UserProfile | null
  /** True while Firebase Auth OR the profile fetch is still resolving */
  loading: boolean
  signOut: () => Promise<void>
  /** Call after profile fields change (e.g. on admin status update) */
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  async function fetchProfile(uid: string) {
    setProfileLoading(true)
    try {
      const snap = await getDoc(doc(getDb(), 'users', uid))
      if (snap.exists()) {
        const d = snap.data()
        setUserProfile({
          firstName:     (d.firstName     as string) ?? '',
          surname:       (d.surname       as string) ?? '',
          email:         (d.email         as string) ?? '',
          phone:         (d.phone         as string) ?? '',
          company:       (d.company       as string) ?? '',
          accountType:   (d.accountType   as AccountType)   ?? 'viewer',
          accountStatus: (d.accountStatus as AccountStatus) ?? 'active',
        })
      }
    } catch {
      // Non-fatal — AuthGate fails open on Firestore error
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), (u) => {
      setUser(u)
      setAuthLoading(false)
      if (u) {
        fetchProfile(u.uid)
      } else {
        setUserProfile(null)
      }
    })
    return unsub
  }, [])

  async function refreshProfile() {
    if (user) await fetchProfile(user.uid)
  }

  const loading = authLoading || profileLoading

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut: firebaseSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
