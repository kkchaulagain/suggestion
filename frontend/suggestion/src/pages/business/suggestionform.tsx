import { Card } from '../../components/ui'

export default function SuggestionForm() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <Card padding="lg" className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">Suggestion Form Builder</h1>
        <p className="mt-3 text-sm text-slate-700">
          This page can host your existing dynamic form builder. The new business dashboard is available at
          `/dashboard/forms`.
        </p>
      </Card>
    </div>
  )
}
