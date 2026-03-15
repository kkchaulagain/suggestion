import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import { TestRouter } from './test-router'
import { ThemeProvider } from '../context/ThemeContext'
import PublicPageView from '../pages/cms-public/PublicPageView'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function renderPublicPageView(initialPath = '/c/page-1/landing') {
  return render(
    <TestRouter initialEntries={[initialPath]}>
      <ThemeProvider>
        <Routes>
          <Route path="/c/:id/:slug" element={<PublicPageView />} />
          <Route path="/c" element={<PublicPageView />} />
        </Routes>
      </ThemeProvider>
    </TestRouter>,
  )
}

describe('PublicPageView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows loading then error when no id', async () => {
    render(
      <TestRouter initialEntries={['/c']}>
        <ThemeProvider>
          <Routes>
            <Route path="/c/:id/:slug" element={<PublicPageView />} />
            <Route path="/c" element={<PublicPageView />} />
          </Routes>
        </ThemeProvider>
      </TestRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument()
    })
    expect(mockedAxios.get).not.toHaveBeenCalled()
  })

  test('shows loading then page not found on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } })

    renderPublicPageView()

    expect(screen.getByText(/Loading/)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Page not found/)).toBeInTheDocument()
    })
  })

  test('shows generic error on non-404 failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText(/Failed to load page/)).toBeInTheDocument()
    })
  })

  test('renders page with heading and paragraph blocks', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            { type: 'heading', payload: { level: 1, text: 'Welcome' } },
            { type: 'paragraph', payload: { text: 'Intro text here.' } },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome', level: 1 })).toBeInTheDocument()
    })
    expect(screen.getByText('Intro text here.')).toBeInTheDocument()
  })

  test('renders hero block', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'hero',
              payload: {
                headline: 'Hero Headline',
                subheadline: 'Hero subheadline',
                variant: 'centered',
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hero Headline/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Hero subheadline/)).toBeInTheDocument()
  })

  test('renders CTA block', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'cta',
              payload: {
                text: 'Sign up today',
                ctaLabel: 'Get started',
                ctaHref: '/signup',
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('Sign up today')).toBeInTheDocument()
    })
    const links = screen.getAllByRole('link', { name: /Get started/i })
    expect(links.some((el) => el.getAttribute('href') === '/signup')).toBe(true)
  })

  test('renders feature_card_grid when consecutive feature_card blocks', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'feature_card',
              payload: { title: 'Feature A', description: 'Desc A', icon: 'file-text' },
            },
            {
              type: 'feature_card',
              payload: { title: 'Feature B', description: 'Desc B', icon: 'share2' },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('Feature A')).toBeInTheDocument()
    })
    expect(screen.getByText('Feature B')).toBeInTheDocument()
    expect(screen.getByText('Desc A')).toBeInTheDocument()
    expect(screen.getByText('Desc B')).toBeInTheDocument()
  })

  test('sets document title from metaTitle then page title', async () => {
    const originalTitle = document.title
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Page Title',
          metaTitle: 'Custom Meta Title',
          status: 'published',
          blocks: [],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(document.title).toBe('Custom Meta Title')
    })

    document.title = originalTitle
  })
})
