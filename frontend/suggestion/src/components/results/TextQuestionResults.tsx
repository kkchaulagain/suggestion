import { MessageSquare } from 'lucide-react'
import type { TextFieldResult } from '../../types/results'
import { Card } from '../ui'

interface TextQuestionResultsProps {
  fieldName: string
  data: TextFieldResult
}

export default function TextQuestionResults({ fieldName, data }: TextQuestionResultsProps) {
  const { label, responseCount, sampleAnswers = [] } = data

  return (
    <Card className="rounded-2xl border-stone-200/80 p-5 dark:border-stone-700/60" padding="md" data-testid={`text-results-${fieldName}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{label}</h3>
        <span className="shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">
          {responseCount} {responseCount === 1 ? 'response' : 'responses'}
        </span>
      </div>
      {sampleAnswers.length > 0 && (
        <div className="mt-4 space-y-2">
          {sampleAnswers.map((answer, i) => (
            <div
              key={`${fieldName}-${i}`}
              className="flex items-start gap-2.5 rounded-lg bg-stone-50 px-3.5 py-2.5 dark:bg-stone-800/60"
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
              <p className="min-w-0 break-words text-sm text-stone-700 dark:text-stone-300">
                {answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
