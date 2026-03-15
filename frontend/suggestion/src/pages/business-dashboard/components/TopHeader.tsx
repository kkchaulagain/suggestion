import { ThemeToggle } from '../../../components/ui'

interface TopHeaderProps {
  title: string
}

export default function TopHeader({ title }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#fafaf9] px-4 py-4 dark:border-stone-700/80 dark:bg-stone-950 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-medium tracking-tight text-stone-900 dark:text-stone-50 sm:text-xl">{title}</h2>
          <p className="hidden text-xs text-stone-500 dark:text-stone-400 sm:block sm:text-sm">Business and government QR suggestion management</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
