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
  useDroppable,
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
  BarChart2,
  Briefcase,
  Bug,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Eye,
  GripVertical,
  Hash,
  Heart,
  Image,
  Link as LinkIcon,
  ListChecks,
  Mail,
  MessageSquare,
  Newspaper,
  PartyPopper,
  Pencil,
  Phone,
  Plus,
  Send,
  Settings2,
  ShoppingCart,
  Smile,
  Star,
  Text,
  Trash2,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Modal, Select, Switch, Textarea } from '../../../components/ui'
import { EmptyState } from '../../../components/layout'
import { type FormKind, type FormTemplate, FORM_TEMPLATES, FORM_TEMPLATE_CATEGORIES } from './formTemplates'

export type { FormKind, FormTemplate }

type FeedbackFieldType =
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
  | 'scale_emoji'
  | 'rating'
  | 'image'

interface FormStep {
  id: string
  title: string
  description?: string
  order: number
}

interface FeedbackField {
  clientId?: string
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
  stepId?: string
  stepOrder?: number
}

type FormStyle = 'default' | 'drawer'

interface FeedbackFormResponse {
  feedbackForm: {
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
    fields: FeedbackField[]
    steps?: FormStep[]
    kind?: FormKind
    formStyle?: FormStyle
    drawerDefaultOpen?: boolean
    showResultsPublic?: boolean
  }
}

const OPTION_TYPES: FeedbackFieldType[] = ['checkbox', 'radio', 'dropdown']
const TYPES_WITH_OPTIONS: FeedbackFieldType[] = ['checkbox', 'radio', 'dropdown', 'scale', 'scale_emoji', 'rating']

const SCALE_1_10_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const EMOJI_SCALE_OPTIONS = ['2', '4', '6', '8', '10']
const STAR_RATING_OPTIONS = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']

interface FieldTypeGroup {
  label: string
  types: Array<{ value: FeedbackFieldType; label: string; icon: React.ComponentType<{ className?: string }> }>
}

const fieldTypeGroups: FieldTypeGroup[] = [
  {
    label: 'Contact',
    types: [
      { value: 'text', label: 'Text (Name)', icon: User },
      { value: 'email', label: 'Email', icon: Mail },
      { value: 'phone', label: 'Phone', icon: Phone },
    ],
  },
  {
    label: 'Text',
    types: [
      { value: 'text', label: 'Text', icon: Text },
      { value: 'textarea', label: 'Paragraph', icon: Text },
    ],
  },
  {
    label: 'Choice',
    types: [
      { value: 'radio', label: 'Radio', icon: ListChecks },
      { value: 'checkbox', label: 'Checkbox', icon: ListChecks },
      { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
    ],
  },
  {
    label: 'Rating',
    types: [
      { value: 'rating', label: 'Star Rating', icon: Star },
      { value: 'scale', label: 'Scale 1–10', icon: BarChart2 },
      { value: 'scale_emoji', label: 'Emoji scale', icon: Smile },
    ],
  },
  {
    label: 'Date & Time',
    types: [
      { value: 'date', label: 'Date', icon: Calendar },
      { value: 'time', label: 'Time', icon: Clock },
    ],
  },
  {
    label: 'Other',
    types: [
      { value: 'number', label: 'Number', icon: Hash },
      { value: 'url', label: 'URL', icon: LinkIcon },
      { value: 'image', label: 'Image Upload', icon: Image },
    ],
  },
]

const fieldTypeOptions: Array<{ value: FeedbackFieldType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'url', label: 'URL' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'scale', label: 'Scale 1–10' },
  { value: 'scale_emoji', label: 'Emoji scale' },
  { value: 'rating', label: 'Rating (stars)' },
  { value: 'image', label: 'Image Upload' },
]

const defaultFields: FeedbackField[] = [
  { clientId: 'default-subject', name: 'subject', label: 'subject', type: 'text', required: true, placeholder: '' },
  { clientId: 'default-description', name: 'description', label: 'description', type: 'textarea', required: false, placeholder: '' },
  { clientId: 'default-attachment', name: 'attachment', label: 'attachment', type: 'image', required: false, placeholder: '' },
]

