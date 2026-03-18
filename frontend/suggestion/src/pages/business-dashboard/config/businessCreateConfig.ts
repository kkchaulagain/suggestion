/**
 * Code-configurable multistep business creation (admin).
 * Extend steps/fields here to change onboarding without DB.
 */

export type CreateFieldType = 'text' | 'textarea' | 'select' | 'email' | 'tel' | 'url'

export interface BusinessCreateFieldConfig {
  name: string
  label: string
  type: CreateFieldType
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  /** Stored on Business document vs customFields */
  storage: 'core' | 'custom'
  /** For custom storage, key in customFields */
  customKey?: string
}

export interface BusinessCreateStepConfig {
  id: string
  title: string
  description?: string
  fields: BusinessCreateFieldConfig[]
}

export const BUSINESS_CREATE_STEPS: BusinessCreateStepConfig[] = [
  {
    id: 'identity',
    title: 'Business identity',
    description: 'Official name and account type.',
    fields: [
      {
        name: 'businessname',
        label: 'Business name',
        type: 'text',
        required: true,
        placeholder: 'e.g. RightDeal Pvt Ltd',
        storage: 'core',
      },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        storage: 'core',
        options: [
          { value: 'commercial', label: 'Commercial' },
          { value: 'personal', label: 'Personal' },
        ],
      },
    ],
  },
  {
    id: 'location_tax',
    title: 'Location & registration',
    description: 'Where you operate and tax identifiers.',
    fields: [
      {
        name: 'location',
        label: 'Location / address',
        type: 'text',
        required: false,
        placeholder: 'City, region',
        storage: 'core',
      },
      {
        name: 'pancardNumber',
        label: 'PAN / tax ID',
        type: 'text',
        required: false,
        placeholder: 'Optional',
        storage: 'core',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact & web',
    description: 'How customers reach you (stored as flexible fields).',
    fields: [
      {
        name: 'contactEmail',
        label: 'Public email',
        type: 'email',
        required: false,
        storage: 'custom',
        customKey: 'contactEmail',
      },
      {
        name: 'contactPhone',
        label: 'Phone',
        type: 'tel',
        required: false,
        storage: 'custom',
        customKey: 'contactPhone',
      },
      {
        name: 'website',
        label: 'Website',
        type: 'url',
        required: false,
        placeholder: 'https://',
        storage: 'custom',
        customKey: 'website',
      },
    ],
  },
  {
    id: 'story',
    title: 'About the business',
    description: 'Short description for listings and public pages.',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'What you offer, hours, etc.',
        storage: 'core',
      },
    ],
  },
]

export function getInitialCreateValues(): Record<string, string> {
  const out: Record<string, string> = { type: 'commercial' }
  for (const step of BUSINESS_CREATE_STEPS) {
    for (const f of step.fields) {
      if (out[f.name] === undefined) {
        out[f.name] = ''
      }
    }
  }
  return out
}

export function validateStep(
  stepIndex: number,
  values: Record<string, string>,
): string | null {
  const step = BUSINESS_CREATE_STEPS[stepIndex]
  if (!step) return null
  for (const f of step.fields) {
    if (!f.required) continue
    const v = (values[f.name] ?? '').trim()
    if (!v) {
      return `${f.label} is required.`
    }
  }
  return null
}

export interface CreateBusinessPayload {
  businessname: string
  description: string
  type: 'commercial' | 'personal'
  location?: string
  pancardNumber?: string
  customFields?: Array<{ key: string; value: string; fieldType: string }>
}

export function valuesToCreatePayload(values: Record<string, string>): CreateBusinessPayload {
  const type =
    values.type === 'personal' || values.type === 'commercial' ? values.type : 'commercial'
  const customFields: Array<{ key: string; value: string; fieldType: string }> = []
  for (const step of BUSINESS_CREATE_STEPS) {
    for (const f of step.fields) {
      if (f.storage !== 'custom' || !f.customKey) continue
      const raw = (values[f.name] ?? '').trim()
      if (!raw) continue
      customFields.push({
        key: f.customKey,
        value: raw,
        fieldType: f.type === 'email' ? 'email' : f.type === 'tel' ? 'phone' : f.type === 'url' ? 'url' : 'text',
      })
    }
  }
  const payload: CreateBusinessPayload = {
    businessname: (values.businessname ?? '').trim(),
    description: (values.description ?? '').trim(),
    type,
  }
  const loc = (values.location ?? '').trim()
  if (loc) payload.location = loc
  const pan = (values.pancardNumber ?? '').trim()
  if (pan) payload.pancardNumber = pan
  if (customFields.length > 0) payload.customFields = customFields
  return payload
}
