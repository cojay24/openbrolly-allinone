'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getPublicLocation, getPublicFieldSchema } from '@/lib/locations.client'
import { ImageGallery } from '@/components/ImageGallery'
import { DynamicFields } from '@/components/DynamicFields'
import { LocationActions } from '@/components/LocationActions'
import { AddToListButton } from '@/components/AddToListButton'
import type { PlainLocation } from '@/lib/types'
import type { FieldSchema } from '@openbrolly/firebase/types'

/**
 * Client-side location detail page.
 * Used as the catch-all for locations that weren't pre-generated at build time
 * (i.e. locations approved after the last deploy). Reads the real ID from the
 * URL pathname rather than `params.id` (which will be '_' from the rewrite).
 */
export function LocationDetailClient() {
  const pathname = usePathname()
  // Pathname is /locations/{id} — extract the last segment as the real ID
  const locationId = pathname.split('/').filter(Boolean).pop() ?? ''

  const [location, setLocation] = useState<PlainLocation | null>(null)
  const [fieldSchema, setFieldSchema] = useState<FieldSchema>({ fields: [] })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!locationId || locationId === '_') return
    Promise.all([getPublicLocation(locationId), getPublicFieldSchema()])
      .then(([loc, schema]) => {
        if (!loc) {
          setNotFound(true)
        } else {
          setLocation(loc)
          setFieldSchema(schema)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [locationId])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <svg
          className="w-7 h-7 animate-spin"
          style={{ color: 'var(--brand-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  if (notFound || !location) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <p className="text-xl font-semibold text-gray-700">Location not found</p>
        <p className="text-sm text-gray-400 mt-2">It may have been removed or is not yet published.</p>
        <a href="/" className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline">
          ← Back to all locations
        </a>
      </div>
    )
  }

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

      {/* ── Dynamic fields ── */}
      <DynamicFields location={location} fieldSchema={fieldSchema} />

      {/* ── CTA buttons ── */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Interested in this location?</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <LocationActions locationId={locationId} />
          <AddToListButton locationId={locationId} locationTitle={title} />
        </div>
      </div>
    </article>
  )
}
