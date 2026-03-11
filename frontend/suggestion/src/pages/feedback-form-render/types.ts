export type FeedbackFieldType =
  | 'short_text'
  | 'long_text'
  | 'big_text'
  | 'checkbox'
  | 'radio'
  | 'image_upload'
  | 'name'

export interface FeedbackFormField {
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
}

export interface FeedbackFormConfig {
  _id: string
  title: string
  description?: string
  fields: FeedbackFormField[]
}

export interface FeedbackFormApiResponse {
  feedbackForm: FeedbackFormConfig
}
