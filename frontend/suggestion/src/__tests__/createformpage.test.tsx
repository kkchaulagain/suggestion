import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import CreateFormPage from '../pages/business-dashboard/pages/CreateFormPage'
import { feedbackFormsApi } from '../utils/apipath'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderCreateFormPage() {
  return render(
    <MemoryRouter>
      <CreateFormPage />
    </MemoryRouter>,
  )
}

function addField(label: string) {
  fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
    target: { value: label },
  })
  fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))
}

describe('CreateFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.post.mockReset()
    localStorage.clear()
  })

  test('auto-fills field name from label and adds field to preview', () => {
    renderCreateFormPage()

    fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
      target: { value: 'Phone Number' },
    })

    expect(screen.getByPlaceholderText(/field_name/i)).toHaveValue('phone_number')

    fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))

    expect(screen.getByText(/Phone Number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Remove$/i })).toBeInTheDocument()
  })

  test('shows error when trying to add field without label', () => {
    renderCreateFormPage()

    fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))

    expect(screen.getByText(/Field label and valid field name are required\./i)).toBeInTheDocument()
  })

  test('shows error when field name is duplicated', () => {
    renderCreateFormPage()

    addField('Comment')
    addField('Comment')

    expect(screen.getByText(/Field name must be unique inside the form\./i)).toBeInTheDocument()
  })

  test('validates option fields, handles duplicate options, and can remove option', async () => {
    renderCreateFormPage()

    fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
      target: { value: 'Satisfaction' },
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'radio' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))
    expect(screen.getByText(/Add at least one option for checkbox \/ radio fields\./i)).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Type an option and press Enter/i), {
      target: { value: 'Good' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }))

    fireEvent.change(screen.getByPlaceholderText(/Type an option and press Enter/i), {
      target: { value: 'Good' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }))

    expect(screen.getByText(/Option already added\./i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Remove option Good/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Remove option Good/i })).not.toBeInTheDocument()
    })
  })

  test('adds option with Enter key and clears options when switching to non-option type', async () => {
    renderCreateFormPage()

    fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
      target: { value: 'Satisfaction' },
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'radio' },
    })

    const optionInput = screen.getByPlaceholderText(/Type an option and press Enter/i)
    fireEvent.change(optionInput, { target: { value: 'Good' } })
    fireEvent.keyDown(optionInput, { key: 'Enter', code: 'Enter' })

    expect(screen.getByRole('button', { name: /Remove option Good/i })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'short_text' },
    })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Type an option and press Enter/i)).not.toBeInTheDocument()
    })
  })

  test('supports custom field name, placeholder, required flag, and option previews', () => {
    renderCreateFormPage()

    fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
      target: { value: 'Service Choice' },
    })
    fireEvent.change(screen.getByPlaceholderText(/field_name/i), {
      target: { value: '1 Service Name' },
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'checkbox' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Type an option and press Enter/i), {
      target: { value: 'Billing' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }))
    fireEvent.change(screen.getByPlaceholderText(/Placeholder \(optional\)/i), {
      target: { value: 'Choose one service' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: /Required field/i }))
    fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))

    expect(screen.getByText(/Service Choice/i)).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
      target: { value: 'Contact Method' },
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'radio' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Type an option and press Enter/i), {
      target: { value: 'Email' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }))
    fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))

    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  test('remove button deletes a previewed field', async () => {
    renderCreateFormPage()

    addField('Phone Number')
    expect(screen.getByText(/Phone Number/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Phone Number/i)).not.toBeInTheDocument()
    })
  })

  test('shows title required validation when saving', () => {
    renderCreateFormPage()

    addField('Comment')
    fireEvent.click(screen.getByRole('button', { name: /Save Form/i }))

    expect(screen.getByText(/Form title is required\./i)).toBeInTheDocument()
  })

  test('shows at least one field validation when saving without fields', () => {
    renderCreateFormPage()

    fireEvent.change(screen.getByPlaceholderText(/Form title/i), {
      target: { value: 'Customer Feedback' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save Form/i }))

    expect(screen.getByText(/Add at least one input field\./i)).toBeInTheDocument()
  })

  test('shows backend error when save fails', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Backend save failed' } },
    })

    renderCreateFormPage()

    fireEvent.change(screen.getByPlaceholderText(/Form title/i), {
      target: { value: 'Customer Feedback' },
    })
    addField('Comment')

    fireEvent.click(screen.getByRole('button', { name: /Save Form/i }))

    await waitFor(() => {
      expect(screen.getByText(/Backend save failed/i)).toBeInTheDocument()
    })
  })

  test('saves form and navigates back to forms list', async () => {
    interface CreateFormSaveResponse { data: Record<string, never> }
    mockedAxios.post.mockResolvedValueOnce({ data: {} } as CreateFormSaveResponse)
    renderCreateFormPage()

    fireEvent.change(screen.getByPlaceholderText(/Form title/i), {
      target: { value: 'Customer Feedback' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Form description/i), {
      target: { value: 'Tell us what to improve' },
    })

    fireEvent.change(screen.getByPlaceholderText(/Field label/i), {
      target: { value: 'Comment' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Add Field/i }))

    fireEvent.click(screen.getByRole('button', { name: /Save Form/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        feedbackFormsApi,
        {
          title: 'Customer Feedback',
          description: 'Tell us what to improve',
          fields: [
            {
              name: 'comment',
              label: 'Comment',
              type: 'short_text',
              required: false,
              placeholder: undefined,
              options: undefined,
            },
          ],
        },
        {
          withCredentials: true,
          headers: { Authorization: 'Bearer fake-token' },
        },
      )
    })

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/forms')
  })
})
