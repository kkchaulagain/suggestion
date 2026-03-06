import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import QRDisplay from '../components/layout/QRDisplay'

describe('QRDisplay', () => {
  test('renders image and form URL link', () => {
    render(
      <QRDisplay
        imageDataUrl="data:image/png;base64,abc"
        formUrl="https://example.com/form/123"
      />,
    )
    const img = screen.getByRole('img', { name: /QR code/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc')
    const link = screen.getByRole('link', { name: 'https://example.com/form/123' })
    expect(link).toHaveAttribute('href', 'https://example.com/form/123')
  })

  test('uses title for image alt when provided', () => {
    render(
      <QRDisplay
        imageDataUrl="data:image/png;base64,x"
        formUrl="https://x.com"
        title="My Form"
      />,
    )
    expect(screen.getByAltText('QR for My Form')).toBeInTheDocument()
  })
})
