import type { LucideIcon } from 'lucide-react'
import { User, Leaf, Laptop, Coffee, Moon, Star } from 'lucide-react'

export interface AvatarPreset {
  id: string
  label: string
  icon: LucideIcon
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'avatar-1', label: 'Person', icon: User },
  { id: 'avatar-2', label: 'Leaf', icon: Leaf },
  { id: 'avatar-3', label: 'Laptop', icon: Laptop },
  { id: 'avatar-4', label: 'Coffee', icon: Coffee },
  { id: 'avatar-5', label: 'Moon', icon: Moon },
  { id: 'avatar-6', label: 'Star', icon: Star },
]

export function getAvatarPresetById(id: string | null | undefined): AvatarPreset | undefined {
  if (!id) return undefined
  return AVATAR_PRESETS.find((p) => p.id === id)
}
