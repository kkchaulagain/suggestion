import { useEffect, useRef } from 'react'

const DEFAULT_TITLE = 'Form'
const DEFAULT_DESCRIPTION = 'Share your feedback.'

export interface FormPageSEOOptions {
  /** Page title (e.g. form title). Used for <title> and og:title */
  title?: string | null
  /** Meta description. Used for description and og:description */
  description?: string | null
  /** Site/app name for title suffix and branding */
  siteName?: string
  /** Canonical URL for the form (optional, for og:url) */
  canonicalUrl?: string | null
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(name: string, attribute: 'name' | 'property' = 'name') {
  const el = document.querySelector(`meta[${attribute}="${name}"]`)
  if (el) el.remove()
}

/**
 * Sets document title and meta tags for the form render page (SEO + social sharing).
 * Restores previous title on cleanup.
 */
export function useFormPageSEO(options: FormPageSEOOptions) {
  const { title, description, siteName, canonicalUrl } = options
  const previousTitleRef = useRef<string | null>(null)

  useEffect(() => {
    previousTitleRef.current = document.title

    const pageTitle = title?.trim() || DEFAULT_TITLE
    const site = siteName?.trim()
    const fullTitle = site ? `${pageTitle} | ${site}` : pageTitle
    document.title = fullTitle

    const desc = (description?.trim() || DEFAULT_DESCRIPTION).slice(0, 160)
    setMeta('description', desc)
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', desc, 'property')
    if (canonicalUrl?.trim()) {
      setMeta('og:url', canonicalUrl.trim(), 'property')
    }

    return () => {
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current
      }
      removeMeta('description')
      removeMeta('og:title', 'property')
      removeMeta('og:description', 'property')
      removeMeta('og:url', 'property')
    }
  }, [title, description, siteName, canonicalUrl])
}
