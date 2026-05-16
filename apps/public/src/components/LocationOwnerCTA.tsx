'use client'

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'
import { useAuth } from '@/context/AuthContext'

async function submitApplication(uid: string) {
  await updateDoc(doc(getDb(), 'users', uid), {
    accountType: 'location-owner',
    accountStatus: 'pending',
  })
}

export function LocationOwnerCTA() {
  const { user, userProfile, refreshProfile } = useAuth()

  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Already a location owner (any status) — don't show the CTA
  if (userProfile?.accountType === 'location-owner') return null

  async function handleApply() {
    if (!user) return
    setSubmitting(true)
    try {
      await submitApplication(user.uid)
      await refreshProfile()
      setDone(true)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* ── CTA strip ── */}
      <section
        className="border-t border-gray-200"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Copy */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Want to advertise your location with us?
            </h2>
            <p className="mt-2 text-white/70 text-base sm:text-lg">
              Join our network of location owners and get your space seen by leading film and events professionals.
            </p>
          </div>

          {/* Button */}
          <div className="flex-shrink-0">
            {!user ? (
              // Not logged in — the AuthGate will handle login when they try to do anything
              // Show button that opens the auth modal by clicking a hidden trigger
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50"
                style={{ backgroundColor: 'var(--brand-secondary)', color: '#fff' }}
              >
                Apply now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50"
                style={{ backgroundColor: 'var(--brand-secondary)', color: '#fff' }}
              >
                Apply now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Application modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => { setModalOpen(false); setDone(false) }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {done ? (
              /* Success state */
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Application submitted!</h3>
                <p className="text-sm text-gray-500">
                  We&apos;ve received your application and will be in touch shortly. You&apos;ll gain access to the location submission portal once approved.
                </p>
                <button
                  onClick={() => { setModalOpen(false); setDone(false) }}
                  className="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Got it
                </button>
              </div>
            ) : !user ? (
              /* Not signed in */
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create an account first</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You&apos;ll need a free account before applying to list your location. Sign up takes less than a minute.
                </p>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Sign up / Log in
                </button>
              </div>
            ) : (
              /* Logged in — show application confirmation */
              <>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Apply to list your location
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                  Submit your application and our team will review it. Once approved, you&apos;ll be able to add and manage your locations directly on the platform.
                </p>

                <ul className="space-y-2 mb-7">
                  {[
                    'Reach film crews, photographers & event planners',
                    'Submit unlimited locations with photos',
                    'Receive enquiries directly through the platform',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--brand-secondary)' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {point}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleApply}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Maybe later
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
