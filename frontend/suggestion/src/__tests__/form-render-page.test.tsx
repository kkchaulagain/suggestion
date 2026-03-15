import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import axios from 'axios'

import { ThemeProvider } from '../context/ThemeContext'
import FormRenderPage from '../pages/feedback-form-render/FormRenderPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))
const mockedUseParams = useParams as jest.MockedFunction<typeof useParams>

const mockFormConfig = {
  feedbackForm: {
    _id: 'form-1',
    title: 'Customer Feedback',
    description: 'Tell us what you think.',
    showResultsPublic: true,
    fields: [
      { name: 'comment', label: 'Comment', type: 'short_text', required: true, placeholder: 'Your comment' },
      { name: 'rating', label: 'Rating', type: 'radio', required: true, options: ['Good', 'Bad'] },
    ],
  },
}

const mockFormWithCheckboxBigTextImage = {
  feedbackForm: {
    _id: 'form-2',
    title: 'Survey',
    description: 'Optional description.',
    fields: [
      { name: 'notes', label: 'Notes', type: 'big_text', required: false, placeholder: 'Long answer...' },
      { name: 'agree', label: 'I agree', type: 'checkbox', required: true, options: ['Yes', 'No'] },
      { name: 'photo', label: 'Upload photo', type: 'image_upload', required: false },
    ],
  },
}

