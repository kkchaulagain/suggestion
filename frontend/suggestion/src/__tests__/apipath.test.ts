import { userapi, loginapi, meapi, businessmeapi } from '../utils/apipath'

describe('apipath', () => {
  const base = process.env.VITE_API_URL ?? 'http://localhost:3001'

  it('exports userapi with correct base and path', () => {
    expect(userapi).toBe(`${base}/api/auth/register`)
  })

  it('exports loginapi with correct base and path', () => {
    expect(loginapi).toBe(`${base}/api/auth/login`)
  })

  it('exports meapi with correct base and path', () => {
    expect(meapi).toBe(`${base}/api/auth/me`)
  })

  it('exports businessmeapi with correct base and path', () => {
    expect(businessmeapi).toBe(`${base}/api/auth/business`)
  })
})
