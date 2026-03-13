import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''

  // Route api.sidequest.me/* → /api/external/*
  // Matches both production (api.sidequest.me) and local dev (api.localhost:3000)
  if (hostname.startsWith('api.')) {
    const pathname = request.nextUrl.pathname
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/api/external${pathname}`
    return NextResponse.rewrite(rewriteUrl)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
