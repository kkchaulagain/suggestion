import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Briefcase,
  Bug,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Image,
  ListChecks,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Settings2,
  Star,
  Text,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Modal, Select, Textarea } from '../../../components/ui'
import { EmptyState } from '../../../components/layout'

type FeedbackFieldType = 'checkbox' | 'radio' | 'short_text' | 'long_text' | 'big_text' | 'image_upload' | 'name'

interface FeedbackField {
  clientId?: string
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
}

interface FeedbackFormResponse {
  feedbackForm: {
    title: string
    description?: string
    fields: FeedbackField[]
  }
}

export interface FormTemplate {
  id: string
  label: string
  description: string
  iconName: 'MessageSquare' | 'Calendar' | 'Bug' | 'Briefcase' | 'Star' | 'Mail' | 'CalendarClock' | 'Users'
  title: string
  formDescription: string
  fields: Omit<FeedbackField, 'clientId'>[]
}

const OPTION_TYPES: FeedbackFieldType[] = ['checkbox', 'radio']

const fieldTypeOptions: Array<{ value: FeedbackFieldType; label: string }> = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'big_text', label: 'Paragraph' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'image_upload', label: 'Image Upload' },
  { value: 'name', label: 'Name' },
]

const defaultFields: FeedbackField[] = [
  { clientId: 'default-subject', name: 'subject', label: 'subject', type: 'short_text', required: true, placeholder: '' },
  { clientId: 'default-description', name: 'description', label: 'description', type: 'big_text', required: false, placeholder: '' },
  { clientId: 'default-attachment', name: 'attachment', label: 'attachment', type: 'image_upload', required: false, placeholder: '' },
]

const STAR_RATING_OPTIONS = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']

