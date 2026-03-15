import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import { TestRouter } from './test-router'
import PagesPage from '../pages/business-dashboard/pages/PagesPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

function renderPagesPage() {
  return render(
    <TestRouter initialEntries={['/dashboard/pages']}>
      <Routes>
        <Route path="/dashboard/pages" element={<PagesPage />} />
      </Routes>
    </TestRouter>,
  )
}

describe('PagesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows loading skeletons then empty state when no pages', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { pages: [] } })

    renderPagesPage()

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('pages'),
        expect.objectContaining({ withCredentials: true }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText(/You don't have any pages yet/)).toBeInTheDocument()
    })
  })

  test('shows error when load fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    renderPagesPage()

    await waitFor(() => {
      expect(screen.getByText(/Unable to load pages/)).toBeInTheDocument()
    })
  })

  test('renders page list and Add Page button', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        pages: [
          {
            _id: 'p1',
            slug: 'landing',
            title: 'Landing',
            status: 'published',
            blocks: [{ type: 'hero', payload: {} }],
          },
          {
            _id: 'p2',
            slug: 'about',
            title: 'About',
            status: 'draft',
            blocks: [],
          },
        ],
      },
    })

    renderPagesPage()

    await waitFor(() => {
      expect(screen.getByText('Landing')).toBeInTheDocument()
    })

    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Page/i })).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  test('Add Page navigates to create', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { pages: [] } })

    renderPagesPage()

    await waitFor(() => {
      expect(screen.getByText(/You don't have any pages yet/)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Add Page/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/pages/create')
  })

  test('Edit button navigates to edit route', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        pages: [
          { _id: 'p1', slug: 'landing', title: 'Landing', status: 'draft', blocks: [] },
        ],
      },
    })

    renderPagesPage()

    await waitFor(() => {
      expect(screen.getByText('Landing')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Edit Landing/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/pages/p1/edit')
  })

  test('Delete opens modal and delete removes page', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        pages: [
          { _id: 'p1', slug: 'landing', title: 'Landing', status: 'draft', blocks: [] },
        ],
      },
    })

    renderPagesPage()

    await waitFor(() => {
      expect(screen.getByText('Landing')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Delete Landing/i }))
    expect(screen.getByRole('heading', { name: /Delete page/i })).toBeInTheDocument()
    expect(screen.getByText(/"Landing" will be permanently deleted/)).toBeInTheDocument()

    mockedAxios.delete.mockResolvedValueOnce({})

    await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }))

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/p1'),
        expect.any(Object),
      )
    })

    await waitFor(() => {
      expect(screen.queryByText('Landing')).not.toBeInTheDocument()
    })
  })

  test('View button opens public page in new tab for published page', async () => {
    const windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null)
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        pages: [
          {
            _id: 'p1',
            slug: 'landing',
            title: 'Landing',
            status: 'published',
            blocks: [],
          },
        ],
      },
    })

    renderPagesPage()

    await waitFor(() => {
      expect(screen.getByText('Landing')).toBeInTheDocument()
    })

    const viewBtn = screen.getByRole('button', { name: /View Landing/i })
    await userEvent.click(viewBtn)

    expect(windowOpen).toHaveBeenCalledWith('/c/p1/landing', '_blank')
    windowOpen.mockRestore()
  })
})
