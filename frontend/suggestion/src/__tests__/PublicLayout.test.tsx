import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import PublicLayout from '../components/layout/PublicLayout'

function renderLayout(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('PublicLayout', () => {
  test('renders children', () => {
    renderLayout(
      <PublicLayout>
        <span data-testid="child">Main content</span>
      </PublicLayout>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  test('applies mainClassName to main element', () => {
    const { container } = renderLayout(
      <PublicLayout mainClassName="custom-main">
        <span>Content</span>
      </PublicLayout>,
    )
    const main = container.querySelector('main')
    expect(main).toHaveClass('custom-main')
  })

  test('renders SiteHeader and SiteFooter', () => {
    renderLayout(
      <PublicLayout>
        <span>Content</span>
      </PublicLayout>,
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
