import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import SubmissionsPage from '../pages/business-dashboard/pages/SubmissionsPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ getAuthHeaders: () => ({ Authorization: 'Bearer token' }) }),
}))

describe('SubmissionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
  })

  it('shows loading then empty state with filters', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { feedbackForms: [{ _id: 'f1', title: 'Form 1' }] } })
      .mockResolvedValueOnce({ data: { submissions: [], total: 0 } })

    render(
      <MemoryRouter>
        <SubmissionsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Loading submissions/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/No submissions found/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: /Submissions/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/From/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/To/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument()
  })

  it('shows error when submissions fetch fails', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { feedbackForms: [] } })
      .mockRejectedValueOnce(new Error('Network error'))

    render(
      <MemoryRouter>
        <SubmissionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to load submissions/i)).toBeInTheDocument()
    })
  })

  it('shows table when submissions exist and View opens modal', async () => {
    // Use different titles to avoid duplicate text: form title = "My Form", submission formTitle = "My Form"
    // but for the select option we name the form "My Form" while the table also shows "My Form";
    // instead use different names so getByText works unambiguously
    const submissions = [
      {
        _id: 's1',
        formId: 'f1',
        formTitle: 'My Survey',   // shown in table cell
        formSnapshot: [{ name: 'q', label: 'Question', type: 'short_text' }],
        responses: { q: 'The Answer' },
        submittedAt: '2024-06-01T12:00:00.000Z',
      },
    ]
    mockedAxios.get
      .mockResolvedValueOnce({ data: { feedbackForms: [{ _id: 'f1', title: 'Survey Form' }] } }) // option label ≠ formTitle
      .mockResolvedValueOnce({ data: { submissions, total: 1 } })

    render(
      <MemoryRouter>
        <SubmissionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View/i })).toBeInTheDocument()
    })
    // Table cell shows formTitle
    expect(screen.getByRole('cell', { name: /My Survey/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /View/i }))

    await waitFor(() => {
      expect(screen.getByText('Question')).toBeInTheDocument()
      expect(screen.getByText('The Answer')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument()
    })

    // Dismiss via Close button
    fireEvent.click(screen.getByRole('button', { name: /Close/i }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Close/i })).not.toBeInTheDocument()
    })
  })

  it('modal dismisses on backdrop click', async () => {
    const submissions = [
      {
        _id: 's2',
        formId: 'f1',
        formTitle: 'Alpha Survey',
        formSnapshot: [],
        responses: {},
        submittedAt: new Date().toISOString(),
      },
    ]
    mockedAxios.get
      .mockResolvedValueOnce({ data: { feedbackForms: [] } })
      .mockResolvedValueOnce({ data: { submissions, total: 1 } })

    render(
      <MemoryRouter>
        <SubmissionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /View/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument()
    })

    // Click the backdrop (the fixed overlay div, not the inner card)
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement
    if (backdrop) fireEvent.click(backdrop)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Close/i })).not.toBeInTheDocument()
    })
  })

  it('Apply filters re-fetches submissions with applied state', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { feedbackForms: [{ _id: 'f1', title: 'F1' }] } })
      .mockResolvedValueOnce({ data: { submissions: [], total: 0 } })
      .mockResolvedValueOnce({ data: { submissions: [], total: 0 } })

    render(
      <MemoryRouter>
        <SubmissionsPage />
      </MemoryRouter>,
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/No submissions found/i)).toBeInTheDocument()
    })

    // Change date filters and hit Apply
    fireEvent.change(screen.getByLabelText(/From/i), { target: { value: '2024-01-01' } })
    fireEvent.change(screen.getByLabelText(/To/i), { target: { value: '2024-12-31' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Apply/i }))
    })

    // A third GET call should have been made for the new filters
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    })
  })

  it('applies formId from URL and fetches submissions for that form', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { feedbackForms: [{ _id: 'f-from-url', title: 'Form From URL' }] } })
      .mockResolvedValueOnce({ data: { submissions: [], total: 0 } })

    render(
      <MemoryRouter initialEntries={['/dashboard/submissions?formId=f-from-url']}>
        <SubmissionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/No submissions found/i)).toBeInTheDocument()
    })

    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    const submissionsCall = mockedAxios.get.mock.calls.find((call) => String(call[0]).includes('submissions'))
    expect(submissionsCall).toBeDefined()
    expect(submissionsCall![0]).toMatch(/\?.*formId=f-from-url/)
  })

  it('Previous/Next pagination buttons work', async () => {
    const manySubmissions = Array.from({ length: 20 }, (_, i) => ({
      _id: `sub-${i}`,
      formId: 'f',
      formTitle: 'F',
      formSnapshot: [],
      responses: {},
      submittedAt: new Date().toISOString(),
    }))
    mockedAxios.get
      .mockResolvedValueOnce({ data: { feedbackForms: [] } })
      .mockResolvedValueOnce({ data: { submissions: manySubmissions, total: 25 } })
      .mockResolvedValueOnce({ data: { submissions: [], total: 25 } })

    render(
      <MemoryRouter>
        <SubmissionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
    })

    const nextBtn = screen.getByRole('button', { name: /Next/i })
    expect(nextBtn).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(nextBtn)
    })

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/page=2/),
        expect.any(Object),
      )
    })
  })
})
