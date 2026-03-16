import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import SiteHeader from '../components/layout/SiteHeader'

function renderHeader(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('SiteHeader', () => {
  test('renders brand link with default brand name', () => {
    renderHeader(<SiteHeader />)
    const brand = screen.getByRole('link', { name: 'Suggestion' })
    expect(brand).toHaveAttribute('href', '/')
  })

  test('renders custom logoHref and brandName', () => {
    renderHeader(<SiteHeader logoHref="/home" brandName="MyBrand" />)
    expect(screen.getByRole('link', { name: 'MyBrand' })).toHaveAttribute('href', '/home')
  })

  test('shows Log in and Get started when showAuthButtons true', () => {
    renderHeader(<SiteHeader showAuthButtons={true} />)
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/signup')
  })

  test('hides auth buttons when showAuthButtons false', () => {
    renderHeader(<SiteHeader showAuthButtons={false} />)
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument()
  })

  test('renders nav items when provided', () => {
    const navItems = [
      { label: 'Product', href: '/product' },
      { label: 'Pricing', href: '/pricing' },
    ]
    renderHeader(<SiteHeader navItems={navItems} />)
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Product' })).toHaveAttribute('href', '/product')
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing')
  })

  test('applies custom className', () => {
    const { container } = renderHeader(<SiteHeader className="header-extra" />)
    expect(container.querySelector('header')).toHaveClass('header-extra')
  })
})
