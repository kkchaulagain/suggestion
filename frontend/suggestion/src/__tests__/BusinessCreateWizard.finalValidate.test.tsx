/**
 * Isolated mock: second validateStep(last) call returns error (wizard lines 50–51).
 */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('../pages/business-dashboard/config/businessCreateConfig', () => {
  const actual = jest.requireActual<typeof import('../pages/business-dashboard/config/businessCreateConfig')>(
    '../pages/business-dashboard/config/businessCreateConfig',
  )
  let lastStepCalls = 0
  return {
    ...actual,
    validateStep(stepIndex: number, values: Record<string, string>) {
      const last = actual.BUSINESS_CREATE_STEPS.length - 1
      if (stepIndex === last) {
        lastStepCalls += 1
        if (lastStepCalls === 2) return 'Please fix description.'
      }
      return actual.validateStep(stepIndex, values)
    },
  }
})

import BusinessCreateWizard from '../pages/business-dashboard/components/BusinessCreateWizard'

describe('BusinessCreateWizard final validate branch', () => {
  test('second validate on last step shows step error', () => {
    render(
      <BusinessCreateWizard
        authConfig={{ withCredentials: true, headers: {} }}
        onCancel={() => {}}
        onSuccess={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Business name/i), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.change(document.getElementById('create-description')!, { target: { value: 'About us' } })
    fireEvent.click(screen.getByRole('button', { name: /Review/i }))

    expect(screen.getByText(/Please fix description\./i)).toBeInTheDocument()
  })
})