const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'customer-feedback',
    label: 'Customer Feedback',
    description: 'Collect ratings and comments from customers.',
    iconName: 'MessageSquare',
    title: 'Customer Feedback',
    formDescription: 'We value your feedback. Please take a moment to share your experience.',
    fields: [
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'visit_date', label: 'Visit / service date', type: 'short_text', required: false, placeholder: '' },
      { name: 'overall_rating', label: 'Overall experience', type: 'radio', required: true, options: STAR_RATING_OPTIONS },
      { name: 'enjoyed', label: 'What did you enjoy?', type: 'long_text', required: false, placeholder: '' },
      { name: 'improve', label: 'What could we improve?', type: 'long_text', required: false, placeholder: '' },
      { name: 'would_recommend', label: 'Would you recommend us?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'comments', label: 'Any other comments?', type: 'big_text', required: false, placeholder: '' },
    ],
  },
  {
    id: 'event-registration',
    label: 'Event Registration',
    description: 'Register attendees for workshops and events.',
    iconName: 'Calendar',
    title: 'Event Registration',
    formDescription: 'Register for our event. We will confirm your attendance by email.',
    fields: [
      { name: 'name', label: 'Full name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'organisation', label: 'Organisation / company', type: 'short_text', required: false, placeholder: '' },
      { name: 'event_name', label: 'Event you\'re registering for', type: 'short_text', required: true, placeholder: '' },
      { name: 'attendees_count', label: 'Number of attendees', type: 'short_text', required: true, placeholder: '' },
      { name: 'dietary_requests', label: 'Dietary requirements / special requests', type: 'long_text', required: false, placeholder: '' },
      { name: 'how_heard', label: 'How did you hear about us?', type: 'radio', required: false, options: ['Social Media', 'Friend', 'Email', 'Website', 'Other'] },
      { name: 'supporting_doc', label: 'Upload supporting document', type: 'image_upload', required: false, placeholder: '' },
    ],
  },
  {
    id: 'bug-report',
    label: 'Bug / Issue Report',
    description: 'Report bugs and technical issues.',
    iconName: 'Bug',
    title: 'Bug / Issue Report',
    formDescription: 'Help us improve by describing the issue you encountered.',
    fields: [
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'issue_title', label: 'Issue title', type: 'short_text', required: true, placeholder: '' },
      { name: 'system_area', label: 'Which part of the system?', type: 'short_text', required: false, placeholder: '' },
      { name: 'steps_to_reproduce', label: 'Steps to reproduce', type: 'big_text', required: true, placeholder: '' },
      { name: 'expected', label: 'Expected behaviour', type: 'long_text', required: false, placeholder: '' },
      { name: 'actual', label: 'Actual behaviour', type: 'long_text', required: true, placeholder: '' },
      { name: 'severity', label: 'Severity', type: 'radio', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'screenshot', label: 'Screenshot / attachment', type: 'image_upload', required: false, placeholder: '' },
    ],
  },
  {
    id: 'job-application',
    label: 'Job Application',
    description: 'Collect applications for open positions.',
    iconName: 'Briefcase',
    title: 'Job Application',
    formDescription: 'Apply for this position. We will review your application and get in touch.',
    fields: [
      { name: 'name', label: 'Full name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'position', label: 'Position applied for', type: 'short_text', required: true, placeholder: '' },
      { name: 'experience', label: 'Years of experience', type: 'radio', required: true, options: ['0–1', '1–3', '3–5', '5+'] },
      { name: 'how_heard', label: 'How did you hear about this role?', type: 'radio', required: false, options: ['Website', 'LinkedIn', 'Referral', 'Other'] },
      { name: 'cover_letter', label: 'Cover letter', type: 'big_text', required: true, placeholder: '' },
      { name: 'links', label: 'Portfolio / LinkedIn / GitHub links', type: 'long_text', required: false, placeholder: '' },
      { name: 'resume', label: 'Resume / CV', type: 'image_upload', required: true, placeholder: '' },
    ],
  },
  {
    id: 'product-review',
    label: 'Product Review',
    description: 'Gather product ratings and reviews.',
    iconName: 'Star',
    title: 'Product Review',
    formDescription: 'Share your experience with this product.',
    fields: [
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'product_name', label: 'Product name', type: 'short_text', required: true, placeholder: '' },
      { name: 'rating', label: 'Overall rating', type: 'radio', required: true, options: STAR_RATING_OPTIONS },
      { name: 'liked', label: 'What did you like?', type: 'long_text', required: false, placeholder: '' },
      { name: 'improve', label: 'What could be improved?', type: 'long_text', required: false, placeholder: '' },
      { name: 'buy_again', label: 'Would you buy this again?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'product_photo', label: 'Upload a product photo', type: 'image_upload', required: false, placeholder: '' },
    ],
  },
  {
    id: 'contact-inquiry',
    label: 'Contact / Inquiry',
    description: 'General contact and support inquiries.',
    iconName: 'Mail',
    title: 'Contact / Inquiry',
    formDescription: 'Send us a message. We will respond as soon as possible.',
    fields: [
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'subject', label: 'Subject', type: 'short_text', required: true, placeholder: '' },
      { name: 'inquiry_type', label: 'Inquiry type', type: 'radio', required: true, options: ['General', 'Support', 'Sales', 'Partnership', 'Other'] },
      { name: 'message', label: 'Your message', type: 'big_text', required: true, placeholder: '' },
      { name: 'preferred_contact', label: 'Preferred contact method', type: 'radio', required: false, options: ['Email', 'Phone'] },
      { name: 'best_time', label: 'Best time to contact', type: 'short_text', required: false, placeholder: '' },
    ],
  },
  {
    id: 'appointment-booking',
    label: 'Appointment / Booking',
    description: 'Request appointments and bookings.',
    iconName: 'CalendarClock',
    title: 'Appointment / Booking Request',
    formDescription: 'Request an appointment. We will confirm availability by email or phone.',
    fields: [
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'service', label: 'Service requested', type: 'short_text', required: true, placeholder: '' },
      { name: 'preferred_date', label: 'Preferred date', type: 'short_text', required: true, placeholder: '' },
      { name: 'preferred_time', label: 'Preferred time', type: 'radio', required: true, options: ['Morning', 'Afternoon', 'Evening'] },
      { name: 'alt_date', label: 'Alternative date', type: 'short_text', required: false, placeholder: '' },
      { name: 'notes', label: 'Special requirements / notes', type: 'long_text', required: false, placeholder: '' },
      { name: 'how_found', label: 'How did you find us?', type: 'radio', required: false, options: ['Search', 'Referral', 'Social Media', 'Other'] },
    ],
  },
  {
    id: 'employee-survey',
    label: 'Employee Survey',
    description: 'Internal feedback and satisfaction survey.',
    iconName: 'Users',
    title: 'Employee Survey',
    formDescription: 'Your feedback helps us improve the workplace. All responses are confidential.',
    fields: [
      { name: 'employee_name', label: 'Your name (optional)', type: 'short_text', required: false, placeholder: '' },
      { name: 'department', label: 'Department (optional)', type: 'short_text', required: false, placeholder: '' },
      { name: 'job_satisfaction', label: 'Job satisfaction', type: 'radio', required: true, options: STAR_RATING_OPTIONS },
      { name: 'management', label: 'Management satisfaction', type: 'radio', required: true, options: STAR_RATING_OPTIONS },
      { name: 'work_life_balance', label: 'Work-life balance', type: 'radio', required: true, options: STAR_RATING_OPTIONS },
      { name: 'doing_well', label: 'What are we doing well?', type: 'long_text', required: false, placeholder: '' },
      { name: 'improve', label: 'What could be improved?', type: 'long_text', required: false, placeholder: '' },
      { name: 'recommend', label: 'Would you recommend working here?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'comments', label: 'Additional comments', type: 'big_text', required: false, placeholder: '' },
    ],
  },
]

