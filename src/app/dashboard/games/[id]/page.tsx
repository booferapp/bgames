import { createClient } from '@/lib/supabase/server'
import { getCurrentDeveloper } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { EditGameForm } from '@/components/dashboard/EditGameForm'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params
  const devData = await getCurrentDeveloper()
  if (!devData) return notFound()

  const supabase = await createClient()
  const { data: game } = await supabase
    .from('cloud_games')
    .select('*')
    .eq('id', id)
    .eq('developer_id', devData.developer!.id)
    .single()

  if (!game) return notFound()

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/games"
        className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-white mb-6"
      >
        <ChevronLeft size={13} />
        Back to Games
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{game.title}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Submitted {formatDate(game.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={game.status as 'active' | 'pending' | 'rejected' | 'default'}>
            {game.status}
          </Badge>
          {game.game_url && (
            <a
              href={game.game_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 border border-neutral-800 text-neutral-600 hover:text-white hover:border-neutral-600"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {game.rejection_reason && (
        <div className="border border-red-900 bg-red-950/30 px-4 py-3 mb-5">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
          <p className="text-sm text-red-400">{game.rejection_reason}</p>
        </div>
      )}

      <EditGameForm game={game} />
    </div>
  )
}
