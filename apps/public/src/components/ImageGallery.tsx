'use client'

import { useState, useEffect, useCallback } from 'react'

interface Props {
  images: string[]
  title: string
}

export function ImageGallery({ images, title }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const prev = useCallback(
    () => setActiveIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setActiveIndex((i) => (i + 1) % images.length),
    [images.length],
  )
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, prev, next, closeLightbox])

  if (images.length === 0) return null

  return (
    <>
      {/* ── Main image ── */}
      <button
        className="relative w-full overflow-hidden rounded-xl bg-gray-100 focus-brand"
        style={{ aspectRatio: '16/9' }}
        onClick={() => setLightboxOpen(true)}
        aria-label={`Open full-screen gallery for ${title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`${title} — image ${activeIndex + 1} of ${images.length}`}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          ⊞ Enlarge
        </span>
      </button>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" role="list" aria-label="Image thumbnails">
          {images.map((img, i) => (
            <button
              key={i}
              role="listitem"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all focus-brand ${
                i === activeIndex
                  ? 'ring-2 ring-offset-1 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
              style={i === activeIndex ? { borderColor: 'var(--brand-secondary)', '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — full-screen gallery`}
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox() }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white bg-white/10 hover:bg-white/25 rounded-full p-2.5 transition-colors focus-brand"
            aria-label="Close gallery"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/25 rounded-full p-3 transition-colors focus-brand"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="px-16 py-12 flex items-center justify-center max-w-5xl w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIndex]}
              alt={`${title} — image ${activeIndex + 1} of ${images.length}`}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/25 rounded-full p-3 transition-colors focus-brand"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
              {activeIndex + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </>
  )
}
