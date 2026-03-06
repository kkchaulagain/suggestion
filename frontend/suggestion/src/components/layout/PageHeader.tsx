import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  actions?: ReactNode
}

export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
