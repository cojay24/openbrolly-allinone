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
      {/* ── CTA section ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: 'var(--brand-primary)' }}>
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Left: copy */}
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--brand-secondary)' }}>
                For location owners
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
                Want to advertise your location with us?
              </h2>
              <p className="text-white/60 text-base leading-relaxed">
                Join our curated network and connect your space with leading film crews, photographers, and event professionals.
              </p>
            </div>

            {/* Right: CTA */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setModalOpen(true)}
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-lg font-semibold text-sm transition-all duration-200 hover:gap-4"
                style={{ backgroundColor: 'var(--brand-secondary)', color: '#fff' }}
              >
                Apply here
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

            {done ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'var(--brand-primary)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-semibold text-gray-900 mb-2">Application submitted</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We&apos;ve received your application and will review it shortly. You&apos;ll gain access to the location submission portal once approved.
                </p>
                <button
                  onClick={() => { setModalOpen(false); setDone(false) }}
                  className="mt-6 w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Done
                </button>
              </div>
            ) : !user ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 bg-stone-100">
                  <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-semibold text-gray-900 mb-2">Sign in first</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You&apos;ll need a free account before applying. Sign up takes less than a minute.
                </p>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Sign up / Log in
                </button>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="px-8 pt-8 pb-6" style={{ backgroundColor: 'var(--brand-primary)' }}>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="float-right -mt-1 -mr-1 text-white/50 hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="font-display text-2xl font-semibold text-white">List your location</h3>
                  <p className="text-white/60 text-sm mt-1">Apply to join our network of location owners.</p>
                </div>

                {/* Modal body */}
                <div className="px-8 py-7">
                  <ul className="space-y-3 mb-7">
                    {[
                      'Reach film crews, photographers & event planners',
                      'Manage unlimited location listings with photos',
                      'Receive enquiries directly through the platform',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-gray-600">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleApply}
                    disabled={submitting}
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--brand-secondary)' }}
                  >
                    {submitting ? 'Submitting…' : 'Submit application'}
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="mt-3 w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
