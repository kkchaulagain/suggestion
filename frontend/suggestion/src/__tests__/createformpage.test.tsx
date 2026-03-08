import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

function renderCreateFormPage(path = '/dashboard/forms/create') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/forms/create" element={<CreateFormPage />} />
        <Route path="/dashboard/forms/:formId/edit" element={<CreateFormPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function getFieldRow(labelText: string) {
  const label = screen.getByText(labelText)
  return label.closest('[data-field-row]') as HTMLElement
}

describe('CreateFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get?.mockReset?.()
    mockedAxios.post.mockReset()
    mockedAxios.put?.mockReset?.()
    localStorage.clear()
  })

  test('renders fixed starter fields and allows adding custom fields after them', async () => {
    renderCreateFormPage()

    expect(screen.getByText('subject')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByText('attachment')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /\+ Add new field/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add new field/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Short Text$/i }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Short answer 4')).toBeInTheDocument()
    })
  })

  test('allows editing fixed field labels', () => {
    renderCreateFormPage()

    const subjectRow = getFieldRow('subject')
    fireEvent.click(within(subjectRow).getByRole('button', { name: /edit/i }))
    fireEvent.change(within(subjectRow).getByLabelText(/label/i), {
      target: { value: 'Issue subject' },
    })

    expect(within(subjectRow).getByDisplayValue('Issue subject')).toBeInTheDocument()
  })

  test('shows backend error when save fails', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Backend save failed' } },
    })

    renderCreateFormPage()
    fireEvent.click(screen.getByRole('button', { name: /save form/i }))

    await waitFor(() => {
      expect(screen.getByText(/Backend save failed/i)).toBeInTheDocument()
    })
  })

  test('validates empty title before save', async () => {
    renderCreateFormPage()

    fireEvent.change(screen.getByLabelText(/form title/i), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save form/i }))

    await waitFor(() => {
      expect(screen.getByText(/form title is required/i)).toBeInTheDocument()
    })
  })

  test('validates duplicate field names', async () => {
    renderCreateFormPage()

    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /more options/i }))
    fireEvent.change(screen.getByLabelText(/field name/i), {
      target: { value: 'duplicate_name' },
    })

    fireEvent.click(screen.getByRole('button', { name: /\+ Add new field/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add new field/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Short Text$/i }))
    // New field's editor opens with More options still expanded from first field
    fireEvent.change(screen.getByLabelText(/field name/i), {
      target: { value: 'duplicate_name' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save form/i }))

    await waitFor(() => {
      expect(screen.getByText(/field name must be unique inside the form/i)).toBeInTheDocument()
    })
  })

  test('validates radio fields with no options', async () => {
    renderCreateFormPage()

    fireEvent.click(screen.getByRole('button', { name: /\+ Add new field/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add new field/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Radio$/i }))
    const radioFieldRow = getFieldRow('Single choice 4')
    fireEvent.click(within(radioFieldRow).getByRole('button', { name: /remove option 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /save form/i }))

    await waitFor(() => {
      expect(screen.getByText(/checkbox and radio fields need at least one option/i)).toBeInTheDocument()
    })
  })

  test('loads an existing form in edit mode and updates it', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Existing form',
          description: 'Loaded description',
          fields: [
            { name: 'subject', label: 'Subject line', type: 'short_text', required: true },
            { name: 'description', label: 'Details', type: 'big_text', required: false },
            { name: 'attachment', label: 'Photo', type: 'image_upload', required: false },
          ],
        },
      },
    })
    mockedAxios.put.mockResolvedValueOnce({ data: {} })

    renderCreateFormPage('/dashboard/forms/form-123/edit')

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing form')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update form/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/form title/i), {
      target: { value: 'Updated form' },
    })
    fireEvent.click(screen.getByRole('button', { name: /update form/i }))

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${feedbackFormsApi}/form-123`,
        expect.objectContaining({
          title: 'Updated form',
        }),
        {
          withCredentials: true,
          headers: { Authorization: 'Bearer fake-token' },
        },
      )
    })
  })

  test('shows load error when edit-mode fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { data: { error: 'Failed to fetch existing form' } },
    })

    renderCreateFormPage('/dashboard/forms/form-404/edit')

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch existing form/i)).toBeInTheDocument()
    })
  })

  test('falls back to default fields when loaded form has no fields', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Existing form',
          description: 'Loaded description',
          fields: [],
        },
      },
    })

    renderCreateFormPage('/dashboard/forms/form-empty/edit')

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing form')).toBeInTheDocument()
    })

    expect(screen.getByText('subject')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByText('attachment')).toBeInTheDocument()
  })

  test('supports checkbox field editing including options, placeholder, required, and removal', async () => {
    renderCreateFormPage()

    fireEvent.click(screen.getByRole('button', { name: /\+ Add new field/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add new field/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Checkbox$/i }))
    const checkboxFieldRow = getFieldRow('Checkbox group 4')
    fireEvent.click(within(checkboxFieldRow).getByRole('button', { name: /more options/i }))

    fireEvent.change(within(checkboxFieldRow).getByLabelText(/placeholder/i), {
      target: { value: 'Pick all that apply' },
    })
    fireEvent.click(within(checkboxFieldRow).getByLabelText(/required field/i))
    fireEvent.click(within(checkboxFieldRow).getByRole('button', { name: /add option/i }))

    const optionInputs = within(checkboxFieldRow).getAllByPlaceholderText(/option \d+/i)
    fireEvent.change(optionInputs[0], { target: { value: 'Phone' } })
    fireEvent.change(optionInputs[1], { target: { value: 'Email' } })

    mockedAxios.post.mockResolvedValueOnce({ data: {} })
    fireEvent.click(screen.getByRole('button', { name: /save form/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        feedbackFormsApi,
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'checkbox_group_4',
              label: 'Checkbox group 4',
              type: 'checkbox',
              required: true,
              placeholder: 'Pick all that apply',
              options: ['Phone', 'Email'],
            }),
          ]),
        }),
        {
          withCredentials: true,
          headers: { Authorization: 'Bearer fake-token' },
        },
      )
    })

    fireEvent.click(within(checkboxFieldRow).getByRole('button', { name: /remove field: checkbox group 4/i }))
    expect(screen.queryByText('Checkbox group 4')).not.toBeInTheDocument()
  })

  test('allows changing a field type to radio and closes the editor', () => {
    renderCreateFormPage()

    const subjectRow = getFieldRow('subject')
    fireEvent.click(within(subjectRow).getByRole('button', { name: /edit/i }))
    fireEvent.change(within(subjectRow).getByLabelText(/type/i), {
      target: { value: 'radio' },
    })

    expect(within(subjectRow).getByDisplayValue('Option 1')).toBeInTheDocument()

    fireEvent.click(within(subjectRow).getByRole('button', { name: /close/i }))
    expect(within(subjectRow).queryByLabelText(/field name/i)).not.toBeInTheDocument()
  })

  test('saves form and navigates back to forms list', async () => {
    interface CreateFormSaveResponse {
      data: Record<string, never>
    }

    mockedAxios.post.mockResolvedValueOnce({ data: {} } as CreateFormSaveResponse)
    renderCreateFormPage()

    fireEvent.click(screen.getByRole('button', { name: /\+ Add new field/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add new field/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Short Text$/i }))
    const customFieldRow = getFieldRow('Short answer 4')
    fireEvent.change(within(customFieldRow).getByLabelText(/label/i), {
      target: { value: 'Comment' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save form/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        feedbackFormsApi,
        {
          title: 'Feedback form',
          description: 'test',
          fields: [
            {
              name: 'subject',
              label: 'subject',
              type: 'short_text',
              required: true,
              placeholder: undefined,
              options: undefined,
            },
            {
              name: 'description',
              label: 'description',
              type: 'big_text',
              required: false,
              placeholder: undefined,
              options: undefined,
            },
            {
              name: 'attachment',
              label: 'attachment',
              type: 'image_upload',
              required: false,
              placeholder: undefined,
              options: undefined,
            },
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

  test('Back without changes navigates to forms list', () => {
    renderCreateFormPage()
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/forms')
    expect(screen.queryByRole('heading', { name: /unsaved changes/i })).not.toBeInTheDocument()
  })

  test('Back with changes opens unsaved changes modal', () => {
    renderCreateFormPage()
    fireEvent.change(screen.getByLabelText(/form title/i), { target: { value: 'My form' } })
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('heading', { name: /unsaved changes/i })).toBeInTheDocument()
    expect(screen.getByText(/leave anyway/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('Unsaved changes modal Cancel closes modal and does not navigate', () => {
    renderCreateFormPage()
    fireEvent.change(screen.getByLabelText(/form title/i), { target: { value: 'My form' } })
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('heading', { name: /unsaved changes/i })).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('Unsaved changes modal Leave navigates to forms list', () => {
    renderCreateFormPage()
    fireEvent.change(screen.getByLabelText(/form title/i), { target: { value: 'My form' } })
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    fireEvent.click(screen.getByRole('button', { name: /^leave$/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/forms')
  })
})
