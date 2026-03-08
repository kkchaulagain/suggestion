import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Button, Input, Select } from '../../../components/ui'

export interface FormOption {
  _id: string
  title: string
}

export interface SubmissionsFilterProps {
  forms: FormOption[]
  formId: string
  onFormIdChange: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  onApply: () => void
}

export default function SubmissionsFilter({
  forms,
  formId,
  onFormIdChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onApply,
}: SubmissionsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasActiveFilters = Boolean(formId || dateFrom || dateTo)
  const optionList = forms.map((f) => ({ value: f._id, label: f.title }))

  return (
    <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded py-3 text-left transition hover:bg-slate-100/80 dark:hover:bg-slate-700/50"
        aria-expanded={isOpen}
        aria-controls="submissions-filter-panel"
        id="submissions-filter-toggle"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden />
          Filters
          {hasActiveFilters ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              On
            </span>
          ) : null}
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
        )}
      </button>
      {isOpen ? (
        <div
          id="submissions-filter-panel"
          role="region"
          aria-labelledby="submissions-filter-toggle"
          className="pt-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 sm:min-w-[10rem]">
              <Select
                id="filter-form"
                label="Form"
                value={formId}
                onChange={onFormIdChange}
                options={optionList}
                placeholder="All forms"
              />
            </div>
            <div className="min-w-0 flex-1 sm:w-auto sm:min-w-0">
              <Input
                id="filter-dateFrom"
                label="From"
                type="date"
                value={dateFrom}
                onChange={onDateFromChange}
              />
            </div>
            <div className="min-w-0 flex-1 sm:w-auto sm:min-w-0">
              <Input
                id="filter-dateTo"
                label="To"
                type="date"
                value={dateTo}
                onChange={onDateToChange}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full min-h-[44px] sm:w-auto"
              onClick={onApply}
            >
              <Filter className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
