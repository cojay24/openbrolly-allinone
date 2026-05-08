'use client'

import { useState } from 'react'
import type { PlainEnquiry } from '@/lib/db.client'
import { updateEnquiryStatus } from '@/lib/db.client'

interface Props {
  enquiries: PlainEnquiry[]
  clientId: string
}

type Tab = 'contact' | 'permit'

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-gray-100 text-gray-600',
  replied: 'bg-green-100 text-green-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function EnquiriesPanel({ enquiries: initial, clientId }: Props) {
  const [enquiries, setEnquiries] = useState(initial)
  const [tab, setTab] = useState<Tab>('contact')
  const [selected, setSelected] = useState<PlainEnquiry | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = enquiries.filter((e) => e.type === tab)
  const contactCount = enquiries.filter((e) => e.type === 'contact').length
  const permitCount = enquiries.filter((e) => e.type === 'permit').length
  const unreadContact = enquiries.filter((e) => e.type === 'contact' && e.status === 'new').length
  const unreadPermit = enquiries.filter((e) => e.type === 'permit' && e.status === 'new').length

  async function markAs(e: PlainEnquiry, status: 'read' | 'replied') {
    if (e.status === status || e.status === 'replied') return
    setUpdating(e.id)
    try {
      await updateEnquiryStatus(clientId, e.locationId, e.id, status)
      const updated = { ...e, status } as PlainEnquiry
      setEnquiries((prev) => prev.map((q) => (q.id === e.id ? updated : q)))
      if (selected?.id === e.id) setSelected(updated)
    } finally {
      setUpdating(null)
    }
  }

  async function handleRowClick(e: PlainEnquiry) {
    setSelected(e)
    if (e.status === 'new') await markAs(e, 'read')
  }

  return (
    <div className="flex gap-6 h-full min-h-[600px]">
      {/* ── Left: table ── */}
      <div className="flex-1 min-w-0">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          {([
            { key: 'contact' as Tab, label: 'Contact enquiries', count: contactCount, unread: unreadContact },
            { key: 'permit' as Tab, label: 'Permit applications', count: permitCount, unread: unreadPermit },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelected(null) }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px focus-ring ${
                tab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
              <span className="text-xs text-gray-400">({t.count})</span>
              {t.unread > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.2rem] h-5 px-1 rounded-full text-xs font-bold bg-red-500 text-white">
                  {t.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="font-medium">No {tab} enquiries yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">From</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((enq) => (
                  <tr
                    key={enq.id}
                    onClick={() => handleRowClick(enq)}
                    className={`cursor-pointer hover:bg-indigo-50 transition-colors ${
                      selected?.id === enq.id ? 'bg-indigo-50' : ''
                    } ${enq.status === 'new' ? 'font-medium' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{enq.name}</div>
                      <div className="text-xs text-gray-400">{enq.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500 text-xs">{enq.locationTitle}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(enq.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[enq.status] ?? ''}`}>
                        {enq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 self-start sticky top-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Enquiry detail</h3>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 focus-ring rounded"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <dl className="space-y-3 text-sm">
            {[
              { label: 'Location', value: selected.locationTitle },
              { label: 'Name', value: selected.name },
              { label: 'Email', value: selected.email },
              { label: 'Phone', value: selected.phone },
              ...(selected.type === 'permit' ? [
                { label: 'Organisation', value: selected.organisation },
                { label: 'Intended dates', value: selected.intendedDates },
                { label: 'Description of use', value: selected.descriptionOfUse },
              ] : [
                { label: 'Message', value: selected.message },
              ]),
              { label: 'Received', value: formatDate(selected.createdAt) },
            ].filter((r) => r.value).map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{row.label}</dt>
                <dd className="mt-0.5 text-gray-700 whitespace-pre-wrap">{row.value}</dd>
              </div>
            ))}
          </dl>

          {/* Status badge */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[selected.status] ?? ''}`}>
              {selected.status}
            </span>
          </div>

          {/* Actions */}
          {selected.status !== 'replied' && (
            <div className="mt-3 flex gap-2">
              {selected.status === 'new' && (
                <button
                  onClick={() => markAs(selected, 'read')}
                  disabled={!!updating}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors focus-ring"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={() => markAs(selected, 'replied')}
                disabled={!!updating}
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors focus-ring"
              >
                {updating === selected.id ? '…' : 'Mark replied'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
