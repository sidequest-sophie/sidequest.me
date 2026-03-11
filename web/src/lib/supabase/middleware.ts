import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication (regex patterns)
const PROTECTED_PATTERNS = [
  /^\/[^/]+\/settings(\/.*)?$/,  // /[username]/settings/*
  /^\/onboarding$/,              // /onboarding
  /^\/reset-password$/,          // /reset-password (needs recovery session)
]

// Auth routes — redirect already-authenticated users away
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect routes that require authentication
  const isProtected = PROTECTED_PATTERNS.some(p => p.test(pathname))
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and onboarding not complete → force to /onboarding
  // (unless already on /onboarding to prevent redirect loop)
  if (user && pathname !== '/onboarding') {
    const onboardingComplete = user.user_metadata?.onboarding_complete
    if (onboardingComplete === false) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Redirect already-authenticated (and onboarded) users away from auth routes
  if (AUTH_ROUTES.includes(pathname) && user) {
    const onboardingComplete = user.user_metadata?.onboarding_complete
    // Don't redirect if they still need onboarding — they'll be caught above on next request
    if (onboardingComplete !== false) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data: profile } = await db
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      const target = profile?.username ? `/${profile.username}` : '/'
      return NextResponse.redirect(new URL(target, request.url))
    }
  }

  return supabaseResponse
}
