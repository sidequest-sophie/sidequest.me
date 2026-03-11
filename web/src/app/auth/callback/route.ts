import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? null

  const forwardedHost = request.headers.get('x-forwarded-host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const host = forwardedHost || request.headers.get('host')
  const base = `${proto}://${host}`

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Explicit next path (e.g. reset-password) takes priority
      if (next) {
        return NextResponse.redirect(`${base}${next}`)
      }

      // New users (onboarding_complete === false) go to onboarding
      const onboardingComplete = data.user?.user_metadata?.onboarding_complete
      if (onboardingComplete === false) {
        return NextResponse.redirect(`${base}/onboarding`)
      }

      // Default: redirect to own profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data: profile } = await db
        .from('profiles')
        .select('username')
        .eq('id', data.user!.id)
        .single()

      const dest = profile?.username ? `/${profile.username}` : '/'
      return NextResponse.redirect(`${base}${dest}`)
    }
  }

  // Error — send to error page
  return NextResponse.redirect(new URL('/auth/error', request.url))
}
