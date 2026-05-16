'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getLists,
  createList,
  addToList,
  removeFromList,
  type UserList,
} from '@/lib/lists.client'

interface Props {
  locationId: string
  locationTitle: string
  onClose: () => void
}

export function AddToListModal({ locationId, locationTitle, onClose }: Props) {
  const { user } = useAuth()
  const [lists, setLists] = useState<UserList[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return
    getLists(user.uid).then((l) => {
      setLists(l)
      setLoading(false)
    })
  }, [user])

  async function handleToggle(list: UserList) {
    if (!user) return
    const isIn = list.locationIds.includes(locationId)
    setTogglingId(list.id)
    try {
      if (isIn) {
        await removeFromList(user.uid, list.id, locationId)
        setLists((prev) =>
          prev.map((l) =>
            l.id === list.id
              ? { ...l, locationIds: l.locationIds.filter((id) => id !== locationId) }
              : l
          )
        )
      } else {
        await addToList(user.uid, list.id, locationId)
        setLists((prev) =>
          prev.map((l) =>
            l.id === list.id
              ? { ...l, locationIds: [...l.locationIds, locationId] }
              : l
          )
        )
      }
    } finally {
      setTogglingId(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newListName.trim()) return
    setCreating(true)
    try {
      const id = await createList(user.uid, newListName.trim())
      setLists((prev) => [
        ...prev,
        {
          id,
          name: newListName.trim(),
          locationIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      setNewListName('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dismissable backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Save to list</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{locationTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0 mt-0.5"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List items */}
        <div className="px-5 py-3 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="py-8 flex justify-center">
              <svg className="w-5 h-5 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : lists.length === 0 ? (
            <p className="py-5 text-sm text-gray-400 text-center">
              No lists yet — create your first one below.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {lists.map((list) => {
                const isIn = list.locationIds.includes(locationId)
                const isToggling = togglingId === list.id
                return (
                  <li key={list.id}>
                    <button
                      onClick={() => handleToggle(list)}
                      disabled={isToggling}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                    >
                      {/* Checkbox */}
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors"
                        style={
                          isIn
                            ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }
                            : { borderColor: '#d1d5db' }
                        }
                      >
                        {isIn && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-800 flex-1">{list.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {list.locationIds.length}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Create new list */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">New list</p>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. Project Ember"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
              maxLength={60}
            />
            <button
              type="submit"
              disabled={creating || !newListName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {creating ? '…' : 'Create'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
