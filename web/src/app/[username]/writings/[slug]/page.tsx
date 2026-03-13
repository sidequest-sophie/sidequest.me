import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Writing } from '@/lib/writings'
import { readTimeMinutes, excerptFromHtml } from '@/lib/writings'
import { slugify } from '@/lib/tags'
import type { SiteTag } from '@/lib/tags'

interface Props {
  params: Promise<{ username: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single() as { data: { id: string } | null }

  if (!profile) return {}

  const { data: w } = await (supabase as any)
    .from('writings')
    .select('title, body_html, canonical_url, tags')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .single() as { data: Partial<Writing> | null }

  if (!w) return {}

  const description = w.body_html ? excerptFromHtml(w.body_html, 160) : undefined

  return {
    title: w.title,
    description,
    alternates: w.canonical_url ? { canonical: w.canonical_url } : undefined,
    openGraph: {
      title: w.title ?? undefined,
      description,
      type: 'article',
      authors: [username],
    },
  }
}

export default async function WritingPostPage({ params }: Props) {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, site_tags')
    .eq('username', username)
    .single() as { data: { id: string; username: string; site_tags: unknown } | null }

  if (!profile) notFound()

  const isOwner = user?.id === profile.id

  // Owner can see any status; public only sees published
  let query = (supabase as any)
    .from('writings')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)

  if (!isOwner) query = query.eq('status', 'published')

  const { data: writing } = await query.single() as { data: Writing | null }

  if (!writing) notFound()

  const siteTags = ((profile as any).site_tags ?? []) as SiteTag[]
  const readTime = readTimeMinutes(writing.word_count)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
        <Link href={`/${username}`} className="hover:text-gray-700">{username}</Link>
        <span>/</span>
        <Link href={`/${username}/writings`} className="hover:text-gray-700">writings</Link>
        {writing.status !== 'published' && (
          <>
            <span>/</span>
            <span className="text-yellow-600 font-medium">{writing.status}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
          {writing.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          {writing.published_at && (
            <time dateTime={writing.published_at}>
              {new Date(writing.published_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </time>
          )}
          <span>·</span>
          <span>{readTime} min read</span>
          <span>·</span>
          <span>{writing.word_count.toLocaleString()} words</span>
        </div>
        {writing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {writing.tags.map((tag) => {
              const siteTag = siteTags.find((st) => st.label === tag)
              return (
                <Link
                  key={tag}
                  href={
                    siteTag
                      ? `/${username}/writings/tags/${slugify(tag)}`
                      : `/${username}/writings?q=${encodeURIComponent(tag)}`
                  }
                  className="text-xs text-gray-400 border border-gray-200 px-2.5 py-1 rounded-full hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  {tag}
                </Link>
              )
            })}
          </div>
        )}
      </header>

      {/* Body */}
      <article
        className="prose prose-gray max-w-none
          prose-headings:font-semibold
          prose-a:text-inherit prose-a:underline prose-a:underline-offset-2
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-900 prose-pre:text-gray-100
          prose-blockquote:border-gray-300 prose-blockquote:text-gray-500"
        dangerouslySetInnerHTML={{ __html: writing.body_html ?? '' }}
      />

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-100">
        <Link
          href={`/${username}/writings`}
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← All writings
        </Link>

        {isOwner && (
          <Link
            href={`/${username}/admin/writings/${slug}`}
            className="ml-6 text-sm text-gray-400 hover:text-gray-700"
          >
            Edit post →
          </Link>
        )}
      </footer>
    </div>
  )
}
