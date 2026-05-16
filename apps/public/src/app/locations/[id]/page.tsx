import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLocation, getFieldSchema } from '@/lib/db.server'
import { ImageGallery } from '@/components/ImageGallery'
import { DynamicFields } from '@/components/DynamicFields'
import { LocationActions } from '@/components/LocationActions'
import { AddToListButton } from '@/components/AddToListButton'
import { LocationDetailClient } from './LocationDetailClient'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

export async function generateStaticParams() {
  const { getPublishedLocations } = await import('@/lib/db.server')
  const locations = await getPublishedLocations(CLIENT_ID)
  return [...locations.map((loc) => ({ id: loc.id })), { id: '_' }]
}

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.id === '_') return {}
  const location = await getLocation(CLIENT_ID, params.id)
  if (!location) return {}
  return {
    title: location.title as string,
    description: (location.description as string).slice(0, 160),
  }
}

export default async function LocationDetailPage({ params }: Props) {
  if (params.id === '_') return <LocationDetailClient />

  const [location, fieldSchema] = await Promise.all([
    getLocation(CLIENT_ID, params.id),
    getFieldSchema(CLIENT_ID),
  ])

  if (!location || location.status !== 'published') notFound()

  const categories = (location.categories as string[]) ?? []
  const images = (location.images as string[]) ?? []
  const title = location.title as string
  const description = location.description as string

  return (
    <article>
      {/* ── Full-width hero image ── */}
      {images.length > 0 && (
        <div className="w-full bg-stone-900" style={{ maxHeight: '70vh', overflow: 'hidden' }}>
          <ImageGallery images={images} title={title} />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Back link ── */}
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All locations
        </a>

        {/* ── Categories ── */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border"
                style={{ borderColor: 'var(--brand-secondary)', color: 'var(--brand-secondary)' }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* ── Title ── */}
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight mb-6">
          {title}
        </h1>

        {/* ── Description ── */}
        <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-3xl">
          {description}
        </p>

        {/* ── Divider ── */}
        <hr className="border-stone-200 mb-10" />

        {/* ── Dynamic fields ── */}
        <DynamicFields location={location} fieldSchema={fieldSchema} />

        {/* ── CTA ── */}
        <div className="mt-12 pt-10 border-t border-stone-200">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">
            Interested in this location?
          </h2>
          <p className="text-gray-500 text-sm mb-6">Get in touch with the location owner or save it to one of your project lists.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <LocationActions locationId={params.id} locationTitle={title} />
            <AddToListButton locationId={params.id} locationTitle={title} />
          </div>
        </div>
      </div>
    </article>
  )
}
