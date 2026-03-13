import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WritingEditorForm from '@/components/writings/WritingEditorForm'
import { DEFAULT_SITE_TAGS } from '@/lib/tags'

export default async function NewWritingPage({
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
    .select('id, username, site_tags')
    .eq('username', username)
    .single() as { data: { id: string; username: string; site_tags: unknown } | null }

  if (!profile) notFound()
  if (profile.id !== user.id) redirect(`/${username}`)

  const siteTags = ((profile as any).site_tags ?? DEFAULT_SITE_TAGS) as Array<{ label: string }>
  const tagLabels = siteTags.map((t) => t.label)

  return <WritingEditorForm username={username} availableTags={tagLabels} />
}
