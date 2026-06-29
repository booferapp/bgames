'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { BannerUpload } from '@/components/dashboard/BannerUpload'
import { CoverUpload } from '@/components/dashboard/CoverUpload'

const CATEGORIES = ['Puzzle', 'Action', 'Arcade', 'Adventure', 'Sports', 'Strategy', 'Casual', 'Other']

interface Game {
  id: string
  title: string
  description: string | null
  game_url: string
  thumbnail_url: string | null
  cover_url: string | null
  category: string | null
  status: string
}

export function EditGameForm({ game }: { game: Game }) {
  const router = useRouter()
  const [title, setTitle] = useState(game.title)
  const [description, setDescription] = useState(game.description ?? '')
  const [category, setCategory] = useState(game.category ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(game.thumbnail_url ?? '')
  const [coverUrl, setCoverUrl] = useState(game.cover_url ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('cloud_games')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        cover_url: coverUrl.trim() || null,
        category: category || null,
        status: 'pending', // Reset to pending on edit
      })
      .eq('id', game.id)

    if (updateError) {
      setError('Failed to save changes. Please try again.')
    } else {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-neutral-600"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
            <BannerUpload
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              userId={userId ?? ''}
            />
            <CoverUpload
              value={coverUrl}
              onChange={setCoverUrl}
              userId={userId ?? ''}
            />

          <div className="bg-neutral-900/50 border border-neutral-800 px-3 py-2">
            <p className="text-xs text-neutral-600">
              Game URL: <span className="text-neutral-400 font-mono">{game.game_url}</span>
            </p>
            <p className="text-xs text-neutral-700 mt-1">To change the game file, re-upload via the Upload page.</p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="border border-red-900 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle size={13} /> {error}
          </p>
        </div>
      )}

      {success && (
        <div className="border border-green-900 bg-green-950/30 px-4 py-3">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <CheckCircle size={13} /> Saved! Game reset to pending review.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
