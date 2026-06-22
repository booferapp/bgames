'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMemo } from 'react'
import { formatDate } from '@/lib/utils'

interface Game {
  id: string
  status: string
  created_at: string
}

function buildMonthlyData(games: Game[]) {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('default', { month: 'short' })
    months[key] = 0
  }
  games.forEach((g) => {
    const d = new Date(g.created_at)
    const key = d.toLocaleString('default', { month: 'short' })
    if (key in months) months[key]++
  })
  return Object.entries(months).map(([name, count]) => ({ name, count }))
}

interface GamesChartProps {
  games: Game[]
}

export function GamesChart({ games }: GamesChartProps) {
  const data = useMemo(() => buildMonthlyData(games), [games])

  if (games.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-neutral-700">
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} barSize={14}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#525252', fontSize: 11 }}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: 0,
            fontSize: 12,
            color: '#fff',
          }}
          labelStyle={{ color: '#737373' }}
        />
        <Bar dataKey="count" fill="#fff" radius={0}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.count > 0 ? '#fff' : '#1a1a1a'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