function makeClientId() {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function toFieldName(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!normalized) return ''
  return /^[a-z]/.test(normalized) ? normalized : `field_${normalized}`
}

function makeDefaultLabel(type: FeedbackFieldType, count: number): string {
  const labels: Record<FeedbackFieldType, string> = {
    short_text: 'Short answer',
    long_text: 'Single line text',
    big_text: 'Paragraph',
    checkbox: 'Checkbox group',
    radio: 'Single choice',
    image_upload: 'Attachment',
    name: 'Name',
  }

  return `${labels[type]} ${count}`
}

function createField(type: FeedbackFieldType, count: number): FeedbackField {
  const label = makeDefaultLabel(type, count)
  return {
    clientId: makeClientId(),
    name: toFieldName(label),
    label,
    type,
    required: false,
    placeholder: '',
    options: OPTION_TYPES.includes(type) ? ['Option 1'] : undefined,
    allowAnonymous: type === 'name' ? false : undefined,
  }
}

function getTypeLabel(type: FeedbackFieldType): string {
  return fieldTypeOptions.find((o) => o.value === type)?.label ?? type
}

function normalizeLoadedFields(fields: FeedbackField[] | undefined): FeedbackField[] {
  return fields?.length
    ? fields.map((field, index) => ({
        ...field,
        clientId: field.clientId || `loaded-${index}-${field.name}`,
      }))
    : defaultFields
}

/** Serialize fields for dirty check (ignore clientId). */
function serializeFieldsForDirty(fields: FeedbackField[]): string {
  return JSON.stringify(
    fields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      required: f.required,
      placeholder: f.placeholder ?? '',
      options: f.options ?? [],
      allowAnonymous: f.allowAnonymous ?? false,
    })),
  )
}

function templateFieldsWithClientIds(templateId: string, fields: FormTemplate['fields']): FeedbackField[] {
  return fields.map((f, i) => ({ ...f, clientId: `template-${templateId}-${i}` }))
}

