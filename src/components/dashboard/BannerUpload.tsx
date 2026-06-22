'use client'

import { useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageIcon, X, Loader2, AlertCircle } from 'lucide-react'

interface BannerUploadProps {
  /** Current banner URL (if already saved) */
  value: string
  onChange: (url: string) => void
  /** Supabase user id — used to namespace the storage path */
  userId: string
  error?: string
}

const TARGET_SIZE = 512
const MAX_BYTES = 10 * 1024 // 10 KB

/** Resize image to 512×512 and encode as WebP ≤ 10 KB */
async function processImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Enforce square (1:1) ratio — allow ±5% tolerance
      const ratio = img.naturalWidth / img.naturalHeight
      if (ratio < 0.95 || ratio > 1.05) {
        reject(new Error('Banner must be a 1:1 square image.'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = TARGET_SIZE
      canvas.height = TARGET_SIZE
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, TARGET_SIZE, TARGET_SIZE)

      // Binary-search WebP quality to land ≤ 10 KB
      let lo = 0
      let hi = 1
      let best: string | null = null

      const attempt = (quality: number): string => {
        return canvas.toDataURL('image/webp', quality)
      }

      // Quick check: even at q=0.1 still > 10 KB? Reject.
      const minData = attempt(0.05)
      const minBlob = dataUrlToBlob(minData)
      if (minBlob.size > MAX_BYTES) {
        reject(new Error('Image is too complex to compress below 10 KB at 512×512. Try a simpler image.'))
        return
      }

      // Binary search for highest quality ≤ 10 KB
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
        // Fallback — use the minimum quality attempt we already know fits
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

export function BannerUpload({ value, onChange, userId, error }: BannerUploadProps) {
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

      // Upload to Supabase Storage
      const supabase = createClient()
      const path = `${userId}/${Date.now()}-banner.webp`
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
        Game Banner
      </label>

      {preview ? (
        <div className="relative w-24 h-24 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Banner preview"
            className="w-24 h-24 object-cover border border-neutral-800"
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
              aria-label="Remove banner"
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
          {uploading ? 'Processing…' : 'Upload Banner'}
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
        1:1 square image · auto-resized to 512×512 · converted to WebP ≤ 10 KB
      </p>
    </div>
  )
}
