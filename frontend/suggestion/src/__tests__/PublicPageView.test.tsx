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

  test('renders testimonials block with heading and layout', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'testimonials',
              payload: {
                heading: 'What people say',
                subheading: 'Real feedback from users.',
                layout: 'grid',
                testimonials: [
                  { quote: 'This product is great.', name: 'Jane Doe', role: 'User' },
                ],
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('What people say')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Real feedback from users.')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText(/This product is great/)).toBeInTheDocument()
    })
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  test('renders pricing block with heading and subheading', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'pricing',
              payload: {
                heading: 'Simple pricing',
                subheading: 'Choose your plan.',
                plans: [
                  { name: 'Pro', price: '$29', period: '/mo', features: ['Feature A'], cta: { label: 'Start', href: '/signup' }, highlighted: true },
                ],
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('Simple pricing')).toBeInTheDocument()
    })
    expect(screen.getByText('Choose your plan.')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText(/\$29/)).toBeInTheDocument()
  })

  test('renders FAQ block with heading and subheading', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'faq',
              payload: {
                heading: 'FAQ',
                subheading: 'Common questions.',
                items: [
                  { question: 'What is this?', answer: 'An answer here.' },
                ],
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('FAQ')).toBeInTheDocument()
    })
    expect(screen.getByText('Common questions.')).toBeInTheDocument()
    expect(screen.getByText('What is this?')).toBeInTheDocument()
    expect(screen.getByText('An answer here.')).toBeInTheDocument()
  })

  test('renders stats block with showDividers', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'stats',
              payload: {
                stats: [
                  { value: '10k+', label: 'Users' },
                  { value: '99%', label: 'Uptime' },
                ],
                showDividers: true,
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('10k+')).toBeInTheDocument()
    })
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('99%')).toBeInTheDocument()
    expect(screen.getByText('Uptime')).toBeInTheDocument()
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

  test('renders form block with EmbeddedFormBlock', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          page: {
            _id: 'page-1',
            slug: 'landing',
            title: 'Landing',
            status: 'published',
            blocks: [{ type: 'form', payload: { formId: 'form-123' } }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          feedbackForm: {
            title: 'Embedded Form',
            kind: 'form',
            fields: [{ name: 'q1', label: 'Question', type: 'text', required: false }],
            thankYouHeadline: 'Thanks',
            thankYouMessage: 'Done.',
          },
        },
      })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('Embedded Form')).toBeInTheDocument()
    })
  })

  test('renders hero block with image media', async () => {
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
                headline: 'Hero',
                subheadline: 'Sub',
                mediaType: 'image',
                imageUrl: 'https://example.com/hero.jpg',
                imageAlt: 'Hero image',
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hero/i })).toBeInTheDocument()
    })
    const img = screen.getByAltText('Hero image')
    expect(img).toHaveAttribute('src', expect.stringContaining('hero.jpg'))
  })

  test('renders hero block with icon media', async () => {
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
                headline: 'Hero',
                subheadline: 'Sub',
                mediaType: 'icon',
                icon: 'sparkles',
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hero/i })).toBeInTheDocument()
    })
  })

  test('renders hero block with primary and secondary CTAs', async () => {
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
                headline: 'Hero',
                subheadline: 'Sub',
                primaryCta: { label: 'Sign up', href: '/signup' },
                secondaryCta: { label: 'Learn more', href: '/about' },
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Sign up/i })).toHaveAttribute('href', '/signup')
      expect(screen.getByRole('link', { name: /Learn more/i })).toHaveAttribute('href', '/about')
    })
  })

  test('renders feature_grid block with 2 columns', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'feature_grid',
              payload: {
                columns: 2,
                items: [
                  { icon: 'file-text', title: 'Item 1', description: 'Desc 1' },
                  { icon: 'share2', title: 'Item 2', description: 'Desc 2' },
                ],
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Desc 1')).toBeInTheDocument()
      expect(screen.getByText('Desc 2')).toBeInTheDocument()
    })
  })

  test('renders image block with caption', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'image',
              payload: {
                imageUrl: 'https://example.com/pic.jpg',
                alt: 'Photo',
                caption: 'A nice photo.',
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByAltText('Photo')).toBeInTheDocument()
    })
    expect(screen.getByText('A nice photo.')).toBeInTheDocument()
  })

  test('renders image block without caption', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            {
              type: 'image',
              payload: {
                imageUrl: 'https://example.com/pic.jpg',
                alt: 'Decorative',
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByAltText('Decorative')).toBeInTheDocument()
    })
    const figure = screen.getByRole('figure')
    expect(figure.querySelector('figcaption')).toBeNull()
  })

  test('does not render feature_card block when title and description are empty', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        page: {
          _id: 'page-1',
          slug: 'landing',
          title: 'Landing',
          status: 'published',
          blocks: [
            { type: 'heading', payload: { level: 1, text: 'Section' } },
            {
              type: 'feature_card',
              payload: { title: '', description: '', icon: 'file-text' },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Section', level: 1 })).toBeInTheDocument()
    })
    expect(screen.queryByText('Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Description')).not.toBeInTheDocument()
  })

  test('renders feature_card block with custom icon', async () => {
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
              payload: {
                title: 'Share feature',
                description: 'Share with others',
                icon: 'share2',
              },
            },
          ],
        },
      },
    })

    renderPublicPageView()

    await waitFor(() => {
      expect(screen.getByText('Share feature')).toBeInTheDocument()
      expect(screen.getByText('Share with others')).toBeInTheDocument()
    })
  })
})
