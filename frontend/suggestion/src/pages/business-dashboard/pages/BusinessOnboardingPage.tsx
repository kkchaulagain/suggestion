import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AlertTriangle, ArrowRight, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { onboardingApi, onboardingCountsApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Switch } from '../../../components/ui'
import {
  getStarterBundle,
  getDefaultPageForRole,
  getPageRoleLabel,
  PAGE_ROLE_OPTIONS,
  SITE_ARCHETYPES,
  type OnboardingFormPayload,
  type OnboardingPagePayload,
  type PageRole,
  type SiteArchetypeId,
} from './businessOnboardingPresets'

const CONFIRM_TEXT = 'RESET'

interface OnboardingCounts {
  formsCount: number
  pagesCount: number
  submissionsCount: number
}

type Step = 'welcome' | 'site_type' | 'preview' | 'confirm' | 'running' | 'success'

export default function BusinessOnboardingPage() {
  const navigate = useNavigate()
  const { getAuthHeaders, refetchBusiness } = useAuth()
  const [step, setStep] = useState<Step>('welcome')
  const [siteType, setSiteType] = useState<SiteArchetypeId | null>(null)
  const [counts, setCounts] = useState<OnboardingCounts | null>(null)
  const [countsLoading, setCountsLoading] = useState(true)
  const [confirmInput, setConfirmInput] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Editable list of pages to create (add/remove/customize from bundle). */
  const [editablePages, setEditablePages] = useState<OnboardingPagePayload[]>([])
  const [showAddPagePicker, setShowAddPagePicker] = useState(false)

  const authHeaders = getAuthHeaders()

  const hasExistingData =
    counts != null &&
    (counts.formsCount > 0 || counts.pagesCount > 0 || counts.submissionsCount > 0)

  useEffect(() => {
    let cancelled = false
    const fetchCounts = async () => {
      try {
        const res = await axios.get<OnboardingCounts>(onboardingCountsApi, {
          withCredentials: true,
          headers: authHeaders.Authorization ? { Authorization: authHeaders.Authorization } : undefined,
        })
        if (!cancelled) setCounts(res.data)
      } catch {
        if (!cancelled) setCounts({ formsCount: 0, pagesCount: 0, submissionsCount: 0 })
      } finally {
        if (!cancelled) setCountsLoading(false)
      }
    }
    fetchCounts()
    return () => {
      cancelled = true
    }
  }, [authHeaders.Authorization])

  const bundle = siteType ? getStarterBundle(siteType) : { forms: [], pages: [] }
  const formsPreview = bundle.forms as OnboardingFormPayload[]
  const handleStart = useCallback(() => setStep('site_type'), [])
  const handleBackFromSiteType = useCallback(() => setStep('welcome'), [])
  const handleSelectSiteType = useCallback((id: SiteArchetypeId) => {
    setSiteType(id)
    const { pages } = getStarterBundle(id)
    setEditablePages(pages.map((p) => ({ ...p, showInNav: p.showInNav !== false })))
    setStep('preview')
  }, [])
  const handleBackFromPreview = useCallback(() => setStep('site_type'), [])
  const handleContinueToConfirm = useCallback(() => setStep('confirm'), [])
  const handleBackFromConfirm = useCallback(() => setStep('preview'), [])
  const addPageWithRole = useCallback((role: PageRole) => {
    setEditablePages((prev) => [...prev, getDefaultPageForRole(role, prev.map((p) => p.slug).filter(Boolean) as string[])])
    setShowAddPagePicker(false)
  }, [])
  const removePage = useCallback((index: number) => {
    setEditablePages((prev) => prev.filter((_, i) => i !== index))
  }, [])
  const updatePage = useCallback((index: number, updates: Partial<Pick<OnboardingPagePayload, 'title' | 'slug' | 'showInNav'>>) => {
    setEditablePages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    )
  }, [])

  const runSetup = useCallback(async () => {
    if (!siteType) return
    const { forms } = getStarterBundle(siteType)
    const pagesToSend = editablePages.map((p) => ({
      ...p,
      title: (p.title && p.title.trim()) || 'Untitled',
      slug: (p.slug && p.slug.trim()) || 'page',
    }))
    setRunning(true)
    setError(null)
    try {
      await axios.post(
        onboardingApi,
        {
          resetExistingData: true,
          forms,
          pages: pagesToSend,
        },
        {
          withCredentials: true,
          headers: authHeaders.Authorization ? { Authorization: authHeaders.Authorization } : undefined,
        }
      )
      await refetchBusiness()
      setStep('success')
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? String(err.response.data.error)
        : 'Setup failed. Please try again.'
      setError(message)
      setStep('confirm')
    } finally {
      setRunning(false)
    }
  }, [siteType, editablePages, authHeaders.Authorization, refetchBusiness])

  const handleConfirm = useCallback(() => {
    if (hasExistingData && confirmInput.trim() !== CONFIRM_TEXT) return
    setStep('running')
    runSetup()
  }, [hasExistingData, confirmInput, runSetup])

  const canConfirm = !hasExistingData || confirmInput.trim() === CONFIRM_TEXT

  if (step === 'success') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto p-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
            <Check className="h-8 w-8 shrink-0" />
            <h2 className="text-xl font-semibold">Setup complete</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your starter forms and pages have been created. You can edit them anytime from the dashboard.
          </p>
          <Button onClick={() => navigate('/dashboard/forms')} variant="primary">
            Go to Forms
          </Button>
        </Card>
      </div>
    )
  }

  if (step === 'running') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto p-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin shrink-0" />
            <span>Setting up your workspace…</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
        Business setup
      </h1>

      {step === 'welcome' && (
        <Card padding="lg">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This setup will create starter forms and pages for your business based on the type you choose.
            You can customize everything after.
          </p>
          {!countsLoading && hasExistingData && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 mb-4">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Warning: this will replace existing content</p>
                <p className="text-sm mt-1">
                  You currently have {counts?.formsCount ?? 0} form(s), {counts?.pagesCount ?? 0} page(s),
                  and {counts?.submissionsCount ?? 0} response(s). Running setup will delete all of them
                  and create new starter content.
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleStart}>
              Get started
            </Button>
          </div>
        </Card>
      )}

      {step === 'site_type' && (
        <Card padding="lg">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
            What best describes your business?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            We’ll create forms and pages that match this type. You can change or add more later.
          </p>
          <ul className="space-y-2">
            {SITE_ARCHETYPES.map((arch) => (
              <li key={arch.id}>
                <button
                  type="button"
                  onClick={() => handleSelectSiteType(arch.id)}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{arch.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{arch.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button variant="secondary" onClick={handleBackFromSiteType}>
              Back
            </Button>
          </div>
        </Card>
      )}

      {step === 'preview' && siteType && (
        <Card padding="lg">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
            What we’ll create
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Based on your selection, we’ll create the following. Each page has a role so your site has a clear structure and working navigation. You can customize titles and URLs below, or edit everything after setup.
          </p>
          {formsPreview.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Forms</p>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                {formsPreview.map((f, i) => (
                  <li key={i}>{f.title}</li>
                ))}
              </ul>
            </div>
          )}
          {editablePages.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Site structure (pages &amp; URLs)
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddPagePicker(true)}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden />
                  Add page
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Each page has a role for navigation. Toggle &quot;Show in navigation&quot; to include or hide in the site nav. You can add, remove, and edit titles or slugs.
              </p>
              <ul className="space-y-4">
                {editablePages.map((p, i) => {
                  const role = p.role as PageRole | undefined
                  const roleLabel = role ? getPageRoleLabel(role) : 'Page'
                  const title = p.title ?? ''
                  const slug = p.slug ?? ''
                  return (
                    <li
                      key={i}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          title="Page role for navigation"
                        >
                          {roleLabel}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePage(i)}
                          className="text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                          aria-label={`Remove ${title || 'page'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 py-1">
                        <Switch
                          id={`show-in-nav-${i}`}
                          checked={p.showInNav !== false}
                          onChange={(checked) => updatePage(i, { showInNav: checked })}
                        />
                        <label htmlFor={`show-in-nav-${i}`} className="text-sm text-slate-600 dark:text-slate-400">
                          Show in navigation
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          id={`page-title-${i}`}
                          label="Page title"
                          value={title}
                          onChange={(v) => updatePage(i, { title: v })}
                          placeholder="Page title"
                        />
                        <Input
                          id={`page-slug-${i}`}
                          label="URL slug"
                          value={slug}
                          onChange={(v) =>
                            updatePage(i, {
                              slug: v?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || p.slug,
                            })
                          }
                          placeholder="page-url"
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Will be available at /c/&lt;page-id&gt;/{slug || 'page'}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {editablePages.length === 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Site structure (pages)</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No pages yet. Add at least one page for your site.</p>
              <Button type="button" variant="secondary" onClick={() => setShowAddPagePicker(true)}>
                <Plus className="h-4 w-4 mr-1.5" aria-hidden />
                Add page
              </Button>
            </div>
          )}

          {showAddPagePicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/50" onClick={() => setShowAddPagePicker(false)}>
              <div
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Choose a page type</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Pick a role for the new page. This sets the default title and URL.</p>
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {PAGE_ROLE_OPTIONS.map((opt) => (
                    <li key={opt.role}>
                      <button
                        type="button"
                        onClick={() => addPageWithRole(opt.role)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              {opt.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 ml-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddPagePicker(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button variant="primary" onClick={handleContinueToConfirm}>
              Continue
            </Button>
            <Button variant="secondary" onClick={handleBackFromPreview}>
              Back
            </Button>
          </div>
        </Card>
      )}

      {step === 'confirm' && (
        <Card padding="lg">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
            Confirm setup
          </h2>
          {hasExistingData ? (
            <>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                This will permanently delete all existing forms, pages, and responses, then create the new starter content.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Type <strong>{CONFIRM_TEXT}</strong> below to confirm.
              </p>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={CONFIRM_TEXT}
                className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                data-testid="onboarding-confirm-input"
              />
            </>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              We’ll create your starter forms and pages. You can edit them right after.
            </p>
          )}
          {error && (
            <ErrorMessage message={error} className="mb-4" />
          )}
          <div className="flex gap-3 mt-4">
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!canConfirm || running}
            >
              {running ? 'Setting up…' : 'Run setup'}
            </Button>
            <Button variant="secondary" onClick={handleBackFromConfirm} disabled={running}>
              Back
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
