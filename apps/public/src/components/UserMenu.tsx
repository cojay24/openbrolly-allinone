'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { doc, getDoc } from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'
import { useAuth } from '@/context/AuthContext'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load the user's first name from their Firestore profile
  useEffect(() => {
    if (!user) { setFirstName(null); return }
    getDoc(doc(getDb(), 'users', user.uid)).then((snap) => {
      if (snap.exists()) setFirstName((snap.data().firstName as string) ?? null)
    }).catch(() => {/* silent — fall back to email */})
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  if (!user) return null

  const displayName = firstName ?? user.email ?? 'User'
  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity focus:outline-none"
      >
        {/* Avatar */}
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: 'var(--brand-secondary)' }}
        >
          {initial}
        </span>
        <span className="text-sm font-medium hidden sm:block">{displayName}</span>
        <svg
          className="w-4 h-4 opacity-70 hidden sm:block"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
          {/* User info */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
          </div>

          {/* My Enquiries */}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            My Enquiries
          </Link>

          {/* My Lists */}
          <Link
            href="/my-lists"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-5-7 5V5z" />
            </svg>
            My Lists
          </Link>

          {/* Sign out */}
          <button
            onClick={() => { signOut(); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
