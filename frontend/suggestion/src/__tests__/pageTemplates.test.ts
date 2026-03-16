import {
  PAGE_TEMPLATES,
  PAGE_TEMPLATE_CATEGORIES,
  type PageTemplateCategory,
  type PageTemplateIconName,
} from '../pages/business-dashboard/pages/pageTemplates'

const VALID_CATEGORIES: PageTemplateCategory[] = ['marketing', 'business', 'portfolio', 'event', 'simple']
const VALID_ICONS: PageTemplateIconName[] = [
  'Layout',
  'Megaphone',
  'FileText',
  'Sparkles',
  'Briefcase',
  'Image',
  'Calendar',
  'Package',
]
const VALID_BLOCK_TYPES = [
  'heading',
  'paragraph',
  'form',
  'hero',
  'feature_card',
  'feature_grid',
  'image',
  'cta',
  'stats',
  'testimonials',
  'pricing',
  'faq',
] as const

describe('pageTemplates', () => {
  test('PAGE_TEMPLATES is a non-empty array', () => {
    expect(Array.isArray(PAGE_TEMPLATES)).toBe(true)
    expect(PAGE_TEMPLATES.length).toBeGreaterThan(0)
  })

  test('every template has required PageTemplate shape', () => {
    PAGE_TEMPLATES.forEach((t) => {
      expect(t).toMatchObject({
        id: expect.any(String),
        label: expect.any(String),
        description: expect.any(String),
        iconName: expect.any(String),
        category: expect.any(String),
        blocks: expect.any(Array),
      })
      expect(t.id.length).toBeGreaterThan(0)
      expect(VALID_CATEGORIES).toContain(t.category)
      expect(VALID_ICONS).toContain(t.iconName)
    })
  })

  test('template ids are unique', () => {
    const ids = PAGE_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('every block has valid type and payload', () => {
    PAGE_TEMPLATES.forEach((template) => {
      template.blocks.forEach((block) => {
        expect(block).toMatchObject({
          type: expect.any(String),
          payload: expect.any(Object),
        })
        expect(VALID_BLOCK_TYPES).toContain(block.type)
        expect(block.payload).toBeDefined()
        expect(typeof block.payload).toBe('object')
      })
    })
  })

  test('PAGE_TEMPLATE_CATEGORIES matches valid categories', () => {
    expect(PAGE_TEMPLATE_CATEGORIES.length).toBe(VALID_CATEGORIES.length)
    const categoryValues = PAGE_TEMPLATE_CATEGORIES.map((c) => c.value)
    VALID_CATEGORIES.forEach((cat) => {
      expect(categoryValues).toContain(cat)
    })
  })

  test('exports expected template ids used by CreatePagePage', () => {
    const ids = new Set(PAGE_TEMPLATES.map((t) => t.id))
    expect(ids.has('landing-page')).toBe(true)
    expect(ids.has('blank')).toBe(true)
    expect(ids.has('contact-us')).toBe(true)
    expect(ids.has('feedback-form-page')).toBe(true)
    expect(ids.has('simple-landing')).toBe(true)
  })
})
