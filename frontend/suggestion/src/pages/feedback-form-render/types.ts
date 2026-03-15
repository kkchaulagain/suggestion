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
}

export interface FormStep {
  id: string
  title: string
  description?: string
  order: number
}

export type FormKind = 'form' | 'poll' | 'survey'

export interface FeedbackFormConfig {
  _id: string
  title: string
  description?: string
  fields: FeedbackFormField[]
  steps?: FormStep[]
  kind?: FormKind
  showResultsPublic?: boolean
}

export interface FeedbackFormApiResponse {
  feedbackForm: FeedbackFormConfig
}
