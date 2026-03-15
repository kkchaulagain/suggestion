import { branding } from './branding'

const currentYear = new Date().getFullYear()

export default function FormRenderFooter() {
  const { siteName, tagline, logoUrl } = branding

  return (
    <footer
      className="mt-10 flex flex-col items-center justify-center gap-2 py-6 text-center"
      role="contentinfo"
    >
      <div className="flex flex-col items-center gap-1.5">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-7 w-auto object-contain opacity-80 dark:opacity-90"
            width={112}
            height={28}
            loading="lazy"
          />
        ) : null}
        <p className="text-[11px] font-medium tracking-wide text-stone-400 dark:text-stone-500">
          © {currentYear} {siteName}
        </p>
        {tagline ? (
          <p className="text-[10px] tracking-wide text-stone-400/90 dark:text-stone-500/90">
            {tagline}
          </p>
        ) : null}
      </div>
    </footer>
  )
}
