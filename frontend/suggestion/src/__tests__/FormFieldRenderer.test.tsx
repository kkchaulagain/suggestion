import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  FormFieldRenderer,
  isStarRatingOptions,
  StarRatingField,
  Scale1To10Field,
  ScaleChipsField,
  FieldWrapper,
  ShortTextField,
  BigTextField,
  CheckboxField,
  RadioField,
  ImageUploadField,
  NameField,
  EmailField,
  PhoneField,
  DateField,
  TimeField,
  NumberField,
  UrlField,
  DropdownField,
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
  expect(ScaleChipsField).toBeDefined()
  expect(ImageUploadField).toBeDefined()
  expect(NameField).toBeDefined()
  expect(EmailField).toBeDefined()
  expect(PhoneField).toBeDefined()
  expect(DateField).toBeDefined()
  expect(TimeField).toBeDefined()
  expect(NumberField).toBeDefined()
  expect(UrlField).toBeDefined()
  expect(DropdownField).toBeDefined()
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

  test('renders scale with value in floater under thumb', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'score',
          label: 'Score (1-10)',
          type: 'scale',
          required: true,
        }}
        value="7"
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Score (1-10)')).toBeInTheDocument()
    expect(screen.getByText('Somewhat agree')).toBeInTheDocument()
    const slider = screen.getByRole('slider', { name: /score/i })
    expect(slider).toHaveAttribute('aria-valuenow', '7')
    fireEvent.change(slider, { target: { value: '3' } })
    expect(onChange).toHaveBeenCalledWith('score', '3')
  })

  test('renders scale as emoji chips when formKind is poll', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'satisfaction', label: 'How satisfied?', type: 'scale', required: true }}
        value=""
        onChange={onChange}
        formKind="poll"
      />,
    )
    expect(screen.getByText(/How satisfied?/i)).toBeInTheDocument()
    const neutralButton = screen.getByRole('button', { name: /Neutral/i })
    expect(neutralButton).toBeInTheDocument()
    fireEvent.click(neutralButton)
    expect(onChange).toHaveBeenCalledWith('satisfaction', '6')
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

  test('renders phone field as tel input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'phone', label: 'Phone', type: 'phone', required: false }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Phone')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: /phone/i })
    expect(input).toHaveAttribute('type', 'tel')
    fireEvent.change(input, { target: { value: '+15551234567' } })
    expect(onChange).toHaveBeenCalledWith('phone', '+15551234567')
  })

  test('renders date field as date input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'dob', label: 'Date of birth', type: 'date', required: false }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Date of birth')).toBeInTheDocument()
    const input = screen.getByLabelText(/date of birth/i)
    expect(input).toHaveAttribute('type', 'date')
    fireEvent.change(input, { target: { value: '2025-01-15' } })
    expect(onChange).toHaveBeenCalledWith('dob', '2025-01-15')
  })

  test('renders time field as time input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'preferredTime', label: 'Preferred time', type: 'time', required: false }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Preferred time')).toBeInTheDocument()
    const input = screen.getByLabelText(/preferred time/i)
    expect(input).toHaveAttribute('type', 'time')
    fireEvent.change(input, { target: { value: '14:30' } })
    expect(onChange).toHaveBeenCalledWith('preferredTime', '14:30')
  })

  test('renders number field as number input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'quantity', label: 'Quantity', type: 'number', required: false }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Quantity')).toBeInTheDocument()
    const input = screen.getByLabelText(/quantity/i)
    expect(input).toHaveAttribute('type', 'number')
    fireEvent.change(input, { target: { value: '42' } })
    expect(onChange).toHaveBeenCalledWith('quantity', '42')
  })

  test('renders url field as url input', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{ name: 'website', label: 'Website', type: 'url', required: false }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Website')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: /website/i })
    expect(input).toHaveAttribute('type', 'url')
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    expect(onChange).toHaveBeenCalledWith('website', 'https://example.com')
  })

  test('renders dropdown field as select with options', () => {
    const onChange = jest.fn()
    render(
      <FormFieldRenderer
        field={{
          name: 'source',
          label: 'Source',
          type: 'dropdown',
          required: true,
          options: ['Web', 'App', 'Other'],
        }}
        value=""
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Source')).toBeInTheDocument()
    const select = screen.getByRole('combobox', { name: /source/i })
    fireEvent.change(select, { target: { value: 'App' } })
    expect(onChange).toHaveBeenCalledWith('source', 'App')
  })
})

test('Scale1To10Field is exported and renderable as slider', () => {
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
  expect(screen.getByText('Neutral')).toBeInTheDocument()
  const slider = screen.getByRole('slider', { name: /score/i })
  expect(slider).toHaveAttribute('aria-valuenow', '5')
  fireEvent.change(slider, { target: { value: '8' } })
  expect(onChange).toHaveBeenCalledWith('8')
})

test('Scale1To10Field slider responds to keyboard (Arrow and End)', () => {
  const onChange = jest.fn()
  render(
    <Scale1To10Field
      id="score"
      name="score"
      label="Score"
      value="1"
      onChange={onChange}
    />,
  )
  const slider = screen.getByRole('slider', { name: /score/i })
  slider.focus()
  fireEvent.keyDown(slider, { key: 'ArrowRight' })
  expect(onChange).toHaveBeenCalledWith('2')
  onChange.mockClear()
  fireEvent.keyDown(slider, { key: 'End' })
  expect(onChange).toHaveBeenCalledWith('10')
})

test('Scale1To10Field slider responds to Home and ArrowLeft', () => {
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
  const slider = screen.getByRole('slider', { name: /score/i })
  slider.focus()
  fireEvent.keyDown(slider, { key: 'Home' })
  expect(onChange).toHaveBeenCalledWith('1')
  onChange.mockClear()
  fireEvent.keyDown(slider, { key: 'ArrowLeft' })
  expect(onChange).toHaveBeenCalledWith('4')
})
