export type FeedbackFieldType =
  | 'short_text'
  | 'long_text'
  | 'big_text'
  | 'checkbox'
  | 'radio'
  | 'image_upload'
  | 'name'
  | 'email'
  | 'scale_1_10'
  | 'rating'

export interface FeedbackFormField {
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
}

export type FormKind = 'form' | 'poll' | 'survey'

export interface FeedbackFormConfig {
  _id: string
  title: string
  description?: string
  fields: FeedbackFormField[]
  kind?: FormKind
  showResultsPublic?: boolean
}

export interface FeedbackFormApiResponse {
  feedbackForm: FeedbackFormConfig
}
