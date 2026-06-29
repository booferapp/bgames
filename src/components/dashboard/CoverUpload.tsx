'use client'

import { useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageIcon, X, Loader2, AlertCircle } from 'lucide-react'

interface CoverUploadProps {
  /** Current cover URL (if already saved) */
  value: string
  onChange: (url: string) => void
  /** Supabase user id — used to namespace the storage path */
  userId: string
  error?: string
}

const TARGET_WIDTH = 960
const TARGET_HEIGHT = 540
const MAX_BYTES = 50 * 1024 // 50 KB

/** Resize image to 960×540 and encode as WebP ≤ 50 KB */
async function processImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Enforce 16:9 ratio — allow ±5% tolerance
      const ratio = img.naturalWidth / img.naturalHeight
      if (ratio < 1.68 || ratio > 1.88) {
        reject(new Error('Cover must be a 16:9 widescreen image.'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = TARGET_WIDTH
      canvas.height = TARGET_HEIGHT
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT)

      // Binary-search WebP quality to land ≤ 50 KB
      let lo = 0
      let hi = 1
      let best: string | null = null

      const attempt = (quality: number): string => {
        return canvas.toDataURL('image/webp', quality)
      }

      // Quick check: even at q=0.05 still > 50 KB? Reject.
      const minData = attempt(0.05)
      const minBlob = dataUrlToBlob(minData)
      if (minBlob.size > MAX_BYTES) {
        reject(new Error('Image is too complex to compress below 50 KB at 960×540. Try a simpler image.'))
        return
      }

      // Binary search for highest quality ≤ 50 KB
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2
        const data = attempt(mid)
        const blob = dataUrlToBlob(data)
        if (blob.size <= MAX_BYTES) {
          best = data
          lo = mid
        } else {
          hi = mid
        }
      }

      if (!best) {
        best = minData
      }

      resolve(dataUrlToBlob(best))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read the image file.'))
    }

    img.src = objectUrl
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)![1]
  const binary = atob(base64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export function CoverUpload({ value, onChange, userId, error }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(value || null)

  const handleFile = useCallback(async (file: File) => {
    setLocalError(null)

    // Basic type check
    if (!file.type.startsWith('image/')) {
      setLocalError('Only image files are accepted (PNG, JPG, WebP, etc.).')
      return
    }

    // Raw size guard — 5 MB max before processing
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Source image must be under 5 MB.')
      return
    }

    setUploading(true)
    try {
      const blob = await processImage(file)

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(blob)
      setPreview(previewUrl)

      // Upload to Supabase Storage (under banners bucket)
      const supabase = createClient()
      const path = `${userId}/${Date.now()}-cover.webp`
      const { data, error: uploadError } = await supabase.storage
          .from('banners')
          .upload(path, blob, { contentType: 'image/webp', upsert: false })

      if (uploadError) throw new Error('Upload failed: ' + uploadError.message)

      const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(data.path)

      onChange(publicUrl)
    } catch (err: unknown) {
      setLocalError((err as Error).message || 'Upload failed.')
      setPreview(value || null)
    } finally {
      setUploading(false)
    }
  }, [userId, value, onChange])

  const clear = () => {
    setPreview(null)
    onChange('')
    setLocalError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayError = localError || error

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        Cover Image (Optional)
      </label>

      {preview ? (
        <div className="relative w-48 h-27 group aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Cover preview"
            className="w-48 h-27 object-cover border border-neutral-800"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 size={18} className="text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-1 right-1 bg-black/70 hover:bg-black text-neutral-400 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove cover"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2.5 w-fit px-3 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ImageIcon size={15} />
          )}
          {uploading ? 'Processing…' : 'Upload Cover'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {displayError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> {displayError}
        </p>
      )}

      <p className="text-xs text-neutral-600">
        16:9 widescreen image · auto-resized to 960×540 · WebP ≤ 50 KB. Displays at store top if trending.
      </p>
    </div>
  )
}
