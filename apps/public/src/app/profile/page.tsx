'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getUserEnquiries,
  getEnquiryMessages,
  sendUserReply,
  markEnquiryReadByUser,
} from '@/lib/enquiries.client'
import type { PlainUserEnquiry, EnquiryMessage } from '@/lib/enquiries.client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Awaiting review',
  read: 'Under review',
  replied: 'Replied',
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  read: 'bg-stone-100 text-stone-600 border-stone-200',
  replied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="w-5 h-5 animate-spin"
      style={{ color: 'var(--brand-secondary)' }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

interface ThreadProps {
  enquiry: PlainUserEnquiry
  displayName: string
  onClose: () => void
}

function EnquiryThread({ enquiry, displayName, onClose }: ThreadProps) {
  const [messages, setMessages] = useState<EnquiryMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    getEnquiryMessages(enquiry.docPath)
      .then((msgs) => {
        setMessages(msgs)
        // Clear unread flag if needed
        if (enquiry.unreadByUser) {
          markEnquiryReadByUser(enquiry.docPath).catch(() => {/* silent */})
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [enquiry.docPath, enquiry.unreadByUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = reply.trim()
    if (!body) return
    setSending(true)
    try {
      const msg = await sendUserReply(enquiry.docPath, body, displayName)
      setMessages((prev) => [...prev, msg])
      setReply('')
    } catch (err) {
      console.error(err)
      alert('Failed to send reply. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh', minHeight: '60vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-stone-100 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--brand-secondary)' }}>
              {enquiry.type === 'permit' ? 'Permit application' : 'Enquiry'}
            </p>
            <h2 className="font-display text-xl font-semibold text-gray-900 leading-tight">
              {enquiry.locationTitle}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(enquiry.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5 ml-4"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Original enquiry summary */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Original submission</p>
          {enquiry.type === 'contact' && enquiry.message && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{enquiry.message}</p>
          )}
          {enquiry.type === 'permit' && (
            <div className="space-y-1 text-sm text-gray-600">
              {enquiry.intendedDates && (
                <p><span className="text-gray-400">Dates:</span> {enquiry.intendedDates}</p>
              )}
              {enquiry.organisation && (
                <p><span className="text-gray-400">Organisation:</span> {enquiry.organisation}</p>
              )}
              {enquiry.descriptionOfUse && (
                <p className="leading-relaxed whitespace-pre-wrap">{enquiry.descriptionOfUse}</p>
              )}
            </div>
          )}
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[enquiry.status] ?? ''}`}>
              {STATUS_LABELS[enquiry.status] ?? enquiry.status}
            </span>
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No messages yet.</p>
              <p className="text-xs text-gray-300 mt-1">Send a reply below to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.senderRole === 'user'
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar dot */}
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ backgroundColor: isUser ? 'var(--brand-primary)' : 'var(--brand-secondary)' }}
                  >
                    {msg.senderName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <p className={`text-xs text-gray-400 ${isUser ? 'text-right' : 'text-left'}`}>
                      {msg.senderName} · {formatTime(msg.createdAt)}
                    </p>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'rounded-tr-sm text-white'
                          : 'rounded-tl-sm text-gray-800 bg-stone-100'
                      }`}
                      style={isUser ? { backgroundColor: 'var(--brand-primary)' } : {}}
                    >
                      {msg.body}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <div className="border-t border-stone-100 px-6 py-4 flex-shrink-0">
          <form onSubmit={handleSend} className="flex gap-3 items-end">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply…"
              rows={2}
              disabled={sending}
              className="flex-1 resize-none rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 transition-colors"
              style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
              }}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {sending ? <Spinner /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
              Send
            </button>
          </form>
          <p className="text-xs text-gray-300 mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}

// ─── Enquiry card ─────────────────────────────────────────────────────────────

interface CardProps {
  enquiry: PlainUserEnquiry
  onOpen: () => void
}

function EnquiryCard({ enquiry, onOpen }: CardProps) {
  const preview =
    enquiry.type === 'contact'
      ? enquiry.message
      : enquiry.descriptionOfUse

  return (
    <button
      onClick={onOpen}
      className="w-full text-left group bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 hover:shadow-sm transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Unread indicator */}
          {enquiry.unreadByUser && (
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--brand-secondary)' }}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--brand-secondary)' }}>
                New reply from admin
              </span>
            </div>
          )}

          <p className="font-display text-base font-semibold text-gray-900 truncate group-hover:opacity-80 transition-opacity">
            {enquiry.locationTitle}
          </p>

          {preview && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {preview}
            </p>
          )}

          <p className="mt-2 text-xs text-gray-400">{formatDate(enquiry.createdAt)}</p>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[enquiry.status] ?? ''}`}>
            {STATUS_LABELS[enquiry.status] ?? enquiry.status}
          </span>
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'contact' | 'permit'

export default function ProfilePage() {
  const { user, userProfile } = useAuth()
  const [enquiries, setEnquiries] = useState<PlainUserEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('contact')
  const [openEnquiry, setOpenEnquiry] = useState<PlainUserEnquiry | null>(null)

  const displayName = userProfile
    ? `${userProfile.firstName} ${userProfile.surname}`.trim()
    : user?.email ?? 'User'

  const initial = displayName[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    if (!user) return
    getUserEnquiries(user.uid)
      .then(setEnquiries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const contact = enquiries.filter((e) => e.type === 'contact')
  const permits = enquiries.filter((e) => e.type === 'permit')
  const filtered = tab === 'contact' ? contact : permits
  const unreadContact = contact.filter((e) => e.unreadByUser).length
  const unreadPermit = permits.filter((e) => e.unreadByUser).length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

      {/* ── User header ── */}
      <div className="flex items-center gap-5 mb-12">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
          style={{ backgroundColor: 'var(--brand-secondary)' }}
        >
          {initial}
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900">
              {displayName}
            </h1>
            {userProfile?.accountType === 'location-owner' && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={{ backgroundColor: 'var(--brand-secondary)', color: '#fff' }}
              >
                Location owner
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* ── Section title ── */}
      <div className="mb-6">
        <div className="h-px w-8 mb-4" style={{ backgroundColor: 'var(--brand-secondary)' }} />
        <h2 className="font-display text-xl font-semibold text-gray-900">My Enquiries</h2>
        <p className="text-sm text-gray-400 mt-1">
          Track your location enquiries and permit applications, and continue conversations with our team.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-stone-200 mb-6">
        {([
          { key: 'contact' as Tab, label: 'Contact enquiries', count: contact.length, unread: unreadContact },
          { key: 'permit' as Tab, label: 'Permit applications', count: permits.length, unread: unreadPermit },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={
              tab === t.key
                ? { borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }
                : { borderColor: 'transparent', color: '#9ca3af' }
            }
          >
            {t.label}
            <span className="text-xs text-gray-400">({t.count})</span>
            {t.unread > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[1.1rem] h-4 px-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: 'var(--brand-secondary)' }}
              >
                {t.unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="mx-auto mb-4 w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="font-display text-lg font-medium text-gray-500">No {tab} enquiries yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {tab === 'contact'
              ? 'Send an enquiry from any location page to get started.'
              : 'Apply for a permit from any location page.'}
          </p>
          <a
            href="/"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: 'var(--brand-secondary)' }}
          >
            Browse locations
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((enq) => (
            <EnquiryCard
              key={enq.id}
              enquiry={enq}
              onOpen={() => setOpenEnquiry(enq)}
            />
          ))}
        </div>
      )}

      {/* ── Thread modal ── */}
      {openEnquiry && (
        <EnquiryThread
          enquiry={openEnquiry}
          displayName={displayName}
          onClose={() => {
            // If we just cleared unreadByUser, update local state so badge disappears
            setEnquiries((prev) =>
              prev.map((e) =>
                e.id === openEnquiry.id ? { ...e, unreadByUser: false } : e
              )
            )
            setOpenEnquiry(null)
          }}
        />
      )}
    </div>
  )
}
