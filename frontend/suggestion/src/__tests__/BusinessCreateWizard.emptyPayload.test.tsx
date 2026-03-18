/**
 * Mock empty payload so Create on review hits submit guard (lines 72–73).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('../pages/business-dashboard/config/businessCreateConfig', () => {
  const actual = jest.requireActual<typeof import('../pages/business-dashboard/config/businessCreateConfig')>(
    '../pages/business-dashboard/config/businessCreateConfig',
  )
  return {
    ...actual,
    valuesToCreatePayload: () => ({
      businessname: '',
      description: '',
      type: 'commercial' as const,
    }),
  }
})

import BusinessCreateWizard from '../pages/business-dashboard/components/BusinessCreateWizard'

describe('BusinessCreateWizard empty payload submit', () => {
  test('shows error when name and description missing on create', async () => {
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
    fireEvent.change(document.getElementById('create-description')!, { target: { value: 'About' } })
    fireEvent.click(screen.getByRole('button', { name: /Review/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Create business/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Create business/i }))

    expect(await screen.findByText(/Name and description are required/i)).toBeInTheDocument()
  })
})