const TEMPLATE_ICONS: Record<FormTemplate['iconName'], React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Calendar,
  Bug,
  Briefcase,
  Star,
  Mail,
  CalendarClock,
  Users,
}

function getFieldClientId(field: FeedbackField, index: number): string {
  return field.clientId ?? `${field.name || 'field'}-${index}`
}

interface SortableFieldRowProps {
  field: FeedbackField
  index: number
  isEditing: boolean
  showDropIndicator: boolean
  showAdvancedOptions: boolean
  onToggleEdit: (clientId: string) => void
  onRemoveField: (clientId: string) => void
  onFieldLabelChange: (clientId: string, value: string) => void
  onFieldTypeChange: (clientId: string, type: FeedbackFieldType) => void
  onFieldRequiredChange: (clientId: string, required: boolean) => void
  onAddOption: (clientId: string) => void
  onOptionChange: (clientId: string, optionIndex: number, value: string) => void
  onRemoveOption: (clientId: string, optionIndex: number) => void
  onToggleAdvancedOptions: () => void
  onFieldNameChange: (clientId: string, value: string) => void
  onFieldPlaceholderChange: (clientId: string, value: string) => void
}

function SortableFieldRow({
  field,
  index,
  isEditing,
  showDropIndicator,
  showAdvancedOptions,
  onToggleEdit,
  onRemoveField,
  onFieldLabelChange,
  onFieldTypeChange,
  onFieldRequiredChange,
  onAddOption,
  onOptionChange,
  onRemoveOption,
  onToggleAdvancedOptions,
  onFieldNameChange,
  onFieldPlaceholderChange,
}: SortableFieldRowProps) {
  const fieldId = getFieldClientId(field, index)
  const isOptionType = OPTION_TYPES.includes(field.type)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fieldId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative border-b border-slate-200 py-4 first:pt-0 last:border-b-0 dark:border-slate-700 ${isDragging ? 'opacity-70' : ''}`}
      data-field-row
    >
      {showDropIndicator ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded bg-emerald-500"
        />
      ) : null}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-md px-1 py-1 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        aria-label={`Move field: ${field.label || 'Untitled'}`}
        {...attributes}
        {...listeners}
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{field.label}</span>
          {field.required ? <span className="ml-1 text-rose-600 dark:text-rose-400" aria-hidden>*</span> : null}
          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{getTypeLabel(field.type)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700"
            onClick={() => onToggleEdit(fieldId)}
            aria-expanded={isEditing}
            aria-controls={isEditing ? `field-edit-${index}` : undefined}
          >
            <Pencil className="h-3.5 w-3.5" />
            {isEditing ? 'Close' : 'Edit'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-0 rounded px-2 py-1 text-xs font-medium !text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-950/40"
            onClick={() => onRemoveField(fieldId)}
            aria-label={`Remove field: ${field.label || 'Untitled'}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div id={`field-edit-${index}`} className="mt-3 space-y-4 pl-0" role="region" aria-label="Edit field">
          <Input
            id={`field-label-${index}`}
            label="Label"
            value={field.label}
            onChange={(value) => onFieldLabelChange(fieldId, value)}
            placeholder="Field label"
          />
          <Select
            id={`field-type-${index}`}
            label="Type"
            value={field.type}
            onChange={(value) => onFieldTypeChange(fieldId, value as FeedbackFieldType)}
            options={fieldTypeOptions}
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(event) => onFieldRequiredChange(fieldId, event.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
            />
            Required field
          </label>

          {isOptionType ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Options</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => onAddOption(fieldId)}>
                  <Plus className="h-4 w-4" />
                  Add option
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {(field.options ?? []).map((option, optionIndex) => (
                  <div key={`${field.name}-${optionIndex}`} className="flex items-center gap-2">
                    <Input
                      id={`field-option-${index}-${optionIndex}`}
                      value={option}
                      onChange={(value) => onOptionChange(fieldId, optionIndex, value)}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveOption(fieldId, optionIndex)}
                      aria-label={`Remove option ${optionIndex + 1}`}
                      className="!text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
            <button
              type="button"
              onClick={onToggleAdvancedOptions}
              className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-slate-600 dark:text-slate-400"
              aria-expanded={showAdvancedOptions}
            >
              More options
              {showAdvancedOptions ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>
            {showAdvancedOptions ? (
              <div className="mt-3 space-y-3">
                <div>
                  <Input
                    id={`field-name-${index}`}
                    label="Field name"
                    value={field.name}
                    onChange={(value) => onFieldNameChange(fieldId, value)}
                    placeholder="field_name"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Used in data export. Usually auto-filled from the label.
                  </p>
                </div>
                <div>
                  <Input
                    id={`field-placeholder-${index}`}
                    label="Placeholder"
                    value={field.placeholder ?? ''}
                    onChange={(value) => onFieldPlaceholderChange(fieldId, value)}
                    placeholder="Optional helper text"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Shown when the field is empty. Leave blank if not needed.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function CreateFormPage() {
  const navigate = useNavigate()
  const { formId } = useParams<{ formId: string }>()
  const isEditMode = Boolean(formId)

  const [step, setStep] = useState<'select' | 'build'>(isEditMode ? 'build' : 'select')
  const [title, setTitle] = useState('Feedback form')
  const [description, setDescription] = useState('test')
  const [fields, setFields] = useState<FeedbackField[]>(defaultFields)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null)
  const [overFieldId, setOverFieldId] = useState<string | null>(null)

  const initialSnapshotRef = useRef<{ title: string; description: string; fieldsKey: string } | null>(null)
  const initialFieldOrderRef = useRef<string[]>(defaultFields.map((field, index) => getFieldClientId(field, index)))
  const { getAuthHeaders } = useAuth()
  const getAuthHeadersRef = useRef(getAuthHeaders)
  getAuthHeadersRef.current = getAuthHeaders

  const isDirty =
    initialSnapshotRef.current !== null &&
    (title !== initialSnapshotRef.current.title ||
      description !== initialSnapshotRef.current.description ||
      serializeFieldsForDirty(fields) !== initialSnapshotRef.current.fieldsKey)

  const handleSelectTemplate = (template: FormTemplate | null) => {
    if (template) {
      const nextFields = templateFieldsWithClientIds(template.id, template.fields)
      setTitle(template.title)
      setDescription(template.formDescription)
      setFields(nextFields)
      initialFieldOrderRef.current = nextFields.map((field, index) => getFieldClientId(field, index))
      initialSnapshotRef.current = {
        title: template.title,
        description: template.formDescription,
        fieldsKey: serializeFieldsForDirty(nextFields),
      }
    } else {
      setTitle('Feedback form')
      setDescription('test')
      setFields(defaultFields)
      initialFieldOrderRef.current = defaultFields.map((field, index) => getFieldClientId(field, index))
      initialSnapshotRef.current = {
        title: 'Feedback form',
        description: 'test',
        fieldsKey: serializeFieldsForDirty(defaultFields),
      }
    }
    setEditingFieldId(null)
    setShowAdvancedOptions(false)
    setError('')
    setStep('build')
  }

  useEffect(() => {
    if (!isEditMode || !formId) return

    let active = true

    const loadForm = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await axios.get<FeedbackFormResponse>(`${feedbackFormsApi}/${formId}`, {
          withCredentials: true,
          headers: getAuthHeadersRef.current(),
        })
        if (!active) return
        const loadedTitle = data.feedbackForm.title || 'Feedback form'
        const loadedDescription = data.feedbackForm.description ?? ''
        const loadedFields = normalizeLoadedFields(data.feedbackForm.fields)
        setTitle(loadedTitle)
        setDescription(loadedDescription)
        setFields(loadedFields)
        initialFieldOrderRef.current = loadedFields.map((field, index) => getFieldClientId(field, index))
        setEditingFieldId(null)
        initialSnapshotRef.current = {
          title: loadedTitle,
          description: loadedDescription,
          fieldsKey: serializeFieldsForDirty(loadedFields),
        }
      } catch (err: unknown) {
        if (!active) return
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        setError(msg || 'Failed to load form.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadForm()

    return () => {
      active = false
    }
  }, [formId, isEditMode])

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const updateField = (fieldId: string, updater: (field: FeedbackField) => FeedbackField) => {
    setFields((current) =>
      current.map((field, fieldIndex) => (getFieldClientId(field, fieldIndex) === fieldId ? updater(field) : field)),
    )
  }

  const handleFieldLabelChange = (fieldId: string, value: string) => {
    updateField(fieldId, (field) => {
      const autoName = toFieldName(field.label)
      const nextName = field.name === autoName ? toFieldName(value) : field.name
      return { ...field, label: value, name: nextName }
    })
    setError('')
  }

  const handleFieldNameChange = (fieldId: string, value: string) => {
    updateField(fieldId, (field) => ({ ...field, name: toFieldName(value) }))
    setError('')
  }

  const handleFieldTypeChange = (fieldId: string, type: FeedbackFieldType) => {
    updateField(fieldId, (field) => ({
      ...field,
      type,
      options: OPTION_TYPES.includes(type) ? (field.options?.length ? field.options : ['Option 1']) : undefined,
      allowAnonymous: type === 'name' ? (field.allowAnonymous ?? false) : undefined,
    }))
    setError('')
  }

  const handleFieldPlaceholderChange = (fieldId: string, value: string) => {
    updateField(fieldId, (field) => ({ ...field, placeholder: value }))
  }

  const handleFieldRequiredChange = (fieldId: string, required: boolean) => {
    updateField(fieldId, (field) => ({ ...field, required }))
  }

  const handleAddField = (type: FeedbackFieldType) => {
    setFields((current) => {
      const nextField = createField(type, current.length + 1)
      const next = [...current, nextField]
      setEditingFieldId(nextField.clientId ?? null)
      return next
    })
    setError('')
  }

  const handleRemoveField = (fieldId: string) => {
    setFields((current) =>
      current.filter((field, fieldIndex) => getFieldClientId(field, fieldIndex) !== fieldId),
    )
    setEditingFieldId((current) => (current === fieldId ? null : current))
    setError('')
  }

  const handleAddOption = (fieldId: string) => {
    updateField(fieldId, (field) => ({
      ...field,
      options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`],
    }))
  }

  const handleOptionChange = (fieldId: string, optionIndex: number, value: string) => {
    updateField(fieldId, (field) => ({
      ...field,
      options: (field.options ?? []).map((option, currentIndex) => (currentIndex === optionIndex ? value : option)),
    }))
  }

  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    updateField(fieldId, (field) => ({
      ...field,
      options: (field.options ?? []).filter((_, currentIndex) => currentIndex !== optionIndex),
    }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id)
    setDraggingFieldId(activeId)
    setOverFieldId(activeId)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverFieldId(event.over ? String(event.over.id) : null)
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const edgeThreshold = 96
    const scrollStep = 18
    const activatorEvent = event.activatorEvent

    let clientY: number | null = null

    if ('clientY' in activatorEvent && typeof activatorEvent.clientY === 'number') {
      clientY = activatorEvent.clientY
    } else if ('touches' in activatorEvent && activatorEvent.touches.length > 0) {
      clientY = activatorEvent.touches[0]?.clientY ?? null
    }

    if (clientY === null) return

    if (clientY < edgeThreshold) {
      window.scrollBy({ top: -scrollStep, behavior: 'auto' })
    } else if (clientY > window.innerHeight - edgeThreshold) {
      window.scrollBy({ top: scrollStep, behavior: 'auto' })
    }
  }

  const handleDragCancel = () => {
    setDraggingFieldId(null)
    setOverFieldId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      setDraggingFieldId(null)
      setOverFieldId(null)
      return
    }

    setFields((current) => {
      const oldIndex = current.findIndex((field, index) => getFieldClientId(field, index) === String(active.id))
      const newIndex = current.findIndex((field, index) => getFieldClientId(field, index) === String(over.id))
      if (oldIndex === -1 || newIndex === -1) return current
      return arrayMove(current, oldIndex, newIndex)
    })

    setDraggingFieldId(null)
    setOverFieldId(null)
  }

  const currentFieldOrder = fields.map((field, index) => getFieldClientId(field, index))
  const baselineOrder = initialFieldOrderRef.current
  const baselineOrderSet = new Set(baselineOrder)
  const currentComparableOrder = currentFieldOrder.filter((id) => baselineOrderSet.has(id))
  const canResetOrder =
    baselineOrder.length > 0 && currentComparableOrder.join('|') !== baselineOrder.join('|')

  const handleResetFieldOrder = () => {
    const baseline = initialFieldOrderRef.current
    const baselineSet = new Set(baseline)

    setFields((current) => {
      const byId = new Map(current.map((field, index) => [getFieldClientId(field, index), field] as const))
      const resetOrdered = baseline.map((id) => byId.get(id)).filter((field): field is FeedbackField => Boolean(field))
      const leftovers = current.filter((field, index) => !baselineSet.has(getFieldClientId(field, index)))
      return [...resetOrdered, ...leftovers]
    })

    setDraggingFieldId(null)
    setOverFieldId(null)
  }

  const validateFields = () => {
    if (!title.trim()) return 'Form title is required.'

    const seenNames = new Set<string>()

    for (const field of fields) {
      const normalizedName = toFieldName(field.name || field.label)
      if (!field.label.trim() || !normalizedName) {
        return 'Each field needs a label and valid field name.'
      }

      if (seenNames.has(normalizedName.toLowerCase())) {
        return 'Field name must be unique inside the form.'
      }
      seenNames.add(normalizedName.toLowerCase())

      if (OPTION_TYPES.includes(field.type)) {
        const validOptions = (field.options ?? []).map((option) => option.trim()).filter(Boolean)
        if (validOptions.length === 0) {
          return 'Checkbox and radio fields need at least one option.'
        }
      }
    }

    return ''
  }

  const handleSaveForm = async () => {
    const validationError = validateFields()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      fields: fields.map((field) => ({
        name: toFieldName(field.name || field.label),
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        placeholder: field.placeholder?.trim() || undefined,
        options: OPTION_TYPES.includes(field.type)
          ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
          : undefined,
        allowAnonymous: field.type === 'name' ? (field.allowAnonymous ?? false) : undefined,
      })),
    }

    try {
      setSubmitting(true)
      setError('')
      if (isEditMode && formId) {
        await axios.put(`${feedbackFormsApi}/${formId}`, payload, {
          withCredentials: true,
          headers: getAuthHeaders(),
        })
      } else {
        await axios.post(feedbackFormsApi, payload, {
          withCredentials: true,
          headers: getAuthHeaders(),
        })
      }
      navigate('/dashboard/forms')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || `Failed to ${isEditMode ? 'update' : 'save'} form.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <EmptyState type="loading" message="Loading form..." />
      </div>
    )
  }

  const handleBackClick = () => {
    if (isDirty) {
      setShowLeaveConfirm(true)
    } else if (isEditMode) {
      navigate('/dashboard/forms')
    } else {
      setStep('select')
    }
  }

  const handleLeaveConfirm = () => {
    setShowLeaveConfirm(false)
    navigate('/dashboard/forms')
  }

  const backClass =
    'inline-flex items-center gap-1 rounded border border-slate-200 bg-transparent px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'

  if (step === 'select') {
    return (
      <section className="mx-auto max-w-4xl" aria-label="Choose form template">
        <div className="mb-4 flex justify-start">
          <Link to="/dashboard/forms" className={backClass}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
        <Card className="rounded-xl sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Choose a template</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Start with a pre-built form or configure your own from scratch.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FORM_TEMPLATES.map((template) => {
              const Icon = TEMPLATE_ICONS[template.iconName]
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelectTemplate(template)}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20"
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{template.label}</span>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{template.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleSelectTemplate(null)}
              className="w-full sm:w-auto"
            >
              <Settings2 className="h-4 w-4" />
              Configure my own
            </Button>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-4 flex justify-start">
        <button type="button" onClick={handleBackClick} className={backClass}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      <Card className="rounded-xl sm:p-8">
        <div className="space-y-4">
          <Input id="form-title" label="Form title" value={title} onChange={setTitle} placeholder="Feedback form" />
          <Textarea
            id="form-description"
            label="Form description"
            value={description}
            onChange={setDescription}
            placeholder="Briefly describe this form"
            rows={3}
          />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveForm()
          }}
          className="mt-6 space-y-5"
          noValidate
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragMove={handleDragMove}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((field, index) => getFieldClientId(field, index))}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field, index) => {
                const fieldId = getFieldClientId(field, index)
                const isEditing = editingFieldId === fieldId
                const showDropIndicator = Boolean(draggingFieldId && overFieldId === fieldId && draggingFieldId !== fieldId)

                return (
                  <SortableFieldRow
                    key={fieldId}
                    field={field}
                    index={index}
                    isEditing={isEditing}
                    showDropIndicator={showDropIndicator}
                    showAdvancedOptions={showAdvancedOptions}
                    onToggleEdit={(clientId) => {
                      setEditingFieldId((current) => (current === clientId ? null : clientId))
                      setShowAdvancedOptions(false)
                    }}
                    onRemoveField={handleRemoveField}
                    onFieldLabelChange={handleFieldLabelChange}
                    onFieldTypeChange={handleFieldTypeChange}
                    onFieldRequiredChange={handleFieldRequiredChange}
                    onAddOption={handleAddOption}
                    onOptionChange={handleOptionChange}
                    onRemoveOption={handleRemoveOption}
                    onToggleAdvancedOptions={() => setShowAdvancedOptions((v) => !v)}
                    onFieldNameChange={handleFieldNameChange}
                    onFieldPlaceholderChange={handleFieldPlaceholderChange}
                  />
                )
              })}
            </SortableContext>
          </DndContext>

          <div className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
            Drag fields with the grip handle to reorder.
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddFieldModal(true)}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              + Add new field
            </button>
            <button
              type="button"
              onClick={handleResetFieldOrder}
              disabled={!canResetOrder}
              className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Reset to original order
            </button>
          </div>

          {showAddFieldModal ? (
            <Modal
              isOpen
              onClose={() => setShowAddFieldModal(false)}
              title="Add new field"
              size="md"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {fieldTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      handleAddField(opt.value)
                      setShowAddFieldModal(false)
                    }}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-600 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20"
                  >
                    {opt.value === 'short_text' || opt.value === 'long_text' ? (
                      <Text className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                    ) : opt.value === 'big_text' ? (
                      <Text className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                    ) : opt.value === 'checkbox' || opt.value === 'radio' ? (
                      <ListChecks className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                    ) : opt.value === 'name' ? (
                      <User className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                    ) : (
                      <Image className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{opt.label}</span>
                  </button>
                ))}
              </div>
            </Modal>
          ) : null}

          {error ? <ErrorMessage message={error} /> : null}

          <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
            <Send className="h-4 w-4" />
            {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : isEditMode ? 'Update Form' : 'Save Form'}
          </Button>
        </form>
      </Card>

      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Unsaved changes"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You have unsaved changes. Leave anyway? Your changes will be lost.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setShowLeaveConfirm(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={handleLeaveConfirm}
            className="flex-1"
          >
            Leave
          </Button>
        </div>
      </Modal>
    </section>
  )
}
