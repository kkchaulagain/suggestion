const currentYear = new Date().getFullYear()

export default function FormRenderFooter() {
  return (
    <footer className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400" role="contentinfo">
      © {currentYear} Suggestion Platform
    </footer>
  )
}
