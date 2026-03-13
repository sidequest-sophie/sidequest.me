import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { readTimeMinutes } from '@/lib/writings'

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  scheduled: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  unlisted:  'bg-blue-100 text-blue-700',
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  unlisted:  'Unlisted',
}

export default async function AdminWritingsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${username}`)

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single() as { data: { id: string; username: string } | null }

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/${username}`)

  const { data: writings } = await (supabase as any)
    .from('writings')
    .select('id, title, slug, status, tags, word_count, published_at, updated_at')
    .eq('user_id', profile.id)
    .order('updated_at', { ascending: false }) as { data: Partial<Writing>[] | null }

  const rows = writings ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Writings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} {rows.length === 1 ? 'post' : 'posts'}
          </p>
        </div>
        <Link
          href={`/${username}/admin/writings/new`}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          + New post
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No writings yet.</p>
          <p className="text-sm">
            <Link href={`/${username}/admin/writings/new`} className="underline">
              Write your first post →
            </Link>
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {rows.map((w) => (
            <div key={w.id} className="py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[w.status!]}`}
                  >
                    {STATUS_LABEL[w.status!]}
                  </span>
                  {w.tags && w.tags.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {w.tags.join(', ')}
                    </span>
                  )}
                </div>
                <Link
                  href={`/${username}/admin/writings/${w.slug}`}
                  className="font-medium text-gray-900 hover:text-black line-clamp-1"
                >
                  {w.title}
                </Link>
                <p className="text-xs text-gray-400 mt-1">
                  {w.word_count ? `${w.word_count} words · ${readTimeMinutes(w.word_count)} min read · ` : ''}
                  {w.status === 'published' && w.published_at
                    ? `Published ${new Date(w.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `Updated ${new Date(w.updated_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/${username}/admin/writings/${w.slug}`}
                  className="text-xs text-gray-500 hover:text-black px-3 py-1.5 border border-gray-200 rounded-md hover:border-gray-400 transition-colors"
                >
                  Edit
                </Link>
                {w.status === 'published' && (
                  <Link
                    href={`/${username}/writings/${w.slug}`}
                    className="text-xs text-gray-500 hover:text-black px-3 py-1.5 border border-gray-200 rounded-md hover:border-gray-400 transition-colors"
                  >
                    View ↗
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
