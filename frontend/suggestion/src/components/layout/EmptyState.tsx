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

export default function EmptyState({ type, message }: EmptyStateProps) {
  return (
    <p className={`mt-4 text-sm ${messageClasses[type]}`}>
      {message}
    </p>
  )
}
