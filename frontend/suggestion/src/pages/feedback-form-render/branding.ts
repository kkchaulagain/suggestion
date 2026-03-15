/**
 * Branding for the public form render experience (footer, SEO suffix).
 * Configure via env: VITE_APP_NAME, VITE_APP_TAGLINE, VITE_APP_LOGO_URL.
 *
 * Keep this file Jest-safe by avoiding direct `import.meta` syntax at parse time.
 */
type EnvMap = Record<string, string | undefined>

function getProcessEnv(): EnvMap {
  if (typeof process !== 'undefined' && process.env) {
    return process.env as EnvMap
  }
  return {}
}

function getViteEnv(): EnvMap | null {
  try {
    return new Function(
      'return typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : null'
    )() as EnvMap | null
  } catch {
    return null
  }
}

const env = getViteEnv() ?? getProcessEnv()

export const branding = {
  /** Site/app name shown in footer and as title suffix (e.g. "My Company") */
  siteName: env.VITE_APP_NAME || 'Suggestion Platform',
  /** Short tagline (e.g. "Feedback that matters") */
  tagline: env.VITE_APP_TAGLINE || '',
  /** Logo URL for footer (optional). Use absolute URL for external images. */
  logoUrl: env.VITE_APP_LOGO_URL || '',
}
