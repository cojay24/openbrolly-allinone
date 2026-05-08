'use client'

import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { getStorageInstance } from '@openbrolly/firebase'

interface Props {
  images: string[]
  clientId: string
  locationId: string
  onImagesChange: (images: string[]) => void
}

interface UploadProgress {
  name: string
  progress: number
}

export function ImageManager({ images, clientId, locationId, onImagesChange }: Props) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function storagePath(filename: string) {
    return `clients/${clientId}/locations/${locationId}/${filename}`
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''

    for (const file of files) {
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const storageRef = ref(getStorageInstance(), storagePath(filename))

      setUploads((prev) => [...prev, { name: file.name, progress: 0 }])

      const task = uploadBytesResumable(storageRef, file, { contentType: file.type })

      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          setUploads((prev) => prev.map((u) => (u.name === file.name ? { ...u, progress: pct } : u)))
        },
        () => {
          setUploads((prev) => prev.filter((u) => u.name !== file.name))
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          onImagesChange([...images, url])
          setUploads((prev) => prev.filter((u) => u.name !== file.name))
        },
      )
    }
  }

  async function handleDelete(url: string, idx: number) {
    if (!confirm('Remove this image?')) return
    setDeleting((prev) => new Set(prev).add(url))
    try {
      // Extract path from URL if it's a Firebase Storage URL
      try {
        const storageRef = ref(getStorageInstance(), url)
        await deleteObject(storageRef)
      } catch {
        // URL might not be a Firebase Storage ref (e.g. placeholder) — just remove from array
      }
      const next = images.filter((_, i) => i !== idx)
      onImagesChange(next)
    } finally {
      setDeleting((prev) => { const s = new Set(prev); s.delete(url); return s })
    }
  }

  // ── Drag to reorder ──
  function handleDragStart(i: number) {
    dragIndex.current = i
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    setDragOver(i)
  }
  function handleDrop(i: number) {
    const from = dragIndex.current
    if (from === null || from === i) { setDragOver(null); return }
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    onImagesChange(next)
    setDragOver(null)
    dragIndex.current = null
  }

  return (
    <div>
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => setDragOver(null)}
              className={`relative group rounded-lg overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing border-2 transition-all ${
                dragOver === i ? 'border-indigo-400 scale-105' : 'border-transparent'
              }`}
              style={{ aspectRatio: '4/3' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />

              {/* Hero badge */}
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                  Hero
                </span>
              )}

              {/* Delete overlay */}
              <button
                onClick={() => handleDelete(url, i)}
                disabled={deleting.has(url)}
                className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 focus-ring"
                aria-label="Remove image"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Drag hint */}
              <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-70 transition-opacity">
                <svg className="w-4 h-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploads.map((u) => (
        <div key={u.name} className="mb-2 flex items-center gap-3 text-sm text-gray-600">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${u.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{u.name} {u.progress}%</span>
        </div>
      ))}

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors focus-ring"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Upload images
      </button>
      {images.length > 1 && (
        <p className="text-xs text-gray-400 mt-1.5">Drag images to reorder. First image is the hero.</p>
      )}
    </div>
  )
}
