'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PlainLocation } from '@/lib/db.client'

interface Props {
  locations: PlainLocation[]
  publicSiteUrl?: string
}

type StatusFilter = 'all' | 'published' | 'draft'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-600',
}

export function LocationsTable({ locations, publicSiteUrl }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('all')

  const filtered = filter === 'all' ? locations : locations.filter((l) => l.status === filter)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(['all', 'published', 'draft'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize focus-ring ${
              filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
            <span className="ml-1.5 text-xs text-gray-400">
              ({s === 'all' ? locations.length : locations.filter((l) => l.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">No locations</p>
            <p className="text-sm mt-1">Add your first location to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-full">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Categories</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden md:table-cell">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{loc.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[loc.status] ?? ''}`}>
                      {loc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                    {(loc.categories as string[])?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 whitespace-nowrap">
                    {formatDate(loc.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/locations/${loc.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs focus-ring rounded"
                      >
                        Edit
                      </Link>
                      {publicSiteUrl && (
                        <a
                          href={`${publicSiteUrl}/locations/${loc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 font-medium text-xs focus-ring rounded"
                        >
                          View ↗
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
