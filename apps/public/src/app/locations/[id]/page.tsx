import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLocation, getFieldSchema } from '@/lib/db.server'
import { ImageGallery } from '@/components/ImageGallery'
import { DynamicFields } from '@/components/DynamicFields'
import { LocationActions } from '@/components/LocationActions'
import { AddToListButton } from '@/components/AddToListButton'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

export async function generateStaticParams() {
  const { getPublishedLocations } = await import('@/lib/db.server')
  const locations = await getPublishedLocations(CLIENT_ID)
  return locations.map((loc) => ({ id: loc.id }))
}

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const location = await getLocation(CLIENT_ID, params.id)
  if (!location) return {}
  return {
    title: location.title as string,
    description: (location.description as string).slice(0, 160),
  }
}

export default async function LocationDetailPage({ params }: Props) {
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
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Back link ── */}
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All locations
      </a>

      {/* ── Image gallery ── */}
      {images.length > 0 && (
        <div className="mb-8">
          <ImageGallery images={images} title={title} />
        </div>
      )}

      {/* ── Title + categories ── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3" aria-label="Categories">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Description ── */}
      <div className="prose prose-gray max-w-none mb-8">
        <p className="text-gray-600 text-lg leading-relaxed">{description}</p>
      </div>

      {/* ── Dynamic fields (showOnPublic only, excluding core fields) ── */}
      <DynamicFields location={location} fieldSchema={fieldSchema} />

      {/* ── CTA buttons ── */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Interested in this location?</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <LocationActions locationId={params.id} />
          <AddToListButton locationId={params.id} locationTitle={title} />
        </div>
      </div>
    </article>
  )
}
