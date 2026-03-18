import {
  validateStep,
  valuesToCreatePayload,
  getInitialCreateValues,
  BUSINESS_CREATE_STEPS,
} from '../pages/business-dashboard/config/businessCreateConfig'

describe('businessCreateConfig', () => {
  test('getInitialCreateValues includes type default', () => {
    const v = getInitialCreateValues()
    expect(v.type).toBe('commercial')
    expect(BUSINESS_CREATE_STEPS.length).toBeGreaterThan(0)
  })

  test('validateStep requires businessname on first step', () => {
    const values = { ...getInitialCreateValues(), businessname: '' }
    expect(validateStep(0, values)).toMatch(/Business name/)
    expect(validateStep(0, { ...values, businessname: 'X' })).toBeNull()
  })

  test('validateStep requires description on story step', () => {
    const idx = BUSINESS_CREATE_STEPS.findIndex((s) => s.id === 'story')
    expect(idx).toBeGreaterThanOrEqual(0)
    const base = getInitialCreateValues()
    base.businessname = 'A'
    base.description = ''
    expect(validateStep(idx, base)).toMatch(/Description/)
    base.description = 'Ok'
    expect(validateStep(idx, base)).toBeNull()
  })

  test('valuesToCreatePayload maps core and custom fields', () => {
    const v = getInitialCreateValues()
    v.businessname = 'Co'
    v.description = 'D'
    v.type = 'commercial'
    v.location = 'L'
    v.pancardNumber = 'P'
    v.contactEmail = 'a@b.com'
    v.website = 'https://x.com'
    const p = valuesToCreatePayload(v)
    expect(p).toMatchObject({
      businessname: 'Co',
      description: 'D',
      type: 'commercial',
      location: 'L',
      pancardNumber: 'P',
    })
    expect(p.customFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'contactEmail', value: 'a@b.com' }),
        expect.objectContaining({ key: 'website', value: 'https://x.com' }),
      ]),
    )
  })
})
