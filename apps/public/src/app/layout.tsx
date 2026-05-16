import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getClient } from '@/lib/db.server'
import { BrandProvider } from '@/components/BrandProvider'
import { AuthProvider } from '@/context/AuthContext'
import { AuthGate } from '@/components/AuthGate'
import { UserMenu } from '@/components/UserMenu'
import { SubmitLocationButton } from '@/components/SubmitLocationButton'
import { LocationOwnerCTA } from '@/components/LocationOwnerCTA'
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
    primaryColor: '#111111',
    secondaryColor: '#C9A96E',
    fontFamily: "'Inter', system-ui, sans-serif",
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
      <body suppressHydrationWarning className="min-h-screen bg-[#FAFAF8] text-gray-900 antialiased">
        <AuthProvider>

          {/* ── Header ── */}
          <header
            className="sticky top-0 z-40"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
              {/* Logo / site name */}
              <div className="flex-shrink-0">
                {brand.logo ? (
                  <a href="/" aria-label={`${clientName} — home`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brand.logo}
                      alt={clientName}
                      className="h-9 w-auto object-contain"
                    />
                  </a>
                ) : (
                  <a href="/" className="flex items-center gap-2.5 group">
                    <span className="font-display text-xl font-semibold tracking-tight text-white group-hover:opacity-80 transition-opacity">
                      {clientName}
                    </span>
                  </a>
                )}
              </div>

              {/* Right-side actions */}
              <div className="flex items-center gap-3">
                <SubmitLocationButton />
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Keeps brand colours in sync with Firestore without a rebuild */}
          <BrandProvider />

          {/* ── Page content ── */}
          <main>
            <AuthGate>{children}</AuthGate>
          </main>

          {/* ── Location owner CTA ── */}
          <LocationOwnerCTA />

          {/* ── Footer ── */}
          <footer className="bg-[#111111] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">
                {/* Brand column */}
                <div>
                  <p className="font-display text-xl font-semibold text-white mb-3">
                    {clientName}
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                    Connecting creative professionals with extraordinary spaces across the UK.
                  </p>
                </div>

                {/* Platform column */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Platform</p>
                  <ul className="space-y-2.5">
                    {[
                      { label: 'Browse locations', href: '/' },
                      { label: 'My lists', href: '/my-lists' },
                      { label: 'Submit a location', href: '/submit-location' },
                    ].map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Account column */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Account</p>
                  <ul className="space-y-2.5">
                    {[
                      { label: 'My enquiries', href: '/profile' },
                      { label: 'My lists', href: '/my-lists' },
                      { label: 'Apply as location owner', href: '#' },
                    ].map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-white/30">
                  © {new Date().getFullYear()} {clientName}. All rights reserved.
                </p>
                <p className="text-xs text-white/20">
                  Powered by Openbrolly
                </p>
              </div>
            </div>
          </footer>

        </AuthProvider>
      </body>
    </html>
  )
}
