'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/context/AdminContext'
import { getLocations, approveLocation, rejectLocation } from '@/lib/db.client'
import { LocationsTable } from '@/components/LocationsTable'
import type { PlainLocation } from '@/lib/db.client'

// ─── Approve modal ─────────────────────────────────────────────────────────────

interface ApproveModalProps {
  location: PlainLocation
  onConfirm: (publishNow: boolean) => void
  onCancel: () => void
  busy: boolean
}

function ApproveModal({ location, onConfirm, onCancel, busy }: ApproveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Approve submission</h2>
        <p className="text-sm text-gray-500 mb-1">
          <span className="font-medium text-gray-700">{location.title}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Submitted by {location.submittedBy?.firstName} {location.submittedBy?.surname}
          {location.submittedBy?.email ? ` (${location.submittedBy.email})` : ''}
        </p>

        <p className="text-sm font-medium text-gray-700 mb-3">
          Where would you like to move this location?
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            disabled={busy}
            onClick={() => onConfirm(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-500 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-green-700">Publish now</span>
            <span className="text-xs text-green-600 text-center">Visible to the public immediately</span>
          </button>

          <button
            disabled={busy}
            onClick={() => onConfirm(false)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Move to draft</span>
            <span className="text-xs text-gray-500 text-center">Save privately, publish later</span>
          </button>
        </div>

        <button
          disabled={busy}
          onClick={onCancel}
          className="w-full py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        {busy && (
          <div className="mt-3 flex justify-center">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Reject confirmation modal ─────────────────────────────────────────────────

interface RejectModalProps {
  location: PlainLocation
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
}

function RejectModal({ location, onConfirm, onCancel, busy }: RejectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reject submission?</h2>
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-medium text-gray-700">{location.title}</span> will be marked as
          rejected. The location owner will not be automatically notified.
        </p>

        <div className="flex gap-3">
          <button
            disabled={busy}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {busy ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pending card ──────────────────────────────────────────────────────────────

interface PendingCardProps {
  location: PlainLocation
  onApprove: (loc: PlainLocation) => void
  onReject: (loc: PlainLocation) => void
}

function PendingCard({ location, onApprove, onReject }: PendingCardProps) {
  const thumb = location.images?.[0]
  const submittedDate = location.submittedAt
    ? new Date(location.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="flex items-start gap-4 bg-white rounded-xl border border-amber-200 shadow-sm p-4">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={location.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21l6.75-6.75 1.5 1.5M21 3h-6m6 0v6" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{location.title}</p>
        <p className="text-sm text-gray-500 truncate mt-0.5">
          by {location.submittedBy?.firstName} {location.submittedBy?.surname}
          {location.submittedBy?.email ? ` · ${location.submittedBy.email}` : ''}
        </p>
        {location.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(location.categories as string[]).slice(0, 4).map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">{c}</span>
            ))}
          </div>
        )}
        {submittedDate && (
          <p className="text-xs text-gray-400 mt-1.5">Submitted {submittedDate}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={() => onApprove(location)}
          className="px-3 py-1.5 rounded-lg bg-green-600 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => onReject(location)}
          className="px-3 py-1.5 rounded-lg bg-white border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          Reject
        </button>
        <Link
          href={`/dashboard/locations/edit?id=${location.id}`}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-center"
        >
          Preview
        </Link>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { clientId } = useAdmin()
  const [locations, setLocations]   = useState<PlainLocation[]>([])
  const [loading, setLoading]       = useState(true)

  // Modal state
  const [approving, setApproving]   = useState<PlainLocation | null>(null)
  const [rejecting, setRejecting]   = useState<PlainLocation | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const refresh = useCallback(() => {
    if (!clientId) return
    setLoading(true)
    getLocations(clientId)
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => { refresh() }, [refresh])

  const pending  = locations.filter((l) => l.status === 'pending-approval')
  const rest     = locations.filter((l) => l.status !== 'pending-approval')

  // ── Approve handler ──
  async function handleApproveConfirm(publishNow: boolean) {
    if (!clientId || !approving) return
    setActionBusy(true)
    try {
      await approveLocation(clientId, approving.id, publishNow)
      setLocations((prev) =>
        prev.map((l) =>
          l.id === approving.id ? { ...l, status: publishNow ? 'published' : 'draft' } : l
        )
      )
      setApproving(null)
    } catch (err) {
      console.error(err)
      alert('Failed to approve location. Please try again.')
    } finally {
      setActionBusy(false)
    }
  }

  // ── Reject handler ──
  async function handleRejectConfirm() {
    if (!clientId || !rejecting) return
    setActionBusy(true)
    try {
      await rejectLocation(clientId, rejecting.id)
      setLocations((prev) =>
        prev.map((l) =>
          l.id === rejecting.id ? { ...l, status: 'rejected' } : l
        )
      )
      setRejecting(null)
    } catch (err) {
      console.error(err)
      alert('Failed to reject location. Please try again.')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <>
      {/* ── Modals ── */}
      {approving && (
        <ApproveModal
          location={approving}
          onConfirm={handleApproveConfirm}
          onCancel={() => setApproving(null)}
          busy={actionBusy}
        />
      )}
      {rejecting && (
        <RejectModal
          location={rejecting}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejecting(null)}
          busy={actionBusy}
        />
      )}

      <div>
        {/* ── Page header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your film locations.</p>
          </div>
          <Link
            href="/dashboard/locations/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add location
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Waiting for Approval ── */}
            {pending.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Waiting for Approval</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-xs font-bold text-white">
                    {pending.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {pending.map((loc) => (
                    <PendingCard
                      key={loc.id}
                      location={loc}
                      onApprove={setApproving}
                      onReject={setRejecting}
                    />
                  ))}
                </div>

                {rest.length > 0 && <hr className="mt-8 border-gray-200" />}
              </section>
            )}

            {/* ── All other locations ── */}
            {rest.length > 0 ? (
              <LocationsTable locations={rest} />
            ) : pending.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-16">No locations yet.</p>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
