export type ErrorMessageSize = 'sm' | 'md'

const sizeClasses: Record<ErrorMessageSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
}

export interface ErrorMessageProps {
  message: string
  size?: ErrorMessageSize
  className?: string
}

export default function ErrorMessage({
  message,
  size = 'md',
  className = '',
}: ErrorMessageProps) {
  const base = 'text-rose-600 dark:text-rose-400'
  const classes = [base, sizeClasses[size], className].filter(Boolean).join(' ')

  return (
    <p role="alert" className={classes}>
      {message}
    </p>
  )
}
