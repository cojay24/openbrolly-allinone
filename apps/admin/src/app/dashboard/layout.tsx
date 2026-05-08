import type { ReactNode } from 'react'
import { AdminProvider } from '@/context/AdminContext'
import { DashboardGuard } from '@/components/DashboardGuard'
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <DashboardGuard>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </DashboardGuard>
    </AdminProvider>
  )
}
