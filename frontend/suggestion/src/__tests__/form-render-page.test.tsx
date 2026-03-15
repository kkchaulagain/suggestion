import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes, useParams } from 'react-router-dom'
import { TestRouter } from './test-router'
import axios from 'axios'

import { ThemeProvider } from '../context/ThemeContext'
import FormRenderPage from '../pages/feedback-form-render/FormRenderPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../pages/feedback-form-render/branding', () => ({
  branding: { siteName: 'Suggestion Platform', tagline: '', logoUrl: '' },
}))

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
      { name: 'comment', label: 'Comment', type: 'text', required: true, placeholder: 'Your comment' },
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
      { name: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'Long answer...' },
      { name: 'agree', label: 'I agree', type: 'checkbox', required: true, options: ['Yes', 'No'] },
      { name: 'photo', label: 'Upload photo', type: 'image', required: false },
    ],
  },
}

const mockAnonymousEmailForm = {
  feedbackForm: {
    _id: 'form-anon-email',
    title: 'Anonymous Email Form',
    description: 'Anonymous email is allowed.',
    fields: [
      { name: 'email', label: 'Email Address', type: 'email', required: true, allowAnonymous: true, placeholder: 'you@example.com' },
      { name: 'comment', label: 'Comment', type: 'short_text', required: false, placeholder: 'Your comment' },
    ],
  },
}

