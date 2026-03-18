/**
 * Onboarding starter bundles: map site archetypes to starter forms and pages.
 * Used by BusinessOnboardingPage to scaffold content via POST /api/onboarding/business-setup.
 *
 * Template structure:
 * - Each site archetype has a defined set of required "page roles" (home, contact, services, etc.).
 * - Each role is fulfilled by one page template with a conventional default slug.
 * - This ensures: (1) complete page set per archetype, (2) stable URLs for nav, (3) validation
 *   that the site has all expected pages. Store `role` on Page so public nav can order/label links.
 */

import { FORM_TEMPLATES, type FormTemplate } from './formTemplates'
import { PAGE_TEMPLATES, type PageTemplate, type PageTemplateBlock } from './pageTemplates'

export type SiteArchetypeId =
  | 'business_service'
  | 'selling_products'
  | 'appointment_booking'
  | 'event_or_campaign'
  | 'custom_start'

/** Page role (slot) for nav and validation. Each archetype requires a subset of these. */
export type PageRole =
  | 'home'
  | 'landing'
  | 'contact'
  | 'services'
  | 'booking'
  | 'events'
  | 'feedback'
  | 'products'
  | 'custom'

/** Human-readable labels for page roles (for onboarding UI and nav). */
export const PAGE_ROLE_LABELS: Record<PageRole, string> = {
  home: 'Home',
  landing: 'Landing',
  contact: 'Contact',
  services: 'Services',
  booking: 'Booking',
  events: 'Events',
  feedback: 'Feedback',
  products: 'Products',
  custom: 'Custom',
}

export function getPageRoleLabel(role: PageRole): string {
  return PAGE_ROLE_LABELS[role] ?? role
}

/** Options shown in the "Add page" role picker. */
export interface PageRoleOption {
  role: PageRole
  label: string
  description: string
  defaultTitle: string
  defaultSlug: string
}

export const PAGE_ROLE_OPTIONS: PageRoleOption[] = [
  { role: 'home', label: 'Home page', description: 'Main landing page with hero, features, and CTA.', defaultTitle: 'Home', defaultSlug: 'home' },
  { role: 'contact', label: 'Contact page', description: 'Contact form so visitors can reach you.', defaultTitle: 'Contact us', defaultSlug: 'contact' },
  { role: 'services', label: 'Services page', description: 'Showcase your services or offerings.', defaultTitle: 'Our Services', defaultSlug: 'services' },
  { role: 'products', label: 'Products page', description: 'Display your product catalog.', defaultTitle: 'Products', defaultSlug: 'products' },
  { role: 'booking', label: 'Booking page', description: 'Let visitors book appointments.', defaultTitle: 'Book an appointment', defaultSlug: 'book' },
  { role: 'events', label: 'Events page', description: 'Promote events, meetups, or campaigns.', defaultTitle: 'Events', defaultSlug: 'events' },
  { role: 'feedback', label: 'Feedback page', description: 'Collect feedback or surveys from visitors.', defaultTitle: 'Feedback', defaultSlug: 'feedback' },
  { role: 'landing', label: 'Landing page', description: 'Focused marketing or campaign page.', defaultTitle: 'Landing', defaultSlug: 'landing' },
  { role: 'custom', label: 'Blank page', description: 'Start from scratch with a heading and paragraph.', defaultTitle: 'New page', defaultSlug: 'new-page' },
]

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
  /** Page role for nav and validation (e.g. home, contact). */
  role?: PageRole
  /** Whether to show this page in site navigation. Default true. */
  showInNav?: boolean
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

/** One required page in a bundle: role + template + conventional slug + optional form mapping. */
export interface BundlePageDef {
  role: PageRole
  pageTemplateId: string
  /** Conventional slug for this role (stable URLs and nav). */
  defaultSlug: string
  formBlockFormIndex?: number
}

/** Site template: required forms and an ordered list of required pages with roles. */
export interface BundleDef {
  formTemplateIds: string[]
  pages: BundlePageDef[]
}

