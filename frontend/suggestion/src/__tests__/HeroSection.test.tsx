import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import HeroSection from '../components/landing/HeroSection'

function renderHero(props: Parameters<typeof HeroSection>[0]) {
  return render(
    <MemoryRouter>
      <HeroSection {...props} />
    </MemoryRouter>,
  )
}

describe('HeroSection', () => {
  const defaultProps = {
    headline: 'Test Headline',
    subheadline: 'Test subheadline text.',
  }

  test('renders headline and subheadline', () => {
    renderHero(defaultProps)
    expect(screen.getByRole('heading', { name: /test headline/i })).toBeInTheDocument()
    expect(screen.getByText(/test subheadline text/i)).toBeInTheDocument()
  })

  test('renders with variant splitReversed without error', () => {
    renderHero({
      ...defaultProps,
      variant: 'splitReversed',
      media: <span data-testid="media">Media</span>,
    })
    expect(screen.getByRole('heading', { name: /test headline/i })).toBeInTheDocument()
    expect(screen.getByTestId('media')).toBeInTheDocument()
  })

  test('renders with variant centeredWithMediaBelow without error', () => {
    renderHero({
      ...defaultProps,
      variant: 'centeredWithMediaBelow',
      media: <span data-testid="media-below">Media below</span>,
    })
    expect(screen.getByRole('heading', { name: /test headline/i })).toBeInTheDocument()
    expect(screen.getByTestId('media-below')).toBeInTheDocument()
  })

  test('renders with style minimal', () => {
    renderHero({ ...defaultProps, style: 'minimal' })
    expect(screen.getByRole('heading', { name: /test headline/i })).toBeInTheDocument()
  })

  test('renders when style is dark (backwards compat: treated as default)', () => {
    // Legacy CMS content may have saved style 'dark'; component maps it to default
    renderHero({ ...defaultProps, style: 'dark' } as ComponentProps<typeof HeroSection>)
    expect(screen.getByRole('heading', { name: /test headline/i })).toBeInTheDocument()
  })
})
