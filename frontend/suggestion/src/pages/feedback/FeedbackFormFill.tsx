import { useParams } from 'react-router-dom'

export default function FeedbackFormFill() {
  const { id } = useParams<{ id: string }>()


  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Public Feedback Form</h1>
        <p className="mt-2 text-sm text-slate-600">Form ID: {id ?? 'unknown'}</p>
        <p className="mt-4 text-sm text-slate-700">
          This route is reserved for QR-scanned public feedback forms. Connect it to backend form data as needed.
        </p>
      </div>
    </div>
  )
}
