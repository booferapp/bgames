import { getCurrentDeveloper } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function GamesPage() {
  const data = await getCurrentDeveloper()
  if (!data) return null

  const supabase = await createClient()
  const { data: games } = await supabase
    .from('cloud_games')
    .select('*')
    .eq('developer_id', data.developer!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Games</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{games?.length ?? 0} game{games?.length !== 1 ? 's' : ''} submitted</p>
        </div>
        <Link href="/dashboard/games/upload">
          <Button size="sm">
            <Plus size={14} />
            Upload Game
          </Button>
        </Link>
      </div>

      {!games || games.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <p className="text-sm text-white font-medium mb-1">No games yet</p>
            <p className="text-sm text-neutral-600 mb-4">Upload your first HTML5 game to the Boofer platform.</p>
            <Link href="/dashboard/games/upload">
              <Button size="sm">Upload your first game</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-0 border border-neutral-900">
          {games.map((game, i) => (
            <div
              key={game.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-neutral-950 ${
                i < games.length - 1 ? 'border-b border-neutral-900' : ''
              }`}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 flex-shrink-0 overflow-hidden">
                {game.thumbnail_url ? (
                  <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-700 text-lg">🎮</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{game.title}</p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  {game.category && <span className="mr-2">{game.category}</span>}
                  {formatDate(game.created_at)}
                </p>
              </div>

              {/* Status */}
              <Badge variant={game.status as 'active' | 'pending' | 'rejected' | 'default'}>
                {game.status}
              </Badge>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/games/${game.id}`}
                  className="text-xs text-neutral-500 hover:text-white px-2 py-1 border border-neutral-800 hover:border-neutral-600"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