function renderFormRenderPage(formId: string) {
  mockedUseParams.mockReturnValue({ formId })
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[`/feedback-forms/${formId}`]}>
        <Routes>
          <Route path="/feedback-forms/:formId" element={<FormRenderPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('FormRenderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    mockedUseParams.mockReturnValue({ formId: 'form-1' })
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

  test('after submit shows See results link that points to results page', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Customer Feedback/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Your comment/i), { target: { value: 'Great' } })
    fireEvent.click(screen.getByRole('radio', { name: /Good/i }))
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByTestId('see-results-link')).toBeInTheDocument()
    })
    const seeResultsLink = screen.getByTestId('see-results-link')
    expect(seeResultsLink).toHaveAttribute('href', '/feedback-forms/form-1/results')
  })

  test('after submit for poll shows Thanks for voting and See results', async () => {
    const pollConfig = {
      feedbackForm: {
        _id: 'poll-1',
        title: 'Quick Poll',
        description: 'Vote now.',
        kind: 'poll',
        showResultsPublic: true,
        fields: [
          { name: 'vote', label: 'Your vote', type: 'radio', required: true, options: ['Yes', 'No'] },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: pollConfig })
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('poll-1')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Quick Poll/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('radio', { name: /Yes/i }))
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Thanks for voting!/i)).toBeInTheDocument()
      expect(screen.getByTestId('see-results-link')).toBeInTheDocument()
    })
  })

  test('after submit does not show See results link when showResultsPublic is false', async () => {
    const privateFormConfig = {
      feedbackForm: {
        _id: 'form-private',
        title: 'Private Form',
        description: 'No results link.',
        showResultsPublic: false,
        fields: [
          { name: 'comment', label: 'Comment', type: 'short_text', required: false },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: privateFormConfig })
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-private')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Private Form/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Your response has been recorded/i)).toBeInTheDocument()
    })
    expect(screen.queryByTestId('see-results-link')).not.toBeInTheDocument()
  })

  test('submit without required field shows validation error and highlights invalid field', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('heading', { name: /Customer Feedback/i })).toBeInTheDocument()
    const commentInput = screen.getByRole('textbox', { name: /Comment/i })
    expect(commentInput).toHaveAttribute('aria-invalid', 'true')
  })

  test('shows error when formId is missing', async () => {
    mockedUseParams.mockReturnValue({})
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/feedback-forms']}>
          <Routes>
            <Route path="/feedback-forms" element={<FormRenderPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText(/Missing form ID/i)).toBeInTheDocument()
    })
  })

  test('shows Failed to load form on generic fetch error', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 500 } })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByText(/Failed to load form\./i)).toBeInTheDocument()
    })
  })

  test('renders big_text, checkbox, and image_upload fields', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormWithCheckboxBigTextImage })

    renderFormRenderPage('form-2')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Survey/i })).toBeInTheDocument()
    })
    const notesField = screen.getByRole('textbox', { name: /Notes/i })
    expect(notesField).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Long answer/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Yes/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /No/i })).toBeInTheDocument()
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
    expect(fileInput).toBeInTheDocument()
    fireEvent.change(notesField, { target: { value: 'Some notes' } })
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [new File([''], 'photo.png', { type: 'image/png' })] } })
    }
  })

  test('checkbox required validation and toggle', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormWithCheckboxBigTextImage })

    renderFormRenderPage('form-2')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('checkbox', { name: /Yes/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Yes/i }))
    expect(screen.getByRole('checkbox', { name: /Yes/i })).not.toBeChecked()
  })

  test('form without description does not show description paragraph', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          _id: 'f3',
          title: 'No Description Form',
          fields: [{ name: 'x', label: 'X', type: 'short_text', required: false }],
        },
      },
    })

    renderFormRenderPage('f3')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /No Description Form/i })).toBeInTheDocument()
    })
    expect(screen.queryByText(/Optional description/i)).not.toBeInTheDocument()
  })

  test('submits form with image: uploads file then submits with url', async () => {
    const formWithImage = {
      feedbackForm: {
        _id: 'form-img',
        title: 'With Photo',
        description: '',
        fields: [
          { name: 'comment', label: 'Comment', type: 'short_text', required: false },
          { name: 'photo', label: 'Photo', type: 'image_upload', required: false },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: formWithImage })
    mockedAxios.post
      .mockResolvedValueOnce({ data: { url: 'https://cdn.example.com/photo.jpg' } })
      .mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-img')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /With Photo/i })).toBeInTheDocument()
    })

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [new File(['x'], 'pic.jpg', { type: 'image/jpeg' })] } })
    }
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\/api\/upload$/),
        expect.any(FormData),
        expect.any(Object),
      )
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\/submit$/),
        expect.objectContaining({ photo: 'https://cdn.example.com/photo.jpg' }),
      )
    })
    await waitFor(() => {
      expect(screen.getByText(/Thank you/i)).toBeInTheDocument()
    })
  })

  test('renders star rating as clickable stars and submits selected value', async () => {
    const starOptions = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          _id: 'form-star',
          title: 'Rate us',
          description: 'Optional.',
          fields: [
            { name: 'experience', label: 'Overall experience', type: 'radio', required: true, options: starOptions },
          ],
        },
      },
    })
    mockedAxios.post.mockResolvedValueOnce({ data: {} })

    renderFormRenderPage('form-star')

    await waitFor(() => {
      expect(screen.getByRole('group', { name: /overall experience/i })).toBeInTheDocument()
    })
    const fourStarsButton = screen.getByRole('button', { name: /4 stars/i })
    fireEvent.click(fourStarsButton)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/submit$/),
        expect.objectContaining({ experience: '★★★★ 4 Stars' }),
      )
    })
  })

  test('star rating can be selected with keyboard (Enter)', async () => {
    const starOptions = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          _id: 'form-star',
          title: 'Rate us',
          description: 'Optional.',
          fields: [
            { name: 'experience', label: 'Overall experience', type: 'radio', required: true, options: starOptions },
          ],
        },
      },
    })
    mockedAxios.post.mockResolvedValueOnce({ data: {} })

    renderFormRenderPage('form-star')

    await waitFor(() => {
      expect(screen.getByRole('group', { name: /overall experience/i })).toBeInTheDocument()
    })
    const threeStarsButton = screen.getByRole('button', { name: /3 stars/i })
    fireEvent.keyDown(threeStarsButton, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/submit$/),
        expect.objectContaining({ experience: '★★★ 3 Stars' }),
      )
    })
  })
})
