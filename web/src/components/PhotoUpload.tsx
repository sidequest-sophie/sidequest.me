'use client'

import { useState, useRef } from 'react'

type PhotoUploadProps = {
  onUploaded?: () => void
}

export default function PhotoUpload({ onUploaded }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    // Max 10 files
    const limited = selected.slice(0, 10)
    setFiles(limited)
    setError(null)
    setSuccess(false)

    // Generate previews
    const urls = limited.map(f => URL.createObjectURL(f))
    setPreviews(prev => {
      prev.forEach(u => URL.revokeObjectURL(u))
      return urls
    })
  }

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setFiles(f => f.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      if (caption.trim()) formData.append('caption', caption.trim())
      if (tags.trim()) formData.append('tags', tags.trim())

      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Upload failed')
        return
      }

      setSuccess(true)
      setFiles([])
      setPreviews(p => { p.forEach(u => URL.revokeObjectURL(u)); return [] })
      setCaption('')
      setTags('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      onUploaded?.()
    } catch {
      setError('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-3 border-ink bg-bg p-6 mb-6" style={{ boxShadow: '4px 4px 0 var(--ink)' }}>
      <h2 className="font-head font-bold text-[0.9rem] uppercase mb-4">Add Photos</h2>

      {/* File drop area */}
      <label className="block border-3 border-dashed border-ink/30 p-6 text-center cursor-pointer hover:border-ink/60 transition-colors mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <span className="font-head font-bold text-[1.5rem] block mb-1">+</span>
        <span className="font-mono text-[0.75rem] opacity-50">
          Click to select photos (max 10, 10MB each)
        </span>
      </label>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {previews.map((url, i) => (
            <div key={url} className="relative aspect-square border-2 border-ink overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-ink text-bg font-mono text-[0.6rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Caption */}
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        rows={2}
        className="w-full px-3 py-2 border-3 border-ink bg-white font-body text-[0.85rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow resize-none mb-3"
      />

      {/* Tags */}
      <input
        type="text"
        value={tags}
        onChange={e => setTags(e.target.value)}
        placeholder="Tags (comma-separated, e.g. cats, travel)"
        className="w-full px-3 py-2 border-3 border-ink bg-white font-mono text-[0.78rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow mb-4"
      />

      {error && (
        <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-600 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="border-3 border-green-500 bg-green-50 p-3 font-mono text-[0.78rem] text-green-700 mb-4">
          Photos uploaded successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={files.length === 0 || uploading}
        className="w-full py-2.5 px-4 bg-ink text-bg font-head font-bold text-[0.82rem] uppercase border-3 border-ink hover:bg-transparent hover:text-ink transition-colors disabled:opacity-40 cursor-pointer"
      >
        {uploading ? 'Uploading…' : `Upload ${files.length > 0 ? files.length : ''} Photo${files.length !== 1 ? 's' : ''}`}
      </button>
    </form>
  )
}
