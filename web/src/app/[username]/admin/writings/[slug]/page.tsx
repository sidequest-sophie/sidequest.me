import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WritingEditorForm from '@/components/writings/WritingEditorForm'
import { DEFAULT_SITE_TAGS } from '@/lib/tags'
import type { Writing } from '@/lib/writings'

export default async function EditWritingPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${username}`)

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, username, site_tags')
    .eq('username', username)
    .single() as { data: { id: string; username: string; site_tags: unknown } | null }

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/${username}`)

  const { data: writing } = await (supabase as any)
    .from('writings')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single() as { data: Writing | null }

  if (!writing) notFound()

  const siteTags = ((profile as any).site_tags ?? DEFAULT_SITE_TAGS) as Array<{ label: string }>
  const tagLabels = siteTags.map((t) => t.label)

  return (
    <WritingEditorForm
      username={username}
      writing={writing}
      availableTags={tagLabels}
    />
  )
}
