const currentYear = new Date().getFullYear()

export default function FormRenderFooter() {
  return (
    <footer className="mt-10 text-center text-[11px] font-medium tracking-wide text-stone-400 dark:text-stone-500" role="contentinfo">
      © {currentYear} Suggestion Platform
    </footer>
  )
}
