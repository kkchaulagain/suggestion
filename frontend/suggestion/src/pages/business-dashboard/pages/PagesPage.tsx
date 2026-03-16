import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { pagesApi } from '../../../utils/apipath'
import { Button, ErrorMessage, Modal } from '../../../components/ui'
import { PageHeader, EmptyState, FormCard } from '../../../components/layout'

interface CmsPage {
  _id: string
  slug: string
  title: string
  status: 'draft' | 'published'
  blocks?: unknown[]
  updatedAt?: string
}

export default function PagesPage() {
  const navigate = useNavigate()
  const [pages, setPages] = useState<CmsPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { getAuthHeaders } = useAuth()

  const loadPages = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const headers = { withCredentials: true, headers: getAuthHeaders() }
      const res = await axios.get<{ pages: CmsPage[] }>(pagesApi, headers)
      setPages(res.data.pages ?? [])
    } catch {
      setError('Unable to load pages.')
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    void loadPages()
  }, [loadPages])

  const handleDelete = useCallback(async () => {
    if (!deleteModalId) return
    try {
      setError('')
      setDeletingId(deleteModalId)
      const headers = { withCredentials: true, headers: getAuthHeaders() }
      await axios.delete(`${pagesApi}/${deleteModalId}`, headers)
      setPages((prev) => prev.filter((p) => p._id !== deleteModalId))
      setDeleteModalId(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Failed to delete page.')
    } finally {
      setDeletingId(null)
    }
  }, [deleteModalId, getAuthHeaders])

  const pageToDelete = deleteModalId ? pages.find((p) => p._id === deleteModalId) : null

  return (
    <section className="space-y-8" aria-label="CMS Pages">
      <PageHeader
        title="Pages"
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/pages/create')}
          >
            <Plus className="h-4 w-4" />
            Add Page
          </Button>
        }
      />

      {error ? (
        <ErrorMessage message={error} className="mb-4" />
      ) : null}

      {loading ? (
        <div className="space-y-5 pt-2">
          {[1, 2, 3].map((i) => (
            <FormCard key={i} title="" variant="card">
              <div className="h-4 w-32 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            </FormCard>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 py-8">
          <EmptyState
            type="empty"
            message="You don't have any pages yet. Create a page to add content and embed forms."
          />
          <Link
            to="/dashboard/onboarding"
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
          >
            Or run the setup wizard to create starter forms and pages
          </Link>
        </div>
      ) : (
        <div className="space-y-5 pt-2">
          {pages.map((page) => (
            <FormCard
              key={page._id}
              variant="card"
              title={page.title}
              subtitle={
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                      page.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400'
                    }`}
                  >
                    {page.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400">/c/{page._id}/{page.slug}</span>
                </span>
              }
              description={page.blocks?.length ? `${(page.blocks as unknown[]).length} block(s)` : 'No blocks yet'}
              actions={
                <div className="flex items-center gap-2">
                  {page.status === 'published' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/c/${page._id}/${page.slug}`, '_blank')}
                      aria-label={`View ${page.title}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/pages/${page._id}/edit`)}
                    aria-label={`Edit ${page.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteModalId(page._id)}
                    aria-label={`Delete ${page.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteModalId}
        onClose={() => setDeleteModalId(null)}
        title="Delete page?"
      >
        <p className="text-stone-600 dark:text-stone-400">
          {pageToDelete ? `"${pageToDelete.title}" will be permanently deleted.` : 'This page will be permanently deleted.'}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteModalId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => void handleDelete()}
            disabled={!!deletingId}
          >
            {deletingId ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </section>
  )
}
