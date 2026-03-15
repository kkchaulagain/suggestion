import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TestimonialSection from '../components/landing/TestimonialSection'

const defaultTestimonials = [
  { quote: 'Quote 1', name: 'Alice' },
  { quote: 'Quote 2', name: 'Bob' },
]

describe('TestimonialSection', () => {
  test('returns null when testimonials is empty', () => {
    const { container } = render(<TestimonialSection testimonials={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders grid of testimonials by default', () => {
    render(<TestimonialSection testimonials={defaultTestimonials} />)
    expect(screen.getByText(/Quote 1/)).toBeInTheDocument()
    expect(screen.getByText(/Quote 2/)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  test('renders heading and subheading when provided', () => {
    render(
      <TestimonialSection
        testimonials={defaultTestimonials}
        heading="Testimonials"
        subheading="What people say"
      />,
    )
    expect(screen.getByRole('heading', { name: /testimonials/i })).toBeInTheDocument()
    expect(screen.getByText(/what people say/i)).toBeInTheDocument()
  })

  test('layout single shows only first testimonial in max-w-2xl', () => {
    render(
      <TestimonialSection testimonials={defaultTestimonials} layout="single" />,
    )
    expect(screen.getByText(/Quote 1/)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    const narrow = document.querySelector('.mx-auto.max-w-2xl')
    expect(narrow).toBeInTheDocument()
  })

  test('layout grid shows all in grid', () => {
    const { container } = render(
      <TestimonialSection testimonials={defaultTestimonials} layout="grid" />,
    )
    expect(screen.getByText(/Quote 2/)).toBeInTheDocument()
    const grid = container.querySelector('.grid.gap-6')
    expect(grid).toBeInTheDocument()
  })
})
