import { createClient } from '@/lib/supabase/server'
import { BooferErrorCode } from '@/lib/errors'

export interface EligibilityResult {
  eligible: boolean
  errorCode?: BooferErrorCode
  profile?: Record<string, unknown>
  developer?: Record<string, unknown>
}

export async function checkDeveloperEligibility(): Promise<EligibilityResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { eligible: false, errorCode: 'BOOFER_UNAUTHENTICATED' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, full_name, avatar, profile_picture, is_verified, is_validated, badge_level')
    .eq('id', user.id)
    .single()

  if (!profile) return { eligible: false, errorCode: 'BOOFER_UNAUTHENTICATED' }

  if (!profile.is_validated) return { eligible: false, errorCode: 'BOOFER_NOT_VALIDATED', profile }
  if (!profile.is_verified) return { eligible: false, errorCode: 'BOOFER_NOT_VERIFIED', profile }

  const { data: developer } = await supabase
    .from('boofer_developers')
    .select('id, user_id, api_key, status, games_submitted, created_at')
    .eq('user_id', user.id)
    .single()

  if (!developer) return { eligible: false, errorCode: 'BOOFER_NOT_DEVELOPER', profile }
  if (developer.status !== 'active') return { eligible: false, errorCode: 'BOOFER_DEV_SUSPENDED', profile, developer }

  return { eligible: true, profile, developer }
}

export async function getCurrentDeveloper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, devRes] = await Promise.all([
    supabase.from('profiles')
      .select('id, handle, full_name, avatar, profile_picture, is_verified, is_validated, badge_level, follower_count')
      .eq('id', user.id)
      .single(),
    supabase.from('boofer_developers')
      .select('id, api_key, status, games_submitted, created_at')
      .eq('user_id', user.id)
      .single(),
  ])

  return { user, profile: profileRes.data, developer: devRes.data }
}
