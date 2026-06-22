import { getCurrentDeveloper } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { ApiKeyCard } from '@/components/dashboard/ApiKeyCard'
import { Badge } from '@/components/ui/Badge'
import { Shield, User } from 'lucide-react'

export default async function SettingsPage() {
  const data = await getCurrentDeveloper()
  if (!data) return null

  const { profile, developer, user } = data

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your developer account</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User size={14} className="text-neutral-500" />
          <CardTitle>Boofer Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-5">
            {(profile as Record<string, unknown>)?.profile_picture ? (
              <img
                src={String((profile as Record<string, unknown>).profile_picture)}
                alt="Profile Picture"
                className="w-12 h-12 rounded-none object-cover border border-neutral-800"
              />
            ) : (profile as Record<string, unknown>)?.avatar ? (
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-none flex items-center justify-center text-2xl">
                {String((profile as Record<string, unknown>).avatar)}
              </div>
            ) : (
              <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-none flex items-center justify-center text-neutral-600">
                <User size={18} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">
                {String((profile as Record<string, unknown>)?.full_name ?? 'Unknown')}
              </p>
              <p className="text-xs text-neutral-500">
                @{String((profile as Record<string, unknown>)?.handle ?? 'unknown')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900/50 border border-neutral-800 px-3 py-2">
              <p className="text-xs text-neutral-600 mb-0.5">Email</p>
              <p className="text-xs text-neutral-300">{user.email ?? '—'}</p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 px-3 py-2">
              <p className="text-xs text-neutral-600 mb-0.5">Badge</p>
              <p className="text-xs text-neutral-300 capitalize">
                {String((profile as Record<string, unknown>)?.badge_level ?? 'none')}
              </p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 px-3 py-2">
              <p className="text-xs text-neutral-600 mb-0.5">Developer Since</p>
              <p className="text-xs text-neutral-300">{formatDate(String((developer as Record<string, unknown>)?.created_at))}</p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 px-3 py-2">
              <p className="text-xs text-neutral-600 mb-0.5">Games Submitted</p>
              <p className="text-xs text-neutral-300">{String((developer as Record<string, unknown>)?.games_submitted ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <ApiKeyCard apiKey={String((developer as Record<string, unknown>)?.api_key ?? '')} />

      {/* Account Status */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Shield size={14} className="text-neutral-500" />
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {[
              {
                label: 'Validated',
                value: Boolean((profile as Record<string, unknown>)?.is_validated),
                ok: 'Your account is validated.',
                fail: 'Validate your account in the Boofer app.',
              },
              {
                label: 'Verified (Face ID)',
                value: Boolean((profile as Record<string, unknown>)?.is_verified),
                ok: 'Identity verified.',
                fail: 'Complete identity verification in the Boofer app.',
              },
              {
                label: 'Developer Status',
                value: (developer as Record<string, unknown>)?.status === 'active',
                ok: 'Developer account is active.',
                fail: 'Developer account is not active.',
              },
            ].map((check) => (
              <div key={check.label} className="flex items-center justify-between py-2 border-b border-neutral-900 last:border-0">
                <div>
                  <p className="text-sm text-white">{check.label}</p>
                  <p className="text-xs text-neutral-600">{check.value ? check.ok : check.fail}</p>
                </div>
                <Badge variant={check.value ? 'active' : 'rejected'}>
                  {check.value ? 'OK' : 'Missing'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
