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

  test('passing error to short_text highlights the input and shows message', () => {
    render(
      <FormFieldRenderer
        field={{
          name: 'comment',
          label: 'Comment',
          type: 'short_text',
          required: true,
        }}
        value=""
        onChange={() => {}}
        error="Comment is required."
      />,
    )
    const input = screen.getByRole('textbox', { name: /Comment/i })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Comment is required.')).toBeInTheDocument()
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
  test('name field shows anonymous checkbox and disables input when checked', () => {
    const onChange = jest.fn()
    const onAnonymousChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'name', label: 'Name', type: 'name', required: true }}
        value="John"
        onChange={onChange}
        isAnonymous={false}
        onAnonymousChange={onAnonymousChange}
      />,
    )
    const input = screen.getByRole('textbox', { name: /Name/i })
    expect(input).not.toBeDisabled()
    expect(input).toHaveValue('John')
    const anonCheckbox = screen.getByRole('checkbox', { name: /Submit anonymously/i })
    expect(anonCheckbox).not.toBeChecked()
    fireEvent.click(anonCheckbox)
    expect(onAnonymousChange).toHaveBeenCalledWith(true)
    expect(onChange).toHaveBeenCalledWith('name', '')
  })

  test('name field is disabled and shows placeholder when isAnonymous is true', () => {
    render(
      <FormFieldRenderer
        field={{ name: 'name', label: 'Name', type: 'name', required: true }}
        value=""
        onChange={jest.fn()}
        isAnonymous={true}
        onAnonymousChange={jest.fn()}
      />,
    )
    const input = screen.getByRole('textbox', { name: /Name/i })
    expect(input).toBeDisabled()
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('placeholder', 'Anonymous submission (name hidden)')
    expect(screen.getByRole('checkbox', { name: /Submit anonymously/i })).toBeChecked()
  })

  test('field with name="name" also shows anonymous checkbox', () => {
    render(
      <FormFieldRenderer
        field={{ name: 'name', label: 'Your Name', type: 'short_text', required: false }}
        value=""
        onChange={jest.fn()}
        isAnonymous={false}
        onAnonymousChange={jest.fn()}
      />,
    )
    expect(screen.getByRole('checkbox', { name: /Submit anonymously/i })).toBeInTheDocument()
  })

  test('unchecking anonymous re-enables name field', () => {
    const onAnonymousChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'name', label: 'Name', type: 'name', required: true }}
        value=""
        onChange={jest.fn()}
        isAnonymous={true}
        onAnonymousChange={onAnonymousChange}
      />,
    )
    const anonCheckbox = screen.getByRole('checkbox', { name: /Submit anonymously/i })
    fireEvent.click(anonCheckbox)
    expect(onAnonymousChange).toHaveBeenCalledWith(false)
  })
})


