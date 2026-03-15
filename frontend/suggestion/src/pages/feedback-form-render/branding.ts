/**
 * Branding for the public form render experience (footer, SEO suffix).
 * Configure via env: VITE_APP_NAME, VITE_APP_TAGLINE, VITE_APP_LOGO_URL.
 */
function getEnv(): Record<string, string | undefined> {
  if (typeof process !== 'undefined' && process.env) {
    return process.env as Record<string, string | undefined>
  }
  return {}
}

// Vite injects at build time; use import.meta.env only when available (browser)
const viteEnv =
  typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env
    ? (import.meta as { env: Record<string, string> }).env
    : null
const env = viteEnv ?? getEnv()

export const branding = {
  /** Site/app name shown in footer and as title suffix (e.g. "My Company") */
  siteName: env.VITE_APP_NAME || 'Suggestion Platform',
  /** Short tagline (e.g. "Feedback that matters") */
  tagline: env.VITE_APP_TAGLINE || '',
  /** Logo URL for footer (optional). Use absolute URL for external images. */
  logoUrl: env.VITE_APP_LOGO_URL || '',
}
