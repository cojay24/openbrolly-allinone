'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getUsers,
  updateUserAccountType,
  updateUserAccountStatus,
  type PlainUser,
  type AccountType,
  type AccountStatus,
} from '@/lib/db.client'

// ─── Badge helpers ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AccountType }) {
  return type === 'location-owner' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
      Location Owner
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Viewer
    </span>
  )
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const styles: Record<AccountStatus, string> = {
    active:   'bg-green-100 text-green-700',
    pending:  'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100   text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── User detail panel ────────────────────────────────────────────────────────

function UserDetail({
  user,
  onUpdate,
}: {
  user: PlainUser
  onUpdate: (uid: string, patch: Partial<PlainUser>) => void
}) {
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleTypeChange(type: AccountType) {
    setSaving('type')
    try {
      await updateUserAccountType(user.uid, type)
      // When promoting to location-owner, auto-set status to pending
      const patch: Partial<PlainUser> = { accountType: type }
      if (type === 'location-owner' && user.accountStatus === 'active') {
        await updateUserAccountStatus(user.uid, 'pending')
        patch.accountStatus = 'pending'
      }
      onUpdate(user.uid, patch)
      showToast('Account type updated.')
    } catch {
      showToast('Failed to update. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  async function handleStatusChange(status: AccountStatus) {
    setSaving('status')
    try {
      await updateUserAccountStatus(user.uid, status)
      onUpdate(user.uid, { accountStatus: status })
      showToast('Account status updated.')
    } catch {
      showToast('Failed to update. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  const fullName = `${user.firstName} ${user.surname}`.trim() || '—'
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{fullName}</h2>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <TypeBadge type={user.accountType} />
          <StatusBadge status={user.accountStatus} />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Profile fields */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile</h3>
          <dl className="space-y-3">
            {[
              { label: 'Full name',    value: fullName },
              { label: 'Email',        value: user.email || '—' },
              { label: 'Phone',        value: user.phone || '—' },
              { label: 'Company',      value: user.company || '—' },
              { label: 'Member since', value: joinedDate },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <dt className="w-28 flex-shrink-0 text-sm text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-900 font-medium break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Account type */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Type</h3>
          <div className="flex gap-2">
            {(['viewer', 'location-owner'] as AccountType[]).map((type) => (
              <button
                key={type}
                onClick={() => user.accountType !== type && handleTypeChange(type)}
                disabled={saving === 'type'}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors disabled:opacity-60 ${
                  user.accountType === type
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type === 'viewer' ? 'Viewer' : 'Location Owner'}
              </button>
            ))}
          </div>
          {user.accountType === 'location-owner' && (
            <p className="text-xs text-amber-600 mt-2">
              Location Owners require approval before they can submit locations.
            </p>
          )}
        </section>

        {/* Account status */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Status</h3>
          <div className="space-y-2">
            {user.accountStatus !== 'active' && (
              <button
                onClick={() => handleStatusChange('active')}
                disabled={saving === 'status'}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {saving === 'status' ? 'Saving…' : '✓ Approve / Activate'}
              </button>
            )}
            {user.accountStatus !== 'pending' && (
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={saving === 'status'}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-60 transition-colors"
              >
                {saving === 'status' ? 'Saving…' : '⏳ Set to Pending'}
              </button>
            )}
            {user.accountStatus !== 'rejected' && (
              <button
                onClick={() => handleStatusChange('rejected')}
                disabled={saving === 'status'}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-60 transition-colors"
              >
                {saving === 'status' ? 'Saving…' : '✕ Reject / Deactivate'}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Rejected users are blocked from accessing the public site.
          </p>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mx-6 mb-5 px-4 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium text-center">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type TypeFilter   = 'all' | AccountType
type StatusFilter = 'all' | AccountStatus

export default function UsersPage() {
  const [users, setUsers]           = useState<PlainUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<PlainUser | null>(null)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Keep detail panel in sync when a user is updated
  function handleUpdate(uid: string, patch: Partial<PlainUser>) {
    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, ...patch } : u))
    setSelected((prev) => prev?.uid === uid ? { ...prev, ...patch } : prev)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      if (typeFilter !== 'all' && u.accountType !== typeFilter) return false
      if (statusFilter !== 'all' && u.accountStatus !== statusFilter) return false
      if (q && !`${u.firstName} ${u.surname} ${u.email} ${u.company}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, search, typeFilter, statusFilter])

  // Counts for filter tabs
  const counts = useMemo(() => ({
    all:             users.length,
    viewer:          users.filter((u) => u.accountType === 'viewer').length,
    'location-owner': users.filter((u) => u.accountType === 'location-owner').length,
  }), [users])

  const statusCounts = useMemo(() => ({
    all:      users.length,
    active:   users.filter((u) => u.accountStatus === 'active').length,
    pending:  users.filter((u) => u.accountStatus === 'pending').length,
    rejected: users.filter((u) => u.accountStatus === 'rejected').length,
  }), [users])

  return (
    <div className="flex flex-col h-full -m-8">
      {/* ── Page header ── */}
      <div className="px-8 py-6 bg-white border-b border-gray-200 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage registered users and Location Owner approvals.
        </p>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* ── Left: list ── */}
        <div className={`flex flex-col border-r border-gray-200 bg-white ${selected ? 'w-1/2' : 'w-full'} transition-all`}>

          {/* Search + filters */}
          <div className="px-5 py-4 border-b border-gray-100 space-y-3 flex-shrink-0">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or company…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            {/* Type filter */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                ['all', 'All'],
                ['viewer', 'Viewers'],
                ['location-owner', 'Location Owners'],
              ] as [TypeFilter, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTypeFilter(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label} ({counts[val as keyof typeof counts] ?? 0})
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                ['all',      'All',      ''],
                ['active',   'Active',   'text-green-700 bg-green-50'],
                ['pending',  'Pending',  'text-amber-700 bg-amber-50'],
                ['rejected', 'Rejected', 'text-red-700   bg-red-50'],
              ] as [StatusFilter, string, string][]).map(([val, label, cls]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    statusFilter === val
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : `border-transparent ${cls || 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                  }`}
                >
                  {label} ({statusCounts[val as keyof typeof statusCounts] ?? 0})
                </button>
              ))}
            </div>
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">{users.length === 0 ? 'No users have signed up yet.' : 'No users match your filters.'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((user) => {
                  const isSelected = selected?.uid === user.uid
                  const fullName = `${user.firstName} ${user.surname}`.trim() || user.email
                  return (
                    <li key={user.uid}>
                      <button
                        onClick={() => setSelected(isSelected ? null : user)}
                        className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4 ${
                          isSelected ? 'bg-indigo-50 border-r-2 border-indigo-600' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                          {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900 truncate">{fullName}</span>
                            <TypeBadge type={user.accountType} />
                            <StatusBadge status={user.accountStatus} />
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                          {user.company && (
                            <p className="text-xs text-gray-400 truncate">{user.company}</p>
                          )}
                        </div>

                        {/* Joined date */}
                        <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right: detail panel ── */}
        {selected && (
          <div className="w-1/2 flex flex-col bg-white">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">User Detail</span>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close panel"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <UserDetail
                key={selected.uid}
                user={selected}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
