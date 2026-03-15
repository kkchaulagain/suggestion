import { useParams } from 'react-router-dom'
import { FormResultsView } from '../../components/results'
import FormRenderFooter from './FormRenderFooter'

/**
 * Public results page: /feedback-forms/:formId/results
 * Renders aggregated results (no auth required).
 */
export default function FormResultsPage() {
  const { formId } = useParams<{ formId: string }>()

  if (!formId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-400">Invalid form link.</p>
        <FormRenderFooter />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FormResultsView formId={formId} showDateFilter={false} />
      <FormRenderFooter />
    </div>
  )
}
