'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PhotoUpload from './PhotoUpload'

type Props = {
  profileUserId: string
}

/**
 * Shows the photo upload form only if the current viewer is the profile owner.
 */
export default function PhotowallOwnerUpload({ profileUserId }: Props) {
  const [isOwner, setIsOwner] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsOwner(user?.id === profileUserId)
      setChecked(true)
    }
    check()
  }, [profileUserId])

  if (!checked || !isOwner) return null

  return (
    <PhotoUpload
      onUploaded={() => {
        // Reload page to show new photos
        window.location.reload()
      }}
    />
  )
}
