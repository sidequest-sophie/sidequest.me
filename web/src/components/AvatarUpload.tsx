"use client";

/**
 * Avatar upload widget — shows current avatar with a click-to-change overlay.
 * Handles file selection, upload to Supabase Storage, and returns the public URL.
 * [SQ.S-W-2603-0034]
 */

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "./Avatar";

interface AvatarUploadProps {
  userId: string;
  displayName: string | null;
  currentAvatarUrl: string | null;
  onUploaded: (url: string) => void;
}

export default function AvatarUpload({
  userId,
  displayName,
  currentAvatarUrl,
  onUploaded,
}: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? currentAvatarUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB");
      return;
    }

    setError(null);
    setUploading(true);

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${userId}/avatars/avatar.${ext}`;

      // Upload (upsert to replace existing)
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        setPreviewUrl(null);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      // Append cache-buster so the browser doesn't serve stale avatar
      const freshUrl = `${publicUrl}?t=${Date.now()}`;
      setPreviewUrl(freshUrl);
      onUploaded(freshUrl);
    } catch {
      setError("Upload failed — please try again");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative group cursor-pointer bg-transparent border-0 p-0"
        title="Click to change avatar"
      >
        <Avatar
          displayName={displayName}
          avatarUrl={displayUrl}
          size={96}
          className="transition-opacity group-hover:opacity-70"
        />
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-ink/30">
          <span className="font-mono text-[0.65rem] text-white font-bold uppercase">
            {uploading ? "Uploading…" : "Change"}
          </span>
        </div>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="font-mono text-[0.68rem] opacity-50">
        Click to upload · Max 2 MB
      </p>

      {error && (
        <p className="font-mono text-[0.72rem] text-red-600">{error}</p>
      )}
    </div>
  );
}
