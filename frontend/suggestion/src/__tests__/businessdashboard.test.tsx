import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'

import BusinessDashboardLayout from '../pages/business-dashboard/layout/BusinessDashboardLayout'
import CreateFormPage from '../pages/business-dashboard/pages/CreateFormPage'
import FormsPage from '../pages/business-dashboard/pages/FormsPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function renderBusinessDashboardForms(initialPath: string = '/business-dashboard/forms') {
  return render(
    <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/business-dashboard" element={<BusinessDashboardLayout />}>
          <Route path="forms" element={<FormsPage />} />
          <Route path="forms/create" element={<CreateFormPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Business Dashboard Forms Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('isLoggedIn', 'true')

    mockedAxios.get.mockImplementation((url: any) => {
      if (String(url).includes('/api/auth/business')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              businessname: 'Acme Traders',
              location: 'Kathmandu',
              pancardNumber: 12345678,
              description: 'Retail store',
            },
          },
        } as any)
      }

      if (String(url).includes('/api/feedback-forms')) {
        return Promise.resolve({
          data: {
            feedbackForms: [
              {
                _id: 'f1',
                title: 'Customer Feedback',
                description: 'Tell us what to improve',
                businessId: 'b1',
                fields: [{ name: 'comment', label: 'Comment', type: 'long_text', required: false }],
              },
            ],
          },
        } as any)
      }

      return Promise.resolve({ data: {} } as any)
    })
  })

  test('shows form list and opens create form page from Make Form', async () => {
    renderBusinessDashboardForms()

    expect(screen.getByRole('heading', { name: /Saved Forms/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Customer Feedback/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Make Form/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Form List/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: /Live Form Preview/i })).toBeInTheDocument()
  })

  test('removes added field from preview and can go back to form list', async () => {
    renderBusinessDashboardForms('/business-dashboard/forms/create')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Form List/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
      target: { value: 'Phone Number' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))

    await waitFor(() => {
      expect(screen.getByText(/Phone Number/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Remove$/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Phone Number/i)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Back to Form List/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Saved Forms/i })).toBeInTheDocument()
    })
  })
})
