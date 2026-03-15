export interface ResultOption {
  option: string
  count: number
  percentage: number
}

export interface ChoiceFieldResult {
  label: string
  type: 'radio' | 'checkbox' | 'scale_1_10' | 'scale' | 'rating'
  options: ResultOption[]
}

export interface TextFieldResult {
  label: string
  type: string
  responseCount: number
  sampleAnswers?: string[]
}

export type FieldResult = ChoiceFieldResult | TextFieldResult

export function isChoiceFieldResult(
  r: FieldResult
): r is ChoiceFieldResult {
  return 'options' in r && Array.isArray((r as ChoiceFieldResult).options)
}

export interface ResponsesOverTimeItem {
  date: string
  count: number
}

export interface FormResultsData {
  formId: string
  formTitle: string
  totalResponses: number
  byField: Record<string, ChoiceFieldResult | TextFieldResult>
  responsesOverTime?: ResponsesOverTimeItem[]
}
