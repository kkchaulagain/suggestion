export type FeedbackFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'scale'
  | 'rating'
  | 'image'
  // Legacy types kept for backward compat during migration
  | 'short_text'
  | 'long_text'
  | 'big_text'
  | 'image_upload'
  | 'name'
  | 'scale_1_10'

export interface FieldValidationRules {
  min?: number
  max?: number
  pattern?: string
  countryCode?: boolean
}

export interface FeedbackFormField {
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
  stepId?: string
  stepOrder?: number
  validation?: FieldValidationRules
  /** Scale field: label at low end (e.g. "Mostly disagree") */
  scaleMinLabel?: string
  /** Scale field: label at high end (e.g. "Mostly agree") */
  scaleMaxLabel?: string
}

export interface FormStep {
  id: string
  title: string
  description?: string
  order: number
}

export type FormKind = 'form' | 'poll' | 'survey'

export type FormStyle = 'default' | 'drawer'

export interface FeedbackFormConfig {
  _id: string
  title: string
  description?: string
  /** Optional SEO: override for <title> and og:title (defaults to title) */
  metaTitle?: string
  /** Optional SEO: override for meta description and og:description (defaults to description) */
  metaDescription?: string
  /** Drawer landing: headline (defaults to title) */
  landingHeadline?: string
  /** Drawer landing: body text (defaults to description) */
  landingDescription?: string
  /** Drawer landing: CTA button text (defaults to "Tap to vote" / "Start") */
  landingCtaText?: string
  /** Drawer landing: emoji shown above headline */
  landingEmoji?: string
  /** After submit: headline (defaults to "Vote submitted" / "Response recorded") */
  thankYouHeadline?: string
  /** After submit: message (defaults to "Results will be visible soon.") */
  thankYouMessage?: string
  fields: FeedbackFormField[]
  steps?: FormStep[]
  kind?: FormKind
  formStyle?: FormStyle
  /** When formStyle is drawer: start with drawer open. Default true. */
  drawerDefaultOpen?: boolean
  showResultsPublic?: boolean
}

export interface FeedbackFormApiResponse {
  feedbackForm: FeedbackFormConfig
}
