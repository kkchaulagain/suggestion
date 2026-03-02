import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'

import FormRenderPage from '../pages/feedback-form-render/FormRenderPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockFormConfig = {
  feedbackForm: {
    _id: 'form-1',
    title: 'Customer Feedback',
    description: 'Tell us what you think.',
    fields: [
      { name: 'comment', label: 'Comment', type: 'short_text', required: true, placeholder: 'Your comment' },
      { name: 'rating', label: 'Rating', type: 'radio', required: true, options: ['Good', 'Bad'] },
    ],
  },
}

function renderFormRenderPage(formId: string) {
  return render(
    <MemoryRouter initialEntries={[`/feedback-forms/${formId}`]}>
      <Routes>
        <Route path="/feedback-forms/:formId" element={<FormRenderPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FormRenderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
  })

  test('shows loading then form title and description', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })

    renderFormRenderPage('form-1')

    expect(screen.getByText(/Loading form/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Customer Feedback/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Tell us what you think/i)).toBeInTheDocument()
  })

  test('renders fields by type: short_text and radio with options', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByLabelText(/Comment/i)).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText(/Your comment/i)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Good/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Bad/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
  })

  test('shows Form not found for 404 response', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404, data: { error: 'Form not found.' } } })

    renderFormRenderPage('nonexistent-id')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Form not found/i })).toBeInTheDocument()
      expect(screen.getByText('Form not found.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Go to home' })).toBeInTheDocument()
    })
  })

  test('shows Form not found for invalid form id (400)', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 400, data: { error: 'Invalid feedback form id' } } })

    renderFormRenderPage('invalid')

    await waitFor(() => {
      expect(screen.getByText(/Form not found/i)).toBeInTheDocument()
    })
  })

  test('submit with required fields filled shows thank you message', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Customer Feedback/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Your comment/i), { target: { value: 'Great service' } })
    fireEvent.click(screen.getByRole('radio', { name: /Good/i }))
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Thank you/i)).toBeInTheDocument()
      expect(screen.getByText(/Your response has been recorded/i)).toBeInTheDocument()
    })
  })

  test('submit without required field shows validation error', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: /Customer Feedback/i })).toBeInTheDocument()
  })
})
