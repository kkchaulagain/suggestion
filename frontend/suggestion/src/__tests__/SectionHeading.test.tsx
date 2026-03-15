import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SectionHeading from '../components/landing/SectionHeading'

describe('SectionHeading', () => {
  test('renders title', () => {
    render(<SectionHeading title="Our Features" />)
    expect(screen.getByRole('heading', { name: 'Our Features' })).toBeInTheDocument()
  })

  test('renders subtitle when provided', () => {
    render(<SectionHeading title="Features" subtitle="What we offer" />)
    expect(screen.getByText('What we offer')).toBeInTheDocument()
  })

  test('does not render subtitle when omitted', () => {
    render(<SectionHeading title="Title" />)
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.queryByText('What we offer')).not.toBeInTheDocument()
  })

  test('align center applies text-center', () => {
    const { container } = render(<SectionHeading title="Title" align="center" />)
    expect(container.querySelector('.text-center')).toBeInTheDocument()
  })

  test('align left applies text-left', () => {
    const { container } = render(<SectionHeading title="Title" align="left" />)
    expect(container.querySelector('.text-left')).toBeInTheDocument()
  })
})
