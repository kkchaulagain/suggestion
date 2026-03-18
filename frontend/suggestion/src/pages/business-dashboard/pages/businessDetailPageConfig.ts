/**
 * Code-configurable CRM business detail layout.
 * Toggle sections or reorder by editing this module.
 */

export type DetailSectionId =
  | 'overview'
  | 'tags'
  | 'customFields'
  | 'notes'
  | 'tasks'
  | 'timeline'

export const BUSINESS_DETAIL_SECTIONS: Array<{
  id: DetailSectionId
  enabled: boolean
  order: number
}> = [
  { id: 'overview', enabled: true, order: 1 },
  { id: 'tags', enabled: true, order: 2 },
  { id: 'customFields', enabled: true, order: 3 },
  { id: 'notes', enabled: true, order: 4 },
  { id: 'tasks', enabled: true, order: 5 },
  { id: 'timeline', enabled: true, order: 6 },
]

export function isSectionEnabled(id: DetailSectionId): boolean {
  const row = BUSINESS_DETAIL_SECTIONS.find((s) => s.id === id)
  return row?.enabled ?? false
}