function makeClientId() {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function makeStepId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
    text: 'Text field',
    textarea: 'Paragraph',
    email: 'Email',
    phone: 'Phone',
    number: 'Number',
    date: 'Date',
    time: 'Time',
    url: 'URL',
    checkbox: 'Checkbox group',
    radio: 'Single choice',
    dropdown: 'Dropdown',
    scale: 'Your rating',
    scale_emoji: 'How was it?',
    rating: 'Rating',
    image: 'Attachment',
  }
  return `${labels[type]} ${count}`
}

function createField(type: FeedbackFieldType, count: number, stepId?: string): FeedbackField {
  const label = makeDefaultLabel(type, count)
  const options =
    type === 'scale'
      ? [...SCALE_1_10_OPTIONS]
      : type === 'scale_emoji'
        ? [...EMOJI_SCALE_OPTIONS]
        : type === 'rating'
          ? [...STAR_RATING_OPTIONS]
          : OPTION_TYPES.includes(type)
            ? ['Option 1']
            : undefined
  return {
    clientId: makeClientId(),
    name: toFieldName(label),
    label,
    type,
    required: false,
    placeholder: '',
    options,
    allowAnonymous: type === 'text' ? false : undefined,
    stepId,
  }
}

function getTypeLabel(type: FeedbackFieldType): string {
  return fieldTypeOptions.find((o) => o.value === type)?.label ?? type
}

function normalizeLoadedFields(fields: FeedbackField[] | undefined): FeedbackField[] {
  return fields?.length
    ? fields.map((field, index) => {
        const base = { ...field, clientId: field.clientId || `loaded-${index}-${field.name}` }
        if (field.type === 'scale') return { ...base, options: [...SCALE_1_10_OPTIONS] }
        if (field.type === 'scale_emoji') return { ...base, options: [...EMOJI_SCALE_OPTIONS] }
        if (field.type === 'rating') return { ...base, options: [...STAR_RATING_OPTIONS] }
        return base
      })
    : defaultFields
}

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
      stepId: f.stepId ?? '',
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
  BarChart2,
  ListChecks,
  ClipboardList,
  UtensilsCrossed,
  Heart,
  PartyPopper,
  ShoppingCart,
  Newspaper,
}

function getFieldClientId(field: FeedbackField, index: number): string {
  return field.clientId ?? `${field.name || 'field'}-${index}`
}

const STEP_DROP_PREFIX = 'step-drop:'

