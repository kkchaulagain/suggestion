/** Note/task/activity timestamps on business detail — extracted for tests. */

export function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export const timeAgoDeps = {
  formatLongAgo: (iso: string) => formatDate(iso),
}

export function timeAgo(iso?: string) {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return timeAgoDeps.formatLongAgo(iso)
  } catch {
    return iso ?? '—'
  }
}
