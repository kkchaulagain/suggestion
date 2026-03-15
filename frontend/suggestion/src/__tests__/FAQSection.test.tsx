import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import FAQSection from '../components/landing/FAQSection'

describe('FAQSection', () => {
  test('returns null when items is empty', () => {
    const { container } = render(<FAQSection items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders accordion with FAQ items', () => {
    const items = [
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'A2' },
    ]
    render(<FAQSection items={items} />)
    expect(screen.getByText('Q1?')).toBeInTheDocument()
    expect(screen.getByText('Q2?')).toBeInTheDocument()
    // First item is open by default so its answer is visible
    expect(screen.getByText('A1')).toBeInTheDocument()
  })

  test('renders heading and subheading when provided', () => {
    render(
      <FAQSection
        items={[{ question: 'Q?', answer: 'A' }]}
        heading="FAQ"
        subheading="Common questions"
      />,
    )
    expect(screen.getByRole('heading', { name: /faq/i })).toBeInTheDocument()
    expect(screen.getByText(/common questions/i)).toBeInTheDocument()
  })

  test('renders without heading/subheading when not provided', () => {
    render(<FAQSection items={[{ question: 'Q?', answer: 'A' }]} />)
    expect(screen.getByText('Q?')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})
