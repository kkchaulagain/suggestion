/**
 * Onboarding starter bundles: map site archetypes to starter forms and pages.
 * Used by BusinessOnboardingPage to scaffold content via POST /api/onboarding/business-setup.
 */

import { FORM_TEMPLATES, type FormTemplate } from './formTemplates'
import { PAGE_TEMPLATES, type PageTemplate, type PageTemplateBlock } from './pageTemplates'

export type SiteArchetypeId =
  | 'business_service'
  | 'selling_products'
  | 'appointment_booking'
  | 'event_or_campaign'
  | 'custom_start'

export interface SiteArchetype {
  id: SiteArchetypeId
  label: string
  description: string
}

/** Form payload sent to onboarding API (same shape as POST /api/feedback-forms). */
export interface OnboardingFormPayload {
  title: string
  description?: string
  metaTitle?: string
  metaDescription?: string
  landingHeadline?: string
  landingDescription?: string
  landingCtaText?: string
  landingEmoji?: string
  thankYouHeadline?: string
  thankYouMessage?: string
  showResultsPublic?: boolean
  kind?: string
  formStyle?: string
  drawerDefaultOpen?: boolean
  fields: Array<{ name: string; label: string; type: string; required: boolean; placeholder?: string; options?: string[]; stepId?: string; stepOrder?: number }>
  steps?: Array<{ id: string; title: string; description?: string; order: number }>
}

/** Page payload sent to onboarding API; form blocks use formIndex (0-based) to reference created forms. */
export interface OnboardingPagePayload {
  title: string
  slug?: string
  blocks: Array<{ type: string; payload: Record<string, unknown> }>
  status?: string
}

export const SITE_ARCHETYPES: SiteArchetype[] = [
  { id: 'business_service', label: 'Service business', description: 'Consultancy, agency, clinic, salon, repair — contact and service request forms.' },
  { id: 'selling_products', label: 'Selling products', description: 'Retail, ecommerce, product catalog — product inquiry, order request, landing and showcase pages.' },
  { id: 'appointment_booking', label: 'Appointment booking', description: 'Booking-heavy business — appointment form, contact and booking pages.' },
  { id: 'event_or_campaign', label: 'Event or campaign', description: 'Events, booths, conferences — RSVP, feedback survey, event page.' },
  { id: 'custom_start', label: 'Start from scratch', description: 'Advanced: minimal starter set; add forms and pages manually.' },
]

const formById = (id: string): FormTemplate | undefined =>
  FORM_TEMPLATES.find((t) => t.id === id)
const pageById = (id: string): PageTemplate | undefined =>
  PAGE_TEMPLATES.find((t) => t.id === id)

function formTemplateToPayload(t: FormTemplate): OnboardingFormPayload {
  return {
    title: t.title,
    description: t.formDescription,
    kind: t.kind,
    fields: t.fields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      required: f.required,
      placeholder: f.placeholder,
      options: f.options,
      stepId: f.stepId,
      stepOrder: f.stepOrder,
    })),
    steps: t.steps,
  }
}

/** Which form index (0-based) to use for the form block in each page. */
interface BundlePageDef {
  pageTemplateId: string
  formBlockFormIndex?: number
}

interface BundleDef {
  formTemplateIds: string[]
  pages: BundlePageDef[]
}

const BUNDLES: Record<SiteArchetypeId, BundleDef> = {
  business_service: {
    formTemplateIds: ['contact-inquiry', 'service-request'],
    pages: [
      { pageTemplateId: 'contact-us', formBlockFormIndex: 0 },
      { pageTemplateId: 'services', formBlockFormIndex: 1 },
    ],
  },
  selling_products: {
    formTemplateIds: ['order-request', 'contact-inquiry'],
    pages: [
      { pageTemplateId: 'landing-page', formBlockFormIndex: undefined },
      { pageTemplateId: 'product-showcase', formBlockFormIndex: undefined },
      { pageTemplateId: 'contact-us', formBlockFormIndex: 1 },
    ],
  },
  appointment_booking: {
    formTemplateIds: ['appointment-booking', 'contact-inquiry'],
    pages: [
      { pageTemplateId: 'contact-us', formBlockFormIndex: 1 },
      { pageTemplateId: 'feedback-form-page', formBlockFormIndex: 0 },
    ],
  },
  event_or_campaign: {
    formTemplateIds: ['rsvp', 'survey-event-feedback'],
    pages: [
      { pageTemplateId: 'event-page', formBlockFormIndex: undefined },
      { pageTemplateId: 'feedback-form-page', formBlockFormIndex: 0 },
    ],
  },
  custom_start: {
    formTemplateIds: ['contact-inquiry'],
    pages: [
      { pageTemplateId: 'contact-us', formBlockFormIndex: 0 },
    ],
  },
}

function blocksWithFormIndex(
  blocks: PageTemplateBlock[],
  formBlockFormIndex: number | undefined
): Array<{ type: string; payload: Record<string, unknown> }> {
  return blocks.map((b) => {
    if (b.type === 'form' && typeof formBlockFormIndex === 'number') {
      return { type: 'form', payload: { formIndex: formBlockFormIndex } }
    }
    return { type: b.type, payload: { ...b.payload } }
  })
}

export interface StarterBundle {
  forms: OnboardingFormPayload[]
  pages: OnboardingPagePayload[]
}

export function getStarterBundle(siteType: SiteArchetypeId): StarterBundle {
  const bundle = BUNDLES[siteType]
  if (!bundle) {
    return { forms: [], pages: [] }
  }
  const forms: OnboardingFormPayload[] = bundle.formTemplateIds
    .map((id) => formById(id))
    .filter((t): t is FormTemplate => t != null)
    .map(formTemplateToPayload)

  const pages: OnboardingPagePayload[] = bundle.pages.flatMap(({ pageTemplateId, formBlockFormIndex }) => {
    const pageTemplate = pageById(pageTemplateId)
    if (!pageTemplate) return []
    const title = pageTemplate.defaultTitle ?? pageTemplate.label
    const slug = (pageTemplate.defaultTitle ?? pageTemplate.label).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'page'
    return [{
      title,
      slug,
      blocks: blocksWithFormIndex(pageTemplate.blocks, formBlockFormIndex),
      status: 'draft',
    }]
  })

  return { forms, pages }
}