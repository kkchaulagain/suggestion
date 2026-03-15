import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import { TestRouter } from './test-router'
import CreatePagePage from '../pages/business-dashboard/pages/CreatePagePage'

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

function renderCreatePage(path = '/dashboard/pages/create') {
  return render(
    <TestRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/pages/create" element={<CreatePagePage />} />
        <Route path="/dashboard/pages/:pageId/edit" element={<CreatePagePage />} />
      </Routes>
    </TestRouter>,
  )
}

async function renderCreatePageAndFlush(path = '/dashboard/pages/create') {
  renderCreatePage(path)
  await act(async () => {
    await Promise.resolve()
  })
}

/** In create mode, advance from template selection to the page builder (same as clicking "Start from scratch"). */
function goToBuildStep() {
  const startFromScratch = screen.getByRole('button', { name: /start from scratch/i })
  fireEvent.click(startFromScratch)
}

describe('CreatePagePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockImplementation(() => new Promise(() => {}))
    mockedAxios.post.mockResolvedValue({ data: {} })
    mockedAxios.put.mockResolvedValue({ data: {} })
  })

  test('shows template selection when creating a new page', async () => {
    await renderCreatePageAndFlush()
    expect(screen.getByRole('heading', { name: /choose a template/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start from scratch/i })).toBeInTheDocument()
  })

  test('selecting a template pre-fills blocks and advances to build step', async () => {
    await renderCreatePageAndFlush()
    fireEvent.click(screen.getByRole('button', { name: /form-builder marketing/i }))
    expect(screen.getByRole('heading', { name: /create page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit hero block/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /edit heading block/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /edit cta banner block/i })).toBeInTheDocument()
  })

  test('renders modern editor shell with sticky actions and page details sidebar after choosing template', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    expect(screen.getByRole('heading', { name: /create page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /content blocks/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /page details/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/feedback-forms/),
        expect.objectContaining({
          withCredentials: true,
          headers: { Authorization: 'Bearer fake-token' },
        }),
      )
    })
  })

  test('adds a hero block and edit form opens in dialog', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add hero block/i }))

    fireEvent.click(screen.getByRole('button', { name: /edit hero block/i }))
    expect(screen.getByLabelText(/^Headline$/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByLabelText(/^Headline$/i)).not.toBeInTheDocument()
  })

  test('hero block supports image and icon media options', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add hero block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit hero block/i }))

    fireEvent.change(screen.getByLabelText(/hero media/i), { target: { value: 'image' } })
    expect(screen.getByLabelText(/hero image url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hero image alt text/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/hero media/i), { target: { value: 'icon' } })
    expect(screen.getByLabelText(/hero icon/i)).toBeInTheDocument()
  })

  test('hero block shows Layout and Style selects and stores variant', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add hero block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit hero block/i }))

    expect(screen.getByLabelText(/^Layout$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Style$/i)).toBeInTheDocument()

    const layoutSelect = screen.getByLabelText(/^Layout$/i)
    fireEvent.change(layoutSelect, { target: { value: 'splitReversed' } })
    expect(layoutSelect).toHaveValue('splitReversed')

    const styleSelect = screen.getByLabelText(/^Style$/i)
    fireEvent.change(styleSelect, { target: { value: 'dark' } })
    expect(styleSelect).toHaveValue('dark')
  })

  test('inserts a paragraph block between existing blocks', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add heading block/i }))

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 2/i }))
    fireEvent.click(screen.getByRole('button', { name: /add cta banner block/i }))

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 2/i }))
    fireEvent.click(screen.getByRole('button', { name: /add paragraph block/i }))

    expect(screen.getByRole('button', { name: /edit heading block/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit paragraph block/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit cta banner block/i })).toBeInTheDocument()
  })

  test('adds an image block with image URL, alt text, and caption inputs', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add image block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit image block/i }))

    expect(screen.getByLabelText(/image url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/alt text/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/caption/i)).toBeInTheDocument()
  })
})
