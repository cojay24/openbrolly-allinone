import Link from 'next/link'
import type { PlainLocation } from '@/lib/types'

interface Props {
  location: PlainLocation
}

const PLACEHOLDER = 'https://placehold.co/800x600/1a1a1a/ffffff?text=No+Image'

export function LocationCard({ location }: Props) {
  const categories = (location.categories as string[]) ?? []
  const images = (location.images as string[]) ?? []
  const heroImage = images[0] ?? PLACEHOLDER

  return (
    <Link
      href={`/locations/${location.id}`}
      className="group block focus-brand rounded-sm"
    >
      {/* Image container */}
      <div
        className="relative overflow-hidden bg-stone-200"
        style={{ aspectRatio: '4/3' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={location.title as string}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay — always present, stronger on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Categories — top left */}
        {categories.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-sm text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm"
              >
                {cat}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                +{categories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Arrow icon — appears on hover */}
        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      {/* Text area */}
      <div className="pt-4 pb-2">
        <h2 className="font-display text-lg font-semibold text-gray-900 leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity duration-200">
          {location.title as string}
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed line-clamp-2">
          {location.description as string}
        </p>
      </div>
    </Link>
  )
}
