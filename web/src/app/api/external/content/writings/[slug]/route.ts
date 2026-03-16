import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Writing, WritingApiItem } from '@/lib/writings'
import { excerptFromHtml } from '@/lib/writings'

async function resolveApiKey(
  authHeader: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const rawKey = authHeader.slice(7)
  if (!rawKey) return null

  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('user_id, revoked_at')
    .eq('key_hash', hashHex)
    .single()

  if (!keyRow || keyRow.revoked_at) return null
  return keyRow.user_id as string
}

// GET api.sidequest.me/content/writings/[slug]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const username    = searchParams.get('username')
  const fields      = (searchParams.get('fields') ?? '').split(',').map((f) => f.trim()).filter(Boolean)
  const includeBody = fields.includes('body')

  if (!username) {
    return NextResponse.json({ error: '?username is required' }, { status: 400 })
  }

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single() as { data: { id: string } | null }

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userId = await resolveApiKey(request.headers.get('authorization'), supabase)
  if (!userId) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  if (userId !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // slug === 'latest' — return most recent published post
  let query: any
  if (slug === 'latest') {
    query = (supabase as any)
      .from('writings')
      .select('id, title, slug, tags, word_count, published_at, body_html, image_url, external_url')
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .single()
  } else {
    query = (supabase as any)
      .from('writings')
      .select('id, title, slug, tags, word_count, published_at, body_html, image_url, external_url')
      .eq('user_id', profile.id)
      .eq('slug', slug)
      .in('status', ['published', 'unlisted'])
      .single()
  }

  const { data: w, error } = await query as { data: Partial<Writing> | null; error: unknown }

  if (error || !w) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item: WritingApiItem = {
    id:           w.id!,
    title:        w.title!,
    slug:         w.slug!,
    tags:         w.tags ?? [],
    published_at: w.published_at!,
    word_count:   w.word_count ?? 0,
    excerpt:      w.body_html ? excerptFromHtml(w.body_html, 300) : '',
    image_url:    (w as any).image_url ?? null,
    external_url: (w as any).external_url ?? null,
    ...(includeBody ? { body_html: w.body_html ?? '' } : {}),
  }

  return NextResponse.json({ data: item }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
