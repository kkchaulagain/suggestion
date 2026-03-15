import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SectionWrapper from '../components/landing/SectionWrapper'

describe('SectionWrapper', () => {
  test('renders children', () => {
    render(
      <SectionWrapper>
        <span data-testid="child">Content</span>
      </SectionWrapper>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  test('applies id when provided', () => {
    const { container } = render(
      <SectionWrapper id="pricing">
        <span>Content</span>
      </SectionWrapper>,
    )
    const section = container.querySelector('section#pricing')
    expect(section).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <SectionWrapper className="custom-class">
        <span>Content</span>
      </SectionWrapper>,
    )
    const section = container.querySelector('section')
    expect(section).toHaveClass('custom-class')
  })

  test('background default has no extra bg class', () => {
    const { container } = render(
      <SectionWrapper background="default">
        <span>Content</span>
      </SectionWrapper>,
    )
    const section = container.querySelector('section')
    expect(section?.className).not.toMatch(/bg-stone-100|bg-emerald/)
  })

  test('background muted applies muted classes', () => {
    const { container } = render(
      <SectionWrapper background="muted">
        <span>Content</span>
      </SectionWrapper>,
    )
    const section = container.querySelector('section')
    expect(section).toHaveClass('bg-stone-100/80')
  })

  test('background accent applies accent classes', () => {
    const { container } = render(
      <SectionWrapper background="accent">
        <span>Content</span>
      </SectionWrapper>,
    )
    const section = container.querySelector('section')
    expect(section).toHaveClass('bg-emerald-50/50')
  })
})
