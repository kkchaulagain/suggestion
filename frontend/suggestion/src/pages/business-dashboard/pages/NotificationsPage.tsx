import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Bell, CalendarClock, MailPlus, Send } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { businessmeapi, feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Select, Switch, Textarea } from '../../../components/ui'
import { PageHeader } from '../../../components/layout'

interface FeedbackForm {
  _id: string
  title: string
}

interface RecipientsResponse {
  formId: string
  formTitle: string
  totalRecipients: number
  page: number
  pageSize: number
}

interface CampaignResponse {
  message: string
  campaignId?: string
  recipientCount: number
  scheduledFor?: string
  sent?: number
  failed?: number
}

interface QrPayload {
  qrCodeDataUrl: string
  formUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatMessageAsHtml(value: string): string {
  return escapeHtml(value.trim() || 'We would love your feedback. Please use the form below.')
    .replace(/\r?\n/g, '<br />')
}

function buildEmailLayoutTemplate(formTitle: string, message: string): string {
  const safeTitle = escapeHtml(formTitle || 'your form')
  const htmlMessage = formatMessageAsHtml(message)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:Segoe UI,Arial,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e7e5e4;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#ffffff;">
                <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.76);">Notification</p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:700;">${safeTitle}</h1>
                <p style="margin:10px 0 0 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.88);">A quick way for customers to open the selected form from this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <div style="margin:0 0 20px 0;font-size:15px;line-height:1.8;color:#44403c;">${htmlMessage}</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
                  <tr>
                    <td style="padding:20px;border:1px solid #d6d3d1;border-radius:18px;background:#fafaf9;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align:top;padding-right:20px;">
                            <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#78716c;">Selected form</p>
                            <p style="margin:0 0 16px 0;font-size:20px;line-height:1.4;font-weight:700;color:#1c1917;">{{FORM_TITLE}}</p>
                            <a href="{{FORM_LINK}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0f766e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Open form</a>
                            <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#57534e;word-break:break-word;">{{FORM_LINK}}</p>
                          </td>
                          <td align="right" style="width:180px;vertical-align:top;">
                            {{FORM_QR_IMAGE}}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#fafaf9;border-top:1px solid #e7e5e4;font-size:12px;line-height:1.6;color:#78716c;">
                This email was sent by your business notification campaign.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildPreviewHtml(template: string, formTitle: string, qrPayload: QrPayload | null): string {
  const fallbackQrMarkup = '<div style="width:160px;height:160px;border-radius:18px;border:1px dashed #a8a29e;background:#f5f5f4;color:#78716c;font-size:13px;display:flex;align-items:center;justify-content:center;text-align:center;padding:12px;box-sizing:border-box;">QR preview unavailable</div>'

  return template
    .replaceAll('{{FORM_TITLE}}', escapeHtml(formTitle || 'Selected form'))
    .replaceAll('{{FORM_LINK}}', qrPayload?.formUrl || '#')
    .replaceAll(
      '{{FORM_QR_IMAGE}}',
      qrPayload?.qrCodeDataUrl
        ? `<img src="${qrPayload.qrCodeDataUrl}" alt="QR for ${escapeHtml(formTitle || 'form')}" style="display:block;width:160px;height:160px;border-radius:18px;border:1px solid #d6d3d1;background:#ffffff;" />`
        : fallbackQrMarkup,
    )
}

function toInputDateTimeValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${mins}`
}

export default function NotificationsPage() {
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [savingNotificationSetting, setSavingNotificationSetting] = useState(false)
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(true)
  const [forms, setForms] = useState<FeedbackForm[]>([])
  const [formId, setFormId] = useState('')
  const [subject, setSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [selectedFormQr, setSelectedFormQr] = useState<QrPayload | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)

  const [loadingForms, setLoadingForms] = useState(true)
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [sending, setSending] = useState(false)

  const [recipientsCount, setRecipientsCount] = useState(0)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { business, getAuthHeaders, refetchBusiness } = useAuth()

  const authHeaders = useMemo(
    () => ({
      withCredentials: true as const,
      headers: getAuthHeaders(),
    }),
    [getAuthHeaders],
  )
  const authHeadersRef = useRef(authHeaders)
  authHeadersRef.current = authHeaders

  useEffect(() => {
    if (!business || savingNotificationSetting) return
    setEmailNotificationsEnabled(business.emailNotificationsEnabled !== false)
  }, [business, savingNotificationSetting])

  const loadForms = useCallback(async () => {
    const headers = authHeadersRef.current
    try {
      setLoadingForms(true)
      setError('')
      const response = await axios.get<{ feedbackForms: FeedbackForm[] }>(feedbackFormsApi, headers)
      const loadedForms = response.data.feedbackForms ?? []
      setForms(loadedForms)
      if (loadedForms.length > 0) {
        setFormId((current) => current || loadedForms[0]._id)
      }
    } catch {
      setError('Unable to load forms for notifications.')
      setForms([])
    } finally {
      setLoadingForms(false)
    }
  }, [])

  const loadRecipients = useCallback(async (selectedFormId: string) => {
    if (!selectedFormId) {
      setRecipientsCount(0)
      return
    }

    const headers = authHeadersRef.current
    try {
      setLoadingRecipients(true)
      setError('')
      const response = await axios.get<RecipientsResponse>(
        `${feedbackFormsApi}/${selectedFormId}/notification-recipients?page=1&pageSize=8`,
        headers,
      )
      setRecipientsCount(response.data.totalRecipients ?? 0)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Unable to load recipient emails from previous submissions.')
      setRecipientsCount(0)
    } finally {
      setLoadingRecipients(false)
    }
  }, [])

  const loadFormShareAssets = useCallback(async (selectedFormId: string) => {
    if (!selectedFormId) {
      setSelectedFormQr(null)
      return
    }

    const headers = authHeadersRef.current
    try {
      setLoadingQr(true)
      setError('')
      const response = await axios.post<QrPayload>(`${feedbackFormsApi}/${selectedFormId}/qr`, {}, headers)
      setSelectedFormQr(response.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Unable to load form QR and link.')
      setSelectedFormQr(null)
    } finally {
      setLoadingQr(false)
    }
  }, [])

  useEffect(() => {
    void loadForms()
  }, [loadForms])

  useEffect(() => {
    void loadRecipients(formId)
  }, [formId, loadRecipients])

  useEffect(() => {
    void loadFormShareAssets(formId)
  }, [formId, loadFormShareAssets])

  const selectedForm = useMemo(() => forms.find((form) => form._id === formId) ?? null, [forms, formId])

  useEffect(() => {
    if (!selectedForm) return
    if (!subject.trim()) {
      setSubject(`Please complete: ${selectedForm.title || 'Feedback form'}`)
    }
  }, [selectedForm, subject])

  useEffect(() => {
    if (!selectedForm) return
    setMessageBody((current) =>
      current.trim()
        ? current
        : `Hello,\n\nWe would appreciate it if you could complete the ${selectedForm.title || 'selected'} form.\n\nYou can open it from the button, direct link, or QR code below.\n\nThank you.`,
    )
  }, [selectedForm])

  useEffect(() => {
    if (!selectedForm) return
    setHtmlBody(buildEmailLayoutTemplate(selectedForm.title || 'Feedback form', messageBody))
  }, [selectedForm, messageBody])

  const previewHtml = useMemo(
    () => buildPreviewHtml(htmlBody, selectedForm?.title || 'Selected form', selectedFormQr),
    [htmlBody, selectedForm, selectedFormQr],
  )

  const formOptions = forms.map((form) => ({ value: form._id, label: form.title || 'Untitled form' }))

  const validate = () => {
    if (!formId) return 'Please select a form.'
    if (!subject.trim()) return 'Subject is required.'
    if (!messageBody.trim()) return 'Email message is required.'
    if (!htmlBody.trim()) return 'Email layout could not be generated.'
    if (recipientsCount < 1) return 'No valid recipient emails found from previous form submissions.'
    if (scheduleAt) {
      const date = new Date(scheduleAt)
      if (Number.isNaN(date.getTime())) return 'Scheduled date/time is invalid.'
      if (date.getTime() <= Date.now()) return 'Schedule time must be in the future.'
    }
    return ''
  }

  const handleSendCampaign = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    const headers = authHeadersRef.current
    try {
      setSending(true)
      setError('')
      setSuccess('')

      const payload: { subject: string; htmlBody: string; scheduleAt?: string } = {
        subject: subject.trim(),
        htmlBody,
      }
      if (scheduleAt) {
        payload.scheduleAt = new Date(scheduleAt).toISOString()
      }

      const response = await axios.post<CampaignResponse>(
        `${feedbackFormsApi}/${formId}/notifications/campaign`,
        payload,
        headers,
      )

      if (response.status === 202) {
        const scheduledLabel = response.data.scheduledFor
          ? new Date(response.data.scheduledFor).toLocaleString()
          : 'the selected time'
        setSuccess(`Campaign scheduled for ${scheduledLabel} to ${response.data.recipientCount} recipients.`)
      } else {
        const sentCount = response.data.sent ?? response.data.recipientCount ?? 0
        const failedCount = response.data.failed ?? 0
        setSuccess(`Campaign sent. Delivered: ${sentCount}, failed: ${failedCount}.`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Failed to send campaign.')
      setSuccess('')
    } finally {
      setSending(false)
    }
  }

  const handleToggleEmailNotifications = useCallback(
    async (checked: boolean) => {
      if (!business?._id) {
        setError('Business profile is not loaded yet.')
        return
      }

      const previous = emailNotificationsEnabled
      setEmailNotificationsEnabled(checked)
      setSavingNotificationSetting(true)
      setError('')

      try {
        await axios.put(
          businessmeapi,
          { emailNotificationsEnabled: checked },
          authHeadersRef.current,
        )
        await refetchBusiness()
        setSuccess(checked ? 'Business email notifications are on.' : 'Business email notifications are off.')
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setEmailNotificationsEnabled(previous)
        setSuccess('')
        setError(msg || 'Failed to update email notification setting.')
      } finally {
        setSavingNotificationSetting(false)
      }
    },
    [emailNotificationsEnabled, refetchBusiness],
  )

  return (
    <section className="space-y-6" aria-label="Notifications">
      <PageHeader title="Email Notifications" />

      <Card>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900/80">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
                    <Bell className="h-4 w-4" />
                    <p className="text-sm font-semibold">Email notifications</p>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Turn email notifications on or off for this dashboard.
                  </p>
                </div>
                <Switch
                  id="email-notifications-enabled"
                  checked={emailNotificationsEnabled}
                  onChange={(checked) => void handleToggleEmailNotifications(checked)}
                  aria-label="Toggle email notifications"
                  disabled={savingNotificationSetting}
                />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                {savingNotificationSetting ? 'Saving...' : emailNotificationsEnabled ? 'Status: On' : 'Status: Off'}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900/80">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <MailPlus className="h-4 w-4" />
                <p className="text-sm font-semibold">Create campaign</p>
              </div>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                Choose a form, write your message, and send a campaign to saved customer emails from previous submissions.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={() => setShowCampaignBuilder((current) => !current)}
              >
                <MailPlus className="h-4 w-4" />
                {showCampaignBuilder ? 'Hide campaign' : 'Create campaign'}
              </Button>
            </div>
          </div>

          {!emailNotificationsEnabled ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Email notifications are currently off. You can still prepare or send a campaign from the section below.
            </p>
          ) : null}
        </div>
      </Card>

      {showCampaignBuilder ? (
        <Card>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Create a campaign</p>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Pick the form you want to promote and send it by email.
                </p>
              </div>

              <Select
                id="notification-form"
                label="Select form"
                value={formId}
                onChange={setFormId}
                options={formOptions}
                placeholder={loadingForms ? 'Loading forms...' : 'Choose a form'}
                disabled={loadingForms || forms.length === 0}
                required
              />

              <Input
                id="campaign-subject"
                label="Email subject"
                value={subject}
                onChange={setSubject}
                placeholder="Please complete our latest form"
                required
              />

              <Textarea
                id="campaign-message"
                label="Business message"
                value={messageBody}
                onChange={setMessageBody}
                placeholder="Write the message you want customers to receive."
                rows={8}
                required
              />

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/70">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Auto email layout</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  We build the email layout automatically from your message and the selected form.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/70">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {loadingRecipients ? 'Loading recipients...' : `${recipientsCount} unique email recipients found`}
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  This QR and link will be embedded in the outgoing email.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {selectedFormQr?.qrCodeDataUrl ? (
                    <img
                      src={selectedFormQr.qrCodeDataUrl}
                      alt={`QR for ${selectedForm?.title || 'Selected form'}`}
                      className="h-32 w-32 rounded-2xl border border-stone-200 bg-white object-contain p-2 dark:border-stone-700"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 text-center text-xs text-stone-500 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-400">
                      {loadingQr ? 'Loading QR preview...' : 'QR preview unavailable'}
                    </div>
                  )}
                  <div className="min-w-0 space-y-2">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {selectedForm?.title || 'Selected form'}
                    </p>
                    <p className="break-all text-sm text-stone-600 dark:text-stone-400">
                      {selectedFormQr?.formUrl || 'Form link unavailable'}
                    </p>
                  </div>
                </div>
              </div>

              <Input
                id="campaign-schedule"
                type="datetime-local"
                label="Schedule send time (optional)"
                value={scheduleAt}
                min={toInputDateTimeValue(new Date())}
                onChange={setScheduleAt}
                leftIcon={<CalendarClock className="h-4 w-4" />}
              />

              {error ? <ErrorMessage message={error} /> : null}
              {success ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {success}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button type="button" onClick={handleSendCampaign} disabled={sending || loadingForms || loadingRecipients || loadingQr || forms.length === 0}>
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : scheduleAt ? 'Schedule campaign' : 'Send campaign'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Email preview</p>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    Preview of the generated campaign email for the selected form.
                  </p>
                </div>
                <div className="max-h-[720px] overflow-auto bg-stone-100 p-3 dark:bg-stone-950">
                  <iframe
                    title="Email preview"
                    className="min-h-[640px] w-full rounded-xl border border-stone-200 bg-white dark:border-stone-700"
                    sandbox=""
                    srcDoc={previewHtml}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </section>
  )
}