function StepDroppable({
  stepId,
  children,
  className = '',
}: {
  stepId: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: STEP_DROP_PREFIX + stepId })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] rounded-md transition-colors ${isOver ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

interface SortableFieldRowProps {
  field: FeedbackField
  index: number
  isEditing: boolean
  showDropIndicator: boolean
  showAdvancedOptions: boolean
  steps: FormStep[]
  onToggleEdit: (clientId: string) => void
  onRemoveField: (clientId: string) => void
  onFieldLabelChange: (clientId: string, value: string) => void
  onFieldTypeChange: (clientId: string, type: FeedbackFieldType) => void
  onFieldRequiredChange: (clientId: string, required: boolean) => void
  onFieldAllowAnonymousChange: (clientId: string, allowAnonymous: boolean) => void
  onAddOption: (clientId: string) => void
  onOptionChange: (clientId: string, optionIndex: number, value: string) => void
  onRemoveOption: (clientId: string, optionIndex: number) => void
  onToggleAdvancedOptions: () => void
  onFieldNameChange: (clientId: string, value: string) => void
  onFieldPlaceholderChange: (clientId: string, value: string) => void
  onFieldStepChange: (clientId: string, stepId: string) => void
}

function SortableFieldRow({
  field,
  index,
  isEditing,
  showDropIndicator,
  showAdvancedOptions,
  steps,
  onToggleEdit,
  onRemoveField,
  onFieldLabelChange,
  onFieldTypeChange,
  onFieldRequiredChange,
  onFieldAllowAnonymousChange,
  onAddOption,
  onOptionChange,
  onRemoveOption,
  onToggleAdvancedOptions,
  onFieldNameChange,
  onFieldPlaceholderChange,
  onFieldStepChange,
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md px-1 py-1">
        <span
          className={`flex shrink-0 touch-none cursor-grab self-stretch items-center rounded px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300 ${isDragging ? 'cursor-grabbing' : ''}`}
          aria-label={`Drag to reorder: ${field.label || 'Untitled'}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </span>
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
          {steps.length > 0 ? (
            <Select
              id={`field-step-${index}`}
              label="Step"
              value={field.stepId ?? ''}
              onChange={(value) => onFieldStepChange(fieldId, value)}
              options={steps.map((s) => ({ value: s.id, label: s.title || `Step ${s.order + 1}` }))}
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            <label className={`inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${
              field.allowAnonymous ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={field.required}
                onChange={(event) => onFieldRequiredChange(fieldId, event.target.checked)}
                disabled={field.allowAnonymous}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 dark:border-slate-600"
              />
              Required field
            </label>

            {field.type === 'text' && field.allowAnonymous !== undefined ? (
              <label className={`inline-flex cursor-pointer items-center gap-2 text-sm font-medium ${
                field.required ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={field.allowAnonymous ?? false}
                  onChange={(event) => onFieldAllowAnonymousChange(fieldId, event.target.checked)}
                  disabled={field.required}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 dark:border-slate-600"
                />
                Allow anonymous
              </label>
            ) : null}
          </div>

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
  const [formSteps, setFormSteps] = useState<FormStep[]>([])
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null)
  const [overFieldId, setOverFieldId] = useState<string | null>(null)
  const [formKind, setFormKind] = useState<FormKind>('form')
  const [showResultsPublic, setShowResultsPublic] = useState(false)
  const [formStyle, setFormStyle] = useState<FormStyle>('default')
  const [drawerDefaultOpen, setDrawerDefaultOpen] = useState(true)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [showFormDetailsAdvanced, setShowFormDetailsAdvanced] = useState(false)
  const [landingHeadline, setLandingHeadline] = useState('')
  const [landingDescription, setLandingDescription] = useState('')
  const [landingCtaText, setLandingCtaText] = useState('')
  const [landingEmoji, setLandingEmoji] = useState('')
  const [thankYouHeadline, setThankYouHeadline] = useState('')
  const [thankYouMessage, setThankYouMessage] = useState('')

  const initialSnapshotRef = useRef<{ title: string; description: string; metaTitle: string; metaDescription: string; fieldsKey: string; showResultsPublic: boolean; formStyle: FormStyle; drawerDefaultOpen: boolean } | null>(null)
  const initialFieldOrderRef = useRef<string[]>(defaultFields.map((field, index) => getFieldClientId(field, index)))
  const { getAuthHeaders } = useAuth()
  const getAuthHeadersRef = useRef(getAuthHeaders)
  getAuthHeadersRef.current = getAuthHeaders

  const isDirty =
    initialSnapshotRef.current !== null &&
    (title !== initialSnapshotRef.current.title ||
      description !== initialSnapshotRef.current.description ||
      metaTitle !== initialSnapshotRef.current.metaTitle ||
      metaDescription !== initialSnapshotRef.current.metaDescription ||
      serializeFieldsForDirty(fields) !== initialSnapshotRef.current.fieldsKey ||
      showResultsPublic !== initialSnapshotRef.current.showResultsPublic ||
      formStyle !== initialSnapshotRef.current.formStyle ||
      drawerDefaultOpen !== initialSnapshotRef.current.drawerDefaultOpen)

  const handleSelectTemplate = (template: FormTemplate | null) => {
    if (template) {
      const nextFields = templateFieldsWithClientIds(template.id, template.fields)
      const nextSteps = template.steps ?? []
      setTitle(template.title)
      setDescription(template.formDescription)
      setFields(nextFields)
      setFormSteps(nextSteps)
      setFormKind(template.kind ?? 'form')
      setShowResultsPublic(false)
      setFormStyle('default')
      setDrawerDefaultOpen(true)
      initialFieldOrderRef.current = nextFields.map((field, index) => getFieldClientId(field, index))
      initialSnapshotRef.current = {
        title: template.title,
        description: template.formDescription,
        metaTitle: '',
        metaDescription: '',
        fieldsKey: serializeFieldsForDirty(nextFields),
        showResultsPublic: false,
        formStyle: 'default',
        drawerDefaultOpen: true,
      }
    } else {
      setTitle('Feedback form')
      setDescription('test')
      setMetaTitle('')
      setMetaDescription('')
      setFields(defaultFields)
      setFormSteps([])
      setFormKind('form')
      setShowResultsPublic(false)
      setFormStyle('default')
      setDrawerDefaultOpen(true)
      initialFieldOrderRef.current = defaultFields.map((field, index) => getFieldClientId(field, index))
      initialSnapshotRef.current = {
        title: 'Feedback form',
        description: 'test',
        metaTitle: '',
        metaDescription: '',
        fieldsKey: serializeFieldsForDirty(defaultFields),
        showResultsPublic: false,
        formStyle: 'default',
        drawerDefaultOpen: true,
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
        const loadedMetaTitle = data.feedbackForm.metaTitle ?? ''
        const loadedMetaDescription = data.feedbackForm.metaDescription ?? ''
        const loadedLandingHeadline = data.feedbackForm.landingHeadline ?? ''
        const loadedLandingDescription = data.feedbackForm.landingDescription ?? ''
        const loadedLandingCtaText = data.feedbackForm.landingCtaText ?? ''
        const loadedLandingEmoji = data.feedbackForm.landingEmoji ?? ''
        const loadedThankYouHeadline = data.feedbackForm.thankYouHeadline ?? ''
        const loadedThankYouMessage = data.feedbackForm.thankYouMessage ?? ''
        const loadedFields = normalizeLoadedFields(data.feedbackForm.fields)
        const loadedKind = data.feedbackForm.kind ?? 'form'
        const loadedShowResultsPublic = data.feedbackForm.showResultsPublic ?? false
        const loadedFormStyle = (data.feedbackForm.formStyle === 'drawer' ? 'drawer' : 'default') as FormStyle
        const loadedDrawerDefaultOpen = data.feedbackForm.drawerDefaultOpen !== false
        const loadedSteps = data.feedbackForm.steps ?? []
        setTitle(loadedTitle)
        setDescription(loadedDescription)
        setMetaTitle(loadedMetaTitle)
        setMetaDescription(loadedMetaDescription)
        setLandingHeadline(loadedLandingHeadline)
        setLandingDescription(loadedLandingDescription)
        setLandingCtaText(loadedLandingCtaText)
        setLandingEmoji(loadedLandingEmoji)
        setThankYouHeadline(loadedThankYouHeadline)
        setThankYouMessage(loadedThankYouMessage)
        setFields(loadedFields)
        setFormSteps(loadedSteps)
        setFormKind(loadedKind)
        setShowResultsPublic(loadedShowResultsPublic)
        setFormStyle(loadedFormStyle)
        setDrawerDefaultOpen(loadedDrawerDefaultOpen)
        initialFieldOrderRef.current = loadedFields.map((field, index) => getFieldClientId(field, index))
        setEditingFieldId(null)
        initialSnapshotRef.current = {
          title: loadedTitle,
          description: loadedDescription,
          metaTitle: loadedMetaTitle,
          metaDescription: loadedMetaDescription,
          fieldsKey: serializeFieldsForDirty(loadedFields),
          showResultsPublic: loadedShowResultsPublic,
          formStyle: loadedFormStyle,
          drawerDefaultOpen: loadedDrawerDefaultOpen,
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
    updateField(fieldId, (field) => {
      const options =
        type === 'scale'
          ? [...SCALE_1_10_OPTIONS]
          : type === 'scale_emoji'
            ? [...EMOJI_SCALE_OPTIONS]
            : type === 'rating'
              ? [...STAR_RATING_OPTIONS]
              : OPTION_TYPES.includes(type)
                ? (field.options?.length ? field.options : ['Option 1'])
                : undefined
      return {
        ...field,
        type,
        options,
        allowAnonymous: type === 'text' ? (field.allowAnonymous ?? false) : undefined,
      }
    })
    setError('')
  }

  const handleFieldPlaceholderChange = (fieldId: string, value: string) => {
    updateField(fieldId, (field) => ({ ...field, placeholder: value }))
  }

  const handleFieldRequiredChange = (fieldId: string, required: boolean) => {
    updateField(fieldId, (field) => ({
      ...field,
      required,
      allowAnonymous: required && field.allowAnonymous ? false : field.allowAnonymous,
    }))
  }

  const handleFieldAllowAnonymousChange = (fieldId: string, allowAnonymous: boolean) => {
    updateField(fieldId, (field) => ({
      ...field,
      allowAnonymous,
      required: allowAnonymous ? false : field.required,
    }))
  }

  const handleFieldStepChange = (fieldId: string, stepId: string) => {
    updateField(fieldId, (field) => ({ ...field, stepId: stepId || undefined }))
  }

  const handleAddField = (type: FeedbackFieldType) => {
    setFields((current) => {
      const firstStepId = formSteps.length > 0 ? formSteps.sort((a, b) => a.order - b.order)[0].id : undefined
      const nextField = createField(type, current.length + 1, firstStepId)
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

  const handleAddStep = () => {
    const newStep: FormStep = {
      id: makeStepId(),
      title: `Step ${formSteps.length + 1}`,
      order: formSteps.length,
    }
    setFormSteps((current) => [...current, newStep])
    if (formSteps.length === 0) {
      setFields((current) =>
        current.map((f) => ({ ...f, stepId: newStep.id })),
      )
    }
  }

  const handleRemoveStep = (stepId: string) => {
    setFormSteps((current) => {
      const remaining = current.filter((s) => s.id !== stepId)
      const sortedRemaining = remaining.sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }))
      const reassignTo = sortedRemaining.length > 0 ? sortedRemaining[0].id : undefined
      setFields((fields) =>
        fields.map((f) =>
          f.stepId === stepId ? { ...f, stepId: reassignTo } : f,
        ),
      )
      return sortedRemaining
    })
    setEditingStepId(null)
  }

  const handleStepTitleChange = (stepId: string, title: string) => {
    setFormSteps((current) =>
      current.map((s) => (s.id === stepId ? { ...s, title } : s)),
    )
  }

  const handleStepDescriptionChange = (stepId: string, desc: string) => {
    setFormSteps((current) =>
      current.map((s) => (s.id === stepId ? { ...s, description: desc || undefined } : s)),
    )
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
    const maybeTouchEvent = activatorEvent as Event & {
      touches?: ArrayLike<{ clientY?: number }>
    }

    let clientY: number | null = null

    if ('clientY' in activatorEvent && typeof activatorEvent.clientY === 'number') {
      clientY = activatorEvent.clientY
    } else if (maybeTouchEvent.touches && maybeTouchEvent.touches.length > 0) {
      const firstTouch = maybeTouchEvent.touches[0]
      clientY = typeof firstTouch?.clientY === 'number' ? firstTouch.clientY : null
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

    const activeId = String(active.id)
    const overId = String(over.id)
    const isStepDroppable = overId.startsWith(STEP_DROP_PREFIX)

    setFields((current) => {
      const oldIndex = current.findIndex((field, index) => getFieldClientId(field, index) === activeId)
      if (oldIndex === -1) return current

      const activeField = current[oldIndex]
      const withoutActive = current.filter((_, i) => i !== oldIndex)

      if (formSteps.length === 0) {
        const newIndex = current.findIndex((field, index) => getFieldClientId(field, index) === overId)
        if (newIndex === -1) return current
        return arrayMove(current, oldIndex, newIndex)
      }

      let targetStepId: string
      let insertIndex: number

      if (isStepDroppable) {
        targetStepId = overId.slice(STEP_DROP_PREFIX.length)
        const targetStep = formSteps.find((s) => s.id === targetStepId)
        const targetOrder = targetStep?.order ?? 0
        const stepIndices = withoutActive
          .map((f, i) => (f.stepId === targetStepId ? i : -1))
          .filter((i) => i >= 0)
        if (stepIndices.length > 0) {
          insertIndex = stepIndices[stepIndices.length - 1] + 1
        } else {
          const firstIndexInStep = withoutActive.findIndex((f) => {
            const s = formSteps.find((x) => x.id === f.stepId)
            return (s?.order ?? -1) >= targetOrder
          })
          insertIndex = firstIndexInStep >= 0 ? firstIndexInStep : withoutActive.length
        }
      } else {
        const overIndexInWithout = withoutActive.findIndex((f, i) => {
          const origIdx = i < oldIndex ? i : i + 1
          return getFieldClientId(f, origIdx) === overId
        })
        if (overIndexInWithout === -1) return current
        const overField = withoutActive[overIndexInWithout]
        targetStepId = overField.stepId ?? [...formSteps].sort((a, b) => a.order - b.order)[0]?.id ?? ''
        insertIndex = overIndexInWithout
      }

      const moved = { ...activeField, stepId: targetStepId }
      const next = withoutActive.slice(0, insertIndex).concat([moved], withoutActive.slice(insertIndex))
      return next
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

      if (TYPES_WITH_OPTIONS.includes(field.type)) {
        const validOptions = (field.options ?? []).map((option) => option.trim()).filter(Boolean)
        if (validOptions.length === 0) {
          return 'Checkbox, radio, dropdown, scale, and rating fields need at least one option.'
        }
      }
    }

    if (formSteps.length > 0) {
      const stepIds = new Set(formSteps.map((s) => s.id))
      for (const field of fields) {
        if (field.stepId && !stepIds.has(field.stepId)) {
          return 'A field references a step that does not exist.'
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
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      landingHeadline: landingHeadline.trim() || undefined,
      landingDescription: landingDescription.trim() || undefined,
      landingCtaText: landingCtaText.trim() || undefined,
      landingEmoji: landingEmoji.trim() || undefined,
      thankYouHeadline: thankYouHeadline.trim() || undefined,
      thankYouMessage: thankYouMessage.trim() || undefined,
      kind: formKind,
      formStyle,
      drawerDefaultOpen: formStyle === 'drawer' ? drawerDefaultOpen : undefined,
      showResultsPublic,
      steps: formSteps.length > 0 ? formSteps : undefined,
      fields: fields.map((field, idx) => ({
        name: toFieldName(field.name || field.label),
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        placeholder: field.placeholder?.trim() || undefined,
        options: TYPES_WITH_OPTIONS.includes(field.type)
          ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
          : undefined,
        allowAnonymous: field.type === 'text' ? (field.allowAnonymous ?? false) : undefined,
        stepId: field.stepId || undefined,
        stepOrder: field.stepId ? idx : undefined,
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
          {FORM_TEMPLATE_CATEGORIES.map(({ value: category, label: categoryLabel, description: categoryDescription }) => {
            const templates = FORM_TEMPLATES.filter((t) => t.category === category)
            if (templates.length === 0) return null
            return (
              <div key={category} className="mt-6">
                <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {categoryLabel}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{categoryDescription}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {templates.map((template) => {
                    const Icon = TEMPLATE_ICONS[template.iconName]
                    const stepCount = template.steps?.length ?? 0
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
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {stepCount > 0 ? `${stepCount} step${stepCount !== 1 ? 's' : ''} · ` : ''}
                            {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
                            {template.fields.length > 0 ? ` · ${template.fields.slice(0, 2).map((f) => f.label).join(', ')}${template.fields.length > 2 ? '...' : ''}` : ''}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
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

  const sortedSteps = [...formSteps].sort((a, b) => a.order - b.order)

  const renderFieldsByStep = () => {
    if (formSteps.length === 0) {
      return fields.map((field, index) => {
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
            steps={formSteps}
            onToggleEdit={(clientId) => {
              setEditingFieldId((current) => (current === clientId ? null : clientId))
              setShowAdvancedOptions(false)
            }}
            onRemoveField={handleRemoveField}
            onFieldLabelChange={handleFieldLabelChange}
            onFieldTypeChange={handleFieldTypeChange}
            onFieldRequiredChange={handleFieldRequiredChange}
            onFieldAllowAnonymousChange={handleFieldAllowAnonymousChange}
            onAddOption={handleAddOption}
            onOptionChange={handleOptionChange}
            onRemoveOption={handleRemoveOption}
            onToggleAdvancedOptions={() => setShowAdvancedOptions((v) => !v)}
            onFieldNameChange={handleFieldNameChange}
            onFieldPlaceholderChange={handleFieldPlaceholderChange}
            onFieldStepChange={handleFieldStepChange}
          />
        )
      })
    }

    return sortedSteps.map((s) => {
      const stepFields = fields
        .map((f, i) => ({ field: f, globalIndex: i }))
        .filter(({ field }) => field.stepId === s.id)

        return (
        <div key={s.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700" data-stepid={s.id}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="text-sm font-semibold text-slate-900 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400"
              onClick={() => setEditingStepId(editingStepId === s.id ? null : s.id)}
            >
              {s.title || `Step ${s.order + 1}`}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-0 px-2 py-1 text-xs !text-rose-600 hover:!bg-rose-50 dark:!text-rose-400"
              onClick={() => handleRemoveStep(s.id)}
              aria-label={`Remove step ${s.title || `Step ${s.order + 1}`}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {editingStepId === s.id ? (
            <div className="mb-4 space-y-3 rounded-md border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <Input
                id={`step-title-${s.id}`}
                label="Step title"
                value={s.title}
                onChange={(v) => handleStepTitleChange(s.id, v)}
                placeholder="Step title"
              />
              <Input
                id={`step-desc-${s.id}`}
                label="Step description (optional)"
                value={s.description ?? ''}
                onChange={(v) => handleStepDescriptionChange(s.id, v)}
                placeholder="Optional description"
              />
            </div>
          ) : null}

          <StepDroppable stepId={s.id} className="mt-2">
            {stepFields.map(({ field, globalIndex }) => {
              const fieldId = getFieldClientId(field, globalIndex)
              const isEditing = editingFieldId === fieldId
              const showDropIndicator = Boolean(draggingFieldId && overFieldId === fieldId && draggingFieldId !== fieldId)
              return (
                <SortableFieldRow
                  key={fieldId}
                  field={field}
                  index={globalIndex}
                  isEditing={isEditing}
                  showDropIndicator={showDropIndicator}
                  showAdvancedOptions={showAdvancedOptions}
                  steps={formSteps}
                  onToggleEdit={(clientId) => {
                    setEditingFieldId((current) => (current === clientId ? null : clientId))
                    setShowAdvancedOptions(false)
                  }}
                  onRemoveField={handleRemoveField}
                  onFieldLabelChange={handleFieldLabelChange}
                  onFieldTypeChange={handleFieldTypeChange}
                  onFieldRequiredChange={handleFieldRequiredChange}
                  onFieldAllowAnonymousChange={handleFieldAllowAnonymousChange}
                  onAddOption={handleAddOption}
                  onOptionChange={handleOptionChange}
                  onRemoveOption={handleRemoveOption}
                  onToggleAdvancedOptions={() => setShowAdvancedOptions((v) => !v)}
                  onFieldNameChange={handleFieldNameChange}
                  onFieldPlaceholderChange={handleFieldPlaceholderChange}
                  onFieldStepChange={handleFieldStepChange}
                />
              )
            })}

            {stepFields.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">Drop fields here or add from below.</p>
            ) : null}
          </StepDroppable>
        </div>
      )
    })
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-4 flex justify-start">
        <button type="button" onClick={handleBackClick} className={backClass}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      {/* Panel 1: Form Details */}
      <Card className="rounded-xl sm:p-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Form Details</h3>
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
          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowFormDetailsAdvanced((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              aria-expanded={showFormDetailsAdvanced}
            >
              Advanced options
              {showFormDetailsAdvanced ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>
            {showFormDetailsAdvanced ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">SEO (optional)</p>
                  <Input
                    id="form-meta-title"
                    label="Page title for search &amp; sharing"
                    value={metaTitle || title}
                    onChange={setMetaTitle}
                    placeholder="Uses form title when empty"
                  />
                  <Textarea
                    id="form-meta-description"
                    label="Short description for search &amp; social"
                    value={metaDescription || description}
                    onChange={setMetaDescription}
                    placeholder="Uses form description when empty"
                    rows={2}
                  />
                </div>
                <div className="flex items-start gap-3">
                  <Switch
                    id="form-show-results-public"
                    checked={showResultsPublic}
                    onChange={setShowResultsPublic}
                    aria-label="Show results page to respondents"
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="form-show-results-public" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Show results page to respondents
                    </label>
                    <p id="form-show-results-public-hint" className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      When enabled, respondents will see a &quot;See results&quot; link after submitting and can view aggregated results. Default is off.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Form display style</label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How the form appears to respondents when they open the link.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="form-style"
                  value="default"
                  checked={formStyle === 'default'}
                  onChange={() => setFormStyle('default')}
                  className="mt-1 h-4 w-4 border-slate-300 text-stone-900 focus:ring-stone-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Default</strong> — Form is shown immediately.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="form-style"
                  value="drawer"
                  checked={formStyle === 'drawer'}
                  onChange={() => setFormStyle('drawer')}
                  className="mt-1 h-4 w-4 border-slate-300 text-stone-900 focus:ring-stone-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Drawer</strong> — Landing screen first; pull up to open the form.
                </span>
              </label>
            </div>
            {formStyle === 'drawer' ? (
              <>
                <div className="flex items-start gap-3 pt-3">
                  <input
                    id="form-drawer-default-open"
                    type="checkbox"
                    checked={drawerDefaultOpen}
                    onChange={(e) => setDrawerDefaultOpen(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-stone-900 focus:ring-stone-500 dark:border-slate-600 dark:bg-slate-800"
                    aria-describedby="form-drawer-default-open-hint"
                  />
                  <div className="flex-1">
                    <label htmlFor="form-drawer-default-open" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Open drawer by default
                    </label>
                    <p id="form-drawer-default-open-hint" className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      When enabled, respondents see the form immediately (drawer already open). On desktop, the form is always shown in a centered layout.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Landing screen</p>
                  <Input id="form-landing-emoji" label="Emoji" value={landingEmoji} onChange={setLandingEmoji} placeholder="📋" />
                  <Input id="form-landing-headline" label="Headline" value={landingHeadline} onChange={setLandingHeadline} placeholder="Leave blank to use form title" />
                  <Textarea id="form-landing-description" label="Description" value={landingDescription} onChange={setLandingDescription} placeholder="Leave blank to use form description" rows={2} />
                  <Input id="form-landing-cta" label="Button text" value={landingCtaText} onChange={setLandingCtaText} placeholder="Tap to vote" />
                </div>
                <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">After submission</p>
                  <Input id="form-thankyou-headline" label="Headline" value={thankYouHeadline} onChange={setThankYouHeadline} placeholder="Vote submitted" />
                  <Textarea id="form-thankyou-message" label="Message" value={thankYouMessage} onChange={setThankYouMessage} placeholder="Leave blank for default" rows={2} />
                </div>
              </>
            ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Panel 2: Steps & Fields */}
      <Card className="mt-4 rounded-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {formSteps.length > 0 ? 'Steps & Fields' : 'Fields'}
          </h3>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddStep}>
            <Plus className="h-3.5 w-3.5" />
            Add step
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveForm()
          }}
          className="space-y-5"
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
              <div className="space-y-4">
                {renderFieldsByStep()}
              </div>
            </SortableContext>
          </DndContext>

          <div className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
            Drag fields to reorder; with multiple steps, drag onto a step to move a field there.
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
              <div className="space-y-4">
                {fieldTypeGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {group.label}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.types.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <button
                            key={`${group.label}-${opt.value}-${opt.label}`}
                            type="button"
                            onClick={() => {
                              handleAddField(opt.value)
                              setShowAddFieldModal(false)
                            }}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-600 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20"
                          >
                            <Icon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Modal>
          ) : null}

          {error ? <ErrorMessage message={error} /> : null}

          {/* Panel 3: Actions */}
          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={submitting} className="flex-1">
              <Send className="h-4 w-4" />
              {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : isEditMode ? 'Update Form' : 'Save Form'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Preview Modal */}
      {showPreview ? (
        <Modal
          isOpen
          onClose={() => setShowPreview(false)}
          title="Form Preview"
          size="lg"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title || 'Untitled Form'}</h2>
            {description ? <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.clientId || field.name} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{field.label}</span>
                  {field.required ? <span className="ml-1 text-rose-600" aria-hidden>*</span> : null}
                  <span className="ml-2 text-xs text-slate-500">{getTypeLabel(field.type)}</span>
                  {field.placeholder ? <p className="mt-1 text-xs text-slate-400">{field.placeholder}</p> : null}
                  {field.options?.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {field.options.map((opt) => (
                        <span key={opt} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{opt}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}

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
