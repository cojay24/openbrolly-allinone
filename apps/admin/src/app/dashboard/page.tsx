'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/context/AdminContext'
import { getDashboardStats, getUsers } from '@/lib/db.client'

interface Stats {
  totalLocations: number
  publishedLocations: number
  totalEnquiries: number
  unreadEnquiries: number
  totalUsers: number
  pendingUsers: number
}

export default function DashboardPage() {
  const { clientId } = useAdmin()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!clientId) return
    Promise.all([getDashboardStats(clientId), getUsers()])
      .then(([locationStats, users]) => {
        setStats({
          ...locationStats,
          totalUsers: users.length,
          pendingUsers: users.filter((u) => u.accountStatus === 'pending').length,
        })
      })
      .catch(console.error)
  }, [clientId])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total locations" value={stats.totalLocations} />
          <StatCard label="Published" value={stats.publishedLocations} />
          <StatCard label="Total enquiries" value={stats.totalEnquiries} />
          <StatCard
            label="Unread enquiries"
            value={stats.unreadEnquiries}
            highlight={stats.unreadEnquiries > 0}
          />
          <StatCard label="Registered users" value={stats.totalUsers} />
          <StatCard
            label="Pending approvals"
            value={stats.pendingUsers}
            highlight={stats.pendingUsers > 0}
          />
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard/locations/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add location
        </Link>
        <Link
          href="/dashboard/enquiries"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View enquiries
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`mt-1 text-3xl font-semibold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
