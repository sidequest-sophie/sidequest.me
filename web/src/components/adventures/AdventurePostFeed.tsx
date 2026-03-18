'use client'

import { useState, useEffect, useRef } from 'react'
import type { AdventurePost, PostType } from '@/lib/adventures'

interface AdventurePostFeedProps {
  adventureId: string
}

const POST_TYPE_LABELS: Record<PostType, { icon: string; label: string }> = {
  micro: { icon: '💬', label: 'Quick post' },
  photo: { icon: '📸', label: 'Photos' },
  checkin: { icon: '📍', label: 'Check-in' },
  article_link: { icon: '📝', label: 'Link writing' },
}

export default function AdventurePostFeed({ adventureId }: AdventurePostFeedProps) {
  const [posts, setPosts] = useState<AdventurePost[]>([])
  const [loading, setLoading] = useState(true)

  // Composer state
  const [composerType, setComposerType] = useState<PostType>('micro')
  const [composerOpen, setComposerOpen] = useState(false)
  const [body, setBody] = useState('')
  const [locationName, setLocationName] = useState('')
  const [photos, setPhotos] = useState<{ url: string; caption?: string }[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = () => {
    fetch(`/api/adventure-posts?adventure_id=${adventureId}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [adventureId])

  const handlePhotoUpload = async (files: FileList) => {
    const newPhotos = [...photos]
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const form = new FormData()
      form.append('file', file)
      form.append('context', 'adventures')
      form.append('entityId', adventureId)
      try {
        const res = await fetch('/api/upload-image', { method: 'POST', body: form })
        if (res.ok) {
          const { url } = await res.json() as { url: string }
          newPhotos.push({ url })
        }
      } catch { /* skip failed uploads */ }
    }
    setPhotos(newPhotos)
  }

  const handlePost = async () => {
    if (composerType === 'micro' && !body.trim()) return
    if (composerType === 'photo' && photos.length === 0) return
    if (composerType === 'checkin' && !locationName.trim()) return

    setPosting(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        adventure_id: adventureId,
        post_type: composerType,
        body: body.trim() || null,
        location_name: locationName.trim() || null,
        photos: composerType === 'photo' ? photos : [],
      }

      const res = await fetch('/api/adventure-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({ error: 'Post failed' }))
        setError(e)
        return
      }

      // Reset composer
      setBody('')
      setLocationName('')
      setPhotos([])
      setComposerOpen(false)
      fetchPosts()
    } catch {
      setError('Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    const res = await fetch(`/api/adventure-posts/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    }
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' · '
      + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="mt-10 border-t-3 border-ink pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-head font-[900] text-[1rem] uppercase">
          Posts ({posts.length})
        </h3>
        {!composerOpen && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="px-4 py-1.5 border-3 border-ink bg-bg-card font-head font-bold text-[0.68rem] uppercase hover:bg-ink hover:text-bg transition-colors cursor-pointer"
          >
            + Add post
          </button>
        )}
      </div>

      {/* ── Composer ── */}
      {composerOpen && (
        <div className="mb-8 border-3 border-ink p-4 bg-bg-card">
          {/* Post type selector */}
          <div className="flex gap-2 mb-4">
            {(['micro', 'photo', 'checkin'] as PostType[]).map((pt) => {
              const meta = POST_TYPE_LABELS[pt]
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setComposerType(pt)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase border-2 transition-all cursor-pointer ${
                    composerType === pt
                      ? 'border-ink bg-ink text-bg'
                      : 'border-ink/30 bg-bg hover:border-ink/60'
                  }`}
                >
                  {meta.icon} {meta.label}
                </button>
              )
            })}
          </div>

          {/* Body text (for micro and photo captions) */}
          {(composerType === 'micro' || composerType === 'photo') && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={composerType === 'micro' ? "What's happening?" : 'Caption (optional)'}
              rows={composerType === 'micro' ? 3 : 2}
              className="w-full px-3 py-2 border-3 border-ink bg-bg font-body text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow resize-y mb-3"
            />
          )}

          {/* Photo upload */}
          {composerType === 'photo' && (
            <div className="mb-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handlePhotoUpload(e.target.files)
                  e.target.value = ''
                }}
              />
              {photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 border-2 border-ink overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-0 right-0 bg-black/60 text-white text-[9px] w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 border-2 border-dashed border-ink/30 font-mono text-[0.65rem] text-ink-muted hover:border-ink/60 cursor-pointer transition-colors"
              >
                📸 Add photos
              </button>
            </div>
          )}

          {/* Location (for check-ins, optional for others) */}
          {composerType === 'checkin' && (
            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="📍 Location name (e.g. Black Rock City)"
              className="w-full px-3 py-2 border-3 border-ink bg-bg font-mono text-[0.82rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow mb-3"
            />
          )}

          {/* Optional location for micro/photo posts */}
          {composerType !== 'checkin' && (
            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="📍 Location (optional)"
              className="w-full px-3 py-2 border-2 border-ink/20 bg-bg font-mono text-[0.75rem] focus:outline-none focus:border-ink/50 transition-colors mb-3"
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePost}
              disabled={posting}
              className="px-5 py-2 bg-ink text-bg font-head font-bold text-[0.72rem] uppercase border-3 border-ink hover:bg-orange hover:border-orange transition-colors disabled:opacity-40 cursor-pointer"
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
            <button
              type="button"
              onClick={() => { setComposerOpen(false); setBody(''); setPhotos([]); setLocationName(''); setError(null) }}
              className="font-mono text-[0.68rem] text-ink-muted hover:text-ink cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && <p className="mt-2 font-mono text-[0.72rem] text-red-500">{error}</p>}
        </div>
      )}

      {/* ── Post feed ── */}
      {loading ? (
        <p className="font-mono text-[0.78rem] opacity-40">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="font-mono text-[0.78rem] opacity-40 text-center py-8">
          No posts yet. Add your first update to this adventure.
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const meta = POST_TYPE_LABELS[post.post_type as PostType] ?? POST_TYPE_LABELS.micro
            return (
              <div key={post.id} className="border-3 border-ink/20 p-4 bg-bg-card group">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.6rem] font-bold uppercase text-ink-muted">
                      {meta.icon} {meta.label}
                    </span>
                    {post.location_name && (
                      <span className="font-mono text-[0.6rem] text-orange">
                        📍 {post.location_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.55rem] text-ink-muted">
                      {formatDate(post.posted_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="font-mono text-[0.55rem] text-ink-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Body */}
                {post.body && (
                  <p className="text-[0.88rem] leading-relaxed mb-2">{post.body}</p>
                )}

                {/* Photos */}
                {post.photos && (post.photos as { url: string }[]).length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {(post.photos as { url: string; caption?: string }[]).map((photo, i) => (
                      <div key={i} className="w-24 h-24 border-2 border-ink/10 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
