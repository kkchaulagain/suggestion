import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import SiteFooter from '../components/layout/SiteFooter'

describe('SiteFooter', () => {
  test('renders footer with current year and default branding', () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>,
    )
    const year = new Date().getFullYear()
    expect(screen.getByRole('contentinfo')).toHaveTextContent(String(year))
  })

  test('renders footer links when provided', () => {
    const links = [
      { label: 'About', href: '/about' },
      { label: 'Privacy', href: '/privacy' },
    ]
    render(
      <MemoryRouter>
        <SiteFooter links={links} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  })

  test('renders siteName override', () => {
    render(
      <MemoryRouter>
        <SiteFooter siteName="My Site" />
      </MemoryRouter>,
    )
    expect(screen.getByText(/My Site/)).toBeInTheDocument()
  })

  test('renders tagline when provided', () => {
    render(
      <MemoryRouter>
        <SiteFooter tagline="Built for teams" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Built for teams')).toBeInTheDocument()
  })

  test('renders logo when logoUrl provided', () => {
    const { container } = render(
      <MemoryRouter>
        <SiteFooter logoUrl="https://example.com/logo.png" />
      </MemoryRouter>,
    )
    const img = container.querySelector('img[src="https://example.com/logo.png"]')
    expect(img).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <MemoryRouter>
        <SiteFooter className="footer-extra" />
      </MemoryRouter>,
    )
    expect(container.querySelector('footer')).toHaveClass('footer-extra')
  })
})
