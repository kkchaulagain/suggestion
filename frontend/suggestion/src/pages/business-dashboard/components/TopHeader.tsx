import { ThemeToggle } from '../../../components/ui'

interface TopHeaderProps {
  title: string
}

export default function TopHeader({ title }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">{title}</h2>
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block sm:text-sm">Business and government QR suggestion management</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
