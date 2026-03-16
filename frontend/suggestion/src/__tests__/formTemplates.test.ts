import { FORM_TEMPLATES, type FormKind, type TemplateIconName } from '../pages/business-dashboard/pages/formTemplates'

const VALID_KINDS: FormKind[] = ['form', 'poll', 'survey']
const VALID_ICONS: TemplateIconName[] = [
  'MessageSquare',
  'Calendar',
  'Bug',
  'Briefcase',
  'Star',
  'Mail',
  'CalendarClock',
  'Users',
  'BarChart2',
  'ListChecks',
  'ClipboardList',
  'UtensilsCrossed',
  'Heart',
  'PartyPopper',
  'ShoppingCart',
  'Newspaper',
]
const VALID_FIELD_TYPES = ['text', 'textarea', 'email', 'phone', 'number', 'date', 'time', 'url', 'checkbox', 'radio', 'dropdown', 'scale', 'rating', 'image'] as const
const VALID_CATEGORIES = ['feedback', 'registration', 'poll', 'survey', 'support']

describe('formTemplates', () => {
  test('FORM_TEMPLATES is a non-empty array', () => {
    expect(Array.isArray(FORM_TEMPLATES)).toBe(true)
    expect(FORM_TEMPLATES.length).toBeGreaterThan(0)
  })

  test('every template has required FormTemplate shape', () => {
    FORM_TEMPLATES.forEach((t) => {
      expect(t).toMatchObject({
        id: expect.any(String),
        label: expect.any(String),
        description: expect.any(String),
        iconName: expect.any(String),
        category: expect.any(String),
        title: expect.any(String),
        formDescription: expect.any(String),
        kind: expect.any(String),
        fields: expect.any(Array),
      })
      expect(t.id.length).toBeGreaterThan(0)
      expect(VALID_KINDS).toContain(t.kind)
      expect(VALID_ICONS).toContain(t.iconName)
      expect(VALID_CATEGORIES).toContain(t.category)
    })
  })

  test('template ids are unique', () => {
    const ids = FORM_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('every template has at least one field', () => {
    FORM_TEMPLATES.forEach((t) => {
      expect(Array.isArray(t.fields)).toBe(true)
      expect(t.fields.length).toBeGreaterThan(0)
    })
  })

  test('every field has required shape and valid type', () => {
    FORM_TEMPLATES.forEach((template) => {
      template.fields.forEach((field) => {
        expect(field).toMatchObject({
          name: expect.any(String),
          label: expect.any(String),
          type: expect.any(String),
          required: expect.any(Boolean),
        })
        expect(field.name.length).toBeGreaterThan(0)
        expect(VALID_FIELD_TYPES).toContain(field.type)
        if (field.type === 'radio' || field.type === 'checkbox' || field.type === 'rating') {
          expect(Array.isArray(field.options)).toBe(true)
          expect((field.options as string[]).length).toBeGreaterThan(0)
        }
      })
    })
  })

  test('exports expected template ids used by CreateFormPage', () => {
    const ids = new Set(FORM_TEMPLATES.map((t) => t.id))
    expect(ids.has('poll')).toBe(true)
    expect(ids.has('survey')).toBe(true)
    expect(ids.has('customer-feedback')).toBe(true)
    expect(ids.has('bug-report')).toBe(true)
    expect(ids.has('event-registration')).toBe(true)
  })

  test('templates with kind poll have category poll', () => {
    FORM_TEMPLATES.filter((t) => t.kind === 'poll').forEach((t) => {
      expect(t.category).toBe('poll')
    })
  })
})
