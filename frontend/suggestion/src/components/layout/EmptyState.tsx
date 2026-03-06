import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'

export type EmptyStateType = 'loading' | 'empty' | 'error'

export interface EmptyStateProps {
  type: EmptyStateType
  message: string
}

const messageClasses: Record<EmptyStateType, string> = {
  loading: 'text-slate-500 dark:text-slate-400',
  empty: 'text-slate-500 dark:text-slate-400',
  error: 'text-rose-600 dark:text-rose-400',
}

const iconByType: Record<EmptyStateType, ReactNode> = {
  loading: <Loader2 className="h-10 w-10 animate-spin text-slate-400 dark:text-slate-500" aria-hidden />,
  empty: <Inbox className="h-10 w-10 text-slate-400 dark:text-slate-500" aria-hidden />,
  error: <AlertTriangle className="h-10 w-10 text-rose-500 dark:text-rose-400" aria-hidden />,
}

export default function EmptyState({ type, message }: EmptyStateProps) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2 py-8">
      {iconByType[type]}
      <p className={`text-sm ${messageClasses[type]}`}>
        {message}
      </p>
    </div>
  )
}
