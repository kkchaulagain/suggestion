import {
  createClientId,
  createBlock,
  createEmptyBlock,
  hydrateBlocks,
  getBlockOption,
  getStatusClasses,
  getBlockSummary,
  BLOCK_OPTIONS,
  type Block,
  type ApiBlock,
} from '../pages/business-dashboard/pages/pageBlockTypes'

describe('pageBlockTypes', () => {
  describe('createClientId', () => {
    it('returns cms-block-N and increments on each call', () => {
      const id1 = createClientId()
      const id2 = createClientId()
      expect(id1).toMatch(/^cms-block-\d+$/)
      expect(id2).toMatch(/^cms-block-\d+$/)
      expect(parseInt(id1.split('-')[2], 10)).toBeLessThan(parseInt(id2.split('-')[2], 10))
    })
  })

  describe('createBlock', () => {
    it('returns block with clientId, type, and payload', () => {
      const block = createBlock('heading', { level: 2, text: 'Hi', align: 'center' })
      expect(block).toHaveProperty('clientId')
      expect(block.clientId).toMatch(/^cms-block-\d+$/)
      expect(block.type).toBe('heading')
      expect(block.payload).toEqual({ level: 2, text: 'Hi', align: 'center' })
    })
  })

  describe('createEmptyBlock', () => {
    const blockTypes = [
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

    blockTypes.forEach((type) => {
      it(`creates empty block for type "${type}"`, () => {
        const block = createEmptyBlock(type)
        expect(block.type).toBe(type)
        expect(block.clientId).toMatch(/^cms-block-\d+$/)
        expect(block.payload).toBeDefined()
      })
    })

    it('returns paragraph block for unknown type (default)', () => {
      const block = createEmptyBlock('unknown' as import('../pages/business-dashboard/pages/pageBlockTypes').BlockType)
      expect(block.type).toBe('paragraph')
      expect((block.payload as { text: string }).text).toBe('')
    })
  })

  describe('hydrateBlocks', () => {
    it('returns empty array for undefined', () => {
      expect(hydrateBlocks(undefined)).toEqual([])
    })

    it('assigns clientId from _id when present', () => {
      const apiBlocks: ApiBlock[] = [
        { _id: 'id-1', type: 'heading', payload: { level: 1, text: '', align: 'center' } },
      ]
      const blocks = hydrateBlocks(apiBlocks)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].clientId).toBe('id-1')
    })

    it('assigns new clientId when _id is missing', () => {
      const apiBlocks: ApiBlock[] = [
        { type: 'paragraph', payload: { text: '', align: 'left' } },
      ]
      const blocks = hydrateBlocks(apiBlocks)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].clientId).toMatch(/^cms-block-\d+$/)
    })
  })

  describe('getBlockOption', () => {
    it('returns correct option for each known type', () => {
      expect(getBlockOption('heading').type).toBe('heading')
      expect(getBlockOption('paragraph').type).toBe('paragraph')
      expect(getBlockOption('form').type).toBe('form')
      expect(getBlockOption('hero').type).toBe('hero')
      expect(getBlockOption('feature_card').type).toBe('feature_card')
      expect(getBlockOption('feature_grid').type).toBe('feature_grid')
      expect(getBlockOption('image').type).toBe('image')
      expect(getBlockOption('cta').type).toBe('cta')
      expect(getBlockOption('stats').type).toBe('stats')
      expect(getBlockOption('testimonials').type).toBe('testimonials')
      expect(getBlockOption('pricing').type).toBe('pricing')
      expect(getBlockOption('faq').type).toBe('faq')
    })

    it('returns first option for unknown type', () => {
      const option = getBlockOption('unknown' as never)
      expect(option).toBe(BLOCK_OPTIONS[0])
      expect(option.type).toBe('heading')
    })
  })

  describe('getStatusClasses', () => {
    it('returns draft (amber) classes for status draft', () => {
      const classes = getStatusClasses('draft')
      expect(classes).toContain('amber')
    })

    it('returns published (emerald) classes for status published', () => {
      const classes = getStatusClasses('published')
      expect(classes).toContain('emerald')
    })
  })

  describe('getBlockSummary', () => {
    const clientId = 'test-id'

    it('heading: uses text when present, else "Heading N"', () => {
      expect(getBlockSummary({ clientId, type: 'heading', payload: { level: 1, text: 'Hi', align: 'center' } })).toBe('Hi')
      expect(getBlockSummary({ clientId, type: 'heading', payload: { level: 2, text: '', align: 'center' } })).toBe('Heading 2')
    })

    it('paragraph: uses text when present, else "Body copy"', () => {
      expect(getBlockSummary({ clientId, type: 'paragraph', payload: { text: 'Intro' } })).toBe('Intro')
      expect(getBlockSummary({ clientId, type: 'paragraph', payload: { text: '' } })).toBe('Body copy')
    })

    it('form: uses formId when present, else "Embedded feedback form"', () => {
      expect(getBlockSummary({ clientId, type: 'form', payload: { formId: 'f1' } })).toBe('f1')
      expect(getBlockSummary({ clientId, type: 'form', payload: { formId: '' } })).toBe('Embedded feedback form')
    })

    it('hero: uses headline when present; else label by variant', () => {
      expect(getBlockSummary({ clientId, type: 'hero', payload: { headline: 'Welcome', subheadline: '', variant: 'centered', style: 'default', mediaType: 'none' } })).toBe('Welcome')
      expect(getBlockSummary({ clientId, type: 'hero', payload: { headline: '', subheadline: '', variant: 'centered' } })).toBe('Hero banner')
      expect(getBlockSummary({ clientId, type: 'hero', payload: { headline: '', subheadline: '', variant: 'split' } })).toBe('Hero (Split)')
      expect(getBlockSummary({ clientId, type: 'hero', payload: { headline: '', subheadline: '', variant: 'splitReversed' } })).toBe('Hero (Split reversed)')
      expect(getBlockSummary({ clientId, type: 'hero', payload: { headline: '', subheadline: '', variant: 'centeredWithMediaBelow' } })).toBe('Hero (Centered + media below)')
    })

    it('feature_card: uses title when present, else "Single feature card"', () => {
      expect(getBlockSummary({ clientId, type: 'feature_card', payload: { title: 'Feature', description: '', icon: 'file-text' } })).toBe('Feature')
      expect(getBlockSummary({ clientId, type: 'feature_card', payload: { title: '', description: '', icon: 'file-text' } })).toBe('Single feature card')
    })

    it('feature_grid: "N item(s)"', () => {
      expect(getBlockSummary({
        clientId,
        type: 'feature_grid',
        payload: { columns: 3, items: [{ icon: 'file-text', title: '', description: '' }] },
      })).toBe('1 item')
      expect(getBlockSummary({
        clientId,
        type: 'feature_grid',
        payload: { columns: 3, items: [{ icon: 'a', title: '', description: '' }, { icon: 'b', title: '', description: '' }] },
      })).toBe('2 items')
      expect(getBlockSummary({ clientId, type: 'feature_grid', payload: { columns: 3, items: [] } })).toBe('0 items')
    })

    it('image: caption, then alt, else "Image block"', () => {
      expect(getBlockSummary({ clientId, type: 'image', payload: { imageUrl: '', alt: 'x', caption: 'Cap' } })).toBe('Cap')
      expect(getBlockSummary({ clientId, type: 'image', payload: { imageUrl: '', alt: 'x' } })).toBe('x')
      expect(getBlockSummary({ clientId, type: 'image', payload: { imageUrl: '', alt: '' } })).toBe('Image block')
    })

    it('cta: text, then ctaLabel, else "Call to action"', () => {
      expect(getBlockSummary({ clientId, type: 'cta', payload: { text: 'Sign up', ctaLabel: 'Go', ctaHref: '#' } })).toBe('Sign up')
      expect(getBlockSummary({ clientId, type: 'cta', payload: { text: '', ctaLabel: 'Go', ctaHref: '#' } })).toBe('Go')
      expect(getBlockSummary({ clientId, type: 'cta', payload: { text: '', ctaLabel: '', ctaHref: '#' } })).toBe('Call to action')
    })

    it('stats: "Stats (N item(s))" or "Stats"', () => {
      expect(getBlockSummary({ clientId, type: 'stats', payload: { stats: [] } })).toBe('Stats')
      expect(getBlockSummary({ clientId, type: 'stats', payload: { stats: [{ value: '1', label: 'A' }] } })).toBe('Stats (1 item)')
      expect(getBlockSummary({ clientId, type: 'stats', payload: { stats: [{ value: '1', label: 'A' }, { value: '2', label: 'B' }] } })).toBe('Stats (2 items)')
    })

    it('testimonials: "Testimonials (N)" or "Testimonials"', () => {
      expect(getBlockSummary({ clientId, type: 'testimonials', payload: { testimonials: [] } })).toBe('Testimonials')
      expect(getBlockSummary({ clientId, type: 'testimonials', payload: { testimonials: [{ quote: 'Q', name: 'N', role: 'R' }] } })).toBe('Testimonials (1)')
      expect(getBlockSummary({ clientId, type: 'testimonials', payload: { testimonials: [{ quote: 'Q', name: 'N', role: 'R' }, { quote: 'Q2', name: 'N2', role: 'R2' }] } })).toBe('Testimonials (2)')
    })

    it('pricing: "Pricing (N plan(s))" or "Pricing"', () => {
      expect(getBlockSummary({ clientId, type: 'pricing', payload: { plans: [] } })).toBe('Pricing')
      expect(getBlockSummary({
        clientId,
        type: 'pricing',
        payload: { plans: [{ name: 'Pro', price: '$9', features: [], cta: { label: 'Get', href: '#' } }] },
      })).toBe('Pricing (1 plan)')
      expect(getBlockSummary({
        clientId,
        type: 'pricing',
        payload: {
          plans: [
            { name: 'A', price: '', features: [], cta: { label: '', href: '' } },
            { name: 'B', price: '', features: [], cta: { label: '', href: '' } },
          ],
        },
      })).toBe('Pricing (2 plans)')
    })

    it('faq: "FAQ (N question(s))" or "FAQ"', () => {
      expect(getBlockSummary({ clientId, type: 'faq', payload: { items: [] } })).toBe('FAQ')
      expect(getBlockSummary({ clientId, type: 'faq', payload: { items: [{ question: 'Q', answer: 'A' }] } })).toBe('FAQ (1 question)')
      expect(getBlockSummary({ clientId, type: 'faq', payload: { items: [{ question: 'Q1', answer: 'A1' }, { question: 'Q2', answer: 'A2' }] } })).toBe('FAQ (2 questions)')
    })

    it('returns "Content block" for unknown block type', () => {
      const block = { clientId, type: 'unknown', payload: {} } as unknown as Block
      expect(getBlockSummary(block)).toBe('Content block')
    })
  })
})
