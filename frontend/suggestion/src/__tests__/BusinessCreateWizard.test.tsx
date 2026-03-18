import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import BusinessCreateWizard from '../pages/business-dashboard/components/BusinessCreateWizard'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const authConfig = { withCredentials: true, headers: { Authorization: 'Bearer t' } }

function renderWizard() {
  const onCancel = jest.fn()
  const onSuccess = jest.fn()
  render(<BusinessCreateWizard authConfig={authConfig} onCancel={onCancel} onSuccess={onSuccess} />)
  return { onCancel, onSuccess }
}

function fillStoryAndReview() {
  fireEvent.change(screen.getByLabelText(/Business name/i), { target: { value: 'Acme' } })
  fireEvent.click(screen.getByRole('button', { name: /Next/i }))
  fireEvent.click(screen.getByRole('button', { name: /Next/i }))
  fireEvent.click(screen.getByRole('button', { name: /Next/i }))
  fireEvent.change(document.getElementById('create-description')!, { target: { value: 'About us' } })
  fireEvent.click(screen.getByRole('button', { name: /Review/i }))
}

describe('BusinessCreateWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.post.mockReset()
  })

  test('Next with invalid step shows step error', () => {
    renderWizard()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    expect(screen.getByText(/Business name is required/i)).toBeInTheDocument()
  })

  test('successful create calls onSuccess', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { ok: true } })
    const { onSuccess } = renderWizard()
    fillStoryAndReview()
    await waitFor(() => expect(screen.getByText(/Acme/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Create business/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  test('Back from step 2 goes to previous step', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText(/Business name/i), { target: { value: 'X' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    expect(screen.getByText(/Location & registration/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Back/i }))
    expect(screen.getByText(/Business identity/i)).toBeInTheDocument()
  })

  test('Cancel on step 0 calls onCancel', () => {
    const { onCancel } = renderWizard()
    fireEvent.click(screen.getByTestId('wizard-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  test('Create API error shows server message then fallback', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({ response: { data: { message: 'Server said no' } } })
      .mockRejectedValueOnce(new Error('network'))

    renderWizard()
    fillStoryAndReview()
    await waitFor(() => expect(screen.getByText(/Acme/i)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Create business/i }))
    expect(await screen.findByText(/Server said no/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Create business/i }))
    expect(await screen.findByText(/Could not create business/i)).toBeInTheDocument()
  })

  test('Type select onChange runs', () => {
    renderWizard()
    const typeSelect = document.getElementById('create-type') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'personal' } })
    expect(typeSelect.value).toBe('personal')
  })

  test('review shows custom fields Extra and Edit returns to story step', async () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText(/Business name/i), { target: { value: 'Co' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.change(screen.getByLabelText(/Public email/i), { target: { value: 'a@b.co' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.change(document.getElementById('create-description')!, { target: { value: 'D' } })
    fireEvent.click(screen.getByRole('button', { name: /Review/i }))

    await waitFor(() => {
      expect(screen.getByText(/^Extra$/i)).toBeInTheDocument()
      expect(screen.getByText(/contactEmail:/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    expect(document.getElementById('create-description')).toBeInTheDocument()
  })
})
