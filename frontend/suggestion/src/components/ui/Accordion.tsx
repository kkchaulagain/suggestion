import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  defaultOpenId?: string
  className?: string
}

export default function Accordion({ items, defaultOpenId, className = '' }: AccordionProps) {
  const [openItemId, setOpenItemId] = useState<string | null>(defaultOpenId ?? null)

  if (items.length === 0) {
    return null
  }

  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const isOpen = openItemId === item.id

        return (
          <div key={item.id} className="overflow-hidden rounded-lg bg-slate-100/70 dark:bg-slate-700/40">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-200/70 dark:text-slate-100 dark:hover:bg-slate-700/70"
              onClick={() => setOpenItemId((current) => (current === item.id ? null : item.id))}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
            >
              <span>{item.title}</span>
              <ChevronDown className={['h-4 w-4 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')} />
            </button>
            {isOpen ? (
              <div
                id={`accordion-panel-${item.id}`}
                className="border-t border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300"
              >
                {item.content}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
