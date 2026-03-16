/**
 * Placeholder image used when no image URL is set (image block, hero, etc.).
 * Uses placehold.co so the block summary stays short and the image loads from a stable URL.
 */
const PLACEHOLDER_WIDTH = 800
const PLACEHOLDER_HEIGHT = 600

export const PLACEHOLDER_IMAGE_URL = `https://placehold.co/${PLACEHOLDER_WIDTH}x${PLACEHOLDER_HEIGHT}/f5f5f4/a8a29e?text=Image+placeholder`

/** Returns the image URL to display: real URL or placeholder when empty. */
export function imageDisplayUrl(url: string | undefined): string {
  const trimmed = url?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : PLACEHOLDER_IMAGE_URL
}
