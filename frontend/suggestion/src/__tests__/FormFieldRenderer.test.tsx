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
  NameField,
  EmailField,
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
  expect(NameField).toBeDefined()
  expect(EmailField).toBeDefined()
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

  test('renders name field with text input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'fullName',
          label: 'Your Name',
          type: 'name',
          required: false,
          placeholder: 'Enter your name',
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Your Name')).toBeInTheDocument()
    const input = screen.getByPlaceholderText('Enter your name')
    fireEvent.change(input, { target: { value: 'John' } })
    expect(onChange).toHaveBeenCalledWith('fullName', 'John')
  })

  test('renders name field with anonymous checkbox when allowAnonymous is true', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'fullName',
          label: 'Your Name',
          type: 'name',
          required: false,
          allowAnonymous: true,
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Your Name')).toBeInTheDocument()
    expect(screen.getByLabelText(/submit anonymously/i)).toBeInTheDocument()
  })

  test('does not show anonymous checkbox when allowAnonymous is false', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'fullName',
          label: 'Your Name',
          type: 'name',
          required: true,
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.queryByLabelText(/submit anonymously/i)).not.toBeInTheDocument()
  })

  test('renders email field as email input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'userEmail',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'you@example.com',
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Email Address')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('placeholder', 'you@example.com')
    fireEvent.change(input, { target: { value: 'alice@example.com' } })
    expect(onChange).toHaveBeenCalledWith('userEmail', 'alice@example.com')
  })

  test('passing error to email field highlights the input and shows message', () => {
    render(
      <FormFieldRenderer
        field={{
          name: 'userEmail',
          label: 'Email Address',
          type: 'email',
          required: true,
        }}
        value=""
        onChange={() => {}}
        error="Invalid email address"
      />,
    )
    const input = screen.getByRole('textbox', { name: /Email Address/i })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
  })
})
