import { UserCircle } from 'lucide-react'

export type AvatarSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

const iconSizes: Record<AvatarSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export interface AvatarProps {
  /** Image URL. When provided, renders an img; otherwise shows fallback. */
  src?: string | null
  /** Optional name for initials fallback (e.g. "Jane Doe" → "JD"). Not used when src is provided. */
  name?: string | null
  size?: AvatarSize
  /** Accessible description of the avatar (e.g. "Profile photo"). */
  alt?: string
  className?: string
}

/**
 * Reusable avatar: image, initials, or icon fallback.
 * Use for profile pictures and consistent user representation across the app.
 */
export default function Avatar({ src, name, size = 'md', alt = 'User avatar', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  const baseClass =
    'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm text-white'

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} ${baseClass} object-cover ${className}`}
      />
    )
  }

  const initials = name
    ?.trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (initials) {
    return (
      <div
        className={`${sizeClass} ${baseClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm font-semibold" style={{ fontSize: size === 'lg' ? '1.25rem' : size === 'md' ? '0.875rem' : '0.75rem' }}>
          {initials}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} ${baseClass} ${className}`}
      role="img"
      aria-label={alt}
    >
      <UserCircle className={iconSize} />
    </div>
  )
}
