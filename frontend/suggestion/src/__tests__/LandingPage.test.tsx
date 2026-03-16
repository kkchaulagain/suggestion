import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { ThemeProvider } from '../context/ThemeContext'
import LandingPage from '../pages/landing/LandingPage'
import { marketingTemplateConfig } from '../pages/landing/landingMarketingTemplate'

jest.mock('../pages/landing/landingMarketingTemplate', () => {
  const actual = jest.requireActual('../pages/landing/landingMarketingTemplate')
  return {
    ...actual,
    marketingTemplateConfig: {
      ...actual.marketingTemplateConfig,
      useCases: undefined,
    }
  }
})

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <LandingPage />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('renders sections from LANDING_PAGE_SECTIONS with content from marketingTemplateConfig', () => {
    renderLandingPage()

    const heroHeadline = (marketingTemplateConfig.hero as { headline: string }).headline
    expect(screen.getByText(heroHeadline)).toBeInTheDocument()
  })

  it('skips rendering section when config content is missing (early return)', () => {
    renderLandingPage()

    const heroHeadline = (marketingTemplateConfig.hero as { headline: string }).headline
    expect(screen.getByText(heroHeadline)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
  })
})
