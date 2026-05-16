'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  getLists,
  deleteList,
  getLocationsFromIds,
  type UserList,
} from '@/lib/lists.client'
import { LocationCard } from '@/components/LocationCard'
import type { PlainLocation } from '@/lib/types'

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <svg className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )
}

// ─── List detail view ─────────────────────────────────────────────────────────

function ListDetail({ list, onDelete }: { list: UserList; onDelete: () => void }) {
  const [locations, setLocations] = useState<PlainLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLocationsFromIds(list.locationIds).then((locs) => {
      setLocations(locs)
      setLoading(false)
    })
  }, [list.locationIds])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/my-lists"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        My Lists
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{list.name}</h1>
          <p className="text-gray-500 mt-1">
            {list.locationIds.length} location{list.locationIds.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="mt-1 text-sm text-red-500 hover:text-red-700 transition-colors font-medium"
        >
          Delete list
        </button>
      </div>

      {/* Locations */}
      {loading ? (
        <Spinner />
      ) : locations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No locations saved to this list yet.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Browse locations
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {locations.map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lists overview ────────────────────────────────────────────────────────────

function ListsOverview({
  lists,
  loading,
  onDelete,
}: {
  lists: UserList[]
  loading: boolean
  onDelete: (id: string) => void
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">My Lists</h1>
          {!loading && (
            <p className="text-gray-500 mt-1">
              {lists.length} list{lists.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-80 transition-opacity"
          style={{ color: 'var(--brand-primary)' }}
        >
          Browse locations
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : lists.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: 'var(--brand-primary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-5-7 5V5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No lists yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Browse locations and hit &ldquo;Save to list&rdquo; to organise them by project.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Browse locations
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((list) => (
            <div key={list.id} className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <Link href={`/my-lists?list=${list.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: 'var(--brand-primary)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-5-7 5V5z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-400">
                    {list.locationIds.length} location{list.locationIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:underline line-clamp-1">
                  {list.name}
                </h2>
                {list.updatedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Updated {new Date(list.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>

              {/* Delete button */}
              <button
                onClick={() => onDelete(list.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                aria-label={`Delete ${list.name}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────

function MyListsContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const listId = searchParams.get('list')

  const [lists, setLists] = useState<UserList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getLists(user.uid).then((l) => {
      setLists(l)
      setLoading(false)
    })
  }, [user])

  async function handleDelete(id: string) {
    if (!user || !confirm('Delete this list? This cannot be undone.')) return
    await deleteList(user.uid, id)
    setLists((prev) => prev.filter((l) => l.id !== id))
    if (listId === id) router.push('/my-lists')
  }

  // ── List detail ──
  if (listId) {
    const activeList = lists.find((l) => l.id === listId)
    if (!loading && !activeList) {
      // Unknown list ID — redirect to overview
      router.replace('/my-lists')
      return null
    }
    if (activeList) {
      return <ListDetail list={activeList} onDelete={() => handleDelete(activeList.id)} />
    }
    // Still loading
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Spinner />
      </div>
    )
  }

  // ── Overview ──
  return <ListsOverview lists={lists} loading={loading} onDelete={handleDelete} />
}

export default function MyListsPage() {
  return (
    <Suspense>
      <MyListsContent />
    </Suspense>
  )
}
