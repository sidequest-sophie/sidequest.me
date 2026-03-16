import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Writing, WritingApiItem, WritingApiResponse } from '@/lib/writings'
import { excerptFromHtml } from '@/lib/writings'

const PER_PAGE_DEFAULT = 20
const PER_PAGE_MAX     = 100

interface ApiKeyResult {
  user_id: string
  scope: { entity_type: string; entity_id: string } | null
}

async function resolveApiKey(
  authHeader: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<ApiKeyResult | null> {
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
    .select('user_id, revoked_at, scope')
    .eq('key_hash', hashHex)
    .single()

  if (!keyRow || keyRow.revoked_at) return null

  // Touch last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hashHex)
    .then(() => {})

  return { user_id: keyRow.user_id as string, scope: keyRow.scope ?? null }
}

// GET api.sidequest.me/content/writings
// (internally: /api/external/content/writings)
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const username  = searchParams.get('username')
  const tag       = searchParams.get('tag')
  const company   = searchParams.get('company')    // company slug filter
  const status    = searchParams.get('status') ?? 'published'
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage   = Math.min(PER_PAGE_MAX,
    Math.max(1, parseInt(searchParams.get('per_page') ?? String(PER_PAGE_DEFAULT), 10)))
  const fields    = (searchParams.get('fields') ?? '').split(',').map((f) => f.trim()).filter(Boolean)
  const includeBody = fields.includes('body')
  const searchQ   = searchParams.get('q')

  if (!username) {
    return NextResponse.json({ error: '?username is required' }, { status: 400 })
  }

  // Resolve profile
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single() as { data: { id: string } | null }

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Validate API key
  const keyResult = await resolveApiKey(request.headers.get('authorization'), supabase)
  if (!keyResult) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  }
  if (keyResult.user_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Validate status param
  const allowedStatuses = ['published', 'unlisted', 'all']
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: `?status must be one of: ${allowedStatuses.join(', ')}` }, { status: 400 })
  }

  // ── Scope enforcement ──
  // If the API key has a scope, only return writings linked to that entity.
  // The ?company param is also supported for unscoped keys.
  let scopedWritingIds: string[] | null = null

  // Determine the entity filter (scope takes priority, then ?company param)
  let entityFilter: { entity_type: string; entity_id: string } | null = keyResult.scope

  if (!entityFilter && company) {
    // Resolve company slug to ID
    const { data: companyRow } = await (supabase as any)
      .from('companies')
      .select('id')
      .eq('user_id', profile.id)
      .eq('slug', company)
      .single() as { data: { id: string } | null }

    if (!companyRow) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    entityFilter = { entity_type: 'company', entity_id: companyRow.id }
  }

  if (entityFilter) {
    const { data: links } = await (supabase as any)
      .from('writing_links')
      .select('writing_id')
      .eq('entity_type', entityFilter.entity_type)
      .eq('entity_id', entityFilter.entity_id) as { data: Array<{ writing_id: string }> | null }

    scopedWritingIds = (links ?? []).map((l) => l.writing_id)

    // If no writings are linked, return empty result immediately
    if (scopedWritingIds.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { total: 0, page, per_page: perPage, total_pages: 0 },
      } satisfies WritingApiResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }

  // Build query — always fetch body_html (for excerpt), image_url, external_url
  const selectFields = 'id, title, slug, tags, word_count, published_at, body_html, image_url, external_url'

  let query = (supabase as any)
    .from('writings')
    .select(selectFields, { count: 'exact' })
    .eq('user_id', profile.id)
    .order('published_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (status === 'published') {
    query = query.eq('status', 'published')
  } else if (status === 'unlisted') {
    query = query.in('status', ['published', 'unlisted'])
  }

  // Apply scope filter
  if (scopedWritingIds) {
    query = query.in('id', scopedWritingIds)
  }

  if (tag) query = query.contains('tags', [tag])
  if (searchQ) query = query.textSearch('fts', searchQ, { type: 'websearch' })

  const { data: writings, count, error } = await query as {
    data: Partial<Writing>[] | null
    count: number | null
    error: unknown
  }

  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  const rows = writings ?? []
  const total = count ?? 0

  const items: WritingApiItem[] = rows.map((w) => ({
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
  }))

  const response: WritingApiResponse = {
    data: items,
    meta: {
      total,
      page,
      per_page:    perPage,
      total_pages: Math.ceil(total / perPage),
    },
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
