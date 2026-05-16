'use client'

import { useState, useEffect, useRef } from 'react'
import { getAuthInstance } from '@openbrolly/firebase'
import type { PlainEnquiry, EnquiryMessage } from '@/lib/db.client'
import { updateEnquiryStatus, getEnquiryMessages, sendAdminReply } from '@/lib/db.client'

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg
      className={`animate-spin ${sm ? 'w-4 h-4' : 'w-5 h-5'} text-indigo-500`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

export function EnquiriesPanel({ enquiries: initial, clientId }: Props) {
  const [enquiries, setEnquiries] = useState(initial)
  const [tab, setTab] = useState<Tab>('contact')
  const [selected, setSelected] = useState<PlainEnquiry | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Thread state
  const [messages, setMessages] = useState<EnquiryMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const threadBottomRef = useRef<HTMLDivElement>(null)

  const filtered = enquiries.filter((e) => e.type === tab)
  const contactCount = enquiries.filter((e) => e.type === 'contact').length
  const permitCount = enquiries.filter((e) => e.type === 'permit').length
  const unreadContact = enquiries.filter((e) => e.type === 'contact' && e.status === 'new').length
  const unreadPermit = enquiries.filter((e) => e.type === 'permit' && e.status === 'new').length

  // Load messages when an enquiry is selected
  useEffect(() => {
    if (!selected) { setMessages([]); return }
    setLoadingMsgs(true)
    setMessages([])
    getEnquiryMessages(clientId, selected.locationId, selected.id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMsgs(false))
  }, [selected?.id, clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom of thread on new messages
  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    const body = reply.trim()
    if (!body || !selected) return

    const auth = getAuthInstance()
    const adminName = auth.currentUser?.displayName ?? auth.currentUser?.email ?? 'Admin'

    setSending(true)
    try {
      const msg = await sendAdminReply(clientId, selected.locationId, selected.id, body, adminName)
      setMessages((prev) => [...prev, msg])
      setReply('')
      // Update local enquiry status to 'replied'
      const updated = { ...selected, status: 'replied' as const }
      setEnquiries((prev) => prev.map((q) => (q.id === selected.id ? updated : q)))
      setSelected(updated)
    } catch (err) {
      console.error(err)
      alert('Failed to send reply. Please try again.')
    } finally {
      setSending(false)
    }
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
                      {enq.unreadByAdmin && (
                        <span className="inline-block mt-0.5 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          New reply
                        </span>
                      )}
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

      {/* ── Right: detail + thread panel ── */}
      {selected && (
        <div
          className="w-96 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 sticky top-8"
          style={{ maxHeight: 'calc(100vh - 5rem)' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-semibold text-gray-900 text-sm">Enquiry detail</h3>
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

          {/* Enquiry summary */}
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 overflow-y-auto" style={{ maxHeight: '240px' }}>
            <dl className="space-y-2.5 text-sm">
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
                  <dd className="mt-0.5 text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[selected.status] ?? ''}`}>
                {selected.status}
              </span>
              {selected.status !== 'replied' && (
                <button
                  onClick={() => markAs(selected, 'replied')}
                  disabled={!!updating}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {updating === selected.id ? '…' : 'Mark replied'}
                </button>
              )}
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Conversation</p>

            {loadingMsgs ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No messages yet. Use the reply box below to start the conversation.
              </p>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderRole === 'admin'
                return (
                  <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                      style={{ backgroundColor: isAdmin ? '#4f46e5' : '#6b7280' }}
                    >
                      {msg.senderName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className={`max-w-[78%] flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <p className={`text-[10px] text-gray-400 ${isAdmin ? 'text-right' : ''}`}>
                        {msg.senderName} · {formatTime(msg.createdAt)}
                      </p>
                      <div
                        className={`px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isAdmin
                            ? 'rounded-tr-sm bg-indigo-600 text-white'
                            : 'rounded-tl-sm bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={threadBottomRef} />
          </div>

          {/* Reply box */}
          <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
            <form onSubmit={handleSendReply} className="flex gap-2 items-end">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Send a reply…"
                rows={2}
                disabled={sending}
                className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(e) }
                }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                {sending ? <Spinner sm /> : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
