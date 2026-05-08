import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getClient } from '@/lib/db.server'
import './globals.css'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const client = await getClient(CLIENT_ID)
    return {
      title: { default: `${client.name} — Locations`, template: `%s | ${client.name}` },
      description: `Discover unique film and event locations by ${client.name}.`,
    }
  } catch {
    return { title: 'Film Locations', description: 'Discover unique film and event locations.' }
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  let brand = {
    primaryColor: '#1a1a2e',
    secondaryColor: '#e94560',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    logo: '',
  }
  let clientName = 'Locations'

  try {
    const client = await getClient(CLIENT_ID)
    brand = client.brandConfig
    clientName = client.name
  } catch {
    // use fallback values above
  }

  return (
    <html
      lang="en"
      style={{
        '--brand-primary': brand.primaryColor,
        '--brand-secondary': brand.secondaryColor,
        '--brand-font': brand.fontFamily,
      } as React.CSSProperties}
    >
      <head />
      <body suppressHydrationWarning className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* ── Header ── */}
        <header
          className="sticky top-0 z-40 shadow-sm"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            {brand.logo ? (
              <a href="/" aria-label={`${clientName} — home`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logo}
                  alt={clientName}
                  className="h-10 w-auto object-contain"
                />
              </a>
            ) : (
              <a
                href="/"
                className="text-xl font-bold tracking-tight text-white"
              >
                {clientName}
              </a>
            )}
          </div>
        </header>

        {/* ── Page content ── */}
        <main>{children}</main>

        {/* ── Footer ── */}
        <footer className="mt-20 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} {clientName}. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}