function renderFormRenderPage(formId: string) {
  mockedUseParams.mockReturnValue({ formId })
  return render(
    <ThemeProvider>
      <TestRouter initialEntries={[`/feedback-forms/${formId}`]}>
        <Routes>
          <Route path="/feedback-forms/:formId" element={<FormRenderPage />} />
        </Routes>
      </TestRouter>
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
      expect(screen.getByText(/Customer Feedback/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Tell us what you think/i)).toBeInTheDocument()
  })

  test('renders fields by type: text and radio with options', async () => {
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
      expect(screen.getByText(/Customer Feedback/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Your comment/i), { target: { value: 'Great service' } })
    fireEvent.click(screen.getByRole('radio', { name: /Good/i }))
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Response recorded/i)).toBeInTheDocument()
      expect(screen.getByText(/You can view results below/i)).toBeInTheDocument()
    })
  })

  test('after submit shows See results link that points to results page', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByText(/Customer Feedback/i)).toBeInTheDocument()
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
      expect(screen.getByText(/Quick Poll/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('radio', { name: /Yes/i }))
    fireEvent.click(screen.getByRole('button', { name: /Cast Vote/i }))

    await waitFor(() => {
      expect(screen.getByText(/Vote submitted/i)).toBeInTheDocument()
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
          { name: 'comment', label: 'Comment', type: 'text', required: false },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: privateFormConfig })
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-private')

    await waitFor(() => {
      expect(screen.getByText(/Private Form/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Thanks for taking the time/i)).toBeInTheDocument()
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
    expect(screen.getByText(/Customer Feedback/i)).toBeInTheDocument()
    const commentInput = screen.getByRole('textbox', { name: /Comment/i })
    expect(commentInput).toHaveAttribute('aria-invalid', 'true')
  })

  test('allows anonymous email field to submit without client-side required error', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockAnonymousEmailForm })
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-anon-email')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Anonymous Email Form/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText(/submit anonymously/i))
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })
    expect(screen.queryByText(/Email Address is required/i)).not.toBeInTheDocument()
  })

  test('shows error when formId is missing', async () => {
    mockedUseParams.mockReturnValue({})
    render(
      <ThemeProvider>
        <TestRouter initialEntries={['/feedback-forms']}>
          <Routes>
            <Route path="/feedback-forms" element={<FormRenderPage />} />
          </Routes>
        </TestRouter>
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

  test('renders textarea, checkbox, and image fields', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormWithCheckboxBigTextImage })

    renderFormRenderPage('form-2')

    await waitFor(() => {
      expect(screen.getByText(/Survey/i)).toBeInTheDocument()
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
          fields: [{ name: 'x', label: 'X', type: 'text', required: false }],
        },
      },
    })

    renderFormRenderPage('f3')

    await waitFor(() => {
      expect(screen.getByText(/No Description Form/i)).toBeInTheDocument()
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
          { name: 'comment', label: 'Comment', type: 'text', required: false },
          { name: 'photo', label: 'Photo', type: 'image', required: false },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: formWithImage })
    mockedAxios.post
      .mockResolvedValueOnce({ data: { url: 'https://cdn.example.com/photo.jpg' } })
      .mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-img')

    await waitFor(() => {
      expect(screen.getByText(/With Photo/i)).toBeInTheDocument()
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
      expect(screen.getByText(/Response recorded/i)).toBeInTheDocument()
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

  test('multistep form: clicking Next does not submit the form', async () => {
    const multistepForm = {
      feedbackForm: {
        _id: 'form-ms',
        title: 'Two Step Form',
        description: '',
        fields: [
          { name: 'a', label: 'Field A', type: 'text', required: true, stepId: 's1', stepOrder: 0 },
          { name: 'b', label: 'Field B', type: 'text', required: false, stepId: 's2', stepOrder: 0 },
        ],
        steps: [
          { id: 's1', title: 'Step 1', order: 0 },
          { id: 's2', title: 'Step 2', order: 1 },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: multistepForm })

    renderFormRenderPage('form-ms')

    await waitFor(() => {
      expect(screen.getByText(/Two Step Form/i)).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText(/Field A/i), { target: { value: 'filled' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Field B/i)).toBeInTheDocument()
    })
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  test('multistep form: Next with valid step clears errors and advances', async () => {
    const multistepForm = {
      feedbackForm: {
        _id: 'form-ms',
        title: 'Two Step Form',
        description: '',
        fields: [
          { name: 'a', label: 'Field A', type: 'text', required: true, stepId: 's1', stepOrder: 0 },
          { name: 'b', label: 'Field B', type: 'text', required: false, stepId: 's2', stepOrder: 0 },
        ],
        steps: [
          { id: 's1', title: 'Step 1', order: 0 },
          { id: 's2', title: 'Step 2', order: 1 },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: multistepForm })

    renderFormRenderPage('form-ms')

    await waitFor(() => {
      expect(screen.getByText(/Two Step Form/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/Field A/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Field A/i), { target: { value: 'filled' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Field B/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument()
  })

  test('multistep form: full flow fill step 1, Next, fill step 2, Submit sends once and shows thank you', async () => {
    const multistepForm = {
      feedbackForm: {
        _id: 'form-ms-submit',
        title: 'Two Step Submit',
        description: '',
        fields: [
          { name: 'a', label: 'Field A', type: 'text', required: true, stepId: 's1', stepOrder: 0 },
          { name: 'b', label: 'Field B', type: 'text', required: true, stepId: 's2', stepOrder: 0 },
        ],
        steps: [
          { id: 's1', title: 'Step 1', order: 0 },
          { id: 's2', title: 'Step 2', order: 1 },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: multistepForm })
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Submission received' } })

    renderFormRenderPage('form-ms-submit')

    await waitFor(() => {
      expect(screen.getByText(/Two Step Submit/i)).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText(/Field A/i), { target: { value: 'value A' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Field B/i)).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText(/Field B/i), { target: { value: 'value B' } })
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/submit$/),
        expect.objectContaining({ a: 'value A', b: 'value B' }),
      )
    })
    await waitFor(() => {
      expect(screen.getByText(/Response recorded/i)).toBeInTheDocument()
    })
  })

  test('single-step form shows only Submit button, not Next', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockFormConfig })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByText(/Customer Feedback/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument()
  })

  test('drawer style: drawer is open by default, form visible and landing hidden', async () => {
    const drawerFormConfig = {
      feedbackForm: {
        ...mockFormConfig.feedbackForm,
        formStyle: 'drawer',
        drawerDefaultOpen: true,
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: drawerFormConfig })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      const drawer = screen.getByTestId('form-drawer')
      expect(drawer).toHaveAttribute('aria-hidden', 'false')
    })
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Comment/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Start/i })).not.toBeInTheDocument()
  })

  test('drawer style with drawerDefaultOpen false: drawer starts closed, opens on Start click', async () => {
    const drawerFormConfig = {
      feedbackForm: {
        ...mockFormConfig.feedbackForm,
        formStyle: 'drawer',
        drawerDefaultOpen: false,
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: drawerFormConfig })

    renderFormRenderPage('form-1')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument()
    })
    const drawer = screen.getByTestId('form-drawer')
    await waitFor(() => {
      expect(drawer).toHaveAttribute('aria-hidden', 'true')
    })

    fireEvent.click(screen.getByRole('button', { name: /Start/i }))

    await waitFor(() => {
      expect(drawer).toHaveAttribute('aria-hidden', 'false')
    })
  })

  test('multistep form: required field empty blocks Next and shows validation', async () => {
    const multistepForm = {
      feedbackForm: {
        _id: 'form-ms-valid',
        title: 'Two Step Required',
        description: '',
        fields: [
          { name: 'a', label: 'Field A', type: 'text', required: true, stepId: 's1', stepOrder: 0 },
          { name: 'b', label: 'Field B', type: 'text', required: false, stepId: 's2', stepOrder: 0 },
        ],
        steps: [
          { id: 's1', title: 'Step 1', order: 0 },
          { id: 's2', title: 'Step 2', order: 1 },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: multistepForm })

    renderFormRenderPage('form-ms-valid')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
    })
    expect(screen.getByLabelText(/Field A/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Field B/i)).not.toBeInTheDocument()
  })

  test('multistep form: Back clears errors and returns to previous step', async () => {
    const multistepForm = {
      feedbackForm: {
        _id: 'form-ms2',
        title: 'Two Step Form',
        description: '',
        fields: [
          { name: 'a', label: 'Field A', type: 'text', required: false, stepId: 's1', stepOrder: 0 },
          { name: 'b', label: 'Field B', type: 'text', required: false, stepId: 's2', stepOrder: 0 },
        ],
        steps: [
          { id: 's1', title: 'Step 1', order: 0 },
          { id: 's2', title: 'Step 2', order: 1 },
        ],
      },
    }
    mockedAxios.get.mockResolvedValueOnce({ data: multistepForm })

    renderFormRenderPage('form-ms2')

    await waitFor(() => {
      expect(screen.getByLabelText(/Field A/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Field B/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Back/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Field A/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/Field B/i)).not.toBeInTheDocument()
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