const BUNDLES: Record<SiteArchetypeId, BundleDef> = {
  business_service: {
    formTemplateIds: ['contact-inquiry', 'service-request'],
    pages: [
      { role: 'contact', pageTemplateId: 'contact-us', defaultSlug: 'contact', formBlockFormIndex: 0 },
      { role: 'services', pageTemplateId: 'services', defaultSlug: 'services', formBlockFormIndex: 1 },
    ],
  },
  selling_products: {
    formTemplateIds: ['order-request', 'contact-inquiry'],
    pages: [
      { role: 'home', pageTemplateId: 'landing-page', defaultSlug: 'home', formBlockFormIndex: undefined },
      { role: 'products', pageTemplateId: 'product-showcase', defaultSlug: 'products', formBlockFormIndex: undefined },
      { role: 'contact', pageTemplateId: 'contact-us', defaultSlug: 'contact', formBlockFormIndex: 1 },
    ],
  },
  appointment_booking: {
    formTemplateIds: ['appointment-booking', 'contact-inquiry'],
    pages: [
      { role: 'contact', pageTemplateId: 'contact-us', defaultSlug: 'contact', formBlockFormIndex: 1 },
      { role: 'booking', pageTemplateId: 'feedback-form-page', defaultSlug: 'book', formBlockFormIndex: 0 },
    ],
  },
  event_or_campaign: {
    formTemplateIds: ['rsvp', 'survey-event-feedback'],
    pages: [
      { role: 'events', pageTemplateId: 'event-page', defaultSlug: 'events', formBlockFormIndex: undefined },
      { role: 'feedback', pageTemplateId: 'feedback-form-page', defaultSlug: 'feedback', formBlockFormIndex: 0 },
    ],
  },
  custom_start: {
    formTemplateIds: ['contact-inquiry'],
    pages: [
      { role: 'contact', pageTemplateId: 'contact-us', defaultSlug: 'contact', formBlockFormIndex: 0 },
    ],
  },
}

/** Required page roles per archetype (for validation and nav). */
export function getRequiredPageRoles(archetypeId: SiteArchetypeId): PageRole[] {
  return (BUNDLES[archetypeId]?.pages ?? []).map((p) => p.role)
}

/** Validate that a set of pages (with role) satisfies the archetype's required roles. */
export function validatePageRoles(
  archetypeId: SiteArchetypeId,
  pages: Array<{ role?: string | null }>
): { valid: boolean; missing: PageRole[] } {
  const required = getRequiredPageRoles(archetypeId)
  const present = new Set(pages.map((p) => p.role).filter(Boolean) as PageRole[])
  const missing = required.filter((r) => !present.has(r))
  return { valid: missing.length === 0, missing }
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

  const pages: OnboardingPagePayload[] = bundle.pages.flatMap(({ role, pageTemplateId, defaultSlug, formBlockFormIndex }) => {
    const pageTemplate = pageById(pageTemplateId)
    if (!pageTemplate) return []
    const title = pageTemplate.defaultTitle ?? pageTemplate.label
    return [{
      title,
      slug: defaultSlug,
      role,
      showInNav: true,
      blocks: blocksWithFormIndex(pageTemplate.blocks, formBlockFormIndex),
      status: 'draft',
    }]
  })

  return { forms, pages }
}

/** Build a page payload for a given role with role-specific defaults and a unique slug. */
export function getDefaultPageForRole(role: PageRole, existingSlugs: string[] = []): OnboardingPagePayload {
  const option = PAGE_ROLE_OPTIONS.find((o) => o.role === role) ?? PAGE_ROLE_OPTIONS[PAGE_ROLE_OPTIONS.length - 1]
  let slug = option.defaultSlug
  if (existingSlugs.includes(slug)) {
    let n = 2
    while (existingSlugs.includes(`${slug}-${n}`)) n++
    slug = `${slug}-${n}`
  }
  return {
    title: option.defaultTitle,
    slug,
    role,
    showInNav: true,
    blocks: [
      { type: 'heading', payload: { level: 1, text: option.defaultTitle, align: 'left' } },
      { type: 'paragraph', payload: { text: 'Add your content here.' } },
    ],
    status: 'draft',
  }
}