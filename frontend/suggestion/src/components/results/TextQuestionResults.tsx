import type { TextFieldResult } from '../../types/results'
import { Card } from '../ui'

interface TextQuestionResultsProps {
  fieldName: string
  data: TextFieldResult
}

export default function TextQuestionResults({ fieldName, data }: TextQuestionResultsProps) {
  const { label, responseCount, sampleAnswers = [] } = data

  return (
    <Card className="rounded-xl p-4" padding="md" data-testid={`text-results-${fieldName}`}>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {responseCount} {responseCount === 1 ? 'response' : 'responses'}
      </p>
      {sampleAnswers.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {sampleAnswers.map((answer, i) => (
            <li key={`${fieldName}-${i}`} className="truncate">
              {answer}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
