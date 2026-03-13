// /[username]/writings/tags/[tag] — delegates to the writings index with ?tag= param
// We re-render WritingsIndexPage directly rather than redirecting, keeping clean URLs.
import WritingsIndexPage from '../../page'

export default async function WritingsTagPage({
  params,
}: {
  params: Promise<{ username: string; tag: string }>
}) {
  const { username, tag } = await params
  return WritingsIndexPage({
    params: Promise.resolve({ username }),
    searchParams: Promise.resolve({ tag }),
  })
}
