import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  FormFieldRenderer,
  isStarRatingOptions,
  StarRatingField,
  Scale1To10Field,
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
  expect(StarRatingField).toBeDefined()
  expect(Scale1To10Field).toBeDefined()
  expect(ImageUploadField).toBeDefined()
  expect(NameField).toBeDefined()
  expect(EmailField).toBeDefined()
})

describe('FormFieldRenderer', () => {
  test('renders text as Input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'email',
          label: 'Email',
          type: 'text',
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

  test('passing error to text highlights the input and shows message', () => {
    render(
      <FormFieldRenderer
        field={{
          name: 'comment',
          label: 'Comment',
          type: 'text',
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

  test('renders textarea as Textarea', () => {
    render(
      <FormFieldRenderer
        field={{ name: 'bio', label: 'Bio', type: 'textarea', required: false }}
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

  test('renders scale as Scale1To10Field', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'score',
          label: 'Score (1-10)',
          type: 'scale',
          required: true,
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Score (1-10)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /7 out of 10/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /7 out of 10/i }))
    expect(onChange).toHaveBeenCalledWith('score', '7')
  })

  test('renders rating type as StarRatingField', () => {
    const onChange = jest.fn()
    const options = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']
    render(
      <FormFieldRenderer
        field={{
          name: 'stars',
          label: 'Rate us',
          type: 'rating',
          required: true,
          options,
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Rate us')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /3 stars/i }))
    expect(onChange).toHaveBeenCalledWith('stars', '★★★ 3 Stars')
  })
})

test('Scale1To10Field is exported and renderable', () => {
  const onChange = jest.fn()
  render(
    <Scale1To10Field
      id="score"
      name="score"
      label="Score"
      value="5"
      onChange={onChange}
    />,
  )
  expect(screen.getByRole('group', { name: /score/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /5 out of 10/i })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: /8 out of 10/i }))
  expect(onChange).toHaveBeenCalledWith('8')
})

test('Scale1To10Field triggers onChange on Enter and Space key', () => {
  const onChange = jest.fn()
  render(
    <Scale1To10Field
      id="score"
      name="score"
      label="Score"
      value=""
      onChange={onChange}
    />,
  )
  const button7 = screen.getByRole('button', { name: /7 out of 10/i })
  button7.focus()
  fireEvent.keyDown(button7, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledWith('7')
  onChange.mockClear()
  fireEvent.keyDown(button7, { key: ' ' })
  expect(onChange).toHaveBeenCalledWith('7')
})
