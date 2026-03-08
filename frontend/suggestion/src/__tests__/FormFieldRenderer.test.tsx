import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  FormFieldRenderer,
  isStarRatingOptions,
  StarRatingField,
  FieldWrapper,
  ShortTextField,
  BigTextField,
  CheckboxField,
  RadioField,
  ImageUploadField,
} from '../components/forms'

describe('isStarRatingOptions', () => {
  test('returns true for 5 options matching star pattern', () => {
    const options = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']
    expect(isStarRatingOptions(options)).toBe(true)
  })

  test('returns false for fewer than 5 options', () => {
    expect(isStarRatingOptions(['★ 1 Star', '★★ 2 Stars'])).toBe(false)
  })

  test('returns false for 5 options not matching pattern', () => {
    expect(isStarRatingOptions(['Good', 'Bad', 'Okay', 'Great', 'Poor'])).toBe(false)
  })
})

test('StarRatingField is exported and renderable', () => {
  const onChange = jest.fn()
  const options = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']
  render(
    <StarRatingField
      id="rate"
      name="rating"
      label="Rating"
      value=""
      options={options}
      onChange={onChange}
    />,
  )
  expect(screen.getByRole('group', { name: /rating/i })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /2 stars/i }))
  expect(onChange).toHaveBeenCalledWith('★★ 2 Stars')
})

test('field-type components are exported from index', () => {
  expect(FieldWrapper).toBeDefined()
  expect(ShortTextField).toBeDefined()
  expect(BigTextField).toBeDefined()
  expect(CheckboxField).toBeDefined()
  expect(RadioField).toBeDefined()
  expect(ImageUploadField).toBeDefined()
})

describe('FormFieldRenderer', () => {
  test('renders short_text as Input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'email',
          label: 'Email',
          type: 'short_text',
          required: true,
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    expect(onChange).toHaveBeenCalledWith('email', 'a@b.com')
  })

  test('renders big_text as Textarea', () => {
    render(
      <FormFieldRenderer
        field={{ name: 'bio', label: 'Bio', type: 'big_text', required: false }}
        value=""
        onChange={() => {}}
      />,
    )
    expect(screen.getByText('Bio')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4')
  })

  test('renders checkbox options', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'opts',
          label: 'Options',
          type: 'checkbox',
          required: false,
          options: ['A', 'B'],
        }}
        value={[]}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Options')).toBeInTheDocument()
    const checkA = screen.getByRole('checkbox', { name: 'A' })
    fireEvent.click(checkA)
    expect(onChange).toHaveBeenCalledWith('opts', ['A'])
  })

  test('renders radio options', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'choice',
          label: 'Choice',
          type: 'radio',
          required: true,
          options: ['X', 'Y'],
        }}
        value=""
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: 'Y' }))
    expect(onChange).toHaveBeenCalledWith('choice', 'Y')
  })
})
