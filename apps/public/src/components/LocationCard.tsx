import Link from 'next/link'
import type { PlainLocation } from '@/lib/db.server'

interface Props {
  location: PlainLocation
}

const PLACEHOLDER = 'https://placehold.co/800x450?text=No+Image'

export function LocationCard({ location }: Props) {
  const categories = (location.categories as string[]) ?? []
  const images = (location.images as string[]) ?? []
  const heroImage = images[0] ?? PLACEHOLDER

  return (
    <Link
      href={`/locations/${location.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 focus-brand"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={`${location.title as string} — preview`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className="p-4">
        <h2 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:underline">
          {location.title as string}
        </h2>

        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {location.description as string}
        </p>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Categories">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: 'var(--brand-secondary)' }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
