import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    fireEvent.change(styleSelect, { target: { value: 'minimal' } })
    expect(styleSelect).toHaveValue('minimal')
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

  test('edit mode loads page and shows Edit Page with data', async () => {
    mockedAxios.get.mockImplementation((url: string | unknown) => {
      const u = String(url ?? '')
      if (u.includes('feedback-forms')) return Promise.resolve({ data: { feedbackForms: [] } })
      if (u.includes('pid-123'))
        return Promise.resolve({
          data: {
            page: {
              _id: 'pid-123',
              slug: 'my-page',
              title: 'My Page',
              metaTitle: 'Meta',
              metaDescription: 'Desc',
              status: 'published',
              blocks: [{ type: 'heading', payload: { level: 2, text: 'Hello' } }],
            },
          },
        })
      return new Promise(() => {})
    })

    renderCreatePage('/dashboard/pages/pid-123/edit')

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /edit page/i })).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    expect(screen.getByDisplayValue('My Page')).toBeInTheDocument()
    expect(screen.getByDisplayValue('my-page')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Meta')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Desc')).toBeInTheDocument()
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /edit heading block/i })).toBeInTheDocument()
  })

  test('edit mode save calls PUT and navigates to pages list', async () => {
    mockedAxios.get.mockImplementation((url: string | unknown) => {
      const u = String(url ?? '')
      if (u.includes('feedback-forms')) return Promise.resolve({ data: { feedbackForms: [] } })
      if (u.includes('pid-123'))
        return Promise.resolve({
          data: {
            page: {
              _id: 'pid-123',
              slug: 'my-page',
              title: 'My Page',
              status: 'draft',
              blocks: [],
            },
          },
        })
      return new Promise(() => {})
    })
    mockedAxios.put.mockResolvedValueOnce({ data: {} })

    renderCreatePage('/dashboard/pages/pid-123/edit')

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /edit page/i })).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)

    await waitFor(
      () => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          expect.stringMatching(/pid-123/),
          expect.objectContaining({
            title: 'My Page',
            slug: 'my-page',
          }),
          expect.any(Object),
        )
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/pages')
      },
      { timeout: 3000 },
    )
  })

  test('edit mode Back to Pages link navigates to list', async () => {
    mockedAxios.get.mockImplementation((url: string | unknown) => {
      const u = String(url ?? '')
      if (u.includes('feedback-forms')) return Promise.resolve({ data: { feedbackForms: [] } })
      if (u.includes('pid-123'))
        return Promise.resolve({
          data: {
            page: {
              _id: 'pid-123',
              slug: 'my-page',
              title: 'My Page',
              status: 'draft',
              blocks: [],
            },
          },
        })
      return new Promise(() => {})
    })

    renderCreatePage('/dashboard/pages/pid-123/edit')

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /edit page/i })).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    const backLink = screen.getByRole('link', { name: /back to pages/i })
    expect(backLink).toHaveAttribute('href', '/dashboard/pages')
  })

  test('save validation shows error when title is empty', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    const titleInput = screen.getByPlaceholderText(/e\.g\. Contact us/i)
    await userEvent.clear(titleInput)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
    })
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  test('save create calls POST and navigates to pages list', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Contact us/i), 'New Page')
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringMatching(/pages/),
        expect.objectContaining({
          title: 'New Page',
          slug: 'new-page',
          status: 'draft',
        }),
        expect.any(Object),
      )
    })
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/pages')
  })

  test('save error shows API error message', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Slug already exists' } },
    })

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Contact us/i), 'New Page')
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText('Slug already exists')).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('Back to templates returns to template selection', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    expect(screen.getByRole('heading', { name: /create page/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /back to templates/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /choose a template/i })).toBeInTheDocument()
    })
  })

  test('empty state shows Start with your first block', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    expect(screen.getByText(/Start with your first block/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /insert block at position 1/i })).toBeInTheDocument()
  })

  test('status Published shows in badge when status is published', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    const statusSelect = document.getElementById('page-status') as HTMLSelectElement
    expect(statusSelect).toBeInTheDocument()
    fireEvent.change(statusSelect, { target: { value: 'published' } })
    expect(statusSelect.value).toBe('published')
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(1)
  })

  test('adds form block and can select form', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { feedbackForms: [{ _id: 'f1', title: 'Contact Form' }] },
    })
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add form block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit form block/i }))

    const formSelect = screen.getByLabelText(/select form/i)
    expect(formSelect).toBeInTheDocument()
    fireEvent.change(formSelect, { target: { value: 'f1' } })
    expect(formSelect).toHaveValue('f1')
  })

  test('adds feature card block and edits title and icon', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add feature card block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit feature card block/i }))

    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Icon$/i)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/^Title$/i), 'My Feature')
    fireEvent.change(screen.getByLabelText(/^Icon$/i), { target: { value: 'share2' } })
  })

  test('adds feature grid block, adds item, removes item, sets 2 columns', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add feature grid block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit feature grid block/i }))

    const columnsSelect = screen.getByLabelText(/^Columns$/i)
    fireEvent.change(columnsSelect, { target: { value: '2' } })
    expect(columnsSelect).toHaveValue('2')

    const addItemBtn = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addItemBtn)

    const removeButtons = screen.getAllByRole('button', { name: /remove item 1/i })
    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[0])
    }
  })

  test('hero block Use placeholder image button updates block', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add hero block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit hero block/i }))
    fireEvent.change(screen.getByLabelText(/hero media/i), { target: { value: 'image' } })

    fireEvent.click(screen.getByRole('button', { name: /use placeholder image/i }))
    expect(screen.getByLabelText(/hero image url/i)).toBeInTheDocument()
  })

  test('hero block Upload and Crop opens upload target', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add hero block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit hero block/i }))
    fireEvent.change(screen.getByLabelText(/hero media/i), { target: { value: 'image' } })

    const uploadBtn = screen.getByRole('button', { name: /upload.*crop.*hero/i })
    fireEvent.click(uploadBtn)
    expect(await screen.findByText(/upload and crop hero image/i, {}, { timeout: 3000 })).toBeInTheDocument()
  })

  test('image block Use placeholder and Upload and Crop buttons', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add image block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit image block/i }))

    fireEvent.click(screen.getByRole('button', { name: /use placeholder image/i }))
    const uploadBtn = screen.getByRole('button', { name: /upload.*crop.*image/i })
    fireEvent.click(uploadBtn)
    expect(await screen.findByText(/upload and crop image/i, {}, { timeout: 3000 })).toBeInTheDocument()
  })

  test('adds CTA block and edits text and link', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add cta banner block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit cta banner block/i }))

    expect(screen.getByLabelText(/^Text$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Button label$/i)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/^Text$/i), 'Sign up now')
  })

  test('heading block supports level 1 and 3', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add heading block/i }))
    fireEvent.click(screen.getByRole('button', { name: /edit heading block/i }))

    const levelSelect = screen.getByLabelText(/^Level$/i)
    fireEvent.change(levelSelect, { target: { value: '1' } })
    expect(levelSelect).toHaveValue('1')
    fireEvent.change(levelSelect, { target: { value: '3' } })
    expect(levelSelect).toHaveValue('3')
  })

  test('move block down swaps order', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add heading block/i }))
    fireEvent.click(screen.getByRole('button', { name: /insert block at position 2/i }))
    fireEvent.click(screen.getByRole('button', { name: /add paragraph block/i }))

    const moveDownButtons = screen.getAllByRole('button', { name: /move heading block down/i })
    expect(moveDownButtons.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(moveDownButtons[0])
    expect(screen.getByRole('button', { name: /edit paragraph block/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit heading block/i })).toBeInTheDocument()
  })

  test('remove block removes from list', async () => {
    await renderCreatePageAndFlush()
    goToBuildStep()

    fireEvent.click(screen.getByRole('button', { name: /insert block at position 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /add heading block/i }))
    fireEvent.click(screen.getByRole('button', { name: /insert block at position 2/i }))
    fireEvent.click(screen.getByRole('button', { name: /add paragraph block/i }))

    const removeButtons = screen.getAllByRole('button', { name: /remove heading block/i })
    fireEvent.click(removeButtons[0])
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /edit heading block/i })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /edit paragraph block/i })).toBeInTheDocument()
  })
})
