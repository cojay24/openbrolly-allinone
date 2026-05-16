'use client'

import { useState, useEffect, useRef } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'
import { useAuth } from '@/context/AuthContext'

interface Props {
  locationId: string
  locationTitle: string
  onClose: () => void
}

interface FormState {
  name: string
  organisation: string
  email: string
  phone: string
  intendedDates: string
  descriptionOfUse: string
}

const INITIAL: FormState = {
  name: '',
  organisation: '',
  email: '',
  phone: '',
  intendedDates: '',
  descriptionOfUse: '',
}

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

export function PermitModal({ locationId, locationTitle, onClose }: Props) {
  const { user } = useAuth()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstInputRef.current?.focus() }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    try {
      const path = `clients/${CLIENT_ID}/locations/${locationId}/enquiries`
      await addDoc(collection(getDb(), path), {
        ...form,
        type: 'permit',
        status: 'new',
        locationTitle,
        userId: user?.uid ?? null,
        unreadByUser: false,
        unreadByAdmin: true,
        createdAt: serverTimestamp(),
      })
      setStatus('success')
    } catch (err) {
      console.error('[PermitModal] Firestore write failed:', err)
      const code = (err as { code?: string }).code
      const msg =
        code === 'permission-denied'
          ? 'Submission blocked by server rules. Please contact support.'
          : 'Something went wrong. Please try again.'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50'
  const ringStyle = { '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties
  const busy = status === 'submitting'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permit-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="permit-title" className="text-lg font-semibold text-gray-900">
            Apply for a Permit
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-brand"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Application received!</h3>
              <p className="text-sm text-gray-500">
                Your permit application has been submitted. We&apos;ll review it and be in touch shortly.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 focus-brand"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="permit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="permit-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={set('name')}
                  disabled={busy}
                  className={inputClass}
                  style={ringStyle}
                />
              </div>

              <div>
                <label htmlFor="permit-org" className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation
                </label>
                <input
                  id="permit-org"
                  type="text"
                  autoComplete="organization"
                  placeholder="Production company or studio"
                  value={form.organisation}
                  onChange={set('organisation')}
                  disabled={busy}
                  className={inputClass}
                  style={ringStyle}
                />
              </div>

              <div>
                <label htmlFor="permit-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="permit-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="jane@studio.com"
                  value={form.email}
                  onChange={set('email')}
                  disabled={busy}
                  className={inputClass}
                  style={ringStyle}
                />
              </div>

              <div>
                <label htmlFor="permit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  id="permit-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={set('phone')}
                  disabled={busy}
                  className={inputClass}
                  style={ringStyle}
                />
              </div>

              <div>
                <label htmlFor="permit-dates" className="block text-sm font-medium text-gray-700 mb-1">
                  Intended shoot dates <span className="text-red-500">*</span>
                </label>
                <input
                  id="permit-dates"
                  type="text"
                  required
                  placeholder="e.g. 15–18 May 2026"
                  value={form.intendedDates}
                  onChange={set('intendedDates')}
                  disabled={busy}
                  className={inputClass}
                  style={ringStyle}
                />
              </div>

              <div>
                <label htmlFor="permit-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description of use <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="permit-desc"
                  required
                  rows={4}
                  placeholder="Describe your production, crew size, equipment, and intended use of the location…"
                  value={form.descriptionOfUse}
                  onChange={set('descriptionOfUse')}
                  disabled={busy}
                  className={`${inputClass} resize-none`}
                  style={ringStyle}
                />
              </div>

              {status === 'error' && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-brand"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {busy ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
