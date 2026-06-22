// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check eligibility before redirecting to dashboard
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_validated, is_verified')
          .eq('id', user.id)
          .single()

        if (!profile?.is_validated) {
          return NextResponse.redirect(`${origin}/?error=BOOFER_NOT_VALIDATED`)
        }
        if (!profile?.is_verified) {
          return NextResponse.redirect(`${origin}/?error=BOOFER_NOT_VERIFIED`)
        }

        const { data: dev } = await supabase
          .from('boofer_developers')
          .select('status')
          .eq('user_id', user.id)
          .single()

        if (!dev) {
          return NextResponse.redirect(`${origin}/?error=BOOFER_NOT_DEVELOPER`)
        }
        if (dev.status !== 'active') {
          return NextResponse.redirect(`${origin}/?error=BOOFER_DEV_SUSPENDED`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=UNKNOWN`)
}
