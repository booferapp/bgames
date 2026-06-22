import { getCurrentDeveloper } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Gamepad2, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { GamesChart } from '@/components/dashboard/GamesChart'

async function getDashboardStats(developerId: string) {
  const supabase = await createClient()
  const { data: games } = await supabase
    .from('cloud_games')
    .select('id, title, status, created_at, category')
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false })

  const all = games ?? []
  return {
    total: all.length,
    active: all.filter(g => g.status === 'active').length,
    pending: all.filter(g => g.status === 'pending').length,
    rejected: all.filter(g => g.status === 'rejected').length,
    recent: all.slice(0, 5),
    all,
  }
}

export default async function DashboardPage() {
  const data = await getCurrentDeveloper()
  if (!data) return null

  const { profile, developer } = data
  const stats = await getDashboardStats(developer!.id)

  const statCards = [
    { label: 'Total Games', value: stats.total, icon: Gamepad2, color: 'text-white' },
    { label: 'Live', value: stats.active, icon: CheckCircle, color: 'text-green-500' },
    { label: 'In Review', value: stats.pending, icon: Clock, color: 'text-amber-500' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500' },
  ]

  return (
    <div className="max-w-5xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Good {getTimeOfDay()}, {(profile as Record<string, unknown>)?.handle as string ?? 'Developer'}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Developer since {formatDate((developer as Record<string, unknown>)?.created_at as string)}
          {Boolean((developer as Record<string, unknown>)?.api_key) && (
            <span className="ml-3 text-neutral-700 font-mono text-xs">
              API: {String((developer as Record<string, unknown>).api_key).slice(0, 8)}...
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-neutral-600 uppercase tracking-wider">{stat.label}</span>
                <stat.icon size={14} className={stat.color} />
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submissions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <GamesChart games={stats.all} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Games</CardTitle>
            <Link href="/dashboard/games" className="text-xs text-neutral-500 hover:text-white">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {stats.recent.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-neutral-600">No games yet.</p>
                <Link
                  href="/dashboard/games/upload"
                  className="text-xs text-white underline underline-offset-2 mt-2 block"
                >
                  Upload your first game
                </Link>
              </div>
            ) : (
              <div>
                {stats.recent.map((game, i) => (
                  <Link
                    key={game.id}
                    href={`/dashboard/games/${game.id}`}
                    className={`flex items-center justify-between px-5 py-3 hover:bg-neutral-900 ${
                      i < stats.recent.length - 1 ? 'border-b border-neutral-900' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm text-white truncate max-w-[120px]">{game.title}</p>
                      <p className="text-xs text-neutral-600">{formatDate(game.created_at)}</p>
                    </div>
                    <Badge variant={game.status as 'active' | 'pending' | 'rejected' | 'default'}>
                      {game.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
