import {
  userapi,
  loginapi,
  refreshTokenApi,
  logoutApi,
  meapi,
  changePasswordApi,
  businessmeapi,
  feedbackFormsApi,
  feedbackFormSubmissionsApi,
  uploadApi,
  businessesListApi,
  usersApi,
} from '../utils/apipath'

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

  it('exports refreshTokenApi with correct base and path', () => {
    expect(refreshTokenApi).toBe(`${base}/api/auth/refresh-token`)
  })

  it('exports logoutApi with correct base and path', () => {
    expect(logoutApi).toBe(`${base}/api/auth/logout`)
  })

  it('exports changePasswordApi with correct base and path', () => {
    expect(changePasswordApi).toBe(`${base}/api/auth/me/change-password`)
  })

  it('exports businessmeapi with correct base and path', () => {
    expect(businessmeapi).toBe(`${base}/api/auth/business`)
  })

  it('exports feedbackFormsApi with correct path', () => {
    expect(feedbackFormsApi).toBe(`${base}/api/feedback-forms`)
  })

  it('exports feedbackFormSubmissionsApi with correct path', () => {
    expect(feedbackFormSubmissionsApi).toBe(`${base}/api/feedback-forms/submissions`)
  })

  it('exports uploadApi with correct path', () => {
    expect(uploadApi).toBe(`${base}/api/upload`)
  })

  it('exports businessesListApi with correct path', () => {
    expect(businessesListApi).toBe(`${base}/api/v1/business`)
  })

  it('exports usersApi with correct path', () => {
    expect(usersApi).toBe(`${base}/api/users`)
  })
})
