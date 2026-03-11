/**
 * Reusable avatar component — shows profile image or initial-letter fallback.
 * Used in Nav dropdown and profile pages.
 * [SQ.S-W-2603-0034]
 */

interface AvatarProps {
  /** Display name — first letter used as fallback */
  displayName: string | null;
  /** URL to avatar image, if any */
  avatarUrl: string | null;
  /** Size in pixels (width & height) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pick a deterministic background colour from the site palette based on a string.
 * Always returns the same colour for the same input.
 */
const PALETTE = ["#ff6b35", "#00d4aa", "#ff69b4", "#4d9fff", "#ffd23f", "#c4a8ff"];

function colourForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({
  displayName,
  avatarUrl,
  size = 36,
  className = "",
}: AvatarProps) {
  const initial = (displayName ?? "?").charAt(0).toUpperCase();
  const bgColour = colourForName(displayName ?? "?");

  // Font size scales with avatar size
  const fontSize = Math.round(size * 0.44);

  if (avatarUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={avatarUrl}
        alt={displayName ?? "Avatar"}
        width={size}
        height={size}
        className={`rounded-full border-3 border-ink object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full border-3 border-ink flex items-center justify-center font-head font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColour,
        fontSize,
        lineHeight: 1,
      }}
      aria-label={displayName ?? "Avatar"}
    >
      {initial}
    </div>
  );
}
